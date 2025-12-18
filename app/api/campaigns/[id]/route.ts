import { NextResponse } from 'next/server';
import { Campaign } from '@prisma/client';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: { videos: true }
    });
    if (!campaign) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }
    return NextResponse.json(campaign);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    try {
        const body = await request.json();
        const { videos, ...campaignData } = body;

        // Transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Campaign Details
            const updatedCampaign = await tx.campaign.update({
                where: { id },
                data: campaignData,
            });

            // 2. Handle Videos Sync if provided
            if (videos && Array.isArray(videos)) {
                // Upsert provided videos
                for (const video of videos) {
                    const { id: videoId, ...videoData } = video;
                    // Ensure flat stats are preserved along with url and cost
                    await tx.video.upsert({
                        where: { id: videoId },
                        update: videoData,
                        create: { ...videoData, id: videoId, campaignId: id }
                    });
                }

                // Delete videos not in the incoming list (Sync)
                const videoIdsToKeep = videos.map((v: any) => v.id);
                await tx.video.deleteMany({
                    where: {
                        campaignId: id,
                        id: { notIn: videoIdsToKeep }
                    }
                });
            }

            // Return updated campaign with videos
            return await tx.campaign.findUnique({
                where: { id },
                include: { videos: true }
            });
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
