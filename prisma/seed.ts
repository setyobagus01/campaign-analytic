import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Create a default campaign with the requested video
    const campaign = await prisma.campaign.create({
        data: {
            name: 'Initial Campaign',
            timeline: 'Q4 2025',
            description: 'Campaign seeded with initial video data',
            videos: {
                create: {
                    id: '7568764274202529031',
                    url: 'https://www.tiktok.com/@perintispresisipoldasult/video/7568764274202529031',
                    cost: 2000000,

                    // Default stats (will be updated by the app fetching logic later)
                    diggCount: 0,
                    shareCount: 0,
                    commentCount: 0,
                    playCount: 0,
                    collectCount: 0,
                }
            }
        }
    })

    console.log(`Seeding finished. Created campaign: ${campaign.name} with ID: ${campaign.id}`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
