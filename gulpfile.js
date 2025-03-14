const gulp = require('gulp');
const sass = require('sass');
const gulpSass = require('gulp-sass')(sass);
const browserSync = require('browser-sync');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const cache = require('gulp-cache');
const autoprefixer = require('gulp-autoprefixer');
const notify = require("gulp-notify");
const fileinclude = require('gulp-file-include');
const htmlmin = require('gulp-htmlmin');
const { rimraf } = require("rimraf");
const log = require('fancy-log');
const PluginError = require('plugin-error');

function minifyHtml(cb) {
  gulp.src('app/htmlparts/**/*.html')
  .pipe(htmlmin({collapseWhitespace: true}))
  .pipe(gulp.dest('app/htmlmin'))
  setTimeout(() => cb(), 100);
}

function commonJs(cb) {
	gulp.src([
	'app/js/**/*.js',
	])
	.pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
   }))
	.pipe(rename({suffix: '.min', prefix : ''}))
	.pipe(uglify())
	.pipe(gulp.dest('app/minjs'))
	.pipe(browserSync.stream());
	cb();
}

function browser(cb) {
	browserSync({
		server: {
			baseDir: 'app'
		},
		open: false,
		notify: false,
	});
	cb();
}

function code(cb) {
	gulp.src('app/*.html')
	.pipe(browserSync.stream());
	cb();
}

function compileSass(cb) {
	gulp.src('app/scss/**/*.scss')
		.pipe(gulpSass({
			outputStyle: 'expanded'
		}).on("error", function(err) {
			notify.onError()(err);
			this.emit('end');
		}))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(autoprefixer(['last 2 versions']))
		.pipe(cleanCSS())
		.pipe(gulp.dest('app/css'))
		.on('end', cb);
}

function files(cb) {
	setTimeout(() => {
		gulp.src([
		'app/minjs/common.min.js'
		])
		.pipe(rename('acctoolbar.min.js'))
		.pipe(gulp.dest('acctoolbar'));
		
		gulp.src([
			'app/cursors/**/*',
		]).pipe(gulp.dest('acctoolbar/cursors'));
		
		gulp.src([
			'app/htmlmin/toolbox.html'
		]).pipe(gulp.dest('acctoolbar'));

		gulp.src([
			'app/css/all.min.css'
		])
		.pipe(rename('acctoolbar.min.css'))
		.pipe(gulp.dest('acctoolbar'));
		
		cb();
	}, 500);
}

function remDist(cb) {
	rimraf('acctoolbar').then(() => cb()).catch(err => {
		console.error('Error removing directory:', err);
		cb(err);
	});
}

function clearCache (cb) { 
	cache.clearAll();
	cb(); 
}

function watch(cb) {
	gulp.watch('app/scss/**/*.scss', gulp.series(compileSass, commonJs));
	gulp.watch('app/htmlparts/**/*.html', gulp.series(minifyHtml, commonJs));
	gulp.watch('app/js/**/*.js', gulp.parallel(commonJs));
	gulp.watch('app/*.html', gulp.parallel(code));
	cb();
}

// exports.build = gulp.series(remDist, minifyHtml, sass, commonJs, files);
exports.build = gulp.series(remDist, minifyHtml, compileSass, commonJs, files);

exports.clearcache = clearCache;
exports.rem = remDist;
exports.buildhtml = minifyHtml;
exports.buildcss = compileSass;
exports.buildjs = commonJs;
exports.buildfiles = files;

exports.default = gulp.parallel(watch, browser);
