import { AuthType, PrismaClient, UserGirlMessage, UserGirlMessageType } from "@prisma/client";
import * as bcrypt from "bcryptjs";

// initialize Prisma Client
const prisma = new PrismaClient();

async function createDefaultUser() {
    const password = await bcrypt.hash("123456", 10);
    // create two dummy users
    const user1Exists = await prisma.user.findFirst({ where: { email: "admin@gmail.com", authType: AuthType.EMAIL } });
    let user1;
    if (!user1Exists) {
        user1 = await prisma.user.create({
            data: {
                email: "admin@gmail.com",
                name: "admin",
                authType: AuthType.EMAIL,
                password: password,
            }
        })
    } else user1 = user1Exists;

    // Define roles
    const roles = ["ADMIN"];

    // Check and create roles
    for (const roleName of roles) {
        const roleExists = await prisma.role.findFirst({ where: { name: roleName } });

        if (!roleExists) {
            await prisma.role.create({
                data: {
                    name: roleName,
                    description: roleName,
                }
            })
        }
    }

    // Define role-user mappings
    const roleUsers = {
        ADMIN: [user1.id],
    }

    // Check and create role-user associations
    for (const [roleName, userIds] of Object.entries(roleUsers)) {
        const role = await prisma.role.findFirst({
            where: { name: roleName },
        });

        if (!role) continue; // If role does not exist, skip

        for (const userId of userIds) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) continue; // If user does not exist, skip
        }
    }

    console.log("Seeding default users completed.");
}

async function createFakeGirls() {
    const girls = [
        {
            name: "Yuki",
            imageUrl: "/assets/images/avatar/avt1.png",
            hotImageUrl: "/assets/images/avatar/avt2.png",
            fileUrl: "https://example.com/yuki-full.jpg",
            thinking: "Ahihi...",
            height: 165,
            age: 22,
            characteristics: "Sweet and caring",
            hobbies: "Reading, cooking, singing",
            likeCount: 4,
            playerCount: 2,
            round1: 85,
            round2: 60,
            round3: 90,
            occupation: "Student",
            description: "A sweet Japanese girl who loves to cook",
            childish: 50,
            talkative: 30,
            emotional: 10,
            naughty: 90,
            obey: 50,
            isPremium: false,
        },
        {
            name: "Lisa",
            imageUrl: "/assets/images/avatar/avt1.png",
            hotImageUrl: "/assets/images/avatar/avt2.png",
            fileUrl: "https://example.com/lisa-full.jpg",
            height: 170,
            age: 23,
            characteristics: "Confident and playful",
            thinking: "Hmm...",
            hobbies: "Dancing, photography",
            likeCount: 3,
            playerCount: 1,
            round1: 90,
            round2: 65,
            round3: 95,
            occupation: "Model",
            description: "An energetic Korean model with a passion for dance",
            childish: 30,
            talkative: 10,
            emotional: 90,
            naughty: 50,
            obey: 10,
            isPremium: true,
        },
        {
            name: "Sakura",
            imageUrl: "/assets/images/avatar/avt3.png",
            hotImageUrl: "/assets/images/avatar/avt4.png",
            fileUrl: "https://example.com/sakura-full.jpg",
            thinking: "Teehee~",
            height: 158,
            age: 20,
            characteristics: "Shy and gentle",
            hobbies: "Flower arranging, tea ceremony",
            likeCount: 5,
            playerCount: 3,
            round1: 82,
            round2: 58,
            round3: 85,
            occupation: "Tea ceremony instructor",
            description: "A traditional Japanese beauty with elegant manners",
            childish: 40,
            talkative: 20,
            emotional: 70,
            naughty: 30,
            obey: 80,
            isPremium: false,
        },
        {
            name: "Mei",
            imageUrl: "/assets/images/avatar/avt5.png",
            hotImageUrl: "/assets/images/avatar/avt6.png",
            fileUrl: "https://example.com/mei-full.jpg",
            thinking: "Want to play?",
            height: 162,
            age: 21,
            characteristics: "Energetic and sporty",
            hobbies: "Basketball, running",
            likeCount: 6,
            playerCount: 4,
            round1: 88,
            round2: 70,
            round3: 92,
            occupation: "Sports trainer",
            description: "An athletic girl with boundless energy",
            childish: 60,
            talkative: 80,
            emotional: 40,
            naughty: 70,
            obey: 40,
            isPremium: true,
        },
        {
            name: "Hina",
            imageUrl: "/assets/images/avatar/avt7.png",
            hotImageUrl: "/assets/images/avatar/avt8.png",
            fileUrl: "https://example.com/hina-full.jpg",
            thinking: "Let's study together!",
            height: 155,
            age: 19,
            characteristics: "Smart and diligent",
            hobbies: "Reading, solving puzzles",
            likeCount: 3,
            playerCount: 2,
            round1: 80,
            round2: 55,
            round3: 83,
            occupation: "College student",
            description: "A brilliant student with a sweet personality",
            childish: 30,
            talkative: 40,
            emotional: 60,
            naughty: 20,
            obey: 90,
            isPremium: false,
        },
        {
            name: "Rin",
            imageUrl: "/assets/images/avatar/avt9.png",
            hotImageUrl: "/assets/images/avatar/avt10.png",
            fileUrl: "https://example.com/rin-full.jpg",
            thinking: "Music is life!",
            height: 160,
            age: 22,
            characteristics: "Artistic and creative",
            hobbies: "Playing guitar, composing",
            likeCount: 7,
            playerCount: 5,
            round1: 85,
            round2: 63,
            round3: 88,
            occupation: "Musician",
            description: "A talented musician with a dreamy personality",
            childish: 45,
            talkative: 65,
            emotional: 85,
            naughty: 40,
            obey: 60,
            isPremium: true,
        },
        {
            name: "Mio",
            imageUrl: "/assets/images/avatar/avt11.png",
            hotImageUrl: "/assets/images/avatar/avt1.png",
            fileUrl: "https://example.com/mio-full.jpg",
            thinking: "Let's cook something!",
            height: 163,
            age: 24,
            characteristics: "Motherly and caring",
            hobbies: "Cooking, gardening",
            likeCount: 5,
            playerCount: 3,
            round1: 87,
            round2: 65,
            round3: 89,
            occupation: "Chef",
            description: "A skilled chef with a warm heart",
            childish: 20,
            talkative: 70,
            emotional: 75,
            naughty: 30,
            obey: 85,
            isPremium: false,
        },
        {
            name: "Aki",
            imageUrl: "/assets/images/avatar/avt2.png",
            hotImageUrl: "/assets/images/avatar/avt3.png",
            fileUrl: "https://example.com/aki-full.jpg",
            thinking: "Dance with me!",
            height: 168,
            age: 23,
            characteristics: "Graceful and elegant",
            hobbies: "Ballet, painting",
            likeCount: 8,
            playerCount: 6,
            round1: 90,
            round2: 68,
            round3: 93,
            occupation: "Dance instructor",
            description: "A graceful dancer with artistic flair",
            childish: 25,
            talkative: 50,
            emotional: 80,
            naughty: 45,
            obey: 70,
            isPremium: true,
        },
        {
            name: "Kana",
            imageUrl: "/assets/images/avatar/avt4.png",
            hotImageUrl: "/assets/images/avatar/avt5.png",
            fileUrl: "https://example.com/kana-full.jpg",
            thinking: "Shopping time!",
            height: 159,
            age: 21,
            characteristics: "Fashionable and trendy",
            hobbies: "Shopping, fashion design",
            likeCount: 6,
            playerCount: 4,
            round1: 84,
            round2: 62,
            round3: 87,
            occupation: "Fashion blogger",
            description: "A stylish fashionista with great taste",
            childish: 55,
            talkative: 90,
            emotional: 65,
            naughty: 60,
            obey: 45,
            isPremium: false,
        },
        {
            name: "Yui",
            imageUrl: "/assets/images/avatar/avt6.png",
            hotImageUrl: "/assets/images/avatar/avt7.png",
            fileUrl: "https://example.com/yui-full.jpg",
            thinking: "Games are fun!",
            height: 157,
            age: 20,
            characteristics: "Gamer and tech-savvy",
            hobbies: "Gaming, programming",
            likeCount: 4,
            playerCount: 2,
            round1: 83,
            round2: 59,
            round3: 86,
            occupation: "Game developer",
            description: "A cute gamer girl with coding skills",
            childish: 75,
            talkative: 45,
            emotional: 50,
            naughty: 35,
            obey: 65,
            isPremium: true,
        },
        {
            name: "Sora",
            imageUrl: "/assets/images/avatar/avt8.png",
            hotImageUrl: "/assets/images/avatar/avt9.png",
            fileUrl: "https://example.com/sora-full.jpg",
            thinking: "Look at the stars!",
            height: 164,
            age: 22,
            characteristics: "Dreamy and philosophical",
            hobbies: "Stargazing, poetry",
            likeCount: 5,
            playerCount: 3,
            round1: 86,
            round2: 64,
            round3: 89,
            occupation: "Astronomer",
            description: "A dreamy girl with her head in the stars",
            childish: 35,
            talkative: 60,
            emotional: 85,
            naughty: 25,
            obey: 75,
            isPremium: false,
        },
        {
            name: "Nana",
            imageUrl: "/assets/images/avatar/avt10.png",
            hotImageUrl: "/assets/images/avatar/avt11.png",
            fileUrl: "https://example.com/nana-full.jpg",
            thinking: "Let's work out!",
            height: 166,
            age: 23,
            characteristics: "Fit and motivated",
            hobbies: "Yoga, meditation",
            likeCount: 7,
            playerCount: 5,
            round1: 89,
            round2: 67,
            round3: 91,
            occupation: "Fitness instructor",
            description: "A wellness enthusiast with a balanced lifestyle",
            childish: 30,
            talkative: 75,
            emotional: 55,
            naughty: 40,
            obey: 80,
            isPremium: true,
        },
        {
            name: "Yuki",
            imageUrl: "/assets/images/avatar/avt12.png",
            hotImageUrl: "/assets/images/avatar/avt13.png",
            fileUrl: "https://example.com/yuki-full.jpg",
            thinking: "Let's make some sweets!",
            height: 158,
            age: 20,
            characteristics: "Sweet and caring",
            hobbies: "Baking, drawing",
            likeCount: 8,
            playerCount: 4,
            round1: 84,
            round2: 62,
            round3: 88,
            occupation: "Pastry chef",
            description: "A sweet girl who loves creating delicious desserts",
            childish: 70,
            talkative: 65,
            emotional: 75,
            naughty: 30,
            obey: 85,
            isPremium: false,
        },
        {
            name: "Mei",
            imageUrl: "/assets/images/avatar/avt14.png",
            hotImageUrl: "/assets/images/avatar/avt15.png",
            fileUrl: "https://example.com/mei-full.jpg",
            thinking: "Music is life!",
            height: 162,
            age: 21,
            characteristics: "Musical and passionate",
            hobbies: "Playing violin, composing",
            likeCount: 9,
            playerCount: 6,
            round1: 88,
            round2: 70,
            round3: 92,
            occupation: "Musician",
            description: "A talented violinist with a melodious soul",
            childish: 40,
            talkative: 70,
            emotional: 85,
            naughty: 35,
            obey: 75,
            isPremium: true,
        },
        {
            name: "Hana",
            imageUrl: "/assets/images/avatar/avt16.png",
            hotImageUrl: "/assets/images/avatar/avt17.png",
            fileUrl: "https://example.com/hana-full.jpg",
            thinking: "Nature is beautiful!",
            height: 160,
            age: 22,
            characteristics: "Gentle and nature-loving",
            hobbies: "Gardening, flower arranging",
            likeCount: 6,
            playerCount: 3,
            round1: 85,
            round2: 63,
            round3: 87,
            occupation: "Florist",
            description: "A gentle soul who finds peace among flowers",
            childish: 45,
            talkative: 55,
            emotional: 70,
            naughty: 25,
            obey: 90,
            isPremium: false,
        },
        {
            name: "Rin",
            imageUrl: "/assets/images/avatar/avt18.png",
            hotImageUrl: "/assets/images/avatar/avt19.png",
            fileUrl: "https://example.com/rin-full.jpg",
            thinking: "Time for adventure!",
            height: 165,
            age: 23,
            characteristics: "Adventurous and energetic",
            hobbies: "Rock climbing, hiking",
            likeCount: 10,
            playerCount: 7,
            round1: 90,
            round2: 75,
            round3: 93,
            occupation: "Adventure guide",
            description: "An energetic spirit always seeking new challenges",
            childish: 50,
            talkative: 85,
            emotional: 65,
            naughty: 45,
            obey: 70,
            isPremium: true,
        },
        {
            name: "Sakura",
            imageUrl: "/assets/images/avatar/avt20.png",
            hotImageUrl: "/assets/images/avatar/avt21.png",
            fileUrl: "https://example.com/sakura-full.jpg",
            thinking: "Dance with me!",
            height: 163,
            age: 21,
            characteristics: "Graceful and elegant",
            hobbies: "Traditional dance, tea ceremony",
            likeCount: 8,
            playerCount: 5,
            round1: 87,
            round2: 68,
            round3: 90,
            occupation: "Dance instructor",
            description: "A graceful dancer who embodies traditional beauty",
            childish: 35,
            talkative: 60,
            emotional: 75,
            naughty: 30,
            obey: 85,
            isPremium: true,
        }
    ];

    for (const girlData of girls) {
        const existingGirl = await prisma.girl.findFirst({
            where: { name: girlData.name }
        });

        if (!existingGirl) {
            await prisma.girl.create({
                data: girlData
            });
        } else {
            console.log(`Girl ${girlData.name} already exists.`);
            // update girl data
            await prisma.girl.update({
                where: { id: existingGirl.id },
                data: girlData
            });
        }
    }

    console.log("Seeding girls completed.");
}

async function createFakeRooms() {
    // delete all rooms
    // await prisma.room.deleteMany();/

    const rooms = [
        {
            name: `Bedroom`,
            description: "A cozy bedroom setting",
            imageUrl: "/assets/images/room/room1.png",
            credits: 0,
            isPremium: false,
        },
        {
            name: `Beach`,
            description: "A beautiful beach setting",
            imageUrl: "/assets/images/room/room2.png",
            credits: 200,
            isPremium: false,
        },
        {
            name: `Office`,
            description: "A beautiful office setting",
            imageUrl: "/assets/images/room/room3.png",
            credits: 300,
            isPremium: false,
        },
        {
            name: `Office`,
            description: "A beautiful office setting",
            imageUrl: "/assets/images/room/room3.png",
            credits: 300,
            isPremium: false,
        },
        {
            name: `Beach`,
            description: "A beautiful beach setting",
            imageUrl: "/assets/images/room/room4.png",
            credits: 300,
            isPremium: false,
        },
        {
            name: `Beach`,
            description: "A beautiful beach setting",
            imageUrl: "/assets/images/room/room5.png",
            credits: 0,
            isPremium: false,
        }
    ];

    for (const roomData of rooms) {
        const existingRoom = await prisma.room.findFirst({
            where: { imageUrl: roomData.imageUrl, name: roomData.name }
        });

        if (!existingRoom) {
            await prisma.room.create({
                data: roomData
            });
        } else {
            console.log(`Room ${roomData.name} already exists.`);
            // update room data
            await prisma.room.update({
                where: { id: existingRoom.id },
                data: roomData
            });
        }
    }
    console.log("Seeding rooms completed.");
}

async function createFakeClothes() {
    const girls = await prisma.girl.findMany();

    for (const girl of girls) {
        const clothes = [
            {
                name: "Casual Outfit",
                description: "Comfortable everyday wear",
                type: "CASUAL",
                credits: 50,
                imageUrl: "https://example.com/casual.jpg",
                hotImageUrl: "https://example.com/casual-hot.jpg",
                fileUrl: "https://example.com/casual-full.jpg",
                isPremium: false,
                girlId: girl.id
            },
            {
                name: "Swimsuit",
                description: "Beach wear",
                type: "SWIM",
                credits: 150,
                imageUrl: "https://example.com/swim.jpg",
                hotImageUrl: "https://example.com/swim-hot.jpg",
                fileUrl: "https://example.com/swim-full.jpg",
                isPremium: true,
                girlId: girl.id
            }
        ];

        for (const clothingData of clothes) {
            const existingClothing = await prisma.clothes.findFirst({
                where: {
                    name: clothingData.name,
                    girlId: clothingData.girlId
                }
            });

            if (!existingClothing) {
                await prisma.clothes.create({
                    data: clothingData
                });
            }
        }
    }

    console.log("Seeding clothes completed.");
}

async function createFakeCategories() {
    const categories = [
        {
            name: "Casual Date",
            description: "Perfect for a relaxed day out",
        },
        {
            name: "Romantic Evening",
            description: "Special moments for special occasions",
        },
        {
            name: "Beach Fun",
            description: "Exciting activities by the shore",
        }
    ];

    for (const categoryData of categories) {
        const existingCategory = await prisma.category.findFirst({
            where: { name: categoryData.name }
        });

        if (!existingCategory) {
            await prisma.category.create({
                data: categoryData
            });
        }
    }

    console.log("Seeding categories completed.");
}

async function createFakeGirlCategories() {
    const girls = await prisma.girl.findMany();
    const categories = await prisma.category.findMany();

    for (const girl of girls) {
        // Randomly assign 1-3 categories to each girl
        const numberOfCategories = Math.floor(Math.random() * 3) + 1;
        const shuffledCategories = categories.sort(() => Math.random() - 0.5);
        const selectedCategories = shuffledCategories.slice(0, numberOfCategories);

        for (const category of selectedCategories) {
            const existingGirlCategory = await prisma.girlCategory.findFirst({
                where: {
                    girlId: girl.id,
                    categoryId: category.id
                }
            });

            if (!existingGirlCategory) {
                await prisma.girlCategory.create({
                    data: {
                        girlId: girl.id,
                        categoryId: category.id
                    }
                });
            }
        }
    }

    console.log("Seeding girl categories completed.");
}

async function createFakeActions() {
    const actions = [
        {
            name: "Wave",
            description: "A friendly wave hello",
            fileUrl: "https://example.com/animations/wave.fbx",
            isPremium: false,
            credits: 0,
        },
        {
            name: "Blow Kiss",
            description: "Blows a sweet kiss",
            fileUrl: "https://example.com/animations/blow-kiss.fbx",
            isPremium: true,
            credits: 100,
        },
        {
            name: "Dance",
            description: "A cute dance move",
            fileUrl: "https://example.com/animations/dance.fbx",
            isPremium: true,
            credits: 150,
        },
        {
            name: "Laugh",
            description: "A cheerful laugh",
            fileUrl: "https://example.com/animations/laugh.fbx",
            isPremium: false,
            credits: 50,
        }
    ];

    for (const actionData of actions) {
        const existingAction = await prisma.action.findFirst({
            where: { name: actionData.name }
        });

        if (!existingAction) {
            await prisma.action.create({
                data: actionData
            });
        }
    }

    // Set default actions for girls
    const girls = await prisma.girl.findMany();
    const defaultAction = await prisma.action.findFirst({
        where: { name: "Wave" }
    });

    if (defaultAction) {
        for (const girl of girls) {
            await prisma.girl.update({
                where: { id: girl.id },
                data: { defaultActionId: defaultAction.id }
            });
        }
    }

    console.log("Seeding actions completed.");
}

async function createFakeUserGirl() {
    const userId = 4;

    // Get all available girls
    const girls = await prisma.girl.findMany();

    // Create UserGirl entries for 3 random girls
    const numberOfGirls = 3;
    const shuffledGirls = girls.sort(() => Math.random() - 0.5);
    const selectedGirls = shuffledGirls.slice(0, numberOfGirls);

    for (const girl of selectedGirls) {
        // Check if relationship already exists
        const existingUserGirl = await prisma.userGirl.findFirst({
            where: {
                userId: userId,
                girlId: girl.id
            }
        });

        if (!existingUserGirl) {
            // Create new UserGirl relationship
            const userGirl = await prisma.userGirl.create({
                data: {
                    userId: userId,
                    girlId: girl.id,
                    threadId: `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                }
            });

            // Create some initial messages
            await prisma.userGirlMessage.createMany({
                data: [
                    {
                        userGirlId: userGirl.id,
                        type: 'GIRL',
                        message: `Hi! I'm ${girl.name}. Nice to meet you!`,
                        createdAt: new Date()
                    },
                    {
                        userGirlId: userGirl.id,
                        type: 'USER',
                        message: 'Hello! Nice to meet you too!',
                        createdAt: new Date(Date.now() + 1000)
                    },
                    {
                        userGirlId: userGirl.id,
                        type: 'GIRL',
                        message: girl.thinking || 'Would you like to chat with me?',
                        createdAt: new Date(Date.now() + 2000)
                    }
                ]
            });

            console.log(`Created UserGirl relationship with ${girl.name}`);
        } else {
            console.log(`UserGirl relationship with ${girl.name} already exists`);
        }
    }

    console.log('Finished creating fake UserGirl data');
}

async function createFakeUserGirlMessages() {
    // Get all UserGirl relationships
    const userGirls = await prisma.userGirl.findMany({
        include: {
            girl: true
        }
    });

    for (const userGirl of userGirls) {
        // Create a conversation flow with multiple messages
        const messages: any[] = [
            {
                userGirlId: userGirl.id,
                type: 'USER',
                message: "Hey! How are you today?",
            },
            {
                userGirlId: userGirl.id,
                type: 'GIRL',
                message: `I'm doing great! ${userGirl.girl.thinking || 'Would you like to chat?'}`,
            },
            {
                userGirlId: userGirl.id,
                type: 'USER',
                message: "What are your hobbies?",
            },
            {
                userGirlId: userGirl.id,
                type: 'GIRL',
                message: `I love ${userGirl.girl.hobbies}! It's really fun and relaxing.`,
            },
            {
                userGirlId: userGirl.id,
                type: 'USER',
                message: "That's interesting! Can you share a photo?",
            },
            {
                userGirlId: userGirl.id,
                type: 'GIRL',
                message: "Here's a photo of me!",
                mediaUrl: userGirl.girl.imageUrl,
            },
            {
                userGirlId: userGirl.id,
                type: 'USER',
                message: "You look great! What do you do for work?",
            },
            {
                userGirlId: userGirl.id,
                type: 'GIRL',
                message: `I work as a ${userGirl.girl.occupation}. I really enjoy it!`,
            }
        ];

        // Create messages for each UserGirl
        await prisma.userGirlMessage.createMany({
            data: messages
        });
    }

    console.log("Seeding user girl messages completed.");
}

async function main() {
    // await createFakeCategories();
    // await createDefaultUser();
    // await createFakeGirls();
    // await createFakeActions();
    // await createFakeGirlCategories();
    // await createFakeRooms();
    // await createFakeClothes();
    // await createFakeUserGirl();
    await createFakeUserGirlMessages();
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

