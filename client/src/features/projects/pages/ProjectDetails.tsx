import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../../../services/project.service';
import { taskService } from '../../../services/task.service';
import { Project } from '../../../types/project.types';
import { Task } from '../../../types/task.types';
import { User } from '../../../types/user.types';
import { Loader, Modal, Can } from '../../../common/components';
import { PERMISSIONS } from '../../../config/permissions.config';
import { FolderKanban, Calendar, ArrowLeft, CheckCircle2, PlusCircle, Settings, Info, Users, Edit3, Trash2 } from 'lucide-react';
import { getStatusColor, formatDate } from '../../../utils/formatters';
import { usePermission } from '../../../hooks/usePermission';

const ProjectDetails = () => {
  const { hasRole } = usePermission();
  const isTeamMember = hasRole('team_member');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // Form states
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    priority: 'medium' as any,
    dueDate: '',
    assignedTo: [] as string[],
    status: 'pending' as any,
    percentageComplete: 0
  });

  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    status: 'planned' as any
  });

  const fetchProjectData = useCallback(async () => {
    if (!id) return;
    try {
      const [projRes, tasksRes] = await Promise.all([
        projectService.getProjectById(id),
        taskService.getTasksByProject(id)
      ]);
      
      if (projRes.success) {
        setProject(projRes.data);
        setProjectData({
          name: projRes.data.name,
          description: projRes.data.description || '',
          status: projRes.data.status
        });
      }
      if (tasksRes.success) setTasks(tasksRes.data);
    } catch (error) {
      console.error("Failed to fetch project details", error);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProjectData();
      setLoading(false);
    };
    init();
  }, [fetchProjectData]);

  const handleToggleAssignee = (userId: string) => {
    setTaskData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  const handleOpenCreateTask = () => {
    setEditMode(false);
    setCurrentTaskId(null);
    setTaskData({ title: '', description: '', priority: 'medium', dueDate: '', assignedTo: [], status: 'pending', percentageComplete: 0 });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditMode(true);
    setCurrentTaskId(task._id);
    setTaskData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assignedTo: task.assignedTo.map(u => u._id),
        status: task.status,
        percentageComplete: task.percentageComplete || 0
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await taskService.deleteTask(taskId);
      if (res.success) await fetchProjectData();
    } catch (error) {
      console.error("Task deletion failed", error);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (editMode && currentTaskId && isTeamMember) {
      setIsSubmitting(true);
      try {
        await taskService.updateTaskProgress(currentTaskId, taskData.percentageComplete);
        setIsTaskModalOpen(false);
        await fetchProjectData();
      } catch (error) {
        console.error("Task progress update failed", error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (taskData.assignedTo.length === 0) {
      alert("Please select at least one assignee.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editMode && currentTaskId) {
          await taskService.updateTask(currentTaskId, { ...taskData, project: id as any } as any);
      } else {
          await taskService.createTask({ ...taskData, project: id as any } as any);
      }
      setIsTaskModalOpen(false);
      await fetchProjectData();
    } catch (error) {
      console.error("Task persistence failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setIsSubmitting(true);
    try {
      const response = await projectService.updateProject(id, projectData);
      if (response.success) {
        setIsSettingsModalOpen(false);
        await fetchProjectData();
      }
    } catch (error) {
      console.error("Project update failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (!project) return <div className="p-8 text-center text-red-500 font-bold">Project not found.</div>;

  const teamMembers = (project.team as any)?.members || [];

  return (
    <div className="space-y-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-primary transition-colors font-bold group"
      >
        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Projects
      </button>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center shadow-sm">
              <FolderKanban className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{project.name}</h1>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(project.status).replace('bg-', 'bg-opacity-20 bg-')}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
          </div>
           <div className="flex space-x-3">
             <Can roles={['super_admin', 'admin', 'project_manager']} permissions={[PERMISSIONS.PROJECTS_UPDATE]}>
                 <button
                     onClick={() => setIsSettingsModalOpen(true)}
                     className="flex items-center bg-blue-50 text-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary hover:text-white transition-all"
                 >
                     <Settings className="w-4 h-4 mr-2" />
                     Settings
                 </button>
             </Can>
             <Can roles={['super_admin', 'admin', 'project_manager']} permissions={[PERMISSIONS.TASKS_CREATE]}>
                <button 
                    onClick={handleOpenCreateTask}
                    className="flex items-center bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-black"
                >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Task
                </button>
            </Can>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Timeline</p>
            <div className="flex items-center text-gray-900 font-bold">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              {formatDate(project.startDate)} - {formatDate(project.deadline)}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Progress</p>
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-white h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-1000" style={{ width: `${project.progress || 0}%` }}></div>
              </div>
              <span className="font-black text-primary">{project.progress || 0}%</span>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Execution Team</p>
            <div className="flex items-center text-gray-900 font-bold">
              <Users className="w-4 h-4 mr-2 text-primary" />
              {(project.team as any)?.name || 'N/A'} ({(project.team as any)?.members?.length || 0} members)
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-3 text-primary" />
          Project Tasks ({tasks.length})
        </h3>
        <div className="space-y-3">
          {tasks.map(task => (
            <div 
              key={task._id} 
              onClick={() => navigate(`/tasks/${task._id}`)}
              className="p-4 bg-gray-50 rounded-xl flex items-center justify-between hover:bg-blue-50/50 transition-all group border border-transparent hover:border-blue-100 cursor-pointer"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-10 rounded-full ${task.priority === 'high' || task.priority === 'critical' ? 'bg-red-400' : 'bg-blue-400'}`}></div>
                <div>
                  <p className="font-bold text-gray-800">{task.title}</p>
                  <p className="text-xs text-gray-400 font-medium">
                    Due {formatDate(task.dueDate)} • {Array.isArray(task.assignedTo) ? `${task.assignedTo.length} Assignees` : 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Can roles={['admin', 'super_admin', 'project_manager']}>
                           <button onClick={(e) => { e.stopPropagation(); handleOpenEditTask(task); }} className="p-1.5 text-gray-400 hover:text-primary hover:bg-white rounded-lg">
                               <Edit3 className="w-4 h-4" />
                           </button>
                       </Can>
                       <Can roles={['team_member']}>
                           <button onClick={(e) => { e.stopPropagation(); handleOpenEditTask(task); }} className="px-3 py-1.5 text-xs font-bold text-primary bg-blue-50 hover:bg-blue-100 rounded-lg transition-all">
                               Update Progress
                           </button>
                       </Can>
                       <Can roles={['admin', 'super_admin', 'project_manager']}>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </Can>
                  </div>
                  <div className="flex -space-x-2">
                      {Array.isArray(task.assignedTo) && task.assignedTo.slice(0, 3).map((u, i) => (
                          <div key={i} className="w-7 h-7 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center text-[10px] font-bold text-primary">
                              {u.name.charAt(0).toUpperCase()}
                          </div>
                      ))}
                      {Array.isArray(task.assignedTo) && task.assignedTo.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-600">
                              +{task.assignedTo.length - 3}
                          </div>
                      )}
                  </div>
                  <span className="px-3 py-1 bg-white text-[10px] font-black uppercase text-gray-400 rounded-lg border border-gray-100 group-hover:border-primary transition-colors">
                    {task.status.replace('_', ' ')}
                  </span>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-center py-8 text-gray-400 font-medium">No tasks associated with this project.</p>}
        </div>
      </div>

      {/* Settings Modal (Edit Project) */}
      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title="Project Configuration">
        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Project Name</label>
            <input 
              type="text" required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold"
              value={projectData.name}
              onChange={(e) => setProjectData({...projectData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
              value={projectData.description} onChange={(e) => setProjectData({...projectData, description: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
            <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold bg-gray-50"
              value={projectData.status} onChange={(e) => setProjectData({...projectData, status: e.target.value})}>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="pt-4 flex space-x-3">
            <button type="button" onClick={() => setIsSettingsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Update Settings'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Modal (Add/Edit) */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editMode ? (isTeamMember ? 'Update Progress' : 'Modify Task Parameters') : 'Create Project Task'}>
        <form onSubmit={handleSaveTask} className="space-y-6">
          {editMode && isTeamMember ? (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
                <span>Execution Progress</span>
                <span className="text-primary">{taskData.percentageComplete}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary mt-2"
                value={taskData.percentageComplete}
                onChange={(e) => setTaskData({ ...taskData, percentageComplete: parseInt(e.target.value) })}
              />
            </div>
          ) : (
            <>
              <div className="bg-blue-50/50 p-4 rounded-xl flex items-start space-x-3 border border-blue-100 mb-2">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <p className="text-xs font-bold text-blue-700 leading-relaxed">
                    Tasks can only be assigned to members of the **{(project.team as any)?.name}** team. You can select multiple assignees.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Task Title</label>
                <input type="text" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={taskData.title} onChange={(e) => setTaskData({...taskData, title: e.target.value})} placeholder="e.g. Frontend Integration" />
              </div>

              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 capitalize">Priority</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold bg-gray-50"
                value={taskData.priority} onChange={(e) => setTaskData({...taskData, priority: e.target.value})}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 capitalize">Status</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold bg-gray-50"
                  value={taskData.status} onChange={(e) => setTaskData({...taskData, status: e.target.value as any})}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </select>
            </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1 capitalize">Due Date</label>
              <input type="date" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                value={taskData.dueDate} onChange={(e) => setTaskData({...taskData, dueDate: e.target.value})} />
            </div>
            {editMode && (
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">
                        <span>Progress</span>
                        <span className="text-primary">{taskData.percentageComplete}%</span>
                    </label>
                    <input type="range" min="0" max="100" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary mt-2" 
                      value={taskData.percentageComplete} onChange={(e) => setTaskData({...taskData, percentageComplete: parseInt(e.target.value)})} />
                </div>
            )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" /> 
                    Assign Team Members (Select Multiple)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {teamMembers.map((member: User) => (
                    <button
                      key={member._id}
                      type="button"
                      onClick={() => handleToggleAssignee(member._id)}
                      className={`flex items-center p-3 rounded-xl border-2 transition-all text-left ${
                        taskData.assignedTo.includes(member._id)
                          ? 'border-primary bg-blue-50 text-primary shadow-sm'
                          : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 font-bold text-xs ${
                        taskData.assignedTo.includes(member._id) ? 'bg-primary text-white' : 'bg-white border text-gray-400'
                      }`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black truncate">{member.name}</p>
                        <p className="text-[10px] font-medium opacity-60 truncate">{member.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-4 flex space-x-3">
            <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-all font-black">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-white py-3 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50">
              {isSubmitting ? 'Saving...' : (editMode ? (isTeamMember ? 'Update Progress' : 'Update Task') : 'Initialize Task')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetails;
