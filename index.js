const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { scrapeJobs, JOBS_FILE } = require('./jobs_scraper');
const { initSendPulse, addContact } = require('./sendpulse-service');
const { processCommand } = require('./agent_brain');
require('dotenv').config();

const SITE_URL = 'https://vip360-khaled.netlify.app/';

// Admin Configuration
const ADMIN_NUMBER = '966545888559@c.us';

// Initialize Express App
const app = express();
const port = 3001;

app.get('/damman-form', (req, res) => {
    res.sendFile(path.join(__dirname, 'public_html', 'cloned_site.html'));
});

// Serve Smart Store Frontend
app.use(express.static(path.join(__dirname, 'public_html')));

// API Routes for Smart Store
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Products API
app.get('/api/products', (req, res) => {
    const STORE_FILE = path.join(__dirname, 'store_data.json');
    if (fs.existsSync(STORE_FILE)) {
        const data = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
        res.json(data.products);
    } else {
        res.json([]);
    }
});

// 1.5 Jobs API
app.get('/api/jobs', (req, res) => {
    if (fs.existsSync(JOBS_FILE)) {
        const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
        res.json(jobs);
    } else {
        // Try to scrape if missing
        scrapeJobs().then(jobs => {
            res.json(jobs || []);
        });
    }
});

// Serve Jobs Page
app.get('/jobs', (req, res) => {
    res.sendFile(path.join(__dirname, 'public_html', 'jobs.html'));
});

// Serve Notes Page
app.get('/notes', (req, res) => {
    res.sendFile(path.join(__dirname, 'public_html', 'notes.html'));
});

// 2. Assistant Chat API
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    try {
        const response = await processCommand(message);
        res.json(response);
    } catch (e) {
        console.error(e);
        res.status(500).json({ type: 'text', message: 'حدث خطأ داخلي في المساعد.' });
    }
});

// User Session State Management
const userStates = new Map();

// Seen Users Management (Persistent)
const SEEN_USERS_FILE = './seen_users.json';
let seenUsers = new Set();

if (fs.existsSync(SEEN_USERS_FILE)) {
    try {
        const data = fs.readFileSync(SEEN_USERS_FILE, 'utf8');
        seenUsers = new Set(JSON.parse(data));
    } catch (err) {
        console.error("Error reading seen_users.json:", err);
    }
}

function markUserAsSeen(userId) {
    if (!seenUsers.has(userId)) {
        seenUsers.add(userId);
        try {
            fs.writeFileSync(SEEN_USERS_FILE, JSON.stringify([...seenUsers]));
        } catch (err) {
            console.error("Error writing seen_users.json:", err);
        }
    }
}

// Configuration for Auto-Reply
const ENABLE_AUTO_REPLY = true; // Set to true to enable auto-replies for users

// SendPulse Configuration
const SENDPULSE_BOOK_ID = 525659;

let qrCodeData = '';
let status = 'Initializing...';
let client;

// Existing Dashboard Route (Legacy, kept for QR)
app.get('/dashboard', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>WhatsApp Bot & TikTok Scheduler</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #333; text-align: center; }
                    .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .status { font-weight: bold; }
                    .btn { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                    .btn:hover { background: #0056b3; }
                    img { display: block; margin: 20px auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); max-width: 300px; }
                </style>
            </head>
            <body>
                <h1>Bot Management Dashboard</h1>
                
                <div class="card">
                    <h2>WhatsApp Bot Status</h2>
                    <p class="status">Status: <span style="color: ${status === 'Connected' ? 'green' : 'orange'}">${status}</span></p>
                    ${qrCodeData ? `<div><p style="text-align:center">Scan this QR Code with WhatsApp:</p><img src="${qrCodeData}" alt="QR Code" /></div>` : ''}
                    ${!qrCodeData && status !== 'Connected' ? '<p style="text-align:center">Waiting for QR code generation...</p>' : ''}
                    ${status === 'Connected' ? '<p style="text-align:center">✅ Bot is connected and running!</p>' : ''}
                </div>

                <div class="card">
                    <h2>TikTok Scheduler</h2>
                    <p>Manage your daily TikTok posts schedule.</p>
                    <a href="/tiktok" class="btn">Open Scheduler Dashboard</a>
                </div>
                
                 <div class="card">
                    <h2>Smart Store</h2>
                    <p>Go to the new Smart Store Interface.</p>
                    <a href="/" class="btn">Open Smart Store</a>
                </div>
            </body>
        </html>
    `);
});

// TikTok Scheduler Routes
const TIKTOK_POSTS_FILE = path.join(__dirname, 'TikTok-Scheduler', 'tiktok_posts.json');

app.get('/tiktok', (req, res) => {
    let posts = {};
    if (fs.existsSync(TIKTOK_POSTS_FILE)) {
        try {
            posts = JSON.parse(fs.readFileSync(TIKTOK_POSTS_FILE, 'utf8'));
        } catch (e) {
            console.error("Error reading tiktok posts:", e);
        }
    }

    // Sort dates
    const sortedDates = Object.keys(posts).sort();

    let tableRows = sortedDates.map(date => {
        let dayPosts = posts[date];
        if (!Array.isArray(dayPosts)) {
            dayPosts = [dayPosts];
        }
        
        return dayPosts.map((post, index) => `
            <tr>
                <td>${date}</td>
                <td>${post.time || post.upload_time}</td>
                <td>${post.caption}</td>
                <td>${post.video_path}</td>
                <td>${post.status || (post.upload_time ? 'legacy' : 'pending')}</td>
                <td>
                    <button onclick="deletePost('${date}', ${index})" style="background:red;color:white;border:none;padding:5px 10px;cursor:pointer">Delete</button>
                </td>
            </tr>
        `).join('');
    }).join('');

    res.send(`
        <html>
            <head>
                <title>TikTok Scheduler Dashboard</title>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .form-group { margin-bottom: 15px; }
                    label { display: block; margin-bottom: 5px; font-weight: bold; }
                    input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
                    button { padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    button:hover { background: #218838; }
                    .back-link { display: inline-block; margin-bottom: 20px; color: #007bff; text-decoration: none; }
                    .gen-btn { background: #007bff; }
                    .gen-btn:hover { background: #0056b3; }
                </style>
            </head>
            <body>
                <a href="/dashboard" class="back-link">← Back to Main Dashboard</a>
                <h1>TikTok Scheduler Dashboard</h1>
                
                <div style="background: #e9ecef; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3>🤖 Auto-Generate Daily Content</h3>
                    <p>Automatically generate and schedule 10 motivational videos for tomorrow.</p>
                    <button class="gen-btn" onclick="generateContent()">Generate 10 Videos Now</button>
                    <span id="genStatus" style="margin-left: 10px;"></span>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                    <h3>Add New Scheduled Post</h3>
                    <form id="addPostForm">
                        <div class="form-group">
                            <label>Date (YYYY-MM-DD):</label>
                            <input type="date" name="date" required>
                        </div>
                        <div class="form-group">
                            <label>Time (HH:MM):</label>
                            <input type="time" name="time" value="09:00" required>
                        </div>
                        <div class="form-group">
                            <label>Caption:</label>
                            <textarea name="caption" rows="3" required></textarea>
                        </div>
                        <div class="form-group">
                            <label>Video Path (Relative or Absolute):</label>
                            <input type="text" name="video_path" value="./videos/video_1.mp4" required>
                        </div>
                        <button type="submit">Schedule Post</button>
                    </form>
                </div>

                <h3>Upcoming Posts</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Caption</th>
                            <th>Video Path</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>

                <script>
                    document.getElementById('addPostForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const data = {
                            date: formData.get('date'),
                            time: formData.get('time'),
                            caption: formData.get('caption'),
                            video_path: formData.get('video_path')
                        };

                        const res = await fetch('/tiktok/add', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data)
                        });

                        if (res.ok) {
                            window.location.reload();
                        } else {
                            alert('Error adding post');
                        }
                    });

                    async function deletePost(date, index) {
                        if (confirm('Are you sure you want to delete this post?')) {
                            const res = await fetch('/tiktok/delete/' + date + '/' + index, { method: 'DELETE' });
                            if (res.ok) {
                                window.location.reload();
                            } else {
                                alert('Error deleting post');
                            }
                        }
                    }

                    async function generateContent() {
                        if (!confirm('This will take a few minutes to generate 10 videos. Continue?')) return;
                        
                        document.getElementById('genStatus').innerText = 'Generating... Please wait...';
                        try {
                            const res = await fetch('/tiktok/generate', { method: 'POST' });
                            if (res.ok) {
                                document.getElementById('genStatus').innerText = 'Done! Reloading...';
                                setTimeout(() => window.location.reload(), 2000);
                            } else {
                                document.getElementById('genStatus').innerText = 'Error occurred.';
                            }
                        } catch (e) {
                            document.getElementById('genStatus').innerText = 'Network Error';
                        }
                    }
                </script>
            </body>
        </html>
    `);
});

app.post('/tiktok/generate', (req, res) => {
    const { exec } = require('child_process');
    const scriptPath = path.join(__dirname, 'TikTok-Scheduler', 'daily_content_manager.py');
    
    // Default to tomorrow
    const cmd = `python "${scriptPath}"`;
    
    console.log("Executing:", cmd);
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Generation failed');
        }
        console.log(`stdout: ${stdout}`);
        res.send('Generation started');
    });
});

app.post('/tiktok/add', (req, res) => {
    const { date, time, caption, video_path } = req.body;
    
    if (!date || !time || !caption || !video_path) {
        return res.status(400).send('Missing fields');
    }

    let posts = {};
    if (fs.existsSync(TIKTOK_POSTS_FILE)) {
        posts = JSON.parse(fs.readFileSync(TIKTOK_POSTS_FILE, 'utf8'));
    }

    if (!posts[date]) {
        posts[date] = [];
    }
    
    // Normalize existing data if it's an object (legacy)
    if (!Array.isArray(posts[date]) && posts[date].video_path) {
        posts[date] = [posts[date]];
    }

    posts[date].push({
        video_path: video_path,
        caption: caption,
        time: time,
        status: 'pending',
        hashtags: [] 
    });

    fs.writeFileSync(TIKTOK_POSTS_FILE, JSON.stringify(posts, null, 4));
    res.send('Success');
});

app.delete('/tiktok/delete/:date/:index', (req, res) => {
    const date = req.params.date;
    const index = parseInt(req.params.index);
    
    let posts = {};
    if (fs.existsSync(TIKTOK_POSTS_FILE)) {
        posts = JSON.parse(fs.readFileSync(TIKTOK_POSTS_FILE, 'utf8'));
    }

    if (posts[date]) {
        if (Array.isArray(posts[date])) {
            if (index >= 0 && index < posts[date].length) {
                posts[date].splice(index, 1);
                // If empty, remove key? Maybe keep it.
                if (posts[date].length === 0) delete posts[date];
            }
        } else {
            // Legacy object
            delete posts[date];
        }
        fs.writeFileSync(TIKTOK_POSTS_FILE, JSON.stringify(posts, null, 4));
    }
    
    res.send('Success');
});


app.get('/send-menu', async (req, res) => {
    const target = req.query.number ? `${req.query.number}@c.us` : ADMIN_NUMBER;
    if (client && (status === 'Connected' || status === 'Authenticated' || status.includes('Loading'))) {
        try {
            const menuMsg = `مرحباً بك في المكتبة الرقمية 📚\n\n*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\n🌐 *الموقع الإلكتروني:* ${SITE_URL}`;
            await client.sendMessage(target, menuMsg);
            res.send(`✅ Menu sent successfully to ${target}`);
        } catch (e) {
            res.status(500).send('Error: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready');
    }
});

app.get('/test-message', async (req, res) => {
    if (client && status === 'Connected') {
        try {
            await client.sendMessage(ADMIN_NUMBER, '🔔 *Test Message* \nهذه رسالة تجربة من السيرفر للتأكد من عمل البوت.\nThis is a test message to confirm the bot is working.', { sendSeen: false });
            res.send('Message sent to admin');
        } catch (e) {
            res.status(500).send('Error sending message: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready. Status: ' + status);
    }
});

app.get('/send-update-report', async (req, res) => {
    if (client && status === 'Connected') {
        try {
            const reportMessage = `✅ *تم اكتمال التحديثات بنجاح!*

تم تنفيذ المهام التالية:
1. 🆕 *إضافة خدمة "جديد الوظائف":*
   - تم إضافة الخدمة رقم 16 في قائمة البوت.
   - تقوم الخدمة بجلب أحدث 20 وظيفة يومياً من موقع "أي وظيفة".
   - يتم التحديث تلقائياً كل يوم الساعة 8 صباحاً.

2. 🌐 *تحديث الموقع الإلكتروني:*
   - تم إضافة قسم "جديد الوظائف" في الصفحة الرئيسية.
   - تم إنشاء صفحة خاصة لعرض الوظائف بشكل منظم.
   - تم إضافة خيار "جديد الوظائف" في نموذج الحجز.

3. 🛠️ *تحسينات عامة:*
   - إصلاح مشكلة إرسال الرسائل في البوت.
   - تحسين نظام جلب الوظائف لضمان الحصول على 20 وظيفة كاملة.

🔗 *رابط الموقع المحدث:* ${SITE_URL}

شكراً لاستخدامك خدماتنا! 🚀`;

            await client.sendMessage(ADMIN_NUMBER, reportMessage, { sendSeen: false });
            res.send('Update report sent to admin (' + ADMIN_NUMBER + ')');
        } catch (e) {
            res.status(500).send('Error sending report: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready. Status: ' + status);
    }
});

app.get('/broadcast-services', async (req, res) => {
    if (client && status === 'Connected') {
        const count = parseInt(req.query.count) || 10;
        try {
            const servicesMessage = `*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\n🌐 *الموقع الإلكتروني:* ${SITE_URL}`;
            
            const chats = await client.getChats();
            const validChats = chats.filter(c => c.id.server === 'c.us' || c.id.server === 'g.us');
            const targetChats = validChats.slice(0, count);

            // Send response immediately so browser doesn't timeout
            res.write(`Starting broadcast to ${targetChats.length} chats...\n`);

            let sentCount = 0;
            for (const chat of targetChats) {
                await chat.sendMessage(servicesMessage);
                sentCount++;
                res.write(`Sent to ${chat.name || chat.id.user}\n`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            res.end(`Completed. Sent to ${sentCount} chats.`);
        } catch (e) {
            if (!res.headersSent) res.status(500).send('Error broadcasting: ' + e.message);
            else res.end('Error: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready. Status: ' + status);
    }
});

app.get('/broadcast-jobs', async (req, res) => {
    if (client && status === 'Connected') {
        const count = parseInt(req.query.count) || 50;
        if (!fs.existsSync(JOBS_FILE)) {
             return res.status(404).send('Jobs file not found. Please scrape first.');
        }
        
        try {
            const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
            const chats = await client.getChats();
            // Filter for private chats only (c.us) to avoid spamming groups
            const validChats = chats.filter(c => c.id.server === 'c.us').slice(0, count);
            
            res.write(`Starting broadcast of ${jobs.length} jobs to ${validChats.length} chats...\n`);

            let sentCount = 0;
            for (const chat of validChats) {
                res.write(`Sending to ${chat.name || chat.id.user}...\n`);
                
                // Chunk logic
                const chunkSize = 10;
                for (let i = 0; i < jobs.length; i += chunkSize) {
                    const chunk = jobs.slice(i, i + chunkSize);
                    let jobsMsg = i === 0 ? "🆕 *أحدث الوظائف اليومية:*\n\n" : "";
                    chunk.forEach((job, index) => {
                         jobsMsg += `*${i + index + 1}. ${job.title}*\n🏢 ${job.company}\n🕒 ${job.time}\n🔗 ${job.link}\n\n`;
                    });
                    
                    if (i + chunkSize >= jobs.length) {
                        jobsMsg += `\nللمزيد من الوظائف: https://www.ewdifh.com/`;
                    }
                    
                    await chat.sendMessage(jobsMsg);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1s delay between chunks
                }
                
                sentCount++;
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay between users
            }
            
            res.end(`Broadcast completed to ${sentCount} users.`);
        } catch (e) {
            if (!res.headersSent) res.status(500).send('Error: ' + e.message);
            else res.end('Error: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready. Status: ' + status);
    }
});


app.get('/post-daily-status', async (req, res) => {
    if (client && (status === 'Connected' || status === 'Authenticated')) {
        try {
            const statusImagePath = path.join(__dirname, 'daily_status.jpg');
            if (fs.existsSync(statusImagePath)) {
                const media = MessageMedia.fromFilePath(statusImagePath);
                const caption = `وظائف يومية مجانية! 📢\nأكثر من 40 وظيفة يومياً تصلك على جوالك.\n\nفقط أرسل رقم *16* للاشتراك ✅\n\nالمحتوى:\n- وظائف حكومي وشركات\n- تدريب منتهي بالتوظيف\n- دورات مجانية`;
                await client.sendMessage('status@broadcast', media, { caption: caption });
                res.send('✅ Daily status image posted successfully to status@broadcast');
            } else {
                const statusText = `مرحباً بك في المكتبة الرقمية 📚\n\nقائمة الخدمات المتاحة:\n\n${servicesList}\n\nلطلب أي خدمة، يرجى الرد برقم الخدمة.`;
                await client.sendMessage('status@broadcast', statusText);
                res.send('✅ Daily status text posted successfully to status@broadcast (Image not found)');
            }
        } catch (e) {
            console.error('❌ Error posting status:', e);
            res.status(500).send('Error posting status: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready. Status: ' + status);
    }
});

app.get('/test-message', async (req, res) => {
    const target = req.query.number ? `${req.query.number}@c.us` : ADMIN_NUMBER;
    const text = req.query.text || '✅ رسالة اختبار من البوت';
    if (client && (status === 'Connected' || status === 'Authenticated' || status.includes('Loading'))) {
        try {
            await client.sendMessage(target, text);
            res.send(`✅ Message sent successfully to ${target}`);
        } catch (e) {
            res.status(500).send('Error: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready');
    }
});

app.get('/test-send-jobs', async (req, res) => {
    const target = req.query.number ? `${req.query.number}@c.us` : ADMIN_NUMBER;
    if (client && (status === 'Connected' || status === 'Authenticated' || status.includes('Loading'))) {
        try {
            if (fs.existsSync(JOBS_FILE)) {
                const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
                const chunkSize = 10;
                for (let i = 0; i < jobs.length; i += chunkSize) {
                    const chunk = jobs.slice(i, i + chunkSize);
                    let jobsMsg = i === 0 ? "🆕 *أحدث الوظائف اليومية (إرسال يدوي):*\n\n" : "";
                    chunk.forEach((job, index) => {
                         jobsMsg += `*${i + index + 1}. ${job.title}*\n🏢 ${job.company}\n🕒 ${job.time}\n🔗 ${job.link}\n\n`;
                    });
                    
                    if (i + chunkSize >= jobs.length) {
                        jobsMsg += `\nللمزيد من الوظائف: https://www.ewdifh.com/`;
                    }
                    
                    await client.sendMessage(target, jobsMsg);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                res.send(`✅ Jobs sent successfully to ${target}`);
            } else {
                res.status(404).send('Jobs file not found');
            }
        } catch (e) {
            res.status(500).send('Error: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready');
    }
});

app.get('/send-jobs-now', async (req, res) => {
    if (client && (status === 'Connected' || status === 'Authenticated' || status.includes('Loading'))) {
        try {
            if (fs.existsSync(JOBS_FILE)) {
                const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
                const chunkSize = 10;
                for (let i = 0; i < jobs.length; i += chunkSize) {
                    const chunk = jobs.slice(i, i + chunkSize);
                    let jobsMsg = i === 0 ? "🆕 *أحدث الوظائف اليومية (إرسال فوري):*\n\n" : "";
                    chunk.forEach((job, index) => {
                         jobsMsg += `*${i + index + 1}. ${job.title}*\n🏢 ${job.company}\n🕒 ${job.time}\n🔗 ${job.link}\n\n`;
                    });
                    
                    if (i + chunkSize >= jobs.length) {
                        jobsMsg += `\nللمزيد من الوظائف: https://www.ewdifh.com/`;
                    }
                    
                    await client.sendMessage(ADMIN_NUMBER, jobsMsg);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                res.send('✅ Jobs sent successfully to admin');
            } else {
                res.status(404).send('Jobs file not found');
            }
        } catch (e) {
            res.status(500).send('Error: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready');
    }
});

app.get('/send-jobs-to-past-requests', async (req, res) => {
    if (client && (status === 'Connected' || status === 'Authenticated' || status.includes('Loading'))) {
        try {
            if (!fs.existsSync(JOBS_FILE)) {
                return res.status(404).send('Jobs file not found');
            }
            
            const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
            const chats = await client.getChats();
            const personalChats = chats.filter(c => c.id.server === 'c.us');
            
            let usersToNotify = new Set();
            console.log(`Scanning ${personalChats.length} personal chats for past requests...`);
            
            for (const chat of personalChats) {
                const messages = await chat.fetchMessages({ limit: 20 });
                const hasRequestedJobs = messages.some(m => !m.fromMe && (m.body.trim() === '15' || m.body.trim() === '16'));
                
                if (hasRequestedJobs) {
                    usersToNotify.add(chat.id._serialized);
                }
            }
            
            console.log(`Found ${usersToNotify.size} users who requested jobs recently.`);
            
            let sentCount = 0;
            for (const userId of usersToNotify) {
                const chunkSize = 10;
                for (let i = 0; i < jobs.length; i += chunkSize) {
                    const chunk = jobs.slice(i, i + chunkSize);
                    let jobsMsg = i === 0 ? "🆕 *أحدث الوظائف اليومية (بناءً على طلبك السابق):*\n\n" : "";
                    chunk.forEach((job, index) => {
                         jobsMsg += `*${i + index + 1}. ${job.title}*\n🏢 ${job.company}\n🕒 ${job.time}\n🔗 ${job.link}\n\n`;
                    });
                    
                    if (i + chunkSize >= jobs.length) {
                        jobsMsg += `\nللمزيد من الوظائف: https://www.ewdifh.com/`;
                    }
                    
                    await client.sendMessage(userId, jobsMsg);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                sentCount++;
                console.log(`Sent to ${userId}`);
            }
            
            res.send(`✅ Successfully sent jobs to ${sentCount} users who requested it previously.`);
        } catch (e) {
            console.error('Error in send-jobs-to-past-requests:', e);
            res.status(500).send('Error: ' + e.message);
        }
    } else {
        res.status(503).send('Client not ready');
    }
});

app.get('/test-send-jobs', async (req, res) => {
    const number = req.query.number || '966545888559';
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    
    if (!client) return res.status(503).send('Client not initialized');

    try {
        if (!fs.existsSync(JOBS_FILE)) {
            return res.status(404).send('Jobs file not found');
        }
        
        const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
        console.log(`🧪 Testing job send to ${chatId}...`);
        
        const chunkSize = 10;
        for (let i = 0; i < jobs.length; i += chunkSize) {
            const chunk = jobs.slice(i, i + chunkSize);
            let jobsMsg = i === 0 ? "🧪 *رسالة اختبار: أحدث 40 وظيفة يومية*\n\n" : "";
            chunk.forEach((job, index) => {
                 jobsMsg += `*${i + index + 1}. ${job.title}*\n🏢 ${job.company}\n🕒 ${job.time}\n🔗 ${job.link}\n\n`;
            });
            
            if (i + chunkSize >= jobs.length) {
                jobsMsg += `\nللمزيد من الوظائف: https://www.ewdifh.com/`;
            }
            
            await client.sendMessage(chatId, jobsMsg);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        res.send(`✅ Test jobs sent to ${chatId} successfully!`);
    } catch (e) {
        console.error('Error in test-send-jobs:', e);
        res.status(500).send('Error: ' + e.message);
    }
});

let pendingBroadcast100 = false;

app.get('/update-and-broadcast-100', async (req, res) => {
    if (!client) return res.status(503).send('Client not initialized');

    res.send('🔄 Starting job update and broadcast to 100 chats in the background.');

    (async () => {
        try {
            await scrapeJobs();
            pendingBroadcast100 = true;
            if (status === 'Connected' || status === 'Authenticated') {
                triggerBroadcast100();
            }
        } catch (err) {
            console.error('Error in update-and-broadcast-100:', err);
        }
    })();
});

app.get('/broadcast-jobs-100', async (req, res) => {
    if (!client) return res.status(503).send('Client not initialized');
    triggerBroadcast100();
    res.send('🚀 Broadcast to 100 chats forced! Check logs.');
});

let broadcastRetries = 0;

async function triggerBroadcast100() {
    try {
        if (!fs.existsSync(JOBS_FILE)) {
            console.error('Jobs file not found for broadcast');
            return;
        }

        if (status !== 'Connected' && status !== 'Authenticated' && !status.includes('Loading')) {
            console.log('Client not ready (Status: ' + status + ')');
            return;
        }
        
        console.log('Attempting to fetch chats for broadcast (100)...');
        const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
        let chats = [];

        if (client.pupPage) {
            try {
                console.log('Waiting for WhatsApp interface to stabilize...');
                await client.pupPage.waitForSelector('#pane-side', { timeout: 30000 }).catch(() => console.log('Pane-side selector timeout, but continuing...'));
                
                // Extra wait for store synchronization
                await new Promise(r => setTimeout(r, 5000));

                const storeStatus = await client.pupPage.evaluate(() => {
                    const s = window.Store;
                    return {
                        hasStore: typeof s !== 'undefined',
                        hasChat: typeof s?.Chat !== 'undefined',
                        hasModels: typeof s?.Chat?.models !== 'undefined',
                        count: s?.Chat?.models?.length || 0
                    };
                });
                
                console.log('Store status:', JSON.stringify(storeStatus));

                if (!storeStatus.hasModels || storeStatus.count === 0) {
                    broadcastRetries++;
                    console.log(`WhatsApp Store models not loaded yet (Retry ${broadcastRetries}).`);
                    
                    if (broadcastRetries > 3) {
                        console.log('Stuck for too long. Reloading page...');
                        broadcastRetries = 0;
                        await client.pupPage.reload();
                        setTimeout(triggerBroadcast100, 30000);
                        return;
                    }

                    // Attempt to extract chat IDs from DOM as a secondary fallback
                    console.log('Attempting to extract chat IDs from DOM side pane...');
                    const domChatIds = await client.pupPage.evaluate(() => {
                        const chats = [];
                        const chatElements = document.querySelectorAll('div[role="listitem"]');
                        chatElements.forEach(el => {
                            // This is a bit fragile but might work for some chats
                            const dataId = el.querySelector('div[data-testid="cell-frame-container"]')?.parentElement?.parentElement?.getAttribute('data-id');
                            if (dataId && dataId.includes('@c.us')) {
                                chats.push(dataId);
                            }
                        });
                        return [...new Set(chats)];
                    });

                    if (domChatIds && domChatIds.length > 0) {
                        console.log(`✅ DOM Extraction success: Found ${domChatIds.length} chat IDs.`);
                        chats = domChatIds.map(id => ({ id: { _serialized: id }, sendMessage: (msg) => client.sendMessage(id, msg) }));
                    } else {
                        console.log('DOM Extraction also failed. Retrying in 20s...');
                        setTimeout(triggerBroadcast100, 20000);
                        return;
                    }
                } else {
                    broadcastRetries = 0;
                    chats = await client.getChats();
                }
            } catch (err) {
                console.error('Error during chat fetch process:', err.message);
                setTimeout(triggerBroadcast100, 20000);
                return;
            }
        }

        const targetChats = chats.filter(c => c.id && c.id._serialized && !c.id._serialized.includes('@g.us')).slice(0, 100);
        
        if (targetChats.length === 0) {
            console.log('No personal chats found. Retrying in 20s...');
            setTimeout(triggerBroadcast100, 20000);
            return;
        }

        console.log(`🚀 Starting throttled broadcast of 40 jobs to ${targetChats.length} chats (10 chats per minute)...`);
        
        for (let i = 0; i < targetChats.length; i++) {
            const chat = targetChats[i];
            
            // Every 10 chats, wait for 1 minute (except for the very first batch)
            if (i > 0 && i % 10 === 0) {
                console.log(`⏳ Reached 10 chats limit. Waiting 1 minute before next batch...`);
                await new Promise(r => setTimeout(r, 60000));
            }

            try {
                const chunkSize = 10;
                for (let j = 0; j < jobs.length; j += chunkSize) {
                    const chunk = jobs.slice(j, j + chunkSize);
                    let msg = j === 0 ? "🆕 *أحدث 40 وظيفة يومية:*\n\n" : "";
                    chunk.forEach((job, idx) => msg += `*${j+idx+1}. ${job.title}*\n🏢 ${job.company}\n🔗 ${job.link}\n\n`);
                    if (j + chunkSize >= jobs.length) msg += `\nللمزيد: https://www.ewdifh.com/`;
                    
                    await client.sendMessage(chat.id._serialized, msg);
                    await new Promise(r => setTimeout(r, 2000)); // 2s between message chunks
                }
                console.log(`✅ [${i + 1}/${targetChats.length}] Sent to ${chat.name || chat.id.user}`);
                await new Promise(r => setTimeout(r, 5000)); // 5s between users within a batch
            } catch (err) {
                console.error(`Error sending to ${chat.id.user}:`, err.message);
            }
        }
        console.log('🏁 Completed throttled broadcast.');
        pendingBroadcast100 = false;
    } catch (e) {
        console.error('Error in triggerBroadcast100:', e);
    }
}

app.listen(port, () => {
    console.log(`Web server running at http://localhost:${port}`);
});

// Process error handlers
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err);
});

// Service Definitions with Requirements
const services = [
    {
        name: "الضمان الاجتماعي المطور",
        requirements: "لتسجيلك في الضمان الاجتماعي المطور، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. رقم الجوال\n5. العنوان الوطني\n6. الحساب البنكي (الآيبان)\n\n💰 **تكلفة الخدمة: 59 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "حساب المواطن",
        requirements: "للتسجيل في حساب المواطن، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. رقم الجوال\n5. بيانات الدخل للأسرة\n6. الحساب البنكي (الآيبان)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "حافز",
        requirements: "للتسجيل في حافز، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. المؤهل الدراسي وتاريخ التخرج\n4. رقم الجوال\n5. الحساب البنكي (الآيبان)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "ساند",
        requirements: "للتقديم على ساند (دعم التعطل عن العمل)، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. رقم الجوال\n4. قرار الفصل أو الاستقالة\n5. الحساب البنكي (الآيبان)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "قياس - جدارات",
        requirements: "للتسجيل في اختبارات قياس أو منصة جدارات، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. المؤهل العلمي (وثيقة التخرج)\n5. التخصص\n6. المنطقة والمدينة\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "تمهير",
        requirements: "للتسجيل في برنامج تمهير، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. وثيقة التخرج (بكالوريوس أو دبلوم)\n5. رقم الجوال\n6. الحساب البنكي (الآيبان)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "توطين",
        requirements: "للاستفادة من دعم توطين، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية (للأفراد) أو بيانات المنشأة\n3. تاريخ الميلاد\n4. العقد الوظيفي\n5. بيانات التأمينات الاجتماعية\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "إنشاء متجر إلكتروني",
        requirements: "لإنشاء متجرك الإلكتروني، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية (للتوثيق)\n3. تاريخ الميلاد\n4. اسم المتجر المقترح\n5. نوع النشاط التجاري\n6. رقم الجوال والبريد الإلكتروني\n\n💰 **تكلفة الخدمة: 100 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "دورة التجارة الإلكترونية",
        requirements: "للتسجيل في دورة التجارة الإلكترونية، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. رقم الجوال\n4. المستوى الحالي في التجارة الإلكترونية (مبتدئ/متوسط)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "التدريس من المنزل",
        requirements: "للتسجيل في خدمة التدريس من المنزل، يرجى تزويدنا بالبيانات والمرفقات التالية:\n1. الاسم الكامل\n2. رقم السجل المدني\n3. البريد الإلكتروني\n4. صورة الهوية الوطنية (مع تغطية الوجه)\n5. صورة المؤهل العلمي\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "التسويق الرقمي",
        requirements: "لخدمات التسويق الرقمي، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رابط مشروعك أو حسابات التواصل الاجتماعي\n3. الهدف من التسويق (زيادة مبيعات/متابعين)\n4. الميزانية المقترحة (إن وجدت)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "زيادة المتابعين",
        requirements: "لزيادة المتابعين، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رابط الحساب\n3. المنصة (تيك توك، انستقرام، تويتر، إلخ)\n4. العدد المطلوب\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "إعداد السيرة الذاتية",
        requirements: "لإعداد سيرتك الذاتية، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. رقم الجوال والإيميل\n5. المؤهلات العلمية\n6. الخبرات العملية\n7. المهارات والدورات\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "متابعة التوظيف",
        requirements: "لمتابعة طلبات التوظيف الخاصة بك، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. التخصص العلمي\n4. قائمة بالجهات التي تم التقديم عليها (إن وجدت)\n5. رقم الجوال للتواصل\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "استشارات مهنية",
        requirements: "للحصول على استشارة مهنية متخصصة، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. المؤهل العلمي\n3. الخبرات العملية الحالية\n4. موضوع الاستشارة أو التحديات التي تواجهك\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "جديد الوظائف",
        requirements: "لتفعيل خدمة جديد الوظائف، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. رقم الجوال\n\n💰 **تكلفة الخدمة: مجاناً**\nسيتم إرسال أحدث 40 وظيفة لك يومياً."
    }
];

const servicesList = services.map((s, i) => `*${i + 1}* - ${s.name}`).join('\n') + `\n\n🌐 *الموقع الإلكتروني:* ${SITE_URL}`;

async function sendJobsToUser(message) {
    console.log('Sending jobs to user:', message.from);
    if (fs.existsSync(JOBS_FILE)) {
        try {
            const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
            const chunkSize = 10;
            for (let i = 0; i < jobs.length; i += chunkSize) {
                const chunk = jobs.slice(i, i + chunkSize);
                let jobsMsg = i === 0 ? "🆕 *أحدث الوظائف اليومية:*\n\n" : "";
                chunk.forEach((job, index) => {
                     jobsMsg += `*${i + index + 1}. ${job.title}*\n🏢 ${job.company}\n🕒 ${job.time}\n🔗 ${job.link}\n\n`;
                });
                
                if (i + chunkSize >= jobs.length) {
                    jobsMsg += `\nللمزيد من الوظائف: https://www.ewdifh.com/`;
                }
                
                await message.reply(jobsMsg);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (e) {
            console.error('Error sending jobs:', e);
            await message.reply('عذراً، حدث خطأ أثناء جلب الوظائف.');
        }
    } else {
        await message.reply('جارٍ جلب أحدث الوظائف، يرجى الانتظار قليلاً...');
        try {
            const jobs = await scrapeJobs();
            if (jobs && jobs.length > 0) {
                const chunkSize = 10;
                for (let i = 0; i < jobs.length; i += chunkSize) {
                    const chunk = jobs.slice(i, i + chunkSize);
                    let jobsMsg = i === 0 ? "🆕 *أحدث الوظائف اليومية:*\n\n" : "";
                    chunk.forEach((job, index) => {
                         jobsMsg += `*${i + index + 1}. ${job.title}*\n🏢 ${job.company}\n🕒 ${job.time}\n🔗 ${job.link}\n\n`;
                    });
                    
                    if (i + chunkSize >= jobs.length) {
                        jobsMsg += `\nللمزيد من الوظائف: https://www.ewdifh.com/`;
                    }
                    
                    await message.reply(jobsMsg);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                await message.reply('عذراً، لم يتم العثور على وظائف حالياً.');
            }
        } catch (err) {
            console.error('Error during fallback scrape:', err);
            await message.reply('عذراً، حدث خطأ أثناء جلب الوظائف.');
        }
    }
}

const broadcastServices = async (count) => {
    console.log(`Starting broadcast to ${count} chats...`);
    const servicesMessage = `*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\n🌐 *الموقع الإلكتروني:* ${SITE_URL}`;
    
    try {
        const chats = await client.getChats();
        const validChats = chats.filter(c => c.id.server === 'c.us' || c.id.server === 'g.us');
        const targetChats = validChats.slice(0, count);

        let sentCount = 0;
        for (const chat of targetChats) {
            await chat.sendMessage(servicesMessage);
            sentCount++;
            console.log(`Sent to ${chat.name || chat.id.user}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(`Broadcast completed. Sent to ${sentCount} chats.`);
    } catch (e) {
        console.error('Error broadcasting:', e);
    }
};

const initializeClient = () => {
    console.log('Initializing client...');
    
    client = new Client({
        authStrategy: new LocalAuth({
            clientId: "khaled-bot",
            dataPath: "./.auth_new_v5"
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ],
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
        },
        authTimeoutMs: 60000,
        qrMaxRetries: 0,
        takeoverOnConflict: true,
        takeoverTimeoutMs: 0,
        puppeteer: {
            headless: true,
            dumpio: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--remote-debugging-port=9222',
                '--disable-web-security',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-software-rasterizer'
            ]
        }
    });

    client.on('qr', (qr) => {
        console.log('QR Code received');
        qrcode.toDataURL(qr, (err, url) => {
            if (err) {
                console.error('Error generating QR', err);
                return;
            }
            qrCodeData = url;
            status = 'Scan QR Code';
        });
    });

    client.on('ready', async () => {
        console.log('--- READY EVENT START ---');
        console.log('✅ Client is ready!');
        status = 'Connected';
        qrCodeData = '';
        
        // Initialize SendPulse
        try {
            await initSendPulse();
            console.log('✅ SendPulse initialized on startup');
        } catch (e) {
            console.error('❌ SendPulse initialization failed:', e);
        }
        
        // Send a startup message to the user
        const startupMessage = `*Bot Started & Ready!* ✅
*البوت الآن يعمل وجاهز لاستقبال الطلبات*

الأوامر المتاحة / Available Commands:
1. *services* / *خدمات*: لعرض القائمة
2. *test* / *تجربة*: للتأكد من العمل
3. *16*: لعرض الوظائف مباشرة`;

        console.log('Attempting to send startup message to:', ADMIN_NUMBER);
        client.sendMessage(ADMIN_NUMBER, startupMessage, { sendSeen: false }).then(() => {
            console.log('✅ Startup message sent to ' + ADMIN_NUMBER);
        }).catch(err => {
            console.error('❌ Failed to send startup message:', err);
        });

        // Check if there's a pending broadcast
        if (pendingBroadcast100) {
            console.log('🚀 Starting queued broadcast to 100 chats...');
            triggerBroadcast100();
        }
        console.log('--- READY EVENT END ---');
    });

    client.on('authenticated', () => {
        console.log('--- AUTHENTICATED EVENT ---');
        console.log('✅ Authenticated (session saved)');
        status = 'Authenticated';
        
        // Fallback: if ready doesn't fire in 30s, assume we are connected
        setTimeout(() => {
            if (status === 'Authenticated') {
                console.log('⚠️ Ready event didn\'t fire in 30s, forcing Connected status');
                status = 'Connected';
            }
        }, 30000);
    });
    
    client.on('auth_failure', (msg) => {
        console.error('❌ Auth failure:', msg);
        status = 'Auth Failure: ' + msg;
    });
    
    client.on('disconnected', (reason) => {
        console.log('⚠️ Disconnected:', reason);
        status = 'Disconnected: ' + reason;
        // Destroy and re-initialize
        try {
            client.destroy();
        } catch (error) {
            console.error('Error destroying client:', error);
        }
        client = null;
        console.log('Re-initializing client in 5 seconds...');
        setTimeout(initializeClient, 5000);
    });

    // Use both message and message_create to ensure coverage
    client.on('message', handleIncomingMessage);
    client.on('message_create', handleIncomingMessage);

    async function handleIncomingMessage(message) {
        // Skip group chats entirely (no replies to groups)
        const chat = await message.getChat();
        if (chat.isGroup) return;

        // Clean up input and convert Arabic numbers to English
        const rawBody = message.body.toLowerCase().trim();
        const msgBody = rawBody.replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 1776);
        
        // Prevent processing the same message twice if both events fire
        const messageKey = `${message.id._serialized}_${msgBody}`;
        if (handleIncomingMessage.lastProcessed === messageKey) return;
        handleIncomingMessage.lastProcessed = messageKey;

        console.log(`📩 Message from ${message.from} (Me: ${message.fromMe}): ${msgBody}`);

        // Prevent bot from replying to its own automated messages (loops)
        if (message.fromMe) {
            if (!isNaN(parseInt(msgBody)) || msgBody === 'services' || msgBody === 'خدمات' || msgBody === 'الخدمات' || msgBody === 'test' || msgBody === 'تجربة') {
                // Allow fall-through
            } else if (msgBody.startsWith('!')) {
                // Admin commands
            } else {
                return; 
            }
        }
        
        // --- Unified Message Handling ---
        if (ENABLE_AUTO_REPLY) {
            let currentState = userStates.get(message.from) || 'INITIAL';
            
            // 1. Check if it's a service number (1-16) - HIGHEST PRIORITY
            const potentialServiceIndex = parseInt(msgBody) - 1;
            const isServiceNumber = !isNaN(potentialServiceIndex) && potentialServiceIndex >= 0 && potentialServiceIndex < services.length;

            if (isServiceNumber) {
                console.log(`✅ User ${message.from} selected service ${potentialServiceIndex + 1}`);
                const selectedService = services[potentialServiceIndex];
                
                const replyMsg = `✅ *لقد اخترت خدمة: ${selectedService.name}*\n\n📋 *المتطلبات لإتمام الخدمة:*\n${selectedService.requirements}\n\nيرجى تزويدنا بهذه البيانات هنا أو عبر الرابط:\n${SITE_URL}`;
                await message.reply(replyMsg);
                
                markUserAsSeen(message.from);
                userStates.set(message.from, 'COMPLETED');

                if (selectedService.name === "جديد الوظائف" || potentialServiceIndex === 15) {
                    await sendJobsToUser(message);
                }
                
                try {
                    const contact = await message.getContact();
                    const name = contact.pushname || contact.name || 'WhatsApp User';
                    const number = contact.number || message.from.split('@')[0];
                    const email = `${number}@whatsapp.bot`;
                    addContact(SENDPULSE_BOOK_ID, email, number, name, selectedService.name);
                } catch (e) {
                    console.error('CRM Error:', e.message);
                }
                return;
            }

            // 2. Admin Commands
            if (message.from === ADMIN_NUMBER || message.fromMe) {
                if (msgBody.startsWith('!broadcast ')) {
                    const broadcastMsg = message.body.slice(11);
                    const chats = await client.getChats();
                    const personalChats = chats.filter(c => c.id.server === 'c.us');
                    let count = 0;
                    for (const c of personalChats) {
                        await c.sendMessage(broadcastMsg);
                        count++;
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    message.reply(`✅ Broadcast sent to ${count} chats.`);
                    return;
                } else if (msgBody.startsWith('!broadcast-services ')) {
                    const parts = msgBody.split(' ');
                    const countLimit = parseInt(parts[1]) || 10;
                    const servicesMessage = `*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*يرجى إرسال رقم الخدمة المطلوبة لمعرفة التفاصيل والمتطلبات.*\n\n🌐 *الموقع الإلكتروني:* ${SITE_URL}`;
                    const chats = await client.getChats();
                    const validChats = chats.filter(c => c.id.server === 'c.us');
                    const targetChats = validChats.slice(0, countLimit);
                    message.reply(`⏳ Sending services list to ${targetChats.length} chats...`);
                    for (const chat of targetChats) {
                        await chat.sendMessage(servicesMessage);
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    message.reply(`✅ Services list sent.`);
                    return;
                }
            }

            // 3. Basic Ping/Test
            if (msgBody === '!ping' || msgBody === 'ping') {
                message.reply('pong');
                return;
            } else if (msgBody === 'hello' || msgBody === 'hi' || msgBody === 'test' || msgBody === 'تجربة') {
                message.reply('Bot is working! / البوت يعمل بنجاح!\nأرسل "خدمات" لعرض القائمة.');
                return;
            }

            // 4. Default for ANY other message -> Send Menu
            // (Avoiding infinite loop for messages sent by bot that aren't service numbers)
            if (!message.fromMe) {
                await message.reply(`مرحباً بك في المكتبة الرقمية 📚\n\n*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\n🌐 *الموقع الإلكتروني:* ${SITE_URL}`);
                userStates.set(message.from, 'SELECTING_SERVICE');
                markUserAsSeen(message.from);
            }
        }
    }

    client.initialize().catch(err => {
        console.error('Initialization error:', err);
        status = 'Initialization Error: ' + err.message;
        console.log('Retrying initialization in 5 seconds...');
        setTimeout(initializeClient, 5000);
    });
};

// Schedule scraping daily at 8:00 AM
cron.schedule('0 8 * * *', () => {
    console.log('Running daily job scraper...');
    scrapeJobs();
});

// Schedule Daily Status Update at 9:00 AM
cron.schedule('0 9 * * *', async () => {
    console.log('Posting daily status update...');
    if (client && status === 'Connected') {
        try {
            const statusImagePath = path.join(__dirname, 'daily_status.jpg');
            if (fs.existsSync(statusImagePath)) {
                const media = MessageMedia.fromFilePath(statusImagePath);
                // Caption based on the image content
                const caption = `وظائف يومية مجانية! 📢\nأكثر من 40 وظيفة يومياً تصلك على جوالك.\n\nفقط أرسل رقم *16* للاشتراك ✅\n\nالمحتوى:\n- وظائف حكومي وشركات\n- تدريب منتهي بالتوظيف\n- دورات مجانية`;
                await client.sendMessage('status@broadcast', media, { caption: caption });
                console.log('✅ Daily status image posted successfully');
            } else {
                const statusText = `مرحباً بك في المكتبة الرقمية 📚\n\nقائمة الخدمات المتاحة:\n\n${servicesList}\n\nلطلب أي خدمة، يرجى الرد برقم الخدمة.`;
                await client.sendMessage('status@broadcast', statusText);
                console.log('✅ Daily status text posted successfully');
            }
        } catch (e) {
            console.error('❌ Error posting status:', e);
        }
    }
});

// Start the client
initializeClient();
