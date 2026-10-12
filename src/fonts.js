/**
 * Шрифты сайта — локально (без Google Fonts), только латиница и кириллица: полный набор подмножеств
 * раздувал CSS на ~28 КБ описаний @font-face.
 * Подключаются после загрузки страницы, в свободное время (main.js): иначе полтора десятка файлов шрифтов (~200 КБ) встают
 * в очередь до первого кадра, и PageSpeed засчитывает их в FCP и LCP. Текст сначала рисуется системным
 * шрифтом и подменяется (font-display: swap); имя на 3D-сцене перерисовывается по document.fonts.load.
 */
import '@fontsource/cal-sans/latin-400.css';
import '@fontsource/manrope/latin-300.css';
import '@fontsource/manrope/cyrillic-300.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/cyrillic-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/cyrillic-500.css';
import '@fontsource/manrope/latin-800.css';
import '@fontsource/manrope/cyrillic-800.css';
import '@fontsource/montserrat/latin-600.css';
import '@fontsource/montserrat/cyrillic-600.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/cyrillic-700.css';
import '@fontsource/montserrat/latin-900.css';
import '@fontsource/montserrat/cyrillic-900.css';
import '@fontsource/onest/latin-500.css';
import '@fontsource/onest/cyrillic-500.css';
import '@fontsource/onest/latin-600.css';
import '@fontsource/onest/cyrillic-600.css';
