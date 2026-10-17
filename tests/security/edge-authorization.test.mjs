import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(name, env = {}, responses = {}) {
  let handler;
  const calls = [];
  const client = { auth: { getUser: async () => ({data:{user:null},error:{message:'unauthorized'}}) }, from(table) {
    calls.push(table);
    const result = responses[table] ?? {data:[],error:null};
    const chain = new Proxy({}, {get:(_,key)=>key==='then' ? (resolve)=>Promise.resolve(result).then(resolve) : ()=>chain});
    return chain;
  }};
  const source = readFileSync(new URL(`../../supabase/functions/${name}/index.ts`, import.meta.url),'utf8').replace(/^import .*;\s*$/gm,'');
  const code = ts.transpile(source, {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None});
  vm.runInNewContext(code, {Deno:{env:{get:k=>env[k]},serve:h=>handler=h},serve:h=>handler=h,createClient:()=>client,Request,Response,URL,console});
  return {run:(headers={},body={})=>handler(new Request(`https://example.invalid/${name}/qa`,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)})),calls};
}
for (const [name,key,header] of [['webhook-crm','CRM_WEBHOOK_SECRET','x-webhook-secret'],['webhook-appmax','APPMAX_WEBHOOK_TOKEN','x-webhook-token'],['webhook-hubla','HUBLA_WEBHOOK_TOKEN','x-webhook-token']]) {
  for (const configured of [false,true]) test(`${name}: missing/wrong token is refused, configured=${configured}`,async()=>{
    const app=load(name,configured?{[key]:'expected'}:{});
    for(const headers of [{},{[header]:'wrong'}]) assert.equal((await app.run(headers)).status,401);
    assert.deepEqual(app.calls,[]);
  });
  test(`${name}: valid configured token reaches existing business path`,async()=>{
    const app=load(name,{[key]:'expected'},{webhook_logs:{data:{id:'qa'},error:null}});
    await app.run({[header]:'expected'});
    assert.equal(app.calls[0],'webhook_logs');
  });
}
test('cron: neither visitor nor normal user can run server job',async()=>{
  const app=load('cron-overdue',{SUPABASE_SERVICE_ROLE_KEY:'server-only'});
  for(const headers of [{},{Authorization:'Bearer user-token'}])assert.equal((await app.run(headers)).status,401);
  assert.deepEqual(app.calls,[]);
});
test('cron: server authorization preserves scheduled work',async()=>{
  const app=load('cron-overdue',{SUPABASE_SERVICE_ROLE_KEY:'server-only'});
  assert.equal((await app.run({Authorization:'Bearer server-only'})).status,200);
  assert.deepEqual(app.calls,['revenue_installments','expenses']);
});
for(const secret of [null,'configured']) test(`gateway: refuses absent/wrong secret, configured=${!!secret}`,async()=>{
  const app=load('webhook-gateway',{}, {gateway_configs:{data:{id:'qa',company_id:'qa',webhook_secret:secret},error:null}});
  assert.equal((await app.run({'x-webhook-token':'wrong'})).status,401);
  assert.deepEqual(app.calls,['gateway_configs']);
});
test('CRM: ambiguous or absent company never falls back to another business',async()=>{
  for(const configs of [[],[{company_id:'a'},{company_id:'b'}]]){
    const app=load('webhook-crm',{CRM_WEBHOOK_SECRET:'valid'},{webhook_logs:{data:{id:'qa'},error:null},integration_configs:{data:configs,error:null}});
    const response=await app.run({'x-webhook-secret':'valid'},{sale_id:'qa',customer:{name:'QA'},total_amount:10,payment_type:'pix'});
    assert.equal(response.status,500);
    assert.ok(!app.calls.includes('revenues')&&!app.calls.includes('companies')&&!app.calls.includes('partners'));
  }
});
