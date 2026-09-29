'use strict';

(function(){
  window.FlareInterventions=window.FlareInterventions||{};

  window.FlareInterventions.registerReflection=function(h){
    const {add,abs,choice,form,exit}=h;

    // WR-OT-01 — review once
    const guardReview=c=>c.guards.reviewStarted?abs('disengage:media'):null;
    add({id:'review:intro',path:'/thinking-tool/review',type:'custom',title:'راجع الموقف مرة واحدة',desc:'مش مطلوب ترجع تعيش كل التفاصيل.',eyebrow:'WR-OT-01',guard:guardReview,onEnter:c=>c.setGuard('reviewStarted',true),render:()=>'<div class="feature"><p>بدنا نعرف بس: شو صار؟ شو فهمت؟ وهل في شيء لازم تعمله؟</p><button class="primary" data-flow-target="/thinking-tool/review-camera">ابدأ المراجعة</button></div>'});

    form('review:camera','/thinking-tool/review-camera','لو في كاميرا بالمكان، شو كانت سجلت؟',[
      {key:'review_camera',label:'اكتب اللي صار بدون تفسير النوايا.',type:'textarea',placeholder:'شو انقال؟ شو صار؟ مين عمل شو؟',required:true}
    ],abs('review:meaning'),{desc:'بدل «كان قصده يقلل مني»، اكتب اللي كان ممكن تنسجله كاميرا.'});

    form('review:meaning','/thinking-tool/review-meaning','إنت شو فهمت من اللي صار؟',[
      {key:'review_meaning',label:'هذا فهمك للموقف، مش تسجيل الكاميرا نفسه.',type:'textarea',required:true}
    ],abs('review:new'),{desc:'مثال: حسيت إنه تجاهلني، أو فهمت إني ما حطيت حد.'});

    choice('review:new','/thinking-tool/review-new','هل طلع من هالمراجعة شيء جديد فعلًا؟','اختار الأقرب:',[
      {label:'فهمت شيء ما كنت منتبهله',answerKey:'review_new_kind',target:abs('review:new-detail')},
      {label:'ظهر شيء لازم أعمله',answerKey:'review_new_kind',target:abs('review:new-detail')},
      {label:'لا، تقريبًا نفس اللي بعرفه',answerKey:'review_new_kind',target:abs('disengage:media')}
    ],{notice:'إذا ما في شيء جديد، ما بدنا نعيد المراجعة.'});

    form('review:new-detail','/thinking-tool/review-new-detail','شو الشي الجديد؟',[
      {key:'review_new_detail',label:'اكتب الشي الجديد بجملة قصيرة.',type:'textarea',required:true}
    ],abs('review:changes-action'));

    choice('review:changes-action','/thinking-tool/review-action','هل هذا يغيّر شو لازم تعمل؟','',[
      {label:'نعم',answerKey:'review_changes_action',value:'نعم',target:abs('review:info-check')},
      {label:'لا',answerKey:'review_changes_action',value:'لا',target:abs('review:info-check')}
    ]);

    choice('review:info-check','/thinking-tool/review-info-check','قبل ما نعتبر المراجعة خلصت','في معلومة خارجية محددة ناقصتك؟',[
      {label:'نعم',target:abs('info:start')},
      {label:'لا',target:c=>c.answers.review_changes_action==='نعم'?abs('next:type'):abs('review:done')}
    ]);

    exit('review:done','/thinking-done/review','خلصت المراجعة','ما بدنا نفتح نفس الموقف مرة ثانية هلا.',()=>'<div class="feature"><p>أخذت الفهم اللي كان بالموقف. ما في خطوة إضافية مطلوبة الآن.</p></div>',{cta:{label:'اطلع',path:'/'},onEnter:c=>{c.session.complete=true;persist()}});

    // TOOL-OT-02 — Enough Point
    const guardEnough=c=>c.guards.blockEnough?abs('exit:uncertainty'):null;
    form('enough:start','/thinking-tool/enough','نقطة الكفاية',[
      {key:'enough_decision',label:'شو القرار اللي قدامك؟',placeholder:'أقبل؟ أرفض؟ أحكي؟ أستنى؟ أبدأ؟',required:true}
    ],abs('enough:known'),{desc:'مش لازم توصل لليقين. بدنا نعرف إذا فعلًا ناقصك شيء مهم، ولا الجزء اللي بقي ما رح تعرفه قبل ما تتحرك.',guard:guardEnough});

    form('enough:known','/thinking-tool/enough-known','شو بتعرف؟',[
      {key:'enough_known_1',label:'أهم معلومة عندك الآن',required:true},
      {key:'enough_known_2',label:'معلومة ثانية'},
      {key:'enough_known_3',label:'معلومة ثالثة'}
    ],abs('enough:missing'),{desc:'ثلاث نقاط قصيرة فقط.'});

    choice('enough:missing','/thinking-tool/enough-missing','المعلومة الناقصة','في معلومة محددة ناقصتك، لو عرفتها ممكن تغيّر قرارك؟',[
      {label:'نعم',answerKey:'enough_missing_choice',value:'نعم',target:abs('enough:missing-detail')},
      {label:'لا',answerKey:'enough_missing_choice',value:'لا',target:abs('enough:waiting')},
      {label:'مش عارف',answerKey:'enough_missing_choice',value:'مش عارف',target:abs('enough:name-missing')}
    ]);

    form('enough:missing-detail','/thinking-tool/enough-missing-detail','شو هي المعلومة؟',[
      {key:'enough_missing_info',label:'شو هي تحديدًا؟',required:true}
    ],abs('enough:obtainable'));

    choice('enough:obtainable','/thinking-tool/enough-obtainable','هل تقدر تحصل عليها فعلًا؟','',[
      {label:'نعم',target:c=>({node:'info:start',answers:{info:c.answers.enough_missing_info||'',info_source:''}})},
      {label:'لا',answerKey:'enough_remaining_type',value:'معلومة لا يمكن الحصول عليها الآن',target:abs('enough:pre-final')}
    ],{notice:'إذا تقدر تحصل عليها، ما تحتاج تفكير أكثر الآن. تحتاج المعلومة.'});

    choice('enough:waiting','/thinking-tool/enough-waiting','شو الشي اللي لسه مستنيه قبل ما تتحرك؟','',[
      {label:'أعرف إني ما رح أندم',answerKey:'enough_waiting',target:abs('enough:today-info')},
      {label:'أضمن إن النتيجة رح تكون منيحة',answerKey:'enough_waiting',target:abs('enough:today-info')},
      {label:'أعرف إنه أفضل خيار',answerKey:'enough_waiting',target:abs('enough:today-info')},
      {label:'أعرف شو رح يصير بعدين',answerKey:'enough_waiting',target:abs('enough:today-info')},
      {label:'أحس مرتاح تمامًا',answerKey:'enough_waiting',target:abs('enough:today-info')},
      {label:'شيء ثاني',answerKey:'enough_waiting',target:abs('enough:waiting-other')}
    ]);

    form('enough:waiting-other','/thinking-tool/enough-waiting-other','شو الشي اللي لسه مستنيه؟',[
      {key:'enough_waiting',label:'اكتبها بجملة قصيرة.',required:true}
    ],abs('enough:today-info'));

    choice('enough:today-info','/thinking-tool/enough-today-info','هل في معلومة موجودة اليوم ممكن تعطيك هذا الجواب؟','',[
      {label:'نعم',target:abs('info:start')},
      {label:'لا',answerKey:'enough_remaining_type',value:'نتيجة مستقبلية / ضمان',target:abs('enough:pre-final')}
    ],{notice:'إذا لا، فاللي بقي مش معلومة ناقصة. اللي بقي جزء من النتيجة.'});

    choice('enough:name-missing','/thinking-tool/enough-name-missing','تقدر تسمي المعلومة الناقصة الآن؟','',[
      {label:'نعم',target:abs('enough:missing-detail')},
      {label:'لا',answerKey:'enough_remaining_type',value:'يقين غير قابل للتسمية كمعلومة',target:abs('enough:pre-final')}
    ],{notice:'لما ما نقدر نسمي المعلومة، أحيانًا اللي ناقصنا مش معرفة أكثر، بل إحساس أكبر باليقين.'});

    choice('enough:pre-final','/thinking-tool/enough-high-stakes','قبل نقطة الكفاية','هل هذا القرار متعلق بالصحة أو العلاج أو الأدوية أو القانون أو السلامة أو مبلغ مالي كبير أو قرار صعب الرجوع عنه؟',[
      {label:'نعم',answerKey:'enough_high_stakes',value:'نعم',target:abs('enough:priority')},
      {label:'لا',answerKey:'enough_high_stakes',value:'لا',target:abs('enough:screen')}
    ],{eyebrow:'High-Stakes Override'});

    choice('enough:priority','/thinking-tool/enough-high-stakes-priority','قبل ما تعتبر المعلومات كافية','هل في معلومة موضوعية أو رأي مختص لازم تحصل عليه أولًا؟',[
      {label:'نعم',target:abs('info:start')},
      {label:'لا',target:abs('enough:screen')}
    ],{notice:'لا نستخدم تحمّل عدم اليقين بدل معلومات لازم تنجمع.'});

    add({id:'enough:screen',path:'/thinking-tool/enough-result',type:'custom',title:'نقطة الكفاية',desc:'هلا القرار يضل إلك. FLARE بس بيساعدك تميّز شو ناقص.',onEnter:c=>c.setGuard('enoughUsed',true),render:c=>{
      const known=[c.answers.enough_known_1,c.answers.enough_known_2,c.answers.enough_known_3].filter(Boolean);
      const remaining=c.answers.enough_missing_info||c.answers.enough_waiting||c.answers.enough_remaining_type||'جزء من النتيجة ما بتقدر تعرفه الآن';
      return '<div class="feature"><h2>اللي عندك</h2>'+known.map(x=>'<p>'+esc(x)+'</p>').join('')+'<h2>اللي بقي</h2><p>'+esc(remaining)+'</p></div><div class="section-title"><h2>هل صار عندك كفاية للخطوة التالية؟</h2></div><div class="stack">'+
        '<button class="row-card" data-flow-target="'+h.goAbs('next:type')+'"><h3>نعم</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-flow-target="'+h.goAbs('info:start')+'"><h3>لسه ناقصني شيء محدد</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-flow-choice="enough:screen" data-flow-option="0"><h3>المعلومات موجودة، بس لسه بدي ضمان</h3>'+icon('arrow','arrow')+'</button></div>';
    },options:[{label:'المعلومات موجودة، بس لسه بدي ضمان',set:{blockEnough:true},target:abs('uncertainty:media')}]});

    // Once A-OT-02 is reached from Enough Point, browser Back / reload must not reopen
    // any prior Enough Point screen in the same visit.
    Object.keys(h.nodes).filter(id=>id.startsWith('enough:')).forEach(id=>{
      const node=h.nodes[id];
      const prior=node.guard;
      node.guard=c=>guardEnough(c)||(typeof prior==='function'?prior(c):null);
    });

    // Cards
    add({id:'card:more',path:'/thinking-tool/card-more',type:'custom',title:'قبل ما تكمل تفكير',desc:'Checkpoint سريع، مش تحليل جديد.',render:()=>'<div class="feature"><p>1. في شيء جديد؟</p><p>2. الجديد يغيّر فهم، قرار، أو فعل؟</p><p>3. في خطوة ممكن تعملها؟</p><p>4. إذا كملت تفكير، شو الجديد اللي متوقع يطلع؟</p></div><div class="stack">'+
      '<button class="row-card" data-flow-target="'+h.goAbs('next:type')+'"><h3>في شيء فعلي ناقص / في خطوة واضحة</h3>'+icon('arrow','arrow')+'</button>'+
      '<button class="row-card" data-flow-target="'+h.goAbs('info:start')+'"><h3>ناقصني معلومة</h3>'+icon('arrow','arrow')+'</button>'+
      '<button class="row-card" data-flow-target="'+h.goAbs('disengage:media')+'"><h3>نفس الكلام عم يرجع</h3>'+icon('arrow','arrow')+'</button>'+
      '<button class="row-card" data-flow-target="'+h.goAbs('enough:start')+'"><h3>عم أدور على ضمان</h3>'+icon('arrow','arrow')+'</button></div><p class="help">يمكن ما عاد ناقصك تفكير.</p>'});

    add({id:'card:question',path:'/thinking-tool/card-question',type:'custom',title:'قبل ما تجاوب السؤال الجديد',desc:'مش كل سؤال جديد لازم يصير مهمة جديدة.',render:()=>'<div class="feature"><p>1. إذا عرفت الجواب، شو رح يتغير؟</p><p>2. في معلومة فعلًا ممكن تعرفها؟</p><p>3. ولا بدك من الجواب راحة، طمأنة، أو إحساس إن الموضوع انتهى؟</p></div><div class="stack">'+
      '<button class="row-card" data-flow-target="'+h.goAbs('next:type')+'"><h3>الجواب يغيّر فعل أو قرار</h3>'+icon('arrow','arrow')+'</button>'+
      '<button class="row-card" data-flow-target="'+h.goAbs('info:start')+'"><h3>في معلومة حقيقية</h3>'+icon('arrow','arrow')+'</button>'+
      '<button class="row-card" data-flow-target="'+h.goAbs('disengage:media')+'"><h3>المطلوب راحة أو طمأنة</h3>'+icon('arrow','arrow')+'</button>'+
      '<button class="row-card" data-flow-target="'+h.goAbs('enough:start')+'"><h3>المطلوب جواب نهائي</h3>'+icon('arrow','arrow')+'</button>'+
      '<button class="row-card" data-flow-target="'+h.goAbs('disengage:media')+'"><h3>مش عارف ليش بدي أجاوبه</h3>'+icon('arrow','arrow')+'</button></div>'});
  };
})();