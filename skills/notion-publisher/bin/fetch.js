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
    container: 'font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif;'
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

function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) {
        throw new Error(`Config file not found at ${CONFIG_PATH}`);
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
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

(async () => {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log("Usage: node fetch.js <notion_page_id>");
        process.exit(1);
    }
    
    const pageId = args[0].match(/([a-f0-9]{32})/)?.[1] || args[0];
    
    try {
        const config = loadConfig();
        console.error(`Fetching Notion page: ${pageId}`);
        const title = await getNotionPageTitle(pageId, config.notion_key);
        // Prepend title as H1 if needed, or just let blocks handle it. 
        // Usually Notion content doesn't include the title property in blocks.
        // Let's prepend it.
        const blocks = await getNotionContent(pageId, config.notion_key);
        let md = `# ${title}\n\n`;
        md += notionBlocksToMarkdown(blocks);
        
        console.log(md);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
