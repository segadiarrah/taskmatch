"""Create disposable local journey stacks. Never reads production configuration."""
import json
import pathlib
import subprocess
import time
import urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[2]
PRIVATE=pathlib.Path('/home/almalinux/taskmatch-private/all-journeys-20261118')
NETWORK='taskmatch_journeys_20261118'
IMAGE='taskmatch-backend:journeys-20261118'
ENV={'ENV':'development','SECRET_KEY':'journey-test-only-secret-never-production-20261118',
     'REDIS_URL':'redis://journey-redis:6379/0','HUMAN_TASKS_ENABLED':'true',
     'STRIPE_MODE':'test','STRIPE_SECRET_KEY':'sk_test_fixture_only',
     'STRIPE_WEBHOOK_SECRET':'whsec_fixture_only','STRIPE_CONNECT_WEBHOOK_SECRET':'whsec_fixture_connect',
     'LLM_ENABLED':'false','PYTHONPATH':'/app:/journey','PROVIDER_DATA_DIR':'/appdata','UPLOAD_DIR':'/appdata/uploads',
     'BILLING_SITE_URL':'https://taskmatch.example.test','BILLING_WORKER_POLL_SECONDS':'0.2'}

def run(args,**kw):return subprocess.run(args,check=True,**kw)
def start(args,**kw):
 name=args[args.index('--name')+1]
 found=subprocess.run(['docker','inspect',name],capture_output=True,text=True)
 if found.returncode==0:
  info=json.loads(found.stdout)[0]
  if NETWORK not in info['NetworkSettings']['Networks'] or not info['State']['Running']:
   raise RuntimeError('Existing journey container needs explicit cleanup: '+name)
  for image in [IMAGE,'taskmatch-frontend:journeys-20261118','postgres:16-alpine','redis:7-alpine']:
   if image in args:
    expected=subprocess.check_output(['docker','image','inspect',image,'--format','{{.Id}}'],text=True).strip()
    if info['Image']!=expected:raise RuntimeError('Outdated journey container needs explicit cleanup: '+name)
  return
 return run(args,**kw)

def db_url(name):return 'postgresql+asyncpg://journey:journey_fixture_only@journey-postgres/'+name

def prepare():
 PRIVATE.mkdir(parents=True,mode=0o700,exist_ok=True)
 if subprocess.run(['docker','network','inspect',NETWORK],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
  run(['docker','network','create','--internal',NETWORK],stdout=subprocess.DEVNULL)
 start(['docker','run','-d','--name','tm-journey-postgres','--network',NETWORK,'--network-alias','journey-postgres',
      '-e','POSTGRES_USER=journey','-e','POSTGRES_PASSWORD=journey_fixture_only','-e','POSTGRES_DB=taskmatch_browser_test','postgres:16-alpine'],stdout=subprocess.DEVNULL)
 start(['docker','run','-d','--name','tm-journey-redis','--network',NETWORK,'--network-alias','journey-redis','redis:7-alpine'],stdout=subprocess.DEVNULL)
 for _ in range(40):
  if subprocess.run(['docker','exec','tm-journey-postgres','pg_isready','-h','127.0.0.1','-U','journey'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0:break
  time.sleep(.25)
 else:raise RuntimeError('Test database did not start')
 for name in ['taskmatch_paid_test','taskmatch_suite_test']:
  exists=subprocess.check_output(['docker','exec','tm-journey-postgres','psql','-U','journey','-d','postgres','-tAc',"select 1 from pg_database where datname='"+name+"'"],text=True).strip()
  if not exists:run(['docker','exec','tm-journey-postgres','createdb','-U','journey',name])
 for name,mode in [('taskmatch_browser_test','legacy_manual'),('taskmatch_paid_test','stripe'),('taskmatch_suite_test','stripe')]:
  env={**ENV,'DATABASE_URL':db_url(name),'TEST_DATABASE_URL':db_url(name),'PAYMENT_MODE':mode}
  if mode=='stripe':env.update(TASKMATCH_JOURNEY_FIXTURE='local-only',PYTHONPATH='/app:/journey')
  p=PRIVATE/(name+'.env');p.write_text(''.join(k+'='+v+'\n' for k,v in env.items()));p.chmod(0o600)
  if name!='taskmatch_suite_test':
   run(['docker','run','--rm','--network',NETWORK,'--env-file',str(p),IMAGE,'python','-m','alembic','upgrade','head'])
   run(['docker','run','--rm','--network',NETWORK,'--env-file',str(p),'-v',str(ROOT/'tools/journey-tests')+':/journey:ro',IMAGE,'python','/journey/seed_accounts.py'])
 for name,db,port,alias in [('tm-journey-api-legacy','taskmatch_browser_test',3171,'backend'),('tm-journey-api-paid','taskmatch_paid_test',3172,'paid-api')]:
  args=['docker','run','-d','--name',name,'--network',NETWORK,'--network-alias',alias,
        '--env-file',str(PRIVATE/(db+'.env')),
        '--tmpfs','/appdata:mode=1777','-v',str(ROOT/'tools/journey-tests')+':/journey:ro',IMAGE]
  if db=='taskmatch_paid_test':args+=['python','-m','uvicorn','serve_fixture_api:app','--host','0.0.0.0','--port','8000']
  start(args,stdout=subprocess.DEVNULL)
 start(['docker','run','-d','--name','tm-journey-web','--network',NETWORK,
      '-e','API_INTERNAL_URL=http://backend:8000','taskmatch-frontend:journeys-20261118'],stdout=subprocess.DEVNULL)
 proxy='tm-journey-proxy'
 if subprocess.run(['docker','inspect',proxy],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:
  run(['docker','create','--name',proxy,'-p','127.0.0.1:3170:3170','-p','127.0.0.1:3171:3171','-p','127.0.0.1:3172:3172','-v',str(ROOT/'tools/journey-tests/nginx.conf')+':/etc/nginx/conf.d/default.conf:ro','nginx:1.27-alpine'],stdout=subprocess.DEVNULL)
  run(['docker','network','connect',NETWORK,proxy])
  run(['docker','start',proxy],stdout=subprocess.DEVNULL)
 print('Isolated journey services created; private internal network and loopback ports3170/3171/3172.')

if __name__=='__main__':prepare()
