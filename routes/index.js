'use strict';

const express = require('express');
const router = express.Router();
const render = require('../render');
const queries = require('../database/queries');
const auth = require('../auth');
const stream = require('stream');
const limitStream = require('size-limit-stream');
const path = require('path');
const fs = require('fs');
const BusBoy = require('busboy');
const crypto = require('crypto');
const uuid = require('uuid/v4');

router.get('/', (req, res, next) => {
  render.sendPage(req, res, 'index', req.locale);
});

router.get('/login', (req, res, next) => {
  if (req.user) res.redirect('/account');
  else render.sendPage(req, res, 'login', req.locale);
});

router.get('/account', (req, res, next) => {
  if (!req.user) res.redirect('/login');
  else render.sendPage(req, res, 'account', req.locale);
});

router.get('/challenge', (req, res, next) => {
  if (!req.user) res.redirect('/login');
  else render.sendPage(req, res, 'challenge', req.locale);
});

router.get('/response', (req, res, next) => {
  if (!req.user) res.redirect('/login');
  else render.sendPage(req, res, 'response', req.locale);
});

router.get('/user/:name', (req, res, next) => {
  req.username = decodeURIComponent(req.params.name);
  render.sendPage(req, res, 'user', req.locale);
});

router.post('/login', auth.authenticateUser);

router.post('/register', (req, res, next) => {
  if (req.body.username === undefined) return res.status(400).json({err: 'no user'});
  if (req.body.username.length < 4) return res.status(400).json({err: 'short user'});
  if (req.body.username.length > 15) return res.status(400).json({err: 'long user'});
  if (req.body.password === undefined) return res.status(400).json({err: 'no pass'});
  if (req.body.password.length < 5) return res.status(400).json({err: 'short pass'});
  if (req.body.password.length > 500) return res.status(400).json({err: 'long pass'});
  if (req.body.email === undefined) return res.status(400).json({err: 'no email'});
  if (!/\S+@\S+\.\S+/.test(req.body.email)) return res.status(400).json({err: 'not an email'});
  auth.registerUser(req, res);
});

router.post('/create/challenge', (req, res, next) => {
  if (!req.user) return res.status(401).json({err: 'not authorized'});
  if (req.body.title === undefined) return res.status(400).json({err: 'no title'});
  if (req.body.title.length > 40) return res.status(400).json({err: 'long title'});
  if (req.body.desc === undefined) return res.status(400).json({err: 'no desc'});
  if (req.body.desc.length > 250) return res.status(400).json({err: 'long desc'});
  queries.insertChallenge(req.body.title, req.body.desc, req.user.id)
  .then(insertResult => {
    logger.debug('Inserted challenge', insertResult);
    res.status(200).json({});
  }, err => {
    logger.error('Can\'t insert challenge', err);
    res.status(500).json({err: 'internal error'});
  });
});

function pipeToLimitedWriteStream(res, fileObj, pathToWrite, limitBytes) {
  const limit = limitStream(limitBytes); // max 20MiB
  const write = fs.createWriteStream(pathToWrite, {
    flags: 'w',
    defaultEncoding: 'binary'
  });
  try {
    limit.on('error', err => {
      if (err.message === 'Limit exceeded') {
        logger.info('Attemptted large upload');
        res.status(400).json({err: 'large file'});
        return;
      }
      throw err;
    });
  } catch (err) {
    throw err; // Pass to handler outside
  }
  fileObj.pipe(limit).pipe(write);
}

router.post('/create/response', (req, res, next) => {
  if (!req.user) return res.status(401).json({err: 'not authorized'});
  const video = {
    id: uuid()
  };
  const busboy = new BusBoy({headers: req.headers});
  busboy.on('field', (fieldname, val) => {
    if ((fieldname !== 'title' && fieldname !== 'target') || !val) {
      res.status(400).json({err: 'missing field'});
      return;
    }
    if (fieldname === 'title' && val.length > 15) {
      res.status(400).json({err: 'long title'});
      return;
    }
    video[fieldname] = val;
  });
  busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    if (fieldname !== 'video' || !mimetype.startsWith('video')) {
      res.status(400).json({err: 'no video'});
      return;
    }
    // max 20MiB
    pipeToLimitedWriteStream(res, file, path.resolve(`data/videos/${video.id}`), 1024 * 1024 * 20);
  });
  busboy.on('finish', async () => {
    if (res.headersSent) return;
    const challengeid = (await queries.getChallengeByTitle(video.target)).rows[0].id;
    await queries.insertVideo(video.id, video.title, challengeid, req.user.id);
    logger.debug('Successful video insertion');
    res.status(200).json({});
  });
  busboy.on('error', err => {
    logger.error(err);
    if (res.headersSent) return;
    res.status(500).json({err: 'internal error'});
  });
  req.pipe(busboy);
});

router.put('/update/avatar', (req, res, next) => {
  if (!req.user) return res.status(401).json({err: 'not logged in'});
  const avatar = {
    id: uuid()
  };
  const busboy = new BusBoy({headers: req.headers});
  busboy.on('field', (fieldname, val) => {
    if (fieldname !== 'username' || !val) {
      res.status(400).json({err: 'missing field'});
      return;
    }
    if (val !== req.user.name) return res.status(401).json({err: 'not authorized'});
    avatar.username = val;
  });
  busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    if (fieldname !== 'avatar' || !mimetype.startsWith('image')) {
      res.status(400).json({err: 'no image'});
      return;
    }
    // max 1MiB
    pipeToLimitedWriteStream(res, file, path.resolve(`data/avatars/${avatar.id}`), 1024 * 1024 * 1);
  });
  busboy.on('finish', async () => {
    if (res.headersSent) return;
    await queries.updateAvatar(avatar.username, avatar.id);
    logger.debug('Successful avatar update');
    res.status(200).json({});
  });
  busboy.on('error', err => {
    logger.error(err);
    if (res.headersSent) return;
    res.status(500).json({err: 'internal error'});
  });
  req.pipe(busboy);
});

router.put('/update/username/:oldusername/:newusername', async (req, res, next) => {
  if (!req.user) return res.status(401).json({err: 'not logged in'});
  const oldUsername = decodeURIComponent(req.params.oldusername);
  if (req.user.name !== oldUsername) return res.status(401).json({err: 'not authorized'});
  try {
    await queries.updateUsername(oldUsername, decodeURIComponent(req.params.newusername));
    logger.debug('Successful username update');
    res.status(200).json({});
  } catch (err) {
    logger.error(err);
    res.status(500).json({err: 'internal error'});
  }
});

router.put('/update/language/:username/:lang', async (req, res, next) => {
  if (!req.user) return res.status(401).json({err: 'not logged in'});
  const username = decodeURIComponent(req.params.username);
  if (req.user.name !== username) return res.status(401).json({err: 'not authorized'});
  const lang = decodeURIComponent(req.params.lang);
  if (!Object.keys(render.languages).includes(lang)) return res.statuss(400).json({err: 'bad lang'});
  try {
    await queries.updateLocale(username, lang);
  } catch (err) {
    logger.error(err);
    return res.status(500).json({err: 'internal error'});
  }
  req.user.language = lang;
  req.login(req.user, err => {
    if (err) {
      logger.error('Re-login error', err);
      return next(err);
    }
    logger.debug('Re-login success', req.user.name);
    logger.debug('Successful lang update');
    res.status(200).json({});
  });
});

router.delete('/logout/:username', async (req, res, next) => {
  if (!req.user) return res.status(401).json({err: 'not logged in'});
  const username = decodeURIComponent(req.params.username);
  if (req.user.name !== username) return res.status(401).json({err: 'not authorized'});
  req.session.destroy(err => {
    if (err) {
      logger.error(err);
      return res.status(500).json({err: 'internal error'});
    }
    res.status(200).json({});
  });
});

router.use('/content', require('./content'));

module.exports = router;
