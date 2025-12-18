import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { scrapeTikTokVideo } from '@/lib/tiktok';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // 1. Fetch Campaign with Videos
    const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: { videos: true }
    });

    if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // 2. Refresh Stats for Each Video
    // We process sequentially or with limited concurrency to avoid being blocked by TikTok
    // For now, let's try Promise.all but with consideration that TikTok might rate limit
    // Since we have a library now, we can add delay there if needed, but for now simple loop.

    // We'll update regardless of success/fail of individual scrape to continue the process
    const updatedVideos = await Promise.all(campaign.videos.map(async (video) => {
        if (!video.url) return video;

        // Add a small random delay to spread requests slightly?
        // await new Promise(r => setTimeout(r, Math.random() * 1000));

        const scrapedData = await scrapeTikTokVideo(video.url);

        if (scrapedData && scrapedData.stats) {
            try {
                // Update DB
                return await prisma.video.update({
                    where: { id: video.id },
                    data: {
                        diggCount: scrapedData.stats.diggCount,
                        shareCount: scrapedData.stats.shareCount,
                        commentCount: scrapedData.stats.commentCount,
                        playCount: scrapedData.stats.playCount,
                        collectCount: scrapedData.stats.collectCount,
                        updatedAt: new Date(),
                    }
                });
            } catch (e) {
                console.error(`Failed to update video ${video.id} in DB`, e);
                return video;
            }
        }
        return video;
    }));

    return NextResponse.json({
        success: true,
        message: 'Refresh complete',
        updatedCount: updatedVideos.length
    });
}
