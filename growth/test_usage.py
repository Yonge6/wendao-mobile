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
 def test_safe_entry_and_event_specific_targets(self):
  for source in ('reading_access_gate','header','header_search','conversation','daily','link'):
   usage.validate(event(event='directory_open',metadata={'source':source}))
  for name,targets in usage.TARGETS.items():
   for target in targets:usage.validate(event(event=name,metadata={'target':target}))
  for name,target in [('related_product_click','email'),('contact_click','buer'),('companion_open','wonderelian'),('visit','email'),('contact_click','Email'),('contact_click','person@example.com'),('related_product_click','https://buer.wonderelian.com/'),('contact_click',{})]:
   with self.assertRaises(ValueError):usage.validate(event(event=name,metadata={'target':target}))
  for source in ('monthly','person@example.com','https://example.com',{}):
   with self.assertRaises(ValueError):usage.validate(event(metadata={'source':source}))
  for value in ('received','silk'):usage.validate(event(event='directory_order_change',metadata={'value':value}))
  for value in ('comic','essay','all','chapter','theme'):usage.validate(event(event='story_filter',metadata={'source':'stories','value':value}))
  for result in ('cleared','failed'):usage.validate(event(event='comic_cache_clear',metadata={'result':result}))
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
 def test_target_source_and_restore_results_are_reported_without_private_identity(self):
  with tempfile.TemporaryDirectory() as folder:
   db=connect(str(Path(folder)/'events.db'));now=int(dt.datetime(2026,10,13,12,tzinfo=dt.timezone.utc).timestamp());old=now-86400
   for item in [event(event='contact_click',metadata={'target':'email'}),event(event='related_product_click',metadata={'target':'buer'}),event(event='companion_open',metadata={'source':'reading_access_gate','target':'subscription','plan':'annual'}),event(event='restore_result',surface='ios',metadata={'result':'found'}),event(event='contact_click',metadata={'target':'red'},test=True)]:
    usage.save(db,usage.validate(item),old)
   report=usage.report(db,now);outcomes=report['surfaces']['h5']['outcomes']
   self.assertIn({'event':'wendao_v1_contact_click','dimension':'target','value':'email','count':1},outcomes)
   self.assertIn({'event':'wendao_v1_related_product_click','dimension':'target','value':'buer','count':1},outcomes)
   self.assertIn({'event':'wendao_v1_companion_open','dimension':'source','value':'reading_access_gate','count':1},outcomes)
   self.assertNotIn('red',str(outcomes));self.assertNotIn(item['visitor'],str(report))
   self.assertEqual(report['surfaces']['ios']['outcomes'],[{'event':'wendao_v1_restore_result','dimension':'result','value':'found','count':1}])
if __name__=='__main__':unittest.main()
