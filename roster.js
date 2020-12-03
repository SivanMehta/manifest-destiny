const puppeteer = require('puppeteer');
const iPad = puppeteer.devices['iPad'];
const config = require('./config');

const cmu = 'https://athletics.cmu.edu';
const ROSTER = cmu + '/sports/mswimdive/2016-17/roster';
const selector = 'tr > th a';

async function save(page, ext) {
  const uri = cmu + ext;
  await page.goto(uri, { waitUntil: 'networkidle2' });
  await page.emulate(iPad);
  await page.pdf(config.pdf(encodeURIComponent(ext)));
  console.log('Saved', uri);
}

async function run() {
  const { browser, page } = await config.start();
  await page.goto(ROSTER, { waitUntil: 'networkidle2' });
  const links = await page.$$eval(selector, el => el.map(x => x.getAttribute("href")));
  for(let i = 0; i < links.length; i ++) {
    await save(page, links[i]);
  }
  await browser.close();
}

run();
