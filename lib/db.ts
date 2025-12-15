import fs from 'fs/promises';
import path from 'path';

export interface Video {
    url: string;
    cost: number;
    id?: string;
    // Stats from TikTok (cached/updated)
    stats?: {
        diggCount: number;
        shareCount: number;
        commentCount: number;
        playCount: number;
        collectCount: number;
    };
    updatedAt?: string;
}

export interface Campaign {
    id: string;
    name: string;
    timeline: string; // e.g., "2024-01-01 to 2024-01-31" or just a string
    imageUrl?: string;
    description: string;
    videos: Video[];
    createdAt: string;
}

const DB_PATH = path.join(process.cwd(), 'data', 'campaigns.json');

// Ensure data directory exists
async function ensureDb() {
    try {
        await fs.access(DB_PATH);
    } catch {
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify([], null, 2));
    }
}

export async function getCampaigns(): Promise<Campaign[]> {
    await ensureDb();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

export async function saveCampaign(campaign: Campaign): Promise<Campaign> {
    const campaigns = await getCampaigns();
    const index = campaigns.findIndex((c) => c.id === campaign.id);

    if (index >= 0) {
        campaigns[index] = campaign;
    } else {
        campaigns.push(campaign);
    }

    await fs.writeFile(DB_PATH, JSON.stringify(campaigns, null, 2));
    return campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
    const campaigns = await getCampaigns();
    const filtered = campaigns.filter((c) => c.id !== id);
    await fs.writeFile(DB_PATH, JSON.stringify(filtered, null, 2));
}

export async function getCampaign(id: string): Promise<Campaign | undefined> {
    const campaigns = await getCampaigns();
    return campaigns.find((c) => c.id === id);
}
