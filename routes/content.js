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
  if (!req.query.time) return res.status(400).json({err: 'no time'});
  if (!req.query.offset) return res.status(400).json({err: 'no offset'});
  try {
    const time = decodeURIComponent(req.query.time);
    const challengeQuery = await queries.latestChallenges(time, req.query.offset);
    if (challengeQuery.rows.length === 0) {
      logger.debug('No challenges match query');
      return res.status(204).json({err: 'no content'});
    }
    const rendered = render.renderChallenges(challengeQuery.rows, req.locale);
    res.status(200).json({rendered});
  } catch (err) {
    logger.error('Failed to get challenge data for homepage', err);
    return res.status(500).json({err: 'internal error'});
  }
});

router.get('/responselist', async (req, res, next) => {
  if (!req.query.time) return res.status(400).json({err: 'no time'});
  if (!req.query.challenge) return res.status(400).json({err: 'no challenge'});
  if (!req.query.offset) return res.status(400).json({err: 'no offset'});
  try {
    const time = decodeURIComponent(req.query.time);
    const challengeQuery = await queries.getChallengeByTitle(
      decodeURIComponent(req.query.challenge)
    );
    const challengeid = challengeQuery.rows[0].id;
    const videoData = await queries.videosForChallenge(challengeid, time, req.query.offset);
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

function userContentCallbackFactory(dataType) {
  if (dataType !== 'videos' && dataType !== 'challenges') throw Error(
    'No such data type'
  );
  const queryFunc = dataType === 'videos' ? queries.videosForUser : queries.challengesForUser;
  const renderFunc = dataType === 'videos' ? render.renderVideos : render.renderChallenges;
  return async (req, res, next) => {
    if (!req.query.time) return res.status(400).json({err: 'no time'});
    if (!req.query.offset) return res.status(400).json({err: 'no offset'});
    try {
      const time = decodeURIComponent(req.query.time);
      const user = (await queries.getUserByName(req.params.name)).rows[0];
      const data = await queryFunc(user.id, time, req.query.offset);
      if (data.rows.length === 0) {
        logger.debug(`No ${dataType} for user`, user.name);
        return res.status(204).json({err: 'no content'});
      }
      const rendered = renderFunc(data.rows, req.locale);
      res.status(200).json({rendered});
    } catch (err) {
      logger.error(err);
      return res.status(500).json({err: 'internal error'});
    }
  };
}

router.get('/user/:name/videos', userContentCallbackFactory('videos'));
router.get('/user/:name/challenges', userContentCallbackFactory('challenges'));

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
  res.set('Cache-Control', `public, max-age=${31536000}`); // Cache for 1 year
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
      'Content-Length': end - start + 1,
      'Cache-Control': `public, max-age=${31536000}`, // Cache for 1 year
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
