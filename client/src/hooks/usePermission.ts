import { useContext } from 'react';
import { PermissionContext } from '../context/PermissionContext';

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
};
