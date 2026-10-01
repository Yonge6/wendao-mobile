import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const stories = JSON.parse(readFileSync(new URL('../growth/copy.json', import.meta.url)));
const english = JSON.parse(readFileSync(new URL('../growth/copy-en.json', import.meta.url)));

test('published comics have unique chapter styles, complete originals and matching public articles', () => {
  const comics = stories.filter(s => s.comic);
  assert.ok(comics.length >= 9);
  assert.equal(new Set(comics.map(s => s.chapter)).size, comics.length);
  const styles = comics.map(s => new URL(s.comic.style.url).searchParams.get('style'));
  assert.equal(new Set(styles).size, comics.length);
  for (const story of comics) {
    const c = story.comic;
    const png = readFileSync(new URL(`../public${c.original}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), c.width);
    assert.equal(png.readUInt32BE(20), c.height);
    assert.ok(c.height >= 3000);
    assert.ok(readFileSync(new URL(`../public${c.image}`, import.meta.url)).length > 10000);
    assert.equal(new URL(c.style.url).hostname, 'style-atlas.wonderelian.com');
    const html = readFileSync(new URL(`../public/situations/${story.slug}/index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes(c.image), story.slug);
    assert.ok(html.includes(c.original), story.slug);
    assert.ok(html.includes('查看漫画解读'), story.slug);
  }
});

test('English comic editions have their own complete PNG, WebP and English canonical article', () => {
  for (const [slug, story] of Object.entries(english)) {
    if (!story.comic) continue;
    const source = stories.find(s => s.slug === slug);
    assert.ok(source?.comic, slug);
    const c = story.comic;
    assert.notEqual(c.original, source.comic.original);
    assert.notEqual(c.image, source.comic.image);
    const png = readFileSync(new URL(`../public${c.original}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), c.width);
    assert.equal(png.readUInt32BE(20), c.height);
    assert.ok(c.height >= 3000);
    assert.ok(readFileSync(new URL(`../public${c.image}`, import.meta.url)).length > 10000);
    const html = readFileSync(new URL(`../public/situations/${slug}/en/index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes('<html lang="en">'), slug);
    assert.ok(html.includes(c.image), slug);
    assert.ok(html.includes(c.original), slug);
    assert.ok(html.includes(`rel="canonical" href="https://wendao.wonderelian.com/situations/${slug}/en/"`), slug);
    assert.ok(html.includes('Read the comic reflection'), slug);
  }
});
