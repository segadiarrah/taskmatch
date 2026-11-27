"""Test-only provider boundary. Never imported by the application image."""
import copy
import uuid
from urllib.parse import parse_qs
import httpx

class CheckoutFixture:
    def __init__(self):
        self.id_namespace = ""
        self.sessions = {}
        self.intents = {}
        self.charges = {}
        self.keys = {}
        self.calls = []
        self.hook = None
        self.lose_create = False

    async def handle(self, req):
        path = req.url.path.removeprefix("/v1")
        data = {k: v[0] for k, v in parse_qs(req.content.decode()).items()}
        self.calls.append((req.method, path, data, req.headers.get("idempotency-key")))
        key = req.headers.get("idempotency-key")
        if req.method == "POST" and path == "/checkout/sessions":
            if key not in self.keys:
                idx = len(self.sessions) + 1
                sid = f"cs_test_{self.id_namespace}{idx}"
                meta = {k[9:-1]: v for k, v in data.items() if k.startswith("metadata[")}
                session = {
                    "id": sid,
                    "url": f"https://checkout.stripe.com/c/pay/{sid}",
                    "metadata": meta,
                    "livemode": False,
                    "client_reference_id": data["client_reference_id"],
                    "amount_total": int(data["line_items[0][price_data][unit_amount]"]),
                    "currency": data["line_items[0][price_data][currency]"],
                    "payment_status": "unpaid",
                    "status": "open",
                    "payment_intent": None,
                }
                self.sessions[sid] = session
                self.keys[key] = copy.deepcopy(session)
            if self.lose_create:
                raise httpx.ReadTimeout("lost response")
            return httpx.Response(200, json=self.keys[key])
        if req.method == "GET" and path.startswith("/checkout/sessions/"):
            result = copy.deepcopy(self.sessions[path.rsplit("/", 1)[-1]])
            if self.hook:
                hook, self.hook = self.hook, None
                await hook()
            return httpx.Response(200, json=result)
        if req.method == "POST" and path.endswith("/expire"):
            session = self.sessions[path.split("/")[-2]]
            session["status"] = "expired"
            return httpx.Response(200, json=session)
        if path.startswith("/charges/"):
            return httpx.Response(200, json=self.charges[path.rsplit("/", 1)[-1]])
        if path.startswith("/payment_intents/"):
            return httpx.Response(200, json=self.intents[path.rsplit("/", 1)[-1]])
        raise AssertionError(f"Unexpected Stripe call {req.method} {path}")

    def pay(self, session_id):
        session = self.sessions[session_id]
        charge = {
            "id": f"ch_{session_id}",
            "payment_intent": f"pi_{session_id}",
            "amount": session["amount_total"],
            "currency": session["currency"],
            "livemode": False,
            "paid": True,
            "captured": True,
            "refunded": False,
            "amount_refunded": 0,
            "disputed": False,
            "metadata": session["metadata"],
            "receipt_url": "https://pay.stripe.com/receipts/test",
        }
        intent = {
            "id": charge["payment_intent"],
            "status": "succeeded",
            "amount_received": charge["amount"],
            "currency": charge["currency"],
            "livemode": False,
            "metadata": session["metadata"],
            "latest_charge": charge,
        }
        session.update(payment_status="paid", status="complete", payment_intent=intent)
        self.intents[intent["id"]] = intent
        self.charges[charge["id"]] = charge
        return session


class PaymentFixture(CheckoutFixture):
    def __init__(self):
        super().__init__()
        # These IDs are stored in the preserved test database. A new API process
        # must not collide with counters from a previous provider instance.
        self.id_namespace = uuid.uuid4().hex + "_"
        self.accounts = {}
        self.transfers = {}
        self.refunds = {}
        self.customers = {}
        self.methods = {}
        self.setups = {}
        self.unexpected = []

    @staticmethod
    def meta(data):
        return {k[9:-1]: v for k, v in data.items() if k.startswith('metadata[')}

    async def handle(self, req):
        path = req.url.path.removeprefix('/v1')
        data = {k: v[0] for k, v in parse_qs(req.content.decode()).items()}
        key = req.headers.get('idempotency-key')
        if req.method == 'POST' and path == '/accounts':
            ident = 'acct_fixture' + data['metadata[taskmatch_user_id]'].replace('-', '')
            account = self.accounts.setdefault(ident, {'id': ident, 'object':'account',
                'country':data.get('country','FR'),'metadata':self.meta(data),
                'details_submitted':False,'payouts_enabled':False,
                'capabilities':{'transfers':'pending'},
                'requirements':{'currently_due':['external_account'],'past_due':[]},
                'controller':{'stripe_dashboard':{'type':'express'}}})
            return httpx.Response(200,json=account)
        if path.startswith('/accounts/') and req.method == 'GET':
            return httpx.Response(200,json=self.accounts[path.rsplit('/',1)[-1]])
        if req.method == 'POST' and path == '/account_links':
            return httpx.Response(200,json={'url':'https://connect.stripe.com/setup/'+data['account']})
        if path.endswith('/login_links'):
            return httpx.Response(200,json={'url':'https://connect.stripe.com/express/'+path.split('/')[2]})
        if req.method == 'POST' and path == '/customers':
            ident='cus_fixture_'+self.id_namespace+str(len(self.customers)+1)
            result={'id':ident,'livemode':False,'metadata':self.meta(data)}
            self.customers[ident]=result
            return httpx.Response(200,json=result)
        if req.method == 'GET' and path.startswith('/customers/'):
            return httpx.Response(200,json=self.customers[path.rsplit('/',1)[-1]])
        if req.method == 'POST' and path == '/checkout/sessions' and data.get('mode')=='setup':
            ident='cs_setup_'+self.id_namespace+str(len(self.sessions)+1)
            result={'id':ident,'mode':'setup','status':'open','livemode':False,
                'customer':data['customer'],'url':'https://checkout.stripe.com/c/pay/'+ident,
                'client_reference_id':data['client_reference_id'],'metadata':self.meta(data)}
            self.sessions[ident]=result
            return httpx.Response(200,json=result)
        if req.method == 'GET' and path.startswith('/setup_intents/'):
            return httpx.Response(200,json=self.setups[path.rsplit('/',1)[-1]])
        if req.method == 'GET' and path.startswith('/payment_methods/'):
            return httpx.Response(200,json=self.methods[path.rsplit('/',1)[-1]])
        if req.method == 'POST' and path == '/payment_intents':
            ident='pi_saved_'+self.id_namespace+str(len(self.intents)+1)
            charge_id='ch_'+ident
            meta=self.meta(data)
            charge={'id':charge_id,'payment_intent':ident,'amount':int(data['amount']),
                'currency':data['currency'],'livemode':False,'paid':True,'captured':True,
                'amount_refunded':0,'refunded':False,'disputed':False,'metadata':meta}
            result={'id':ident,'status':'succeeded','amount':charge['amount'],
                'amount_received':charge['amount'],'currency':charge['currency'],
                'livemode':False,'customer':data['customer'],'payment_method':data['payment_method'],
                'metadata':meta,'latest_charge':charge_id}
            self.charges[charge_id]=charge;self.intents[ident]=result
            return httpx.Response(200,json=result)
        if req.method == 'POST' and path == '/transfers':
            ident='tr_fixture_'+self.id_namespace+str(len(self.transfers)+1)
            result=self.keys.get(key) or {'id':ident,'amount':int(data['amount']),
                'currency':data['currency'],'destination':data['destination'],
                'source_transaction':data.get('source_transaction'),'transfer_group':data['transfer_group'],'livemode':False,
                'metadata':self.meta(data),'reversed':False,'amount_reversed':0}
            self.keys[key]=result;self.transfers[result['id']]=result
            return httpx.Response(200,json=result)
        if req.method == 'GET' and path.startswith('/transfers/'):
            return httpx.Response(200,json=self.transfers[path.rsplit('/',1)[-1]])
        if req.method == 'POST' and path == '/refunds':
            charge=self.charges[data['charge']]
            amount=int(data.get('amount',charge['amount']))
            ident='re_fixture_'+self.id_namespace+str(len(self.refunds)+1)
            result={'id':ident,'amount':amount,'currency':charge['currency'],
                'charge':charge['id'],'status':'succeeded','livemode':False,
                'metadata':self.meta(data)}
            self.refunds[ident]=result
            charge.update(amount_refunded=amount,refunded=amount==charge['amount'])
            return httpx.Response(200,json=result)
        if req.method=='GET' and path.startswith('/refunds/'):
            return httpx.Response(200,json=self.refunds[path.rsplit('/',1)[-1]])
        try:
            return await super().handle(req)
        except (AssertionError,KeyError):
            self.unexpected.append({'method':req.method,'path':path})
            raise

    def complete(self, ident):
        session=self.sessions[ident]
        if session.get('mode')!='setup':
            self.pay(ident)
            return
        customer=session['customer']
        method='pm_'+ident
        setup='seti_'+ident
        self.methods[method]={'id':method,'customer':customer,'livemode':False,
            'type':'card','card':{'brand':'visa','last4':'4242'}}
        self.setups[setup]={'id':setup,'status':'succeeded','usage':'off_session',
            'customer':customer,'payment_method':method,'livemode':False,
            'metadata':session['metadata']}
        session.update(status='complete',setup_intent=setup)

    def complete_account(self, ident):
        self.accounts[ident].update(details_submitted=True,payouts_enabled=True,
            capabilities={'transfers':'active'},requirements={'currently_due':[],'past_due':[]})
