'use strict';

const gulp = require('gulp');
const cp = require('child_process');
const babel = require('gulp-babel');
const less = require('gulp-less');
const cleanCss = require('gulp-clean-css');
const minifyJs = require('gulp-minify');
const sequence = require('gulp-sequence');

const jsSrcGlob = './scripts/*.js';
const cssGlob = './stylesheets/*.less';

gulp.task('default', sequence('build', 'start-server', 'watch'));

gulp.task('watch', () => {
  gulp.watch(jsSrcGlob, ['build-js']);
  gulp.watch(cssGlob, ['build-css']);
});

gulp.task('start-server', () => {
  cp.spawn('npm', ['start'], {
    stdio: 'inherit'
  });
});

gulp.task('build', ['build-js', 'build-css']);

gulp.task('build-js', () =>
  gulp.src(jsSrcGlob)
    .pipe(babel())
    .pipe(minifyJs())
    .pipe(gulp.dest('./dist/scripts/'))
);

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
