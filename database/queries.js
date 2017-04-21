'use strict';

const fs = require('fs');
const escape = require('pg-escape');

const hasDBAvailable = Boolean(process.env.DB);

if (!hasDBAvailable) {
  module.exports = {};
  return;
}

const pgConfig = {
  host: 'localhost',
  user: process.env.PGUSER || 'hmbserver',
  password: process.env.PGPASSWORD || fs.readFileSync('db-password', {encoding: 'utf8'}),
  database: process.env.PGDATABASE || 'hmb'
};

const Pool = require('pg').Pool;
const pgPool = new Pool(pgConfig);
pgPool.on('error', (err, client) => {
  logger.error('Idle psql client error', {
    errorMsg: err.message,
    errorStack: err.stack,
    client
  });
});

function insertUser(username, email, passwordHash) {
  return pgPool.query('insert into users values($1, $2, \'\', $3)', [
    escape.string(username),
    escape.string(email),
    passwordHash
  ]);
}

module.exports = {
  hasDBAvailable,
  pgPool,
  insertUser
};
