import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Search, LogOut, Shield, ChevronDown } from 'lucide-react';
import { getRoleDisplayName } from '../../utils/roles';
import { ROUTES } from '../../config/routes.config';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { logout, user, selectedRole, setSelectedRole } = useAuth();
  const navigate = useNavigate();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const getUserRoles = (): string[] => {
    if (!user || !user.roles) return [];
    return Array.isArray(user.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : [];
  };

  const roles = getUserRoles();
  const hasMultipleRoles = roles.length > 1;

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    setShowRoleDropdown(false);
    // Redirect to role-appropriate page
    if (role === 'super_admin') {
      navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
    } else {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <>
      <header className="h-20 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center w-1/2 max-w-xl">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search projects, tasks, or colleagues..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Role Selector */}
          {hasMultipleRoles && (
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors flex items-center space-x-2"
              >
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-bold text-purple-700">
                  {selectedRole ? getRoleDisplayName(selectedRole) : 'Select Role'}
                </span>
                <ChevronDown className="w-4 h-4 text-purple-600" />
              </button>

              {showRoleDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRoleDropdown(false);
                    }}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2">
                    {roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => handleRoleChange(role)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                          selectedRole === role ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-700'
                        }`}
                      >
                        {getRoleDisplayName(role)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Notifications */}
          <NotificationDropdown />

          <div className="w-px h-8 bg-gray-200 mx-1" />
          <button
            onClick={logout}
            className="px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl flex items-center space-x-2 transition-colors font-semibold text-sm border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>
    </>
  );
};

export default Navbar;
