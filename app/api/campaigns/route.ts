import { NextResponse } from 'next/server';
import { getCampaigns, saveCampaign, Campaign } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    const campaigns = await getCampaigns();
    return NextResponse.json(campaigns);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const newCampaign: Campaign = {
            id: uuidv4(),
            name: body.name,
            timeline: body.timeline || '',
            description: body.description || '',
            imageUrl: body.imageUrl || '', // Optional
            videos: body.videos || [],
            createdAt: new Date().toISOString(),
        };

        await saveCampaign(newCampaign);
        return NextResponse.json(newCampaign, { status: 201 });

    } catch (error) {
        console.error('Create Campaign Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
