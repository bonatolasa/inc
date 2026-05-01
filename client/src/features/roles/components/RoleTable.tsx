import React, { useState } from 'react';
import { Role } from '../../../types/user.types';
import { Modal, Can } from '../../../common/components';
import { roleService } from '../../../services/role.service';
import { PERMISSIONS } from '../../../config/permissions.config';
import { CheckCircle, ShieldCheck, Trash2, Edit3, Save } from 'lucide-react';

interface RoleTableProps {
  roles: Role[];
  onRefresh: () => void;
}

const RoleTable: React.FC<RoleTableProps> = ({ roles, onRefresh }) => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  
  // For Renaming
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setRolePermissions(role.permissions || []);
    setIsModalOpen(true);
  };

  const handleOpenRename = (role: Role) => {
    setSelectedRole(role);
    setNewName(role.name);
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
    if (!selectedRole || !newName) return;
    setIsUpdating(true);
    try {
      const response = await roleService.renameRole(selectedRole.name, newName);
      if (response.success) {
        setIsRenameModalOpen(false);
        onRefresh();
      }
    } catch (error) {
       console.error("Rename failed", error);
    } finally {
       setIsUpdating(false);
    }
  };

  const allAvailablePermissions = Object.values(PERMISSIONS);

  const handleTogglePermission = (perm: string) => {
    if (rolePermissions.includes(perm)) {
      setRolePermissions(rolePermissions.filter(p => p !== perm));
    } else {
      setRolePermissions([...rolePermissions, perm]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsUpdating(true);
    try {
      const originalPerms = selectedRole.permissions || [];
      const toAdd = rolePermissions.filter(p => !originalPerms.includes(p));
      const toRemove = originalPerms.filter(p => !rolePermissions.includes(p));

      if (toRemove.length > 0) {
        await roleService.removePermissionsFromRole(selectedRole.name, toRemove);
      }
      if (toAdd.length > 0) {
        await roleService.addPermissionsToRole(selectedRole.name, toAdd);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Failed to update permissions", error);
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
              <td className="p-5 font-black text-gray-900 capitalize">{role.name.replace('_', ' ')}</td>
              <td className="p-5 font-mono text-xs text-gray-400">{role.name}</td>
              <td className="p-5 text-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-primary border border-blue-100">
                  {role.permissions?.length || 0} Enabled
                </span>
              </td>
              <td className="p-5 text-right space-x-2">
                <button 
                  onClick={() => handleOpenRename(role)}
                  className="text-gray-400 hover:text-primary transition-colors p-2 bg-white border border-gray-100 shadow-sm rounded-lg"
                  title="Rename Role"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleOpenEdit(role)}
                  className="text-gray-400 hover:text-green-600 transition-colors p-2 bg-white border border-gray-100 shadow-sm rounded-lg"
                  title="Edit Permissions"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <Can roles={['super_admin']}>
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

      {/* Permissions Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Edit Permissions: ${selectedRole?.name.replace('_', ' ').toUpperCase()}`}
      >
        <div className="space-y-6">
          <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
            {['users', 'teams', 'projects', 'tasks', 'roles'].map(category => (
              <div key={category} className="space-y-2">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{category}</h5>
                <div className="grid grid-cols-1 gap-2">
                  {allAvailablePermissions
                    .filter(p => p.startsWith(category))
                    .map(perm => (
                      <button
                        key={perm}
                        onClick={() => handleTogglePermission(perm)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all ${
                          rolePermissions.includes(perm)
                            ? 'border-primary bg-blue-50 text-primary'
                            : 'border-gray-50 bg-gray-50 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                        <span className="font-bold text-sm tracking-tight">{perm}</span>
                        {rolePermissions.includes(perm) && <CheckCircle className="w-5 h-5" />}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-50">
            <button onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">
              Cancel
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={isUpdating}
              className="flex-1 bg-gradient-to-r from-primary to-blue-600 text-white py-3 rounded-xl font-black shadow-lg shadow-primary/30 hover:shadow-blue-200 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="inline-block w-5 h-5 mr-2 -mt-1" />
              {isUpdating ? 'Saving...' : 'Sync Permissions'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename System Role"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">New Role Name</label>
            <input 
              type="text" 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-900"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Lead Developer"
            />
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
              {isUpdating ? 'Renaming...' : 'Apply Name'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoleTable;
