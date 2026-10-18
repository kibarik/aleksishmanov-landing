import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const [out, ...specs] = process.argv.slice(2);
for (const spec of specs) {
  const [name, url, w, full] = spec.split(',');
  const p = await b.newPage({ viewport: { width: +w, height: 900 } });
  await p.goto('http://localhost:4174' + url, { waitUntil: 'networkidle' });
  console.log(name, await p.title(), 'sw', await p.evaluate(() => document.documentElement.scrollWidth));
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: full === '1' });
}
await b.close();
