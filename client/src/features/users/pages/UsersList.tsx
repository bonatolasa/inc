import React, { useEffect, useMemo, useState } from 'react';
import { userService } from '../../../services/user.service';
import { roleService } from '../../../services/role.service';
import { User, Role } from '../../../types/user.types';
import { getRoleDisplayName } from '../../../utils/roles';
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
  const [searchName, setSearchName] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Registration form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'team_member'
  });

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const nameMatch = searchName.trim()
        ? [user.name, user.email]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(searchName.trim().toLowerCase()))
        : true;

      const roleMatch = filterRole !== 'all'
        ? (user.roles || []).some((role) => {
            const roleName = typeof role === 'string' ? role : role.name;
            return roleName?.toLowerCase() === filterRole.toLowerCase();
          })
        : true;

      return nameMatch && roleMatch;
    });
  }, [users, searchName, filterRole]);

  const displayTotalUsers = searchName || filterRole !== 'all' ? filteredUsers.length : totalUsers;
  const totalPages = Math.max(1, Math.ceil(displayTotalUsers / limit));

  const fetchData = async (
    targetPage: number = page,
    filters?: { name?: string; role?: string },
  ) => {
    setLoading(true);
    try {
      const usersRes = await userService.getAllUsers(targetPage, limit, {
        name: filters?.name ?? (searchName || undefined),
        role: filters?.role ?? (filterRole !== 'all' ? filterRole : undefined),
      });
      if (usersRes.success) {
        setUsers(usersRes.data || []);
        setTotalUsers(usersRes.total || usersRes.data?.length || 0);
        setPage(usersRes.page || targetPage);
      }

      try {
        const rolesRes = await roleService.getAllRoles();
        if (rolesRes.success) setRoles(rolesRes.data || []);
      } catch (rolesError: any) {
        const status = rolesError?.response?.status;
        if (status === 403) {
          // Some roles can manage users but are not allowed to list all roles.
          setRoles([]);
        } else {
          console.error('Failed to fetch roles for user form', rolesError);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user list data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  // Triggered when search or role filter is applied
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    fetchData(1, { name: searchName, role: filterRole });
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await userService.inviteUser({
        name: formData.name,
        email: formData.email,
        roles: [formData.role]
      });
      
      if (response.success) {
        if (!response.inviteEmailSent) {
          alert('User invited, but email was not sent. Configure SMTP on the server to send invite emails.');
        }
        setIsModalOpen(false);
        setFormData({ name: '', email: '', role: 'team_member' });
        fetchData(page); // Refresh list
      }
    } catch (error) {
      const err = error as any;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send invitation.';
      alert(`Invite failed: ${message}`);
      console.error('Invite failed:', err?.response?.data || err);
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

      {/* Search and filter toolbar */}
      <form onSubmit={handleSearch} className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name"
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <select
          value={filterRole}
          onChange={(e) => {
            const selectedRole = e.target.value;
            setFilterRole(selectedRole);
            setPage(1);
            fetchData(1, { name: searchName, role: selectedRole });
          }}
          className="px-4 py-2 rounded-xl border border-gray-200 bg-white"
        >
          <option value="all">All roles</option>
          {roles.map((r) => (
            <option key={r._id} value={r.name}>{getRoleDisplayName(r)}</option>
          ))}
        </select>
        <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white font-bold">Search</button>
        <button
          type="button"
          onClick={() => {
            setSearchName('');
            setFilterRole('all');
            setPage(1);
            fetchData(1, { name: '', role: 'all' });
          }}
          className="px-4 py-2 rounded-xl border border-gray-200"
        >
          Clear
        </button>
      </form>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border overflow-hidden">
            <UserTable users={filteredUsers} roles={roles} onRefresh={() => fetchData(page)} />
          </div>

          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-600 font-medium">
              Showing page {page} of {totalPages} ({displayTotalUsers} users)
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
              {roles.map((role) => (
                <option key={role._id} value={role.name}>
                  {getRoleDisplayName(role)}
                </option>
              ))}
               {roles.length === 0 && (
                 <>
                   <option value="team_member">{getRoleDisplayName('team_member')}</option>
                   <option value="project_manager">{getRoleDisplayName('project_manager')}</option>
                   <option value="admin">{getRoleDisplayName('admin')}</option>
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
            The invited user will receive an email with a secure link to set their password.
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default UsersList;
