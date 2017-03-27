'use strict';

const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.sendFile('./view/index.html');
});

module.exports = router;
