import tempfile,unittest,uuid,datetime as dt
from pathlib import Path
import usage
from collector import connect

def event(**kw):
 d=dict(schema=1,event_id=str(uuid.uuid4()),visitor=str(uuid.uuid4()),session=str(uuid.uuid4()),event='visit',surface='h5',chapter=32,language='zh',version='web',metadata={},test=False);d.update(kw);return d
class UsageTests(unittest.TestCase):
 def test_strict_private_fields_and_numbers(self):
  for patch in [dict(question='private'),dict(metadata={'name':'person'}),dict(metadata={'value':'email@example.com'}),dict(chapter=82),dict(surface='web'),dict(metadata={'seconds':float('nan')}),dict(event='chat_success',metadata={'seconds':1}),dict(test='false')]:
   with self.assertRaises(ValueError):usage.validate(event(**patch))
  usage.validate(event(event='chat_latency',metadata={'seconds':1.7}))
 def test_dedup_surface_test_today_and_outcomes(self):
  with tempfile.TemporaryDirectory() as folder:
   db=connect(str(Path(folder)/'events.db'));now=int(dt.datetime(2026,10,2,12,tzinfo=dt.timezone.utc).timestamp());old=now-86400;e=event();usage.save(db,e,old);usage.save(db,e,old)
   usage.save(db,event(visitor=e['visitor'],event='reading_time',metadata={'seconds':20}),old)
   usage.save(db,event(event='save_result',surface='ios',metadata={'result':'preview'}),old)
   usage.save(db,event(test=True),old);usage.save(db,event(),now)
   r=usage.report(db,now);self.assertEqual(r['surfaces']['h5']['overview']['totalUsers'],1);self.assertEqual(r['surfaces']['ios']['events'][0]['count'],1)
   self.assertEqual(r['surfaces']['h5']['events'][0]['seconds'],20);self.assertEqual(r['surfaces']['ios']['outcomes'][0]['value'],'preview')
   self.assertNotIn(e['visitor'],str(r));self.assertIsNone(r['surfaces']['ios']['retention']['d1'])
 def test_missing_is_null(self):
  with tempfile.TemporaryDirectory() as folder:
   r=usage.report(connect(str(Path(folder)/'events.db')))
   self.assertIsNone(r['surfaces']['h5']['overview']['totalUsers'])
if __name__=='__main__':unittest.main()
