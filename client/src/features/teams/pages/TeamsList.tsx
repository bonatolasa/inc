import React, { useEffect, useState } from 'react';
import { teamService } from '../../../services/team.service';
import { userService } from '../../../services/user.service';
import { Team } from '../../../types/team.types';
import { User } from '../../../types/user.types';
import TeamCard from '../components/TeamCard';
import { Loader, Modal, Can } from '../../../common/components';
import { PERMISSIONS } from '../../../config/permissions.config';
import { PlusCircle, Info, Users } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const TeamsList = () => {
  const ITEMS_PER_PAGE = 6;
  const { user, selectedRole } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [testers, setTesters] = useState<User[]>([]);
  const [userLoadError, setUserLoadError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manager: '',
    members: [] as string[],
    testers: [] as string[],
  });
  const firstUserRole = Array.isArray(user?.roles)
    ? (typeof user.roles[0] === 'string' ? user.roles[0] : (user.roles[0] as any)?.name)
    : '';
  const activeRole = (selectedRole || firstUserRole || '').toLowerCase();
  const isAdminLike = activeRole === 'admin' || activeRole === 'super_admin';
  const isProjectManager = activeRole === 'project_manager';
  const currentUserId = (user?._id || (user as any)?.id || '').toString();

  const fetchTeams = async () => {
    setLoading(true);
    try {
      let response;
      try {
        response = await teamService.getAllTeams();
      } catch {
        response = await teamService.getMyTeams();
      }
      if (response.success) {
        setTeams(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch teams", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [teams.length, searchTerm]);

  useEffect(() => {
    const fetchAssignableUsers = async () => {
      try {
        const [managerRes, memberRes, testerRes] = await Promise.all([
          userService.getUsersByRole('project_manager'),
          userService.getUsersByRole('team_member'),
          userService.getUsersByRole('tester'),
        ]);

        if (managerRes.success) {
          const managerUsers = managerRes.data || [];
          setManagers(isAdminLike ? managerUsers : managerUsers.filter((u) => (u._id || (u as any).id) === currentUserId));
        }
        if (memberRes.success) setTeamMembers(memberRes.data || []);
        if (testerRes.success) setTesters(testerRes.data || []);
      } catch (error) {
        console.error("Failed to fetch assignable users", error);
        setUserLoadError('Could not load users by role. Please check your permissions.');
      }
    };

    fetchAssignableUsers();
  }, [isAdminLike, currentUserId]);

  useEffect(() => {
    if (isProjectManager && currentUserId) {
      setFormData((prev) => ({ ...prev, manager: currentUserId }));
    }
  }, [isProjectManager, currentUserId]);

  const handleCheckboxToggle = (
    userId: string,
    field: 'members' | 'testers',
  ) => {
    setFormData((prev) => {
      const exists = prev[field].includes(userId);
      const nextValues = exists
        ? prev[field].filter((id) => id !== userId)
        : [...prev[field], userId];
      return { ...prev, [field]: nextValues };
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (!formData.manager && !isProjectManager) {
      alert('Please select a project manager.');
      return;
    }
    if (formData.members.length < 1) {
      alert('Please select at least one team member.');
      return;
    }
    if (formData.testers.length < 1) {
      alert('Please select at least one tester.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const combinedMembers = Array.from(new Set([...formData.members, ...formData.testers]));
      const response = await teamService.createTeam({
        name: formData.name,
        description: formData.description,
        manager: (isProjectManager ? currentUserId : formData.manager) as any,
        members: combinedMembers as any,
      });
      
      if (response.success) {
        setIsModalOpen(false);
        setFormData({ name: '', description: '', manager: '', members: [], testers: [] });
        fetchTeams();
      }
    } catch (error) {
      console.error("Failed to create team", error);
      alert("Error: Team name might already be taken or server error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTeams = teams.filter((team) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const managerName = typeof team.manager === 'object' ? team.manager.name : '';
    return (
      team.name.toLowerCase().includes(q) ||
      (team.description || '').toLowerCase().includes(q) ||
      managerName.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredTeams.length / ITEMS_PER_PAGE));
  const paginatedTeams = filteredTeams.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
            <Users className="w-7 h-7 mr-3 text-primary" />
            Teams Directory
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Manage organizational units and department structures.</p>
        </div>
        <Can roles={['admin', 'super_admin', 'project_manager']} permissions={[PERMISSIONS.TEAMS_CREATE]}>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform active:scale-95 flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            New Team
          </button>
        </Can>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search teams by name, manager, description..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
        />
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedTeams.map((team, index) => (
            <TeamCard key={team._id || `team-${index}`} team={team} />
          ))}
          {filteredTeams.length === 0 && (
            <div className="col-span-full p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Teams Found</h3>
              <p className="text-gray-400 text-sm font-medium max-w-xs mx-auto mt-2">
                Begin by creating your first organizational team to manage projects and members.
              </p>
            </div>
          )}
        </div>
      )}
      {!loading && filteredTeams.length > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-700 disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${
                currentPage === page
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Team Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Initialize New Team"
      >
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-xs font-bold text-blue-700 leading-relaxed">
              Project manager can create team by selecting one manager, at least one team member, and at least one tester.
            </p>
          </div>

          {userLoadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
              {userLoadError}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Team Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-900"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Frontend Engineering"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none text-gray-700"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Primary responsibilities of this team..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Project Manager</label>
            {isAdminLike ? (
              <select
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-700 bg-white"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              >
                <option value="">Select project manager</option>
                {managers.map((pm) => {
                  const pmId = pm._id || (pm as any).id;
                  return (
                    <option key={pmId} value={pmId}>
                      {pm.name} ({pm.email})
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium">
                {user?.name || 'Current User'} ({user?.email || 'project_manager'})
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Team Members (select at least one)</label>
            <details className="border border-gray-200 rounded-xl bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Choose Team Members</span>
                <span className="text-xs text-primary font-bold">{formData.members.length} selected</span>
              </summary>
              <div className="px-4 pb-3 max-h-[180px] overflow-y-auto space-y-2 border-t border-gray-100">
                {teamMembers.map((member) => {
                  const memberId = member._id || (member as any).id;
                  return (
                    <label key={memberId} className="flex items-center gap-2 text-sm text-gray-700 pt-2">
                      <input
                        type="checkbox"
                        checked={formData.members.includes(memberId)}
                        onChange={() => handleCheckboxToggle(memberId, 'members')}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{member.name} ({member.email})</span>
                    </label>
                  );
                })}
              </div>
            </details>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Testers (select at least one)</label>
            <details className="border border-gray-200 rounded-xl bg-white">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-700 flex items-center justify-between">
                <span>Choose Testers</span>
                <span className="text-xs text-primary font-bold">{formData.testers.length} selected</span>
              </summary>
              <div className="px-4 pb-3 max-h-[180px] overflow-y-auto space-y-2 border-t border-gray-100">
                {testers.map((tester) => {
                  const testerId = tester._id || (tester as any).id;
                  return (
                    <label key={testerId} className="flex items-center gap-2 text-sm text-gray-700 pt-2">
                      <input
                        type="checkbox"
                        checked={formData.testers.includes(testerId)}
                        onChange={() => handleCheckboxToggle(testerId, 'testers')}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{tester.name} ({tester.email})</span>
                    </label>
                  );
                })}
              </div>
            </details>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="pt-2 flex space-x-3">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all font-black"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save & Confirm'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamsList;
