var gulp = require('gulp');
var connect = require('gulp-connect');
var fileinclude = require('gulp-file-include');
var sass = require('gulp-sass');
var watch = require('gulp-watch');
var prettify = require('gulp-jsbeautifier');
var useref = require('gulp-useref');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var del = require('del');
var runSequence = require('run-sequence');
var htmlhint = require("gulp-htmlhint");
var rev = require('gulp-rev');
var revReplace = require("gulp-rev-replace");
var merge = require('gulp-merge-json');

gulp.sources = {
  src:  './src',
  dist: './dist'
};

// Start server dev
gulp.task('connect:dev', () => {
  connect.server({
    root: [gulp.sources.src, '.tmp', './'],
    livereload: true,
    port: 9000,
    host: '0.0.0.0',
    fallback: gulp.sources.src + '/index.html'
  });
});

// Start server product
gulp.task('connect:prod', () => {
  connect.server({
    root: [gulp.sources.dist],
    livereload: true,
    port: 9090,
    host: '0.0.0.0',
    fallback: gulp.sources.dist + '/index.html'
  });
});

// Watch
gulp.task('stream', () => {
  gulp.watch(gulp.sources.src + '/views/**/*.html', gulp.series('fileinclude'));
  gulp.watch(gulp.sources.src + '/styles/**/*.scss', gulp.series('sass'));
  watch('**/*.css').pipe(connect.reload());
});

// Remove dist, tmp
gulp.task('clean', () => {
  return del(['.tmp', gulp.sources.dist])
});

// Include HTML
gulp.task('fileinclude', () => {
  return gulp.src([gulp.sources.src + '/views/pages/*.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest(gulp.sources.src))
    .pipe(connect.reload());
});

// Minify CSS, JS
gulp.task('minify', () => {
  return gulp.src(gulp.sources.src + '/*.html')
    .pipe(useref())
    .pipe(gulpif('*.js', uglify()))
    .pipe(gulpif('*.css', minifyCss({
      keepSpecialComments : 0
    })))
    .pipe(gulp.dest(gulp.sources.dist));
});

// Sass

gulp.task('sass', gulp.series('clean', function() {
  return gulp.src(gulp.sources.src + '/styles/**/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(connect.reload());
}));

gulp.task('build-sass', function() {
  return gulp.src(gulp.sources.src + '/styles/**/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(connect.reload());
});

// Minify images
gulp.task('imagemin', () => {
  return gulp.src(gulp.sources.src + '/images/**/*')
    .pipe(imagemin({
      optimizationLevel: 5,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(gulp.sources.dist + '/images'))
});

// Include HTML
gulp.task('htmlhint', gulp.series('fileinclude', function() {
  return gulp.src(gulp.sources.src + '/*.html')
    .pipe(htmlhint())
    .pipe(htmlhint.failReporter())
    .pipe(connect.reload());
}));

// Copy fonts
gulp.task('copy:fonts', () => {
  return gulp.src(gulp.sources.src + '/fonts/**/*')
    .pipe(gulp.dest(gulp.sources.dist + '/fonts'))
});

// HTML beautify

gulp.task('prettify', gulp.parallel('copy:fonts', function() {
  return gulp.src([gulp.sources.dist + '/*.html'])
    .pipe(prettify({
      indent_char: ' ',
      indent_size: 2
    }))
    .pipe(gulp.dest(gulp.sources.dist));
}));

gulp.task('ref:js', () => {
  return gulp.src(gulp.sources.dist + '/script/*.js')
    .pipe(rev())
    .pipe(gulp.dest(gulp.sources.dist + '/script'))
    .pipe(rev.manifest())
    .pipe(gulp.dest(gulp.sources.dist + '/manifest/script'))
});

gulp.task('ref:css', () => {
  return gulp.src(gulp.sources.dist + '/style/*.css')
    .pipe(rev())
    .pipe(gulp.dest(gulp.sources.dist + '/style'))
    .pipe(rev.manifest())
    .pipe(gulp.dest(gulp.sources.dist + '/manifest/style'))
});

gulp.task('ref:image', () => {
  return gulp.src(gulp.sources.dist + '/images/**/*')
    .pipe(rev())
    .pipe(gulp.dest(gulp.sources.dist + '/images'))
    .pipe(rev.manifest())
    .pipe(gulp.dest(gulp.sources.dist + '/manifest/images'))
});

gulp.task("concat-manifest",function() {
  return gulp.src(gulp.sources.dist + '/manifest/**/*.json')
    .pipe(merge({fileName: 'manifest.json'}))
    .pipe(gulp.dest(gulp.sources.dist + '/manifest/'));
});

gulp.task("revreplace",function() {
  var manifest = gulp.src(gulp.sources.dist + "/manifest/manifest.json");

  return gulp.src(gulp.sources.dist + "/*.html")
    .pipe(revReplace({manifest: manifest}))
    .pipe(gulp.dest(gulp.sources.dist));
});

// Build source
gulp.task('build', function(done) {
  return gulp.series(
    'clean',
    'fileinclude',
    'htmlhint',
    'build-sass',
    'minify',
    'imagemin',
    'copy:fonts',
    'prettify',
    'ref:js',
    'ref:css',
    'ref:image',
    'concat-manifest',
    'revreplace'
)(done)});

// Start development server
gulp.task('run:dev', gulp.parallel('connect:dev', 'fileinclude', 'sass', 'stream', () => {
  console.log('Development version is running...');
}));

// Start product server
gulp.task('run:prod', gulp.series(
  'clean',
  'fileinclude',
  'htmlhint',
  'build-sass',
  'minify',
  'imagemin',
  'copy:fonts',
  'prettify',
  'ref:js',
  'ref:css',
  'ref:image',
  'concat-manifest',
  'revreplace',
  'connect:prod', () => {
  console.log('Production version is running...');
}));