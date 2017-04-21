'use strict';

const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');

function readTemplate(folderPath, name) {
  return fs.readFileSync(path.join(folderPath, name), {encoding: 'utf8'});
}

function templatesObj(templateFolder, asJson, keyFunc) {
  const obj = {};
  const folderPath = path.join(__dirname, templateFolder);
  fs.readdirSync(folderPath).map(template => {
    const templData = readTemplate(folderPath, template);
    return [keyFunc(template), asJson ? JSON.parse(templData) : templData];
  }).forEach(kvPair => obj[kvPair[0]] = kvPair[1]);
  return obj;
}

const components = templatesObj('components', false, filename => `${filename.split('.')[0]}Component`);
const views = templatesObj('views', false, filename => `${filename.split('.')[0]}`);
const languages = templatesObj('text', true, filename => `${filename.split('.')[0]}`);

function sendPage(res, viewName, langName) {
  const renderedPage = Mustache.render(views[viewName], languages[langName], components);
  res.set({
    'Content-Language': langName,
    'Cache-Control': `max-age=${2 * 60}`,
    'Content-Type': 'text/html'
  });
  res.send(renderedPage);
}

module.exports = {
  components,
  views,
  languages,
  sendPage
};
