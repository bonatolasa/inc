import React from 'react';
import { NavLink } from 'react-router-dom';
import { Project } from '../../../types/project.types';
import { ROUTES } from '../../../config/routes.config';
import { getStatusColor, formatDate } from '../../../utils/formatters';
import { ChevronRight, Trash2, Calendar } from 'lucide-react';
import { Can } from '../../../common/components';
import { PERMISSIONS } from '../../../config/permissions.config';

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 group relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors truncate pr-8">{project.name}</h3>
        <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${getStatusColor(project.status).replace('bg-', 'bg-opacity-20 bg-')}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>
      
      <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow leading-relaxed">
        {project.description || 'No specific mission objectives defined for this initiative.'}
      </p>
      
      <div className="mb-6">
        <div className="flex justify-between text-[10px] uppercase tracking-widest mb-2 font-black">
          <span className="text-gray-400">Execution Velocity</span>
          <span className="text-primary">{project.progress || 0}%</span>
        </div>
        <div className="w-full bg-blue-50/50 rounded-full h-2 overflow-hidden border border-blue-50">
          <div 
            className="bg-gradient-to-r from-primary to-blue-400 h-full transition-all duration-700 ease-out shadow-sm" 
            style={{ width: `${project.progress || 0}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-gray-50">
        <div className="flex items-center text-gray-500 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-gray-100">
          <Calendar className="w-3.5 h-3.5 mr-2 text-primary" />
          <span>{formatDate(project.deadline)}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Can permissions={[PERMISSIONS.PROJECTS_DELETE]}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete?.(project._id);
              }}
              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="Terminate Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Can>
          <NavLink 
            to={ROUTES.PROJECT_DETAILS(project._id)}
            className="text-primary font-black hover:text-blue-700 transition-colors flex items-center group-hover:translate-x-1 duration-300 px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            Details
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
