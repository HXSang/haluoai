export namespace Repository {
  export type CreateRoleParams = {
    name: string
    description?: string
    permissionIds?: number[]
  };

  export type UpdateRoleParams = {
    id: number
    name?: string
    description?: string
    isArchived?: boolean
  };

  export type UpdatePermissionsToRoleParams = {
    roleId: number
    permissionIds: number[]
  };

  export type FindRolesParams = {
    searchQuery?: string // search by name
    limit?: number
    offset?: number
    isArchived?: boolean
  };
}
