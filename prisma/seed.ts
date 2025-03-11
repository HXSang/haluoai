import { AuthType, PrismaClient } from "@prisma/client";

// initialize Prisma Client
const prisma = new PrismaClient();

// seed account
async function seedAccount() {
    const accounts = await prisma.account.createMany({
        data: [
            {
                email: 'GavetteStoeberl@gmail.com',
                password: 'GameBusiness09@',
                cookie: '',
            },
            {
                email: 'ThoranHeimburger@gmail.com', 
                password: 'GameBusiness10@',
                cookie: '',
            },
            {
                email: 'zoom@colorme.vn',
                password: 'color1234',
                cookie: '',
            },
        ]
    });
}   

async function main() {
    await seedAccount();
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

