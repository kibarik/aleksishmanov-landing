/**
 * Хелперы E2E. Хуки window.__sticky / window.__app используются только для чтения
 * (прогресс шагов, факт ухода сцены, захват кадра); управление — колесом, свайпом, кликами.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
export const GOLDEN_DIR = path.join(here, 'golden');

/** Прогресс шагов липкого скролла (см. tests/bersus-scroll-analysis.md, UNIT 200 / 260). */
export const STEPS = {
  desktop: { darkScene: 200, transition: 440, whiteScene: 640 },
  mobile: { darkScene: 260, whiteScene: 1053 },
};

/** Ждёт загрузку сцены и окончание prelude (тёмная сцена в стартовой позе). */
export async function waitForPrelude(page) {
  await page.waitForFunction(() => window.__sticky?.state?.preludeDone === true, null, { timeout: 60_000 });
}

export async function readProgress(page) {
  return page.evaluate(() => Math.round(window.__sticky.progress));
}

/** Сцена отдала нативный скролл (уход сцены). */
export async function isSceneLeft(page) {
  return page.evaluate(() => window.__sticky.state.released === true);
}

/** Ждёт, пока прогресс липкого скролла дойдёт до значения (с допуском). */
export async function waitForProgress(page, value, { timeout = 15_000, eps = 1 } = {}) {
  await page.waitForFunction(
    ([v, e]) => Math.abs(window.__sticky.progress - v) <= e,
    [value, eps],
    { timeout },
  );
}

/** Пачка тиков колеса, как реальный жест: несколько событий подряд. */
export async function wheelBurst(page, { ticks = 4, delta = 100, gapMs = 40 } = {}) {
  const vp = page.viewportSize();
  await page.mouse.move(vp.width / 2, vp.height / 2);
  for (let i = 0; i < ticks; i++) {
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(gapMs);
  }
}

/** Свайп вверх (контент вниз) через CDP touch-события. Только Chromium. */
export async function swipeUp(page, { distance = 300, steps = 12 } = {}) {
  const vp = page.viewportSize();
  const x = vp.width / 2;
  const y0 = vp.height * 0.7;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', y0);
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', y0 - (distance * i) / steps);
    await page.waitForTimeout(16);
  }
  await touch('touchEnd', 0);
  await cdp.detach();
}

const goldenPath = (name) => path.join(GOLDEN_DIR, `${name}.png`);

/**
 * Сравнивает текущий кадр сцены с золотым через window.__compareTo (метрики src/compare.js).
 * score — взвешенная сумма отклонений; 0 = идентично. Порог по умолчанию 4.
 * Отсутствующий золотой кадр — ошибка; записать можно только с UPDATE_GOLDEN=1.
 */
/** Сравнивает текущий кадр с золотым и возвращает score (без утверждений). */
export async function scoreAgainstGolden(page, name) {
  const file = goldenPath(name);
  expect(fs.existsSync(file), `нет золотого кадра ${file}`).toBe(true);
  const url = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  const { score } = await page.evaluate((u) => window.__compareTo(u), url);
  return score;
}

export async function expectGolden(page, name, { threshold = 4 } = {}) {
  // имя на сцене перерисовывается после загрузки шрифта — дожидаемся, чтобы кадр был детерминирован
  await page.waitForFunction(() => document.fonts.check('900 40px Montserrat'), null, { timeout: 15_000 });
  await page.waitForTimeout(300);
  const current = await page.evaluate(() => window.__capturePng());
  const file = goldenPath(name);
  if (process.env.UPDATE_GOLDEN) {
    fs.mkdirSync(GOLDEN_DIR, { recursive: true });
    fs.writeFileSync(file, Buffer.from(current.split(',')[1], 'base64'));
    return;
  }
  expect(fs.existsSync(file), `нет золотого кадра ${file}; создай: npm run test:update-golden`).toBe(true);
  const goldenUrl = 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
  const result = await page.evaluate((url) => window.__compareTo(url), goldenUrl);
  expect(result.score, `золотой кадр "${name}": score ${result.score} > ${threshold}: ${JSON.stringify(result.diff)}`).toBeLessThanOrEqual(threshold);
}

/**
 * Тексты первого экрана из модуля контента: оффер на лоадере (цитаты больше нет),
 * теглайн в разметке, но ещё скрыт до белой сцены. Вызывать сразу после goto.
 */
export async function expectFirstScreenTexts(page, content) {
  await expect(page.locator('#loader')).toBeVisible();
  await expect(page.locator('#loader-offer')).toHaveText(content.offer);
  await expect(page.locator('#loader')).not.toContainText('Linus');
  await waitForPrelude(page);
  await expect(page.locator('#tagline')).toHaveText(content.tagline.join(' '));
  await expect(page.locator('#tagline')).not.toHaveClass(/tagline--visible/);
}

/** Проходит путь до белой сцены жестами (колесо / свайпы) и ждёт паузу на шаге full. */
export async function goToWhiteScene(page, preset) {
  if (preset === 'mobile') {
    await swipeUp(page);
    await swipeUp(page);
    await waitForProgress(page, STEPS.mobile.whiteScene);
  } else {
    await wheelBurst(page);
    await waitForProgress(page, STEPS.desktop.transition);
    await page.waitForTimeout(700); // пауза 500 мс в конце перехода
    await wheelBurst(page);
    await waitForProgress(page, STEPS.desktop.whiteScene);
  }
  await page.waitForTimeout(700); // пауза 500 мс на шаге full
}

/** Уход сцены виден снаружи: тело в режиме нативного скролла. */
export async function expectSceneLeft(page) {
  await expect(page.locator('body')).toHaveClass(/is-released/, { timeout: 10_000 });
}

/**
 * Геометрия элемента в css-пикселях (boundingBox() в мобильной эмуляции врёт из-за DPR).
 * heroH — высота кадра сцены: позиции внутри сцены задаются в долях кадра, а не окна.
 */
export async function rectOf(page, selector) {
  return page.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect();
    return {
      top: r.top, bottom: r.bottom, left: r.left, right: r.right,
      viewportH: window.innerHeight,
      heroH: document.getElementById('hero').getBoundingClientRect().height,
    };
  }, selector);
}

/** Элемент хотя бы частично в зоне видимости. */
export async function isInViewport(page, selector) {
  const r = await rectOf(page, selector);
  return r.bottom > 0 && r.top < r.viewportH;
}

/**
 * С белой сцены: жест вниз — уход сцены, затем нативный скролл на screens высот экрана.
 * Жест повторяется до release: под нагрузкой один свайп не всегда доезжает до конца шага.
 */
export async function leaveScene(page, preset, { screens = 1, attempts = 4 } = {}) {
  for (let i = 0; i < attempts; i++) {
    if (preset === 'mobile') await swipeUp(page);
    else await wheelBurst(page);
    const released = await page.waitForFunction(() => window.__sticky.state.released === true, null, { timeout: 3000 })
      .then(() => true).catch(() => false);
    if (released) break;
  }
  await expectSceneLeft(page);
  const { height } = page.viewportSize();
  if (preset === 'mobile') {
    for (let i = 0; i < screens * 2; i++) await swipeUp(page, { distance: height * 0.6 });
  } else {
    await page.mouse.wheel(0, height * screens);
  }
  await page.waitForTimeout(500);
}

/**
 * Секции после сцены совпадают с модулем контента: «Обо мне», три карточки в порядке контента
 * (направление, название, суть, темы, ссылки), «Написать», футер с ресурсами. Блога нет нигде.
 */
export async function expectSectionsMatchContent(page, content) {
  const about = page.locator('#about');
  await expect(about.locator('h2')).toHaveText(content.about.title);
  await expect(about).toContainText(content.offer);
  const facts = about.locator('.about__fact');
  await expect(facts).toHaveCount(content.about.facts.length);
  for (const [i, { value, label }] of content.about.facts.entries()) {
    await expect(facts.nth(i).locator('dt')).toHaveText(value);
    await expect(facts.nth(i).locator('dd')).toHaveText(label);
  }
  const rows = about.locator('.path__row');
  await expect(rows).toHaveCount(content.about.career.items.length + content.about.education.items.length);
  for (const [i, { period, role }] of content.about.career.items.entries()) {
    await expect(rows.nth(i).locator('.path__period')).toHaveText(period);
    await expect(rows.nth(i).locator('.path__role')).toContainText(role);
  }
  await expect(about.locator('a.about__cases')).toHaveAttribute('href', content.about.cases.href);
  await expect(about.locator('a.about__cases')).toContainText(content.about.cases.label);

  await expect(page.locator('#projects h2')).toHaveText(content.projects.title);
  await expect(page.locator('#projects .projects__lead')).toHaveText(content.projects.lead);
  const cards = page.locator('#projects [data-project]');
  await expect(cards).toHaveCount(content.projects.items.length);
  for (const [i, p] of content.projects.items.entries()) {
    const card = cards.nth(i);
    await expect(card).toHaveAttribute('data-project', p.id);
    await expect(card.locator('.card__direction')).toHaveText(p.direction);
    await expect(card.locator('.card__title')).toHaveText(p.title);
    await expect(card.locator('.card__essence')).toHaveText(p.essence);
    await expect(card.locator('.card__topics li')).toHaveText(p.topics);
    const links = card.locator('.card__links a');
    await expect(links).toHaveCount(p.links.length);
    for (const [j, l] of p.links.entries()) {
      await expect(links.nth(j)).toHaveAttribute('href', l.href);
      // внешние площадки — в новой вкладке, страницы сайта — в той же
      if (/^https?:/.test(l.href)) await expect(links.nth(j)).toHaveAttribute('target', '_blank');
      else await expect(links.nth(j)).not.toHaveAttribute('target', '_blank');
      await expect(links.nth(j)).toContainText(l.label);
    }
    // главная кнопка — в Telegram, в новой вкладке
    await expect(card.locator('.card__cta')).toHaveAttribute('href', p.cta.href);
    await expect(card.locator('.card__cta')).toHaveAttribute('target', '_blank');
    await expect(card.locator('.card__cta')).toContainText(p.cta.label);
  }
  // «Что веду»: все проекты со ссылками
  const ongoing = page.locator('#projects .ongoing__item');
  await expect(ongoing).toHaveCount(content.projects.ongoing.items.length);
  for (const [i, it] of content.projects.ongoing.items.entries()) {
    await expect(ongoing.nth(i)).toHaveAttribute('href', it.href);
    await expect(ongoing.nth(i)).toContainText(it.label);
  }

  await expect(page.locator('#contact h2')).toHaveText(content.contact.title);
  const contactBtn = page.locator('#contact a[href]');
  await expect(contactBtn).toHaveCount(1);
  await expect(contactBtn).toHaveAttribute('href', content.contact.href);
  await expect(contactBtn).toContainText(content.contact.label);

  // футер: карточка групп слева, блоки справа, призыв и профили — всё из контента
  const fcards = page.locator('#footer .footer__card');
  await expect(fcards).toHaveCount(content.footer.groups.length);
  for (const [i, g] of content.footer.groups.entries()) {
    await expect(fcards.nth(i).locator('.footer__card-title a')).toHaveText(g.title);
    await expect(fcards.nth(i).locator('.footer__card-title a')).toHaveAttribute('href', g.href);
    const links = fcards.nth(i).locator('.footer__card-links a');
    await expect(links).toHaveCount(g.links.length);
    for (const [j, l] of g.links.entries()) {
      await expect(links.nth(j)).toHaveAttribute('href', l.href);
      await expect(links.nth(j)).toHaveText(l.label);
    }
  }
  const columns = page.locator('#footer .footer__column');
  await expect(columns).toHaveCount(content.footer.blocks.length);
  for (const [i, b] of content.footer.blocks.entries()) {
    await expect(columns.nth(i).locator('.footer__column-title')).toHaveText(b.title);
    if (b.links) {
      const links = columns.nth(i).locator('.footer__sublinks a');
      await expect(links).toHaveCount(b.links.length);
      for (const [j, l] of b.links.entries()) await expect(links.nth(j)).toHaveAttribute('href', l.href);
    }
  }
  await expect(page.locator('#footer .footer__btn')).toHaveAttribute('href', content.contact.href);
  await expect(page.locator('#footer .footer__btn')).toHaveText(content.contact.title);
  await expect(page.locator('#footer .footer__profile-link')).toHaveCount(content.footer.profiles.items.length);

  await expect(page.locator('a[href*="blog.aleksishmanov.ru"]')).toHaveCount(0);
  // без горизонтального скролла и с гаттером не меньше 16px.
  // Тёмная секция самопрезентации и панель футера на мобильном намеренно во всю ширину, поэтому проверяем
  // их содержимое, а не сами блоки: .intro__inner и .footer__grid держат тот же гаттер, что и светлые секции.
  const overflow = await page.evaluate(() => {
    const w = window.innerWidth;
    const bad = [];
    for (const el of document.querySelectorAll('#content .section *, #content .footer__grid *, #content .intro__inner *')) {
      const r = el.getBoundingClientRect();
      if (r.width && (r.left < 16 - 0.5 || r.right > w - 16 + 0.5)) bad.push(`${el.tagName}.${el.className} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    return { scrollW: document.documentElement.scrollWidth, w, bad };
  });
  expect(overflow.scrollW, 'горизонтальный скролл').toBeLessThanOrEqual(overflow.w);
  expect(overflow.bad, 'элементы за гаттером 16px').toEqual([]);
}

/**
 * На тёмной сцене — как у референса — ничего, кроме персонажа и подсказки: шапка (имя, Ask, меню) скрыта
 * и появится с белой сценой. Ссылка Ask уже из контента. toBeVisible() здесь не годится: Playwright считает
 * видимым и элемент с нулевой прозрачностью — проверяем класс и итоговую прозрачность.
 */
export async function expectAskOnDarkScene(page, content) {
  await expect(page.locator('#nav')).not.toHaveClass(/nav--visible/);
  await expect.poll(() => page.evaluate(() => +getComputedStyle(document.getElementById('nav')).opacity)).toBeLessThan(0.05);
  await expect(page.locator('#ask-scene')).toHaveAttribute('href', content.ask.href);
  await expect(page.locator('#ask-scene')).not.toHaveClass(/ask--visible/);
}

/**
 * На второй сцене: кнопка под пьедесталом показана (появляется с теглайном), шапка появилась (на телефоне её
 * роль у дока), кнопки Ask в шапке нет — как у референса; href из контента, новая вкладка.
 */
export async function expectAskButtons(page, content) {
  await expect(page.locator('#ask-scene')).toHaveClass(/ask--visible/);
  // шапка появляется с белой сценой (на тёмной её нет — expectAskOnDarkScene)
  await expect(page.locator('#nav')).toHaveClass(/nav--visible/);
  await expect(page.locator('#ask-nav')).toHaveCount(0);
  for (const id of ['#ask-scene']) {
    const btn = page.locator(id);
    await expect(btn).toBeVisible();
    await expect(btn).toHaveAttribute('href', content.ask.href);
    await expect(btn).toHaveAttribute('target', '_blank');
    await expect(btn).toContainText(content.ask.label);
  }
}

/** Меню закрыто: панель скрыта от скринридера и не в фокусе. */
export async function expectMenuClosed(page) {
  await expect(page.locator('#menu')).not.toHaveClass(/menu--open/);
  await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded', 'false');
}

/**
 * Открывает меню как посетитель. Десктоп: наведением на зону в углу (у эталона клик не нужен); мобильный: тап по кнопке дока.
 * Ждёт, пока доиграет анимация (menu--ready): до этого меню нельзя закрыть. Повторное открытие блокируется на 1,5 с после закрытия.
 */
export async function openMenu(page) {
  const menu = page.locator('#menu');
  const mobile = await page.evaluate(() => matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)').matches);
  if (mobile) {
    await page.locator('#menu-dock-toggle').click();
  } else {
    const { width } = page.viewportSize();
    for (let attempt = 0; attempt < 4; attempt++) {
      await page.mouse.move(width / 2, 300);
      await page.mouse.move(width - 35, 35, { steps: 4 });
      if (await menu.evaluate((el) => el.classList.contains('menu--open')).catch(() => false)) break;
      try { await expect(menu).toHaveClass(/menu--open/, { timeout: 800 }); break; } catch { await page.waitForTimeout(800); }
    }
  }
  await expect(menu).toHaveClass(/menu--open/);
  await expect(menu).toHaveClass(/menu--ready/, { timeout: 8_000 });
  await expect(page.locator('#menu-toggle')).toHaveAttribute('aria-expanded', 'true');
}
