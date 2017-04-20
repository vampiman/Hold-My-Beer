'use strict';

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const fs = require('fs');

const index = require('./routes/index');

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
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// Routes
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/', index);

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

  // render the error page
  res.status(err.status || 500);
  res.sendFile('./views/error.html');
});

module.exports = app;
