export type Role = 'developer' | 'admin' | 'sales';

export type PageId =
  | 'dashboard'
  | 'configurator'
  | 'quotes'
  | 'orders'
  | 'clients'
  | 'pricing-admin'
  | 'integrations'
  | 'users'
  | 'qa-automation';

export interface User {
  login: string;
  role: Role;
  name: string;
}
