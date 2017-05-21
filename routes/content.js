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
      logger.debug('No challenges match query');
      return res.status(204).json({err: 'no content'});
    }
    const queryList = await Promise.all(
      challenges.map(challenge => queries.videosForChallenge(challenge.id, '0'))
    );
    queryList.forEach((query, idx) => {
      challenges[idx].videos = query.rows.map(row => {
        return {
          videoId: row.id,
          videoTitle: row.title
        };
      });
    });
    const rendered = render.renderChallenges(challenges, req.locale);
    res.status(200).json({rendered});
  } catch (err) {
    logger.error('Failed to get challenge data for homepage', err);
    return res.status(500).json({err: 'internal error'});
  }
});

router.get('/responselist', async (req, res, next) => {
  try {
    const challengeQuery = await queries.getChallengeByTitle(
      decodeURIComponent(req.query.challenge)
    );
    const challengeid = challengeQuery.rows[0].id;
    const videoData = await queries.videosForChallenge(challengeid, req.query.offset);
    if (videoData.rows.length === 0) {
      logger.debug('No videos match query');
      return res.status(204).json({err: 'no content'});
    }
    const rendered = render.renderVideos(videoData.rows, req.locale);
    res.status(200).json({rendered});
  } catch (err) {
    logger.error('Failed to get video data for challenge', err);
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
  const videosPath = path.resolve(`${__dirname}/../data/videos`);
  const thumbPath = `${videosPath}/${req.params.videoid}.thumb.png`;
  try {
    await fs.accessAsync(thumbPath, fs.constants.R_OK | fs.constants.F_OK);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.error(err);
      res.status(500).json({err: 'internal error'});
      return;
    }
    await bluebird.promisify(thumbnailer.extract)(
      `${videosPath}/${req.params.videoid}`,
      thumbPath,
      '00:00:00',
      '256x256'
    );
  }
  res.sendFile(thumbPath);
});

router.get('/video/:videoid', async (req, res, next) => {
  if (!req.headers.range) return res.status(416).json({err: 'no range'});
  if (!req.headers.range.includes('bytes')) return res.status(416).json({err: 'wrong unit'});
  const videosPath = path.resolve(`${__dirname}/../data/videos`);
  const videoPath = `${videosPath}/${req.params.videoid}`;
  try {
    const stats = await fs.statAsync(videoPath);
    const range = req.headers.range.replace('bytes=', '').split('-');
    const start = parseInt(range[0], 10);
    const end = range[1] ? parseInt(range[1], 10) : stats.size - 1;
    res.status(206).set({
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${stats.size}`,
      'Content-Length': end - start + 1
    });
    const stream = fs.createReadStream(videoPath, {start, end})
      .on('open', () => stream.pipe(res))
      .on('error', err => {
        logger.error(err);
        res.status(500).json({err: 'internal error'});
      });
  } catch (err) {
    if (err.code === 'ENOENT') {
      logger.info('No such video', req.params.videoid);
      return res.status(404).json({err: 'no video'});
    } else {
      logger.error(err);
      return res.status(500).json({err: 'internal error'});
    }
  }
});

module.exports = router;
