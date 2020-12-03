const puppeteer = require('puppeteer');
const iPad = puppeteer.devices['iPad'];

function config(name) {
  return {
    path: `${name}.pdf`,
    format: 'A4',
    printBackground: true,
    margin: { // Word's default A4 margins
      top: '2.54cm',
      bottom: '2.54cm',
      left: '2.54cm',
      right: '2.54cm'
    }
  };
}

async function run(uri) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(uri, { waitUntil: 'networkidle2' });
  await page.emulate(iPad);
  await page.pdf(config('example'));
  await browser.close();
}

const uri = 'https://athletics.cmu.edu/sports/mswimdive/2016-17/bios/ferzacca_dustin_swih?view=bio';
run(uri);
