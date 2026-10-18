// Методология (ADR 0006): дерево узлов «проблема → области → темы» и связь узлов с материалами.
// Связь хранится в узле (`materials: ["blog/<slug>"]`), обратные ссылки для страниц материалов строятся здесь.
import { getCollection, type CollectionEntry } from 'astro:content';
import { listAll, type Material } from './materials';

export type MethodNode = CollectionEntry<'method'>;

export const METHOD_PATH = '/method/';

/** Адрес узла: корень — /method/, остальные — /method/<slug>/. */
export const nodeUrl = (n: MethodNode) => (n.data.level === 'problem' ? METHOD_PATH : `${METHOD_PATH}${n.id}/`);

/** У узла есть собственная страница (planned живут только на карте). */
export const hasPage = (n: MethodNode) => n.data.level === 'problem' || n.data.status !== 'planned';

export const STATUS_LABEL: Record<MethodNode['data']['status'], string> = { ready: 'готово', draft: 'каркас', planned: 'в работе' };

const byOrder = (a: MethodNode, b: MethodNode) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title);

export async function allNodes(): Promise<MethodNode[]> {
  return (await getCollection('method')).sort(byOrder);
}

export async function root(): Promise<MethodNode> {
  const r = (await allNodes()).find((n) => n.data.level === 'problem');
  if (!r) throw new Error('методология: нет корневого узла level: problem');
  return r;
}

export const childrenOf = (nodes: MethodNode[], id: string) => nodes.filter((n) => n.data.parent === id).sort(byOrder);

/** Цепочка от корня до узла (без самого узла). */
export function ancestors(nodes: MethodNode[], n: MethodNode): MethodNode[] {
  const chain: MethodNode[] = [];
  let cur = nodes.find((x) => x.id === n.data.parent);
  while (cur) { chain.unshift(cur); cur = nodes.find((x) => x.id === cur!.data.parent); }
  return chain;
}

const key = (m: { collection: string; id: string }) => `${m.collection}/${m.id}`;

/** Материалы узла в порядке, заданном в узле. */
export async function materialsOf(n: MethodNode): Promise<Material[]> {
  const all = await listAll();
  const index = new Map(all.map((m) => [key(m), m]));
  return n.data.materials.map((k) => index.get(k)).filter((m): m is Material => Boolean(m));
}

/** Узлы, к которым прикреплён материал, — для блока «Часть методологии» на странице материала. */
export async function nodesOfMaterial(m: { collection: string; id: string }): Promise<{ node: MethodNode; path: MethodNode[] }[]> {
  const nodes = await allNodes();
  const k = key(m);
  return nodes
    .filter((n) => n.data.materials.includes(k))
    .map((node) => ({ node, path: ancestors(nodes, node).filter((a) => a.data.level !== 'problem') }));
}

/** Markdown → обычный текст: ссылки, выделение, код. */
const plain = (md: string) => md.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]+/g, '').replace(/\s+/g, ' ').trim();

/** Первый абзац каждого раздела «## Шаг N. …» — короткое описание узла диаграммы на сквозной странице. */
export function stepNotes(n: MethodNode): Record<number, string> {
  const notes: Record<number, string> = {};
  for (const m of (n.body ?? '').matchAll(/^##\s+Шаг\s+(\d+)[^\n]*\n+([\s\S]*?)(?=\n\n|\n##|$)/gm)) {
    const para = m[2].trim();
    if (para && !/^[|`>-]/.test(para)) notes[Number(m[1])] = plain(para);
  }
  return notes;
}

export type Role = NonNullable<MethodNode['data']['role']>;
/** Области по месту в процессе: стадии по номеру, затем основания и ответвления. */
export function byRole(nodes: MethodNode[], role: Role): MethodNode[] {
  return nodes.filter((n) => n.data.level === 'area' && n.data.role === role).sort((a, b) => (a.data.stage ?? a.data.order) - (b.data.stage ?? b.data.order));
}
