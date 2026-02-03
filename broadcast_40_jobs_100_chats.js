const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const JOBS_FILE = path.join(__dirname, 'public_html', 'daily_jobs.json');
const SITE_URL = 'https://a1064074535.github.io/vip360-khaled/public_html/index.html';
const AUTH_PATH = './.auth_new_v5';
const CLIENT_ID = 'khaled-bot';
const SENT_LOG = path.join(__dirname, 'sent_chats.json');

// Load already sent chats to avoid duplication
let sentChats = new Set();
if (fs.existsSync(SENT_LOG)) {
    try {
        const data = JSON.parse(fs.readFileSync(SENT_LOG, 'utf8'));
        sentChats = new Set(data);
    } catch (e) { console.error('Error loading sent log:', e); }
}

function saveSentLog() {
    fs.writeFileSync(SENT_LOG, JSON.stringify(Array.from(sentChats), null, 2));
}

async function broadcast() {
    console.log('🚀 Starting CONTINUOUS BROADCAST (Target: 100 new chats)...');

    if (!fs.existsSync(JOBS_FILE)) {
        console.error(`❌ Error: ${JOBS_FILE} not found!`);
        return;
    }
    const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8')).slice(0, 40);
    console.log(`✅ Loaded ${jobs.length} jobs.`);
    console.log(`📜 Already sent to ${sentChats.size} chats.`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: CLIENT_ID, dataPath: AUTH_PATH }),
        webVersion: '2.3000.1018903227',
        webVersionCache: { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1018903227.html' },
        takeoverOnConflict: true,
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,720']
        }
    });

    client.on('loading_screen', (p, m) => console.log(`⏳ Syncing: ${p}% - ${m}`));

    client.on('authenticated', () => {
        console.log('✅ Session Authenticated! Starting safety timer...');
        // If ready event doesn't fire in 60s, force start
        setTimeout(() => {
            if (!isProcessing) {
                console.log('⚠️ Ready event timeout. Force starting extraction...');
                triggerExtraction(client, jobs);
            }
        }, 60000);
    });

    client.on('ready', async () => {
        console.log('✅ WhatsApp is fully Ready!');
        triggerExtraction(client, jobs);
    });

    console.log('Initializing WhatsApp...');
    client.initialize();
}

let isProcessing = false;
async function triggerExtraction(client, jobs) {
    if (isProcessing) return;
    isProcessing = true;
    
    console.log('🚀 Starting extraction phase...');
    try {
        // Scroll a few times to load content
        console.log('📜 Scrolling to load chats...');
        for(let i=0; i<5; i++) {
            await client.pupPage.evaluate(() => {
                const pane = document.querySelector('#pane-side') || document.querySelector('div[role="grid"]')?.parentElement;
                if (pane) pane.scrollTop += 1000;
            });
            await new Promise(r => setTimeout(r, 2000));
        }

        let targets = [];
        
        // Try API first
        try {
            console.log('📊 Fetching contacts via API...');
            const contacts = await client.getContacts();
            targets = contacts
                .filter(c => c.isUser && c.id && c.id._serialized && c.id._serialized.includes('@c.us'))
                .map(c => c.id._serialized)
                .filter(id => !sentChats.has(id));
            console.log(`📊 API found ${targets.length} new contacts.`);
            
            if (targets.length < 10) {
                console.log('📊 Fetching chats via API...');
                const chats = await client.getChats();
                const chatTargets = chats
                    .filter(c => c.id && c.id._serialized.includes('@c.us'))
                    .map(c => c.id._serialized)
                    .filter(id => !sentChats.has(id));
                
                chatTargets.forEach(id => {
                    if (!targets.includes(id)) targets.push(id);
                });
                console.log(`📊 Total targets after chats API: ${targets.length}`);
            }
        } catch (e) {
            console.log(`⚠️ API fetch failed: ${e.message}`);
        }

        // Try DOM fallback if API failed or found too few
        if (targets.length < 50) {
            console.log('🔍 Attempting DEEP DOM extraction...');
            const domIds = await client.pupPage.evaluate(() => {
                const ids = [];
                // Look for anything that looks like a chat ID in ANY attribute
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => {
                    for (const attr of el.attributes) {
                        const match = attr.value.match(/(\d+@c\.us)/);
                        if (match) ids.push(match[1]);
                    }
                });
                // Look in text too
                const bodyText = document.body.innerText;
                const phoneMatches = bodyText.match(/(9665|05)\d{8}/g) || [];
                phoneMatches.forEach(num => {
                    let clean = num.replace(/\D/g, '');
                    if (clean.startsWith('05')) clean = '966' + clean.substring(1);
                    ids.push(clean + '@c.us');
                });
                return [...new Set(ids)];
            });
            
            domIds.forEach(id => {
                if (!sentChats.has(id) && !targets.includes(id)) {
                    targets.push(id);
                }
            });
            console.log(`📊 Total new chats after DEEP DOM: ${targets.length}`);
        }

        if (targets.length === 0) {
            console.log('❌ No new chats found. Retrying in 30s...');
            isProcessing = false;
            setTimeout(() => triggerExtraction(client, jobs), 30000);
            return;
        }

        await runBroadcast(client, targets.slice(0, 100), jobs);
    } catch (err) {
        console.error('❌ Critical extraction error:', err);
        process.exit(1);
    }
}

async function runBroadcast(client, targets, jobs) {
    let successCount = 0;
    console.log(`🚀 Sending to ${targets.length} new users...`);
    
    for (let i = 0; i < targets.length; i++) {
        const chatId = targets[i];
        
        if (successCount >= 100) break;

        // Throttling
        if (i > 0 && i % 5 === 0) {
            console.log('⏳ Throttling: 10s pause...');
            await new Promise(r => setTimeout(r, 10000));
        }

        console.log(`[${i + 1}/${targets.length}] -> ${chatId}`);
        try {
            const chunkSize = 10;
            for (let j = 0; j < jobs.length; j += chunkSize) {
                const chunk = jobs.slice(j, j + chunkSize);
                let msg = j === 0 ? "🆕 *أحدث 40 وظيفة يومية:*\n\n" : "";
                chunk.forEach((job, idx) => msg += `*${j+idx+1}. ${job.title}*\n🏢 ${job.company}\n🔗 ${job.link}\n\n`);
                if (j + chunkSize >= jobs.length) msg += `\nللمزيد من الوظائف: ${SITE_URL}`;
                
                await client.sendMessage(chatId, msg);
                await new Promise(r => setTimeout(r, 800));
            }
            
            sentChats.add(chatId);
            saveSentLog();
            successCount++;
            console.log(`✅ Success #${successCount} for ${chatId}`);
            await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
            console.error(`❌ Error for ${chatId}: ${err.message}`);
        }
    }
    
    console.log(`🏁 BROADCAST FINISHED! Successfully sent to ${successCount} new chats.`);
    process.exit(0);
}

broadcast();
