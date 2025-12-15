import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tiktokApiUrl = 'https://www.tiktok.com/api/comment/list/';

    // Forward all query params as-is
    const queryString = searchParams.toString();
    const fullUrl = `${tiktokApiUrl}?${queryString}`;

    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.tiktok.com/',
            // Add more fake headers if needed
        };

        const response = await fetch(fullUrl, { headers });

        if (!response.ok) {
            return NextResponse.json({ error: `TikTok API error: ${response.statusText}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
