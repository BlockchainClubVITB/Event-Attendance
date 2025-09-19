import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError: (error: Error) => void;
}

const QRScanner = forwardRef<unknown, QRScannerProps>(({ onScanSuccess, onScanError }: QRScannerProps, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useImperativeHandle(ref, () => ({
    restart: () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.start();
        setIsScanning(true);
      }
    }
  }));

  const toggleScanning = () => {
    if (!qrScannerRef.current) return;

    if (isScanning) {
      qrScannerRef.current.stop();
      setIsScanning(false);
    } else {
      qrScannerRef.current.start().then(() => {
        setIsScanning(true);
      }).catch((err) => {
        console.error('Failed to start QR scanner:', err);
        onScanError(new Error('Failed to start camera'));
      });
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          onScanSuccess(result.data);
          // Optionally pause scanning after a successful scan
          qrScannerRef.current?.pause();
        },
        {
          onDecodeError: (error) => {
            console.log(error);
            // Only call onScanError for actual errors, not just when no QR code is detected
            if (error instanceof Error && error.message !== 'No QR code found') {
              onScanError(error);
            }
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current.start().catch((err) => {
        console.error('Failed to start QR scanner:', err);
        onScanError(new Error('Failed to start camera'));
        setIsInitialized(false);
      }).then(() => {
        setIsScanning(true);
        setIsInitialized(true);
      });
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {!isScanning && isInitialized && (
          <div className="bg-black/50 text-white px-4 py-2 rounded-lg">
            Camera Stopped
          </div>
        )}
      </div>
      
      {/* Camera Control Button */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <button
          onClick={toggleScanning}
          disabled={!isInitialized}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isScanning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } ${!isInitialized ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl'}`}
        >
          {isScanning ? '⏸️ Stop Camera' : '▶️ Start Camera'}
        </button>
      </div>
    </div>
  );
});

QRScanner.displayName = 'QRScanner';

export default QRScanner;