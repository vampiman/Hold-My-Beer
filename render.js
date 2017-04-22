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
    'Cache-Control': `max-age=${60 * 2}`,
    'Content-Type': 'text/html'
  });
  res.send(renderedPage);
}

function sendError(res, errorKey, errorStatus, langName) {
  const renderedError = Mustache.render(views.error, Object.assign(languages[langName], {
    errorMessage: languages[langName].errorTexts[errorKey]
  }), components);
  res.set({
    'Content-Language': langName,
    'Cache-Control': `max-age=${60 * 60 * 24 * 7}`, // These should not change very often
    'Content-Type': 'text/html'
  });
  res.status(errorStatus);
  res.send(renderedError);
}

module.exports = {
  components,
  views,
  languages,
  sendPage,
  sendError
};
