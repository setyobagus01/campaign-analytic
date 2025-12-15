# TikTok Campaign Analytics - Walkthrough

I have built the TikTok Campaign Analytics application. It allows you to manage campaigns, add TikTok videos by URL, and view aggregated metrics.

## Features Implemented

### 1. Dashboard (`/`)
- Shows global metrics across all campaigns.
- **Key Metrics**: Total Cost, Views, Engagement, CPE, CPV, CPM.
- **Visuals**: Clean cards with icons using a premium dark/light mode compatible design.

### 2. Campaigns Management (`/campaigns`)
- **List View**: See all campaigns with high-level performance metrics.
- **Create/Edit**: Add new campaigns.
- **Form**:
    - Input Campaign Name, Timeline, Description, Banner.
    - **Dynamic Video List**: Add multiple TikTok URLs and Cost.
    - **Auto-Fetch**: Automatically fetches `diggCount`, `playCount`, etc. from TikTok when adding/saving.

### 3. Campaign Details (`/campaigns/[id]`)
- Detailed breakdown of a specific campaign.
- **Video Table**: Lists each video with individual stats (Views, Likes, Comments, Cost).
- **Actions**: Link to view deep-dive comments for each video.

### 4. Video Comments (`/videos/[id]`)
- Fetches and displays the latest 20 comments for a video.
- Shows user avatar, nickname, comment text, and likes.

## Technical Details

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Shadcn-like UI components.
- **Data**:
    - **Campaigns**: Stored in `data/campaigns.json` (Local JSON DB).
    - **TikTok Data**: Scraped via `src/app/api/tiktok/video` (HTML Parsing).
    - **Comments**: Proxied via `src/app/api/tiktok/comments` (Official/Unofficial API).

## How to Run

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Verification Results

- [x] **Project Structure**: Next.js app created/configured.
- [x] **API**: Scraping route extracts stats and video ID.
- [x] **UI**: Responsive dashboard and forms are implemented.
- [x] **Data Persistence**: Campaigns are saved to disk.

## Screenshots

*(Simulated)*
- **Dashboard**: Shows total spend and views.
- **Campaign Form**: Allows pasting TikTok links.

## How to Push to GitHub

Since you have the **GitHub CLI (gh)** installed and authenticated, follow these steps:

1.  **Initialize & Commit**:
    ```bash
    git add .
    git commit -m "feat: complete initial implementation"
    ```

2.  **Create & Push**:
    ```bash
    # Creates specific repo, adds remote, and pushes main branch
    gh repo create campaign-analytic --public --source=. --remote=origin --push
    ```
