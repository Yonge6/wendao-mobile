"""Consented product events. Strict enums; no account or content payloads."""
import collections
import datetime as dt
import json
import math
import re
import time

EVENTS=set('visit active_time reading_time chapter_view section_view directory_open chance_chapter free_chapter_kept companion_open language_change theme_change reading_size_change profile_saved chart_calculated daily_notification_change app_store_action contact_click related_product_click companion_answer_share comic_open reflection_open story_open share_request share_result save_request save_result copy_result link_result chat_request chat_success chat_error chat_cancel chat_latency paywall_view purchase_request purchase_result restore_result search'.split())
VALUES=set('initial directory search chance continuation daily_notification reading_composer drawer reading verse meaning inspiration manual stories monthly annual lifetime purchased pending cancelled failed shared saved downloaded preview copied unavailable found empty download rate light dark small medium large zh en granted denied enabled disabled error transport quota auth other web ios contact human-design wonderelian yixiu xiazi style-atlas buer'.split())
UUID=re.compile(r'^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$')
FIELDS={'schema','event_id','visitor','session','event','surface','chapter','language','version','metadata','test'}

def validate(data):
    if not isinstance(data,dict) or set(data)!=FIELDS or type(data['schema']) is not int or data['schema']!=1: raise ValueError('fields')
    if any(not isinstance(data[k],str) or not UUID.fullmatch(data[k]) for k in ('event_id','visitor','session')): raise ValueError('ids')
    if data['event'] not in EVENTS or data['surface'] not in ('h5','ios') or data['language'] not in ('zh','en'): raise ValueError('event')
    if type(data['chapter']) is not int or not 0<=data['chapter']<=81 or type(data['test']) is not bool: raise ValueError('context')
    if not isinstance(data['version'],str) or not re.fullmatch(r'[a-zA-Z0-9._-]{1,32}',data['version']): raise ValueError('version')
    m=data['metadata']
    if not isinstance(m,dict) or not set(m)<={'source','section','result','plan','value','action','error_code','seconds'}: raise ValueError('metadata')
    for k,v in m.items():
        if k=='seconds':
            if type(v) not in (int,float) or not math.isfinite(v) or not 0<=v<=600 or data['event'] not in ('active_time','reading_time','chat_latency'): raise ValueError('seconds')
        elif not isinstance(v,str) or v not in VALUES: raise ValueError('enum')
    return data

def setup(db):
    db.execute('''CREATE TABLE IF NOT EXISTS usage_events(event_id TEXT PRIMARY KEY, visitor TEXT, session TEXT, event TEXT, surface TEXT, chapter INTEGER, language TEXT, version TEXT, metadata TEXT, test INTEGER, created INTEGER)''')
    db.execute('CREATE INDEX IF NOT EXISTS usage_created ON usage_events(created)')

def save(db,d,now=None):
    now=int(time.time() if now is None else now)
    with db:
        db.execute('DELETE FROM usage_events WHERE created<?',(now-30*86400,))
        db.execute('INSERT OR IGNORE INTO usage_events VALUES(?,?,?,?,?,?,?,?,?,?,?)',(d['event_id'],d['visitor'],d['session'],d['event'],d['surface'],d['chapter'],d['language'],d['version'],json.dumps(d['metadata']),int(d['test']),now))
        db.execute('DELETE FROM usage_events WHERE rowid IN (SELECT rowid FROM usage_events ORDER BY created DESC LIMIT -1 OFFSET 100000)')

def report(db,now=None):
    now=int(time.time() if now is None else now)
    zone=dt.timezone(dt.timedelta(hours=8));today=dt.datetime.fromtimestamp(now,zone).date();start=today-dt.timedelta(days=28)
    lo=int(dt.datetime.combine(start,dt.time(),zone).timestamp());hi=int(dt.datetime.combine(today,dt.time(),zone).timestamp())
    output={'product':'wendao','schemaVersion':1,'generatedAt':dt.datetime.fromtimestamp(now,dt.timezone.utc).isoformat(),'periodStart':str(start),'periodEnd':str(today-dt.timedelta(days=1)),'timezone':'Asia/Shanghai','surfaces':{}}
    for surface in ('h5','ios'):
        rows=db.execute('SELECT visitor,session,event,chapter,language,version,metadata,created FROM usage_events WHERE surface=? AND test=0 AND created>=? AND created<?',(surface,lo,hi)).fetchall()
        buckets=collections.defaultdict(list);days=collections.defaultdict(list);chapters=collections.defaultdict(list);outcomes=collections.Counter();versions=collections.Counter();languages=collections.Counter()
        for row in rows:
            visitor,session,event,chapter,lang,version,metadata,stamp=row;m=json.loads(metadata);item=(visitor,m)
            buckets[event].append(item);days[(str(dt.datetime.fromtimestamp(stamp,zone).date()),event)].append(item)
            if chapter:chapters[(chapter,event)].append(item)
            for dimension in ('result','section','plan','error_code','source','action'):
                if dimension in m:outcomes[(event,dimension,m[dimension])]+=1
            versions[version]+=1;languages[lang]+=1
        def metric(event,items):return {'event':'wendao_v1_'+event,'count':len(items),'users':len({x[0] for x in items}),'seconds':round(sum(x[1].get('seconds',0) for x in items),2) if event in ('active_time','reading_time','chat_latency') else None}
        output['surfaces'][surface]={'status':'collecting' if rows else 'waiting_for_events','source':'Wendao first-party consented aggregate','surface':surface,'hostname':'wendao.wonderelian.com' if surface=='h5' else None,'period_start':output['periodStart'],'period_end':output['periodEnd'],'verified_at':output['generatedAt'],'timezone':output['timezone'],'overview':{'totalUsers':len({r[0] for r in rows}) if rows else None,'sessions':len({r[1] for r in rows}) if rows else None},'events':[metric(k,v) for k,v in sorted(buckets.items())],'daily':[dict(date=d,**metric(e,v)) for (d,e),v in sorted(days.items())],'content':{'rows':[dict(chapter=ch,**metric(e,v)) for (ch,e),v in sorted(chapters.items())]},'outcomes':[{'event':'wendao_v1_'+e,'dimension':dim,'value':v,'count':n} for (e,dim,v),n in sorted(outcomes.items())],'versions':dict(versions),'languages':dict(languages),'retention':{'d1':None,'d7':None},'revenue':{'revenue':None,'paid_conversions':None},'limitations':['Consenting device IDs, not cross-device people','Latest 28 complete Shanghai days; today appears tomorrow','Maximum 100000 retained events; self-reported clients can be spoofed','No chat, birth, account or payment content','Purchase callbacks are not verified revenue']}
    return output
