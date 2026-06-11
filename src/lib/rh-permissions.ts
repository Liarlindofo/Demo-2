// ─── Strings de permissão (valores exatos salvos no banco) ───────────────────

export const P = {
  // Módulo Funcionários
  EMPLOYEES_VIEW:       'employees.view',
  EMPLOYEES_CREATE:     'employees.create',
  EMPLOYEES_EDIT:       'employees.edit',
  EMPLOYEES_DEACTIVATE: 'employees.deactivate',

  // Módulo Motoboys
  RIDERS_VIEW:          'riders.view',
  RIDERS_CREATE:        'riders.create',
  RIDERS_EDIT:          'riders.edit',
  RIDERS_DEACTIVATE:    'riders.deactivate',
  RIDERS_LAUNCH_PERIOD: 'riders.launch_period',
  RIDERS_APPROVE_DOCS:  'riders.approve_docs',

  // Módulo RH Geral
  RH_VIEW_SALARY:       'rh.view_salary',
  RH_EDIT_SALARY:       'rh.edit_salary',

  // Gestão de usuários — apenas Admin (nunca concedida a RH)
  USERS_MANAGE:         'users.manage',
} as const;

export type RhPermissionKey = typeof P[keyof typeof P];

// ─── Rótulos legíveis ─────────────────────────────────────────────────────────

export const PERMISSION_LABELS: Record<string, string> = {
  'employees.view':       'Visualizar funcionários',
  'employees.create':     'Cadastrar funcionários',
  'employees.edit':       'Editar funcionários',
  'employees.deactivate': 'Inativar funcionários',
  'riders.view':          'Visualizar motoboys',
  'riders.create':        'Cadastrar motoboys',
  'riders.edit':          'Editar motoboys',
  'riders.deactivate':    'Inativar motoboys',
  'riders.launch_period': 'Lançar quinzenas',
  'riders.approve_docs':  'Aprovar/rejeitar documentos',
  'rh.view_salary':       'Visualizar salários e valores',
  'rh.edit_salary':       'Editar salários e valores',
  'users.manage':         'Gerenciar usuários de RH',
};

// ─── Grupos de permissões para a UI de toggles ────────────────────────────────

export const PERMISSION_GROUPS: Array<{
  label: string;
  permissions: RhPermissionKey[];
}> = [
  {
    label: 'Funcionários',
    permissions: [
      P.EMPLOYEES_VIEW,
      P.EMPLOYEES_CREATE,
      P.EMPLOYEES_EDIT,
      P.EMPLOYEES_DEACTIVATE,
    ],
  },
  {
    label: 'Motoboys',
    permissions: [
      P.RIDERS_VIEW,
      P.RIDERS_CREATE,
      P.RIDERS_EDIT,
      P.RIDERS_DEACTIVATE,
      P.RIDERS_LAUNCH_PERIOD,
      P.RIDERS_APPROVE_DOCS,
    ],
  },
  {
    label: 'RH Geral',
    permissions: [P.RH_VIEW_SALARY, P.RH_EDIT_SALARY],
  },
];

// Permissões que NUNCA podem ser concedidas a um membro RH
export const ADMIN_ONLY_PERMISSIONS = new Set<string>([P.USERS_MANAGE]);
