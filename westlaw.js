const puppeteer = require('puppeteer');
const iPad = puppeteer.devices['iPad'];
const creds = require('./creds.json');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function start() {
  let browser;
  browser = await puppeteer.launch({ headless: false });
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
  await sleep(5000);

  await page.click('#co_clientIDContinueButton');
  await sleep(3000);
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

async function spider(page) {
  let expansions = await getExpansions(page);

  // expand every chapter subheading
  while(expansions.length > 1) {
    for(let i = 0; i < expansions.length; i ++) {
      await expansions[i].click();
      await sleep(200);
    }

    expansions = await getExpansions(page);
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
  await sleep(5000);

  console.log('spidering page');
  await spider(page);

  await browser.close();
}

run();
