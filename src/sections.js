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
  const { about, projects, contact, footer, resources } = content;
  return `
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
      <ul class="footer__resources" aria-label="Ресурсы">${resources.map((r) => `<li>${externalLink(r, 'footer__link')}</li>`).join('')}</ul>
      <p class="footer__copy">© ${new Date().getFullYear()} ${esc(footer.copyright)}</p>
    </footer>`;
}

/** Рендерит секции в контейнер вместо стартовой разметки index.html. */
export function mountSections(container, content) {
  container.innerHTML = renderSections(content);
}
