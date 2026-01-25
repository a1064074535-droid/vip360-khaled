const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const express = require('express');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { scrapeJobs, JOBS_FILE } = require('./jobs_scraper');
const { initSendPulse, addContact } = require('./sendpulse-service');
const { processCommand } = require('./agent_brain');
require('dotenv').config();

const SITE_URL = 'https://bit.ly/4sKzlZP';

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
            const servicesMessage = `*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\nلزيارة الموقع: ${SITE_URL}`;
            
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
        name: "حافز",
        requirements: "للتسجيل في حافز، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. المؤهل الدراسي وتاريخ التخرج\n4. رقم الجوال\n5. الحساب البنكي (الآيبان)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "حساب المواطن",
        requirements: "للتسجيل في حساب المواطن، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. رقم الجوال\n5. بيانات الدخل للأسرة\n6. الحساب البنكي (الآيبان)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "ساند",
        requirements: "للتقديم على ساند (دعم التعطل عن العمل)، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. رقم الجوال\n4. قرار الفصل أو الاستقالة\n5. الحساب البنكي (الآيبان)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "قياس",
        requirements: "للتسجيل في اختبارات قياس، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. السجل المدني\n4. تاريخ الميلاد\n5. نوع الاختبار المطلوب\n6. المنطقة والمدينة المفضلة للاختبار\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
    },
    {
        name: "جدارات",
        requirements: "للتسجيل في منصة جدارات، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. المؤهل العلمي (وثيقة التخرج)\n5. السجل الأكاديمي\n6. الخبرات السابقة (إن وجدت)\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA54800002456086161270"
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
        requirements: "لخدمة متابعة التوظيف، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. السيرة الذاتية الحالية\n5. المؤهل العلمي\n6. المسميات الوظيفية المستهدفة\n7. المدن المفضلة للعمل\n\n💰 **تكلفة الخدمة: 20 ريال**\n\n💳 **للسداد يرجى التحويل على الحسابات التالية:**\n🏦 **البنك الأهلي:** SA6210000024200000066707\n🏦 **مصرف الراجحي:** SA554800002456086161270"
    },
    {
        name: "جديد الوظائف",
        requirements: "لتفعيل خدمة جديد الوظائف، يرجى تزويدنا بالبيانات التالية:\n1. الاسم الثلاثي\n2. رقم الهوية الوطنية\n3. تاريخ الميلاد\n4. رقم الجوال\n\n💰 **تكلفة الخدمة: مجاناً**\nسيتم إرسال أحدث 20 وظيفة لك يومياً."
    }
];

const servicesList = services.map((s, i) => `*${i + 1}* - ${s.name}`).join('\n');

const broadcastServices = async (count) => {
    console.log(`Starting broadcast to ${count} chats...`);
    const servicesMessage = `*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\nلزيارة الموقع: ${SITE_URL}`;
    
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
            clientId: 'khaled-bot-new',
            dataPath: './.auth_new_v5'
        }),
        puppeteer: {
            // executablePath: '/home/ubuntu/.cache/puppeteer/chrome/linux-1108766/chrome-linux/chrome',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-sync',
                '--disable-translate',
                '--mute-audio',
                '--no-first-run',
                '--safebrowsing-disable-auto-update'
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
        const startupMessage = `*Bot Updated with Service Requirements*
*تم تحديث البوت بمتطلبات الخدمات*

الأوامر المتاحة / Available Commands:
1. *services* / *خدمات*:
   - عرض قائمة الخدمات الـ 15
   - List the 15 services

2. *test* / *تجربة*:
   - للتحقق من أن البوت يعمل
   - Check if bot is working`;

        client.sendMessage(ADMIN_NUMBER, startupMessage, { sendSeen: false }).then(() => {
            console.log('✅ Startup message sent to ' + ADMIN_NUMBER);
            // Trigger Broadcast on startup (Temporary)
            // broadcastServices(100);
        }).catch(err => {
            console.error('❌ Failed to send startup message:', err);
        });
    });

    client.on('authenticated', () => {
        console.log('✅ Authenticated (session saved)');
        status = 'Authenticated';
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

    // Use message_create to detect messages sent by the bot owner (self) as well
    client.on('message_create', async message => {
        console.log(`Message received from ${message.from} (Me: ${message.fromMe}): ${message.body}`);
        
        const msgBody = message.body.toLowerCase().trim();

        // Skip group chats entirely (no replies to groups)
        const chat = await message.getChat();
        if (chat.isGroup) {
            return;
        }

        // Prevent bot from replying to its own automated messages (loops)
        // But ALLOW it to reply to explicit commands from the owner if needed
        if (message.fromMe) {
            // Allow processing of numbers or specific commands
            if (!isNaN(parseInt(msgBody)) || msgBody === 'services' || msgBody === 'خدمات' || msgBody === 'الخدمات' || msgBody === 'test' || msgBody === 'تجربة') {
                // Allow fall-through to main logic
            } else if (msgBody.startsWith('!broadcast')) {
                 // Allow execution
            } else {
                // Ignore other random text from self to avoid spam
                return; 
            }
        }
        
        // --- Special Handling for Specific User (Owner's request) ---
        // If 966507866885 or 966500797353 or 966544432884 sends ANY message, reply with the website list
        if (message.from === '966507866885@c.us' || message.from === '966500797353@c.us' || message.from === '966544432884@c.us') {
            const potentialServiceIndex = parseInt(msgBody) - 1;
            const isServiceNumber = !isNaN(potentialServiceIndex) && potentialServiceIndex >= 0 && potentialServiceIndex < services.length;

            if (isServiceNumber) {
                // Allow them to pick a service normally
                userStates.set(message.from, 'SELECTING_SERVICE');
                // IMPORTANT: Mark as seen so they don't get trapped in the "New User" block below
                markUserAsSeen(message.from);
                // Don't return, let it fall through to the service processing logic below
            } else {
                await message.reply(`*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\nلزيارة الموقع: ${SITE_URL}`);
                return;
            }
        }

        // --- New User Handling (First Time Contact) ---
        if (!message.fromMe && !seenUsers.has(message.from)) {
            // Mark as seen
            markUserAsSeen(message.from);
            
            // Send Services List directly
            await message.reply(`*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\nلزيارة الموقع: ${SITE_URL}`);
            
            // Set state to SELECTING_SERVICE so they can pick a number immediately
            userStates.set(message.from, 'SELECTING_SERVICE');
            return;
        }

        // --- State Machine for Private Users ---
        if (!message.fromMe && ENABLE_AUTO_REPLY) {
            let currentState = userStates.get(message.from) || 'INITIAL';

            // Check if user is in COMPLETED state
            if (currentState === 'COMPLETED') {
                const potentialServiceIndex = parseInt(msgBody) - 1;
                const isServiceNumber = !isNaN(potentialServiceIndex) && potentialServiceIndex >= 0 && potentialServiceIndex < services.length;

                // Only wake up for specific commands OR if it looks like a service selection
                if (msgBody === 'services' || msgBody === 'خدمات' || msgBody === 'الخدمات' || msgBody === 'test' || msgBody === 'تجربة') {
                    userStates.set(message.from, 'INITIAL');
                    currentState = 'INITIAL'; // Update local var to allow flow
                } else if (isServiceNumber) {
                    // Allow service selection even if completed
                    userStates.set(message.from, 'SELECTING_SERVICE');
                    currentState = 'SELECTING_SERVICE';
                } else {
                    // Ignore all other messages from completed users
                    return;
                }
            }

            if (currentState === 'INITIAL') {
                // Check if message is a number immediately to avoid forcing them to say 'hi' first
                const potentialServiceIndex = parseInt(msgBody) - 1;
                const isServiceNumber = !isNaN(potentialServiceIndex) && potentialServiceIndex >= 0 && potentialServiceIndex < services.length;

                if (isServiceNumber) {
                    userStates.set(message.from, 'SELECTING_SERVICE');
                    currentState = 'SELECTING_SERVICE';
                    // Allow to fall through to processing
                } else {
                    await message.reply(`مرحباً بك في المكتبة الرقمية 📚\n\n*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\nلزيارة الموقع: ${SITE_URL}`);
                    userStates.set(message.from, 'SELECTING_SERVICE');
                    return;
                }
            }

            if (currentState === 'AWAITING_CHOICE') {
                // Legacy code block removed to prevent conflict with service selection
                userStates.set(message.from, 'SELECTING_SERVICE');
                currentState = 'SELECTING_SERVICE';
            }
            
            if (currentState === 'SELECTING_SERVICE') {
                // Allow them to pick a service number
                const serviceIndex = parseInt(msgBody) - 1;
                
                if (!isNaN(serviceIndex) && serviceIndex >= 0 && serviceIndex < services.length) {
                    // Valid service selected - Process it
                    // Logic continues below...
                } else {
                    // Invalid input while in service selection
                    // If it's not a number, assume they are chatting or done.
                    // Mark as COMPLETED to stop nagging.
                    userStates.set(message.from, 'COMPLETED');
                    return;
                }
            }
        }
        // ---------------------------------------

        if (msgBody === 'services' || msgBody === 'خدمات' || msgBody === 'الخدمات') {
            message.reply(`*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*الرجاء كتابة رقم الخدمة التي ترغب بها (مثلاً: 1) ليتم تزويدك بالتفاصيل.*\n\nلزيارة الموقع: ${SITE_URL}`);
        } else if (msgBody.startsWith('!broadcast ')) {
            if (message.from === ADMIN_NUMBER) {
                const broadcastMsg = message.body.slice(11);
                const chats = await client.getChats();
                const personalChats = chats.filter(c => c.id.server === 'c.us');
                let count = 0;
                for (const c of personalChats) {
                    await c.sendMessage(broadcastMsg);
                    count++;
                }
                message.reply(`✅ Broadcast sent to ${count} chats.`);
            } else {
                message.reply('⛔ This command is for admin only.');
            }
        } else if (msgBody.startsWith('!broadcast-services ')) {
            if (message.from === ADMIN_NUMBER) {
                const parts = msgBody.split(' ');
                const countLimit = parseInt(parts[1]);
                
                if (isNaN(countLimit) || countLimit <= 0) {
                    message.reply('⚠️ Please specify a valid number. Usage: !broadcast-services <count>\nExample: !broadcast-services 30');
                    return;
                }

                const servicesMessage = `*قائمة الخدمات المتاحة:*\n\n${servicesList}\n\n*يرجى إرسال رقم الخدمة المطلوبة لمعرفة التفاصيل والمتطلبات.*\n\nلزيارة الموقع: ${SITE_URL}`;

                const chats = await client.getChats();
                // Only personal chats (no groups)
                const validChats = chats.filter(c => c.id.server === 'c.us');
                
                // Slice the top N chats
                const targetChats = validChats.slice(0, countLimit);

                message.reply(`⏳ Sending services list to last ${targetChats.length} chats...`);

                let sentCount = 0;
                for (const chat of targetChats) {
                    await chat.sendMessage(servicesMessage);
                    sentCount++;
                    // Small delay to prevent spam flagging
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                message.reply(`✅ Services list sent to ${sentCount} chats.`);
            } else {
                message.reply('⛔ This command is for admin only.');
            }
        } else if (msgBody === '!ping' || msgBody === 'ping') {
            message.reply('pong');
        } else if (msgBody === 'hello' || msgBody === 'hi' || msgBody === 'test' || msgBody === 'تجربة') {
            message.reply('Bot is working! / البوت يعمل بنجاح!\nأرسل "خدمات" لعرض القائمة.');
        } else {
            // Check if message is a number 1-16
            const serviceIndex = parseInt(msgBody) - 1;
            console.log(`Checking service index for input '${msgBody}': ${serviceIndex}`);
            
            if (!isNaN(serviceIndex) && serviceIndex >= 0 && serviceIndex < services.length) {
                const selectedService = services[serviceIndex];
                console.log(`Selected service: ${selectedService.name}`);

                // 1. Send the standard requirements message first
                const replyMsg = `✅ *لقد اخترت خدمة: ${selectedService.name}*\n\n📋 *المتطلبات لإتمام الخدمة:*\n${selectedService.requirements}\n\nيرجى تزويدنا بهذه البيانات هنا أو عبر الرابط:\n${SITE_URL}`;
                await message.reply(replyMsg); // Added await here to ensure order
                
                // 2. Mark as COMPLETED
                userStates.set(message.from, 'COMPLETED');

                // 3. Special handling for "جديد الوظائف" (Index 15) - Send Jobs Content
                // Check by name OR index to be safe
                if (selectedService.name === "جديد الوظائف" || serviceIndex === 15) {
                    console.log('User selected jobs service. Processing...');
                    console.log('Jobs file path:', JOBS_FILE);
                    
                    if (fs.existsSync(JOBS_FILE)) {
                        try {
                            const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
                            console.log(`Read ${jobs.length} jobs from file.`);
                            
                            // Split into chunks of 10 to avoid long message issues
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
                                
                                console.log(`Sending chunk ${i/chunkSize + 1}...`);
                                await message.reply(jobsMsg);
                                // Small delay between chunks to ensure order
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        } catch (e) {
                            console.error('Error reading jobs file or sending message:', e);
                            message.reply('عذراً، حدث خطأ أثناء جلب الوظائف.');
                        }
                    } else {
                        // If file doesn't exist, try to scrape immediately
                        message.reply('جارٍ جلب أحدث الوظائف، يرجى الانتظار قليلاً...');
                        scrapeJobs().then(jobs => {
                            if (jobs && jobs.length > 0) {
                                let jobsMsg = "🆕 *أحدث الوظائف اليومية:*\n\n";
                                jobs.forEach((job, i) => {
                                     jobsMsg += `*${i+1}. ${job.title}*\n🏢 ${job.company}\n🕒 ${job.time}\n🔗 ${job.link}\n\n`;
                                });
                                jobsMsg += `\nللمزيد من الوظائف: https://www.ewdifh.com/`;
                                message.reply(jobsMsg);
                            } else {
                                message.reply('عذراً، لم يتم العثور على وظائف حالياً.');
                            }
                        });
                    }
                }

                // 4. Add to SendPulse CRM
                try {
                    const contact = await message.getContact();
                    const name = contact.pushname || contact.name || 'WhatsApp User';
                    const number = contact.number; // e.g., 966545888559
                    // Create a dummy email for CRM
                    const email = `${number}@whatsapp.bot`;
                    
                    addContact(SENDPULSE_BOOK_ID, email, number, name, selectedService.name);
                    console.log(`Adding ${name} (${number}) to SendPulse for service: ${selectedService.name}`);
                } catch (e) {
                    console.error('Error adding to SendPulse:', e);
                }

            } 
            // Also check if user typed the exact service name
            else {
                const foundService = services.find(s => s.name === message.body || s.name.includes(message.body));
                if (foundService && message.body.length > 3) { // Length check to avoid matching short common words
                    const replyMsg = `✅ *لقد اخترت خدمة: ${foundService.name}*\n\n📋 *المتطلبات لإتمام الخدمة:*\n${foundService.requirements}\n\nيرجى تزويدنا بهذه البيانات هنا أو عبر الرابط:\n${SITE_URL}`;
                    message.reply(replyMsg);

                    // Add to SendPulse CRM
                    try {
                        const contact = await message.getContact();
                        const name = contact.pushname || contact.name || 'WhatsApp User';
                        const number = contact.number;
                        const email = `${number}@whatsapp.bot`;
                        
                        addContact(SENDPULSE_BOOK_ID, email, number, name, foundService.name);
                        console.log(`Adding ${name} (${number}) to SendPulse for service: ${foundService.name}`);
                    } catch (e) {
                        console.error('Error adding to SendPulse:', e);
                    }
                }
            }
        }
    });

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

// Start the client
initializeClient();
