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

                const keptVideoIds: string[] = [];

                // Upsert provided videos
                for (const video of videos) {
                    const { id: videoId, tiktokId: inputTikTokId, ...videoData } = video;
                    // Fallback: if tiktokId isn't explicit, assume id might be it (for new scrapes), 
                    // unless id is a UUID (existing). But since we have composite unique, 
                    // tiktokId is safer if we ensure it's always mapped.
                    // For existing videos, they should have tiktokId in DB.
                    const tiktokId = inputTikTokId || videoId;

                    // Ensure flat stats are preserved along with url and cost
                    // We use tiktokId + campaignId unique constraint for upsert
                    const upserted = await tx.video.upsert({
                        where: {
                            tiktokId_campaignId: {
                                tiktokId: tiktokId,
                                campaignId: id
                            }
                        },
                        update: { ...videoData, tiktokId },
                        create: { ...videoData, tiktokId, campaignId: id }
                    });
                    keptVideoIds.push(upserted.id);
                }

                // Delete videos not in the incoming list (Sync)
                // We use the actual UUIDs from the upsert operations to ensure we don't delete new videos
                await tx.video.deleteMany({
                    where: {
                        campaignId: id,
                        id: { notIn: keptVideoIds }
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
