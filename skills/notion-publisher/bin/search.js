const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.config', 'notion-publisher', 'config.json');

function loadConfig() {
    if (!fs.existsSync(CONFIG_PATH)) throw new Error('Config missing');
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

(async () => {
    const query = process.argv[2];
    if (!query) {
        console.log("Usage: node search.js <query>");
        process.exit(1);
    }

    try {
        const config = loadConfig();
        const response = await axios.post('https://api.notion.com/v1/search', {
            query: query,
            filter: { property: 'object', value: 'page' },
            page_size: 5
        }, {
            headers: {
                'Authorization': `Bearer ${config.notion_key}`,
                'Notion-Version': '2022-06-28'
            }
        });

        if (response.data.results.length === 0) {
            console.log("No results found.");
        } else {
            response.data.results.forEach(page => {
                const titleProps = page.properties;
                let title = "Untitled";
                // Find title property (key varies)
                for (const key in titleProps) {
                    if (titleProps[key].type === 'title') {
                        title = titleProps[key].title.map(t => t.plain_text).join('');
                        break;
                    }
                }
                console.log(`[${title}] ID: ${page.id}`);
            });
        }
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
})();
