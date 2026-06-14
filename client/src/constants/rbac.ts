import type { Role, PageId } from '../types';

export const MENU_PAGES: PageId[] = [
  'dashboard', 'configurator', 'quotes', 'orders', 'clients',
  'pricing-admin', 'integrations', 'users', 'qa-automation',
];

export const ROLE_PAGES: Record<Role, PageId[]> = {
  developer: ['dashboard', 'configurator', 'quotes', 'orders', 'clients', 'pricing-admin', 'integrations', 'users', 'qa-automation'],
  admin:     ['dashboard', 'configurator', 'quotes', 'orders', 'clients', 'pricing-admin', 'integrations', 'users'],
  sales:     ['dashboard', 'configurator', 'quotes', 'orders', 'clients'],
};

export const ROLE_LABELS: Record<Role, string> = {
  developer: 'Developer',
  admin: 'Admin',
  sales: 'Sales Rep',
};

export const PAGE_LABELS: Record<PageId, string> = {
  'dashboard':      'Dashboard',
  'configurator':   'Configurator',
  'quotes':         'Quotes',
  'orders':         'Orders',
  'clients':        'Clients',
  'pricing-admin':  'Pricing Admin',
  'integrations':   'Integrations',
  'users':          'Users & Roles',
  'qa-automation':  'QA Automation',
};

export const USERS: Record<string, { password: string; role: Role; name: string }> = {
  developer: { password: 'developer', role: 'developer', name: 'Developer' },
  admin:     { password: 'admin',     role: 'admin',     name: 'Admin' },
  sales:     { password: 'sales',     role: 'sales',     name: 'Sales Rep' },
};

// Route path for each page id
export const PAGE_ROUTES: Record<PageId, string> = {
  'dashboard':     '/dashboard',
  'configurator':  '/configurator',
  'quotes':        '/quotes',
  'orders':        '/orders',
  'clients':       '/clients',
  'pricing-admin': '/pricing-admin',
  'integrations':  '/integrations',
  'users':         '/users',
  'qa-automation': '/qa-automation',
};
