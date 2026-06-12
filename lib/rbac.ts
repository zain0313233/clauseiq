export type Role = 'user' | 'admin'

export const permissions = {
  user: [
    'document:upload',
    'document:read',
    'document:delete',
    'query:ask',
    'conversation:read',
  ],
  admin: [
    'document:upload',
    'document:read',
    'document:delete',
    'query:ask',
    'conversation:read',
    'theme:write',
    'user:read',
    'user:delete',
  ],
}

export function hasPermission(role: string, permission: string): boolean {
  return permissions[role as Role]?.includes(permission) ?? false
}