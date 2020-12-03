const puppeteer = require('puppeteer');

function pdf(name) {
  return {
    path: `./pdfs/${name}.pdf`,
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

async function start() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  return { browser, page };
}

module.exports = {
  start, pdf
};
