import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IDCard from './pages/IDCard';
import Scanner from './pages/Scanner';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import LibraryDashboard from './pages/LibraryDashboard';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />;
  
  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/id-card" element={
          <PrivateRoute allowedRoles={["Student", "Faculty", "Non-Teaching Staff"]}>
            <IDCard />
          </PrivateRoute>
        } />
        
        <Route path="/scan" element={
          <PrivateRoute allowedRoles={["Admin", "Security Staff", "Faculty"]}>
            <Scanner />
          </PrivateRoute>
        } />

        <Route path="/admin/users" element={
          <PrivateRoute allowedRoles={["Admin"]}>
            <Users />
          </PrivateRoute>
        } />

        <Route path="/admin/analytics" element={
          <PrivateRoute allowedRoles={["Admin", "Security Staff"]}>
            <Analytics />
          </PrivateRoute>
        } />

        <Route path="/library" element={
          <PrivateRoute allowedRoles={["Student", "Librarian", "Admin"]}>
            <LibraryDashboard />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
