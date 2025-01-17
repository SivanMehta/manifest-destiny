const puppeteer = require('puppeteer');
const fs = require('fs');
const write = require('util').promisify(fs.writeFile);
const iPad = puppeteer.devices['iPad'];
const creds = require('./creds.json');

/**
 * Pause main thread for a fiven number of seconds
 *
 * @param {Number} seconds
 * @returns {Promise} to resolve after given number of seconds
 */
function sleep(seconds) {
  return new Promise(r => setTimeout(r, 1000 * seconds));
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

  console.log('starting session');
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
  let seen = expansions.length;

  // expand every chapter subheading
  while(expansions.length > 1) {
    console.log('Expanding', seen, 'of 3580 sections');
    await page.$$eval('a.co_genericExpand', links => links.forEach(link => link.click()));

    expansions = await getExpansions(page);
    seen += expansions.length;
  }
}

async function download(chapter, page) {
  const { href, title } = chapter;
  if (/Research References/.test(title)) {
    return;
  }

  await page.goto(href, { waitUntil: 'networkidle2' });

  const pw = await page.$$('#Password');
  if(pw.length > 1) {
    await auth(page);
  }

  const filename = title.replace('§ ', '');
  console.log('Saving', filename);
  await page.pdf(pdf(filename));
}

async function writeAsText(chapter, page) {
  const { href, title } = chapter;
  if (/Research References/.test(title)) {
    return;
  }

  await page.goto(href, { waitUntil: 'networkidle2' });
  const pw = await page.$$('#Password');
  if(pw.length > 1) {
    await auth(page);
  }

  const text = await page.$$eval('div.co_paragraph', ps => ps.map(p => p.innerText).join('\n\n'))
  const filename = 'texts/' + title.replace('§ ', '').replace('/', '-').replace('/', '-') + '.txt';
  console.log('Saving', filename);
  await write(filename, text);
}

async function queueDownloads(browser, page) {
  const chapters = require('./chapters.json');
  
  // + 40
  for (let i = 2600; i < chapters.length; i ++) {
    await writeAsText(chapters[i], page);
  }
}

async function run() {
  const { browser, page } = await start();
  console.log('launching');
  await page.emulate(iPad);
  await page.goto(ENTRY, { waitUntil: 'networkidle2' });

  console.log('authorizing');
  await auth(page);  

  // console.log('going to TOC');
  // await page.goto(TOC, { waitUntil: 'networkidle2' });
  // await sleep(2);

  // console.log('expanding TOC');
  // await expand(page);
  // await sleep(5);

  console.log('downloading links');
  await queueDownloads(browser, page);

  await browser.close();
}

run();
