'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();
const render = require('../render');
const auth = require('../auth');

router.get('/', (req, res, next) => {
  render.sendPage(req, res, 'index', 'en');
});

router.get('/login', (req, res, next) => {
  if (req.user) res.redirect('/account');
  else render.sendPage(req, res, 'login', 'en');
});

router.get('/account', (req, res, next) => {
  // FIXME add account page
  render.sendError(res, 'notFound', 501, 'en');
});

router.post('/login', auth.authenticateUser);

router.post('/register', (req, res, next) => {
  if (req.body.username === undefined) return res.status(400).json({login: 'no user'});
  if (req.body.username.length < 4) return res.status(400).json({login: 'short user'});
  if (req.body.username.length > 15) return res.status(400).json({login: 'long user'});
  if (req.body.password === undefined) return res.status(400).json({login: 'no pass'});
  if (req.body.password.length < 5) return res.status(400).json({login: 'short pass'});
  if (req.body.password.length > 500) return res.status(400).json({login: 'long pass'});
  if (req.body.email === undefined) return res.status(400).json({login: 'no email'});
  if (!/\S+@\S+\.\S+/.test(req.body.email)) return res.status(400).json({login: 'not an email'});
  auth.registerUser(req, res);
});

module.exports = router;
