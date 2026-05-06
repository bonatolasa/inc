export interface Role {
  _id: string;
  name: string;
  displayName?: string;
  description?: string;
  permissions: string[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  roles: string[] | Role[];
  permissions?: string[];  // Direct user permissions (hybrid RBAC)
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
