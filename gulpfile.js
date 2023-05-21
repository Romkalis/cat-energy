import gulp from 'gulp';
import plumber from 'gulp-plumber'; // позволяет сборке работать даже при наличии ошибок
import htmlmin from 'gulp-htmlmin';// минимизирует HTML
import less from 'gulp-less'; // преобразует LESS в CSS
import postcss from 'gulp-postcss'; // с помощью библиотеки postcss-csso минимизируем css
import autoprefixer from 'autoprefixer'; // расставляет префиксы при сборке для разных браузеров
import csso from 'postcss-csso'; // минимизует CSS
import rename from 'gulp-rename'; // переименовывает файлы
import sourcemap from 'gulp-sourcemaps';
import terser from 'gulp-terser';
import webp from 'gulp-webp';         //прреобразование в webp
import svgstore from 'gulp-svgstore'; //спрайт для svg
import browser from 'browser-sync'; // сервер для браузера
import squoosh from 'gulp-libsquoosh'; // сжатие картинок
import { deleteAsync } from 'del';

// HTML

export const html = () => {
  return gulp.src("source/*.html")                  // возьми файлы здесь
    .pipe(htmlmin({ collapseWhitespace: true }))    // убери все ненужные пробелы
    .pipe(gulp.dest("build"))                       // положи все файлы вот сюда
};

// SCRIPTS

export const scripts = () => {
  return gulp.src('source/js/script.js')
    .pipe(terser())
    .pipe(rename('script.min.js'))
    .pipe(gulp.dest('build'))
};

//IMAGES

export const optimizedImages = () => {
  return gulp.src('source/img/**/*.{jpg,png,svg}')
    .pipe(squoosh())
    .pipe(gulp.dest('build/img'))
}

export const copyImages = () => {
  return gulp.src('source/img/**/*.{jpg,png,svg}')
    .pipe(gulp.dest('build/img'))
}

// WEBP

export const createWebp = () => {
  return gulp.src('source/img/**/*.{jpg,png}')
  .pipe(webp({ quality: 90 }))
  .pipe(gulp.dest('build/img'))
}

// SPRITES

export const sprite = () => {
  return GeolocationPosition.src('source/img/icons/*.svg')
    .pipe(svgstore('inlinesvg: true'))
    .pipe(rename('sprite.svg'))
    .pipe(gulp.dest('build/img/icons'))
}

// Задача COPY - перемещает шрифты, фавиконки и тд

export const copy = (done) => {
  return gulp.src([  // добавляем массив в котором будут данные что взять, тк. файлов много
    'source/fonts/*.{woff,woff2}',
    'source/*.ico',
    'source/img/**/*.svg',
  ], {
    base: 'source'// внутри - будут указываться пути относительно SOURCE
  })
  .pipe(gulp.dest('build'))
  done();// эта функция говорит о том что задача завершена.
}

// CLEAN - чистим build чтобы в нем не собирались файлы, который уже нет в dev проeкте

export const clean = () => {
  return deleteAsync('build'); // Укажите путь к папке или файлу, которые хотите удалить
};


// Styles

export const styles = () => {
  return gulp.src('source/less/style.less', { sourcemaps: true }) //верни результат того что ниже сначала сделав снимок
    .pipe(plumber())                         // работай если есть ошибки
    .pipe(less())                            // возьми LESS
    .pipe(postcss([                          // с помощью postcss
      autoprefixer(),                        // сначала расставь префиксы
      csso()                                 // минфиицируй
    ]))
    .pipe(rename('style.min.css'))           //переименовываем, чтобы обозначить минификацию
    .pipe(gulp.dest('build/css', { sourcemaps: '.' })) //сделай снимок (мапу)
    .pipe(browser.stream());                 // обнови браузер
}

// Server

const server = (done) => {
  browser.init({
    server: {
      baseDir: 'build'
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

// Watcher

export const watcher = () => {
  gulp.watch("source/less/**/*.less", gulp.series(styles));
  // gulp.watch("source/js/script.js", gulp.series(scripts));
  gulp.watch("source/*.html", gulp.series(html, reload));
}

const reload = (done) => { // определяем reload из watchera
  browser.reload();
  done();
}


export const build = gulp.series(
  clean,
  copy,
  optimizedImages,
  gulp.parallel(
    styles,
    html,
    // sprites,
    scripts,
    createWebp),
);

export default gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    // sprites,
    scripts,
    createWebp),
  server,
  watcher,
);
