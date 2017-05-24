'use strict';

const queries = require('./database/queries');
const render = require('./render');
const bluebird = require('bluebird');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

async function registerUser(req, res) {
  try {
    const hash = await bluebird.promisify(bcrypt.hash)(req.body.password, 10);
    logger.debug('Successsful password hash', hash);
    const insertResult = await queries.insertUser(req.body.username, req.body.email, hash);
    logger.info('Successsful registration', req.body.username, req.body.email);
    req.login({email: req.body.email}, err => {
      if (err) {
        logger.error('Could not auth registered user', err);
        return res.status(200).json({}); // Sweep it under the rug
      }
      res.status(200).json({});
    });
  } catch (err) {
    if (err.message.includes('duplicate key value violates unique constraint "users_email_key')) {
      logger.info('Duplicate email registration attempt');
      return res.status(500).json({err: 'duplicate email'});
    } else if (err.message.includes('duplicate key value violates unique constraint "users_name_key')) {
      logger.info('Duplicate name registration attempt');
      return res.status(500).json({err: 'duplicate name'});
    }
    logger.error('Registration error', err);
    res.status(500).json({err: 'internal error'});
  }
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
    logger.error('Unknown error', err);
    done(err);
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
      return res.status(401).json({err: info.message});
    }
    req.login(user, err => {
      if (err) {
        logger.error('Login error', err);
        return next(err);
      }
      logger.debug('Login success', user);
      res.status(200).json({});
    });
  })(req, res, next);
}

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser(async (email, done) => {
  try {
    const user = await queries.getUser(email);
    done(null, user.rows[0]);
  } catch (e) {
    logger.error('Cannot find user email', email, e);
    done(e, null);
  }
});

module.exports = {
  registerUser,
  authenticateUser
};
