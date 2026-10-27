// «Свежие материалы» под статьёй: три последних материала того же раздела, без текущего и без черновиков (CONTEXT.md).
export const FRESH_COUNT = 3;

export function freshMaterials(all, current, count = FRESH_COUNT) {
  return all
    .filter((x) => x.collection === current.collection && x.id !== current.id && !x.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id))
    .slice(0, count);
}
