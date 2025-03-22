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
    },

    // account
    {
        name: 'GET_ACCOUNT',
        description: 'Permission to view a single account and its details'
    },
    {
        name: 'GET_ACCOUNTS',
        description: 'Permission to view list of all accounts'
    },
    {
        name: 'CREATE_ACCOUNT',
        description: 'Permission to create new accounts in the system'
    },
    {
        name: 'UPDATE_ACCOUNT',
        description: 'Permission to modify existing account details'
    },
    {
        name: 'DELETE_ACCOUNT',
        description: 'Permission to remove accounts from the system'
    },
    
    // user
    {
        name: 'GET_USER',
        description: 'Permission to view a single user and its details'
    },
    {
        name: 'GET_USERS',
        description: 'Permission to view list of all users'
    },
    {
        name: 'CREATE_USER',
        description: 'Permission to create new users in the system'
    },
    {
        name: 'UPDATE_USER',
        description: 'Permission to modify existing user details'
    },
    {
        name: 'DELETE_USER',
        description: 'Permission to remove users from the system'
    },
]


export const seedPermission = async () => {
    await prisma.permission.createMany({
        data: permissions.map(permission => ({
            ...permission,
            description: permission.description,
        })),
    });
}
