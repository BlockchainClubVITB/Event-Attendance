import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError: (error: Error) => void;
}

const QRScanner = forwardRef<unknown, QRScannerProps>(({ onScanSuccess, onScanError }: QRScannerProps, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useImperativeHandle(ref, () => ({
    restart: () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.start();
      }
    }
  }));

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
      </div>
    </div>
  );
});

QRScanner.displayName = 'QRScanner';

export default QRScanner;