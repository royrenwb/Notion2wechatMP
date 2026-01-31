const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.config', 'notion-publisher', 'config.json');

function loadConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

async function getNotionContent(blockId, apiKey) {
    const url = `https://api.notion.com/v1/blocks/${blockId}/children`;
    const response = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28'
        }
    });
    return response.data.results;
}

(async () => {
    const pageId = '2f646ebc-cb35-80ca-b1f6-e9263b1e7982';
    const config = loadConfig();
    const blocks = await getNotionContent(pageId, config.notion_key);
    
    // Find the problematic quote
    const targetQuote = blocks.find(b => b.type === 'quote' && 
        b.quote.rich_text.some(t => t.plain_text.includes("装一个工具"))
    );
    
    if (targetQuote) {
        console.log("FULL JSON of Problematic Quote:");
        console.log(JSON.stringify(targetQuote, null, 2));
    } else {
        console.log("Problematic quote not found.");
    }
})();
