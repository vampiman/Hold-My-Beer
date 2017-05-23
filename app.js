'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const session = require('express-session');
const locale = require('express-locale');
const passport = require('passport');
const queries = require('./database/queries');
const fs = require('fs');
const render = require('./render');

const app = express();

let secret;

try {
  secret = fs.readFileSync(path.join(__dirname, 'database', 'secret'), {encoding: 'utf8'});
} catch (err) {
  secret = 'iamsecret';
}

app.use(compression({
  threshold: 0
}));

app.set('views', path.join(__dirname, 'views'));

app.use(favicon(path.join(__dirname, 'images', 'logo.png')));

app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(__dirname, 'logs', 'morgan.log'), {flags: 'a'})
}));
if (app.get('env') === 'development') app.use(morgan('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(secret));

if (queries.hasDBAvailable) {
  app.use(session({
    secret,
    store: queries.pgSession,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: true,
      secure: false, // FIXME set to true after adding https
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());
}

app.use(locale({
  // FIXME set 'locale' cookie if user decides to change language
  priority: ['cookie', 'accept-language', 'default'],
  'default': 'en_GB'
}));

// Do some locale normalization
app.use((req, res, next) => {
  req.rawLocale = req.locale;
  switch (req.locale) {
    case 'ro_RO':
      req.locale = 'ro';
      break;
    case 'fr_FR':
      req.locale = 'fr';
      break;
    case 'en_GB':
    case 'en_US':
    default:
      req.locale = 'en';
  }
  next();
});

// Routes
const index = require('./routes/index');
app.use('/', index);
app.use('/scripts', express.static(path.join(__dirname, 'dist', 'scripts'), {
  maxage: '14 days'
}));
app.use('/stylesheets', express.static(path.join(__dirname, 'dist', 'stylesheets'), {
  maxage: '14 days'
}));
app.use('/images', express.static(path.join(__dirname, 'images'), {
  maxage: '28 days'
}));
app.use('/fonts', express.static(path.join(__dirname, 'dist', 'fonts'), {
  maxage: '4 months'
}));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err);
  
  const errKey = err.status === 404 ? 'notFound' : 'internalServerError';
  render.sendError(res, errKey, err.status || 500, req.locale);
});

module.exports = app;
