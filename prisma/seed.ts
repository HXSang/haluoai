import { AuthType, PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcryptjs';
import { seedPermission } from "./seed/permission";
import { seedRole } from "./seed/role";
import { seedRolePermission } from "./seed/role-permission";
// initialize Prisma Client
const prisma = new PrismaClient();

// seed account
async function seedAccount() {
    const accounts = [
        {
            email: 'GavetteStoeberl@gmail.com',
            password: 'GameBusiness09@',
            cookie: '',
            isCookieActive: false,
            isActive: true,
        },
        {
            email: 'ThoranHeimburger@gmail.com', 
            password: 'GameBusiness10@',
            cookie: '',
            isCookieActive: false,
            isActive: true,
        },
        {
            email: 'zoom@colorme.vn',
            password: 'color1234',
            cookie: '',
            isCookieActive: false,
            isActive: true,
        },
        {
            email: 'ae@colorme.vn',
            password: 'color1234',
            cookie: '',
            isCookieActive: true,
            isActive: true,
        },
        {
            email: 'projecth025@gmail.com',
            password: 'Ngonluarucchay2025',
            cookie: '',
            isCookieActive: false,
            isActive: true,
        },
        {
            email: 'studiohub001@gmail.com',
            password: 'Ngonluarucchay@2025',
            cookie: '',
            isCookieActive: false,
            isActive: true,
        },
        {
            email: 'amwc0003@gmail.com',
            password: 'Ngonluarucchay2025',
            cookie: '',
            isCookieActive: false,
            isActive: true,
        }
    ];
    
    for (const account of accounts) {
        const existingAccount = await prisma.account.findFirst({
            where: {
                email: account.email,
            },
        });
        if (existingAccount) {
            continue;
        }   
        // account.password = await bcrypt.hash(account.password, 10); 
        await prisma.account.create({
            data: account,
        });
    }

    console.log(`[Seed] Seeded ${accounts.length} accounts`);
}   

async function seedUser() {
    const users = [
        {
            email: 'admin@gmail.com',
            password: 'color1234',
            name: 'Admin',
            authType: AuthType.EMAIL,
        },
    ]   
    for (const user of users) {
        const existingUser = await prisma.user.findFirst({
            where: {
                email: user.email,
            },
        });

        // Hash the password before creating/updating
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const userData = {
            ...user,
            password: hashedPassword,
        };

        if (existingUser) {
            await prisma.user.update({
                where: { id: existingUser.id },
                data: userData,
            });
        } else {
            await prisma.user.create({
                data: userData,
            }); 
        }
    }

    console.log(`[Seed] Seeded ${users.length} users`);
}

async function main() {
    await seedPermission();
    await seedRole();
    await seedRolePermission();
    await seedAccount();
    await seedUser();
}

// execute the main function
main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        // close Prisma Client at the end
        await prisma.$disconnect();
    });

