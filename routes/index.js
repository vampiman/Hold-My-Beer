'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();
const queries = require('../database/queries');
const render = require('../render');
const bcrypt = require('bcryptjs');

router.get('/', (req, res, next) => {
  render.sendPage(res, 'index', 'en');
});

router.get('/login', (req, res, next) => {
  render.sendPage(res, 'login', 'en');
});

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return reject(err);
      resolve(hash);
    });
  });
}

router.post('/register', (req, res, next) => {
  if (req.body.username === undefined) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.username.length < 4) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.username.length > 15) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.password === undefined) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.password.length < 5) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.password.length > 500) return render.sendError(res, 'serverValidation', 400, 'en');
  if (req.body.email === undefined) return render.sendError(res, 'serverValidation', 400, 'en');
  if (!/\S+@\S+\.\S+/.test(req.body.email)) return render.sendError(res, 'serverValidation', 400, 'en');
  hashPassword(req.body.password)
    .catch(err => {
      logger.error('Cannot hash password', req.body.password, err);
      throw err;
    })
    .then(hash => queries.insertUser(req.body.username, req.body.email, hash))
    .catch(err => {
      logger.error('Cannot insert user', req.body.username, err);
      throw err;
    })
    .then(insertResult => {
      logger.info('Successsful registration', req.body.username, req.body.email);
      res.redirect('/');
    }, err => {
      render.sendError(res, 'serverValidation', 400, 'en');
    });
});

module.exports = router;
