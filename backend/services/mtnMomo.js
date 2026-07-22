const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// ============================================================
// MTN Mobile Money API Configuration
// ============================================================
// Supports both Sandbox and Production environments
// Set MTN_ENVIRONMENT=production in .env to switch to live payments
// ============================================================

const isProduction = process.env.MTN_ENVIRONMENT === 'production';

// Token endpoint (same for both environments)
const MTN_TOKEN_URL = isProduction
    ? 'https://oauth.mtn.com/v1/oauth/access_token'
    : 'https://api.mtn.com/v1/oauth/access_token';

// Base URL for collection/disbursement APIs
const MTN_BASE_URL = isProduction
    ? 'https://openapi.mtn.com'  // Production
    : 'https://sandbox.momodeveloper.mtn.com'; // Sandbox

const CONSUMER_KEY = process.env.MOMO_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MOMO_CONSUMER_SECRET;
const SUBSCRIPTION_KEY = process.env.MTN_SUBSCRIPTION_KEY;
const CALLBACK_URL = process.env.MTN_CALLBACK_URL || `https://gentsconcerts-backend.onrender.com/api/payments/callback`;
const TARGET_ENVIRONMENT = isProduction ? 'production' : 'sandbox';

// Token cache to avoid fetching a new token for every request
let accessTokenCache = { token: null, expiresAt: 0 };

const mtnMomo = {
    /**
     * Get OAuth 2.0 access token (with caching)
     */
    getAccessToken: async () => {
        try {
            // Return cached token if still valid (with 30s buffer)
            if (accessTokenCache.token && accessTokenCache.expiresAt > Date.now() + 30000) {
                return accessTokenCache.token;
            }

            const params = new URLSearchParams();
            params.append("grant_type", "client_credentials");
            params.append("client_id", CONSUMER_KEY);
            params.append("client_secret", CONSUMER_SECRET);

            const response = await axios.post(MTN_TOKEN_URL, params, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            // Cache the token (expires in 3600s per MTN docs)
            accessTokenCache = {
                token: response.data.access_token,
                expiresAt: Date.now() + (response.data.expires_in || 3600) * 1000
            };

            return accessTokenCache.token;
        } catch (error) {
            console.error("[MTN MoMo] Error getting access token:", error.response?.data || error.message);
            throw new Error('Failed to authenticate with MTN Mobile Money');
        }
    },

    /**
     * Create an API user and generate API key (one-time setup for production)
     * This is used during initial setup, not during normal operations
     */
    createApiUser: async () => {
        try {
            const referenceId = uuidv4();
            const response = await axios.post(
                `${MTN_BASE_URL}/v1_0/apiuser`,
                { providerCallbackHost: CALLBACK_URL },
                {
                    headers: {
                        "X-Reference-Id": referenceId,
                        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
                        "Content-Type": "application/json"
                    }
                }
            );
            return { referenceId, userId: response.data.apiUserId || referenceId };
        } catch (error) {
            console.error("[MTN MoMo] Error creating API user:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Create API key for a given API user (one-time setup)
     */
    createApiKey: async (apiUserId) => {
        try {
            const response = await axios.post(
                `${MTN_BASE_URL}/collection/v1_0/apikey`,
                {},
                {
                    headers: {
                        "X-Reference-Id": uuidv4(),
                        "X-Target-Environment": TARGET_ENVIRONMENT,
                        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error("[MTN MoMo] Error creating API key:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Request Payment from a customer
     * @param {number} amount - Amount in the target currency
     * @param {string} currency - Currency code (e.g., 'USD', 'EUR', 'LRD')
     * @param {string} phoneNumber - Customer's MTN phone number (with country code, e.g., +231770000000)
     * @param {string} externalId - Our internal reference (ticket._id)
     * @param {string} description - Payment description
     * @returns {string} referenceId - MTN reference for tracking
     */
    requestToPay: async (amount, currency, phoneNumber, externalId, description) => {
        const token = await mtnMomo.getAccessToken();
        const referenceId = uuidv4();

        try {
            const response = await axios.post(
                `${MTN_BASE_URL}/collection/v1_0/requesttopay`,
                {
                    amount: amount.toString(),
                    currency: currency,
                    externalId: externalId,
                    payer: {
                        partyIdType: "MSISDN",
                        partyId: phoneNumber
                    },
                    payerMessage: description,
                    payeeNote: "GentsConcerts Ticket Purchase - Liberia's Premier Event Platform"
                },
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Reference-Id": referenceId,
                        "X-Target-Environment": TARGET_ENVIRONMENT,
                        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
                        "Content-Type": "application/json",
                        "X-Callback-Url": CALLBACK_URL
                    }
                }
            );

            console.log(`[MTN MoMo] Payment requested: ${amount} ${currency} to ${phoneNumber}, ref: ${referenceId}`);
            return referenceId;
        } catch (error) {
            console.error("[MTN MoMo] Error requesting to pay:", error.response?.data || error.message);
            const statusCode = error.response?.status;
            const message = error.response?.data?.message || error.message;

            // Return structured error info
            throw {
                statusCode,
                message: `Payment request failed: ${message}`,
                details: error.response?.data
            };
        }
    },

    /**
     * Check payment status by reference ID
     * @param {string} referenceId - The MTN reference ID returned from requestToPay
     * @returns {object} Payment status object
     */
    getPaymentStatus: async (referenceId) => {
        const token = await mtnMomo.getAccessToken();

        try {
            const response = await axios.get(
                `${MTN_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Target-Environment": TARGET_ENVIRONMENT,
                        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error("[MTN MoMo] Error getting payment status:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get account balance (for admin dashboard)
     */
    getBalance: async () => {
        const token = await mtnMomo.getAccessToken();

        try {
            const response = await axios.get(
                `${MTN_BASE_URL}/collection/v1_0/account/balance`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Target-Environment": TARGET_ENVIRONMENT,
                        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error("[MTN MoMo] Error getting balance:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Validate a phone number (check if it's an MTN subscriber)
     */
    validateMsisdn: async (phoneNumber) => {
        const token = await mtnMomo.getAccessToken();

        try {
            const response = await axios.get(
                `${MTN_BASE_URL}/collection/v1_0/accountholder/msisdn/${phoneNumber}/active`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "X-Target-Environment": TARGET_ENVIRONMENT,
                        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error("[MTN MoMo] Error validating MSISDN:", error.response?.data || error.message);
            throw error;
        }
    }
};

module.exports = mtnMomo;
