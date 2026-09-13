"""Build public editorial pages. No model calls or private product data."""
import html
import hashlib
import json
from pathlib import Path
from search import ABOUT, AUTHOR, related, schema, structured

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
ITEMS = json.loads((ROOT / 'growth/copy.json').read_text())
ORIGIN = 'https://wendao.wonderelian.com'
esc = html.escape
SCRIPT_VERSION = hashlib.sha256((PUBLIC/'growth/reading.js').read_bytes()).hexdigest()[:12]
STYLE_VERSION = hashlib.sha256((PUBLIC/'growth/editorial.css').read_bytes()).hexdigest()[:12]

def shell(title, description, path, body, slug='start', metadata=''):
    return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · 三慢问道</title><meta name="description" content="{esc(description)}">
<link rel="canonical" href="{ORIGIN}{path}"><meta property="og:title" content="{esc(title)} · 三慢问道">
<meta property="og:description" content="{esc(description)}"><meta property="og:type" content="{'article' if path.startswith('/situations/') else 'website'}">
<meta property="og:url" content="{ORIGIN}{path}"><meta name="theme-color" content="#f7f1e6">
<meta property="og:site_name" content="三慢问道"><meta name="author" content="三慢问道">{metadata}
<link rel="stylesheet" href="/growth/editorial.css?v={STYLE_VERSION}"><script src="/growth/reading.js?v={SCRIPT_VERSION}" defer></script>
</head><body data-page="{slug}"><a class="skip" href="#main">跳到正文</a>
<header><a class="brand" href="/start/">三慢问道<span>WENDAO</span></a><a href="/?lang=zh" data-action="chapter_click">读今日一章 ↗</a></header>
<main id="main">{body}</main>
<footer><p>真实自己，流动人生。</p><nav><a href="/start/">生活里的道</a><a href="/about/">关于三慢问道与文本来源</a><a href="/privacy.html">隐私说明</a>{'<button id="analytics-choice" type="button" aria-pressed="false">关闭匿名阅读统计</button>' if slug != 'about' else ''}</nav>
<small>三慢问道创作记录 · AI 辅助编辑，引文经产品校读库核对。<br>生活解读是当代观察，不是古文逐字翻译。</small></footer></body></html>'''

cards = ''.join(f'''<a class="story" href="/situations/{i['slug']}/"><span class="number">{n+1:02d}</span><div><span class="eyebrow">{i['theme']}</span><h2>{i['title']}</h2><p>{i['teaser']}</p></div><span class="arrow" aria-hidden="true">↗</span></a>''' for n,i in enumerate(ITEMS))
start = f'''<section class="opening"><span class="eyebrow">把《道德经》读进真实生活</span><h1>生活里的道</h1><p class="intro">从一件小事，读懂一句经典。<br>带着此刻的处境，读一段，停一停。</p><span class="rule"></span><p class="small">{len(ITEMS)} 篇生活随笔 · 无需登录即可阅读</p></section><section aria-label="生活情境">{cards}</section><section class="quiet"><h2>读一章，也是在认识自己。</h2><p>三慢问道提供帛书乙本底本校读、逐句今译与生活启发。今日推荐章节免费，另可主动保留 10 章。</p><a class="button" href="/?lang=zh" data-action="chapter_click">读今日一章 <span>→</span></a><p class="small">完整章节买断与 AI 问道会员可按需选择。<br>AI 服务需会员；章节买断不含 AI。</p></section>'''
(PUBLIC/'start').mkdir(exist_ok=True)
(PUBLIC/'start/index.html').write_text(shell('生活里的道', '关系、选择、用力过度时，读一段《道德经》的生活解读。无需登录，先从与你有关的片刻开始。', '/start/', start, metadata=schema('生活里的道', '把《道德经》读进真实生活。', '/start/', items=ITEMS)))
for i in ITEMS:
    cid=i['chapter']; slug=i['slug']
    # Source excerpt is separate from original contemporary interpretation.
    paragraphs=''.join(f'<p>{esc(p)}</p>' for p in i['paragraphs'])
    date_note = ''.join(f' · {label} <time datetime="{esc(i[key])}">{esc(i[key][:10])}</time>' for key,label in [('datePublished','发布'),('dateModified','更新')] if i.get(key))
    body=f'''<a class="back" href="/start/">← 生活里的道</a><div class="article-head"><span class="eyebrow">{i['theme']} · 慢读约 3 分钟</span><h1>{i['title']}</h1><p class="byline"><a rel="author" href="/about/">三慢问道创作记录</a> · AI 辅助编辑{date_note}</p></div>
<article id="reading-body">{paragraphs}<blockquote><p>{i['quote']}</p><cite>《道德经》今本第 {cid} 章<br>帛书乙本底本校读 · 节选</cite></blockquote><section class="practice"><span class="eyebrow">留给今天的一点空间</span><p>{esc(i['practice'])}</p></section><span id="reading-end" aria-hidden="true"></span></article>
<section class="quiet"><h2>把这一刻，带回第 {cid} 章。</h2><p>继续看完整校读正文、逐句今译和本章的生活启发。</p><a class="button" data-action="chapter_click" href="/?chapter={cid}&lang=zh">继续读第 {cid} 章 <span>→</span></a><p class="small">今日推荐免费。其他章节可在剩余名额内主动保留，总计 10 章；名额用尽后仍可读今日推荐。</p><a class="download" data-action="store_click" href="/download.html?chapter={cid}&lang=zh">下载 App，方便每天回来 ↗</a><p class="small">AI 问道为会员服务，章节买断不含 AI。<br>实际价格以 App Store 显示为准。</p></section>'''
    out=PUBLIC/'situations'/slug;out.mkdir(parents=True,exist_ok=True)
    body += related(i, ITEMS)
    (out/'index.html').write_text(shell(i['title'],i['teaser'],f'/situations/{slug}/',body,slug, schema(i['title'],i['teaser'],f'/situations/{slug}/',item=i)))
(PUBLIC/'about').mkdir(exist_ok=True)
about_schema = structured({'@context':'https://schema.org','@graph':[AUTHOR, {'@type':'AboutPage','name':'关于三慢问道与文本来源','url':ORIGIN+'/about/','inLanguage':'zh-CN','about':{'@id':ORIGIN+'/about/#publisher'}}]})
(PUBLIC/'about/index.html').write_text(shell('关于三慢问道：阅读方法、文本来源与使用说明','了解三慢问道的帛书乙本阅读、AI 问道、免费范围、文章编辑方式及联系渠道。','/about/',ABOUT,'about',about_schema))
paths=['/','/start/','/about/']+[f'/situations/{i["slug"]}/' for i in ITEMS]
(PUBLIC/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join(f'<url><loc>{ORIGIN}{p}</loc></url>' for p in paths)+'</urlset>\n')
(PUBLIC/'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nDisallow: /__growth/event\nSitemap: '+ORIGIN+'/sitemap.xml\n')
print(f'Built start + {len(ITEMS)} editorial pages + sitemap')
