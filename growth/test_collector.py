import tempfile
import json
import unittest
import uuid
from pathlib import Path
from collector import PAGES, connect, save, summary, validate

def event(visitor=None,test=False):
    return dict(event_id=str(uuid.uuid4()),visitor=visitor or str(uuid.uuid4()),session=str(uuid.uuid4()),page='explaining',event='engaged',target='',campaign={},test=test)

class CollectorTests(unittest.TestCase):
    def test_every_published_story_can_record_reading(self):
        stories = json.loads(Path(__file__).with_name('copy.json').read_text())
        self.assertEqual(PAGES, {'start'} | {story['slug'] for story in stories})
        for story in stories:
            data = event()
            data['page'] = story['slug']
            self.assertEqual(validate(data)['page'], story['slug'])
            data.update(event='chapter_click', target=str(story['chapter']))
            self.assertEqual(validate(data)['target'], str(story['chapter']))

    def test_private_fields_rejected(self):
        for field in ['question','email','birthDate']:
            data=event();data[field]='private'
            with self.assertRaises(ValueError): validate(data)
    def test_unknown_campaign_and_page_rejected(self):
        data=event();data['campaign']={'utm_source':'name@example.com'}
        with self.assertRaises(ValueError): validate(data)
        data=event();data['page']='private-chat'
        with self.assertRaises(ValueError): validate(data)
    def test_dedup_retention_and_mature_return(self):
        with tempfile.TemporaryDirectory() as d:
            db=connect(str(Path(d)/'data.sqlite'));now=1800000000
            first=event();save(db,first,now-10*86400);save(db,first,now-10*86400)
            save(db,event(first['visitor']),now-8*86400)
            save(db,event(),now-2*86400) # immature must not dilute denominator
            save(db,event(test=True),now)
            save(db,event(),now-40*86400)
            report=summary(db,now)
            self.assertEqual(report['mature_7_day_readers'],1)
            self.assertEqual(report['returning_1_to_7_day_readers'],1)
            self.assertEqual(report['observed_browser_counts']['engaged'],1)
            self.assertEqual(report['retained_rows'],4)
            self.assertIsNone(report['installs'])

if __name__=='__main__': unittest.main()
