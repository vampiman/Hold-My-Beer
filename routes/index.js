'use strict';

const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

router.get('/login', (req, res, next) => {
  res.sendFile(path.join(__dirname, '../views/log-in.html'));
});

module.exports = router;
