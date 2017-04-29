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
  ]).catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

function insertChallenge(title, desc, userId) {
  return pgPool.query('insert into challenges values($1, $2, $3)', [
    escape(title),
    escape(desc),
    userId
  ]).catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

function latestChallenges(fromTime, offset) {
  return pgPool.query('select * from challenges where creation < $1 order by creation desc limit 5 offset $2', [
    escape(fromTime),
    escape(offset)
  ]).catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

function getUser(email) {
  return pgPool.query('select * from users where users.email = $1', [
    escape(email)
  ]).catch(err => {
    throw attachKind(err, 'pg-query');
  });
}

function getUsersById(ids) {
  return pgPool.query('select * from users where users.id = any($1::int[])', [
    ids.map(id => Number(id))
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
