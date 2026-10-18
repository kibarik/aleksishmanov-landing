// «Обо мне» на /about/: те же данные, что секция на главной (src/content.js → content.about), и то же правило —
// пустой блок не выводится: нет пунктов у карьерного пути или образования, нет фразы у последнего года.
// .mjs, а не .ts: функции проверяет node --test (tests/unit/about-page.test.mjs) без сборки.

/** Блоки страницы; пустые — null, страница их не рисует. */
export function aboutBlocks({ facts = [], career, education, lastYear, cases }) {
  const list = (b) => (b?.items?.length ? b : null);
  return {
    facts,
    career: list(career),
    education: list(education),
    lastYear: lastYear?.lead ? { metrics: [], points: [], ...lastYear } : null,
    cases,
  };
}

/** Заголовок строки пути: роль и компания; у образования роли нет — только организация. */
export function pathHead({ role = '', org = '' }) {
  return { main: role || org, org: role ? org : '' };
}
