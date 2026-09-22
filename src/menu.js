/**
 * Меню-оффканвас: якоря по секциям и ссылки на ресурсы (всё из модуля контента).
 * Открывается кнопкой в шапке, закрывается крестиком, кликом вне, Escape и после перехода по якорю.
 * Пока меню открыто, липкий скролл не принимает жесты; клик по якорю сначала отпускает сцену.
 */

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

function markup(content) {
  const { menu, resources } = content;
  return `
    <div class="menu__overlay" id="menu-overlay"></div>
    <nav class="menu__panel" aria-label="${esc(menu.title)}">
      <button class="menu__close" id="menu-close" type="button" aria-label="Закрыть меню">
        <span></span><span></span>
      </button>
      <ul class="menu__anchors">
        ${menu.anchors.map((a) => `<li><a class="menu__anchor" href="${esc(a.href)}">${esc(a.label)}</a></li>`).join('')}
      </ul>
      <div class="menu__footer">
        <p class="menu__footer-title">${esc(menu.resourcesTitle)}</p>
        <ul class="menu__resources">
          ${resources.map((r) => `<li><a class="menu__resource" href="${esc(r.href)}" target="_blank" rel="noopener noreferrer">${esc(r.label)}<span aria-hidden="true"> ↗</span></a></li>`).join('')}
        </ul>
      </div>
    </nav>`;
}

/**
 * @param root контейнер меню (#menu)
 * @param toggle кнопка в шапке
 * @param sticky липкий скролл: release() и state.released
 */
export function mountMenu(root, toggle, content, sticky) {
  root.innerHTML = markup(content);
  const close = root.querySelector('#menu-close');
  const overlay = root.querySelector('#menu-overlay');
  let open = false;

  function setOpen(next) {
    if (open === next) return;
    open = next;
    root.classList.toggle('menu--open', open);
    document.body.classList.toggle('is-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    root.setAttribute('aria-hidden', String(!open));
    sticky.setPaused(open); // жесты не проваливаются в сцену за панелью
    (open ? close : toggle).focus();
  }

  toggle.addEventListener('click', () => setOpen(!open));
  close.addEventListener('click', () => setOpen(false));
  overlay.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !open) return;
    e.stopPropagation(); // иначе клавиша уйдёт в обработчик липкого скролла
    setOpen(false);
  }, { capture: true });

  for (const a of root.querySelectorAll('.menu__anchor')) {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(false);
      // сцена ещё липкая: сначала отдаём нативный скролл, потом ведём к секции
      if (!sticky.state.released) sticky.release();
      const target = document.querySelector(a.getAttribute('href'));
      requestAnimationFrame(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
  }

  return { get open() { return open; }, close: () => setOpen(false) };
}
