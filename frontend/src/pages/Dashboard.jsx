import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { QrCode, ScanLine, LogOut, Users, Activity, History, Book, User as UserIcon, Bell } from 'lucide-react';
import axios from 'axios';
import QRCode from 'qrcode.react';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [facultyStats, setFacultyStats] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [qrToken, setQrToken] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user.role === "Student") {
      axios.get('/api/logs/student/analytics').then(res => {
        setStudentStats(res.data);
        setHistory(res.data.logs);
      }).catch(console.error);

      // Fetch dynamic QR token for profile display
      axios.get('/api/qr/generate').then(res => {
        setQrToken(JSON.stringify({ payload: res.data.payload, signature: res.data.signature }));
      }).catch(console.error);
    }

    if (user.role === "Faculty") {
      axios.get('/api/logs/faculty/analytics').then(res => {
        setFacultyStats(res.data);
        setHistory(res.data.recentHistory);
      }).catch(console.error);
    }

    if (["Admin", "Security Staff"].includes(user.role)) {
       axios.get('/api/logs/me').then(res => setHistory(res.data)).catch(console.error);
    }

    // Fetch notifications
    axios.get('/api/notifications').then(res => setNotifications(res.data)).catch(console.error);

  }, [user.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markNotificationRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold text-gray-800">Smart Campus Portal</h1>
        <div className="flex items-center space-x-6">
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-500 hover:text-gray-700 relative">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-3 border-b bg-gray-50 font-bold text-gray-700">Notifications</div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n._id} 
                        onClick={() => !n.isRead && markNotificationRead(n._id)}
                        className={`p-3 border-b text-sm cursor-pointer hover:bg-gray-50 ${n.isRead ? 'text-gray-500' : 'text-gray-900 font-semibold bg-blue-50/50'}`}
                      >
                        {n.message}
                        <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <span className="text-gray-600 font-medium hidden sm:block">Hello, {user.name} ({user.role})</span>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 transition flex items-center">
            <LogOut className="h-5 w-5 mr-1" /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        
        {/* STUDENT DASHBOARD */}
        {user.role === "Student" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {user.photo ? (
                    <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-16 w-16 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                  <p className="text-indigo-600 font-semibold">{user.department} • {user.year}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-sm text-gray-600">
                    <div><span className="font-semibold">Email:</span> {user.email}</div>
                    <div><span className="font-semibold">Phone:</span> {user.phone || 'N/A'}</div>
                    <div><span className="font-semibold">Status:</span> <span className="text-green-600 font-bold">Active</span></div>
                    <div><span className="font-semibold">Location:</span> {user.currentStatus}</div>
                  </div>
                </div>
              </div>

              {/* QR Code Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                <h3 className="font-bold text-gray-700 mb-4">My Digital ID</h3>
                {qrToken ? (
                  <div className="p-2 bg-white border-4 border-indigo-100 rounded-xl inline-block">
                    <QRCode value={qrToken} size={140} level="H" includeMargin={true} />
                  </div>
                ) : (
                  <div className="h-[140px] w-[140px] bg-gray-100 rounded flex items-center justify-center animate-pulse">
                    Loading QR...
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-4">Dynamic QR refreshes automatically.</p>
              </div>
            </div>

            {/* Quick Actions & Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
              <div onClick={() => navigate('/library')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:shadow-md transition">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full mr-4"><Book className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-bold text-gray-800">Library & Requests</h3>
                  <p className="text-xs text-gray-500">Books taken: {studentStats?.booksTaken || 0}</p>
                </div>
              </div>
              <div onClick={() => navigate('/id-card')} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center cursor-pointer hover:shadow-md transition">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full mr-4"><QrCode className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-bold text-gray-800">Scanner Usage</h3>
                  <p className="text-xs text-gray-500">Scanned: {studentStats?.qrScannerUsageCount || 0} times</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                <div className="p-3 bg-green-100 text-green-600 rounded-full mr-4"><History className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-bold text-gray-800">Campus Exits</h3>
                  <p className="text-xs text-gray-500">Active status: {user.currentStatus}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FACULTY DASHBOARD */}
        {user.role === "Faculty" && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium">Total Students Scanned</p>
                  <h3 className="text-3xl font-bold text-indigo-600 mt-2">{facultyStats?.totalScanned || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium">Scans Today</p>
                  <h3 className="text-3xl font-bold text-green-600 mt-2">{facultyStats?.dailyScanCount || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 font-medium">Invalid Scan Attempts</p>
                  <h3 className="text-3xl font-bold text-red-600 mt-2">{facultyStats?.invalidScanAttempts || 0}</h3>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => navigate('/scan')}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <ScanLine className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">Scan Student QR</h3>
                    <p className="text-gray-500">Verify student identity and college enrollment</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/id-card')}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="h-20 w-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                    <QrCode className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800">My Digital ID</h3>
                    <p className="text-gray-500">View your faculty ID for campus access</p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* OTHER ROLES (Admin, Security, Librarian) */}
        {!["Student", "Faculty"].includes(user.role) && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Welcome to your Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Scan QR */}
              {["Security Staff", "Admin"].includes(user.role) && (
                <div onClick={() => navigate('/scan')} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><ScanLine className="h-8 w-8" /></div>
                  <div><h3 className="font-semibold text-lg">Scan QR Code</h3><p className="text-gray-500 text-sm">Verify student and faculty access</p></div>
                </div>
              )}
              {/* Manage Users */}
              {user.role === "Admin" && (
                <div onClick={() => navigate('/admin/users')} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><Users className="h-8 w-8" /></div>
                  <div><h3 className="font-semibold text-lg">Manage Users</h3><p className="text-gray-500 text-sm">Add, edit, or blacklist users</p></div>
                </div>
              )}
              {/* Analytics */}
              {["Admin", "Security Staff"].includes(user.role) && (
                <div onClick={() => navigate('/admin/analytics')} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><Activity className="h-8 w-8" /></div>
                  <div><h3 className="font-semibold text-lg">Analytics & Logs</h3><p className="text-gray-500 text-sm">View access logs, exports, and alerts</p></div>
                </div>
              )}
              {/* Library */}
              {["Librarian", "Admin"].includes(user.role) && (
                <div onClick={() => navigate('/library')} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center"><Book className="h-8 w-8" /></div>
                  <div><h3 className="font-semibold text-lg">Library Management</h3><p className="text-gray-500 text-sm">Manage books, issues, and inventory</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Section for Students and Faculty */}
        {["Student", "Faculty"].includes(user.role) && (
          <div className="mt-12">
            <div className="flex items-center mb-4 text-gray-800">
              <History className="h-6 w-6 mr-2 text-indigo-600" />
              <h2 className="text-xl font-bold">{user.role === 'Faculty' ? 'Recent Student Scans' : 'My Recent Activity Logs'}</h2>
            </div>
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{user.role === 'Faculty' ? 'Student' : 'Location/App'}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type/Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map(log => (
                    <tr key={log._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.role === 'Faculty' ? log.userId?.name : log.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-semibold">{log.type}</span> - {log.purpose}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No recent logs found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
