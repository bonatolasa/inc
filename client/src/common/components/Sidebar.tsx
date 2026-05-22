import React from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { ROUTES } from '../../config/routes.config';
import { PERMISSIONS, PermissionValue } from '../../config/permissions.config';
import { ROLES } from '../../utils/roles';
import { 
  LayoutDashboard, 
  UserCircle, 
  Users, 
  FolderKanban, 
  CheckSquare, 
  Shield, 
  Settings2,
  BarChart3
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  setIsOpen?: (val: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, setIsOpen }) => {
  const { user } = useAuth();
  const { hasPermission, hasAccess } = usePermission();
  const navigate = useNavigate();
  
  const canAccess = (permissions?: PermissionValue[]) =>
    permissions ? hasPermission(permissions) : true;

   const navItems = [
     { 
       name: 'Dashboard', 
       path: ROUTES.DASHBOARD, 
       icon: LayoutDashboard,
       visible: true 
     },
     { 
       name: 'Projects', 
       path: ROUTES.PROJECTS, 
       icon: FolderKanban,
       visible: canAccess([PERMISSIONS.PROJECTS_VIEW])
     },
     { 
       name: 'Tasks', 
       path: ROUTES.TASKS, 
       icon: CheckSquare,
       visible: canAccess([PERMISSIONS.TASKS_VIEW])
     },
     { 
       name: 'Reports', 
       path: ROUTES.REPORTS, 
       icon: BarChart3,
       visible: canAccess([PERMISSIONS.REPORTS_VIEW])
     },
     { 
       name: 'Teams', 
       path: ROUTES.TEAMS, 
       icon: Users,
       visible: canAccess([PERMISSIONS.TEAMS_VIEW])
     },
     { 
       name: 'Users', 
       path: ROUTES.USERS, 
       icon: UserCircle,
       visible: canAccess([PERMISSIONS.USERS_VIEW])
     },
     { 
       name: 'Roles', 
       path: '/roles', 
       icon: Shield,
       visible: canAccess([PERMISSIONS.ROLES_VIEW])
     },
     { 
       name: 'Settings', 
       path: ROUTES.ADMIN_SETTINGS, 
       icon: Settings2,
       visible: hasAccess(undefined, [ROLES.ADMIN, ROLES.SUPER_ADMIN])
     },
   ].filter(item => item.visible);

  return (
    <div 
      className={`${isOpen ? 'w-64' : 'w-24'} h-screen bg-white border-r border-gray-100 flex flex-col shadow-sm relative z-10 transition-all duration-300 ease-in-out flex-shrink-0 cursor-pointer`}
      onClick={() => {
        if (!isOpen && setIsOpen) setIsOpen(true);
      }}
    >
      <div className={`p-6 flex items-center ${isOpen ? 'justify-start' : 'justify-center'} transition-all duration-300`}>
        <div className="flex items-center space-x-3">
          <img
            src="/debo-logo.png"
            alt="Debo Engineering"
            className="w-14 h-14 rounded-full object-cover"
          />
          {isOpen && (
            <div className="leading-tight">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight whitespace-nowrap overflow-hidden">Debo</h1>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Engineering</p>
            </div>
          )}
        </div>
      </div>
      
      <nav className={`flex-1 ${isOpen ? 'px-4' : 'px-3'} space-y-2 mt-4 overflow-y-auto overflow-x-hidden`}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={!isOpen ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center ${isOpen ? 'space-x-3 px-4 py-3.5' : 'justify-center p-3.5 mx-auto'} rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-blue-50 text-primary font-bold shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110 text-primary' : 'group-hover:scale-110 text-gray-400 group-hover:text-gray-600 flex-shrink-0'}`}>
                   <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                 </div>
                {isOpen && <span className="whitespace-nowrap transition-opacity duration-300">{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={`${isOpen ? 'p-4 m-4' : 'p-2 my-4 mx-3'} bg-gray-50 rounded-2xl border border-gray-100 transition-all duration-300`}>
        <button
          type="button"
          onClick={() => navigate(ROUTES.PROFILE)}
          className={`w-full flex items-center ${isOpen ? 'space-x-3' : 'justify-center'} hover:bg-white rounded-xl p-1 transition-colors`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0 overflow-hidden px-1">
              <p className="text-sm font-extrabold text-gray-900 truncate tracking-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate font-semibold">{user?.email}</p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
