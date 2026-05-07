import React, { useState, useEffect } from 'react';
import { Modal } from '../../../common/components';
import { type PermissionValue } from '../../../config/permissions.config';
import { PERMISSION_GROUPS, dedupePermissions } from '../../../config/permission-groups.config';
import { Check, Info } from 'lucide-react';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentPermissions: PermissionValue[];
  onSave: (permissions: PermissionValue[]) => Promise<void>;
}

const UserPermissionsModal: React.FC<UserPermissionsModalProps> = ({
  isOpen,
  onClose,
  userName,
  currentPermissions,
  onSave
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionValue[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedPermissions(dedupePermissions(currentPermissions || []));
      setError(null);
    }
  }, [isOpen, currentPermissions]);

  const persistPermissions = async (nextPermissions: PermissionValue[]) => {
    const normalized = dedupePermissions(nextPermissions);
    setSelectedPermissions(normalized);
    setIsSaving(true);
    setError(null);
    try {
      await onSave(normalized);
    } catch (err) {
      setSelectedPermissions(dedupePermissions(currentPermissions || []));
      const message = err instanceof Error ? err.message : 'Failed to save permissions';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePermission = async (permissionKey: PermissionValue) => {
    const nextPermissions = selectedPermissions.includes(permissionKey)
      ? selectedPermissions.filter((p) => p !== permissionKey)
      : [...selectedPermissions, permissionKey];

    await persistPermissions(nextPermissions);
  };

  const handleClose = () => {
    setSelectedPermissions(dedupePermissions(currentPermissions || []));
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Manage Permissions: ${userName}`}>
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-bold mb-1">Hybrid RBAC System</p>
            <p>These are <strong>direct permissions</strong> that will be added to this user's role-based permissions. This allows for exceptions and special access beyond their assigned roles.</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Current Permissions Summary */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <h4 className="text-sm font-bold text-gray-700 mb-2">Currently Assigned Direct Permissions:</h4>
          {selectedPermissions.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No direct permissions assigned. User relies on role permissions only.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedPermissions.map(permission => (
                <span key={permission} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                  {permission}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Permission Groups */}
        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
          {PERMISSION_GROUPS.map((group) => {
            const groupPermissions = group.permissions.map(p => p.key);
            const allSelected = groupPermissions.every(p => selectedPermissions.includes(p));
            const noneSelected = groupPermissions.every(p => !selectedPermissions.includes(p));
            
            return (
              <div key={group.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{group.label}</h3>
                  <div className="flex space-x-2">
                    {!allSelected && (
                      <button
                        onClick={async () => {
                          const permissionsToAdd = groupPermissions.filter(p => !selectedPermissions.includes(p));
                          const nextPermissions = [...selectedPermissions, ...permissionsToAdd];
                          await persistPermissions(nextPermissions);
                        }}
                        className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors disabled:opacity-50"
                        disabled={allSelected || isSaving}
                      >
                        Select All
                      </button>
                    )}
                    {!noneSelected && (
                      <button
                        onClick={async () => {
                          const permissionsToKeep = selectedPermissions.filter(p => !groupPermissions.includes(p));
                          await persistPermissions(permissionsToKeep);
                        }}
                        className="px-3 py-1 text-xs font-medium bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                        disabled={noneSelected || isSaving}
                      >
                        Deselect All
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.permissions.map(({ key, label }) => {
                    const isSelected = selectedPermissions.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => handleTogglePermission(key)}
                        disabled={isSaving}
                        className={
                          `p-3 rounded-lg border-2 text-left transition-all ` +
                          (isSelected
                            ? 'bg-green-50 border-green-300 hover:bg-green-100'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-700">{label}</span>
                          {isSelected && <Check className="w-4 h-4 text-green-600" />}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-mono">{key}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {isSaving && <span className="text-sm font-medium text-gray-500">Saving...</span>}
        </div>
      </div>
    </Modal>
  );
};

export default UserPermissionsModal;
