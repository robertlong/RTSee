var gulp = require('gulp'),
  connect = require('gulp-connect'),
  browserify = require('gulp-browserify')
  rename = require('gulp-rename');

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

gulp.task('watch', function () {
  gulp.watch(['./app/*.html'], ['html']);
  gulp.watch(['./src/*.js', 'index.js'], ['js']);
});

gulp.task('default', ['connect', 'watch', 'js']);