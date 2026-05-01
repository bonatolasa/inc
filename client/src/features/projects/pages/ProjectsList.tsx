import React, { useEffect, useState, useCallback } from 'react';
import { projectService } from '../../../services/project.service';
import { teamService } from '../../../services/team.service';
import { Project } from '../../../types/project.types';
import { Team } from '../../../types/team.types';
import { useAuth } from '../../../hooks/useAuth';
import { usePermission } from '../../../hooks/usePermission';
import ProjectCard from '../components/ProjectCard';
import { Loader, Modal, Can } from '../../../common/components';
import { PERMISSIONS } from '../../../config/permissions.config';
import { FolderKanban, Users, Info, PlusCircle } from 'lucide-react';

const ProjectsList = () => {
  const ITEMS_PER_PAGE = 4;
  const { user } = useAuth();
  const { hasRole, hasPermission } = usePermission();
  const currentUserId = (user?._id || (user as any)?.id || '').toString();
  const isTester = hasRole('tester');
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Project['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    team: '',
    status: 'planning',
    deadline: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const projRes = isTester
        ? await projectService.getProjectsByContributor(currentUserId)
        : await projectService.getAllProjects();
      const canListAllTeams =
        hasPermission(PERMISSIONS.TEAMS_VIEW) &&
        hasRole(['admin', 'super_admin', 'project_manager']);
      const teamsRes = canListAllTeams
        ? await teamService.getAllTeams()
        : await teamService.getMyTeams();

      if (projRes.success) setProjects(projRes.data);
      if (teamsRes.success) setTeams(teamsRes.data);
    } catch (error) {
      console.error("Failed to fetch project list data", error);
    } finally {
      setLoading(false);
    }
  }, [hasPermission, hasRole, isTester, currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length, searchTerm, statusFilter]);

  // Set default team if current user is a project_manager and has a team
  useEffect(() => {
    if (isModalOpen && user && user.roles) {
      const userRoles = Array.isArray(user.roles)
        ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
        : [];
      if (userRoles.includes('project_manager') && teams.length > 0) {
        // Optionally pre-select first team
        // setFormData(prev => ({ ...prev, team: teams[0]._id }));
      }
    }
  }, [isModalOpen, user, teams]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.team) {
      alert("A team must be assigned to the project.");
      return;
    }
    if (!formData.deadline) {
      alert("Please set a project deadline.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await projectService.createProject({
        name: formData.name,
        description: formData.description,
        team: formData.team as any,
        status: formData.status as any,
        deadline: new Date(formData.deadline).toISOString() as any,
      });
      
      if (response.success) {
        setIsModalOpen(false);
        setFormData({ name: '', description: '', team: '', status: 'planning', deadline: '' });
        await fetchData();
      }
    } catch (error) {
      console.error("Failed to create project", error);
      alert("Error creating project. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to terminate this project? This will permanently delete all associated tasks.")) return;
    try {
      const response = await projectService.deleteProject(id);
      if (response.success) {
        await fetchData();
      }
    } catch (error) {
      console.error("Project deletion failed", error);
      alert("Unauthorized or dependency conflict: Could not delete project.");
    }
  };

  const filteredProjects = projects.filter((project) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      project.name.toLowerCase().includes(q) ||
      (project.description || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / ITEMS_PER_PAGE));
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center">
            <FolderKanban className="w-7 h-7 mr-3 text-primary" />
            Projects Directory
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Lifecycle management for strategic initiatives.</p>
        </div>
        <Can permissions={[PERMISSIONS.PROJECTS_CREATE]}>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-primary to-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 transform active:scale-95 flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            New Project
          </button>
        </Can>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project name or description..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedProjects.map((project, index) => (
            <ProjectCard 
              key={project._id || `proj-${index}`} 
              project={project} 
              onDelete={handleDelete}
            />
          ))}
          {filteredProjects.length === 0 && (
            <div className="col-span-full p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderKanban className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Projects Found</h3>
              <p className="text-gray-400 text-sm font-medium max-w-xs mx-auto mt-2">
                Begin by initializing a project. Assign a team and a manager to start tracking progress.
              </p>
            </div>
          )}
        </div>
      )}
      {!loading && filteredProjects.length > ITEMS_PER_PAGE && (
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Initialize Strategic Project">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-xs font-bold text-blue-700 leading-relaxed">
              New projects require a dedicated team for execution. Managers are automatically assigned based on your current role profile.
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Project Identifier</label>
            <input 
              type="text" required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-900"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Q3 Infrastructure Overhaul"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Mission Description</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none text-gray-700"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Define project boundaries and objectives..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center">
              <Users className="w-4 h-4 mr-1.5" /> Select Team
            </label>
            <select 
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-700 bg-gray-50"
              value={formData.team}
              onChange={(e) => setFormData({...formData, team: e.target.value})}
            >
              <option value="">Assign to Team</option>
              {teams.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-700 bg-gray-50"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
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
              {isSubmitting ? 'Initializing...' : 'Launch Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsList;
