# Notion Publisher Skill

One-command publishing from Notion to WeChat Official Account. This tool is the **final executor** in a publishing workflow.

## Features
- **Flexible Input**: Supports publishing from Notion Page ID or local Markdown file.
- **Smart Image Handling**: Automatically downloads remote images, uploads local images, and replaces links with WeChat URLs.
- **WeChat Optimized**: Applies clean, readable CSS styles to the output.
- **Digest Support**: Accepts custom digest/summary.

## Workflow (ABCD)

To publish a high-quality article, the Agent **MUST** follow this sequence:

### A - Acquisition (拉取)
Fetch the content.
- If from Notion: `node bin/fetch_notion.js <ID> > draft.md` (or similar helper) OR let the Agent read it.
- **Goal**: Get a local `draft.md` file that we can edit.

### B - Beautification (配图)
**Crucial Step**: If the article lacks images or needs better visuals.
1. Analyze `draft.md`.
2. Call **`baoyu-article-illustrator`** skill (or perform equivalent logic):
   - Identify insertion points.
   - Generate high-quality illustrations using `nano-banana-pro`.
   - Illustrations are saved to: `illustrations/{topic-slug}/illustration-*.png`
   - **Edit `draft.md`** to insert images using **absolute paths**: `![Alt text](/Users/roy/clawd/illustrations/{topic-slug}/illustration-1.png)`.

### C - Cover (封面)
**Mandatory**: WeChat articles need a **2.35:1** cover (cinematic aspect ratio).
1. Analyze title and content.
2. Call **`baoyu-cover-image`** skill (or generate manually):
   - **Aspect ratio**: Must be **2.35:1** (e.g., 2350×1000, 1880×800)
   - Prompt: "High quality, cinematic, 2.35:1, [Topic]..."
   - Cover is saved to: `cover-image/{topic-slug}/cover.png`
   - Note the **absolute path** for Step D: `/Users/roy/clawd/cover-image/{topic-slug}/cover.png`

### D - Delivery (发布)
Execute the publisher script with the prepared assets.

```bash
# Use absolute paths for images
node skills/notion-publisher/bin/publish.js notion-publish-workspace/draft.md /Users/roy/clawd/cover-image/{topic-slug}/cover.png
```

**Important**: 
- Draft file should be in `notion-publish-workspace/`
- Images in draft should use **absolute paths** (e.g., `/Users/roy/clawd/illustrations/{topic-slug}/illustration-1.png`)
- Cover image path should be **absolute** (e.g., `/Users/roy/clawd/cover-image/{topic-slug}/cover.png`)

## Setup

1. **Install dependencies**:
   ```bash
   cd skills/notion-publisher
   npm install
   ```

2. **Configure**:
   `~/.config/notion-publisher/config.json`:
   ```json
   {
     "notion_key": "ntn_...",
     "wechat_appid": "wx...",
     "wechat_secret": "...",
     "author": "Your Name"
   }
   ```

## Usage

```bash
# From Local File (Recommended for AI Workflow)
node skills/notion-publisher/bin/publish.js ./draft.md cover.png --digest "Summary"

# From Notion ID (Direct publish, no AI illustration injection)
node skills/notion-publisher/bin/publish.js <PAGE_ID> cover.png --digest "Summary"
```
