const fs = require('fs');
const MarkdownIt = require('markdown-it');

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

let insideList = false;

md.renderer.rules.paragraph_open = () => {
    if (insideList) {
        return `<p style="margin: 0; display: inline;">`;
    }
    return `<p style="${STYLES.p}">`;
};

md.renderer.rules.bullet_list_open = () => {
    return '<ul style="padding-left: 20px; margin-bottom: 20px;">';
};

md.renderer.rules.list_item_open = () => {
    insideList = true;
    return `<li style="${STYLES.li}">`;
};

md.renderer.rules.list_item_close = () => {
    insideList = false;
    return '</li>';
};

const markdown = fs.readFileSync('draft_case_a_v4.md', 'utf8');
const html = md.render(markdown);

console.log(html);
