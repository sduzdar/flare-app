'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');

const STORAGE_KEY='duzi-prototype-v1';
const SCRIPT_ORDER=['brand.js','ifs.js','session.js','app.js','flow-engine.js','flow-interventions-action.js','flow-interventions-reflection.js','flow-interventions-regulation.js','overthinking.js','anger.js'];
let assertions=0;
const cases=[];

function ok(value,message){assert.ok(value,message);assertions++}
function equal(actual,expected,message){assert.equal(actual,expected,message);assertions++}
function include(actual,expected,message){ok(String(actual).includes(expected),message||`Expected ${actual} to include ${expected}`)}
function wait(ms=15){return new Promise(resolve=>setTimeout(resolve,ms))}

async function open(hash='/category/anger',seed){
  const errors=[];
  const virtualConsole=new VirtualConsole();
  virtualConsole.on('jsdomError',error=>errors.push(error));
  virtualConsole.on('error',error=>errors.push(error));
  let html=fs.readFileSync('index.html','utf8')
    .replace(/<link rel="stylesheet"[^>]*>/g,'')
    .replace(/<script defer src="[^"]+"><\/script>/g,'');
  const scripts=SCRIPT_ORDER.map(file=>'<script>\n'+fs.readFileSync(file,'utf8')+'\n<\/script>').join('');
  html=html.replace('</body>',scripts+'</body>');
  const dom=new JSDOM(html,{
    url:'http://flare.local/#'+hash,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole,
    beforeParse(window){
      if(seed)window.localStorage.setItem(STORAGE_KEY,JSON.stringify(seed));
      window.__appPaints=0;
      window.addEventListener('DOMContentLoaded',()=>{
        const app=window.document.querySelector('#app');
        if(app)new window.MutationObserver(records=>{if(records.some(record=>record.type==='childList'))window.__appPaints++}).observe(app,{childList:true});
      });
    }
  });
  if(dom.window.document.readyState!=='complete')await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  for(let attempt=0;attempt<100&&!dom.window.FlareFlow?._flows.get('anger');attempt++)await wait(20);
  dom.__errors=errors;
  return dom;
}

function text(dom){return dom.window.document.querySelector('#app').textContent.replace(/\s+/g,' ').trim()}
function heading(dom){return dom.window.document.querySelector('#app h1')?.textContent.trim()||''}
function session(dom){return dom.window.FlareFlow.getSession('anger')}

async function settle(dom){await wait(25);return dom}
async function setHash(dom,path){dom.window.location.hash=path;await settle(dom)}

function buttonByText(dom,label){
  return [...dom.window.document.querySelectorAll('#app button')].find(button=>button.textContent.replace(/\s+/g,' ').trim().includes(label));
}
async function click(dom,label){
  const button=buttonByText(dom,label);
  ok(button,`Missing button: ${label} on ${heading(dom)}`);
  button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));
  await settle(dom);
}
async function start(dom,title){
  await setHash(dom,'/category/anger');
  await click(dom,title);
}
async function submit(dom,values){
  const form=dom.window.document.querySelector('#app form');
  ok(form,`Missing form on ${heading(dom)}`);
  for(const [name,value] of Object.entries(values)){
    const input=form.elements.namedItem(name);
    ok(input,`Missing field ${name} on ${heading(dom)}`);
    input.value=value;
    input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
    input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
  }
  form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
  await settle(dom);
}
async function fresh(dom){dom.window.FlareFlow.newSession('anger','test');await setHash(dom,'/category/anger')}

async function run(name,fn){
  try{await fn();cases.push({name,ok:true})}
  catch(error){cases.push({name,ok:false,error:error.stack||String(error)})}
}

(async()=>{
  const dom=await open();
  const flow=dom.window.FlareFlow._flows.get('anger');

  await run('01 wants angry text routes to pause',async()=>{
    await start(dom,'معصّب وبدي أرد فورًا');await click(dom,'ساعدني أوقف قبل الرد');
    equal(heading(dom),'وقفة قبل الرد');equal(session(dom).pause_used,true);
  });

  await run('02 genuinely required reply routes to minimal reply',async()=>{
    await start(dom,'معصّب وبدي أرد فورًا');await click(dom,'ساعدني أوقف قبل الرد');await click(dom,'نعم، لازم أرد بشي بسيط');
    equal(heading(dom),'رد بالحد الأدنى');
    await submit(dom,{minimal_goal:'تأجيل',minimal_reply:'مش مناسب أحكي هلا، وبرجعلك بكرا.'});await click(dom,'لا');
    equal(session(dom).exit_state,'action');equal(heading(dom),'خطوتك واضحة');
  });

  await run('03 can delay reaches delay exit',async()=>{
    await start(dom,'معصّب وبدي أرد فورًا');await click(dom,'ساعدني أوقف قبل الرد');await click(dom,'لا، بقدر أأجل');
    equal(session(dom).exit_state,'delay');equal(session(dom).delay_has_return_plan,false);
  });

  await run('04 acute violence risk hard-stops',async()=>{
    await start(dom,'معصّب وبدي أرد فورًا');await click(dom,'ممكن أؤذي أو أخوّف');
    equal(session(dom).risk_state,'acute');equal(heading(dom),'هلا الأولوية للسلامة');
    ok(!text(dom).includes('هون بتكون الممارسة الصوتية'),'Acute screen must not render audio');
  });

  await run('05 past threat without current risk routes to repair',async()=>{
    await start(dom,'حكيت أو عملت شي');await click(dom,'نعم');await click(dom,'لا');
    equal(heading(dom),'أصلّح قبل ما أبرر');equal(session(dom).risk_state,'none');
  });

  await run('06 unsafe confrontation gets conversation safety',async()=>{
    await start(dom,'ساكت، بس من جوّا');await click(dom,'ما في مجال آمن');
    equal(session(dom).risk_state,'conversation_unsafe');equal(heading(dom),'المواجهة مش آمنة هلا');
  });

  await run('07 replay with no new content exits replay',async()=>{
    await start(dom,'خلص الموقف');await click(dom,'لا أو مش عارف');await click(dom,'لا');
    equal(heading(dom),'اطلع من الإعادة');await click(dom,'لا');
    equal(session(dom).exit_state,'replay');equal(heading(dom),'ما طلع شيء جديد');
  });

  await run('08 replay with unresolved action reaches next real step',async()=>{
    await start(dom,'خلص الموقف');await click(dom,'نعم');await click(dom,'نعم');
    equal(heading(dom),'شو الخطوة الحقيقية التالية؟');
    await submit(dom,{next_action:'أطلب توضيح بكرا'});await click(dom,'على فعلي أنا');
    equal(session(dom).action_status,'found');equal(session(dom).exit_state,'action');
  });

  await run('09 review once guard blocks second review',async()=>{
    await start(dom,'خلص الموقف');await click(dom,'نعم');await click(dom,'لا');
    equal(heading(dom),'راجع الموقف مرة واحدة');equal(session(dom).review_used,true);
    await setHash(dom,'/anger/writing/review/camera');
    await setHash(dom,'/anger/writing/review');equal(heading(dom),'اطلع من الإعادة');
  });

  await run('10 deliberate silence routes to delay',async()=>{
    await start(dom,'ساكت، بس من جوّا');await click(dom,'اخترت أأجل الكلام');await click(dom,'نعم');
    equal(session(dom).exit_state,'delay');equal(session(dom).future_conversation,true);
  });

  await run('11 silence from not knowing words reaches message clarity',async()=>{
    await start(dom,'ساكت، بس من جوّا');await click(dom,'مش عارف شو بدي أقول');
    equal(heading(dom),'شو بدك توصّل؟');equal(session(dom).message_clarity_used,true);
  });

  await run('12 likely attack routes to delay',async()=>{
    await start(dom,'بدي أحكي عن اللي صار');await click(dom,'نعم');await click(dom,'لا');
    equal(session(dom).exit_state,'delay');equal(heading(dom),'قرارك هلا إنك ما ترد أو ما تواجه');
  });

  await run('13 apology request is accepted as a request',async()=>{
    await start(dom,'بدي أحكي عن اللي صار');await click(dom,'نعم');await click(dom,'نعم');await click(dom,'أطلب اعتذار');
    equal(heading(dom),'احكيه بدون هجوم');equal(session(dom).answers.conversation_goal,'أطلب اعتذار');
  });

  await run('14 forcing apology receives reality check',async()=>{
    await start(dom,'ساكت، بس من جوّا');await click(dom,'مش عارف شو بدي أقول');await click(dom,'أخليه يعتذر');
    equal(heading(dom),'رجّع الهدف لشي تحت سيطرتك');include(text(dom),'مش قادر تضمن');
  });

  await run('15 controlling boundary is reclassified as request',async()=>{
    await start(dom,'بدي أحكي عن اللي صار');await click(dom,'نعم');await click(dom,'نعم');await click(dom,'أحط حد');await click(dom,'نعم');
    await submit(dom,{assertive_event:'رفع صوته',assertive_effect:'وقفت الحديث',assertive_request:'يحكي بدون صراخ',assertive_boundary:'لازم يعتذر'});
    await click(dom,'شو هو لازم يعمل');
    equal(heading(dom),'هذا طلب، مش حد');include(text(dom),'حتى لو كان طلب اعتذار');
  });

  await run('16 real information gap reaches information exit',async()=>{
    await start(dom,'الغضب بعده معي');await click(dom,'نعم');await click(dom,'معلومة ناقصة');
    await submit(dom,{information_needed:'موعد واضح',information_source:'الجهة الرسمية'});
    equal(session(dom).information_status,'missing','Information session: '+JSON.stringify(session(dom)));equal(session(dom).exit_state,'info');
  });

  await run('17 no action gates acceptance audio',async()=>{
    await start(dom,'الغضب بعده معي');await click(dom,'لا');await click(dom,'مش لازم أجاوب');
    equal(session(dom).action_status,'none');equal(heading(dom),'الغضب موجود، بس مش لازم يقودك');
  });

  await run('18 anger may remain after successful values action',async()=>{
    await click(dom,'أكمل شغلة قدامي');
    equal(session(dom).exit_state,'values');include(text(dom),'الغضب ممكن يضل موجود شوي');
  });

  await run('19 back navigation cannot reopen completed action',async()=>{
    await start(dom,'خلص الموقف');await click(dom,'نعم');await click(dom,'نعم');await submit(dom,{next_action:'أبعث رسالة بكرا'});await click(dom,'على فعلي أنا');
    await setHash(dom,'/anger/next-real-step');equal(heading(dom),'خطوتك واضحة');equal(session(dom).exit_state,'action');
  });

  let persistedSeed;
  await run('20 refresh/session recreation preserves episode state',async()=>{
    await start(dom,'معصّب وبدي أرد فورًا');await click(dom,'ساعدني أوقف قبل الرد');
    persistedSeed=JSON.parse(dom.window.localStorage.getItem(STORAGE_KEY));
    const refreshed=await open('/anger/audio/pause',persistedSeed);
    equal(refreshed.window.FlareFlow.getSession('anger').pause_used,true);
    equal(heading(refreshed),'قرارك هلا إنك ما ترد أو ما تواجه');
    refreshed.window.close();
  });

  await run('21 new episode resets old guards',async()=>{
    const oldEpisode=session(dom).episode_id;ok(session(dom).pause_used);
    await start(dom,'ساكت، بس من جوّا');
    ok(session(dom).episode_id!==oldEpisode,'New episode id must change');equal(session(dom).pause_used,false);equal(session(dom).exit_state,null);
  });

  await run('22 exits contain no post-success recommendations',async()=>{
    await start(dom,'معصّب وبدي أرد فورًا');await click(dom,'ساعدني أوقف قبل الرد');await click(dom,'لا، بقدر أأجل');
    ok(!text(dom).includes('شاهد'),'Exit must not recommend a video');ok(!text(dom).includes('لفهم أعمق'),'Exit must be terminal');
    equal(dom.window.document.querySelectorAll('#app .row-card').length,0);
  });

  await run('23 safety state cannot fall through normal rendering',async()=>{
    await start(dom,'معصّب وبدي أرد فورًا');await click(dom,'ممكن أؤذي أو أخوّف');
    await setHash(dom,'/anger/tool/minimal');equal(heading(dom),'هلا الأولوية للسلامة');
    ok(!text(dom).includes('اكتب جملة'),'Normal tool leaked under safety override');
  });

  await run('24 initial load renders once without duplicate flow paint',async()=>{
    const first=await open('/category/anger');
    equal(first.window.__appPaints,1,`Expected one #app paint, saw ${first.window.__appPaints}`);
    equal(first.__errors.length,0,'Initial load must have no script/resource errors');
    first.window.close();
  });

  await run('graph has canonical inventory and no duplicate/dead paths',async()=>{
    equal(flow.situations.length,7);equal(flow.videoIds.length,8);
    const allNodes=Object.values(flow.nodes);equal(new Set(allNodes.map(node=>node.path)).size,allNodes.length,'Every node path must be unique');
    ok(allNodes.length>=60,'Expected complete Anger graph');
    const source=fs.readFileSync('anger.js','utf8');
    const refs=[...source.matchAll(/(?:abs|withSession)\('([^']+)'/g)].map(match=>match[1]);
    const missing=[...new Set(refs.filter(id=>!flow.nodes[id]))];
    equal(missing.length,0,'Missing node targets: '+missing.join(', '));
    for(const id of ['audio:pause','audio:replay','audio:acceptance','review:start','tool:minimal','tool:clarity-goal','tool:repair-action','tool:assertive-start','card:interpret','card:action','micro:new','risk:acute','risk:conversation',...Object.values({info:'exit:info',delay:'exit:delay',action:'exit:action',conversation:'exit:conversation',repair:'exit:repair',replay:'exit:replay',values:'exit:values',done:'exit:done'})])ok(flow.nodes[id],`Missing canonical node ${id}`);
  });

  await run('legacy saved/done/last/note migration is deterministic',async()=>{
    const seed={saved:['anger-0','audio-0','exercise-0'],done:['anger-7','card-anger'],last:'anger-2',notes:{'anger-0':'video note','exercise-0':'tool note'},flowSessions:{}};
    const migrated=await open('/category/anger',seed);
    const stored=JSON.parse(migrated.window.localStorage.getItem(STORAGE_KEY));
    equal(stored.saved.join(','),'ANG-01,ANG-02,ANG-07');equal(stored.done.join(','),'ANG-08,ANG-01');equal(stored.last,'ANG-03');
    equal(stored.notes['ANG-01'],'video note');equal(stored.notes['ANG-07'],'tool note');ok(stored.angerMigration?.version===1);
    migrated.window.close();
  });

  await run('shared router keeps Overthinking behavior intact',async()=>{
    await setHash(dom,'/category/thinking');equal(dom.window.document.querySelectorAll('[data-flow-start^="thinking:"]').length,6);
    await click(dom,'عم أعيد موقف صار');equal(heading(dom),'عم أعيد موقف صار');
    ok(dom.window.FlareFlow._flows.get('thinking'),'Thinking flow remains registered');
    dom.window.FlareFlow.newSession('thinking','regression');
    const angerInfoBefore=session(dom).answers.information_needed;
    await setHash(dom,'/thinking-tool/info');
    await submit(dom,{info:'معلومة اختبار',info_source:'مصدر رسمي'});
    equal(heading(dom),'صار واضح شو ناقصك');equal(dom.window.FlareFlow.getSession('thinking').answers.info,'معلومة اختبار');
    equal(session(dom).answers.information_needed,angerInfoBefore,'Thinking form must not write into Anger session');
  });

  dom.window.close();
  const failed=cases.filter(item=>!item.ok);
  console.log(JSON.stringify({cases:cases.length,passed:cases.length-failed.length,failed:failed.length,assertions,failures:failed},null,2));
  if(failed.length)process.exit(1);
})().catch(error=>{console.error(error);process.exit(1)});
