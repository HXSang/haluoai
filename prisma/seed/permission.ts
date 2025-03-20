import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const permissions = [
    {
        name: 'GET_ROLE',
        description: 'Permission to view a single role and its details'
    },
    {
        name: 'GET_ROLES',
        description: 'Permission to view list of all roles'
    },
    {
        name: 'CREATE_ROLE',
        description: 'Permission to create new roles in the system'
    },
    {
        name: 'UPDATE_ROLE',
        description: 'Permission to modify existing role details'
    },
    {
        name: 'DELETE_ROLE',
        description: 'Permission to remove roles from the system'
    },
    {
        name: 'GET_PERMISSION',
        description: 'Permission to view a single permission and its details'
    },
    {
        name: 'GET_PERMISSIONS',
        description: 'Permission to view list of all permissions'
    },
    {
        name: 'CREATE_PERMISSION',
        description: 'Permission to create new permissions in the system'
    },
    {
        name: 'UPDATE_PERMISSION',
        description: 'Permission to modify existing permission details'
    },
    {
        name: 'DELETE_PERMISSION',
        description: 'Permission to remove permissions from the system'
    },
    {
        name: 'ASSIGN_ROLE',
        description: 'Permission to assign roles to users'
    },
    {
        name: 'REMOVE_ROLE',
        description: 'Permission to remove roles from users'
    },
    {
        name: 'ASSIGN_PERMISSION',
        description: 'Permission to assign permissions to roles'
    },
    {
        name: 'REMOVE_PERMISSION',
        description: 'Permission to remove permissions from roles'
    }
]


export const seedPermission = async () => {
    await prisma.permission.createMany({
        data: permissions.map(permission => ({
            ...permission,
            description: permission.description,
        })),
    });
}
