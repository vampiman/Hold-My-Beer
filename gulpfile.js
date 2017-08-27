'use strict';

const gulp = require('gulp');
const cp = require('child_process');
const babel = require('gulp-babel');
const less = require('gulp-less');
const cleanCss = require('gulp-clean-css');
const minifyJs = require('gulp-minify');
const sequence = require('gulp-sequence');
const rename = require('gulp-rename');

const jsSrcGlob = './scripts/*.js';
const cssGlob = './stylesheets/*.less';

gulp.task('default', sequence('build', 'start-server', 'watch'));

gulp.task('watch', () => {
  gulp.watch(jsSrcGlob, ['build-js']);
  gulp.watch([cssGlob, './stylesheets/includes/*.less'], ['build-css']);
  gulp.watch(['./components/*', './views/*', './text/*'], ['start-server']);
});

let serverChild = null;
gulp.task('start-server', done => {
  if (serverChild !== null) {
    serverChild.kill();
  }
  serverChild = cp.spawn('node', ['./bin/www'], {
    stdio: 'inherit'
  });
  done();
});

process.on('uncaughtException', err => {
  if (serverChild !== null) serverChild.kill();
});

gulp.task('build', ['build-js', 'build-css', 'copy-deps1', 'copy-deps2', 'copy-fonts']);

gulp.task('build-js', () =>
  gulp.src(jsSrcGlob)
    .pipe(babel())
    .pipe(minifyJs())
    .pipe(rename(path => {
      path.basename = path.basename.split('-min')[0];
    }))
    .pipe(gulp.dest('./dist/scripts/'))
);

gulp.task('copy-deps1', () =>
  gulp.src('node_modules/jquery/dist/jquery.min.js')
    .pipe(gulp.dest('./dist/scripts/'))
);

gulp.task('copy-deps2', () =>
  gulp.src('node_modules/animate.css/animate.min.css')
    .pipe(gulp.dest('./dist/scripts/'))
);

gulp.task('copy-fonts', () => {
  gulp.src('node_modules/material-design-icons/iconfont/*')
    .pipe(gulp.dest('./dist/fonts/'));
});

gulp.task('build-css', () =>
  gulp.src(cssGlob)
    .pipe(less({
      paths: ['./stylesheets/includes/'] // For import directives
    }))
    .pipe(cleanCss({
      compatibility: 'ie11',
    }))
    .pipe(gulp.dest('./dist/stylesheets/'))
);
