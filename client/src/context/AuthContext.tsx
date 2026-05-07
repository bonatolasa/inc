import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { userService } from '../services/user.service';
import { User } from '../types/user.types';

interface AuthContextType {
  user: User | null;
  selectedRole: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<{ user: User }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setSelectedRole: (role: string) => void;
  clearSelectedRole: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(() => {
    return localStorage.getItem('selectedRole');
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (token) {
        const response = await userService.getMe();
        if (response.success) {
          setUser(response.data);
          // Restore selected role from localStorage if it exists
          const savedRole = localStorage.getItem('selectedRole');
          if (savedRole) {
            // Validate that the saved role is still valid for this user
            const userRoles = Array.isArray(response.data.roles)
              ? response.data.roles.map((r: any) => typeof r === 'string' ? r : r.name)
              : [];
            if (userRoles.includes(savedRole)) {
              setSelectedRole(savedRole);
            } else {
              localStorage.removeItem('selectedRole');
            }
          }
        } else {
          logout();
        }
      }
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (data: any): Promise<{ user: User }> => {
    console.log("Calling authService.login with", data);
    const response = await authService.login(data);
    console.log("API response received in context:", response);
    const token = response.data?.accessToken || response.data?.token;
    if (response.success && token) {
      localStorage.setItem('token', token);
      // Clear any previously selected role
      localStorage.removeItem('selectedRole');
      setSelectedRole(null);

      // Hydrate from /users/me so frontend always gets effective permissions
      // (role-based + direct) for permission-driven UI gates.
      const meResponse = await userService.getMe();
      const hydratedUser = meResponse.success ? meResponse.data : response.data.user;
      setUser(hydratedUser);
      return { user: hydratedUser };
    } else {
      throw new Error(response.message || 'Invalid login response from server');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedRole');
    setUser(null);
    setSelectedRole(null);
  };

  const setRole = (role: string) => {
    setSelectedRole(role);
    localStorage.setItem('selectedRole', role);
  };

  const clearSelectedRole = () => {
    setSelectedRole(null);
    localStorage.removeItem('selectedRole');
  };

  return (
    <AuthContext.Provider value={{ user, selectedRole, isAuthenticated: !!user, isLoading, login, logout, checkAuth, setSelectedRole: setRole, clearSelectedRole }}>
      {children}
    </AuthContext.Provider>
  );
};
