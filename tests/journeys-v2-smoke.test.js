'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');

const scripts=['brand.js','ifs.js','session.js','app.js','flow-engine.js','flow-interventions-action.js','flow-interventions-reflection.js','flow-interventions-regulation.js','overthinking.js','anger.js','journeys-v2.js'];
const wait=(ms=20)=>new Promise(resolve=>setTimeout(resolve,ms));

async function open(hash='/'){
  const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!String(e).includes('journeys-v2.js'))errors.push(e)});
  let html=fs.readFileSync('index.html','utf8').replace(/<link rel="stylesheet"[^>]*>/g,'').replace(/<script defer src="[^"]+"><\/script>/g,'');
  html=html.replace('</body>',scripts.map(file=>'<script>'+fs.readFileSync(file,'utf8')+'<\/script>').join('')+'</body>');
  const dom=new JSDOM(html,{url:'http://flare.local/#'+hash,runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(window){window.scrollTo=()=>{}}});
  await wait(50);dom.__errors=errors;return dom;
}

const app=dom=>dom.window.document.querySelector('#app');
const text=dom=>app(dom).textContent.replace(/\s+/g,' ').trim();
async function hash(dom,path){dom.window.location.hash=path;await wait()}
async function click(dom,label){const button=[...app(dom).querySelectorAll('button')].find(x=>x.textContent.replace(/\s+/g,' ').trim().includes(label));assert.ok(button,'missing button '+label+' on '+text(dom));button.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,cancelable:true}));await wait()}
async function rate(dom,value){const form=app(dom).querySelector('[data-flow-rating]');assert.ok(form,'rating form missing');form.elements.rating.value=String(value);form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await wait()}

(async()=>{
  const dom=await open('/category/anger');
  const anger=dom.window.FlareFlow._flows.get('anger');
  const thinking=dom.window.FlareFlow._flows.get('thinking');
  assert.equal(anger.situations.length,7);
  assert.equal(thinking.situations.length,6);
  assert.equal(thinking.situations.map(x=>x.id).join(','),'SIT-OT-01,SIT-OT-02,SIT-OT-03,SIT-OT-04,SIT-OT-05,SIT-OT-06');

  for(const situation of anger.situations){
    await hash(dom,'/category/anger');await click(dom,situation.title);
    assert.match(text(dom),/DUZI · OPEN-ANG-/);await click(dom,'بلّش');assert.match(text(dom),/قديش شدة الغضب/);await rate(dom,7);assert.match(text(dom),/مكان فيديو دوزي الرئيسي/);
  }
  for(const situation of thinking.situations){
    await hash(dom,'/category/thinking');await click(dom,situation.title);
    assert.match(text(dom),/DUZI · OPEN-OT-/);await click(dom,'بلّش');assert.match(text(dom),/قديش الفكرة ماسكة انتباهك/);await rate(dom,8);assert.match(text(dom),/مكان فيديو دوزي الرئيسي/);
  }

  dom.window.FlareFlow.newSession('anger','SIT-ANG-01');
  dom.window.FlareFlow.setSession('anger','baseline_rating',10);
  await hash(dom,'/anger/journey/final');await rate(dom,7);
  assert.match(text(dom),/نزلت 3 درجات/);assert.match(text(dom),/لسه الغضب عالي/);

  dom.window.FlareFlow.newSession('anger','SIT-ANG-01');
  await hash(dom,'/anger/risk/acute');
  assert.match(text(dom),/ما رح نطلعك من FLARE/);assert.ok(!text(dom).includes('اطلع من المسار'));

  assert.equal(dom.__errors.length,0,dom.__errors.map(String).join('\n'));
  console.log(JSON.stringify({angerSituations:7,overthinkingSituations:6,journeyAssertions:'passed',safety:'non-terminal',dynamicFeedback:'passed'},null,2));
  dom.window.close();
})().catch(error=>{console.error(error);process.exitCode=1});
