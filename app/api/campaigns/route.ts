import { NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { Campaign } from '@prisma/client';

export async function GET() {
    const campaigns = await prisma.campaign.findMany({
        include: {
            videos: true
        }
    });
    return NextResponse.json(campaigns);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const videosData = (body.videos || []).reduce((acc: any[], video: any) => {
            let tiktokId = video.tiktokId || video.id;

            // Fallback: Try to extract ID from URL if missing
            if (!tiktokId && video.url) {
                const match = video.url.match(/video\/(\d+)/);
                if (match && match[1]) {
                    tiktokId = match[1];
                }
            }

            if (tiktokId) {
                acc.push({
                    id: uuidv4(),
                    tiktokId: tiktokId,
                    url: video.url,
                    cost: video.cost || 0,
                    diggCount: video.diggCount || 0,
                    shareCount: video.shareCount || 0,
                    commentCount: video.commentCount || 0,
                    playCount: video.playCount || 0,
                    collectCount: video.collectCount || 0,
                });
            }
            return acc;
        }, []);

        const newCampaign = {
            id: uuidv4(),
            name: body.name,
            timeline: body.timeline || '',
            description: body.description || '',
            imageUrl: body.imageUrl || '', // Optional
            createdAt: new Date(),
        };

        const createdCampaign = await prisma.campaign.create({
            data: {
                ...newCampaign,
                videos: {
                    create: videosData,
                },
            },
            include: {
                videos: true,
            },
        });

        return NextResponse.json(createdCampaign, { status: 201 });

    } catch (error) {
        console.error('Create Campaign Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
