import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';
import { ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';

const IDCard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  const fetchQR = async () => {
    try {
      setError('');
      const res = await axios.get('/api/qr/generate');
      setQrData(JSON.stringify({ payload: res.data.payload, signature: res.data.signature }));
      setTimeLeft(30); // Reset timer on success
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR');
    }
  };

  useEffect(() => {
    fetchQR();
    const interval = setInterval(() => {
      fetchQR();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 hover:text-gray-900 transition">
          <ArrowLeft className="h-5 w-5 mr-1" /> Back
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden w-full max-w-md border border-gray-100">
        
        {/* Header styling based on role */}
        <div className={`p-6 text-center text-white ${user.role === 'Faculty' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
          <h2 className="text-2xl font-bold uppercase tracking-wider">{user.role} ID</h2>
          <p className="opacity-80 text-sm mt-1">{user.department} Department</p>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* User Photo */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg -mt-20 mb-4 bg-gray-200">
            {user.photo ? (
              <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
                {user.name.charAt(0)}
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-gray-800">{user.name}</h3>
          <p className="text-gray-500 mb-4">{user.email}</p>

          <div className="flex space-x-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.currentStatus === 'Inside' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              {user.currentStatus || 'Outside'}
            </span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
              {Math.max(0, 3 - (user.monthlyScanCount || 0))} Scans Left
            </span>
          </div>

          <div className="w-full h-px bg-gray-200 mb-6"></div>

          {/* QR Code Area */}
          <div className="flex flex-col items-center justify-center min-h-[250px]">
            {error ? (
              <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl flex flex-col items-center">
                <AlertTriangle className="h-10 w-10 mb-2" />
                <p className="font-semibold text-lg">{error}</p>
                {error.includes('limit exceeded') && (
                  <p className="text-sm mt-2">Please present your physical ID card to security.</p>
                )}
              </div>
            ) : qrData ? (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <QRCodeSVG value={qrData} size={200} level="H" includeMargin={false} />
              </div>
            ) : (
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-[200px] h-[200px] bg-gray-200 rounded-2xl"></div>
                <p className="mt-4 text-gray-400">Generating secure code...</p>
              </div>
            )}

            {!error && (
              <div className="mt-6 flex items-center text-sm font-medium text-gray-500">
                <RefreshCw className={`h-4 w-4 mr-2 ${timeLeft <= 5 ? 'text-red-500 animate-spin' : 'text-indigo-500'}`} />
                Refreshes in <span className={`ml-1 ${timeLeft <= 5 ? 'text-red-500' : 'text-indigo-600'}`}>{timeLeft}s</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDCard;
