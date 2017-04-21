'use strict';

const fs = require('fs');
const escape = require('pg-escape');

const hasDBAvailable = Boolean(process.env.DB);

if (!hasDBAvailable) {
  return;
}

const pgConfig = {
  host: 'localhost',
  user: process.env.PGUSER || 'hmbserver',
  password: process.env.PGPASSWORD || fs.readFileSync('db-password', {encoding: 'utf8'}),
  database: process.env.PGDATABASE || 'hmb'
};

process.on('unhandledRejection', error => {
  logger.error('Unhandled rejection', {
    errorMsg: error.message,
    errorStack: error.stack
  });
});

const Pool = require('pg').Pool;
const pgPool = new Pool(pgConfig);
pgPool.on('error', (err, client) => {
  logger.error('Idle psql client error', {
    errorMsg: err.message,
    errorStack: err.stack,
    client
  });
});

function query(query, values) {
  return new Promise((resolve, reject) => {
    if (!hasDBAvailable) {
      logger.error('DB unavailable');
      return reject(new Error('DB unavailable'));
    }
    logger.info(query, values);
    resolve();
  }).then(pgPool.query(query, values));
}

function insertUser(username, email, passwordHash) {
  return query('insert into users values($1, $2, \'\', $3)', [
    escape.string(username),
    escape.string(email),
    passwordHash
  ]).catch(err => {
    logger.error('New user insertion error', {
      errorMsg: err.message,
      errorStack: err.stack,
      username
    });
    throw err;
  });
}

module.exports = {
  hasDBAvailable,
  pgPool,
  query,
  insertUser
};
