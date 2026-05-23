import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { taskService } from '../../../services/task.service';
import { projectService } from '../../../services/project.service';
import { Task } from '../../../types/task.types';
import { Project } from '../../../types/project.types';
import { User } from '../../../types/user.types';
import TaskCard from '../components/TaskCard';
import { Loader, Modal, Can } from '../../../common/components';
import { PERMISSIONS } from '../../../config/permissions.config';
import { LayoutGrid, PlusCircle, FolderKanban, Users, Info, Clock, AlertCircle } from 'lucide-react';
import { usePermission } from '../../../hooks/usePermission';
import { useAuth } from '../../../hooks/useAuth';

const TasksList = () => {
  const ITEMS_PER_PAGE = 6;
  const { user, selectedRole } = useAuth();
  const { hasPermission } = usePermission();
  const activeRole = useMemo(() => {
    if (selectedRole) return selectedRole.toLowerCase();
    if (!user?.roles || !Array.isArray(user.roles) || user.roles.length === 0) return '';
    const firstRole = user.roles[0];
    return (typeof firstRole === 'string' ? firstRole : (firstRole as any)?.name || '').toLowerCase();
  }, [selectedRole, user?.roles]);
  const isTeamMember = activeRole === 'team_member';
  const isTester = activeRole === 'tester';
  const isProjectManager = activeRole === 'project_manager';
  const isAdminLike = activeRole === 'admin' || activeRole === 'super_admin';
  const canViewAllTasks = hasPermission(PERMISSIONS.TASKS_VIEW_ALL);
  const canViewAllProjects = hasPermission(PERMISSIONS.PROJECTS_VIEW_ALL);
  const currentUserId = (user?._id || (user as any)?.id || '').toString();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: [] as string[],
    priority: 'medium' as any,
    dueDate: '',
    status: 'pending' as any,
    percentageComplete: 0
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isTester) {
        const [myTasksRes, projectsRes] = await Promise.all([
          taskService.getMyTasks(),
          currentUserId
            ? projectService.getProjectsByContributor(currentUserId)
            : Promise.resolve({ success: true, data: [] as Project[] }),
        ]);

        const assignedProjects = projectsRes.success ? projectsRes.data : [];
        setProjects(assignedProjects);

        const taskResponses = assignedProjects.length
          ? await Promise.all(
              assignedProjects.map((project) => taskService.getTasksByProject(project._id)),
            )
          : [];

        const projectTasks = taskResponses
          .filter((res) => res.success)
          .flatMap((res) => res.data);
        const myTasks = myTasksRes.success ? myTasksRes.data : [];

        const uniqueTasks = Array.from(
          new Map([...myTasks, ...projectTasks].map((t) => [t._id, t])).values(),
        );
        setTasks(uniqueTasks);
      } else if (isTeamMember) {
        const [tasksRes, projectsRes] = await Promise.all([
          taskService.getMyTasks(),
          currentUserId
            ? projectService.getProjectsByContributor(currentUserId)
            : Promise.resolve({ success: true, data: [] as Project[] }),
        ]);

        if (tasksRes.success) setTasks(tasksRes.data);
        if (projectsRes.success) setProjects(projectsRes.data);
      } else if (canViewAllTasks) {
        const [tasksRes, projectsRes] = await Promise.all([
          taskService.getAllTasks(),
          canViewAllProjects
            ? projectService.getAllProjects()
            : Promise.resolve({ success: true, data: [] as Project[] }),
        ]);

        if (tasksRes.success) setTasks(tasksRes.data);
        if (projectsRes.success) setProjects(projectsRes.data);
      } else if (isProjectManager) {
        const [myTasksRes, projectsRes] = await Promise.all([
          taskService.getMyTasks(),
          currentUserId
            ? projectService.getProjectsByManager(currentUserId)
            : Promise.resolve({ success: true, data: [] as Project[] }),
        ]);

        const managedProjects = projectsRes.success ? projectsRes.data : [];
        setProjects(managedProjects);

        const taskResponses = managedProjects.length
          ? await Promise.all(
              managedProjects.map((project) => taskService.getTasksByProject(project._id)),
            )
          : [];

        const projectTasks = taskResponses
          .filter((res) => res.success)
          .flatMap((res) => res.data);
        const myTasks = myTasksRes.success ? myTasksRes.data : [];

        const uniqueTasks = Array.from(
          new Map([...myTasks, ...projectTasks].map((t) => [t._id, t])).values(),
        );
        setTasks(uniqueTasks);
      } else {
        const tasksRes = await taskService.getMyTasks();
        if (tasksRes.success) setTasks(tasksRes.data);
        setProjects([]);
      }
    } catch (error) {
      console.error("Failed to fetch task related data", error);
    } finally {
      setLoading(false);
    }
  }, [isTester, isTeamMember, isProjectManager, isAdminLike, canViewAllTasks, canViewAllProjects, currentUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tasks.length, searchTerm, statusFilter]);

  // Dynamic filtering: when project selection changes, update available team members
  useEffect(() => {
    if (formData.projectId) {
      const selectedProject = projects.find(p => p._id === formData.projectId);
      const projectMembers = (selectedProject?.team as any)?.members || [];
      setFilteredMembers(projectMembers);
    } else {
      setFilteredMembers([]);
    }
  }, [formData.projectId, projects]);

  const handleToggleAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  const handleOpenCreate = () => {
    setEditMode(false);
    setCurrentTaskId(null);
    setFormData({ 
        title: '', description: '', projectId: '', assignedTo: [], 
        priority: 'medium', dueDate: '', status: 'pending', percentageComplete: 0 
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditMode(true);
    setCurrentTaskId(task._id);
    const pId = task.project && typeof task.project === 'object' ? (task.project as any)._id : task.project;
    setFormData({
      title: task.title,
      description: task.description || '',
      projectId: pId,
      assignedTo: task.assignedTo.map((u: any) => (typeof u === 'string' ? u : u._id)),
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      status: task.status,
      percentageComplete: task.percentageComplete || 0
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await taskService.deleteTask(id);
      if (res.success) await fetchData();
    } catch (error) {
       alert("Failed to delete task.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editMode && currentTaskId && isTeamMember) {
      setIsSubmitting(true);
      try {
        await taskService.updateTaskProgress(currentTaskId, formData.percentageComplete);
        setIsModalOpen(false);
        await fetchData();
      } catch (error) {
        console.error("Progress update failed", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (formData.assignedTo.length === 0) {
      alert("Please select at least one assignee.");
      return;
    }

    const taskPayload = {
      title: formData.title,
      description: formData.description || undefined,
      project: formData.projectId,
      assignedTo: formData.assignedTo,
      status: formData.status,
      priority: formData.priority,
      dueDate: new Date(formData.dueDate),
      percentageComplete: formData.percentageComplete,
    };

    setIsSubmitting(true);
    try {
      if (editMode && currentTaskId) {
        await taskService.updateTask(currentTaskId, taskPayload);
      } else {
        await taskService.createTask(taskPayload);
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error("Operation failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const q = searchTerm.trim().toLowerCase();
    const projectName = task.project && typeof task.project === 'object' ? task.project.name : '';
    const matchesSearch =
      !q ||
      task.title.toLowerCase().includes(q) ||
      (task.description || '').toLowerCase().includes(q) ||
      projectName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE));
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
            <LayoutGrid className="w-8 h-8 mr-3 text-primary" />
            Task Management Board
          </h1>
          <p className="text-gray-500 font-medium mt-1">Full lifecycle oversight for task deliverables.</p>
        </div>
        <Can permissions={[PERMISSIONS.TASKS_CREATE]}>
          <button 
            onClick={handleOpenCreate}
            className="bg-primary text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add Task
          </button>
        </Can>
      </div>
      <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, project, description..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 px-1">
          {paginatedTasks.map((task, index) => (
            <TaskCard 
              key={task._id || `task-${index}`} 
              task={task} 
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
          {filteredTasks.length === 0 && (
            <div className="col-span-full p-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <AlertCircle className="w-8 h-8 text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">No tasks active.</h2>
            </div>
          )}
        </div>
      )}
      {!loading && filteredTasks.length > ITEMS_PER_PAGE && (
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editMode ? (isTeamMember ? 'Update Progress' : 'Modify Task Parameters') : 'Create Project Task'}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {editMode && isTeamMember ? (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
                <span>Execution Progress</span>
                <span className="text-primary">{formData.percentageComplete}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                value={formData.percentageComplete}
                onChange={(e) => setFormData({ ...formData, percentageComplete: parseInt(e.target.value) })}
              />
            </div>
          ) : (
            <>
              <div className="bg-blue-50/50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100 mb-2">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-xs font-bold text-blue-700 leading-relaxed">
                  Tasks can only be assigned to members of the selected project team. Select a project first, then assign one or more team members.
                </p>
              </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Task Title</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-gray-900 bg-gray-50/30"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Task Description</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-gray-900 bg-gray-50/30 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the task, goals, or acceptance criteria"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Select Project</label>
                <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary bg-gray-50 font-bold text-gray-700 outline-none"
                    value={formData.projectId}
                    onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    required
                    disabled={editMode}
                >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary bg-gray-50 font-bold text-gray-700 outline-none capitalize"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 capitalize">Priority</label>
              <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary bg-gray-50 font-bold text-gray-700 outline-none"
                value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as any})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 capitalize">Due Date</label>
              <input type="date" required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary bg-gray-50 font-bold text-gray-700 outline-none"
                value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
            </div>
          </div>

          {editMode && (
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
                      <span>Execution Progress</span>
                      <span className="text-primary">{formData.percentageComplete}%</span>
                  </label>
                  <input type="range" min="0" max="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" 
                    value={formData.percentageComplete} onChange={(e) => setFormData({...formData, percentageComplete: parseInt(e.target.value)})} />
              </div>
          )}

          <div>
             <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
               <Users className="w-4 h-4 mr-2" /> Assign Team Member
             </label>
             <select
               value={formData.assignedTo[0] || ''}
               onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value ? [e.target.value] : [] })}
               disabled={!formData.projectId || filteredMembers.length === 0}
               required
               className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
             >
               <option value="" disabled>
                 {filteredMembers.length === 0 ? 'Select a project to load members' : 'Select a team member'}
               </option>
               {filteredMembers.map((member: User) => (
                 <option key={member._id} value={member._id}>
                   {member.name} — {member.email}
                 </option>
               ))}
             </select>
             {!formData.projectId && (
               <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                 Select a project first to load its team members.
               </p>
             )}
          </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full sm:flex-1 px-6 py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="w-full sm:flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50">
              {isSubmitting ? 'Processing...' : (editMode ? (isTeamMember ? 'Update Progress' : 'Commit Changes') : 'Initialize Task')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksList;
