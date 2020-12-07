const puppeteer = require('puppeteer');
const iPad = puppeteer.devices['iPad'];
const creds = require('./creds.json');

/**
 * Pause main thread for a fiven number of seconds
 *
 * @param {Number} s
 * @returns {Promise} to resolve after given number of seconds
 */
function sleep(s) {
  return new Promise(r => setTimeout(r, 1000 * s));
}

async function start() {
  // const browser = await puppeteer.launch({ headless: false });
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  return { browser, page };
}

/**
 * enter credentials and click sign in
 *
 * @param {Puppeteer.Page} page sign on page
 */
async function auth(page) {
  await page.type('#Username', creds.username, {delay: 100});
  await page.type('#Password', creds.password, {delay: 100});
  await page.click('#SignIn');
  await sleep(5);

  await page.click('#co_clientIDContinueButton');
  await sleep(5);
}

function pdf(name) {
  return {
    path: `./pdfs/${name}.pdf`,
    format: 'A4',
    printBackground: true,
    // Word's default A4 margins
    margin: {
      top: '2.54cm',
      bottom: '2.54cm',
      left: '2.54cm',
      right: '2.54cm'
    }
  };
}

/**
 * Accepts a page that is ready to be saved
 *
 * @param {Puppeteer.Page} page
 * @param {String} filename
 */
async function save(page, filename) {
  await page.pdf(pdf(filename));
}

const ENTRY = 'https://1.next.westlaw.com/';
const TOC = 'https://1.next.westlaw.com/Browse/Home/SecondarySources/IntellectualPropertySecondarySources/IntellectualPropertyTextsTreatises/AnnotatedPatentDigestMatthews?transitionType=Default&contextData=%28sc.Default%29';

async function getExpansions(page) {
  return await page.$$('.co_genericExpand');
}

async function expand(page) {
  let expansions = await getExpansions(page);
  let seen = 0;

  // expand every chapter subheading
  while(expansions.length > 1 && seen < 10) {
    for(let i = 0; i < expansions.length; i ++) {
      await expansions[i].click();
      await sleep(0.2);
    }

    expansions = await getExpansions(page);
    seen += expansions.length;
  }
}

async function download(browser, page) {
  const chapters = await page.$$eval('a.co_tocItemLink', elements => elements.map(element => ({
    href: element.getAttribute("href"),
    title: element.innerText
  })));
  
  for (let i = 0; i < 10; i ++) {
    const { href, title } = chapters[i];
    if (title === 'Research References') {
      continue;
    }
    const chapterTab = await browser.newPage();
    await chapterTab.goto(href, { waitUntil: 'networkidle2' });
    console.log('Saving', title);
    sleep(2);
    await save(chapterTab, title);
    chapterTab.close();
  }
}

async function run() {
  const { browser, page } = await start();
  console.log('launching');
  await page.emulate(iPad);
  await page.goto(ENTRY, { waitUntil: 'networkidle2' });

  console.log('authorizing');
  await auth(page);  

  console.log('going to TOC');
  await page.goto(TOC, { waitUntil: 'networkidle2' });
  await sleep(2);

  console.log('expanding page');
  await expand(page);
  await sleep(5);

  console.log('downloading links');
  await download(browser, page);

  await browser.close();
}

run();
