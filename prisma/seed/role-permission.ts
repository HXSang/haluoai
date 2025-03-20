import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedRolePermission = async () => {
    // Get roles
    const superAdmin = await prisma.role.findFirst({
        where: {
            name: 'Super Admin',
            deletedAt: null,
        },
    });

    const employee = await prisma.role.findFirst({
        where: {
            name: 'Employee',
            deletedAt: null,
        },
    });

    if (!superAdmin || !employee) {
        console.log('[Seed] Roles not found. Please run role seed first.');
        return;
    }

    // Get all permissions for super admin
    const allPermissions = await prisma.permission.findMany({
        where: {
            deletedAt: null,
        },
    });

    // Define employee permission names (only GET operations)
    const employeePermissionNames = [
        'Get Role', 
        'Get Roles', 
        'Get Permission', 
        'Get Permissions'
    ];
     
    // Filter permissions for employee role
    const employeePermissions = allPermissions.filter(permission => 
        employeePermissionNames.includes(permission.name)
    );

    // Assign all permissions to super admin
    for (const permission of allPermissions) {
        // Check if already assigned
        const existingRolePermission = await prisma.rolePermission.findFirst({
            where: {
                roleId: superAdmin.id,
                permissionId: permission.id,
                deletedAt: null,
            },
        });

        if (!existingRolePermission) {
            await prisma.rolePermission.create({
                data: {
                    roleId: superAdmin.id,
                    permissionId: permission.id,
                },
            });
        }
    }

    // Assign limited permissions to employee
    for (const permission of employeePermissions) {
        // Check if already assigned
        const existingRolePermission = await prisma.rolePermission.findFirst({
            where: {
                roleId: employee.id,
                permissionId: permission.id,
                deletedAt: null,
            },
        });

        if (!existingRolePermission) {
            await prisma.rolePermission.create({
                data: {
                    roleId: employee.id,
                    permissionId: permission.id,
                },
            });
        }
    }

    console.log('[Seed] Role permissions assigned successfully');
} 