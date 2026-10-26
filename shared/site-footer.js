/**
 * Подвал сайта: одна чистая функция, разметка из данных портала (portal/src/lib/site.ts).
 * Портал вставляет её в базовый лейаут, главная получает при сборке (scripts/vite-portal.mjs).
 * Стили — shared/site-footer.css. Подвал статичный: ни canvas, ни скриптов, ни анимаций.
 */
const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const OUT = 'target="_blank" rel="noopener"';

/** Эмблема-око: пирамида с глазом, статичная, из текущего цвета текста. */
const EMBLEM = `<svg viewBox="0 0 120 120" width="120" height="120" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M60 8 112 108H8Z"/><path d="M28 74c10-14 22-21 32-21s22 7 32 21c-10 14-22 21-32 21S38 88 28 74Z"/><circle cx="60" cy="74" r="9" fill="currentColor"/></svg>`;

/**
 * @param {{ SITE: any, DIRECTION_INFO: Record<string, any>, SECTIONS: Record<string, any>, NAV: string[], PROFILES: any[], year: number }} d
 * @returns {string}
 */
export function renderFooter({ SITE, DIRECTION_INFO, SECTIONS, NAV, PROFILES, year }) {
  const link = (href, text) => `<li><a href="${esc(href)}">${esc(text)}</a></li>`;
  return `<footer class="site-footer" id="footer">
  <div class="site-footer__panel">
    <div class="site-footer__grid">
      <div class="site-footer__links">
        <nav aria-label="Направления">
          <h2>Направления</h2>
          <ul>${Object.values(DIRECTION_INFO).map((x) => link(x.path, x.title)).join('')}${link('/about/', 'Обо мне')}</ul>
        </nav>
        <nav aria-label="Разделы">
          <h2>Разделы</h2>
          <ul>${NAV.map((k) => link(SECTIONS[k].path, SECTIONS[k].title)).join('')}</ul>
        </nav>
      </div>
      <div class="site-footer__emblem">${EMBLEM}</div>
      <div class="site-footer__side">
        <p class="site-footer__lead">${esc(SITE.positioning)}</p>
        <a class="site-footer__btn" href="${esc(SITE.contact.href)}" ${OUT}>Написать</a>
        <nav aria-label="Профили">
          <h2>Профили</h2>
          <ul>${PROFILES.map((p) => `<li><a href="${esc(p.href)}" ${OUT.replace('noopener', 'noopener me')}>${esc(p.label)}</a></li>`).join('')}</ul>
        </nav>
        <p class="site-footer__copy">© ${year} ${esc(SITE.name)} · <a href="/rss.xml">RSS</a> · <a href="/llms.txt">llms.txt</a></p>
      </div>
    </div>
  </div>
</footer>`;
}
