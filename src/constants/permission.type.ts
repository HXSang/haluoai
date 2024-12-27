import { KitesPermission, KitesPermissionType } from './permissions/kites';

export const Permission = {
  ...KitesPermission,
};

export type PermissionType =
    | KitesPermissionType;
