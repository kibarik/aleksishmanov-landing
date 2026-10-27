import type { CollectionName } from './site';

/** Карточек на странице раздела: с 24 страница ~35 КБ HTML без сжатия — мобильный PageSpeed 100. */
export const PAGE_SIZE = 24;
/** Промты — каталог с категориями и якорями, кейсы — один список (CaseList): их не делим. */
export const paged = (section: CollectionName) => section !== 'prompts' && section !== 'cases';
export const pageCount = (n: number) => Math.max(1, Math.ceil(n / PAGE_SIZE));
/** Адрес страницы n раздела: первая — сам раздел, дальше /page/<n>/ (не пересекается со /<раздел>/<slug>/). */
export const pageHref = (path: string, n: number) => (n <= 1 ? path : `${path}page/${n}/`);
