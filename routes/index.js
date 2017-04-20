'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.app.locals.renderPage(res, 'index');
});

router.get('/login', (req, res, next) => {
  res.app.locals.renderPage(res, 'login');
});

module.exports = router;
