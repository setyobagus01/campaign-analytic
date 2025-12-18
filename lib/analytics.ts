import { Campaign, Video } from '@prisma/client';

export interface Metrics {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saved: number;
    videoCount: number;
    engagement: number;
    cost: number;
    cpe: number;
    cpv: number;
    cpm: number;
    engagementRate: number;
}

export function calculateMetrics(campaigns: Campaign[]): Metrics {
    let views = 0;
    let likes = 0;
    let comments = 0;
    let shares = 0;
    let saved = 0;
    let cost = 0;
    let videoCount = 0;

    campaigns.forEach(campaign => {
        const videos = (campaign as any).videos || [];
        videos.forEach((video: any) => {
            videoCount++;
            cost += Number(video.cost) || 0;
            // Mapping stats from direct properties if inconsistent with Prisma types or runtime mismatch
            // Assuming video object structure might differ slightly at runtime
            if (video) {
                views += Number(video.playCount) || 0;
                likes += Number(video.diggCount) || 0;
                comments += Number(video.commentCount) || 0;
                shares += Number(video.shareCount) || 0;
                saved += Number(video.collectCount) || 0;
            }
        });
    });

    const engagement = likes + comments + shares + saved;

    const cpe = engagement > 0 ? cost / engagement : 0;
    const cpv = views > 0 ? cost / views : 0;
    const cpm = views > 0 ? cost / (views / 1000) : 0;
    const engagementRate = views > 0 ? (engagement / views) * 100 : 0;

    return {
        views,
        likes,
        comments,
        shares,
        saved,
        videoCount,
        engagement,
        cost,
        cpe,
        cpv,
        cpm,
        engagementRate
    };
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatNumber(num: number) {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
}
