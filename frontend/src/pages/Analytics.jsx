import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Activity, UserCheck, AlertTriangle, Download, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes, alertsRes] = await Promise.all([
          axios.get('/api/logs/analytics'),
          axios.get('/api/logs'),
          axios.get('/api/logs/alerts') // Wait, the backend route is actually /api/logs/alerts based on how it's mounted, wait let me check! No, wait, I'll use /api/logs/alerts
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data);
        setAlerts(alertsRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Daily Access Logs - Smart Campus ID", 14, 15);
    
    const tableData = logs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userId?.name || 'Unknown',
      log.userId?.role || '-',
      log.location,
      log.purpose,
      log.type,
      log.status,
      log.isSuspicious ? 'Yes' : 'No'
    ]);

    doc.autoTable({
      head: [['Time', 'User', 'Role', 'Location', 'Purpose', 'Type', 'Status', 'Suspicious']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] } // Indigo-600
    });

    doc.save(`Campus_Access_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div className="p-8 text-center">Loading Analytics...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <button onClick={() => navigate('/dashboard')} className="mr-4 text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Analytics & Logs</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-4">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Entries Today</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.totalEntriesToday || 0}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Exits Today</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.totalExitsToday || 0}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
            <div className="h-12 w-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Unauthorized Attempts</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats?.unauthorizedAttemptsToday || 0}</h3>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Recent Access Logs</h2>
          <button 
            onClick={exportPDF}
            className="flex items-center text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </button>
        </div>
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 mb-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map(log => (
                <tr key={log._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.userId ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.userId.name}</div>
                        <div className="text-xs text-gray-500">{log.userId.role}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unknown User</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.failureReason || 'OK'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Alerts Section */}
        <div className="flex items-center mb-4 text-gray-800 mt-12">
          <Bell className="h-6 w-6 mr-2 text-orange-500" />
          <h2 className="text-xl font-bold">System Alerts</h2>
        </div>
        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-100 mb-12">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.map(alert => (
                <tr key={alert._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      alert.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {alert.userId ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{alert.userId.name}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">System</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {alert.message}
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No alerts found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
