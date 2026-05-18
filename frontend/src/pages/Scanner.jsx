import { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import axios from 'axios';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Scanner = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false); // Start false to allow selection first
  const [location, setLocation] = useState(user.role === "Faculty" ? "Lab" : "Main Gate");
  const [purpose, setPurpose] = useState(user.role === "Faculty" ? "Verification" : "Entry");
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isScanning) return;

    const onScanSuccess = async (decodedText, decodedResult) => {
      // Pause scanning
      setIsScanning(false);
      scannerRef.current.clear();
      
      try {
        const payload = JSON.parse(decodedText);
        
        const res = await axios.post('/api/qr/verify', {
          payload: payload.payload,
          signature: payload.signature,
          location,
          purpose
        });

        setScanResult({
          success: true,
          data: res.data
        });

        // Resume scanning after 3 seconds
        setTimeout(() => {
          setScanResult(null);
          setIsScanning(true);
        }, 3000);

      } catch (error) {
        console.error(error);
        setScanResult({
          success: false,
          message: error.response?.data?.message || 'Invalid QR Code',
          data: error.response?.data
        });

        // Resume scanning after 3 seconds
        setTimeout(() => {
          setScanResult(null);
          setIsScanning(true);
        }, 3000);
      }
    };

    const onScanFailure = (error) => {
      // ignore
    };

    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
      /* verbose= */ false
    );
    
    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [isScanning, location, purpose]);

  const isFaculty = user.role === "Faculty";

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="p-4 flex items-center justify-between text-white border-b border-gray-800">
        <button onClick={() => navigate('/dashboard')} className="flex items-center hover:text-gray-300">
          <ArrowLeft className="h-5 w-5 mr-2" /> Back
        </button>
        <h2 className="text-lg font-semibold">{isFaculty ? "Student Verification" : "Security Scanner"}</h2>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        
        {scanResult ? (
          <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300 ${scanResult.success ? 'bg-green-600' : 'bg-red-600'}`}>
            {scanResult.success ? (
              <>
                <CheckCircle className="h-24 w-24 text-white mb-4" />
                <h2 className="text-4xl font-bold text-white mb-2">{isFaculty ? "VALID STUDENT" : "ACCESS GRANTED"}</h2>
                <p className="text-xl text-green-100 font-semibold mb-6">{scanResult.data.message}</p>
                
                <div className="bg-white/20 p-6 rounded-2xl w-full max-w-sm backdrop-blur-sm shadow-xl border border-white/30">
                  {scanResult.data.user?.photo && (
                    <img src={scanResult.data.user.photo} alt="User" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white object-cover" />
                  )}
                  <p className="text-3xl font-bold text-white mb-1">{scanResult.data.user?.name}</p>
                  <p className="text-green-50 text-lg mb-2">{scanResult.data.user?.department} • {scanResult.data.user?.year}</p>
                  <p className="text-green-200 text-sm mb-4">ID: {scanResult.data.user?._id}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-left bg-black/20 p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-green-200 uppercase tracking-wider">Status</p>
                      <p className="text-white font-semibold">Valid ({scanResult.data.user?.status})</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-200 uppercase tracking-wider">Role</p>
                      <p className="text-white font-semibold">{scanResult.data.user?.role}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-24 w-24 text-white mb-4" />
                <h2 className="text-4xl font-bold text-white mb-2">{isFaculty ? "INVALID STUDENT" : "ACCESS DENIED"}</h2>
                <div className="bg-white/20 p-6 rounded-2xl w-full max-w-sm backdrop-blur-sm mt-4 border border-white/30 shadow-xl">
                  <p className="text-2xl font-bold text-white mb-2">{scanResult.message}</p>
                  {scanResult.data?.user && (
                    <div className="mt-4 text-red-100">
                      <p className="font-bold">User: {scanResult.data.user.name}</p>
                      <p>Dept: {scanResult.data.user.department}</p>
                      <p className="text-xs mt-1">ID: {scanResult.data.user._id}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : !isScanning ? (
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">Scan Settings</h3>
            
            <div className="space-y-4">
              {!isFaculty && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <select value={location} onChange={e => setLocation(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="Main Gate">Main Gate</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Library">Library</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                    <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="Entry">Entry</option>
                      <option value="Exit">Exit</option>
                      <option value="Library">Library</option>
                      <option value="Event">Event</option>
                    </select>
                  </div>
                </>
              )}
              {isFaculty && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lab / Class Name</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. CS Lab 1" />
                 </div>
              )}

              <button 
                onClick={() => setIsScanning(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg mt-4"
              >
                Start Camera Scanner
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl ring-4 ring-gray-800 relative">
             <div id="reader" className="w-full"></div>
          </div>
        )}

        {!scanResult && (
          <div className="mt-8 text-center text-gray-400">
            <p>Point camera at a valid Smart Campus QR Code</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
