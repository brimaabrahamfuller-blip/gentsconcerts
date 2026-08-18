// Web-only scanner: html5-qrcode owns the browser camera lifecycle and QR decoding.
// It is intentionally isolated from the native Expo Camera implementation.
import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function WebQrScanner({ onScan, onError }) {
  const scannerId = useRef(`gents-gate-qr-${Math.random().toString(36).slice(2)}`).current;
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const handledRef = useRef(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    let disposed = false;
    let scanner;

    const startScanner = async () => {
      try {
        scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });

        await scanner.start(
          { facingMode: { ideal: 'environment' } },
          {
            fps: 10,
            qrbox: { width: 230, height: 230 },
            aspectRatio: 1,
            disableFlip: false,
          },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            onScanRef.current?.(decodedText);
          },
          () => {
            // Decode misses are expected while the camera is searching.
          }
        );
      } catch (error) {
        if (!disposed) onErrorRef.current?.(error);
      }
    };

    startScanner();

    return () => {
      disposed = true;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {}).finally(() => scanner.clear().catch(() => {}));
      } else if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [scannerId]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
      <div id={scannerId} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.16)' }}>
        <div style={{ width: 218, height: 218, border: '3px solid #D8B44B', borderRadius: 20, boxShadow: '0 0 18px rgba(216, 180, 75, 0.72)' }} />
      </div>
    </div>
  );
}
