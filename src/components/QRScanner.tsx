import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  onScanError: (error: Error) => void;
  onCamerasDetected?: (cameras: QrScanner.Camera[]) => void;
  selectedCameraId?: string;
}

export interface QRScannerRef {
  start: () => void;
  stop: () => void;
  restart: () => void;
  getCameras: () => Promise<QrScanner.Camera[]>;
  setCamera: (cameraId: string) => Promise<void>;
}


const QRScanner = forwardRef<QRScannerRef, QRScannerProps>(({ onScanSuccess, onScanError, onCamerasDetected, selectedCameraId }: QRScannerProps, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [scannerReady, setScannerReady] = useState(false);

  // Detect cameras on mount
  useEffect(() => {
    let isMounted = true;
    QrScanner.listCameras(true).then((availableCameras) => {
      if (isMounted) {
        setCameras(availableCameras);
        if (onCamerasDetected) onCamerasDetected(availableCameras);
      }
    }).catch((error) => {
      console.error('Failed to get cameras:', error);
    });
    return () => { isMounted = false; };
  }, [onCamerasDetected]);

  // Initialize scanner only when a camera is selected and video is ready
  useEffect(() => {
    if (!videoRef.current || !selectedCameraId) return;
    if (qrScannerRef.current) {
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        onScanSuccess(result.data);
        qrScannerRef.current?.pause();
      },
      {
        onDecodeError: (error) => {
          if (error instanceof Error && error.message !== 'No QR code found') {
            onScanError(error);
          }
        },
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: selectedCameraId,
      }
    );
    setScannerReady(true);
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
        qrScannerRef.current = null;
      }
      setScannerReady(false);
    };
  }, [selectedCameraId, onScanSuccess, onScanError]);

  useImperativeHandle(ref, () => ({
    start: () => {
      if (qrScannerRef.current && scannerReady) {
        qrScannerRef.current.start().catch((err) => {
          let errorMessage = 'Failed to start camera';
          if (err.message && err.message.includes('https')) {
            errorMessage = 'Camera requires HTTPS. Please use https://localhost:3000 or deploy to a secure server.';
          } else if (err.name === 'NotAllowedError') {
            errorMessage = 'Camera access denied. Please allow camera permissions.';
          } else if (err.name === 'NotFoundError') {
            errorMessage = 'No camera found. Please ensure a camera is connected.';
          }
          onScanError(new Error(errorMessage));
        });
      }
    },
    stop: () => {
      if (qrScannerRef.current && scannerReady) {
        qrScannerRef.current.stop();
      }
    },
    restart: () => {
      if (qrScannerRef.current && scannerReady) {
        qrScannerRef.current.stop();
        qrScannerRef.current.start();
      }
    },
    getCameras: async () => {
      return await QrScanner.listCameras(true);
    },
    setCamera: async (cameraId: string) => {
      if (qrScannerRef.current && scannerReady) {
        await qrScannerRef.current.setCamera(cameraId);
      }
    }
  }), [scannerReady]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <video 
        ref={videoRef} 
        className="absolute inset-0 w-full h-full object-cover" 
        playsInline
        muted
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Scanning overlay */}
        <div className="absolute inset-4 border-2 border-green-400 rounded-lg">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white text-sm text-center bg-black bg-opacity-50 rounded px-2 py-1">
            Position QR code within the frame
          </p>
        </div>
      </div>
    </div>
  );
});

QRScanner.displayName = 'QRScanner';

export default QRScanner;