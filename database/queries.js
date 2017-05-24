'use strict';

const fs = require('fs');
const path = require('path');
const escape = require('sql-escape');
const PGSession = require('connect-pg-simple')(require('express-session'));
const pg = require('pg');

const hasDBAvailable = Boolean(process.env.DB);

if (!hasDBAvailable) {
  module.exports = {};
  return;
}

const pgPass = fs.readFileSync(path.join(__dirname, 'password'), {encoding: 'utf8'});
const pgConfig = {
  host: 'localhost',
  user: process.env.PGUSER || 'hmbserver',
  password: process.env.PGPASSWORD || pgPass || '',
  database: process.env.PGDATABASE || 'hmb'
};

const pgPool = new pg.Pool(pgConfig);
pgPool.on('error', (err, client) => {
  logger.error('Idle psql client error', {
    errorMsg: err.message,
    errorStack: err.stack,
    client
  });
});

const pgSession = new PGSession({
  pg,
  conString: pgConfig,
  tableName: 'user_sessions'
});

function insertUser(username, email, passwordHash) {
  return pgPool.query('insert into users values($1, $2, $3)', [
    escape(username),
    escape(email),
    passwordHash
  ]);
}

function insertChallenge(title, desc, userId) {
  return pgPool.query('insert into challenges values($1, $2, $3)', [
    escape(title),
    escape(desc),
    userId
  ]);
}

function insertVideo(uuid, title, challengeId, authorId) {
  return pgPool.query('insert into videos values($1, $2, $3, $4)', [
    uuid,
    escape(title),
    challengeId,
    authorId
  ]);
}

function updateAvatar(username, avatarUuid) {
  return pgPool.query('update users set avatar = $1 where users.name = $2', [
    avatarUuid,
    escape(username)
  ]);
}

function updateUsername(oldUsername, newUsername) {
  return pgPool.query('update users set name = $1 where users.name = $2', [
    escape(newUsername),
    escape(oldUsername)
  ]);
}

function updateLocale(username, locale) {
  return pgPool.query('update users set language = $1 where users.name = $2', [
    escape(locale),
    escape(username)
  ]);
}

function latestChallenges(fromTime, offset) {
  return pgPool.query(`
  select challenges.*, users.name as username
    from challenges inner join users
    on challenges.authorid = users.id
    where challenges.creation < $1
    order by challenges.creation desc
    limit 5
    offset $2;
  `, [
    escape(fromTime),
    escape(offset)
  ]);
}

function videosForChallenge(challengeId, time, offset) {
  return pgPool.query(`
  select videos.*, users.name as username
    from videos inner join users
    on videos.authorid = users.id
    where
      videos.challengeid = $1
      and videos.creation < $2
    order by videos.creation desc
    limit 5
    offset $3;
  `, [
    challengeId,
    escape(time),
    escape(offset)
  ]);
}

function challengesForUser(userId, fromTime, offset) {
  return pgPool.query(`
  select challenges.*, users.name as username
    from challenges inner join users
    on
      challenges.authorid = $1
      and users.id = $1
    where challenges.creation < $2
    order by challenges.creation desc
    limit 5
    offset $3;
  `, [
    userId,
    escape(fromTime),
    escape(offset)
  ]);
}

function videosForUser(userId, fromTime, offset) {
  return pgPool.query(`
  select videos.*, users.name as username
    from videos inner join users
    on
      videos.authorid = $1
      and users.id = $1
    where videos.creation < $2
    order by videos.creation desc
    limit 5
    offset $3;
  `, [
    userId,
    escape(fromTime),
    escape(offset)
  ]);
}

function getChallengeByTitle(title) {
  return pgPool.query('select * from challenges where challenges.title = $1', [
    escape(title)
  ]);
}

function getUserByName(username) {
  return pgPool.query('select * from users where users.name = $1', [
    escape(username)
  ]);
}

function getUser(email) {
  return pgPool.query('select * from users where users.email = $1', [
    escape(email)
  ]);
}

module.exports = {
  hasDBAvailable,
  pgSession,
  insertUser,
  insertChallenge,
  insertVideo,
  updateAvatar,
  updateUsername,
  updateLocale,
  latestChallenges,
  videosForChallenge,
  getChallengeByTitle,
  getUser,
  getUserByName,
  challengesForUser,
  videosForUser
};
