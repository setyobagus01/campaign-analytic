import { NextResponse } from 'next/server';
import { scrapeTikTokVideo } from '@/lib/tiktok';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const scrapedData = await scrapeTikTokVideo(url);

        if (!scrapedData) {
            return NextResponse.json({ error: 'Could not extract video data' }, { status: 422 });
        }

        return NextResponse.json({
            id: scrapedData.tiktokId,
            tiktokId: scrapedData.tiktokId,
            stats: scrapedData.stats,
            videoTitle: scrapedData.videoTitle,
            cover: scrapedData.cover,
            author: scrapedData.author,
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
