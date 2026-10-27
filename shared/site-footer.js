/**
 * Подвал сайта: одна чистая функция, разметка из данных портала (portal/src/lib/site.ts) и подборок
 * (shared/footer-data.js). Портал вставляет её в базовый лейаут, главная получает при сборке
 * (scripts/vite-portal.mjs). Стили — shared/site-footer.css.
 * Структура — как у референса: слева карточки подборок, в центре рука, справа блоки и призыв.
 * Подвал статичный: ни canvas, ни скриптов, ни фоновой анимации — только отклик на наведение.
 */
import { FOOTER_GROUPS, FOOTER_BLOCKS } from './footer-data.js';

const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const OUT = 'target="_blank" rel="noopener"';
const isOut = (href) => /^https?:/.test(href);

const ICONS = {
  up: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10.5"/><path d="M12 17V7M7.5 11.5 12 7l4.5 4.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  threads: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16.5 8.4C16 6.3 14.3 5 12 5c-3.1 0-5 2.4-5 7s1.9 7 5 7c2.6 0 4.4-1.4 4.4-3.4 0-1.9-1.6-3-4-3-1.4 0-2.4.5-2.4 1.4 0 .8.8 1.3 1.9 1.3 1.7 0 2.7-1.2 2.7-3.9"/></svg>',
  github: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg>',
};

/** Иконки профилей под кнопкой: личка, Threads, GitHub. */
const ICON_PROFILES = [
  { label: 'Telegram', icon: 'telegram', href: (d) => d.SITE.contact.href },
  { label: 'Threads', icon: 'threads', href: (d) => d.PROFILES.find((p) => p.label === 'Threads').href },
  { label: 'GitHub', icon: 'github', href: (d) => d.PROFILES.find((p) => p.label === 'GitHub').href },
];

const link = ({ label, href }, cls) => `<a class="${cls}" href="${esc(href)}"${isOut(href) ? ` ${OUT}` : ''}>${esc(label)}</a>`;

/**
 * @param {{ SITE: any, PROFILES: any[], year: number }} d
 * @returns {string}
 */
export function renderFooter(d) {
  const { SITE, year } = d;
  return `<footer class="site-footer" id="footer">
  <div class="site-footer__panel">
    <span class="site-footer__handle" aria-hidden="true"></span>
    <a class="site-footer__up" href="#" aria-label="Наверх">${ICONS.up}</a>
    <div class="site-footer__grid">
      <nav class="site-footer__list" aria-label="Подборки материалов">
        <div class="site-footer__scroll">${FOOTER_GROUPS.map((g) => `
          <div class="site-footer__card">
            <p class="site-footer__card-title">${link({ label: g.title, href: g.href }, 'site-footer__card-link')}</p>
            <span class="site-footer__card-arrow" aria-hidden="true">${ICONS.arrow}</span>
            <ul class="site-footer__links">${g.links.map((l) => `<li>${link(l, 'site-footer__link')}</li>`).join('')}</ul>
          </div>`).join('')}
        </div>
      </nav>
      <div class="site-footer__hand" aria-hidden="true"></div>
      <div class="site-footer__blocks">${FOOTER_BLOCKS.map((b) => `
        <nav class="site-footer__column" aria-label="${esc(b.title)}">
          <p class="site-footer__column-title${b.mark ? ' site-footer__column-title--mark' : ''}">${b.href ? link({ label: b.title, href: b.href }, 'site-footer__title-link') : esc(b.title)}</p>
          ${b.desc ? `<p class="site-footer__desc">${esc(b.desc)}</p>` : ''}
          ${b.links ? `<ul class="site-footer__links">${b.links.map((l) => `<li>${link(l, 'site-footer__link')}</li>`).join('')}</ul>` : ''}
        </nav>`).join('')}
      </div>
      <div class="site-footer__bottom">
        <div class="site-footer__glow"><a class="site-footer__btn" href="${esc(SITE.contact.href)}" ${OUT}><span>Написать</span></a></div>
        <div class="site-footer__profiles">
          <p class="site-footer__desc">Профили</p>
          <ul class="site-footer__icons">${ICON_PROFILES.map((p) => `<li><a class="site-footer__icon" href="${esc(p.href(d))}" ${OUT.replace('noopener', 'noopener me')} aria-label="${p.label}">${ICONS[p.icon]}</a></li>`).join('')}</ul>
        </div>
        <p class="site-footer__copy">© ${esc(SITE.name)}, ${year} · <a href="/rss.xml">RSS</a> · <a href="/llms.txt">llms.txt</a></p>
      </div>
    </div>
  </div>
</footer>`;
}
