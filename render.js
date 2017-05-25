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

function sendPage(req, res, viewName, langName) {
  const text = languages[langName];
  text.userLanguage = langName;
  text.clientJSON = JSON.stringify(text.clientText);
  if (req.user) {
    text.usernameData = text.profileText = req.user.name;
    text.profileUrl = '/account';
    text.isLoggedIn = true;
    text.accountCreationLocalDate = new Date(req.user.creation).toLocaleString(req.rawLocale);
  } else {
    text.profileText = text.loginOrRegister;
    text.profileUrl = '/login';
    text.isLoggedIn = false;
  }
  if (req.username) text.usernameData = req.username;
  const renderedPage = Mustache.render(views[viewName], text, components);
  res.set({
    'Content-Language': langName,
    'Cache-Control': `public, max-age=${60 * 60 * 24 * 30}`, // Cache for 30 days
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
    'Cache-Control': `max-age=${60 * 60 * 24 * 120}`, // Cache for 120 days
    'Content-Type': 'text/html'
  });
  res.status(errorStatus);
  res.send(renderedError);
}

function renderChallenges(challengeList, langName) {
  return challengeList.reduce((accum, challengeObj) =>
  accum + Mustache.render(components.challengeComponent, Object.assign(languages[langName], {
    challengeTitle: challengeObj.title,
    challengeTitleEncoded: encodeURIComponent(challengeObj.title),
    challengeDesc: challengeObj.description,
    challengeAuthorName: challengeObj.username
  })), '');
}

function renderVideos(videoList, langName) {
  return videoList.reduce((accum, videoObj) =>
  accum + Mustache.render(components.responselinkComponent, Object.assign(languages[langName], {
    videoId: videoObj.id,
    videoTitle: videoObj.title
  })), '');
}

module.exports = {
  components,
  views,
  languages,
  sendPage,
  sendError,
  renderChallenges,
  renderVideos
};
