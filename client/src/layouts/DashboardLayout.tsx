import React, { ReactNode, useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar, Navbar, ErrorBoundary } from '../common/components';
import { useAuth } from '../hooks/useAuth';
import { RoleSelectionModal } from '../features/auth/components/RoleSelectionModal';
import { getDefaultRouteForRole } from '../config/roleRoutes.config';
import { ROUTES } from '../config/routes.config';

interface DashboardLayoutProps {
  children?: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, selectedRole, setSelectedRole, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);

  useEffect(() => {
    // Check if user has multiple roles but hasn't selected one
    if (user && user.roles) {
      const roles = Array.isArray(user.roles) ? user.roles.map((r: any) => typeof r === 'string' ? r : r.name) : [];
      if (roles.length > 1 && !selectedRole) {
        setShowRoleModal(true);
      }
    }
  }, [user, selectedRole]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setShowRoleModal(false);
    // Redirect to role-specific default route
    navigate(getDefaultRouteForRole(role));
  };

  const handleCloseModal = () => {
    // If user closes modal without selecting a role, log them out
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="flex h-screen bg-slate-50/50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div
        className="flex-1 flex flex-col h-screen overflow-hidden relative z-0 transition-all duration-300"
        onClick={() => {
          if (isSidebarOpen) setIsSidebarOpen(false);
        }}
      >
        <Navbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full max-w-[1600px] mx-auto p-8">
          <ErrorBoundary>
            {children || <Outlet />}
          </ErrorBoundary>
        </main>
      </div>

      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={handleCloseModal}
        onRoleSelect={handleRoleSelect}
      />
    </div>
  );
};

export default DashboardLayout;
