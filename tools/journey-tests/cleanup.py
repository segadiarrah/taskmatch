"""Remove only containers in this internal, disposable journey network."""
import json
import subprocess

network='taskmatch_journeys_20261118'
result=subprocess.run(['docker','network','inspect',network],capture_output=True,text=True)
if result.returncode:
    raise SystemExit('Journey network is already absent')
info=json.loads(result.stdout)[0]
if not info.get('Internal'):
    raise SystemExit('Refusing cleanup of a non-internal network')
ids=subprocess.check_output(['docker','ps','-aq','--filter','network='+network],text=True).split()
for ident in ids:
    row=json.loads(subprocess.check_output(['docker','inspect',ident]))[0]
    if not row['Name'].lstrip('/').startswith('tm-journey-'):
        raise SystemExit('Refusing cleanup of an unexpected container')
if ids:subprocess.run(['docker','rm','-fv',*ids],check=True)
subprocess.run(['docker','network','rm',network],check=True)
