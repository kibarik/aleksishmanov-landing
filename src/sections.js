/**
 * Секции после сцены: «Обо мне», «Чем могу быть полезен» (предложения и проекты), «Написать», футер.
 * Всё из модуля контента; разметка здесь, стили в style.css (.section, .card).
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

const ICONS = {
  arrow: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
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

/**
 * Полоса доказательств под оффером: до трёх цифр (пустое значение — не выводится) и ссылка на кейсы.
 * Громкий заголовок без опоры не убеждает — опора стоит на том же экране, а не ниже по странице.
 */
function proofBar({ facts, cases }) {
  const shown = facts.filter((f) => f.value);
  return `<div class="about__proof">${shown.length ? `
            <dl class="about__facts">${shown.map(({ value, label }) => `<div class="about__fact"><dt>${esc(value)}</dt><dd>${esc(label)}</dd></div>`).join('')}</dl>` : ''}
            <a class="about__proof-link" href="${esc(cases.href)}">${esc(cases.label)}<span aria-hidden="true"> →</span></a>
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
  const { about, projects, contact } = content;
  return `
    <section class="intro about" id="about">
      <div class="intro__sticky">
        <div class="intro__inner">
          <h2 class="section__label">${esc(about.title)}</h2>
          <p class="about__offer">${esc(content.offer)}</p>
          ${proofBar(about)}
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
    </section>`;
}

/** Рендерит секции в контейнер вместо стартовой разметки index.html. */
export function mountSections(container, content) {
  container.innerHTML = renderSections(content, { latest: globalThis.__latestMaterials || [] });
}
