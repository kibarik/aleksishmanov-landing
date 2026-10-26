// Кейсы: подписи и порядок, общие для списка на /cases/, страницы кейса и её Markdown-копии.
// .mjs, а не .ts: функции проверяет node --test (tests/unit/cases.test.mjs) без сборки.

/** Годы кейса: «2018 — 2019», «2020», «2024 — сейчас». */
export function yearsLabel({ from, to }) {
  if (to === undefined) return `${from} — сейчас`;
  return from === to ? String(from) : `${from} — ${to}`;
}

/** Порядок списка: поле order, при равенстве — новее раньше. */
export const byOrder = (a, b) => a.data.order - b.data.order || b.data.date.valueOf() - a.data.date.valueOf();

/** Факты кейса строками Markdown — для /cases/<slug>.md и llms-full: цифры не должны теряться (docs/content/seo-geo.md). */
export function caseFactsMarkdown(c) {
  return [
    `- Годы: ${yearsLabel(c.years)} · ${c.kind}`,
    `- Роль: ${c.role}`,
    `- Контекст: ${c.context}`,
    ...c.metrics.map((x) => `- ${x.label}: ${x.value}`),
    `- Шаги: ${c.steps.join('; ')}`,
    ...(c.stack.length ? [`- Стек: ${c.stack.join(', ')}`] : []),
  ].join('\n');
}
