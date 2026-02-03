const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const JOBS_FILE = path.join(__dirname, 'public_html', 'daily_jobs.json');
const EWDIFH_URL = 'https://www.ewdifh.com/category/all-jobs';
const WADHEFA_URL = 'https://www.wadhefa.com/';

async function scrapeEwdifh() {
    try {
        console.log(`Scraping jobs from ${EWDIFH_URL}...`);
        const { data } = await axios.get(EWDIFH_URL);
        const $ = cheerio.load(data);
        
        const jobs = [];
        
        // Select job cards based on the structure we saw
        $('.bg-white.rounded-md.shadow.p-3.w-full').each((i, el) => {
            if (jobs.length >= 20) return false; // Stop after 20 jobs

            const titleElement = $(el).find('.text-base.font-semibold a');
            const title = titleElement.text().trim();
            const link = titleElement.attr('href');
            
            const fullLink = link && !link.startsWith('http') ? `https://www.ewdifh.com${link}` : link;

            // Company/Org name
            const orgElement = $(el).find('i.fa-building').parent().find('a');
            const company = orgElement.text().trim();

            // Time posted
            const timeElement = $(el).find('i.fa-clock').parent().find('span');
            const time = timeElement.text().trim();

            if (title && fullLink) {
                jobs.push({
                    title,
                    link: fullLink,
                    company,
                    time
                });
            }
        });

        // Check if we need more jobs from page 2
        if (jobs.length < 20) {
            console.log('Not enough jobs from Ewdifh page 1, fetching page 2...');
            try {
                const page2Url = `${EWDIFH_URL}?page=2`;
                const { data: data2 } = await axios.get(page2Url);
                const $2 = cheerio.load(data2);
                
                $2('.bg-white.rounded-md.shadow.p-3.w-full').each((i, el) => {
                    if (jobs.length >= 20) return false;

                    const titleElement = $2(el).find('.text-base.font-semibold a');
                    const title = titleElement.text().trim();
                    const link = titleElement.attr('href');
                    const fullLink = link && !link.startsWith('http') ? `https://www.ewdifh.com${link}` : link;
                    const orgElement = $2(el).find('i.fa-building').parent().find('a');
                    const company = orgElement.text().trim();
                    const timeElement = $2(el).find('i.fa-clock').parent().find('span');
                    const time = timeElement.text().trim();

                    if (title && fullLink) {
                        jobs.push({
                            title,
                            link: fullLink,
                            company,
                            time
                        });
                    }
                });
            } catch (err) {
                console.error('Error fetching Ewdifh page 2:', err);
            }
        }
        
        return jobs;
    } catch (error) {
        console.error('Error scraping Ewdifh:', error);
        return [];
    }
}

async function scrapeWadhefa() {
    try {
        console.log(`Scraping jobs from ${WADHEFA_URL}...`);
        const { data } = await axios.get(WADHEFA_URL);
        const $ = cheerio.load(data);
        
        const jobs = [];
        
        // Target specific job rows to avoid container rows
        $('tr').each((i, el) => {
            if (jobs.length >= 20) return false;

            const titleLink = $(el).find('a.tablelist');
            // We expect exactly one title link per row
            if (titleLink.length !== 1) return;

            const title = titleLink.text().trim();
            let link = titleLink.attr('href');
            
            // Fix relative links
            if (link && !link.startsWith('http')) {
                link = `https://www.wadhefa.com${link}`;
            }

            // Attempt to find Date
            let time = '';
            const firstColText = $(el).find('td').first().text().trim();
            // Regex for DD/MM/YYYY
            const dateMatch = firstColText.match(/(\d{2}\/\d{2}\/\d{4})/);
            if (dateMatch) {
                time = dateMatch[1];
            } else {
                time = 'اليوم'; 
            }

            // Attempt to find Company/Source/Location
            let company = '';
            const tds = $(el).find('td');
            const titleTdIndex = titleLink.parent().index();
            
            // Try the next column
            if (titleTdIndex > -1 && tds.length > titleTdIndex + 1) {
                const nextTd = $(tds[titleTdIndex + 1]);
                company = nextTd.text().trim();
            }
            
            // If the next column is generic (like "Saudi only"), try the one after
            if (company.includes('سعودي') || company.includes('للجنسين') || company.includes('متاحة')) {
                 if (tds.length > titleTdIndex + 2) {
                    const locTd = $(tds[titleTdIndex + 2]);
                    const locText = locTd.text().trim();
                    if (locText) {
                        company = locText; // Use location as identifier
                    }
                 }
            }
            
            if (!company) company = 'وظيفة.كوم';

            if (title && link) {
                // Avoid duplicates
                if (!jobs.some(j => j.link === link)) {
                    jobs.push({
                        title,
                        link,
                        company,
                        time
                    });
                }
            }
        });

        return jobs;
    } catch (error) {
        console.error('Error scraping Wadhefa:', error);
        return [];
    }
}

async function scrapeJobs() {
    console.log('Starting full scrape...');
    
    // Run both scrapes
    const [ewdifhJobs, wadhefaJobs] = await Promise.all([
        scrapeEwdifh(),
        scrapeWadhefa()
    ]);

    console.log(`Got ${ewdifhJobs.length} jobs from Ewdifh.`);
    console.log(`Got ${wadhefaJobs.length} jobs from Wadhefa.`);

    // Combine: 20 from Ewdifh + 20 from Wadhefa
    const allJobs = [
        ...ewdifhJobs.slice(0, 20),
        ...wadhefaJobs.slice(0, 20)
    ].sort(() => Math.random() - 0.5);

    console.log(`Total jobs combined: ${allJobs.length}`);
    
    if (allJobs.length > 0) {
        fs.writeFileSync(JOBS_FILE, JSON.stringify(allJobs, null, 2), 'utf8');
        console.log(`Saved jobs to ${JOBS_FILE}`);
        return allJobs;
    } else {
        console.log('No jobs found.');
        return [];
    }
}

// Allow running directly
if (require.main === module) {
    scrapeJobs();
}

module.exports = { scrapeJobs, JOBS_FILE };
