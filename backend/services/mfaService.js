const crypto = require('crypto');
const QRCode = require('qrcode');
const User = require('../models/User');

const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const RECOVERY_CODE_COUNT = 10;
const MFA_ISSUER = process.env.MFA_ISSUER || 'GentsConcerts';

const getEncryptionKey = () => {
    if (!process.env.MFA_ENCRYPTION_KEY) {
        throw new Error('MFA_ENCRYPTION_KEY is required to use administrator MFA.');
    }
    return crypto.createHash('sha256').update(process.env.MFA_ENCRYPTION_KEY, 'utf8').digest();
};

const base32Encode = (buffer) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    let output = '';
    for (const byte of buffer) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
    return output;
};

const base32Decode = (input) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const normalized = String(input || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
    let bits = 0;
    let value = 0;
    const bytes = [];
    for (const character of normalized) {
        const index = alphabet.indexOf(character);
        if (index < 0) continue;
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 255);
            bits -= 8;
            value &= (1 << bits) - 1;
        }
    }
    return Buffer.from(bytes);
};

const encryptSecret = (secret) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return {
        encrypted: ciphertext.toString('base64'),
        iv: iv.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64')
    };
};

const decryptSecret = ({ encrypted, iv, authTag }) => {
    if (!encrypted || !iv || !authTag) throw new Error('MFA secret is not configured.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    return Buffer.concat([
        decipher.update(Buffer.from(encrypted, 'base64')),
        decipher.final()
    ]).toString('utf8');
};

const timingSafeEqual = (left, right) => {
    const a = Buffer.from(String(left));
    const b = Buffer.from(String(right));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const totpCodeForCounter = (secret, counter) => {
    const key = base32Decode(secret);
    const message = Buffer.alloc(8);
    message.writeBigUInt64BE(BigInt(counter));
    const digest = crypto.createHmac('sha1', key).update(message).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24)
        | ((digest[offset + 1] & 0xff) << 16)
        | ((digest[offset + 2] & 0xff) << 8)
        | (digest[offset + 3] & 0xff);
    return String(binary % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
};

const verifyTotp = (secret, code, now = Date.now()) => {
    const normalized = String(code || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(normalized)) return false;
    const counter = Math.floor(now / 1000 / TOTP_PERIOD_SECONDS);
    for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
        if (timingSafeEqual(totpCodeForCounter(secret, counter + offset), normalized)) return true;
    }
    return false;
};

const hashRecoveryCode = (code) => crypto
    .createHmac('sha256', getEncryptionKey())
    .update(String(code || '').trim().toUpperCase(), 'utf8')
    .digest('hex');

const generateRecoveryCodes = () => Array.from({ length: RECOVERY_CODE_COUNT }, () => {
    const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12)}`;
});

const loadMfaUser = (userId) => User.findById(userId).select(
    '+mfaSecretEncrypted +mfaSecretIv +mfaSecretAuthTag '
    + '+mfaPendingSecretEncrypted +mfaPendingSecretIv +mfaPendingSecretAuthTag '
    + '+mfaRecoveryCodeHashes'
);

const activeSecretFor = (user) => decryptSecret({
    encrypted: user.mfaSecretEncrypted,
    iv: user.mfaSecretIv,
    authTag: user.mfaSecretAuthTag
});

const pendingSecretFor = (user) => decryptSecret({
    encrypted: user.mfaPendingSecretEncrypted,
    iv: user.mfaPendingSecretIv,
    authTag: user.mfaPendingSecretAuthTag
});

const startEnrollment = async (user) => {
    if (user.mfaEnabled) throw new Error('Administrator MFA is already enrolled.');
    const secret = base32Encode(crypto.randomBytes(20));
    const encrypted = encryptSecret(secret);
    user.mfaPendingSecretEncrypted = encrypted.encrypted;
    user.mfaPendingSecretIv = encrypted.iv;
    user.mfaPendingSecretAuthTag = encrypted.authTag;
    await user.save();

    const label = `${MFA_ISSUER}:${user.email}`;
    const provisioningUri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(MFA_ISSUER)}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD_SECONDS}`;
    const qrCodeDataUrl = await QRCode.toDataURL(provisioningUri, { errorCorrectionLevel: 'M' });
    return { provisioningUri, qrCodeDataUrl };
};

const confirmEnrollment = async (user, code) => {
    if (user.mfaEnabled) throw new Error('Administrator MFA is already enrolled.');
    const secret = pendingSecretFor(user);
    if (!verifyTotp(secret, code)) throw new Error('Invalid authenticator code.');
    const recoveryCodes = generateRecoveryCodes();
    const encrypted = encryptSecret(secret);
    user.mfaEnabled = true;
    user.mfaSecretEncrypted = encrypted.encrypted;
    user.mfaSecretIv = encrypted.iv;
    user.mfaSecretAuthTag = encrypted.authTag;
    user.mfaPendingSecretEncrypted = undefined;
    user.mfaPendingSecretIv = undefined;
    user.mfaPendingSecretAuthTag = undefined;
    user.mfaRecoveryCodeHashes = recoveryCodes.map(hashRecoveryCode);
    user.mfaRecoveryCodesGeneratedAt = new Date();
    user.mfaEnrolledAt = new Date();
    await user.save();
    return recoveryCodes;
};

const verifyActiveTotp = (user, code) => verifyTotp(activeSecretFor(user), code);

const rotateRecoveryCodes = async (user, code) => {
    if (!user.mfaEnabled) throw new Error('Administrator MFA is not enrolled.');
    if (!verifyActiveTotp(user, code)) throw new Error('Invalid authenticator code.');
    const recoveryCodes = generateRecoveryCodes();
    user.mfaRecoveryCodeHashes = recoveryCodes.map(hashRecoveryCode);
    user.mfaRecoveryCodesGeneratedAt = new Date();
    await user.save();
    return recoveryCodes;
};

const consumeRecoveryCode = async (userId, code) => {
    const codeHash = hashRecoveryCode(code);
    const result = await User.updateOne(
        { _id: userId, mfaEnabled: true, mfaRecoveryCodeHashes: codeHash },
        { $pull: { mfaRecoveryCodeHashes: codeHash }, $set: { mfaLastUsedAt: new Date() } }
    );
    return result.modifiedCount === 1;
};

module.exports = {
    loadMfaUser,
    startEnrollment,
    confirmEnrollment,
    verifyActiveTotp,
    rotateRecoveryCodes,
    consumeRecoveryCode,
    verifyTotp,
    hashRecoveryCode
};
