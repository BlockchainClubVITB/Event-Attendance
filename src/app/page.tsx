"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import QRScanner from "@/components/QRScanner";

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const qrScannerRef = useRef<{ restart: () => void } | null>(null);

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

  const handleConfirm = async () => {
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
    }
    setIsDialogOpen(false);
    setIsMessageDialogOpen(true);
  };

  const handleMessageDialogClose = () => {
    setIsMessageDialogOpen(false);
    if (qrScannerRef.current) {
      qrScannerRef.current.restart();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <nav className="bg-gradient-to-r from-blue-900 via-purple-900 to-indigo-900 p-6 shadow-2xl border-b border-blue-500/20">
        <div className="container mx-auto flex justify-center items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Blockchain Club Logo"
                width={50}
                height={50}
                className="rounded-full ring-2 ring-blue-400/50 shadow-lg"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Blockchain Attendance
              </h1>
              <p className="text-blue-300/80 text-sm font-medium">
                Secure • Decentralized • Immutable
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Scanner Card */}
          <div className="bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-500/20 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-blue-500/20">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  QR Code Scanner
                </h2>
                <p className="text-blue-300/80 text-sm">
                  Scan your student QR code to mark attendance
                </p>
              </div>
            </div>
            
            {/* Scanner Area */}
            <div className="p-6">
              <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border-2 border-dashed border-blue-500/30">
                {/* Scanner Component */}
                <QRScanner
                  ref={qrScannerRef}
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
                
                {/* Scanner Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner Brackets */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-l-3 border-t-3 border-blue-400"></div>
                  <div className="absolute top-4 right-4 w-8 h-8 border-r-3 border-t-3 border-blue-400"></div>
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-l-3 border-b-3 border-blue-400"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-r-3 border-b-3 border-blue-400"></div>
                  
                  {/* Scanning Line Animation */}
                  <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="mt-6 text-center">
                <p className="text-gray-300 text-sm leading-relaxed">
                  Position the QR code within the frame above.<br />
                  <span className="text-blue-400 font-medium">Format:</span> 
                  <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded ml-1">
                    REGNO NAME
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Footer Info */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              Powered by Blockchain Technology • Secure Attendance Tracking
            </p>
          </div>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Confirm Attendance
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center mt-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">Registration:</span>
                    <span className="text-blue-400 font-mono font-bold">{registrationNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 font-medium">Student:</span>
                    <span className="text-white font-semibold">{name}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel 
              onClick={() => setIsDialogOpen(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              Confirm Attendance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Message Dialog */}
      <AlertDialog
        open={isMessageDialogOpen}
        onOpenChange={setIsMessageDialogOpen}
      >
        <AlertDialogContent className="bg-gradient-to-br from-gray-800 to-gray-900 border border-blue-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Notification
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center mt-4">
              <div className={`rounded-lg p-4 border ${
                message.includes('successfully') 
                  ? 'bg-green-900/30 border-green-500/20 text-green-300' 
                  : message.includes('Already marked')
                  ? 'bg-yellow-900/30 border-yellow-500/20 text-yellow-300'
                  : 'bg-red-900/30 border-red-500/20 text-red-300'
              }`}>
                <p className="font-medium">{message}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction 
              onClick={handleMessageDialogClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full"
            >
              Continue Scanning
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
