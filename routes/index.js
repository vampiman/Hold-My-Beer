'use strict';

const express = require('express');
const router = express.Router();
const render = require('../render');
const queries = require('../database/queries');
const auth = require('../auth');

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
  // FIXME add users page
  render.sendError(res, 'notFound', 501, req.locale);
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

router.post('/create/response', (req, res, next) => {
  if (!req.user) return res.status(401).json({err: 'not authorized'});
  // FIXME creating video responses
  res.status(501).json({err: 'FIXME'});
});

router.use('/content', require('./content'));

module.exports = router;
