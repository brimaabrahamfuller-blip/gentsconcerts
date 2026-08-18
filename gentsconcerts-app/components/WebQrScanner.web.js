// Web-only scanner: opens the device camera or image picker and decodes a QR image.
// This avoids persistent preview failures on mobile browsers while preserving a
// real camera path through the capture="environment" input hint.
import { useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function WebQrScanner({ onScan, onError }) {
  const inputRef = useRef(null);
  const [reading, setReading] = useState(false);

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setReading(true);
    try {
      const decodedText = await Html5Qrcode.scanFile(file, true);
      onScan?.(decodedText);
    } catch (error) {
      onError?.(new Error('The QR image could not be read. Take a clearer photo with the full QR code visible, or enter the printed ticket ID manually.'));
    } finally {
      setReading(false);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#050A13', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, boxSizing: 'border-box' }}>
      <input
        ref={inputRef}
        id="gents-qr-image-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImage}
        style={{ display: 'none' }}
      />
      <label htmlFor="gents-qr-image-input" style={{ width: '100%', maxWidth: 320, cursor: reading ? 'wait' : 'pointer', opacity: reading ? 0.65 : 1 }}>
        <div style={{ border: '2px dashed #D8B44B', borderRadius: 18, padding: '34px 20px', textAlign: 'center', color: '#F5F8FC', background: 'rgba(216,180,75,0.09)' }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{reading ? 'Reading QR image…' : 'Use camera or choose QR image'}</div>
          <div style={{ marginTop: 10, color: '#B9C6D5', fontSize: 14, lineHeight: 1.45 }}>Take a clear photo of the ticket QR code, or choose its image from this device.</div>
        </div>
      </label>
    </div>
  );
}
