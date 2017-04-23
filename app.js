'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');
const render = require('./render');

const app = express();

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
app.use(cookieParser());

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
  
  const errKey = err.status === 404 ? 'notFound' : 'internalServerError';
  render.sendError(res, errKey, err.status || 500, 'en');
});

module.exports = app;
