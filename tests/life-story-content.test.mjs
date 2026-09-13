import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const stories = read('../growth/copy.json');
const chapters = read('../src/data/chapters.json');

test('every chapter has complete distinct essays with exact edition quotes and published full text', () => {
  assert.deepEqual([...new Set(stories.map(s => s.chapter))].sort((a,b) => a-b), Array.from({length:81}, (_,i) => i+1));
  assert.equal(new Set(stories.map(s => s.slug)).size, stories.length);
  assert.equal(new Set(stories.map(s => s.title)).size, stories.length);
  const paragraphs = stories.flatMap(s => s.paragraphs);
  assert.equal(new Set(paragraphs).size, paragraphs.length);
  for (const story of stories) {
    assert.match(story.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    const chapter = chapters.find(c => c.id === story.chapter);
    assert.ok(chapter.zh.reconstructedVerse.join('').includes(story.quote), story.slug);
    assert.ok(story.paragraphs.length >= 4, story.slug);
    assert.ok(story.paragraphs.join('').length >= 260, story.slug);
    assert.ok(story.practice.length >= 25, story.slug);
    const html = readFileSync(new URL(`../public/situations/${story.slug}/index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes(story.title), story.slug);
    for (const text of story.paragraphs) assert.ok(html.includes(text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;')), story.slug);
  }
});
