'use strict';

const express = require('express');
const router = express.Router();
const queries = require('../database/queries');
const render = require('../render');

router.get('/homepage', async (req, res, next) => {
  try {
    const time = decodeURIComponent(req.query.time);
    const challengeQuery = await queries.latestChallenges(time, req.query.offset);
    const challenges = challengeQuery.rows;
    if (challenges.length === 0) {
      logger.info('No challenges match query');
      return res.status(204).json({err: 'no content'});
    }
    const authorIds = challenges.map(challenge => challenge.authorid);
    const usersQuery = await queries.getUsersById(authorIds);
    const userMap = {};
    usersQuery.rows.map(row => userMap[row.id] = row);
    const rendered = render.renderChallenges(challenges, userMap, 'en');
    res.status(200).json({rendered});
  } catch (err) {
    if (err.kind === 'pg-query') {
      logger.error('Can\'t get challenge data', err);
      return res.status(500).json({err: 'no data'});
    }
    logger.error('Unknown error', err);
    return res.status(500).json({err: 'internal error'});
  }
});

router.get('/user/:name', (req, res, next) => {
  // FIXME return rendered content for given user
  // req.params.name
  render.sendError(res, 'notFound', 501, 'en');
});

router.get('/avatar/:username', (req, res, next) => {
  // FIXME return avatar for given user
  render.sendError(res, 'notFound', 501, 'en');
});

module.exports = router;
