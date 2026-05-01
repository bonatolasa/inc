import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../../../services/task.service';
import { Task } from '../../../types/task.types';
import { User as UserType } from '../../../types/user.types';
import { Loader } from '../../../common/components';
import { usePermission } from '../../../hooks/usePermission';
import { PERMISSIONS } from '../../../config/permissions.config';
import { CheckSquare, Clock, AlertCircle, ArrowLeft, MoreHorizontal, User, Paperclip, Users, FolderKanban } from 'lucide-react';
import { getStatusColor, formatDate } from '../../../utils/formatters';

const TaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, hasRole } = usePermission();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const canTestTask =
    hasRole('tester') ||
    hasPermission(PERMISSIONS.TASKS_TEST_UPDATE) ||
    hasPermission(PERMISSIONS.TEST_TASK);
  const canReportBug =
    hasRole('tester') ||
    hasPermission(PERMISSIONS.TASKS_TEST_UPDATE) ||
    hasPermission(PERMISSIONS.REPORT_BUG);
  const canVerifyTask =
    hasRole('tester') ||
    hasPermission(PERMISSIONS.TASKS_TEST_UPDATE) ||
    hasPermission(PERMISSIONS.VERIFY_TASK);

  useEffect(() => {
    const fetchTask = async () => {
      if (!id) return;
      try {
        const response = await taskService.getTaskById(id);
        if (response.success) {
          setTask(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch task details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const refreshTask = async () => {
    if (!id) return;
    const response = await taskService.getTaskById(id);
    if (response.success) {
      setTask(response.data);
    }
  };

  const updateTestingAction = async (
    action: 'test_task' | 'report_bug' | 'verify_task',
  ) => {
    if (!task?._id) return;
    setActionLoading(action);
    try {
      if (action === 'test_task') {
        await taskService.updateTask(task._id, {
          status: 'in_progress' as any,
          startedAt: new Date().toISOString() as any,
        });
      } else if (action === 'report_bug') {
        await taskService.updateTask(task._id, {
          status: 'blocked' as any,
          comments: `Bug reported at ${new Date().toISOString()}` as any,
        });
      } else if (action === 'verify_task') {
        await taskService.updateTask(task._id, {
          status: 'in_review' as any,
          comments: `Task verified at ${new Date().toISOString()}` as any,
        });
      }
      await refreshTask();
    } catch (error) {
      console.error('Failed to run tester action', error);
      alert('Tester action failed. Check permissions or task access.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <Loader />;
  if (!task) return <div className="p-8 text-center text-red-500 font-bold">Task not found.</div>;

  const assignees = Array.isArray(task.assignedTo) ? (task.assignedTo as any[]) : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-primary transition-colors font-bold group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Projects
        </button>
        <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <MoreHorizontal className="w-6 h-6 text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-primary/20"></div>
            <div className="flex justify-between items-start mb-6">
              <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${getStatusColor(task.status).replace('bg-', 'bg-opacity-20 bg-')}`}>
                {task.status.replace('_', ' ')}
              </span>
               <div className="flex items-center space-x-2 text-xs font-bold text-gray-400">
                 <Clock className="w-4 h-4" />
                 <span>Created {formatDate(task.createdAt || '')}</span>
               </div>
            </div>
            
            <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-4">{task.title}</h1>
            <p className="text-lg text-gray-500 font-medium leading-relaxed mb-10">
              {task.description || 'Detailed technical requirements for this task have not been provided yet.'}
            </p>

            <div className="flex flex-wrap gap-4 pt-10 border-t border-gray-50">
              <div className="bg-slate-50 px-5 py-3 rounded-2xl flex items-center border border-gray-100">
                <AlertCircle className="w-5 h-5 mr-3 text-orange-500" />
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Priority</p>
                  <p className="text-sm font-bold text-gray-900 capitalize">{task.priority}</p>
                </div>
              </div>
              <div className="bg-slate-50 px-5 py-3 rounded-2xl flex items-center border border-gray-100">
                <Clock className="w-5 h-5 mr-3 text-primary" />
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Due Date</p>
                  <p className="text-sm font-bold text-gray-900">{formatDate(task.dueDate)}</p>
                </div>
              </div>
              <div className="bg-slate-50 px-5 py-3 rounded-2xl flex items-center border border-gray-100">
                <div className="w-5 h-5 mr-3 bg-primary rounded-lg flex items-center justify-center text-[10px] text-white font-bold">%</div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Completion</p>
                  <p className="text-sm font-bold text-primary">{task.percentageComplete || 0}%</p>
                </div>
              </div>
            </div>

            {(canTestTask || canReportBug || canVerifyTask) && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3">Tester Actions</h3>
                <div className="flex flex-wrap gap-2">
                  {canTestTask && (
                    <button
                      onClick={() => updateTestingAction('test_task')}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                    >
                      {actionLoading === 'test_task' ? 'Applying...' : 'Test Task'}
                    </button>
                  )}
                  {canReportBug && (
                    <button
                      onClick={() => updateTestingAction('report_bug')}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 rounded-xl bg-red-50 text-red-700 font-bold text-sm border border-red-200 hover:bg-red-100 disabled:opacity-50"
                    >
                      {actionLoading === 'report_bug' ? 'Applying...' : 'Report Bug'}
                    </button>
                  )}
                  {canVerifyTask && (
                    <button
                      onClick={() => updateTestingAction('verify_task')}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-bold text-sm border border-green-200 hover:bg-green-100 disabled:opacity-50"
                    >
                      {actionLoading === 'verify_task' ? 'Applying...' : 'Verify Task'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center">
              <Paperclip className="w-5 h-5 mr-2 text-primary" />
              Attachments
            </h3>
            <div className="p-10 border-2 border-dashed border-gray-100 rounded-3xl text-center">
               <p className="text-gray-400 font-medium">No files attached to this task.</p>
               <button className="mt-4 text-xs font-black text-primary hover:underline">Upload Document</button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <h4 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center">
               <Users className="w-4 h-4 mr-2" />
               Assigned Members ({assignees.length})
             </h4>
             <div className="space-y-3">
                {assignees.map((user, idx) => (
                    <div key={user._id || idx} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-gray-100 group hover:border-primary/30 transition-all">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-primary/10">
                            {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-gray-900 text-sm truncate">{user.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold truncate">{user.email}</p>
                        </div>
                    </div>
                ))}
                {assignees.length === 0 && (
                    <div className="text-center py-6 text-gray-400 font-medium text-xs italic">
                        No members assigned yet.
                    </div>
                )}
             </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl">
             <h4 className="font-bold mb-2 flex items-center">
                <FolderKanban className="w-4 h-4 mr-2 text-blue-400" />
                Project Context
             </h4>
             <p className="text-slate-400 text-xs font-medium mb-6 leading-relaxed">
               Part of the <strong>{(task.project as any)?.name}</strong> operational roadmap. 
             </p>
             <button 
               onClick={() => navigate(`/projects/${(task.project as any)?._id || (task.project as any)}`)}
               className="w-full bg-white/10 text-white py-3 rounded-2xl font-black hover:bg-white/20 transition-colors text-sm border border-white/10"
             >
               View Project
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
