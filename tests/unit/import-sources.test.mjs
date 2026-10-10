// Правила импорта материалов: node --test tests/unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, cleanTitle, describe, plain, similarity, postTitle, shorten, canon, isSameStory } from '../../tools/import-sources.mjs';

test('slugify: транслит, без эмодзи и знаков, обрезка по слову', () => {
  assert.equal(slugify('Хостинг для прототипов: Timeweb'), 'hosting-dlya-prototipov-timeweb');
  assert.equal(slugify('📊 Van Westendorp'), 'van-westendorp');
  assert.equal(slugify('щука и ёж'), 'schuka-i-ezh');
  assert.ok(slugify('очень '.repeat(30)).length <= 64);
  assert.equal(slugify('!!!'), 'post');
});

test('cleanTitle: убирает эмодзи, звёздочки и хвостовую пунктуацию', () => {
  assert.equal(cleanTitle('**📊 Van Westendorp: определение цены.**'), 'Van Westendorp: определение цены');
  assert.equal(cleanTitle('  Repowise   — граф кода:  '), 'Repowise — граф кода');
});

test('plain и describe: текст без разметки, обрезка по предложению', () => {
  assert.equal(plain('**Жирный** [ссылка](https://x.ru) ![](a.png) `код`'), 'Жирный ссылка код');
  const long = 'Первое предложение достаточно длинное, чтобы пройти порог в восемьдесят символов и больше. Второе предложение уже не влезет в лимит описания, потому что лимит маленький.';
  assert.equal(describe(long, 120), 'Первое предложение достаточно длинное, чтобы пройти порог в восемьдесят символов и больше.');
  assert.equal(describe('коротко'), 'коротко');
});

test('similarity: одинаковые тексты — 1, разные — около нуля, перестановка слов — высоко', () => {
  assert.equal(similarity('абв где', 'абв где'), 1);
  assert.ok(similarity('совсем другой текст', 'zzzz yyyy') < 0.1);
  assert.ok(similarity('разбор nacre для команды разработки', 'разбор nacre для команды разработки!') > 0.9);
});

test('postTitle: короткая первая строка, длинная — до первой паузы, голая ссылка на репозиторий — владелец/репозиторий', () => {
  assert.equal(postTitle('**📊 Van Westendorp: определение цены**\n\nтекст'), 'Van Westendorp: определение цены');
  assert.equal(postTitle('https://github.com/CodeAbra/iai-personal-memory-engine\n\nТоже пусть тут лежит'), 'CodeAbra/iai-personal-memory-engine');
  assert.equal(postTitle('https://productframework.ru/ops/main\n\nФреймворки для развития продуктовой команды'), 'Фреймворки для развития продуктовой команды');
  assert.equal(postTitle('Кладбище стартапов — это сервисы и базы, где собирают истории провалившихся компаний, их ошибки и выводы для основателей'), 'Кладбище стартапов');
  // обрезанный сборщиком заголовок заменяется полной первой строкой
  assert.equal(postTitle('Gabor–Granger: измеряет вероятность покупки', 'Gabor–Granger: измеряет'), 'Gabor–Granger: измеряет вероятность покупки');
});

test('shorten: без пауз — обрезка по слову с многоточием', () => {
  const t = 'слово '.repeat(30).trim();
  assert.ok(shorten(t).endsWith('…'));
  assert.ok(shorten(t).length <= 81);
});

test('canon: YouTube различает видео, utm и якорь отбрасываются', () => {
  assert.notEqual(canon('https://www.youtube.com/watch?v=aaa'), canon('https://www.youtube.com/watch?v=bbb'));
  assert.equal(canon('https://www.site.ru/a/?utm_source=tg#x'), 'https://site.ru/a');
  assert.equal(canon('https://github.com/x/y?tab=readme-ov-file'), 'https://github.com/x/y');
});

test('isSameStory: одинаковый пост в двух каналах — да, подборка с той же ссылкой — нет', () => {
  const kagent = { title: 'Kagent - OpenSource платформа', body: 'Kagent — платформа для агентов в Kubernetes, умеет многое' };
  assert.ok(isSameStory(kagent, { ...kagent }));
  const tool = { title: 'Continue.dev', body: 'Continue — open source ассистент для IDE, подключает любые модели' };
  const roundup = { title: 'Cursor for [domain] IDE', body: 'Подборка: void, onlook, continue и ещё пять редакторов с ИИ для своих доменов' };
  assert.equal(isSameStory(tool, roundup), false);
});
