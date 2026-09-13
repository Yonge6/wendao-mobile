import json
import re
import subprocess
import sys
import unittest
from pathlib import Path
from html.parser import HTMLParser
from search import schema

ROOT = Path(__file__).resolve().parents[1]

class Links(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.links=[]; self.canonical=[]; self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag=='a': self.links.append(attrs.get('href',''))
        if tag=='link' and attrs.get('rel')=='canonical': self.canonical.append(attrs['href'])

class SearchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        subprocess.run([sys.executable, str(ROOT/'growth/build.py')], check=True)

    def test_every_article_has_consistent_public_metadata_and_links(self):
        items=json.loads((ROOT/'growth/copy.json').read_text())
        for item in items:
            path='/situations/'+item['slug']+'/'
            page=(ROOT/'public'/path.lstrip('/')/'index.html').read_text()
            dom=Links(page)
            self.assertEqual(dom.canonical, ['https://wendao.wonderelian.com'+path])
            graph=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',page).group(1))['@graph']
            self.assertEqual(graph[0]['headline'], item['title'])
            self.assertEqual(graph[0]['mainEntityOfPage'],dom.canonical[0])
            self.assertIn('/about/',dom.links)
            for link in dom.links:
                if link.startswith('/situations/'):
                    self.assertTrue((ROOT/'public'/link.lstrip('/')/'index.html').is_file(), link)
        start=(ROOT/'public/start/index.html').read_text()
        data=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',start).group(1))
        self.assertEqual(data['@graph'][0]['mainEntity']['numberOfItems'],len(items))

    def test_schema_cannot_close_script_and_never_invents_dates(self):
        output=schema('</script><script>bad', 'x', '/situations/test/',item={'theme':'test'})
        self.assertEqual(output.count('</script>'),1)
        self.assertNotIn('datePublished',output)

if __name__=='__main__': unittest.main()
