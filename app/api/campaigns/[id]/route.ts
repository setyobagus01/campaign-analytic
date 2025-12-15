import { NextResponse } from 'next/server';
import { getCampaign, saveCampaign, deleteCampaign, Campaign } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const campaign = await getCampaign(id);
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
    const campaign = await getCampaign(id);
    if (!campaign) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    try {
        const body = await request.json();
        // Merge updates
        const updatedCampaign: Campaign = {
            ...campaign,
            ...body,
            id: campaign.id, // Immutable ID
        };

        await saveCampaign(updatedCampaign);
        return NextResponse.json(updatedCampaign);

    } catch (error) {
        return NextResponse.json({ error: 'Update Failed' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await deleteCampaign(id);
    return NextResponse.json({ success: true });
}
