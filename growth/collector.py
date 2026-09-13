"""Small first-party event collector; bind only to loopback behind Wendao nginx."""
import argparse
import collections
import datetime as dt
import json
import os
import re
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PAGES = {'rediscover-your-own-neighborhood', 'keep-the-goal-out-of-your-anger', 'credit-the-quiet-work', 'help-without-taking-over', 'trust-built-in-small-things', 'start', 'help-without-becoming-indispensable', 'less-supervision', 'the-work-beneath-a-result', 'let-the-work-cook', 'a-label-is-not-a-whole-person', 'remember-why-you-started', 'reversible-decision', 'review-a-repeating-week', 'boundaries', 'shopping-after-scrolling', 'make-it-easy-to-disagree', 'a-soft-voice-with-a-clear-boundary', 'show-one-useful-step', 'room-to-rest', 'a-rule-people-can-understand', 'after-a-piece-of-praise', 'an-honest-progress-update', 'fewer-rules-more-clarity', 'change-a-plan-while-it-is-alive', 'understand-one-familiar-place', 'disagree-gently', 'leave-room-for-the-unexpected', 'a-gathering-without-performance', 'before-sending-the-angry-message', 'a-hobby-without-a-score', 'the-shortcut-still-needs-work', 'let-some-things-stay-unexplained', 'what-a-new-opportunity-costs', 'give-a-new-routine-time', 'the-stronger-side-can-listen-first', 'finishing-carefully', 'beginner-again', 'start-with-the-promise-you-own', 'useful-before-perfect', 'self-respect-without-a-defense', 'repair-after-mistake', 'quiet-work-still-has-value', 'return-to-what-worked', 'leave-room-in-conversation', 'comparing', 'find-another-use', 'courage-to-say-not-yet', 'one-knot-at-a-time', 'leave-an-avoidable-risk', 'yield-on-the-method', 'a-weekend-of-your-own', 'honest-without-being-harsh', 'choosing', 'resolve-without-an-extra-blow', 'finishing', 'slower-while-learning', 'stop-standing-on-tiptoe', 'help-where-the-load-is-heaviest', 'let-an-upgrade-wait', 'without-an-answer', 'care-beyond-family-slogans', 'a-pace-after-enthusiasm', 'saying-no', 'after-winning-an-argument', 'enough-for-today', 'explaining', 'do-not-answer-outside-your-role', 'a-method-that-fits-your-day', 'finish-a-meal-without-feeds', 'leave-a-way-to-make-amends', 'look-at-the-load-before-blame', 'notice-the-present-details', 'waiting-for-reply', 'ask-how-they-want-help', 'remove-one-extra-goal', 'a-gift-without-a-hidden-task', 'different-strengths', 'listen-before-giving-expertise', 'letting-go-of-cost', 'support-a-childs-choice', 'substance-before-a-good-image', 'care-within-your-means', 'first-small-step', 'reading-a-difficult-line', 'save-some-energy-for-tomorrow', 'a-relationship-without-new-events', 'keep-a-small-ritual'}
EVENTS = {'view', 'engaged', 'chapter_click', 'store_click'}
UUID = re.compile(r'^[a-f0-9-]{36}$')
CAMPAIGN_KEYS = {'utm_source', 'utm_medium', 'utm_campaign', 'utm_content'}

def validate(data):
    if not isinstance(data, dict) or set(data) != {'event_id','visitor','session','page','event','target','campaign','test'}:
        raise ValueError('invalid_fields')
    for key in ('event_id', 'visitor', 'session'):
        if not isinstance(data[key],str) or not UUID.fullmatch(data[key]): raise ValueError('invalid_id')
    if data['page'] not in PAGES or data['event'] not in EVENTS: raise ValueError('invalid_event')
    if data['target'] not in {'', 'daily'} | {str(i) for i in range(1, 82)}: raise ValueError('invalid_target')
    if type(data['test']) is not bool: raise ValueError('invalid_test')
    campaign=data['campaign']
    if not isinstance(campaign,dict) or not set(campaign) <= CAMPAIGN_KEYS: raise ValueError('invalid_campaign')
    if any(not isinstance(v,str) or not re.fullmatch(r'[a-zA-Z0-9_-]{1,64}',v) for v in campaign.values()): raise ValueError('invalid_campaign')
    if data['event']=='engaged' and data['page']=='start': raise ValueError('invalid_reading')
    return data

def connect(path):
    db=sqlite3.connect(path,timeout=10)
    db.execute('''CREATE TABLE IF NOT EXISTS events(
      event_id TEXT PRIMARY KEY, visitor TEXT, session TEXT, page TEXT,
      event TEXT, target TEXT, campaign TEXT, test INTEGER, created INTEGER)''')
    db.execute('CREATE INDEX IF NOT EXISTS events_time ON events(created)')
    db.execute('CREATE INDEX IF NOT EXISTS events_visitor ON events(visitor,event,created)')
    return db

def save(db,data,now=None):
    now=int(now if now is not None else time.time())
    with db:
        db.execute('DELETE FROM events WHERE created < ?', (now-30*86400,))
        db.execute('INSERT OR IGNORE INTO events VALUES(?,?,?,?,?,?,?,?,?)',(
            data['event_id'],data['visitor'],data['session'],data['page'],data['event'],data['target'],json.dumps(data['campaign']),int(data['test']),now))
        # Hard cap protects this small shared server; the report discloses the retained window.
        db.execute('DELETE FROM events WHERE rowid IN (SELECT rowid FROM events ORDER BY created DESC LIMIT -1 OFFSET 50000)')

def summary(db,now=None):
    now=int(now if now is not None else time.time())
    db.execute('DELETE FROM events WHERE created < ?', (now-30*86400,));db.commit()
    counts={name:db.execute('SELECT count(DISTINCT visitor) FROM events WHERE test=0 AND event=? AND created>=?',(name,now-7*86400)).fetchone()[0] for name in EVENTS}
    rows=db.execute("SELECT visitor,created FROM events WHERE test=0 AND event='engaged' ORDER BY created").fetchall()
    days=collections.defaultdict(set)
    for visitor,stamp in rows: days[visitor].add((stamp+8*3600)//86400)
    today=(now+8*3600)//86400
    mature=[ds for ds in days.values() if min(ds)+7 < today]
    returning=sum(any(1<=d-min(ds)<=7 for d in ds) for ds in mature)
    by_source={}
    for row in db.execute('SELECT campaign,count(*) FROM events WHERE test=0 AND created>=? GROUP BY campaign',(now-7*86400,)):
        source=json.loads(row[0]).get('utm_source','unattributed')
        by_source[source]=by_source.get(source,0)+row[1]
    return {'as_of':dt.datetime.fromtimestamp(now,dt.timezone.utc).isoformat(),'window_days':7,'observed_browser_counts':counts,'mature_7_day_readers':len(mature),'returning_1_to_7_day_readers':returning,'return_rate':returning/len(mature) if mature else None,'event_counts_by_source':by_source,'test_events_excluded':db.execute('SELECT count(*) FROM events WHERE test=1').fetchone()[0],'retained_rows':db.execute('SELECT count(*) FROM events').fetchone()[0],'installs':None,'revenue':None,'limitations':['Browser IDs, not cross-device people','Engagement is client-observed time and scroll, not comprehension','First observed reading within retained 30 days, not lifetime first use','Daily return uses Asia/Shanghai; source totals are events, not visitors','At most 50000 events retained; automated traffic can spoof clients']}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--db',default='/var/lib/wendao-growth/events.sqlite');parser.add_argument('--port',type=int,default=8795);parser.add_argument('--summary',action='store_true');args=parser.parse_args()
    os.makedirs(os.path.dirname(os.path.abspath(args.db)),mode=0o700,exist_ok=True)
    connect(args.db).close()
    if args.summary:
        with connect(args.db) as db: print(json.dumps(summary(db),ensure_ascii=False,indent=2))
        return
    def prune():
        while True:
            with connect(args.db) as db:
                db.execute('DELETE FROM events WHERE created < ?', (int(time.time())-30*86400,))
            time.sleep(3600)
    threading.Thread(target=prune,daemon=True).start()
    recent={};lock=threading.Lock()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*args): pass
        def do_GET(self):
            if self.path!='/health': self.send_error(404);return
            self.send_response(200);self.end_headers();self.wfile.write(b'wendao-growth-ok')
        def do_POST(self):
            if self.path!='/__growth/event': self.send_error(404);return
            if self.headers.get('Origin')!='https://wendao.wonderelian.com': self.send_error(403);return
            if not self.headers.get('Content-Type','').startswith('application/json'): self.send_error(415);return
            try: length=int(self.headers.get('Content-Length','0'))
            except ValueError: self.send_error(400);return
            if not 0<length<=2048: self.send_error(413);return
            # nginx overwrites this header. IP is used in memory only, never persisted.
            address=self.headers.get('X-Real-IP',self.client_address[0]);now=time.monotonic()
            with lock:
                expired=[key for key,value in recent.items() if now-value[0]>60]
                for key in expired: recent.pop(key,None)
                bucket=recent.setdefault(address,[now,0]);bucket[1]+=1
                limited=bucket[1]>120 or len(recent)>10000
            if limited: self.send_error(429);return
            try:
                data=validate(json.loads(self.rfile.read(length)))
                with connect(args.db) as db: save(db,data)
            except (ValueError,TypeError,KeyError): self.send_error(400);return
            except sqlite3.Error: self.send_error(503);return
            self.send_response(204);self.send_header('Cache-Control','no-store');self.end_headers()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    server.serve_forever()

if __name__=='__main__': main()
