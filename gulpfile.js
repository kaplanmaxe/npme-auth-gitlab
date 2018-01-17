const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('transpile-module', () => {
  return gulp.src(['./lib/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('babel', () => {
  return gulp.watch(['./lib/**/*.js'], ['transpile-module']);
});

gulp.task('default', [
  'transpile-module',
  'babel'
]);