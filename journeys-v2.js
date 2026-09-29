'use strict';

(function(){
  const F=window.FlareFlow;
  if(!F)return;

  const addNode=(flow,node)=>{
    flow.nodes[node.id]=node;
    if(node.path)flow.pathMap[node.path]=node;
    return node;
  };
  const target=node=>({node});
  const button=(label,node,kind='primary')=>'<button class="'+kind+' wide" data-flow-target="'+node+'">'+label+'</button>';
  const duzi=(id,body)=>'<div class="duzi-card"><span class="duzi-badge">DUZI · '+id+'</span><p>'+body+'</p></div>';

  const deltaText=(start,end,same)=>{
    const delta=end-start;
    if(delta<0)return 'نزلت '+Math.abs(delta)+' درجات.';
    if(delta>0)return 'زادت '+delta+' درجات.';
    return same;
  };

  const angerIntensity=end=>{
    if(end===0)return 'هلا الشحنة هديت تمامًا. ما في داعي تعمل شي لمجرد إنك كنت معصّب قبل شوي. إذا في خطوة واضحة، خذها بهدوء. وإذا ما في، خلصنا لهلا.';
    if(end<=2)return 'الشحنة صارت خفيفة جدًا. هلا عندك مساحة أكبر تختار. إذا في شي لازم يتقال أو يتعمل، خذه من هالمكان، مش من لحظة الغضب.';
    if(end<=4)return 'الغضب لسه موجود، بس صار أهدأ. وهذا غالبًا كفاية حتى ترجع إلك مساحة اختيار. إذا في خطوة واضحة، خذها. وإذا ما في، ما بدنا نخترع وحدة.';
    if(end<=6)return 'لسه في شحنة واضحة. ما بنحتاج نستعجل. إذا في قرار أو مواجهة، يمكن الأفضل تأجلها شوي وتكمل لما يصير عندك مساحة أكبر.';
    if(end<=8)return 'لسه الغضب عالي. هلا الأولوية مش إنك تحسم الموقف؛ الأولوية إنك ما تخلي أعلى لحظة بالشحنة تختار عنك. خذ مسافة وكمل بعدين إذا احتجت.';
    return 'الشحنة لسه قوية جدًا. ما تعمل قرار كبير هلا. لا تواجه، لا تبعت شي مهم، وخذ مسافة عن الموقف إذا بتقدر. ضل داخل FLARE وخليك مع خطوة التهدئة.';
  };

  const thinkingIntensity=end=>{
    if(end===0)return 'هلا الحلقة وقفت. ما في داعي تفتحها مرة ثانية لمجرد تتأكد إنها خلصت. ارجع للشي اللي قدامك.';
    if(end<=2)return 'الفكرة بعدها موجودة بخفة، بس ما عادت ماسكة انتباهك. خذ خطوتك أو ارجع ليومك.';
    if(end<=4)return 'التفكير لسه موجود، بس صار في مساحة ترجع لشي ثاني. النجاح هون مش اختفاء الفكرة؛ النجاح إنك ما تضل داخلها.';
    if(end<=6)return 'الحلقة لسه واضحة. لا تفتح أسئلة جديدة. إذا في فعل واحد اعمله، وإذا ما في ارجع لشي حاضر عشر دقايق.';
    if(end<=8)return 'التفكير لسه ماسك مساحة كبيرة. ما بدنا جوابًا إضافيًا هلا. خذ تدخل الخروج من الحلقة مرة واحدة، وبعدها ارجع لشي بسيط قدامك.';
    return 'الحلقة قوية جدًا هلا. لا تحاول تحسم قرار كبير أو تطمّن نفسك بجولة بحث جديدة. خليك مع خطوة الاحتواء القصيرة، وإذا الموضوع عالي المخاطر اجمع المعلومة الموضوعية أو رأي المختص أولًا.';
  };

  function install(flowId,config){
    const flow=F._flows.get(flowId);if(!flow)return;
    const oldStarts={};
    flow.situations.forEach(s=>oldStarts[s.id]=s.start);

    config.situations.forEach((spec,index)=>{
      const situation=flow.situations[index];if(!situation)return;
      const oldStart=oldStarts[situation.id];
      const key=String(index+1).padStart(2,'0');
      const prefix='journey:'+flowId+':'+key;
      const route='/'+flowId+'/journey-'+key;
      situation.id=spec.situationId;
      situation.start=prefix+':welcome';

      addNode(flow,{id:prefix+':welcome',path:route+'/welcome',type:'custom',title:situation.title,desc:situation.desc,eyebrow:spec.situationId,back:flow.categoryPath,render:()=>
        duzi(spec.openingId,spec.opening)+
        '<div class="entry-safety"><strong>قبل ما نبلّش</strong><p>'+config.safetyNote+'</p></div>'+
        button('بلّش',prefix+':baseline')});

      addNode(flow,{id:prefix+':baseline',path:route+'/baseline',type:'rating',title:config.ratingTitle,desc:'اختار الرقم الأقرب هلا. مش لازم يكون دقيق.',eyebrow:'بداية الجلسة',key:'baseline_rating',defaultValue:5,next:target(prefix+':main')});

      addNode(flow,{id:prefix+':main',path:route+'/main',type:'media',title:spec.videoTitle,desc:spec.videoDesc,eyebrow:spec.videoId,mediaType:'video',placeholderTitle:'مكان فيديو دوزي الرئيسي',placeholderBody:'الفيديو سيُضاف هون بعد التصوير. المسار كامل وقابل للتجربة من دون الملف.',duration:spec.videoId,after:{prompt:spec.microPrompt,options:spec.options.map((option,i)=>({label:option.label,target:target(prefix+':bridge:'+i)}))}});

      spec.options.forEach((option,i)=>addNode(flow,{id:prefix+':bridge:'+i,path:route+'/bridge-'+i,type:'media',title:option.bridgeTitle,desc:option.bridgeDesc||'رد قصير من دوزي يربط اختيارك بالخطوة التالية.',eyebrow:option.bridgeId,mediaType:'video',placeholderTitle:'مكان مقطع دوزي القصير',placeholderBody:option.bridgeScript,duration:option.bridgeId,after:{prompt:'الخطوة التالية',options:[{label:option.cta||'كمّل',target:target(option.target||oldStart)}]}}));
    });

    const exits=Object.values(flow.nodes).filter(n=>n.id.startsWith('exit:'));
    exits.forEach(node=>{
      const previousTitle=node.title;
      node.v2ExitTitle=previousTitle;
      node.type='rating';node.title=config.finalTitle;node.desc='نفس المقياس اللي بدأنا فيه.';node.eyebrow='نهاية الجلسة';node.back=false;
      node.key='final_rating';node.defaultValue=c=>c.session.baseline_rating??5;node.next=target('journey:'+flowId+':closure');
      node.onEnter=c=>c.setSession('closure_type',node.id.replace('exit:',''));
    });

    addNode(flow,{id:'journey:'+flowId+':final',path:'/'+flowId+'/journey/final',type:'rating',title:config.finalTitle,desc:'نفس المقياس اللي بدأنا فيه.',eyebrow:'نهاية الجلسة',back:false,key:'final_rating',defaultValue:c=>c.session.baseline_rating??5,next:target('journey:'+flowId+':closure')});
    addNode(flow,{id:'journey:'+flowId+':closure',path:'/'+flowId+'/journey/closure',type:'custom',title:'قبل ما تسكّر',desc:'القياس مش حكم عليك؛ هو لقطة عن هاي اللحظة.',eyebrow:config.closureId,back:false,onEnter:c=>{c.session.complete=true;persist()},render:c=>{
      const start=Number(c.session.baseline_rating??0),end=Number(c.session.final_rating??start);
      const delta=deltaText(start,end,config.sameText),intensity=config.intensity(end);
      const next=end>=9?button(config.highCta,'journey:'+flowId+':containment'):'';
      return '<div class="rating-comparison"><span>'+start+' <small>بالبداية</small></span><b>←</b><span>'+end+' <small>هلا</small></span></div>'+duzi(config.closureId,'<strong>'+delta+'</strong> '+intensity)+next+
        '<div class="closure-actions"><button class="secondary" data-flow-pattern="'+flow.id+'">احفظ النمط</button><button class="primary" data-go="/">ارجع للرئيسية</button></div>';
    }});
    addNode(flow,{id:'journey:'+flowId+':containment',path:'/'+flowId+'/journey/containment',type:'media',title:config.containmentTitle,desc:config.containmentDesc,eyebrow:config.containmentId,back:false,mediaType:'audio',placeholderTitle:'مكان ممارسة الاحتواء القصيرة',placeholderBody:config.containmentBody,duration:config.containmentId,after:{prompt:'بعد الممارسة',options:[{label:'أقيس مرة ثانية',target:target('journey:'+flowId+':final')},{label:'أخذت مساحة وبدي أوقف هون',target:target('journey:'+flowId+':closure')}]}});

    const oldPriority=flow.priorityRedirect;
    flow.priorityRedirect=(c,node)=>{
      if(node.id.startsWith('journey:')||node.id.startsWith('risk:')||node.id.startsWith('safety:')||node.id.startsWith('exit:'))return null;
      if(flowId==='anger'&&c.session.risk_state==='acute'&&!c.session.safety_contained)return target('risk:acute');
      return oldPriority?oldPriority(c,node):null;
    };
  }

  const angerSpecs=[
    {situationId:'SIT-ANG-01',openingId:'OPEN-ANG-01',opening:'واضح إن في استعجال تعمل شي هلا. أول خطوة مش نقرر مين معه حق؛ أول خطوة نعمل مساحة صغيرة بين الغضب والفعل.',videoId:'ANG-02',videoTitle:'ليش أول ما أعصب بدي أعمل شي فورًا؟',videoDesc:'نفهم الاستعجال، وبعدين نختار خطوة آمنة.',microPrompt:'شو الأقرب هلا؟',options:[
      {label:'بدي أوقف قبل ما أرد',bridgeId:'BR-ANG-01A',bridgeTitle:'خلّينا نعمل مساحة',bridgeScript:'مش مطلوب يختفي الغضب. بس بدنا نمنع أعلى لحظة بالشحنة من إنها تختار عنك.',target:'audio:pause',cta:'ابدأ الوقفة'},
      {label:'في خطر فعلي إني أؤذي أو أخوّف حدا',bridgeId:'BR-ANG-01B',bridgeTitle:'هلا الأولوية للسلامة',bridgeScript:'شكراً إنك سميتها بوضوح. رح نوقف أدوات الرد ونضل داخل FLARE بخطوة احتواء آمنة.',target:'risk:acute',cta:'ادخل وضع السلامة'}]},
    {situationId:'SIT-ANG-02',openingId:'OPEN-ANG-02',opening:'رجعة الموقف مش دليل إنه ناقصك تفكير أكثر. بدنا نعرف إذا ظهر فعل جديد، أو إنها نفس الحلقة.',videoId:'ANG-03',videoTitle:'الموقف خلص… ليش بعدني جواه؟',videoDesc:'نميّز المراجعة المفيدة عن إعادة المشهد.',microPrompt:'لما بترجع للموقف، شو عم يصير؟',options:[
      {label:'في شي جديد أو فعل محتمل',bridgeId:'BR-ANG-02A',bridgeTitle:'مراجعة واحدة',bridgeScript:'رح نعطي الموقف مراجعة واحدة فقط، وبعدين نطلع بخطوة أو نوقف.',target:'sit:02'},
      {label:'نفس المشهد تقريبًا',bridgeId:'BR-ANG-02B',bridgeTitle:'هاي إعادة، مش معلومة',bridgeScript:'ما بدنا نحل الموقف مرة ثانية. بدنا نلاحظ رجعته ونرجع لشي حاضر.',target:'audio:replay'}]},
    {situationId:'SIT-ANG-03',openingId:'OPEN-ANG-03',opening:'السكوت ممكن يكون اختيار واعي، وممكن يكون خوف أو عجز عن ترتيب الكلام. بدنا نعرف وظيفته هلا.',videoId:'ANG-04',videoTitle:'ساكت… بس هل أنا هادي؟',videoDesc:'نفهم السكوت بدون ما نفترض إنه هدوء.',microPrompt:'سكوتك هلا أقرب لأي شي؟',options:[
      {label:'تأجيل مقصود',bridgeId:'BR-ANG-03A',bridgeTitle:'التأجيل ممكن يكون قرار',bridgeScript:'إذا في وقت رجعة واضح، السكوت هون مش اختفاء. هو تنظيم للتوقيت.',target:'sit:03-delay'},
      {label:'خوف، غليان، أو الكلام مش واضح',bridgeId:'BR-ANG-03B',bridgeTitle:'نفكك السبب',bridgeScript:'مش رح ندفعك للمواجهة. أولًا نفحص الأمان، وبعدها نرتب شو بدك تقول.',target:'sit:03'}]},
    {situationId:'SIT-ANG-04',openingId:'OPEN-ANG-04',opening:'الندم ممكن يفتح باب إصلاح، بس إذا تحول لتبرير أو جلد ذات ما رح يصلح الأثر.',videoId:'ANG-06',videoTitle:'ندمت على اللي عملته وأنا معصّب',videoDesc:'نمسك الجزء اللي علينا قبل شرح الأسباب.',microPrompt:'شو الأولوية هلا؟',options:[
      {label:'أصلّح الأثر اللي صار',bridgeId:'BR-ANG-04A',bridgeTitle:'الإصلاح قبل التفسير',bridgeScript:'رح نسمي الفعل، أثره، والجزء اللي عليك. وبعدها بنشوف شو ممكن يتصلح.',target:'tool:repair-action'},
      {label:'لازم أفحص إذا في خطر حالي',bridgeId:'BR-ANG-04B',bridgeTitle:'الخطر الحالي أولًا',bridgeScript:'وجود تصرف سابق ما يعني تلقائيًا خطر هلا. رح نسأل سؤالًا مباشرًا عن اللحظة الحالية.',target:'sit:04-current-risk'}]},
    {situationId:'SIT-ANG-05',openingId:'OPEN-ANG-05',opening:'الطلب بحكي شو بدك من الطرف الثاني. الحد بحكي شو إنت رح تعمل إذا استمر الشي. الاثنين لازم يضلوا بدون تهديد.',videoId:'ANG-07',videoTitle:'كيف تحكي عن غضبك بدون ما يتحول لهجوم؟',videoDesc:'من شعور مشحون إلى طلب أو حد واضح.',microPrompt:'شو بدك تبني؟',options:[
      {label:'طلب واضح',bridgeId:'BR-ANG-05A',bridgeTitle:'الطلب مش ضمان',bridgeScript:'رح نصيغ شو بدك يتغير بجملة واضحة. الطرف الثاني ممكن يوافق أو يرفض.',target:'v2:assertive:request'},
      {label:'حد تحت سيطرتي',bridgeId:'BR-ANG-05B',bridgeTitle:'الحد فعل إنت بتعمله',bridgeScript:'الصيغة بسيطة: إذا استمر كذا، أنا رح أعمل كذا. مش عقوبة ولا محاولة سيطرة.',target:'v2:assertive:boundary'}]},
    {situationId:'SIT-ANG-06',openingId:'OPEN-ANG-06',opening:'أحيانًا حجم الغضب مرتبط بالمعنى اللي أخذه الموقف: إهانة، ظلم، تجاهل، أو كسر حد. نفهمه بقدر ما يخدم الفعل.',videoId:'ANG-05',videoTitle:'ليش هالموقف معصّبني لهالدرجة؟',videoDesc:'من الحدث إلى المعنى، ثم إلى ما يمكن فعله.',microPrompt:'شو الأنسب؟',options:[
      {label:'بدي أفهم شو انمسّ عندي',bridgeId:'BR-ANG-06A',bridgeTitle:'نفصل الحدث عن معناه',bridgeScript:'أولًا شو صار فعلًا بجملة. بعدها شو كان معناه إلك. ما بدنا قصة أطول.',target:'v2:meaning:event'},
      {label:'الفعل واضح وما بدي تحليل أكثر',bridgeId:'BR-ANG-06B',bridgeTitle:'الفهم مش شرط يسبق كل فعل',bridgeScript:'إذا الخطوة واضحة وآمنة، ما في داعي نخترع طبقة تحليل جديدة.',target:'next:start'}]},
    {situationId:'SIT-ANG-07',openingId:'OPEN-ANG-07',opening:'ممكن يضل الغضب موجود حتى بعد ما يخلص دوره. قبل القبول، نتأكد إنه فعلًا ما بقي فعل واقعي.',videoId:'ANG-08',videoTitle:'لما ما يعود في شي تعمله',videoDesc:'نميّز بين فعل ممكن ورغبة إن الماضي يتغير.',microPrompt:'هل بقي شي بإيدك؟',options:[
      {label:'ممكن يكون في خطوة',bridgeId:'BR-ANG-07A',bridgeTitle:'نفحص الفعل الواقعي',bridgeScript:'بدنا خطوة تحت سيطرتك، مش نتيجة لازم شخص ثاني يعطيك إياها.',target:'card:action'},
      {label:'لا، ما بقي فعل مفيد',bridgeId:'BR-ANG-07B',bridgeTitle:'نترك الفعل ونحمل القيمة',bridgeScript:'القبول هون مش موافقة على اللي صار. هو وقف محاولة تغييره بعد ما انتهى.',target:'audio:acceptance'}]}
  ];

  const thinkingSpecs=[
    {situationId:'SIT-OT-01',openingId:'OPEN-OT-01',opening:'ممكن تكون عم تحاول تفهم اللي صار، وممكن تكون عم تعيده بنفس الكلمات. الفرق هو: هل عم يطلع شي جديد؟',videoId:'OT-02',videoTitle:'عم تفهم اللي صار… ولا عم تعيده؟',videoDesc:'مراجعة واحدة، ثم فعل أو خروج من الحلقة.',microPrompt:'شو عم يعطيك التفكير هلا؟',options:[
      {label:'شي جديد أو فعل واضح',bridgeId:'BR-OT-01A',bridgeTitle:'نراجع مرة واحدة',bridgeScript:'رح نعطي الموقف مراجعة محدودة تخدم قرارًا أو فعلًا، مش إعادة مفتوحة.',target:'sit:past'},
      {label:'نفس الكلام عم يرجع',bridgeId:'BR-OT-01B',bridgeTitle:'مش ناقصك جولة ثانية',bridgeScript:'هلا الهدف مش جواب جديد. الهدف ترجع انتباهك لشي اخترته.',target:'disengage:media'}]},
    {situationId:'SIT-OT-02',openingId:'OPEN-OT-02',opening:'التخطيط بيوصل لخطوة. مطاردة الاحتمالات بتفتح «وإذا؟» جديدة كل مرة. بدنا نعرف بأي وحدة إنت.',videoId:'OT-03',videoTitle:'عم تخطّط… ولا عم تطارد الاحتمالات؟',videoDesc:'نحوّل الممكن إلى خطة قصيرة، أو نتركه احتمالًا.',microPrompt:'في شي مفيد بإيدك هلا؟',options:[
      {label:'آه، في خطوة عملية',bridgeId:'BR-OT-02A',bridgeTitle:'خطة قصيرة تكفي',bridgeScript:'رح نبني خطوة للحاضر، بدون محاولة تغطية كل سيناريو ممكن.',target:'plan:start'},
      {label:'لا، بس الاحتمال مزعج',bridgeId:'BR-OT-02B',bridgeTitle:'الاحتمال يضل احتمال',bridgeScript:'ما رح نثبت إنه رح يصير ولا نطمنك إنه مستحيل. رح نرجع للي بإيدك.',target:'uncertainty:media'}]},
    {situationId:'SIT-OT-03',openingId:'OPEN-OT-03',opening:'أحيانًا القرار واقف لأن معلومة مهمة ناقصة. وأحيانًا كل المعلومات موجودة بس ما في ضمان.',videoId:'OT-04',videoTitle:'يمكن ناقصك يقين، مش معلومة',videoDesc:'نفرّق بين معلومة قابلة للجمع وضمان غير متاح.',microPrompt:'شو الأقرب؟',options:[
      {label:'في معلومة محددة ناقصة',bridgeId:'BR-OT-03A',bridgeTitle:'اجمع المعلومة، مش التفكير',bridgeScript:'إذا المعلومة موجودة ويمكن الوصول إلها، هذا مسار جمع معلومة، مش تحمّل مجهول.',target:'info:start'},
      {label:'بدي أضمن النتيجة',bridgeId:'BR-OT-03B',bridgeTitle:'نقطة الكفاية',bridgeScript:'رح نحدد شو بتعرف، وشو ما رح تعرفه قبل الحركة، بدون ما نقرر عنك.',target:'enough:start'}]},
    {situationId:'SIT-OT-04',openingId:'OPEN-OT-04',opening:'السؤال الجديد ممكن يكون مهم. وممكن يكون طريقة حتى تاخد جرعة طمأنة قصيرة، وبعدها يطلع سؤال ثاني.',videoId:'OT-05',videoTitle:'ليش كل جواب بيطلع سؤال جديد؟',videoDesc:'نفحص وظيفة السؤال قبل ما نجاوبه.',microPrompt:'لو عرفت الجواب، شو رح يتغير؟',options:[
      {label:'قرار أو فعل',bridgeId:'BR-OT-04A',bridgeTitle:'خلي الجواب يخدم خطوة',bridgeScript:'رح نحدد الفعل أولًا، وبعدها فقط المعلومة اللازمة إله.',target:'next:type'},
      {label:'راحة، طمأنة، أو جواب نهائي',bridgeId:'BR-OT-04B',bridgeTitle:'الطمأنة مش نهاية الحلقة',bridgeScript:'إذا وظيفة السؤال تهدئة القلق فقط، جواب جديد غالبًا رح يشتغل لدقائق. بدنا مسار مختلف.',target:'card:question'}]},
    {situationId:'SIT-OT-05',openingId:'OPEN-OT-05',opening:'إنت مش محتاج تقنع نفسك إن الفكرة غلط. محتاج تتعلم تلاحظ رجعتها بدون ما تدخل معها بجولة جديدة.',videoId:'OT-06',videoTitle:'مش كل فكرة بدها جواب',videoDesc:'فك الارتباط والرجوع لشي حاضر.',microPrompt:'شو بدك هلا؟',options:[
      {label:'طلعني من الحلقة',bridgeId:'BR-OT-05A',bridgeTitle:'من التفكير للانتباه',bridgeScript:'رح نستخدم تدخلًا قصيرًا مرة أو مرتين فقط، وبعدها نرجع لشي خارج FLARE.',target:'disengage:media'},
      {label:'بدي أفهم ليش بترجع',bridgeId:'BR-OT-05B',bridgeTitle:'نفهم بدون ما نطوّل الحلقة',bridgeScript:'الفكرة بترجع لأن الدماغ يربط تكرارها بمحاولة الحماية، مش لأنها صارت أهم.',target:'sit:loop'}]},
    {situationId:'SIT-OT-06',openingId:'OPEN-OT-06',opening:'التحرك بدون يقين كامل مش تهور. التهور هو تجاهل معلومات مهمة. هون بدنا نحدد نقطة الكفاية ونحترم القرارات عالية المخاطر.',videoId:'OT-04',videoTitle:'يمكن ناقصك يقين، مش معلومة',videoDesc:'المعلومة الموضوعية أولًا، وبعدها مساحة للمجهول.',microPrompt:'شو اللي موقفك؟',options:[
      {label:'معلومة أقدر أعرفها',bridgeId:'BR-OT-06A',bridgeTitle:'سمّي المصدر الحقيقي',bridgeScript:'رح نكتب المعلومة ومصدرها. ما بدنا نبحث بلا نهاية.',target:'info:start'},
      {label:'ضمان أو راحة كاملة',bridgeId:'BR-OT-06B',bridgeTitle:'ما رح نوعدك باليقين',bridgeScript:'رح نحدد نقطة كفاية، مع تجاوز خاص للصحة والقانون والسلامة والمال الكبير.',target:'enough:start'}]}
  ];

  install('anger',{situations:angerSpecs,ratingTitle:'قديش شدة الغضب هلا؟',finalTitle:'قديش شدة الغضب هلا؟',sameText:'لسه نفس الشدة.',intensity:angerIntensity,closureId:'CL-ANG-DYNAMIC',safetyNote:'ارتفاع الغضب لحاله مش معناه خطر. وضع السلامة بيفتح فقط إذا إنت قلت إن في خطر فعلي هلا.',highCta:'ضل معي بخطوة تهدئة',containmentId:'A-ANG-SAFE-01',containmentTitle:'خليك مع خطوة التهدئة',containmentDesc:'ما في مواجهة ولا قرار كبير هلا.',containmentBody:'خذ مسافة عن الموقف إذا بتقدر. خلي شخص آمن يعرف. وإذا في خطر مباشر، تواصل مع خدمات الطوارئ المحلية.'});
  install('thinking',{situations:thinkingSpecs,ratingTitle:'قديش الفكرة ماسكة انتباهك هلا؟',finalTitle:'قديش الفكرة ماسكة انتباهك هلا؟',sameText:'لسه ماسكة نفس المساحة.',intensity:thinkingIntensity,closureId:'CL-OT-DYNAMIC',safetyNote:'إذا الموضوع صحي، قانوني، متعلق بالسلامة، دواء، أو مبلغ كبير، المعلومة الموضوعية ورأي المختص إلهم أولوية.',highCta:'خذ خطوة خروج قصيرة',containmentId:'A-OT-01',containmentTitle:'اطلع من الحلقة',containmentDesc:'ما رح نحل الموضوع من جديد.',containmentBody:'لاحظ الفكرة كفكرة. سمّي شي شايفه، صوت سامعه، وإحساس بجسمك. بعدها ارجع لشي واحد خلال عشر دقايق.'});

  const anger=F._flows.get('anger');
  if(anger){
    addNode(anger,{id:'v2:assertive:request',path:'/anger/v2/request',type:'form',title:'شو الطلب الواضح اللي بدك توصله؟',desc:'الطلب هو شو بدك من الطرف الثاني يعمل. ممكن يوافق وممكن يرفض.',eyebrow:'طلب · حقل واحد',fields:[{key:'assertive_request',label:'بدي منك…',placeholder:'مثال: بدي نحكي بدون رفع صوت.',required:true}],next:target('v2:assertive:safety')});
    addNode(anger,{id:'v2:assertive:boundary',path:'/anger/v2/boundary',type:'form',title:'شو الحد اللي تحت سيطرتك؟',desc:'الحد هو شو إنت رح تعمل، مش كيف رح تجبر الشخص الثاني يتصرف.',eyebrow:'حد · حقل واحد',fields:[{key:'assertive_boundary',label:'إذا استمر ______، أنا رح ______.',placeholder:'مثال: إذا ارتفع الصوت، أنا رح أوقف الحديث.',required:true}],next:target('v2:assertive:safety')});
    addNode(anger,{id:'v2:assertive:safety',path:'/anger/v2/conversation-safety',type:'choice',title:'قبل ما تستخدم الجملة',prompt:'هل الحديث آمن بما يكفي؟',notice:'إذا مش آمن، ما لازم تواجه حتى تثبت موقفك.',options:[{label:'نعم، آمن بما يكفي',target:target('exit:conversation')},{label:'لا أو مش متأكد',target:{node:'risk:conversation',session:{risk_state:'conversation_unsafe'}}}]});

    addNode(anger,{id:'v2:meaning:event',path:'/anger/v2/meaning-event',type:'form',title:'شو صار فعلًا؟',desc:'جملة واحدة تصف الحدث، بدون تفسير نية الشخص.',eyebrow:'الحدث أولًا',fields:[{key:'meaning_event',label:'شو صار؟',required:true}],next:target('v2:meaning:choice')});
    addNode(anger,{id:'v2:meaning:choice',path:'/anger/v2/meaning-choice',type:'choice',title:'شو كان الأقرب لمعناه إلك؟',prompt:'اختار الأقرب، مش لازم يكون كامل.',options:['إهانة أو تقليل','ظلم','تجاهل','كسر حد','خيبة أو توقع انكسر','مش واضح'].map(label=>({label,answerKey:'appraisal',target:target('v2:meaning:optional')}))});
    addNode(anger,{id:'v2:meaning:optional',path:'/anger/v2/meaning-optional',type:'custom',title:'إذا بتحب، كمّل خطوة',desc:'الكتابة هون اختيارية.',eyebrow:'سؤال اختياري',render:()=>'<form data-flow-id="anger" data-flow-form="v2:meaning:optional-form"><div class="field"><label>شو كان أصعب شي فيه بالنسبة إلك؟</label><textarea name="meaning_hardest" placeholder="اكتب إذا هذا بيساعدك."></textarea></div><div class="actions"><button class="primary" type="submit">كمّل</button><button class="secondary" type="button" data-flow-target="sit:06-action">كمّل بدون كتابة</button></div></form>'});
    addNode(anger,{id:'v2:meaning:optional-form',path:'/anger/v2/meaning-optional-submit',type:'form',title:'',fields:[],next:target('sit:06-action')});

    const acute=anger.nodes['risk:acute'];
    if(acute)Object.assign(acute,{title:'هلا الأولوية للسلامة',desc:'رح نوقف أدوات الرد والمواجهة مؤقتًا، بس ما رح نطلعك من FLARE.',eyebrow:'وضع سلامة محصور',back:false,onEnter:c=>{c.setSession('risk_state','acute');c.setSession('safety_contained',true)},render:()=>
      '<div class="contained-safety"><h2>خذ مسافة عن الموقف إذا بتقدر بأمان.</h2><p>لا تواجه ولا تبعت رسالة مهمة هلا. خلي شخص آمن يعرف شو عم يصير. وإذا في خطر مباشر، اطلب مساعدة فورية من خدمات الطوارئ المحلية.</p></div>'+button('أخذت مسافة — كمّل معي','safety:pause')+button('بدي أضل بخطة الأمان','safety:plan','secondary')});
    addNode(anger,{id:'safety:pause',path:'/anger/safety/pause',type:'media',title:'ثبّت المسافة',desc:'الشحنة عالية، بس هلا عم نشتغل على السلامة مش على حل الخلاف.',eyebrow:'A-ANG-SAFE-01',back:false,mediaType:'audio',placeholderTitle:'مكان صوت الاحتواء',placeholderBody:'ثبت رجليك. ابعد أي وسيلة ممكن تستخدمها للأذى. تواصل مع شخص آمن وخليك بعيد عن المواجهة.',duration:'A-ANG-SAFE-01',after:{prompt:'شو صار ممكن هلا؟',options:[{label:'بدي أفهم بدون مواجهة',target:target('sit:06')},{label:'بدي أوقف هون وأقيس',target:target('journey:anger:final')}]}});
    addNode(anger,{id:'safety:plan',path:'/anger/safety/plan',type:'custom',title:'خطة الأمان لهلا',desc:'خليها قصيرة وقابلة للتنفيذ.',eyebrow:'SAFE-ANG-PLAN',back:false,render:()=>'<div class="feature"><p>1. ابتعد عن الشخص أو المكان إذا هذا آمن.</p><p>2. حط مسافة بينك وبين أي وسيلة أذى.</p><p>3. تواصل الآن مع شخص آمن.</p><p>4. إذا الخطر مباشر، استخدم خدمات الطوارئ المحلية.</p></div>'+button('عملت الخطوة الآمنة','safety:pause')});
    const unsafe=anger.nodes['risk:conversation'];
    if(unsafe)Object.assign(unsafe,{desc:'مش لازم تواجه حتى تثبت إنك قوي. السلامة قبل إغلاق الحديث.',back:false,render:()=>'<div class="contained-safety"><p>أوقف المواجهة هلا. احكي مع شخص آمن، وارجع للموضوع فقط إذا صار آمن.</p></div>'+button('بدي أرتب خطوة دعم','safety:plan')+button('أقيس وأوقف هون','journey:anger:final','secondary')});
  }
})();
