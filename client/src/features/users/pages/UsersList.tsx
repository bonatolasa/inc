import React, { useEffect, useState } from 'react';
import { userService } from '../../../services/user.service';
import { roleService } from '../../../services/role.service';
import { User, Role } from '../../../types/user.types';
import UserTable from '../components/UserTable';
import { Loader, Modal, Can } from '../../../common/components';
import { PERMISSIONS } from '../../../config/permissions.config';

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Registration form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password123!', // Default password for new invites
    role: 'team_member'
  });

  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));

  const fetchData = async (targetPage: number = page) => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userService.getAllUsers(targetPage, limit),
        roleService.getAllRoles()
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data || []);
        setTotalUsers(usersRes.total || usersRes.data?.length || 0);
        setPage(usersRes.page || targetPage);
      }
      if (rolesRes.success) setRoles(rolesRes.data);
    } catch (error) {
      console.error("Failed to fetch user list data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await userService.createUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roles: [formData.role]
      });
      
      if (response.success) {
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: 'Password123!', role: 'team_member' });
        fetchData(page); // Refresh list
      }
    } catch (error) {
      alert("Error creating user. Check console for details.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Manage Users</h1>
        <Can roles={['admin', 'super_admin']} permissions={[PERMISSIONS.USERS_CREATE]}>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform active:scale-95"
          >
            + Invite User
          </button>
        </Can>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
            <UserTable users={users} roles={roles} onRefresh={() => fetchData(page)} />
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">
              Showing page {page} of {totalPages} ({totalUsers} users)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Invite New User"
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter user's name"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Assigned Role</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-700 bg-gray-50"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              {roles.map(role => (
                <option key={role._id} value={role.name}>
                  {role.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
               {roles.length === 0 && (
                 <>
                   <option value="team_member">Team Member</option>
                   <option value="project_manager">Project Manager</option>
                   <option value="admin">System Admin</option>
                 </>
               )}
            </select>
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-xl font-black hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Inviting...' : 'Send Invitation'}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center font-medium">
            Temporary password: <span className="font-bold">Password123!</span> (User should change this on first login)
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default UsersList;
