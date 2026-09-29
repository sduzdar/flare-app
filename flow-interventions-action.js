'use strict';

(function(){
  window.FlareInterventions=window.FlareInterventions||{};

  window.FlareInterventions.registerAction=function(h){
    const {F,add,abs,choice,form,exit}=h;

    // Information Exit
    form('info:start','/thinking-tool/info','شو المعلومة الناقصة؟',[
      {key:'info',label:'شو المعلومة المحددة؟',placeholder:'مثال: مدة العقد، نتيجة الفحص، موعد…',required:true},
      {key:'info_source',label:'من وين رح تجيبها؟',placeholder:'شخص، مختص، وثيقة، موقع رسمي…',required:true}
    ],abs('info:done'),{desc:'إذا في معلومة حقيقية، ما بدنا نفكر بدلها. بدنا نحددها ونطلع نجيبها.'});

    exit('info:done','/thinking-done/info','صار واضح شو ناقصك','ما بدنا نكمل تفكير داخل FLARE.',c=>'<div class="feature"><h2>'+esc(c.answers.info||'المعلومة اللي حددتها')+'</h2><p>المصدر: '+esc(c.answers.info_source||'المصدر اللي اخترته')+'</p></div>',{cta:{label:'اطلع وروح جيبها',path:'/'},onEnter:c=>{c.setGuard('informationExit',true);c.session.complete=true;persist()}});

    // TOOL-OT-01 — Plan Once
    const guardPlan=c=>c.guards.planCompleted?abs('plan:done'):null;
    choice('plan:start','/thinking-tool/plan','شو بإيدك تعمل؟','في خطوة معقولة تقدر تعملها الآن؟',[
      {label:'نعم',answerKey:'plan_has_step',value:'نعم',target:abs('plan:step')},
      {label:'لا',answerKey:'plan_has_step',value:'لا',target:abs('plan:none')},
      {label:'مش عارف',answerKey:'plan_has_step',value:'مش عارف',target:abs('plan:unsure')}
    ],{desc:'مش بدنا نخطط لكل المستقبل. بدنا نعرف بس إذا في خطوة واحدة مفيدة.',guard:guardPlan});

    form('plan:step','/thinking-tool/plan-step','شو بإيدك تعمل؟',[
      {key:'plan_step',label:'شو هي الخطوة المعقولة اللي بإيدك الآن؟',placeholder:'اتصال؟ سؤال؟ تجهيز؟ ترتيب؟ معلومة؟',required:true}
    ],abs('plan:pre'),{validate:v=>F.validators.concreteAction(v.plan_step)});

    choice('plan:pre','/thinking-tool/plan-pre','خطة واحدة','في شيء لازم يصير قبلها حتى تقدر تعملها؟',[
      {label:'لا',target:abs('plan:done')},
      {label:'نعم',target:abs('plan:pre-detail')}
    ],{desc:'إذا في prerequisite، بدنا واحد ضروري فقط.'});

    form('plan:pre-detail','/thinking-tool/plan-pre-detail','شو لازم يصير قبلها؟',[
      {key:'plan_pre',label:'اكتب prerequisite واحد ضروري فقط.',required:true}
    ],abs('plan:done'));

    choice('plan:none','/thinking-tool/plan-none','ما في خطة إضافية مفيدة الآن','شو الأقرب؟',[
      {label:'خلّي الاحتمال احتمال',target:abs('uncertainty:media')},
      {label:'أنا أصلًا عندي خطة بس التفكير مستمر',target:abs('disengage:media')},
      {label:'خلص، ما في شيء أعمله الآن',target:abs('exit:done')}
    ]);

    choice('plan:unsure','/thinking-tool/plan-unsure','مش واضح إذا في خطوة','تقدر تسمي شيء محدد ناقص حتى تعرف شو تعمل؟',[
      {label:'آه، معلومة محددة',target:abs('info:start')},
      {label:'لا، بس الاحتمالات مستمرة',target:abs('uncertainty:media')},
      {label:'ما بعرف',target:abs('uncertainty:media')}
    ]);

    add({id:'plan:done',path:'/thinking-done/plan',type:'custom',title:'هذا كافي الآن',desc:'مش مطلوب منك تخطط لكل اللي بعده.',onEnter:c=>c.setGuard('planCompleted',true),render:c=>'<div class="feature"><h2>'+esc(c.answers.plan_step||'خطوتك')+'</h2>'+(c.answers.plan_pre?'<p>قبلها: '+esc(c.answers.plan_pre)+'</p>':'')+'</div><button class="primary wide" data-go="/">اطلع واعملها</button>'});

    // Plan Once: after a plan is completed, Back/reload cannot reopen planning branches.
    Object.keys(h.nodes).filter(id=>id.startsWith('plan:')&&id!=='plan:done').forEach(id=>{
      const node=h.nodes[id];
      const prior=node.guard;
      node.guard=c=>guardPlan(c)||(typeof prior==='function'?prior(c):null);
    });

    // TOOL-OT-03 — Next Real Step
    choice('next:type','/thinking-tool/next-step','شو الخطوة الحقيقية التالية؟','شو نوع الخطوة؟',[
      {label:'أجيب معلومة',answerKey:'next_type',target:abs('next:info')},
      {label:'أحكي مع شخص',answerKey:'next_type',target:abs('next:talk')},
      {label:'آخد قرار',answerKey:'next_type',target:abs('next:decision')},
      {label:'أجهز شيء',answerKey:'next_type',target:abs('next:simple')},
      {label:'أجرب خطوة صغيرة',answerKey:'next_type',target:abs('next:simple')},
      {label:'أوقف شيء',answerKey:'next_type',target:abs('next:simple')},
      {label:'شيء ثاني',answerKey:'next_type',target:abs('next:simple')}
    ],{desc:'مش لازم تعرف كل اللي بعدين. بدنا بس أقرب حركة حقيقية.'});

    form('next:info','/thinking-tool/next-info','أجيب معلومة',[
      {key:'next_info',label:'شو المعلومة؟',required:true},
      {key:'next_source',label:'من وين رح تجيبها؟',required:true}
    ],abs('next:time'));

    form('next:talk','/thinking-tool/next-talk','أحكي مع شخص',[
      {key:'next_person',label:'مع مين؟',required:true},
      {key:'next_talk_goal',label:'شو الهدف من المحادثة؟',type:'select',options:['أسأل','أوضح','أطلب','أحط حد','أعتذر','أسمع موقفه']}
    ],abs('next:time'));

    form('next:decision','/thinking-tool/next-decision','آخد قرار',[
      {key:'next_step',label:'شو القرار اللي صار وقته؟',required:true}
    ],abs('next:decision-info'),{validate:v=>F.validators.concreteAction(v.next_step)});

    choice('next:decision-info','/thinking-tool/next-decision-info','قبل القرار','هل ناقصك معلومة ممكن تغيّره؟',[
      {label:'نعم',target:abs('info:start')},
      {label:'لا',target:abs('next:time')}
    ],{notice:'إذا لا، القرار يظل إلك، مش للتطبيق.'});

    form('next:simple','/thinking-tool/next-action','حدّد الحركة',[
      {key:'next_step',label:c=>c.answers.next_type==='أجرب خطوة صغيرة'?'شو أصغر تجربة تعطيك معلومة من الواقع؟':c.answers.next_type==='أجهز شيء'?'شو الشي المحدد اللي لازم تجهزه؟':c.answers.next_type==='أوقف شيء'?'شو الشي المحدد اللي رح توقفه؟':'شو الخطوة نفسها؟',required:true}
    ],abs('next:time'),{validate:v=>F.validators.concreteAction(v.next_step)});

    choice('next:time','/thinking-tool/next-when','متى رح تعملها؟','',[
      {label:'هلا',answerKey:'next_when',target:abs('next:reality')},
      {label:'اليوم',answerKey:'next_when',target:abs('next:reality')},
      {label:'بكرا',answerKey:'next_when',target:abs('next:reality')},
      {label:'وقت أحدده',answerKey:'next_when',target:abs('next:when-detail')}
    ]);

    form('next:when-detail','/thinking-tool/next-when-detail','حدد الوقت',[
      {key:'next_when_detail',label:'متى؟',required:true}
    ],abs('next:reality'));

    add({id:'next:reality',path:'/thinking-tool/next-reality',type:'custom',title:'Reality Check',desc:'قبل ما نثبت الخطوة.',render:c=>{
      let action=c.answers.next_step||'';
      if(c.answers.next_type==='أجيب معلومة')action='أجيب معلومة: '+(c.answers.next_info||'')+' من '+(c.answers.next_source||'');
      if(c.answers.next_type==='أحكي مع شخص')action='أحكي مع '+(c.answers.next_person||'')+' حتى '+(c.answers.next_talk_goal||'');
      c.setAnswer('next_final_action',action);
      return '<div class="feature"><h2>'+esc(action)+'</h2><p>هاي خطوة ممكن نعرف إذا صارت أو ما صارت؟</p><div class="actions"><button class="primary" data-flow-target="'+h.goAbs('next:done')+'">نعم</button><button class="secondary" data-flow-target="'+h.goAbs('next:clarify')+'">لا، بدها تكون أوضح</button></div></div>';
    }});

    form('next:clarify','/thinking-tool/next-clarify','خلّيها حركة أوضح',[
      {key:'next_final_action',label:'شيء ممكن تعمله فعلًا.',required:true}
    ],abs('next:done'),{validate:v=>F.validators.concreteAction(v.next_final_action)});

    add({id:'next:done',path:'/thinking-done/next',type:'custom',title:'خطوتك التالية',desc:'خلص. الباقي مش مطلوب منك هلا.',onEnter:c=>{c.setGuard('nextActionComplete',true);c.session.complete=true;persist()},render:c=>'<div class="feature"><h2>'+esc(c.answers.next_final_action||c.answers.next_step||'الخطوة اللي حددتها')+'</h2><p>'+esc(c.answers.next_when_detail||c.answers.next_when||'هلا')+'</p></div><button class="primary wide" data-go="/">اطلع واعملها</button>'});
    // Once a real action is fixed, Back/reload should not reopen analysis/action-building screens.
    Object.keys(h.nodes).filter(id=>id.startsWith('next:')&&id!=='next:done').forEach(id=>{
      const node=h.nodes[id];
      const prior=node.guard;
      node.guard=c=>c.guards.nextActionComplete?abs('next:done'):(typeof prior==='function'?prior(c):null);
    });
  };
})();