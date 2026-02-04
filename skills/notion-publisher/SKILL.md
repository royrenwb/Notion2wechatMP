# Notion Publisher Skill

One-command publishing from Notion to WeChat Official Account. This tool is the **final executor** in a publishing workflow.

## Features
- **Flexible Input**: Supports publishing from Notion Page ID or local Markdown file.
- **Smart Image Handling**:
  - Auto-detects image count from Notion pages
  - Intelligently recommends whether to add AI illustrations
  - Preserves all existing images in original format
  - Automatically downloads remote images, uploads local images, and replaces links with WeChat URLs
- **WeChat Optimized**: Applies clean, readable CSS styles to the output.
- **Digest Support**: Accepts custom digest/summary.

## Workflow (ABCD)

To publish a high-quality article, the Agent **MUST** follow this sequence:

### 📊 Image Count Check (Smart Decision Point)

When executing Step A, automatically determine whether to proceed to Step B:

| Image Count | Recommendation | Action |
|-------------|---------------|--------|
| **0-2** | ⚠️ Insufficient | Proceed to B (add 2-4 illustrations) |
| **3-5** | 🔶 Moderate | Ask user: "Add more illustrations? (yes/no)" |
| **6-10** | 🟡 Balanced | Ask user: "Enhance with AI illustrations? (yes/no)" |
| **11+** | ✅ Sufficient | Skip B, proceed to C (cover only) |

**Important**:
- Always report image count to user: "Article contains X images"
- Wait for user confirmation when image count is 3-10
- Auto-skip when image count > 10 (inform user of decision)

### A - Acquisition (拉取)
Fetch the content.
- If from Notion: Fetch via Notion API, preserving **all existing images**
- Use `jq` or API helper to convert Notion blocks to Markdown
- **Critical**: Auto-detect and count all images in the page
- Export to: `notion-publish-workspace/draft.md`
- **Report to user**: "Article contains X images"
- **Goal**: Get a local `draft.md` file that we can edit, with all image links preserved (Use `![description](<url>)` format)

After fetching content, intelligently suggest next steps based on image count:
- **Images < 3**: Strongly recommend → Proceed to B (Beautification needed)
- **Images 3-10**: Ask user → "Article has moderate images (X). Add more illustrations? (yes/no)"
- **Images > 10**: Suggest → Skip to C (Cover) - ample images present, beautification optional

### B - Beautification (配图)
**Conditional Step**: Based on image count and user feedback from Step A.
1. **Decision logic** (from Step A recommendations):
   - If images < 3: Always proceed
   - If images 3-10: Proceed only if user confirms
   - If images > 10: Skip (proceed to C)
2. Analyze `draft.md` for key sections needing visuals.
3. Call **`baoyu-article-illustrator`** skill (or perform equivalent logic):
   - Identify insertion points.
   - Generate high-quality illustrations using `nano-banana-pro`.
   - Illustrations are saved to: `illustrations/{topic-slug}/illustration-*.png`
   - **Edit `draft.md`** to insert images using **absolute paths**: `![Alt text](/Users/roy/clawd/illustrations/{topic-slug}/illustration-1.png)`.
4. **Update draft with new illustrations** while preserving existing images.

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

# Step A: Detect image count (via API)
curl -H "Authorization: Bearer $NOTION_KEY" \
  "https://api.notion.com/v1/blocks/<PAGE_ID>/children" \
  | jq '[.results[] | select(.type == "image")] | length'
```
