import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const roles = [
    {
        name: 'Super Admin',
        description: 'Has all permissions and full control over the system'
    },
    {
        name: 'Employee',
        description: 'Basic employee role with limited permissions'
    }
];

export const seedRole = async () => {
    for (const role of roles) {
        // Check if role already exists
        const existingRole = await prisma.role.findFirst({
            where: {
                name: role.name,
                deletedAt: null,
            },
        });

        if (!existingRole) {
            // Create new role
            await prisma.role.create({
                data: role,
            });
            console.log(`[Seed] Created role: ${role.name}`);
        }
    }
    
    console.log(`[Seed] Role seeding completed`);
} 