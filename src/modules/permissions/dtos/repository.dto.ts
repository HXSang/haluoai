export namespace Repository {
  export interface GetPermissionsParams {
    limit?: number;
    offset?: number;
    searchQuery?: string;
  }

  export interface UpdatePermissionParams {
    platformId: number;
    permissionId: number;
    name?: string;
    description?: string;
  }
}
