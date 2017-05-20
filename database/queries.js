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
  return pgPool.query('insert into users values($1, $2, \'\', $3)', [
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

function latestChallenges(fromTime, offset) {
  return pgPool.query(`
  select challenges.*, users.name as username from challenges inner join users
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

function getChallengeByTitle(title) {
  return pgPool.query('select * from challenges where challenges.title = $1', [
    escape(title)
  ]);
}

function insertVideo(uuid, title, challengeid, authorid) {
  return pgPool.query('insert into videos values($1, $2, $3, $4)', [
    uuid,
    escape(title),
    challengeid,
    authorid
  ]);
}

function getUser(email) {
  return pgPool.query('select * from users where users.email = $1', [
    escape(email)
  ]);
}

// FIXME remove if unused
function getUsersById(ids) {
  return pgPool.query('select * from users where users.id = any($1::int[])', [
    ids.map(id => Number(id))
  ]);
}

module.exports = {
  hasDBAvailable,
  pgSession,
  insertUser,
  insertChallenge,
  latestChallenges,
  getChallengeByTitle,
  insertVideo,
  getUser,
  getUsersById
};
