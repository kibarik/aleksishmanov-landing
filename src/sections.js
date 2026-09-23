/**
 * Секции после сцены: «Обо мне», карточки проектов, «Написать», футер.
 * Всё из модуля контента; разметка здесь, стили в style.css (.section, .card, .footer).
 */

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/** Внешняя ссылка на ресурс: новая вкладка, стрелка. */
const externalLink = (link, cls) => `<a class="${cls}" href="${esc(link.href)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}<span aria-hidden="true"> ↗</span></a>`;

function card(p) {
  return `
    <li class="card" data-project="${esc(p.id)}">
      <p class="card__direction">${esc(p.direction)}</p>
      <h3 class="card__title">${esc(p.title)}</h3>
      <p class="card__essence">${esc(p.essence)}</p>
      <ul class="card__topics" aria-label="Темы проекта">${p.topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <ul class="card__links" aria-label="Ресурсы проекта">${p.links.map((l) => `<li>${externalLink(l, 'card__link')}</li>`).join('')}</ul>
    </li>`;
}

export function renderSections(content) {
  const { intro, about, projects, contact, footer } = content;
  return `
    <section class="intro" id="intro">
      <div class="intro__sticky">
        <div class="intro__inner">
          <h2 class="intro__title">${esc(content.offer)}</h2>
          <p class="intro__lead">${esc(intro.lead)}</p>
          <p class="intro__name">${esc(intro.name)}</p>
          <p class="intro__role">${esc(intro.role)}</p>
        </div>
      </div>
    </section>
    <section class="section about" id="about">
      <h2 class="section__label">${esc(about.title)}</h2>
      <p class="about__offer">${esc(content.offer)}</p>
      <p class="about__since">${esc(about.since)}</p>
      <dl class="timeline">${about.timeline.map(({ year, text }) => `<div class="timeline__row"><dt>${esc(year)}</dt><dd>${esc(text)}</dd></div>`).join('')}</dl>
    </section>
    <section class="section projects" id="projects">
      <h2 class="section__label">${esc(projects.title)}</h2>
      <ul class="cards">${projects.items.map(card).join('')}</ul>
    </section>
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
  container.innerHTML = renderSections(content);
}
