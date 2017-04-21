'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();
const queries = require('../database/queries.js');
const bcrypt = require('bcryptjs');

router.get('/', (req, res, next) => {
  res.app.locals.renderPage(res, 'index');
});

router.get('/login', (req, res, next) => {
  res.app.locals.renderPage(res, 'login');
});

function sendData(res, err, redirect) {
  res.set('Content-Type', 'application/json');
  res.status(err === null ? 200 : 400);
  res.send({err, redirect});
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return reject(err);
      resolve(hash);
    });
  });
}

router.post('/register', (req, res, next) => {
  if (req.body.username === undefined) return sendData(res, 'missing username', '/register');
  if (req.body.username.length < 4) return sendData(res, 'username too short', '/register');
  if (req.body.username.length > 15) return sendData(res, 'username too long', '/register');
  if (req.body.password === undefined) return sendData(res, 'missing password', '/register');
  if (req.body.password.length < 5) return sendData(res, 'password too short', '/register');
  if (req.body.password.length > 500) return sendData(res, 'password too long', '/register');
  if (req.body.email === undefined) return sendData(res, 'missing email', '/register');
  if (!/\S+@\S+\.\S+/.test(req.body.email)) return sendData(res, 'invalid email', '/register');
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
      logger.info('Successsful registration', {
        username: req.body.username,
        email: req.body.email
      });
      sendData(res, null, '/');
    }, err => {
      // FIXME send better errors like "email already exists"
      sendData(res, err, '/register');
    });
});

module.exports = router;
