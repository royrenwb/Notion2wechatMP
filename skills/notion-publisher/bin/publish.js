const axios = require('axios');
const fs = require('fs');
const MarkdownIt = require('markdown-it');
const FormData = require('form-data');
const path = require('path');
const https = require('https');
const os = require('os');

// Configuration
const CONFIG_PATH = path.join(os.homedir(), '.config', 'notion-publisher', 'config.json');

// Styles
const STYLES = {
    h1: 'font-size: 22px; font-weight: bold; margin-top: 30px; margin-bottom: 20px; color: #333; line-height: 1.4;',
    h2: 'font-size: 18px; font-weight: bold; margin-top: 30px; margin-bottom: 15px; color: #333; border-left: 4px solid #07C160; padding-left: 10px; line-height: 1.4;',
    h3: 'font-size: 16px; font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #333;',
    p: 'font-size: 16px; line-height: 1.8; margin-bottom: 20px; text-align: justify; color: #3f3f3f; letter-spacing: 0.5px;',
    li: 'font-size: 16px; line-height: 1.8; margin-bottom: 8px; color: #3f3f3f; letter-spacing: 0.5px; list-style-position: inside;',
    img: 'max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);',
    blockquote: 'margin: 20px 0; padding: 15px; background: #f7f7f7; border-left: 4px solid #d9d9d9; color: #666; font-size: 15px; line-height: 1.6;',
    code: 'font-family: Menlo, Monaco, Consolas, monospace; font-size: 14px; background-color: #f0f0f0; padding: 2px 5px; border-radius: 3px; color: #d63384;',
    container: 'font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif;'
};

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// Custom renderer
let insideList = false;

md.renderer.rules.heading_open = (tokens, idx) => {
    const level = tokens[idx].tag;
    const style = level === 'h1' ? STYLES.h1 : (level === 'h2' ? STYLES.h2 : STYLES.h3);
    return `<${level} style="${style}">`;
};
md.renderer.rules.paragraph_open = () => {
    // If inside a list, use inline style to prevent bullet misalignment
    if (insideList) {
        return `<p style="margin: 0; display: inline;">`;
    }
    return `<p style="${STYLES.p}">`;
};
md.renderer.rules.bullet_list_open = () => '<ul style="padding-left: 20px; margin-bottom: 20px;">';
md.renderer.rules.ordered_list_open = () => '<ol style="padding-left: 20px; margin-bottom: 20px;">';
md.renderer.rules.list_item_open = () => {
    insideList = true;
    return `<li style="${STYLES.li}">`;
};
md.renderer.rules.list_item_close = () => {
    insideList = false;
    return '</li>';
};
md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx];
    const src = token.attrs[token.attrIndex('src')][1];
    const alt = token.content;
    return `<section style="text-align: center; margin: 20px 0;"><img src="${src}" alt="${alt}" style="${STYLES.img}" /></section>`;
};
md.renderer.rules.blockquote_open = () => `<blockquote style="${STYLES.blockquote}">`;
md.renderer.rules.code_inline = (tokens, idx) => `<code style="${STYLES.code}">${tokens[idx].content}</code>`;

// Helper functions
function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        throw new Error(`Config file not found at ${CONFIG_PATH}. Please run setup first.`);
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function loadClawdbotConfig() {
    const configPath = path.join(os.homedir(), '.clawdbot', 'clawdbot.json');
    if (!fs.existsSync(configPath)) {
        throw new Error(`Clawdbot config file not found at ${configPath}. Cannot fetch NVIDIA keys.`);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

async function generateDigestAI(content) {
    try {
        const clawdbotConfig = loadClawdbotConfig();
        const taijiaiConfig = clawdbotConfig.models?.providers?.taijiai;
        
        if (!taijiaiConfig || !taijiaiConfig.apiKey) {
            throw new Error('TaijiAI config (apiKey) not found in Clawdbot config.');
        }

        const baseUrl = taijiaiConfig.baseUrl || 'https://bobdong.cn/v1';
        const apiKey = taijiaiConfig.apiKey;
        const modelName = taijiaiConfig.models?.find(m => m.id.includes('claude'))?.id || 'claude-sonnet-4-5-20250929';

        // Prepare prompt
        // Truncate content to avoid context overflow if necessary (GLM-4.7 has 200k context, so huge articles are fine)
        const prompt = `以下是一篇文章的内容，请通读全文，提炼核心观点，生成一段中文摘要。

文章内容：
${content}

输出要求（严格遵守）：
1. 字数控制在 60 到 120 字之间（不能太短）。
2. 吸引人，吸引点击，有点标题党的感觉但有格调。
3. 不要废话，不要包含"这篇文章讲的是..."这种无效的起手式。
4. 只输出纯文本摘要内容，绝对不要包含 Markdown 格式（比如不要加粗、不要星号）。`;

        const url = `${baseUrl}/chat/completions`;
        const payload = {
            model: modelName,
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 500, // Increased budget to allow for reasoning + final answer
            temperature: 0.7
        };

        const response = await axios.post(url, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        // Debug: Log raw response structure
        // console.log(`   🟡 API Response: ${JSON.stringify(response.data)}`); // Disabled for cleaner logs

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            const choice = response.data.choices[0];
            let digest = "";

            // Standard OpenAI format (Claude uses this)
            if (choice.message && choice.message.content) {
                digest = choice.message.content.trim();
            } 
            // Fallback: Direct text field (older API formats)
            else if (choice.text) {
                digest = choice.text.trim();
            }

            if (!digest) throw new Error('No digest content found in response');

            // Clean up Markdown artifacts (GLM-4.7 sometimes returns lists or em dashes)
            // Remove bold/italic markers, bullets, list numbers
            digest = digest.replace(/(\*\*|__|`)/g, '')           // bold, code
                         .replace(/(\*|_)(?=[^*_\s])/g, '')      // single bold/italic start
                         .replace(/(?<!\*)\*$/g, '')          // single bold/italic end
                         .replace(/^[\d\.\-\*]+\s*/gm, '')    // list items
                         .trim();

            // Ensure length (just in case)
            if (digest.length > 120) {
                digest = digest.substring(0, 117) + '...';
            }

            return digest;
        } else {
            throw new Error('Invalid response structure from NVIDIA API');
        }
    } catch (e) {
        console.warn(`⚠️ AI Digest generation failed: ${e.message}. Falling back to empty digest.`);
        return ''; // Fall back to empty string so later logic handles it
    }
}

async function downloadImage(url, filepath) {
    if (!url.startsWith('http')) {
        if (fs.existsSync(url)) {
            fs.copyFileSync(url, filepath);
            return;
        }
        throw new Error(`Local image not found: ${url}`);
    }
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => file.close(resolve));
        }).on('error', err => {
            fs.unlink(filepath);
            reject(err);
        });
    });
}

async function getWeChatToken(config) {
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat_appid}&secret=${config.wechat_secret}`;
    const response = await axios.get(url);
    if (response.data.access_token) return response.data.access_token;
    throw new Error(`WeChat Token Failed: ${JSON.stringify(response.data)}`);
}

async function uploadWeChatImage(accessToken, filePath) {
    const url = `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${accessToken}`;
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath), { filename: path.basename(filePath), contentType: 'image/png' });
    const response = await axios.post(url, form, { headers: form.getHeaders() });
    return response.data.url;
}

async function uploadCover(accessToken, filePath) {
    const url = `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${accessToken}&type=image`;
    const form = new FormData();
    form.append('media', fs.createReadStream(filePath));
    const response = await axios.post(url, form, { headers: form.getHeaders() });
    return response.data.media_id;
}

async function getNotionContent(blockId, apiKey) {
    let results = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
        const url = `https://api.notion.com/v1/blocks/${blockId}/children${startCursor ? `?start_cursor=${startCursor}` : ''}`;
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Notion-Version': '2022-06-28'
            }
        });
        
        results = results.concat(response.data.results);
        hasMore = response.data.has_more;
        startCursor = response.data.next_cursor;
    }
    
    // Recursively fetch children
    for (let i = 0; i < results.length; i++) {
        if (results[i].has_children) {
            const children = await getNotionContent(results[i].id, apiKey);
            results[i].children = children;
        }
    }
    
    return results;
}

async function getNotionPageTitle(pageId, apiKey) {
    const response = await axios.get(`https://api.notion.com/v1/pages/${pageId}`, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28'
        }
    });
    const props = response.data.properties;
    for (const key in props) {
        if (props[key].type === 'title') {
            return props[key].title.map(t => t.plain_text).join('');
        }
    }
    return "Untitled";
}

function notionBlocksToMarkdown(blocks) {
    let md = "";
    blocks.forEach(block => {
        let childMd = "";
        if (block.children) {
            childMd = notionBlocksToMarkdown(block.children);
        }

        if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
            md += `${block.paragraph.rich_text.map(t => t.plain_text).join('')}\n\n`;
        } else if (block.type === 'heading_1') {
            md += `# ${block.heading_1.rich_text.map(t => t.plain_text).join('')}\n\n`;
        } else if (block.type === 'heading_2') {
            md += `## ${block.heading_2.rich_text.map(t => t.plain_text).join('')}\n\n`;
        } else if (block.type === 'heading_3') {
            md += `### ${block.heading_3.rich_text.map(t => t.plain_text).join('')}\n\n`;
        } else if (block.type === 'bulleted_list_item') {
            md += `- ${block.bulleted_list_item.rich_text.map(t => t.plain_text).join('')}\n`;
            if (childMd) md += childMd;
        } else if (block.type === 'numbered_list_item') {
            md += `1. ${block.numbered_list_item.rich_text.map(t => t.plain_text).join('')}\n`;
            if (childMd) md += childMd;
        } else if (block.type === 'image') {
            const url = block.image.type === 'external' ? block.image.external.url : block.image.file.url;
            md += `![image](${url})\n\n`;
        } else if (block.type === 'quote') {
            // Fix: Use HTML <br/> for line breaks within quotes
            let text = block.quote.rich_text.map(t => t.plain_text).join('').replace(/\n/g, '<br/>');
            
            // Append children if any (Notion allows nested blocks in quotes)
            if (childMd) {
                // childMd is already markdown. We need to prefix each line with '>' to keep it in the quote.
                // However, childMd might already have newlines.
                // Let's strip trailing newlines first.
                const childLines = childMd.trim().split('\n');
                const nestedContent = childLines.map(line => line.trim() === '' ? '>' : `> ${line}`).join('\n');
                md += `> ${text}\n>\n${nestedContent}\n\n`;
            } else {
                md += `> ${text}\n\n`;
            }
        } else if (block.type === 'column_list' || block.type === 'column') {
            md += childMd;
        }
    });
    return md;
}

// Main execution
(async () => {
    const args = process.argv.slice(2);
    let input = null;
    let coverPath = null;
    let digest = null;
    let titleOverride = null;

    if (args.length > 0) input = args[0];
    
    const digestIndex = args.indexOf('--digest');
    if (digestIndex !== -1 && args.length > digestIndex + 1) {
        digest = args[digestIndex + 1];
    }
    const titleIndex = args.indexOf('--title');
    if (titleIndex !== -1 && args.length > titleIndex + 1) {
        titleOverride = args[titleIndex + 1];
    }
    
    // Check if second arg is cover (and not a flag)
    if (args.length > 1 && !args[1].startsWith('--')) {
         coverPath = args[1];
    }

    if (!input) {
        console.log("Usage: notion-publisher <notion_id_or_file> [cover] [--digest 'summary'] [--title 'override']");
        process.exit(1);
    }

    try {
        const config = loadConfig();
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'notion-pub-'));
        
        let title = "Untitled Draft";
        let markdown = "";
        
        // Input processing: File or Notion ID
        if (fs.existsSync(input)) {
            console.log(`\n📄 Reading local file: ${input}`);
            markdown = fs.readFileSync(input, 'utf8');
            // Try to guess title from first H1 if not provided
            if (!titleOverride) {
                const titleMatch = markdown.match(/^# (.*$)/m);
                if (titleMatch) title = titleMatch[1];
            }
        } else {
            const pageId = input.match(/([a-f0-9]{32})/)?.[1] || input;
            console.log(`\n📚 Fetching Notion page: ${pageId}`);
            title = await getNotionPageTitle(pageId, config.notion_key);
            console.log(`   Title: ${title}`);
            const blocks = await getNotionContent(pageId, config.notion_key);
            markdown = notionBlocksToMarkdown(blocks);
        }

        // --- FOOTER INJECTION START ---
        // Hardcoded path to the footer file as requested
        const FOOTER_PATH = '/Users/roy/clawd/notion-publish-workspace/footer/footer.md';
        if (fs.existsSync(FOOTER_PATH)) {
            console.log(`\n🦶 Appending footer from: ${FOOTER_PATH}`);
            let footerContent = fs.readFileSync(FOOTER_PATH, 'utf8');
            const footerDir = path.dirname(FOOTER_PATH);

            // Fix relative image paths in footer to be absolute
            // Matches ![alt](path)
            footerContent = footerContent.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, imgPath) => {
                if (!imgPath.startsWith('http') && !path.isAbsolute(imgPath)) {
                    const absPath = path.resolve(footerDir, imgPath);
                    return `![${alt}](${absPath})`;
                }
                return match;
            });

            markdown += "\n\n" + footerContent;
        } else {
            console.log(`\n⚠️ Footer file not found at: ${FOOTER_PATH} (Skipping footer)`);
        }
        // --- FOOTER INJECTION END ---
        
        if (titleOverride) title = titleOverride;

        console.log("\n🔑 Authenticating with WeChat...");
        const token = await getWeChatToken(config);
        
        console.log("🖼️  Processing images (uploading)...");
        
        // Find all images
        const allImageLinks = markdown.match(/!\[.*?\]\((.*?)\)/g);
        if (allImageLinks) {
             const paths = allImageLinks.map(s => s.match(/\((.*?)\)/)[1]);
             const uniquePaths = [...new Set(paths)];
             
             for (let i = 0; i < uniquePaths.length; i++) {
                const imgPath = uniquePaths[i];
                let localPath = imgPath;
                let isTemp = false;

                // If remote, download
                if (imgPath.startsWith('http')) {
                    localPath = path.join(tempDir, `dl_img_${i}.png`);
                    await downloadImage(imgPath, localPath);
                    isTemp = true;
                } else if (!path.isAbsolute(imgPath)) {
                    // Resolve relative paths if input was a file
                    if (fs.existsSync(input)) {
                         localPath = path.resolve(path.dirname(input), imgPath);
                    }
                }

                if (fs.existsSync(localPath)) {
                    process.stdout.write(`   [${i+1}/${uniquePaths.length}] Uploading... `);
                    try {
                        const wechatUrl = await uploadWeChatImage(token, localPath);
                        if (wechatUrl) {
                            // Replace global occurrence
                            markdown = markdown.split(imgPath).join(wechatUrl);
                            console.log("Done");
                        } else {
                            console.log("Failed (No URL)");
                        }
                    } catch (err) {
                        console.log(`Failed: ${err.message}`);
                    }
                    if (isTemp) fs.unlinkSync(localPath);
                } else {
                    console.log(`   [${i+1}/${uniquePaths.length}] Skipped (Not found): ${localPath}`);
                }
             }
        }
        
        console.log("📝 Rendering content...");
        const htmlBody = md.render(markdown);
        const fullHtml = `<div style="${STYLES.container}">${htmlBody}</div>`;
        
        console.log("📦 Uploading cover...");
        let mediaId;
        if (coverPath && fs.existsSync(coverPath)) {
            mediaId = await uploadCover(token, coverPath);
        } else {
             // If no cover provided, we can't proceed with a draft that requires thumb_media_id
             // But WeChat API might allow it? Usually it's required.
             // We'll throw only if absolutely no cover found.
             // But wait, user might have put cover inside markdown? No, WeChat needs separate upload.
             console.warn("⚠️  Warning: No cover image provided. Publishing might fail.");
        }
        
        // --- DIGEST GENERATION START ---
        // AI-based digest generation using NVIDIA GLM-4.7
        console.log("🧠 Generating digest via AI (NVIDIA GLM-4.7)...");
        const aiDigest = await generateDigestAI(markdown);
        if (aiDigest) {
            digest = aiDigest;
            console.log(`   ✅ AI Digest: "${digest}"`);
        } else {
            console.log(`   ⚠️ AI Digest generation skipped or failed. Using fallback.`);
        }
        // --- DIGEST GENERATION END ---

        console.log("🚀 Publishing draft...");
        const payload = {
            articles: [
                {
                    title: title,
                    author: config.author || 'Author',
                    digest: digest || 'Published via Notion-Publisher',
                    content: fullHtml,
                    thumb_media_id: mediaId,
                    need_open_comment: 1
                }
            ]
        };
        
        const response = await axios.post(`https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`, payload);
        
        if (response.data.media_id) {
            console.log(`\n✅ Success! Draft created.\n   Media ID: ${response.data.media_id}`);
        } else {
            console.error("\n❌ Failed:", response.data);
        }
        
        // Cleanup
        fs.rmSync(tempDir, { recursive: true, force: true });
        
    } catch (e) {
        console.error("\nError:", e.message);
        process.exit(1);
    }
})();
