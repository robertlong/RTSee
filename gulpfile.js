var gulp = require('gulp'),
  connect = require('gulp-connect'),
  browserify = require('gulp-browserify'),
  rename = require('gulp-rename'),
  mochaSelenium = require('gulp-mocha-selenium');;

gulp.task('connect', function() {
  connect.server({
    root: 'example',
    livereload: true
  });
});

gulp.task('html', function () {
  gulp.src('./example/*.html')
    .pipe(connect.reload());
});

gulp.task('js', function () {
  gulp.src('index.js')
    .pipe(browserify())
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('./example/js'))
    .pipe(connect.reload());
});

gulp.task('functional-tests', function () {
  return gulp.src('test/functional/**/*-test.js', {read: false})
    .pipe(mochaSelenium({
      browserName: 'chrome',
      reporter: 'nyan'
    }));
});

gulp.task('watch', function () {
  gulp.watch(['./app/*.html'], ['html']);
  gulp.watch(['./src/*.js', 'index.js'], ['js']);
});

gulp.task('default', ['connect', 'watch', 'js']);
gulp.task('test', ['connect', 'html', 'js', 'functional-tests']);