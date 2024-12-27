import UserPermission from './user-permission.enum';
import PermissionsPermission from './permissions-permission.enum';
import RolesPermission from './roles-permission.enum';
import CandidatePermission from './candidate-permission.enum';
import ClientPermission from './client-permission.enum';
import JobPermission from './job-permission.enum';
import RecruiterPermission from './recruiter-permission.enum';

export const KitesPermission = {
  ...UserPermission,
  ...PermissionsPermission,
  ...RolesPermission,
  ...CandidatePermission,
  ...ClientPermission,
  ...JobPermission,
  ...RecruiterPermission,
};

export type KitesPermissionType =
  | UserPermission
  | PermissionsPermission
  | RolesPermission
  | CandidatePermission
  | ClientPermission
  | JobPermission
  | RecruiterPermission;
