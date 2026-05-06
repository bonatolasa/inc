import React, { useState } from 'react';
import { User, Role } from '../../../types/user.types';
import { formatDate } from '../../../utils/formatters';
import { Can, Modal } from '../../../common/components';
import { userService } from '../../../services/user.service';
import { PERMISSIONS, type PermissionValue } from '../../../config/permissions.config';
import { Power, PowerOff, Key, Shield } from 'lucide-react';
import UserPermissionsModal from './UserPermissionsModal';
import { getRoleDisplayName } from '../../../utils/roles';

interface UserTableProps {
  users: User[];
  roles: Role[];
  onRefresh: () => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, roles, onRefresh }) => {
  const allPermissionValues = new Set<PermissionValue>(Object.values(PERMISSIONS));
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionValue[]>([]);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleToggleStatus = async (user: User) => {
    const userId = user._id || (user as any)?.id;
    if (!userId) return;

    setIsTogglingStatus(userId);
    try {
      const response = await userService.updateUser(userId, { 
        isActive: !user.isActive 
      } as any);
      
      if (response.success) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to toggle user status", error);
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const handleOpenPermissions = (user: User) => {
    setSelectedUser(user);
    const userPermissions = (user.permissions || []).filter(
      (permission): permission is PermissionValue => allPermissionValues.has(permission as PermissionValue)
    );
    setSelectedPermissions(userPermissions);
    setIsPermissionsModalOpen(true);
  };

  const handleSavePermissions = async (permissions: PermissionValue[]) => {
    const userId = selectedUser?._id || (selectedUser as any)?.id;
    if (!userId) return;
    
    setIsUpdating(true);
    try {
      const response = await userService.updateUserPermissions(userId, permissions);
      if (response.success) {
        setSelectedPermissions(permissions);
        setSelectedUser((prev) => (prev ? { ...prev, permissions } : prev));
      }
    } catch (error) {
      console.error("Failed to update permissions", error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenRoles = (user: User) => {
    setSelectedUser(user);
    const currentRoles = Array.isArray(user.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : [];
    setSelectedRoles(currentRoles);
    setIsRolesModalOpen(true);
  };

  const handleToggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName],
    );
  };

  const handleSaveRoles = async () => {
    const userId = selectedUser?._id || (selectedUser as any)?.id;
    if (!userId) return;
    if (selectedRoles.length === 0) {
      alert('Please select at least one role.');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await userService.assignRoles(userId, selectedRoles);
      if (response.success) {
        setIsRolesModalOpen(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to assign roles', error);
      alert('Failed to update roles for this user.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
      <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="bg-slate-50 border-b border-gray-100">
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">User Profile</th>
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Email Details</th>
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Access Roles</th>
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Joined</th>
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((user, index) => {
            const userId = user._id || (user as any)?.id || `temp-${index}`;
            return (
              <tr key={userId} className={`transition-colors duration-200 group ${!user.isActive ? 'bg-gray-50/50 grayscale-[0.5]' : 'hover:bg-blue-50/30'}`}>
                <td className="p-5">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${user.isActive ? 'from-primary to-blue-400' : 'from-gray-400 to-gray-300'} flex items-center justify-center text-white font-bold shadow-sm shadow-primary/20`}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={`font-bold block ${user.isActive ? 'text-gray-900' : 'text-gray-500'}`}>{user.name}</span>
                      {!user.isActive && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Deactivated</span>}
                    </div>
                  </div>
                </td>
                <td className="p-5 text-sm font-medium text-gray-500">{user.email}</td>
                <td className="p-5">
                  <div className="flex gap-2 flex-wrap">
                    {(user.roles || []).map((role: any) => {
                      const roleId = typeof role === 'string' ? role : (role._id || role.name);
                      return (
                        <span 
                          key={roleId} 
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                            user.isActive 
                              ? 'bg-blue-50 text-primary border-blue-100' 
                              : 'bg-gray-100 text-gray-400 border-gray-200'
                          }`}
                        >
                          {getRoleDisplayName(role)}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="p-5 text-center">
                   <Can roles={['admin', 'super_admin']} permissions={[PERMISSIONS.USERS_UPDATE]}>
                     <button
                       onClick={() => handleToggleStatus(user)}
                       disabled={isTogglingStatus === userId}
                       className={`p-2 rounded-xl transition-all duration-300 ${
                         user.isActive 
                           ? 'text-green-500 bg-green-50 hover:bg-green-100' 
                           : 'text-red-500 bg-gray-100 hover:bg-red-50'
                       } ${isTogglingStatus === userId ? 'animate-pulse' : ''}`}
                       title={user.isActive ? 'Deactivate User' : 'Activate User'}
                     >
                       {user.isActive ? <Power className="w-5 h-5" /> : <PowerOff className="w-5 h-5" />}
                     </button>
                   </Can>
                </td>
                <td className="p-5 text-sm font-medium text-gray-400">{formatDate(user.createdAt || '')}</td>
                <td className="p-5 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Can roles={['super_admin']} permissions={[PERMISSIONS.USERS_ASSIGN_ROLES]}>
                      <button
                        onClick={() => handleOpenRoles(user)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50 group-hover:border-blue-200 flex items-center gap-1 text-sm font-medium"
                        title="Manage Roles"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Roles</span>
                      </button>
                    </Can>
                    <Can roles={['admin', 'super_admin']} permissions={[PERMISSIONS.USERS_UPDATE]}>
                      <button
                        onClick={() => handleOpenPermissions(user)}
                        className="text-gray-400 hover:text-purple-600 transition-colors p-2 rounded-lg hover:bg-purple-50 group-hover:border-purple-200 flex items-center gap-1 text-sm font-medium"
                        title="Manage Permissions"
                      >
                        <Key className="w-4 h-4" />
                        <span>Permissions</span>
                      </button>
                    </Can>
                  </div>
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>

      {/* Permissions Management Modal */}
      <UserPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          setIsPermissionsModalOpen(false);
          onRefresh();
        }}
        userName={selectedUser?.name || ''}
        currentPermissions={selectedPermissions}
        onSave={handleSavePermissions}
      />
      <Modal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        title={`Manage Roles${selectedUser?.name ? ` - ${selectedUser.name}` : ''}`}
      >
        <div className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {roles.map((role) => (
              <label key={role._id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.name)}
                  onChange={() => handleToggleRole(role.name)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold text-gray-800">{role.name.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-500">{role.description || 'No description'}</p>
                </div>
              </label>
            ))}
            {roles.length === 0 && (
              <p className="text-sm text-gray-500">No roles found.</p>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRolesModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleSaveRoles}
              className="flex-1 px-4 py-2.5 rounded-xl font-black bg-primary text-white hover:bg-blue-600 disabled:opacity-50"
            >
              {isUpdating ? 'Saving...' : 'Save Roles'}
            </button>
          </div>
        </div>
      </Modal>
   </div>
  );
};

export default UserTable;
