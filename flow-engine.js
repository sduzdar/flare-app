'use strict';

(function(){
  const flows=new Map();

  function now(){return new Date().toISOString()}
  function uid(prefix='flow'){return prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,7)}
  function ensureRoot(){if(!state.flowSessions||typeof state.flowSessions!=='object')state.flowSessions={}}
  function defaultsFor(flowId){
    const flow=flows.get(flowId);
    return typeof flow?.sessionDefaults==='function'?flow.sessionDefaults():{...(flow?.sessionDefaults||{})};
  }
  function baseSession(flowId,situationId=''){
    return {visitId:uid(flowId),startedAt:now(),updatedAt:now(),answers:{},guards:{},currentNode:'',previousNode:'',situationId,complete:false,...defaultsFor(flowId)};
  }
  function getSession(flowId){
    ensureRoot();
    if(!state.flowSessions[flowId]||typeof state.flowSessions[flowId]!=='object'){
      state.flowSessions[flowId]=baseSession(flowId);
      persist();
    }
    const s=state.flowSessions[flowId];
    const defaults=defaultsFor(flowId);
    Object.entries(defaults).forEach(([key,value])=>{if(s[key]===undefined)s[key]=value});
    if(!s.answers||typeof s.answers!=='object')s.answers={};
    if(!s.guards||typeof s.guards!=='object')s.guards={};
    return s;
  }
  function newSession(flowId,situationId=''){
    ensureRoot();
    state.flowSessions[flowId]=baseSession(flowId,situationId);
    persist();
    return state.flowSessions[flowId];
  }
  function touch(s){s.updatedAt=now();persist()}
  function setAnswer(flowId,key,value){const s=getSession(flowId);s.answers[key]=value;touch(s);return s}
  function mergeAnswers(flowId,values){const s=getSession(flowId);Object.assign(s.answers,values);touch(s);return s}
  function setGuard(flowId,key,value=true){const s=getSession(flowId);s.guards[key]=value;touch(s);return s}
  function setSession(flowId,key,value){const s=getSession(flowId);s[key]=value;touch(s);return s}
  function incGuard(flowId,key){const s=getSession(flowId);s.guards[key]=(Number(s.guards[key])||0)+1;touch(s);return s.guards[key]}
  function markComplete(flowId){const s=getSession(flowId);s.complete=true;touch(s)}

  function resolve(value,ctx){return typeof value==='function'?value(ctx):value}
  function attrs(obj){return Object.entries(obj||{}).map(([k,v])=>' '+k+'="'+esc(v)+'"').join('')}
  function targetPath(flow,target){
    if(!target)return '/';
    if(typeof target==='string'&&target.startsWith('/'))return target;
    const node=flow.nodes[target];
    return node?.path||'/';
  }
  function applyTransition(flow,target){
    if(!target)return '/';
    if(typeof target==='string')return targetPath(flow,target);
    if(target.set)Object.entries(target.set).forEach(([k,v])=>setGuard(flow.id,k,v));
    if(target.session)Object.entries(target.session).forEach(([k,v])=>setSession(flow.id,k,resolve(v,ctx(flow,flow.nodes[target.node]||{}))));
    if(target.answers)Object.entries(target.answers).forEach(([k,v])=>setAnswer(flow.id,k,v));
    if(target.complete)markComplete(flow.id);
    return targetPath(flow,target.node||target.path||'/');
  }

  function ctx(flow,node){return {flow,node,session:getSession(flow.id),answers:getSession(flow.id).answers,guards:getSession(flow.id).guards,setAnswer:(k,v)=>setAnswer(flow.id,k,v),setGuard:(k,v)=>setGuard(flow.id,k,v),setSession:(k,v)=>setSession(flow.id,k,v),incGuard:k=>incGuard(flow.id,k),goTarget:t=>go(applyTransition(flow,t)),targetPath:t=>targetPath(flow,t)}}

  function guardRedirect(flow,node,c){
    const priority=flow.priorityRedirect?.(c,node);
    if(priority)return priority;
    const g=node.guard;
    if(!g)return null;
    if(typeof g==='function')return g(c)||null;
    const value=c.guards[g.key];
    if(g.when==='truthy'&&value)return g.fallback;
    if(g.when==='gte'&&Number(value||0)>=Number(g.value||1))return g.fallback;
    return null;
  }

  function enterNode(flow,node){
    const s=getSession(flow.id);
    const previous=s.currentNode;
    s.previousNode=previous;
    s.currentNode=node.id;
    s.updatedAt=now();
    if(node.onEnter&&previous!==node.id)node.onEnter(ctx(flow,node));
    persist();
  }

  function button(label,target,className='secondary',extra=''){
    return '<button class="'+className+'" data-flow-target="'+esc(target)+'" '+extra+'>'+label+'</button>';
  }

  function renderChoice(flow,node,c){
    const options=resolve(node.options,c)||[];
    return (node.prompt?'<div class="feature"><h2>'+esc(resolve(node.prompt,c))+'</h2>'+(node.body?'<p>'+resolve(node.body,c)+'</p>':'')+'<div class="stack">':'')+
      options.map((o,i)=>'<button class="row-card" data-flow-id="'+esc(flow.id)+'" data-flow-choice="'+esc(node.id)+'" data-flow-option="'+i+'"><span><h3>'+esc(resolve(o.label,c))+'</h3>'+(o.desc?'<small>'+esc(resolve(o.desc,c))+'</small>':'')+'</span>'+icon('arrow','arrow')+'</button>').join('')+
      (node.prompt?'</div></div>':'')+
      (node.understand?'<button class="secondary wide" style="margin-top:14px" data-flow-target="'+esc(resolve(node.understand,c))+'">بدي أفهم شو عم بصير معي</button>':'');
  }

  function renderFields(fields,c){
    return (fields||[]).map(f=>{
      const value=c.answers[f.key]??'';
      const label=resolve(f.label,c);
      const ph=resolve(f.placeholder||'',c);
      if(f.type==='textarea')return '<div class="field"><label>'+esc(label)+'</label><textarea name="'+esc(f.key)+'" '+(f.required?'required':'')+' placeholder="'+esc(ph)+'">'+esc(value)+'</textarea></div>';
      if(f.type==='select')return '<div class="field"><label>'+esc(label)+'</label><select name="'+esc(f.key)+'">'+(f.options||[]).map(x=>'<option value="'+esc(x)+'" '+(String(value)===String(x)?'selected':'')+'>'+esc(x)+'</option>').join('')+'</select></div>';
      if(f.type==='choice')return '<div class="field"><label>'+esc(label)+'</label><div class="actions">'+(f.options||[]).map(x=>'<label class="secondary" style="cursor:pointer"><input type="radio" name="'+esc(f.key)+'" value="'+esc(x)+'" '+(String(value)===String(x)?'checked':'')+' '+(f.required?'required':'')+'> '+esc(x)+'</label>').join('')+'</div></div>';
      return '<div class="field"><label>'+esc(label)+'</label><input name="'+esc(f.key)+'" value="'+esc(value)+'" '+(f.required?'required':'')+' placeholder="'+esc(ph)+'"></div>';
    }).join('');
  }

  function renderForm(flow,node,c){
    const fields=resolve(node.fields,c)||[];
    const err=c.session.formError&&c.session.formError.node===node.id?'<p class="status-error" role="alert">'+esc(c.session.formError.message)+'</p>':'';
    return '<form data-flow-id="'+esc(flow.id)+'" data-flow-form="'+esc(node.id)+'">'+renderFields(fields,c)+err+'<button class="primary" type="submit">'+esc(resolve(node.submitLabel||'كمّل',c))+'</button></form>';
  }

  function renderMedia(flow,node,c){
    const after=node.after?'<div class="feature"><h2>'+esc(resolve(node.after.prompt,c))+'</h2><div class="stack">'+(resolve(node.after.options,c)||[]).map((o,i)=>'<button class="row-card" data-flow-id="'+esc(flow.id)+'" data-flow-media-choice="'+esc(node.id)+'" data-flow-option="'+i+'"><span><h3>'+esc(resolve(o.label,c))+'</h3></span>'+icon('arrow','arrow')+'</button>').join('')+'</div></div>':'';
    return '<div class="video-stage"><span class="play-disc">'+icon(node.mediaType==='audio'?'headphones':'play')+'</span><h2>'+esc(resolve(node.placeholderTitle,c))+'</h2>'+(node.placeholderBody?'<p>'+esc(resolve(node.placeholderBody,c))+'</p>':'')+(node.duration?'<span class="pill">'+esc(resolve(node.duration,c))+'</span>':'')+'</div>'+after;
  }

  function renderNode(flow,node){
    const c=ctx(flow,node);
    const redirect=guardRedirect(flow,node,c);
    if(redirect){
      const nextPath=applyTransition(flow,redirect);
      const nextNode=flow.pathMap[nextPath];
      if(nextNode&&nextNode!==node){
        if(typeof history!=='undefined'&&history.replaceState)history.replaceState(null,'','#'+nextPath);
        return renderNode(flow,nextNode);
      }
      queueMicrotask(()=>go(nextPath));
      return '<div class="empty"><p>عم ننقلك للخطوة المناسبة…</p></div>';
    }
    enterNode(flow,node);
    const c2=ctx(flow,node);
    let html=(node.back===false?'':back(resolve(node.back||flow.categoryPath,c2),resolve(node.backLabel||flow.title,c2)))+intro(resolve(node.title,c2),resolve(node.desc||'',c2),resolve(node.eyebrow||'',c2));
    if(node.notice)html+='<div class="detail-note"><p>'+resolve(node.notice,c2)+'</p></div>';
    if(node.type==='choice')html+=renderChoice(flow,node,c2);
    else if(node.type==='form')html+=renderForm(flow,node,c2);
    else if(node.type==='media')html+=renderMedia(flow,node,c2);
    else if(node.type==='exit')html+=resolve(node.bodyHtml||'',c2)+(node.cta?'<button class="primary wide" data-go="'+esc(resolve(node.cta.path,c2))+'">'+esc(resolve(node.cta.label,c2))+'</button>':'');
    else if(node.type==='summary')html+=resolve(node.bodyHtml||'',c2)+renderChoice(flow,{...node,prompt:node.prompt||'',options:node.options||[]},c2);
    else if(node.type==='custom')html+=resolve(node.render,c2);
    return html;
  }

  function renderCategory(flow){
    const s=getSession(flow.id);
    return back('/library','المكتبة')+intro(flow.title,flow.categoryDesc||'',flow.categoryEyebrow||'')+
      '<div class="list">'+flow.situations.map(x=>'<button class="row-card" data-flow-start="'+esc(flow.id+':'+x.id)+'"><span class="icon-wrap">'+icon(flow.icon||'mind')+'</span><span><h3>'+esc(x.title)+'</h3><small>'+esc(x.desc)+'</small></span>'+icon('arrow','arrow')+'</button>').join('')+'</div>'+
      (flow.categoryFooter?resolve(flow.categoryFooter,{flow,session:s,answers:s.answers,guards:s.guards}):'');
  }

  function renderVideo(flow,videoId){
    const v=videos.find(x=>x.id===videoId);if(!v)return notfound();
    const spec=flow.videos?.[videoId]||{};
    return back(flow.categoryPath,flow.title)+'<div class="detail-head"><div><div class="eyebrow">فيديو · Prototype</div><h1>'+esc(v.title)+'</h1></div></div>'+
      '<div class="video-stage"><span class="play-disc">'+icon('play')+'</span><h2>هون بيكون الفيديو بعد تسجيله</h2><p>المحتوى المسجّل سيُضاف لاحقًا.</p></div>'+
      (spec.after?'<div class="section-title"><h2>بعد الفيديو</h2></div><div class="actions">'+spec.after.map(a=>button(a.label,targetPath(flow,a.target),a.primary?'primary':'secondary')).join('')+'</div>':'');
  }

  function register(flow){
    flow.nodes=flow.nodes||{};
    flow.pathMap={};
    Object.values(flow.nodes).forEach(n=>{if(n?.path)flow.pathMap[n.path]=n});
    flows.set(flow.id,flow);
  }

  function renderRoute(parts){
    const p=route();
    for(const flow of flows.values()){
      if(p===flow.categoryPath)return renderCategory(flow);
      const node=flow.pathMap[p];if(node)return renderNode(flow,node);
      if(flow.videoIds?.includes(parts[1])&&parts[0]==='content')return renderVideo(flow,parts[1]);
    }
    return null;
  }

  function handleClick(e){
    const el=e.target.closest('[data-flow-start],[data-flow-target],[data-flow-choice],[data-flow-media-choice]');if(!el)return false;
    if(el.dataset.flowStart){
      const [flowId,situationId]=el.dataset.flowStart.split(':');const flow=flows.get(flowId);if(!flow)return false;
      const s=newSession(flowId,situationId);const situation=flow.situations.find(x=>x.id===situationId);if(!situation)return false;
      go(targetPath(flow,situation.start));return true;
    }
    let flow=el.dataset.flowId?flows.get(el.dataset.flowId):null,node=null;
    if(flow){const choiceId=el.dataset.flowChoice||el.dataset.flowMediaChoice;node=choiceId?flow.nodes[choiceId]:null}
    for(const f of flows.values()){
      if(flow)break;
      const choiceId=el.dataset.flowChoice||el.dataset.flowMediaChoice;
      if(choiceId&&f.nodes[choiceId]){flow=f;node=f.nodes[choiceId];break}
      if(el.dataset.flowTarget){flow=f;break}
    }
    if(el.dataset.flowTarget){
      const target=el.dataset.flowTarget;
      if(target.startsWith('/'))go(target);else if(flow)go(targetPath(flow,target));
      return true;
    }
    if((el.dataset.flowChoice||el.dataset.flowMediaChoice)&&flow&&node){
      const c=ctx(flow,node);const options=el.dataset.flowMediaChoice?(resolve(node.after?.options,c)||[]):(resolve(node.options,c)||[]);const option=options[Number(el.dataset.flowOption)];if(!option)return true;
      if(option.answerKey)setAnswer(flow.id,option.answerKey,resolve(option.value??option.label,c));
      if(option.set)Object.entries(option.set).forEach(([k,v])=>setGuard(flow.id,k,resolve(v,c)));
      const target=resolve(option.target,c);go(applyTransition(flow,target));return true;
    }
    return false;
  }

  function formValues(form){const d=new FormData(form),out={};for(const [k,v] of d.entries())out[k]=String(v).trim();return out}
  function handleInput(e){
    const form=e.target?.closest?.('[data-flow-form]');if(!form)return false;
    const nodeId=form.dataset.flowForm;let flow=form.dataset.flowId?flows.get(form.dataset.flowId):null;
    if(!flow)for(const f of flows.values()){if(f.nodes[nodeId]){flow=f;break}}
    if(!flow)return false;
    const name=e.target.name;if(name)setAnswer(flow.id,name,e.target.value);
    return true;
  }

  function handleSubmit(e){
    const form=e.target;if(!form?.dataset?.flowForm)return false;
    const nodeId=form.dataset.flowForm;let flow=form.dataset.flowId?flows.get(form.dataset.flowId):null,node=flow?.nodes[nodeId]||null;
    if(!flow)for(const f of flows.values()){if(f.nodes[nodeId]){flow=f;node=f.nodes[nodeId];break}}
    if(!flow||!node)return false;
    e.preventDefault();
    const values=formValues(form),c=ctx(flow,node);
    if(node.validate){const message=node.validate(values,c);if(message){c.session.formError={node:node.id,message};touch(c.session);render();return true}}
    c.session.formError=null;mergeAnswers(flow.id,values);
    const next=resolve(node.next,{...ctx(flow,node),values});
    go(applyTransition(flow,next));return true;
  }

  const validators={
    concreteAction(value){
      const x=String(value||'').trim().replace(/[ًٌٍَُِّْـ]/g,'').toLowerCase();
      if(!x)return 'اكتب خطوة ممكن تعملها فعلًا.';
      const vague=[/^(افكر|أفكر)(\s|$)/,/^(اشوف|أشوف) شو بحس/,/^(ادرس|أدرس) الموضوع/,/^(افهم|أفهم) اكثر/,/^(أراجع|اراجع) الموضوع/];
      if(vague.some(r=>r.test(x)))return 'خلّيها حركة أوضح. شيء ممكن تعمله فعلًا.';
      return '';
    }
  };

  function choiceNode(id,path,title,prompt,options,extra={}){return {id,path,type:'choice',title,prompt,options,...extra}}
  function formNode(id,path,title,fields,next,extra={}){return {id,path,type:'form',title,fields,next,...extra}}
  function exitNode(id,path,title,desc,bodyHtml,extra={}){return {id,path,type:'exit',title,desc,bodyHtml,...extra}}

  document.addEventListener('input',handleInput);

  window.FlareFlow={register,renderRoute,handleClick,handleSubmit,handleInput,getSession,newSession,setAnswer,mergeAnswers,setGuard,setSession,incGuard,markComplete,targetPath,validators,builders:{choiceNode,formNode,exitNode},_flows:flows};
})();
