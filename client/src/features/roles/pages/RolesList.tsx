import React, { useEffect, useState, useCallback } from 'react';
import { roleService } from '../../../services/role.service';
import { Role } from '../../../types/user.types';
import RoleTable from '../components/RoleTable';
import { Loader, Modal, Can } from '../../../common/components';
import { PlusCircle, Shield } from 'lucide-react';

const RolesList = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await roleService.getAllRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setIsSubmitting(true);
    try {
      const response = await roleService.createRole({
        name: formData.name.toLowerCase().replace(' ', '_'),
        description: formData.description
      });
      if (response.success) {
        setIsModalOpen(false);
        setFormData({ name: '', description: '' });
        fetchRoles();
      }
    } catch (error) {
      console.error("Failed to create role", error);
      alert("Error: Role name might already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
            <Shield className="w-7 h-7 mr-3 text-primary" />
            Roles & Permissions
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Configure system-wide authority and access levels.</p>
        </div>
        <Can roles={['super_admin']}>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform active:scale-95 flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            New Role
          </button>
        </Can>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <RoleTable roles={roles} onRefresh={fetchRoles} />
        </div>
      )}

      {/* Create Role Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Custom System Role"
      >
        <form onSubmit={handleCreateRole} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Role Identifier</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Lead Tester"
            />
            <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Slug will be generated automatically (e.g. lead_tester)</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Purpose/Description</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what this role manages..."
            />
          </div>
          <div className="pt-4 flex space-x-3">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Finalize Role'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RolesList;
