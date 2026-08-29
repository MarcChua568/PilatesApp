export enum Role {
  MEMBER = 'member',
  STAFF = 'staff',
  ADMIN = 'admin',
  // Manages other portal users' permissions; implicitly holds every
  // permission everywhere — never gated by AdminPermission checks.
  SUPERADMIN = 'superadmin',
}

// Admin-portal sections a STAFF/ADMIN user can be individually granted.
// Superadmins bypass this entirely. Keep in sync with each app's nav.
export const ADMIN_PERMISSIONS = [
  'schedule',
  'classes',
  'instructors',
  'rooms',
  'events',
  'promotions',
  'pricing',
  'shop',
  'site-content',
  'waivers',
  'reports',
  'announcements',
  'settings',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
