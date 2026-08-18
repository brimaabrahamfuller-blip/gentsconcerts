// Native fallback: Expo Camera remains the scanner on iOS and Android.
import { CameraView } from 'expo-camera';

export default function WebQrScanner({ onScan, onError, style }) {
  return (
    <CameraView
      style={style}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={onScan ? ({ data }) => onScan(data) : undefined}
      onMountError={onError}
    />
  );
}
