import { AppPermission, AppPermissionType } from './permissions/app';

export const Permission = {
  ...AppPermission,
};

export type PermissionType =
    | AppPermissionType;
