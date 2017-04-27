'use strict';

const fs = require('fs');
const path = require('path');
const escape = require('pg-escape');
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
  password: process.env.PGPASSWORD || pgPass,
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
    escape.string(username),
    escape.string(email),
    passwordHash
  ]).catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

function insertChallenge(title, desc, userId) {
  return pgPool.query('insert into challenges values($1, $2, $3)', [
    escape.string(title),
    escape.string(desc),
    escape.string(userId)
  ]).catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

function latestChallenges() {
  return pgPool.query('select * from challenges order by creation desc limit 5')
  .catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

function getUser(email) {
  return pgPool.query('select * from users where users.email = $1', [
    escape.string(email)
  ]).catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

function getUsersById(ids) {
  return pgPool.query('select * from users where users.id = any(array[$1])', [
    ids.map(id => escape.string(id)).join(',')
  ]).catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

module.exports = {
  hasDBAvailable,
  pgSession,
  insertUser,
  insertChallenge,
  latestChallenges,
  getUser,
  getUsersById
};
