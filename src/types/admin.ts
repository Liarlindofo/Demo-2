export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}

export enum Permission {
  // Usuários
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  RESET_PASSWORDS = 'reset_passwords',
  
  // Ferramentas/Módulos
  ACCESS_LABEL = 'access_label',
  ACCESS_CMV = 'access_cmv',
  ACCESS_ANALYTICS = 'access_analytics',
  
  // Admin
  VIEW_LOGS = 'view_logs',
  MANAGE_CLIENTS = 'manage_clients',
  SYSTEM_SETTINGS = 'system_settings',
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  clientId: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminSession {
  userId: string;
  email: string;
  name?: string;
  role: UserRole;
  clientId?: string;
  permissions: Permission[];
  exp?: number; // Opcional - será adicionado automaticamente pelo JWT
}

export interface AdminClient {
  id: string;
  name: string;
  cnpj: string | null;
  databaseSchema: string | null;
  isActive: boolean;
  maxUsers: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  user?: {
    name: string;
    email: string;
  };
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}
