const fs = require('fs');
const read = require('util').promisify(fs.readdir);

(async function () {
  const files = await read('texts/');
  const pretty = files
    .filter(f => !/\.gitkeep/.test(f))
    .map(f => ({
      title: f,
      href: f
    }))
    .map(f => ({
      title: f.title,
      href: f.href.replace(/ /gi, '+')
    }))
    .map(f => ({
      title: f.title,
      href: f.href.replace(/:/gi, '%3A')
    }))
    .map(f => `<a href='texts/${f.href}'>${f.title}</a>`)
    .join('<br />');

  console.log(pretty);
})()
