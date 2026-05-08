import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../config/routes.config';
import { RoleSelectionModal } from '../features/auth/components/RoleSelectionModal';
import { API_BASE_URL } from '../config/api.config';

const Login = () => {
  const { login, logout, setSelectedRole } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const getUserRoles = (roles: any): string[] => {
    if (!roles) return [];
    return Array.isArray(roles)
      ? roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      console.log("Submitting login form...");
      const result = await login(formData);
      console.log("Login successful");

      // Get roles from response
      const user = result.user;
      const roles = getUserRoles(user?.roles || []);

      if (roles.length > 1) {
        // Multiple roles - show selection modal
        setShowRoleModal(true);
      } else if (roles.length === 1) {
        // Single role - redirect based on role
        const role = roles[0];
        if (role === 'super_admin') {
          navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
        } else {
          navigate(ROUTES.DASHBOARD);
        }
      } else {
        // No roles? go to dashboard anyway
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err: any) {
      console.error("Login failed caught in UI:", err);
      const isNetworkFailure =
        err?.message === 'Network Error' ||
        err?.code === 'ERR_NETWORK' ||
        (!err?.response && !!err?.request);

      if (isNetworkFailure) {
        setError(`Cannot connect to API. Local server (${API_BASE_URL}) is unavailable and deployed fallback could not be reached.`);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: string) => {
    setShowRoleModal(false);
    // Update selected role in context (persists to localStorage)
    setSelectedRole(role);
    // Navigate to role-specific landing page
    if (role === 'super_admin') {
      navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const handleCloseModal = () => {
    // If modal is closed without selection, logout and go back to login
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md p-10 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl shadow-blue-900/5 border border-white relative z-10">
        <h2 className="text-3xl font-black text-center mb-8 text-gray-900 tracking-tight">Welcome Back</h2>
        {error && <div className="p-4 mb-6 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl shadow-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Email Address</label>
            <input
              type="email"
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-gray-900"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="dani@deboengineering.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-gray-900"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="••••••••"
            />
          </div>
          <button
            disabled={loading}
            className="w-full py-4 mt-2 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-8 text-center text-sm font-medium text-gray-500">
          Don't have an account? <Link to={ROUTES.SIGNUP} className="text-primary font-bold hover:underline">Sign up for access</Link>
        </p>
      </div>

      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={handleCloseModal}
        onRoleSelect={handleRoleSelect}
      />
    </div>
  );
};

export default Login;
