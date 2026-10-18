/**
 * Секции после сцены: «Обо мне», «Чем могу быть полезен» (предложения и проекты), «Написать», футер.
 * Всё из модуля контента; разметка здесь, стили в style.css (.section, .card, .footer).
 */

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/** Атрибуты ссылки на внешнюю площадку: новая вкладка без доступа к opener. */
const NEW_TAB = 'target="_blank" rel="noopener noreferrer"';
/** Внешняя ссылка на ресурс: новая вкладка, стрелка. */
const externalLink = (link, cls) => `<a class="${cls}" href="${esc(link.href)}" ${NEW_TAB}>${esc(link.label)}<span aria-hidden="true"> ↗</span></a>`;
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

/** Ссылка футера: внешняя — как везде (новая вкладка, ↗), внутренняя — без стрелки, как у референса. */
const footerLink = (link, cls) => /^https?:/.test(link.href) ? externalLink(link, cls) : `<a class="${cls}" href="${esc(link.href)}">${esc(link.label)}</a>`;

const ICONS = {
  up: '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10.5"/><path d="M12 17V7M7.5 11.5 12 7l4.5 4.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  threads: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M16.5 8.4C16 6.3 14.3 5 12 5c-3.1 0-5 2.4-5 7s1.9 7 5 7c2.6 0 4.4-1.4 4.4-3.4 0-1.9-1.6-3-4-3-1.4 0-2.4.5-2.4 1.4 0 .8.8 1.3 1.9 1.3 1.7 0 2.7-1.2 2.7-3.9"/></svg>',
};

function card(p) {
  return `
    <li class="card" data-project="${esc(p.id)}">
      <p class="card__direction">${esc(p.direction)}</p>
      <h3 class="card__title">${esc(p.title)}</h3>
      <p class="card__essence">${esc(p.essence)}</p>
      <ul class="card__topics" aria-label="Форматы работы">${p.topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <ul class="card__links" aria-label="Подробнее на сайте">${p.links.map((l) => `<li>${cardLink(l, 'card__link')}</li>`).join('')}</ul>
      <a class="card__cta" href="${esc(p.cta.href)}" ${NEW_TAB}>${esc(p.cta.label)}<span aria-hidden="true"> ↗</span></a>
    </li>`;
}

/** «Что веду»: проекты строкой — название, суть, ссылка (внешняя — в новой вкладке). */
function ongoing(o) {
  return `
      <div class="ongoing">
        <h3 class="ongoing__title">${esc(o.title)}</h3>
        <ul class="ongoing__list">${o.items.map((it) => {
          const ext = /^https?:/.test(it.href);
          return `<li><a class="ongoing__item" href="${esc(it.href)}"${ext ? ` ${NEW_TAB}` : ''}><span class="ongoing__name">${esc(it.label)}<span aria-hidden="true"> ${ext ? '↗' : '→'}</span></span><span class="ongoing__note">${esc(it.note)}</span></a></li>`;
        }).join('')}</ul>
      </div>`;
}

/** Строка пути и образования: годы, роль (или место) с местом через точку, итог одной строкой — что заполнено. */
function pathRow({ period, role = '', org = '', text = '' }) {
  const head = role ? `${esc(role)}${org ? `<span class="path__org"> · ${esc(org)}</span>` : ''}` : esc(org);
  return `
            <li class="path__row">
              <span class="path__period">${esc(period)}</span>
              <div class="path__body">
                <p class="path__role">${head}</p>${text ? `
                <p class="path__text">${esc(text)}</p>` : ''}
              </div>
            </li>`;
}

/** Последний год — только если владелец вписал фразу (content.js, about.lastYear). */
function lastYearBlock(y) {
  if (!y.lead) return '';
  return `
        <div class="year">
          <h3 class="about__h">${esc(y.title)}${y.period ? ` <span class="year__period">${esc(y.period)}</span>` : ''}</h3>
          <p class="year__lead">${esc(y.lead)}</p>${y.metrics.length ? `
          <dl class="year__metrics">${y.metrics.map(({ value, label }) => `<div class="year__metric"><dt>${esc(value)}</dt><dd>${esc(label)}</dd></div>`).join('')}</dl>` : ''}${y.points.length ? `
          <ul class="year__points">${y.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
        </div>`;
}

/** «Обо мне», вторая часть: наезжает на липкий экран оффера. Пустые блоки не выводятся. */
function aboutMore({ career, education, lastYear, cases }) {
  const col = (block, cls = '') => block.items.length ? `
          <div class="about__col">
            <h3 class="about__h">${esc(block.title)}</h3>
            <ol class="path${cls}">${block.items.map(pathRow).join('')}</ol>
          </div>` : '';
  return `
      <div class="about__more">
        <div class="about__grid${education.items.length ? '' : ' about__grid--single'}">${col(career)}${col(education, ' path--short')}
        </div>${lastYearBlock(lastYear)}
        <a class="about__cases" href="${esc(cases.href)}">
          <span class="about__cases-stack" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="about__cases-text"><strong>${esc(cases.label)}</strong><small>${esc(cases.note)}</small></span>
          <span class="about__cases-arrow" aria-hidden="true">${ICONS.arrow}</span>
        </a>
      </div>`;
}

export function renderSections(content, { latest = [] } = {}) {
  const { about, projects, contact, footer } = content;
  return `
    <section class="intro about" id="about">
      <div class="intro__sticky">
        <div class="intro__inner">
          <h2 class="section__label">${esc(about.title)}</h2>
          <p class="about__offer">${esc(content.offer)}</p>
          ${about.facts.length ? `<dl class="about__facts">${about.facts.map(({ value, label }) => `<div class="about__fact"><dt>${esc(value)}</dt><dd>${esc(label)}</dd></div>`).join('')}</dl>` : ''}
        </div>
      </div>
      ${aboutMore(about)}
    </section>
    <section class="section projects" id="projects">
      <h2 class="section__label">${esc(projects.title)}</h2>
      <p class="projects__lead">${esc(projects.lead)}</p>
      <ul class="cards">${projects.items.map(card).join('')}</ul>${ongoing(projects.ongoing)}
    </section>${latestSection(latest)}
    <section class="section contact" id="contact">
      <h2 class="contact__title">${esc(contact.title)}</h2>
      ${externalLink(contact, 'btn')}
    </section>
    <footer class="footer" id="footer">
      <div class="footer__panel">
        <span class="footer__handle" aria-hidden="true"></span>
        <a class="footer__up" href="#top" aria-label="Наверх" data-footer-up>${ICONS.up}</a>
        <div class="footer__grid">
          <div class="footer__list">
            <div class="footer__scroll" data-footer-scroll>
              ${footer.groups.map((g) => `
                <div class="footer__card">
                  <p class="footer__card-title"><a href="${esc(g.href)}">${esc(g.title)}</a></p>
                  <span class="footer__card-arrow" aria-hidden="true">${ICONS.arrow}</span>
                  <ul class="footer__card-links">${g.links.map((l) => `<li>${footerLink(l, 'footer__link')}</li>`).join('')}</ul>
                </div>`).join('')}
            </div>
          </div>
          <div class="footer__object">
            <canvas class="footer__scene" id="footer-scene" aria-hidden="true"></canvas>
            <img class="footer__fallback" id="footer-fallback" src="./fallback/white-desktop.webp" alt="" aria-hidden="true" loading="lazy" />
          </div>
          <div class="footer__right">
            <div class="footer__blocks">
              ${footer.blocks.map((b) => `
                <nav class="footer__column" aria-label="${esc(b.title)}">
                  <p class="footer__column-title${b.mark ? ' footer__column-title--mark' : ''}">${b.href ? footerLink({ label: b.title, href: b.href }, 'footer__title-link') : esc(b.title)}</p>
                  ${b.desc ? `<p class="footer__desc">${esc(b.desc)}</p>` : ''}
                  ${b.links ? `<ul class="footer__sublinks">${b.links.map((l) => `<li>${footerLink(l, 'footer__link')}</li>`).join('')}</ul>` : ''}
                </nav>`).join('')}
            </div>
          </div>
          <div class="footer__bottom">
            <div class="nice-btn"><a class="footer__btn" href="${esc(contact.href)}" ${NEW_TAB}><span class="footer__btn-text">${esc(contact.title)}</span></a></div>
            <div class="footer__profiles">
              <p class="footer__desc">${esc(footer.profiles.title)}</p>
              <ul class="footer__profiles-list">${footer.profiles.items.map((i) => `<li><a class="footer__profile-link" href="${esc(i.href)}" ${NEW_TAB} aria-label="${esc(i.label)}">${ICONS[i.icon]}</a></li>`).join('')}</ul>
            </div>
            <p class="footer__copy">© ${esc(footer.copyright)}, ${new Date().getFullYear()}</p>
          </div>
        </div>
        <canvas class="footer__noise" id="footer-noise" aria-hidden="true"></canvas>
      </div>
    </footer>`;
}

/** Рендерит секции в контейнер вместо стартовой разметки index.html. */
export function mountSections(container, content) {
  container.innerHTML = renderSections(content, { latest: globalThis.__latestMaterials || [] });
}
