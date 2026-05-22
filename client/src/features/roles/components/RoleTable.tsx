import React, { useState } from 'react';
import { Role } from '../../../types/user.types';
import { getRoleDisplayName } from '../../../utils/roles';
import { Modal, Can } from '../../../common/components';
import { roleService } from '../../../services/role.service';
import { PERMISSION_GROUPS, dedupePermissions } from '../../../config/permission-groups.config';
import { PERMISSIONS } from '../../../config/permissions.config';
import { CheckCircle, ShieldCheck, Trash2, Edit3, Save } from 'lucide-react';

interface RoleTableProps {
  roles: Role[];
  onRefresh: () => void;
}

const RoleTable: React.FC<RoleTableProps> = ({ roles, onRefresh }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [newName, setNewName] = useState('');

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setRolePermissions(dedupePermissions(role.permissions || []));
    setIsModalOpen(true);
  };

  const handleOpenRename = (role: Role) => {
    setSelectedRole(role);
    setNewName(role.displayName || role.name);
    setIsRenameModalOpen(true);
  };

  const handleDeleteRole = async (role: Role) => {
    // Protection for core system roles
    const coreRoles = ['super_admin', 'admin', 'project_manager', 'team_member', 'tester'];
    if (coreRoles.includes(role.name)) {
      alert(`The core system role "${role.name}" cannot be deleted as it is required for fundamental platform stability.`);
      return;
    }

    if (!window.confirm(`CAUTION: Are you sure you want to delete the role "${role.name}"? \n\nAll users currently assigned this role will lose their associated permissions. This action is irreversible.`)) return;
    
    try {
      const response = await roleService.deleteRole(role.name);
      if (response.success) {
        onRefresh();
      } else {
        alert("Server failed to delete role. It may be in use.");
      }
    } catch (error: any) {
      console.error("Delete failed", error);
      const msg = error.response?.data?.message || "Failed to delete role.";
      alert(`Error: ${msg}`);
    }
  };

  const handleRenameSave = async () => {
    if (!selectedRole || !newName.trim()) return;
    setIsUpdating(true);
    try {
      const response = await roleService.updateDisplayName(selectedRole.name, newName.trim());
      if (response.success) {
        setIsRenameModalOpen(false);
        onRefresh();
      }
    } catch (error) {
      console.error('Display name update failed', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTogglePermission = async (perm: string) => {
    if (!selectedRole) return;
    const isSelected = rolePermissions.includes(perm);
    const nextPermissions = isSelected
      ? rolePermissions.filter((p) => p !== perm)
      : dedupePermissions([...rolePermissions, perm]);

    setRolePermissions(nextPermissions);
    setIsUpdating(true);
    try {
      if (isSelected) {
        await roleService.removePermissions(selectedRole.name, [perm]);
      } else {
        await roleService.addPermissions(selectedRole.name, [perm]);
      }
      setSelectedRole((prev) => (prev ? { ...prev, permissions: nextPermissions } : prev));
    } catch (error) {
      setRolePermissions(selectedRole.permissions || []);
      console.error('Failed to update permissions', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="overflow-x-auto bg-white rounded-2xl">
      <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="bg-slate-50 border-b border-gray-100">
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Role Name</th>
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider">Internal Slug</th>
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Permissions</th>
            <th className="p-5 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {roles.map((role, index) => (
            <tr key={role._id || role.name || `role-${index}`} className="hover:bg-blue-50/30 transition-colors duration-200 group">
              <td className="p-5 font-black text-gray-900">{role.displayName || role.name.replace('_', ' ')}</td>
              <td className="p-5 font-mono text-xs text-gray-400">{role.name}</td>
              <td className="p-5 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-primary border border-blue-100">
                  {role.permissions?.length || 0} Enabled
                </span>
              </td>
              <td className="p-5 text-right space-x-2">
                <Can permissions={[PERMISSIONS.ROLES_UPDATE]}>
                  <button 
                    onClick={() => handleOpenRename(role)}
                    className="text-gray-400 hover:text-primary transition-colors p-2 bg-white border border-gray-100 shadow-sm rounded-lg"
                    title="Rename Role"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </Can>
                <Can permissions={[PERMISSIONS.ROLES_ASSIGN_PERMISSIONS]}>
                  <button 
                    onClick={() => handleOpenEdit(role)}
                    className="text-gray-400 hover:text-green-600 transition-colors p-2 bg-white border border-gray-100 shadow-sm rounded-lg"
                    title="Edit Permissions"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </button>
                </Can>
                <Can permissions={[PERMISSIONS.ROLES_DELETE]}>
                  <button 
                    onClick={() => handleDeleteRole(role)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-white border border-gray-100 shadow-sm rounded-lg"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Can>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Manage Permissions: ${selectedRole ? getRoleDisplayName(selectedRole).toUpperCase() : ''}`}
      >
        <div className="space-y-6">
          <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.id} className="space-y-2">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{group.label}</h5>
                <div className="grid grid-cols-1 gap-2">
                  {group.permissions.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleTogglePermission(key)}
                      disabled={isUpdating}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                        rolePermissions.includes(key)
                          ? 'border-primary bg-blue-50 text-primary'
                          : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <span className="font-bold text-sm tracking-tight">{label}</span>
                      {rolePermissions.includes(key) && <CheckCircle className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-50">
            <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">
              Close
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Update Display Name"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Display Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-900"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Project Managers"
            />
            <p className="text-xs text-gray-500 mt-1">This will change how the role appears in the UI without affecting the internal role key.</p>
          </div>
          <div className="flex space-x-3 pt-4">
            <button onClick={() => setIsRenameModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">
              Cancel
            </button>
            <button
              onClick={handleRenameSave}
              disabled={isUpdating}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/30 hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              <Save className="inline-block w-5 h-5 mr-2 -mt-1" />
              {isUpdating ? 'Updating...' : 'Update Display Name'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleTable;
