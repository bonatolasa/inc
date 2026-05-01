import React from 'react';
import { X, Shield, Users, Briefcase, Target, Settings, Crown } from 'lucide-react';
import { Modal } from '../../../common/components';
import { useAuth } from '../../../hooks/useAuth';
import { ROLES, getRoleDisplayName } from '../../../utils/roles';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect: (role: string) => void;
}

const roleIcons: Record<string, React.ReactNode> = {
  super_admin: <Crown className="w-6 h-6" />,
  admin: <Settings className="w-6 h-6" />,
  project_manager: <Briefcase className="w-6 h-6" />,
  team_member: <Users className="w-6 h-6" />,
  tester: <Target className="w-6 h-6" />,
};

const roleDescriptions: Record<string, string> = {
  super_admin: 'Full system access and control',
  admin: 'Manage users, projects, and settings',
  project_manager: 'Oversee projects and teams',
  team_member: 'Work on tasks and projects',
  tester: 'Test and report issues',
};

const roleColors: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  super_admin: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    hover: 'hover:border-purple-400 hover:bg-purple-100',
  },
  admin: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    hover: 'hover:border-blue-400 hover:bg-blue-100',
  },
  project_manager: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    hover: 'hover:border-green-400 hover:bg-green-100',
  },
  team_member: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    hover: 'hover:border-orange-400 hover:bg-orange-100',
  },
  tester: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    hover: 'hover:border-red-400 hover:bg-red-100',
  },
};

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ isOpen, onClose, onRoleSelect }) => {
  const { user } = useAuth();

  const getUserRoles = (): string[] => {
    if (!user || !user.roles) return [];
    return Array.isArray(user.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : [];
  };

  const roles = getUserRoles();

  const handleRoleSelect = (role: string) => {
    onRoleSelect(role);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Your Role">
      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-6">
          You have multiple roles assigned. Please select which role you want to use for this session:
        </p>

        <div className="grid gap-3">
          {roles.map((role) => {
            const colors = roleColors[role] || {
              bg: 'bg-gray-50',
              border: 'border-gray-200',
              text: 'text-gray-700',
              hover: 'hover:border-gray-400 hover:bg-gray-100',
            };

            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={`w-full p-4 rounded-2xl border-2 ${colors.bg} ${colors.border} ${colors.hover} transition-all duration-200 text-left group`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${colors.bg} ${colors.text}`}>
                    {roleIcons[role] || <Shield className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg ${colors.text}`}>
                      {getRoleDisplayName(role)}
                    </h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {roleDescriptions[role] || ''}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          You can change your role later from settings if needed.
        </p>
      </div>
    </Modal>
  );
};
