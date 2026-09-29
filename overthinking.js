'use strict';

(function(){
  const F=window.FlareFlow;
  const I=window.FlareInterventions;
  if(!F||!I)return;

  const finalTitles=[
    'ليش التفكير ما عم يوصل لنهاية؟',
    'عم تفهم اللي صار… ولا عم تعيده؟',
    'عم تخطّط… ولا عم تطارد الاحتمالات؟',
    'يمكن ناقصك يقين، مش معلومة',
    'ليش كل جواب بيطلع سؤال جديد؟',
    'مش كل فكرة بدها جواب',
    'متى لازم توقف تفكير وتتحرّك؟'
  ];

  // Safe migration for the stale eighth thinking video from the old catalog.
  let migrated=false;
  const remapList=list=>Array.from(new Set((Array.isArray(list)?list:[]).map(id=>id==='thinking-7'?'thinking-6':id)));
  const nextSaved=remapList(state.saved),nextDone=remapList(state.done);
  if(JSON.stringify(nextSaved)!==JSON.stringify(state.saved)){state.saved=nextSaved;migrated=true}
  if(JSON.stringify(nextDone)!==JSON.stringify(state.done)){state.done=nextDone;migrated=true}
  if(state.last==='thinking-7'){state.last='thinking-6';migrated=true}
  if(state.notes?.['thinking-7']&&!state.notes['thinking-6']){state.notes['thinking-6']=state.notes['thinking-7'];migrated=true}
  if(state.notes?.['thinking-7']){delete state.notes['thinking-7'];migrated=true}
  const staleVideoIndex=videos.findIndex(v=>v.id==='thinking-7');
  if(staleVideoIndex>=0)videos.splice(staleVideoIndex,1);
  const staleAllIndex=all.findIndex(v=>v.id==='thinking-7');
  if(staleAllIndex>=0)all.splice(staleAllIndex,1);
  if(migrated)persist();

  const tcat=cats.find(c=>c.id==='thinking');
  if(tcat){
    tcat.name='التفكير الزائد';
    tcat.short='التفكير الزائد';
    tcat.desc='نفهم شو عم يعمل التفكير هلا، ونوصل لأقصر خطوة مفيدة.';
    tcat.titles=finalTitles.slice();
  }
  finalTitles.forEach((title,i)=>{const v=videos.find(x=>x.id==='thinking-'+i);if(v)v.title=title});

  const nodes={};
  const add=node=>(nodes[node.id]=node,node);
  const path=id=>nodes[id]?.path||'/';
  const abs=id=>({node:id});
  const goAbs=id=>path(id);
  const choice=(id,p,title,prompt,options,extra={})=>add(F.builders.choiceNode(id,p,title,prompt,options,extra));
  const form=(id,p,title,fields,next,extra={})=>add(F.builders.formNode(id,p,title,fields,next,extra));
  const exit=(id,p,title,desc,bodyHtml,extra={})=>add(F.builders.exitNode(id,p,title,desc,bodyHtml,extra));
  const h={F,I,nodes,add,path,abs,goAbs,choice,form,exit};

  I.registerAction(h);
  I.registerReflection(h);
  I.registerRegulation(h);

  const situations=[
    {id:'past',title:'عم أعيد موقف صار',desc:'الموضوع خلص، بس مخي لسه راجعله.',start:'sit:past'},
    {id:'future',title:'عم بفكر بكل الأشياء اللي ممكن تصير',desc:'كل احتمال بيفتح احتمال ثاني.',start:'sit:future'},
    {id:'decision',title:'مش قادر آخد قرار',desc:'فكرت كثير ولسه مش عارف أختار.',start:'sit:decision'},
    {id:'questions',title:'كل ما ألاقي جواب، بيطلع سؤال جديد',desc:'بحس لازم أفهم الموضوع للآخر.',start:'sit:questions'},
    {id:'loop',title:'عارف إني فكرت كفاية، بس مش قادر أتركه',desc:'نفس الأفكار عم ترجع رغم إني فاهمها.',start:'sit:loop'},
    {id:'certainty',title:'بدي أكون متأكد قبل ما أتحرك',desc:'لسه ببحث، بسأل، أو أراجع قبل ما أقرر.',start:'sit:certainty'}
  ];

  choice('sit:past','/thinking/past','عم أعيد موقف صار','هل في شيء بالموقف لسه محتاج منك تصرّف؟',[
    {label:'آه، الخطوة واضحة',target:abs('next:type')},
    {label:'آه، بس بدي أراجع الموقف مرة واحدة',target:abs('review:intro')},
    {label:'لا، أو مش متأكد',target:abs('sit:past-check')}
  ],{desc:'الموضوع خلص، بس مخي لسه راجعله.',eyebrow:'شو عم بصير معك هلا؟',understand:'/content/thinking-1'});

  choice('sit:past-check','/thinking/past/check','عم أعيد موقف صار','لما ترجع للموقف، عم تكتشف شيء جديد؟',[
    {label:'آه، في شيء جديد',target:abs('review:intro')},
    {label:'لا، تقريبًا نفس الشي',target:abs('disengage:media')}
  ],{desc:'الموضوع خلص، بس مخي لسه راجعله.',eyebrow:'سؤال واحد إضافي',understand:'/content/thinking-1'});

  choice('sit:future','/thinking/future','عم بفكر بكل الأشياء اللي ممكن تصير','في شيء مفيد تقدر تعمله الآن لو صار هذا الاحتمال؟',[
    {label:'آه، في خطوة عملية',target:abs('plan:start')},
    {label:'لا، ما في شيء إضافي بإيدي',target:abs('uncertainty:media')},
    {label:'عندي خطة أصلًا، بس الـ«وإذا؟» مستمرة',target:abs('disengage:media')}
  ],{desc:'كل احتمال بيفتح احتمال ثاني.',eyebrow:'شو عم بصير معك هلا؟',understand:'/content/thinking-2'});

  choice('sit:decision','/thinking/decision','مش قادر آخد قرار','في معلومة محددة ناقصتك، لو عرفتها ممكن تغيّر القرار؟',[
    {label:'نعم',target:abs('info:start')},
    {label:'لا',target:abs('enough:start')},
    {label:'مش عارف',target:abs('sit:decision-waiting')}
  ],{desc:'فكرت كثير ولسه مش عارف أختار.',eyebrow:'شو عم بصير معك هلا؟',understand:'/content/thinking-3'});

  choice('sit:decision-waiting','/thinking/decision/waiting','مش قادر آخد قرار','شو الشي اللي عم تستناه قبل ما تقرر؟',[
    {label:'معلومة محددة فعلًا',target:abs('info:start')},
    {label:'ضمان، راحة كاملة، أو إني ما أندم',target:abs('enough:start')}
  ],{desc:'بدنا نميّز المعلومة عن محاولة الحصول على ضمان.',eyebrow:'سؤال واحد إضافي',understand:'/content/thinking-3'});

  choice('sit:questions','/thinking/questions','كل ما ألاقي جواب، بيطلع سؤال جديد','إذا عرفت جواب السؤال هلا، شو رح يتغير؟',[
    {label:'فهم، قرار، أو فعل',target:abs('next:type')},
    {label:'في معلومة فعلًا لازم أعرفها',target:abs('info:start')},
    {label:'راحة أو طمأنة',target:abs('card:question')},
    {label:'بدي جواب نهائي يسكر الموضوع',target:abs('enough:start')}
  ],{desc:'بحس لازم أفهم الموضوع للآخر.',eyebrow:'شو عم بصير معك هلا؟',understand:'/content/thinking-4'});

  choice('sit:loop','/thinking/loop','عارف إني فكرت كفاية، بس مش قادر أتركه','شو بناسبك هلا؟',[
    {label:'ساعدني هلا — طلعني من الحلقة',desc:'تدخل قصير. ما رح نحل الموضوع من جديد.',target:abs('disengage:media')},
    {label:'بدي أفهم ليش التفكير بيرجع',target:'/content/thinking-5'}
  ],{desc:'نفس الأفكار عم ترجع رغم إني فاهمها.',eyebrow:'ما بدنا Micro-Router هون'});

  choice('sit:certainty','/thinking/certainty','بدي أكون متأكد قبل ما أتحرك','شو الشي اللي لسه بدك تتأكد منه؟',[
    {label:'معلومة ممكن أعرفها فعلًا',target:abs('info:start')},
    {label:'بدي أضمن النتيجة أو ما أندم',target:abs('enough:start')},
    {label:'المعلومات موجودة، بس المجهول لسه مزعجني',target:abs('uncertainty:media')}
  ],{desc:'لسه ببحث، بسأل، أو أراجع قبل ما أقرر.',eyebrow:'شو عم بصير معك هلا؟',understand:'/content/thinking-3'});

  const videoIds=finalTitles.map((_,i)=>'thinking-'+i);
  F.register({
    id:'thinking',
    title:'التفكير الزائد',
    icon:'mind',
    categoryPath:'/category/thinking',
    categoryDesc:'شو عم بصير معك هلا؟',
    categoryEyebrow:'Situation-first',
    situations,
    nodes,
    videoIds,
    videos:{
      'thinking-0':{after:[{label:'اختار الموقف الأقرب إلك',target:'/category/thinking',primary:true},{label:'قبل ما تكمل تفكير',target:'card:more'}]},
      'thinking-1':{after:[{label:'راجع الموقف مرة واحدة',target:'review:intro',primary:true},{label:'اطلع من الحلقة',target:'disengage:media'}]},
      'thinking-2':{after:[{label:'شو بإيدك تعمل؟',target:'plan:start',primary:true},{label:'خلّي الاحتمال احتمال',target:'uncertainty:media'}]},
      'thinking-3':{after:[{label:'نقطة الكفاية',target:'enough:start',primary:true},{label:'ناقصني معلومة',target:'info:start'}]},
      'thinking-4':{after:[{label:'قبل ما تجاوب السؤال الجديد',target:'card:question',primary:true},{label:'اطلع من الحلقة',target:'disengage:media'}]},
      'thinking-5':{after:[{label:'اطلع من الحلقة',target:'disengage:media',primary:true}]},
      'thinking-6':{after:[{label:'شو الخطوة الحقيقية التالية؟',target:'next:type',primary:true},{label:'نقطة الكفاية',target:'enough:start'}]}
    },
    categoryFooter:()=>'<div class="section-title"><h2>إذا بدك تفهم النموذج</h2><small>مش لازم تبدأ بفيديو</small></div>'+row(videos.find(v=>v.id==='thinking-0'))+'<div class="section-title"><h2>بعد ما تتضح خطوتك</h2><small>فيديو ختامي اختياري</small></div>'+row(videos.find(v=>v.id==='thinking-6'))
  });
})();