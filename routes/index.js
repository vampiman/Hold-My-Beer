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
  render.sendPage(req, res, 'login', 'en');
});

router.get('/account', (req, res, next) => {
  // FIXME add account page
  render.sendError(res, 'notFound', 501, 'en');
});

router.post('/login', auth.authenticateUser);

router.post('/register', (req, res, next) => {
  if (req.body.username === undefined) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.username.length < 4) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.username.length > 15) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.password === undefined) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.password.length < 5) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.password.length > 500) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.email === undefined) return render.sendError(res, 'serverValidation', 400, 'en');
  if (!/\S+@\S+\.\S+/.test(req.body.email)) return render.sendError(res, 'serverValidation', 400, 'en');
  auth.registerUser(req, res);
});

module.exports = router;
