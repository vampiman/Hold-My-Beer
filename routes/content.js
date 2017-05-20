'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const queries = require('../database/queries');
const render = require('../render');
const bluebird = require('bluebird');
const fs = bluebird.promisifyAll(require('fs'));
const thumbnailer = require('video-thumb');

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
    const rendered = render.renderChallenges(challenges, userMap, req.locale);
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
  res.status(501).json({err: 'noimpl'});
});

router.get('/avatar/:username', (req, res, next) => {
  // FIXME return avatar for given user
  res.status(501).json({err: 'noimpl'});
});

router.get('/thumbnail/:videoid', async (req, res, next) => {
  const thumbPath = path.resolve(`${__dirname}/../data/videos/${req.params.videoid}.thumb.png`);
  try {
    await fs.accessAsync(thumbPath, fs.constants.R_OK | fs.constants.F_OK);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error(err);
      res.status(500).json({err: 'internal error'});
      return;
    }
    await bluebird.promisify(thumbnailer.extract)(
      `${__dirname}/../data/videos/${req.params.videoid}`,
      thumbPath,
      '00:00:00',
      '256x256'
    );
  }
  res.sendFile(thumbPath);
});

module.exports = router;
