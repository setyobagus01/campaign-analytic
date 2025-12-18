import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Add headers to mimic a real browser to avoid instant blocking (basic attempt)
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        };

        const response = await fetch(url, { headers });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch TikTok page: ${response.statusText}` }, { status: response.status });
        }

        const html = await response.text();

        // Strategy 1: Look for __UNIVERSAL_DATA_FOR_REHYDRATION__
        let data;
        let videoId;

        const universalDataMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([^<]+)<\/script>/);
        if (universalDataMatch && universalDataMatch[1]) {
            try {
                const json = JSON.parse(universalDataMatch[1]);
                data = json?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
                videoId = data?.id;
            } catch (e) {
                console.error('Failed to parse Universal Data', e);
            }
        }

        // Strategy 2: Look for SIGI_STATE
        if (!data) {
            const sigiStateMatch = html.match(/<script id="SIGI_STATE" type="application\/json">([^<]+)<\/script>/);
            if (sigiStateMatch && sigiStateMatch[1]) {
                try {
                    const json = JSON.parse(sigiStateMatch[1]);
                    // Depending on structure, sometimes it's under ItemModule
                    videoId = Object.keys(json.ItemModule || {})[0];
                    data = json.ItemModule?.[videoId];
                } catch (e) {
                    console.error('Failed to parse SIGI_STATE', e);
                }
            }
        }

        if (!data) {
            // Fallback or error
            // Sometimes TikTok returns a different structure or simply blocks.
            return NextResponse.json({ error: 'Could not extract video data from HTML' }, { status: 422 });
        }

        const stats = data.stats || {};

        const tiktokId = videoId || data.id;

        return NextResponse.json({
            id: tiktokId, // Backward compatibility if needed, but safer to use tiktokId field
            tiktokId: tiktokId,
            stats: {
                diggCount: parseInt(String(stats.diggCount || 0)),
                shareCount: parseInt(String(stats.shareCount || 0)),
                commentCount: parseInt(String(stats.commentCount || 0)),
                playCount: parseInt(String(stats.playCount || 0)),
                collectCount: parseInt(String(stats.collectCount || 0)),
            },
            videoTitle: data.desc,
            cover: data.video?.cover,
            author: data.author?.nickname,
        });

    } catch (error) {
        console.error('Scraping error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
