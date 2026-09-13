"""Search metadata shared by the public editorial builder."""
import json
from html import escape

ORIGIN = 'https://wendao.wonderelian.com'
AUTHOR = {'@type': 'Organization', '@id': ORIGIN+'/about/#publisher', 'name': '三慢问道', 'url': ORIGIN+'/about/'}

def structured(data):
    return '<script type="application/ld+json">'+json.dumps(data, ensure_ascii=False).replace('<', '\\u003c')+'</script>'

def breadcrumbs(title, path):
    entries = [('三慢问道', '/'), ('生活里的道', '/start/')]
    if path != '/start/': entries.append((title, path))
    return {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':n+1,'name':name,'item':ORIGIN+p} for n,(name,p) in enumerate(entries)]}

def schema(title, description, path, item=None, items=()):
    page = {'@type':'BlogPosting' if item else 'CollectionPage', '@id':ORIGIN+path+'#article' if item else ORIGIN+path+'#page', 'url':ORIGIN+path, 'headline':title, 'description':description, 'inLanguage':'zh-CN', 'author':AUTHOR, 'publisher':AUTHOR}
    if item:
        page.update(mainEntityOfPage=ORIGIN+path, articleSection=item['theme'], isAccessibleForFree=True)
        # Only output dates explicitly maintained with the article, never the build date.
        for key in ('datePublished', 'dateModified'):
            if item.get(key): page[key]=item[key]
    else:
        page['mainEntity']={'@type':'ItemList','numberOfItems':len(items),'itemListElement':[{'@type':'ListItem','position':n+1,'name':i['title'],'url':ORIGIN+'/situations/'+i['slug']+'/'} for n,i in enumerate(items)]}
    return structured({'@context':'https://schema.org','@graph':[page,breadcrumbs(title,path)]})

def related(item, items):
    candidates = [i for i in items if i['slug'] != item['slug']]
    candidates.sort(key=lambda i: (i['theme'] != item['theme'], i['chapter'] != item['chapter']))
    links=''.join('<li><a href="/situations/'+escape(i['slug'])+'/">'+escape(i['title'])+'</a></li>' for i in candidates[:3])
    return '<section class="quiet"><h2>还可以慢慢读</h2><ul class="related">'+links+'</ul></section>'

ABOUT = '''<a class="back" href="/start/">← 生活里的道</a><div class="article-head"><span class="eyebrow">三慢问道 · WENDAO</span><h1>读经典，也读自己</h1><p class="byline">产品与编辑说明 · 更新于 2026 年 9 月 13 日</p></div>
<article>
<h2>三慢问道是什么？</h2><p>三慢问道是永歌 Elian 创作的《道德经》阅读与 AI 反思产品，提供 H5 网页和 iPhone、iPad App。以马王堆帛书乙本为主要底本，提供 81 章校读、拼音、逐句今译和生活启发。AI 问道结合当前章节与持续对话，帮助你观察处境；它是受经典启发的 AI，不是老子本人。</p>
<h2>从哪里开始读？</h2><p>打开<a href="/?lang=zh">阅读首页</a>即可读今日推荐章节，无需登录。另可主动保留 10 章免费阅读；浏览目录和搜索不会消耗名额。想从生活问题进入，可以读<a href="/start/">生活里的道</a>：文章免费公开，收录关系、选择、休息与经典阅读的完整随笔。</p>
<h2>原文、校读和生活解读有什么区别？</h2><p>产品分开呈现乙本转写、校读正文与现代解读。残缺处参考帛书甲本及王弼本等传世见证，校补字以〔〕标出。校读正文不是帛书原件的完整摹写，逐句今译也包含理解上的选择。文章里的现实案例与练习是当代解读，不是古文逐字翻译。需要核对引文时，请打开文章对应章节，查看完整上下文与文本层次。</p>
<h2>文章由谁写，怎样核对？</h2><p>「生活里的道」由三慢问道作为创作方发布，使用 AI 辅助起草与编辑。发布流程核对产品校读库中的引文、对应章节、权益表述和文章完整性；这不等同于独立学术审稿。发现错误会修订原文并保留链接，实质修订记录更新日期。有关版本的学术问题仍应结合可靠整理本与原始材料查证。</p>
<h2>哪些内容免费，AI 怎样使用？</h2><p>今日推荐和主动保留的 10 章免费。App 内月度或年度会员包含全部 81 章阅读与 AI 问道；单独买断全部章节只包含阅读，不含 AI。AI 需要登录与有效会员，没有免费试用。价格以 App Store 实际显示为准。H5 的「生活里的道」公开文章不要求购买。</p>
<h2>App 和 H5 内容相同吗？</h2><p>两者采用同一产品章节库，网页文章可以持续更新；新栏目和界面功能可能先在 H5 上线。App 的实际功能以当前安装版本与商店说明为准。</p>
<h2>关于 AI 与个人信息</h2><p>AI 回应可能出错，不替你作决定。记忆可检查、修改、暂停或删除；停用记忆不会自动删除原来的对话记录。请勿在提问或分享中暴露他人的私人信息。详见<a href="/privacy.html">隐私说明</a>。</p>
<h2>联系与纠错</h2><p>产品支持与内容纠错：<a href="mailto:hustyy986@gmail.com">hustyy986@gmail.com</a>。来信可提供文章链接、章节与具体问题。创作者的其他作品见 <a href="https://wonderelian.com/">WonderElian</a>。</p>
<p lang="en">Wendao is a Daodejing reading and AI reflection app by Elian. Read the Mawangdui-based text with pinyin and line-by-line meaning. Today's chapter and 10 chapters you choose are free; AI requires membership. Our Chinese everyday essays are free to read on the web.</p>
</article><section class="quiet"><a class="button" href="/?lang=zh">开始读今日一章 →</a><a href="/download.html?lang=zh">在 App Store 下载三慢问道 ↗</a></section>'''
