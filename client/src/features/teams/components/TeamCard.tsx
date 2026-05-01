import React from 'react';
import { NavLink } from 'react-router-dom';
import { Team } from '../../../types/team.types';
import { ROUTES } from '../../../config/routes.config';
import { Users, ChevronRight } from 'lucide-react';

interface TeamCardProps {
  team: Team;
}

const TeamCard: React.FC<TeamCardProps> = ({ team }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-100 group">
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-tr from-blue-50 to-indigo-50 text-primary rounded-xl flex items-center justify-center group-hover:from-primary group-hover:to-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
          <Users className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="min-w-0 overflow-hidden">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{team.name}</h3>
        </div>
      </div>
      
      <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
        {team.description || 'No description provided.'}
      </p>
      
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
        <div className="flex items-center text-sm font-semibold text-gray-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-gray-100">
          <Users className="w-4 h-4 mr-2 text-primary" />
          <span>{team.members?.length || 0} Members</span>
        </div>
        <NavLink 
          to={ROUTES.TEAM_DETAILS(team._id)}
          className="text-primary hover:text-blue-700 transition-colors text-sm font-black flex items-center group-hover:translate-x-1 duration-300"
        >
          View Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </NavLink>
      </div>
    </div>
  );
};

export default TeamCard;
