"""Build English editions from reviewed translations; no model or network calls."""
import hashlib
import html
import json


def build_english(root, items):
    public = root / 'public'
    translations = json.loads((root / 'growth/copy-en.json').read_text())
    origin = 'https://wendao.wonderelian.com'
    esc = html.escape
    versions = {name: hashlib.sha256((public / path).read_bytes()).hexdigest()[:12] for name, path in {
        'css': 'growth/editorial.css', 'js': 'growth/reading.js', 'banner': 'download/app-banner.js'
    }.items()}

    def shell(title, description, path, body, slug='start', chinese='/start/'):
        return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · Wendao</title><meta name="description" content="{esc(description)}">
<link rel="canonical" href="{origin}{path}"><link rel="alternate" hreflang="en" href="{origin}{path}"><link rel="alternate" hreflang="zh-CN" href="{origin}{chinese}">
<meta property="og:title" content="{esc(title)} · Wendao"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{origin}{path}"><meta property="og:type" content="article"><meta property="og:locale" content="en_US"><meta name="theme-color" content="#f7f1e6">
<link rel="stylesheet" href="/growth/editorial.css?v={versions['css']}"><link rel="stylesheet" href="/download/app-banner.css?v=20261001"><script src="/download/app-banner.js?v={versions['banner']}" defer></script><script src="/growth/reading.js?v={versions['js']}" defer></script>
</head><body data-page="{slug}"><a class="skip" href="#main">Skip to content</a>
<header><a class="brand" href="/start/en/">Wendao<span>TAO IN EVERYDAY LIFE</span></a><a href="{chinese}" lang="zh-CN">中文</a><a href="/?lang=en" data-action="chapter_click">Read today's chapter ↗</a></header>
<main id="main">{body}</main><footer><p>True to yourself. Flow with life.</p><nav><a href="/start/en/">Tao in everyday life</a><a href="/about/">Sources and editorial approach (Chinese)</a><a href="/privacy.html">Privacy</a><button id="analytics-choice" type="button" aria-pressed="false">Turn off anonymous reading statistics</button></nav><small>Wendao editorial · AI-assisted editing.<br>Contemporary reflections, not line-by-line translations of the original.</small></footer></body></html>'''

    paths = []
    cards = []
    for source in items:
        slug = source['slug']
        if slug not in translations:
            continue
        entry = translations[slug]
        cid = source['chapter']
        path = f'/situations/{slug}/en/'
        chinese = f'/situations/{slug}/'
        paragraphs = ''.join(f'<p>{esc(p)}</p>' for p in entry['paragraphs'])
        reflection = f'''{paragraphs}<blockquote><p>{esc(entry['quote'])}</p><cite>Daodejing · Chapter {cid}<br>English rendering of the Silk B base reading excerpt</cite></blockquote><section class="practice"><span class="eyebrow">A little room for today</span><p>{esc(entry['practice'])}</p></section>'''
        comic_html = ''
        if comic := entry.get('comic'):
            for field in ('image', 'original'):
                assert (public / comic[field].lstrip('/')).is_file(), f'Missing English {field}: {slug}'
            style = source['comic']['style']
            from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
            split = urlsplit(style['url']); query = dict(parse_qsl(split.query)); query['lang'] = 'en'
            style_url = urlunsplit(split._replace(query=urlencode(query)))
            comic_html = f'''<figure style="margin:0 0 24px"><a href="{esc(comic['original'])}" target="_blank" rel="noopener" aria-label="Read comic in detail"><img src="{esc(comic['image'])}" width="{comic['width']}" height="{comic['height']}" alt="{esc(entry['comicAlt'])}" style="display:block;width:100%;height:auto" fetchpriority="high"></a><figcaption class="small"><a href="{esc(style_url)}" target="_blank" rel="noopener noreferrer">Image style: {esc(style['nameEn'])} ↗</a></figcaption></figure><p><a class="button" href="{esc(comic['original'])}" download="wendao-story-{slug}-en.png">Save complete comic ↓</a></p>'''
            reflection = '<details><summary style="cursor:pointer;margin:24px 0">Read the comic reflection</summary>' + reflection + '</details>'
        body = f'''<a class="back" href="/start/en/">← Tao in everyday life</a><div class="article-head"><span class="eyebrow">{esc(entry['theme'])} · A 3-minute pause</span><h1>{esc(entry['title'])}</h1><p class="byline">Wendao editorial · AI-assisted editing</p></div><article id="reading-body">{comic_html}{reflection}<span id="reading-end" aria-hidden="true"></span></article><section class="quiet"><h2>Bring this moment back to chapter {cid}.</h2><p>Read the complete chapter, its meaning and reflections for everyday life.</p><a class="button" data-action="chapter_click" href="/?chapter={cid}&amp;section=stories&amp;lang=en">Read chapter {cid} →</a><p class="small">Today's recommended chapter is free. You may also keep 10 chapters of your choice for free.</p><a class="download" data-action="store_click" href="/download.html?chapter={cid}&amp;lang=en">Get the app ↗</a></section>'''
        out = public / path.lstrip('/'); out.mkdir(parents=True, exist_ok=True)
        (out / 'index.html').write_text(shell(entry['title'], entry['teaser'], path, body, slug, chinese))
        cards.append(f'<a class="story" href="{path}"><span class="number">{cid:02d}</span><div><span class="eyebrow">{esc(entry["theme"])}</span><h2>{esc(entry["title"])}</h2><p>{esc(entry["teaser"])}</p></div><span class="arrow" aria-hidden="true">↗</span></a>')
        paths.append(path)
    if paths:
        out = public / 'start/en'; out.mkdir(parents=True, exist_ok=True)
        body = '<section class="opening"><span class="eyebrow">The Daodejing in everyday life</span><h1>Tao in everyday life</h1><p class="intro">Small moments, timeless words.<br>Read, pause, and bring your own experience.</p></section><section>' + ''.join(cards) + '</section>'
        (out / 'index.html').write_text(shell('Tao in everyday life', 'Everyday stories and reflections on the Daodejing.', '/start/en/', body))
        paths.append('/start/en/')
    return paths
