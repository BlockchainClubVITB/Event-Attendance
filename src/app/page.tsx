"use client";
import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import QRScanner, { type QRScannerRef } from "@/components/QRScanner";
import QrScanner from 'qr-scanner';

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cameras, setCameras] = useState<QrScanner.Camera[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const qrScannerRef = useRef<QRScannerRef | null>(null);

  const handleScanSuccess = (data: string) => {
    const parts = data.split(" ");
    if (parts.length >= 2) {
      setRegistrationNumber(parts[0]);
      setName(parts.slice(1).join(" "));
      setIsDialogOpen(true);
    } else {
      console.log("Invalid QR Code content:", data);
      setMessage("Invalid QR Code. Please try again.");
      setIsMessageDialogOpen(true);
    }
  };

  const handleScanError = (err: Error) => {
    console.error(err);
    setMessage("Error scanning QR Code. Please try again.");
    setIsMessageDialogOpen(true);
  };

  const startCamera = () => {
    setIsCameraActive(true);
    if (qrScannerRef.current) {
      qrScannerRef.current.start();
    }
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
  };

  const handleCamerasDetected = (detectedCameras: QrScanner.Camera[]) => {
    setCameras(detectedCameras);
    if (detectedCameras.length > 0 && !selectedCameraId) {
      // Default to back camera if available, otherwise first camera
      const backCamera = detectedCameras.find(camera => 
        camera.label.toLowerCase().includes('back') || 
        camera.label.toLowerCase().includes('environment')
      );
      setSelectedCameraId(backCamera?.id || detectedCameras[0].id);
    }
  };

  const handleCameraChange = async (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (qrScannerRef.current && isCameraActive) {
      await qrScannerRef.current.setCamera(cameraId);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const { data, error: selectError } = await supabase
        .from("students")
        .select("registration_number")
        .eq("registration_number", registrationNumber)
        .single();

      if (selectError && selectError.code !== "PGRST116") throw selectError;

      if (data) {
        setMessage("Already marked present");
      } else {
        const nameParts = name.split(" ");
        const firstName = nameParts[0];
        const lastName =
          nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        const { error: insertError } = await supabase
          .from("students")
          .insert([
            {
              registration_number: registrationNumber,
              first_name: firstName,
              last_name: lastName,
            },
          ]);
        if (insertError) throw insertError;
        setMessage("Attendance marked successfully!");
      }
    } catch (error) {
      console.error("Error updating details:", error);
      setMessage("Failed to update details.");
    } finally {
      setIsLoading(false);
    }
    setIsDialogOpen(false);
    setIsMessageDialogOpen(true);
  };

  const handleMessageDialogClose = () => {
    setIsMessageDialogOpen(false);
    if (qrScannerRef.current && isCameraActive) {
      qrScannerRef.current.restart();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="px-4 py-6">
            <div className="flex items-center justify-center mb-2">
              <img 
                src="/logo.png" 
                alt="Blockchain Club VITB Logo" 
                className="w-8 h-8 mr-3"
              />
              <h1 className="text-xl font-bold text-white">Blockchain Club VITB</h1>
            </div>
            <p className="text-center text-gray-300 text-sm">Attendance Checker</p>
          </div>
        </header>      {/* Main Content */}
      <main className="flex-1 px-4 py-6 space-y-6">
        {/* Camera Section */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden max-w-lg mx-auto w-full">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h2 className="text-lg font-semibold text-white">
                QR Code Scanner
              </h2>
              {cameras.length > 1 && (
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label || `Camera ${camera.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {cameras.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <p className="text-gray-400 text-center">No camera detected.<br/>Please check your device and browser permissions.</p>
              </div>
            )}
            {cameras.length > 0 && !isCameraActive && (
              <div className="w-full h-64 sm:h-80 bg-gray-700 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-600">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm mb-2">Ready to scan QR codes</p>
                    <p className="text-gray-500 text-xs">Camera is currently off</p>
                    {cameras.length > 1 && (
                      <p className="text-gray-500 text-xs mt-1">
                        {cameras.length} cameras available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {cameras.length > 0 && isCameraActive && (
              <div className="w-full h-64 sm:h-80 relative rounded-lg overflow-hidden">
                <QRScanner
                  ref={qrScannerRef}
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                  onCamerasDetected={handleCamerasDetected}
                  selectedCameraId={selectedCameraId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Controls Section */}
        <div className="space-y-4">
          {!isCameraActive ? (
            <Button
              onClick={startCamera}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-medium rounded-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h10a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              Start Taking Attendance
            </Button>
          ) : (
            <Button
              onClick={stopCamera}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-medium rounded-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
              </svg>
              Stop Camera
            </Button>
          )}
          
          {isCameraActive && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm font-medium">Camera Active</span>
              </div>
              <p className="text-gray-400 text-xs text-center mt-2">
                Point camera at QR code to scan
              </p>
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Attendance</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              <div className="space-y-2">
                <p>
                  <strong className="text-white">Registration Number:</strong> {registrationNumber}
                </p>
                <p>
                  <strong className="text-white">Name:</strong> {name}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setIsDialogOpen(false)}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
      >
        <AlertDialogContent className="bg-gray-800 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Notification</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              <p>{message}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={handleMessageDialogClose}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ok
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
