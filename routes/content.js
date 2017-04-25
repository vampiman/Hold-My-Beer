'use strict';

const express = require('express');
const router = express.Router();
const render = require('../render');

router.get('/homepage', (req, res, next) => {
  // FIXME return rendered homepage content
  render.sendError(res, 'notFound', 501, 'en');
});

router.get('/user/:name', (req, res, next) => {
  // FIXME return rendered content for given user
  // req.params.name
  render.sendError(res, 'notFound', 501, 'en');
});

module.exports = router;
