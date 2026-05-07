import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamService } from '../../../services/team.service';
import { userService } from '../../../services/user.service';
import { Team } from '../../../types/team.types';
import { User } from '../../../types/user.types';
import { Loader, Modal } from '../../../common/components';
import { Users, Mail, Shield, ArrowLeft, Edit3, UserPlus, Info } from 'lucide-react';
import { usePermission } from '../../../hooks/usePermission';

const TeamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const { hasRole } = usePermission();
  const isTeamMember = hasRole('team_member');

  const fetchTeamData = useCallback(async () => {
    if (!id) return;
    try {
      const response = await teamService.getTeamById(id);
      if (response.success) {
        setTeam(response.data);
        setEditData({ 
          name: response.data.name, 
          description: response.data.description || '' 
        });
      }
    } catch (error) {
      console.error("Failed to fetch team details", error);
    }
  }, [id]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userService.getAllUsers();
      if (response.success) {
        setAllUsers(response.data);
        if (response.data.length > 0) setSelectedUserId(response.data[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTeamData(), fetchUsers()]);
      setLoading(false);
    };
    init();
  }, [fetchTeamData, fetchUsers]);

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      const response = await teamService.updateTeam(id, editData);
      if (response.success) {
        setIsEditModalOpen(false);
        await fetchTeamData();
      }
    } catch (error) {
      console.error("Update failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedUserId) return;
    setIsSubmitting(true);
    try {
      const response = await teamService.addMember(id, selectedUserId);
      if (response.success) {
        setIsAddMemberModalOpen(false);
        await fetchTeamData();
      }
    } catch (error) {
      console.error("Failed to add member", error);
      alert("User might already be in the team.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!team) return <div className="p-8 text-center text-red-500 font-bold">Team not found.</div>;

  return (
    <div className="space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-primary transition-colors font-bold group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Teams
      </button>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-blue-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{team.name}</h1>
            <p className="text-gray-500 font-medium mt-1">{team.description || 'No description provided.'}</p>
          </div>
        </div>
        {!isTeamMember && (
          <div className="flex space-x-3">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center bg-blue-50 text-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary hover:text-white transition-all"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Team
            </button>
            <button 
              onClick={() => setIsAddMemberModalOpen(true)}
              className="flex items-center bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-black"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
              <Users className="w-5 h-5 mr-3 text-primary" />
              Team Members
            </h3>
            <div className="divide-y divide-gray-50">
              {(team.members as User[] || []).map((member) => (
                <div key={member._id} className="py-4 flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-400 group-hover:bg-blue-50 group-hover:text-primary transition-colors">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{member.name}</p>
                      <div className="flex items-center text-xs text-gray-400 font-medium">
                        <Mail className="w-3 h-3 mr-1" />
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {(member.roles as any[] || []).map((role, index) => (
                      <span key={`${member._id}-${typeof role === 'string' ? role : (role?._id || role?.name || index)}`} className="px-2 py-0.5 bg-gray-50 text-gray-400 rounded text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                        {typeof role === 'string' ? role : role.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {(!team.members || team.members.length === 0) && (
                <p className="text-gray-400 text-sm font-medium py-4">No members assigned to this team.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
            <h4 className="text-lg font-bold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-400" />
              Authority Overview
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 font-medium">
              This team operates under standard departmental protocols. Permission inheritance is managed via the Role Matrix.
            </p>
            <div className="space-y-3">
               <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Member Count</span>
                 <span className="text-white">{team.members?.length || 0}</span>
               </div>
               <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-blue-400 h-full w-full"></div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Team Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Update Team Configuration"
      >
        <form onSubmit={handleUpdateTeam} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Team Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
              value={editData.name}
              onChange={(e) => setEditData({...editData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none"
              value={editData.description}
              onChange={(e) => setEditData({...editData, description: e.target.value})}
            />
          </div>
          <div className="pt-4 flex space-x-3">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Update Details'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal 
        isOpen={isAddMemberModalOpen} 
        onClose={() => setIsAddMemberModalOpen(false)} 
        title="Onboard Team Member"
      >
        <form onSubmit={handleAddMember} className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-xs font-bold text-blue-700 leading-relaxed">
              Select a user to add to this team. They will inherit the team's project permissions.
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Select User</label>
            <select 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold text-gray-700 bg-gray-50"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {allUsers.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          <div className="pt-2 flex space-x-3">
            <button type="button" onClick={() => setIsAddMemberModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50">
              {isSubmitting ? 'Adding...' : 'Confirm Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeamDetails;
