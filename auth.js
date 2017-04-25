'use strict';

const queries = require('./database/queries');
const render = require('./render');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return reject(attachKind(err, 'bcrypt'));
      resolve(hash);
    });
  });
}

async function registerUser(req, res) {
  try {
    const hash = await hashPassword(req.body.password);
    const insertResult = await queries.insertUser(req.body.username, req.body.email, hash);
    logger.info('Successsful registration', req.body.username, req.body.email);
    res.redirect('/');
  } catch (e) {
    switch (e.kind) {
      case 'bcrypt': logger.error('Cannot hash password', req.body.password, e); break;
      case 'pg-query': logger.error('Cannot insert user', req.body.username, e); break;
      default: logger.error('Unknown error', e);
    }
    res.status(500).json({err: 'internal error'});
  }
}

function loginUser(req, user) {
  return new Promise((resolve, reject) => {
    req.login(user, err => {
      if (err) return reject(err);
      logger.debug('Login success', user);
      resolve('success');
    });
  });
}

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const query = await queries.getUser(email);
    if (query.rowCount === 0) {
      logger.info('No such email', email);
      return done(null, false, {message: 'no such email'});
    }
    // There can only be one row because emails are unique
    const user = query.rows[0];
    const doesMatch = await bcrypt.compare(password, user.hash);
    if (doesMatch) {
      logger.debug('Passwords match', email);
      done(null, user);
    } else {
      logger.info('Passwords don\'t match');
      done(null, false, {message: 'bad password'});
    }
  } catch (err) {
    if (err.kind === 'pg-query') {
      logger.error('Cannot find user', err);
      done(null, false, {message: 'bad email'});
    } else {
      logger.error('Unknown error', err);
      done(err);
    }
  }
}));

function authenticateUser(req, res, next) {
  return passport.authenticate('local', (err, user, info) => {
    if (err) {
      logger.error('Auth err', err);
      return res.status(500).json({err: 'internal error'});
    }
    if (!user) {
      logger.info('Login attempt failed', user, info.message);
      res.status(401);
      return res.json({err: info.message});
    }
    loginUser(req, user).then(successResponse => {
      res.status(200);
      res.json({});
    }, err => {
      logger.error('Login error', err);
      return next(err);
    });
  })(req, res, next);
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await queries.getUserById(id);
    done(null, user.rows[0]);
  } catch (e) {
    logger.error('Cannot find user id', id, e);
    done(e, null);
  }
});

module.exports = {
  registerUser,
  authenticateUser
};
