/**
 * Секции после сцены: «Обо мне», карточки проектов, «Написать», футер.
 * Всё из модуля контента; разметка здесь, стили в style.css (.section, .card, .footer).
 */

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/** Внешняя ссылка на ресурс: новая вкладка, стрелка. */
const externalLink = (link, cls) => `<a class="${cls}" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}<span aria-hidden="true"> ↗</span></a>`;
/** Ссылка карточки: страница сайта — в той же вкладке, внешняя площадка — в новой. */
const cardLink = (link, cls) => /^https?:/.test(link.href) ? externalLink(link, cls) : `<a class="${cls}" href="${esc(link.href)}">${esc(link.label)}<span aria-hidden="true"> →</span></a>`;

/** Свежие материалы портала (подставляет scripts/vite-portal.mjs): заголовок, тип, ссылка. */
function latestSection(latest) {
  if (!latest.length) return '';
  return `
    <section class="section latest" id="latest">
      <h2 class="section__label">Свежие материалы</h2>
      <ul class="latest__list">${latest.map((m) => `
        <li><a class="latest__item" href="${esc(m.href)}"><span class="latest__type">${esc(m.type)}</span><span class="latest__title">${esc(m.title)}</span></a></li>`).join('')}
      </ul>
      <p class="latest__all"><a href="/blog/">Блог</a> · <a href="/reviews/">Разборы</a> · <a href="/tools/">Инструменты</a> · <a href="/prompts/">Промты</a> · <a href="/slides/">Презентации</a></p>
    </section>`;
}


function card(p) {
  return `
    <li class="card" data-project="${esc(p.id)}">
      <p class="card__direction">${esc(p.direction)}</p>
      <h3 class="card__title">${esc(p.title)}</h3>
      <p class="card__essence">${esc(p.essence)}</p>
      <ul class="card__topics" aria-label="Темы проекта">${p.topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <ul class="card__links" aria-label="Ресурсы проекта">${p.links.map((l) => `<li>${cardLink(l, 'card__link')}</li>`).join('')}</ul>
    </li>`;
}

export function renderSections(content, { latest = [] } = {}) {
  const { about, projects, contact, footer } = content;
  return `
    <section class="intro about" id="about">
      <div class="intro__sticky">
        <div class="intro__inner">
          <h2 class="section__label">${esc(about.title)}</h2>
          <p class="about__offer">${esc(content.offer)}</p>
          <p class="about__since">${esc(about.since)}</p>
          <dl class="timeline">${about.timeline.map(({ year, text }) => `<div class="timeline__row"><dt>${esc(year)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl>
        </div>
      </div>
    </section>
    <section class="section projects" id="projects">
      <h2 class="section__label">${esc(projects.title)}</h2>
      <ul class="cards">${projects.items.map(card).join('')}</ul>
    </section>${latestSection(latest)}
    <section class="section contact" id="contact">
      <h2 class="contact__title">${esc(contact.title)}</h2>
      ${externalLink(contact, 'btn')}
    </section>
    <footer class="footer" id="footer">
      <canvas class="footer__scene" id="footer-scene" aria-hidden="true"></canvas>
      <img class="footer__fallback" id="footer-fallback" src="./fallback/white-desktop.webp" alt="" aria-hidden="true" />
      <div class="footer__inner">
        <div class="footer__columns">
          ${footer.columns.map((c) => `
            <nav class="footer__column" aria-label="${esc(c.title)}">
              <p class="footer__column-title">${esc(c.title)}</p>
              <ul>${c.links.map((l) => `<li>${l.href.startsWith('#')
                ? `<a class="footer__link" href="${esc(l.href)}">${esc(l.label)}</a>`
                : externalLink(l, 'footer__link')}</li>`).join('')}</ul>
            </nav>`).join('')}
        </div>
        <div class="footer__cta">
          <p class="footer__lead">${esc(footer.lead)}</p>
          ${externalLink(contact, 'footer__btn')}
          <ul class="footer__anchors" aria-label="Разделы страницы">${content.menu.anchors.map((a) => `<li><a class="footer__chip" href="${esc(a.href)}">${esc(a.label)}</a></li>`).join('')}</ul>
        </div>
      </div>
      <p class="footer__copy">© ${new Date().getFullYear()} ${esc(footer.copyright)}</p>
    </footer>`;
}

/** Рендерит секции в контейнер вместо стартовой разметки index.html. */
export function mountSections(container, content) {
  container.innerHTML = renderSections(content, { latest: globalThis.__latestMaterials || [] });
}
