const puppeteer = require('puppeteer');
const iPad = puppeteer.devices['iPad'];

const cmu = 'https://athletics.cmu.edu';
const ROSTER = cmu + '/sports/mswimdive/2016-17/roster';
const selector = 'tr > th a';

async function start() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  return { browser, page };
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

async function save(page, ext) {
  const uri = cmu + ext;
  await page.goto(uri, { waitUntil: 'networkidle2' });
  await page.emulate(iPad);
  await page.pdf(pdf(encodeURIComponent(ext)));
  console.log('Saved', uri);
}

async function run() {
  const { browser, page } = await start();
  await page.goto(ROSTER, { waitUntil: 'networkidle2' });
  const links = await page.$$eval(selector, el => el.map(x => x.getAttribute("href")));
  for(let i = 0; i < links.length; i ++) {
    await save(page, links[i]);
  }
  await browser.close();
}

run();
