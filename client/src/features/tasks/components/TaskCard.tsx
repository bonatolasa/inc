import React from 'react';
import { NavLink } from 'react-router-dom';
import { Task } from '../../../types/task.types';
import { ROUTES } from '../../../config/routes.config';
import { getStatusColor, formatDate } from '../../../utils/formatters';
import { Clock, AlertCircle, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { Can } from '../../../common/components';
import { PERMISSIONS } from '../../../config/permissions.config';
import { usePermission } from '../../../hooks/usePermission';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-blue-500';
    case 'low': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const { hasRole } = usePermission();
  const isTeamMember = hasRole('team_member');
  const assignees = Array.isArray(task.assignedTo) ? (task.assignedTo as any[]) : [];

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 group">
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex flex-col gap-1 min-w-0 flex-1 pr-2">
          <span className={`text-[10px] font-black uppercase tracking-wider ${getPriorityColor(task.priority)} flex items-center bg-slate-50 px-2 py-1 rounded-md border border-gray-100 w-max`}>
            {task.priority === 'critical' && <AlertCircle className="w-3 h-3 mr-1" />}
            {task.priority} Priority
          </span>
          <h3 className="font-bold text-base text-gray-900 group-hover:text-primary transition-colors line-clamp-2">{task.title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${getStatusColor(task.status).replace('bg-', 'bg-opacity-20 bg-')}`}>
          {task.status.replace('_', ' ')}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-3 mt-1 pr-1 text-xs text-gray-500">
        <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((u, i) => {
                const name = typeof u === 'string' ? `User ${u.slice(-4)}` : (u?.name || `User ${(u?._id || '').toString().slice(-4)}`);
                return (
                <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center text-[10px] font-black text-primary shadow-sm" title={name}>
                    {(name.charAt(0) || 'U').toUpperCase()}
                </div>
            )})}
            {assignees.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-gray-600 shadow-sm">
                    +{assignees.length - 3}
                </div>
            )}
            {assignees.length === 0 && (
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic ml-2 mt-2">Unassigned</span>
            )}
        </div>
        <div className="flex items-center text-xs font-bold text-gray-400">
             <span className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{task.percentageComplete || 0}%</span>
        </div>
      </div>
      
        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-gray-500 border-t border-gray-50">
        <div className="flex items-center space-x-1">
          <Can permissions={[PERMISSIONS.TASKS_UPDATE]}>
            {isTeamMember ? (
              <button
                onClick={() => onEdit?.(task)}
                className="px-3 py-1.5 text-xs font-bold text-primary bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
              >
                Update Progress
              </button>
            ) : (
              <button
                onClick={() => onEdit?.(task)}
                className="p-1.5 text-gray-300 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </Can>
          {!isTeamMember && (
            <Can permissions={[PERMISSIONS.TASKS_DELETE]}>
              <button 
                onClick={() => onDelete?.(task._id)}
                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Can>
          )}
        </div>
        
        <NavLink 
          to={ROUTES.TASK_DETAILS(task._id)}
          className="text-primary font-black hover:text-blue-700 transition-colors flex items-center group-hover:translate-x-1 duration-300 ml-4"
        >
          Details
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </NavLink>
      </div>
    </div>
  );
};

export default TaskCard;
