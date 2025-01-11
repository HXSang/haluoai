import UserPermission from './user-permission.enum';
import PermissionsPermission from './permissions-permission.enum';
import RolesPermission from './roles-permission.enum';

export const AppPermission = {
  ...UserPermission,
  ...PermissionsPermission,
  ...RolesPermission,
};

export type AppPermissionType =
  | UserPermission
  | PermissionsPermission
  | RolesPermission
