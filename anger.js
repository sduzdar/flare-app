'use strict';

(function(){
  const F=window.FlareFlow;
  if(!F)return;

  const VIDEO_TITLES=[
    'الغضب مش هو التصرّف',
    'ليش أول ما أعصب بدي أعمل شي فورًا؟',
    'الموقف خلص… ليش بعدني جواه؟',
    'ساكت… بس هل أنا هادي؟',
    'ليش هالموقف معصّبني لهالدرجة؟',
    'ندمت على اللي عملته وأنا معصّب',
    'كيف تحكي عن غضبك بدون ما يتحول لهجوم؟',
    'لما ما يعود في شي تعمله'
  ];

  const LEGACY_MAP={
    'anger-0':'ANG-01','anger-1':'ANG-02','anger-2':'ANG-03','anger-3':'ANG-04',
    'anger-4':'ANG-05','anger-5':'ANG-06','anger-6':'ANG-07','anger-7':'ANG-08',
    'audio-0':'ANG-02','audio-1':'ANG-03','exercise-0':'ANG-07','exercise-1':'ANG-05','card-anger':'ANG-01'
  };

  // Preserve legacy saved/done/last/note intent while replacing stale Anger catalog IDs.
  let migrated=false;
  const migrateList=list=>Array.from(new Set((Array.isArray(list)?list:[]).map(id=>LEGACY_MAP[id]||id)));
  const oldSaved=(state.saved||[]).filter(id=>LEGACY_MAP[id]);
  const oldDone=(state.done||[]).filter(id=>LEGACY_MAP[id]);
  const oldLast=LEGACY_MAP[state.last]||null;
  const oldNotes={};
  Object.entries(state.notes||{}).forEach(([id,value])=>{if(LEGACY_MAP[id]&&value)oldNotes[id]=value});
  const nextSaved=migrateList(state.saved),nextDone=migrateList(state.done);
  if(JSON.stringify(nextSaved)!==JSON.stringify(state.saved)){state.saved=nextSaved;migrated=true}
  if(JSON.stringify(nextDone)!==JSON.stringify(state.done)){state.done=nextDone;migrated=true}
  if(oldLast){state.last=oldLast;migrated=true}
  Object.entries(oldNotes).forEach(([oldId,value])=>{
    const nextId=LEGACY_MAP[oldId];
    if(!state.notes[nextId])state.notes[nextId]=value;
    delete state.notes[oldId];
    migrated=true;
  });
  if(oldSaved.length||oldDone.length||oldLast||Object.keys(oldNotes).length){
    state.angerMigration={version:1,migratedAt:new Date().toISOString(),saved:oldSaved,done:oldDone,last:state.last,notes:Object.keys(oldNotes)};
    migrated=true;
  }

  const acat=cats.find(c=>c.id==='anger');
  if(acat){
    acat.name='الغضب';
    acat.short='الغضب';
    acat.desc='أوقف الضرر، ميّز شو محتاج الغضب، وافهم بقدر ما يخدم الفعل.';
    acat.titles=VIDEO_TITLES.slice();
  }
  VIDEO_TITLES.forEach((title,index)=>{
    const oldId='anger-'+index;
    const video=videos.find(item=>item.id===oldId)||videos.find(item=>item.id==='ANG-'+String(index+1).padStart(2,'0'));
    if(video){video.id='ANG-'+String(index+1).padStart(2,'0');video.title=title;video.cat='anger'}
  });
  // Remove legacy non-video Anger artifacts; their saved state was mapped above.
  [audios,exercises,cards,all].forEach(collection=>{
    for(let i=collection.length-1;i>=0;i--){if(['audio-0','audio-1','exercise-0','exercise-1','card-anger'].includes(collection[i]?.id))collection.splice(i,1)}
  });
  if(migrated)persist();

  const nodes={};
  const add=node=>(nodes[node.id]=node,node);
  const abs=id=>({node:id});
  const withSession=(id,session)=>({node:id,session});
  const choice=(id,p,title,prompt,options,extra={})=>add(F.builders.choiceNode(id,p,title,prompt,options,extra));
  const form=(id,p,title,fields,next,extra={})=>add(F.builders.formNode(id,p,title,fields,next,extra));
  const exit=(id,p,title,desc,bodyHtml,extra={})=>add(F.builders.exitNode(id,p,title,desc,bodyHtml,extra));
  const setExit=(c,type)=>{c.setSession('exit_state',type);c.session.complete=true;persist()};
  const setRisk=(c,type)=>{c.setSession('risk_state',type);if(type==='acute')c.setGuard('safety_override',true)};

  const situations=[
    {id:'SIT-ANG-01',title:'معصّب وبدي أرد فورًا',desc:'في استعجال ترد أو تعمل شي هلا.',start:'sit:01'},
    {id:'SIT-ANG-02',title:'خلص الموقف، بس بعدني عم أعيده براسي',desc:'المشهد عم يرجع، وبدك تعرف إذا بقي فعل.',start:'sit:02'},
    {id:'SIT-ANG-03',title:'ساكت، بس من جوّا عم أغلي',desc:'بدنا نفهم شو وظيفة السكوت هلا.',start:'sit:03'},
    {id:'SIT-ANG-04',title:'حكيت أو عملت شي وأنا معصّب وندمان',desc:'الإصلاح قبل التبرير.',start:'sit:04'},
    {id:'SIT-ANG-05',title:'بدي أحكي عن اللي صار أو أحط حد',desc:'كلام واضح، بوقت آمن، بدون هجوم.',start:'sit:05'},
    {id:'SIT-ANG-06',title:'مش فاهم ليش هالموقف معصّبني لهالدرجة',desc:'نفهم شو انمسّ، بقدر ما يخدم الفعل.',start:'sit:06'},
    {id:'SIT-ANG-07',title:'الغضب بعده معي، بس ما عاد في شي أعمله',desc:'نتأكد أولًا إنه فعلًا ما بقي فعل مفيد.',start:'sit:07'}
  ];

  choice('sit:01','/anger/sit-01','معصّب وبدي أرد فورًا','شو محتاج هلا؟',[
    {label:'ساعدني أوقف قبل الرد',target:abs('audio:pause')},
    {label:'حاسس إني ممكن أؤذي أو أخوّف حدا',target:withSession('risk:acute',{risk_state:'acute'})}
  ],{eyebrow:'SIT-ANG-01',understand:'/content/ANG-02'});

  choice('sit:02','/anger/sit-02','خلص الموقف، بس بعدني عم أعيده براسي','في شي بالموقف لسه محتاج منك تصرّف؟',[
    {label:'نعم',target:abs('sit:02-action')},
    {label:'لا أو مش عارف',target:abs('sit:02-new')}
  ],{eyebrow:'SIT-ANG-02',understand:'/content/ANG-03'});
  choice('sit:02-action','/anger/sit-02/action','في فعل لسه مطلوب','عارف الخطوة؟',[
    {label:'نعم',target:abs('next:start')},
    {label:'لا',target:abs('review:start')}
  ]);
  choice('sit:02-new','/anger/sit-02/new','قبل ما نراجع أكثر','لما ترجع للموقف، عم يطلع شيء جديد؟',[
    {label:'نعم',target:abs('review:start')},
    {label:'لا',target:abs('audio:replay')}
  ]);

  choice('sit:03','/anger/sit-03','ساكت، بس من جوّا عم أغلي','ليش ساكت؟',[
    {label:'اخترت أأجل الكلام',target:abs('sit:03-delay')},
    {label:'خايف شو يصير لو حكيت',target:abs('sit:03-fear')},
    {label:'مش عارف شو بدي أقول',target:abs('tool:clarity-goal')},
    {label:'ما في مجال آمن أحكي',target:withSession('risk:conversation',{risk_state:'conversation_unsafe'})}
  ],{eyebrow:'SIT-ANG-03',understand:'/content/ANG-04'});
  choice('sit:03-delay','/anger/sit-03/delay','تأجيل مقصود','ناوي ترجع للموضوع لاحقًا؟',[
    {label:'نعم',target:withSession('exit:delay',{future_conversation:true,delay_has_return_plan:true})},
    {label:'لا',target:abs('sit:05')}
  ]);
  choice('sit:03-fear','/anger/sit-03/fear','قبل ما نكمل','في احتمال أذى أو انتقام إذا حكيت؟',[
    {label:'نعم أو ممكن',target:withSession('risk:conversation',{risk_state:'conversation_unsafe'})},
    {label:'لا',target:abs('sit:05')}
  ]);

  choice('sit:04','/anger/sit-04','حكيت أو عملت شي وأنا معصّب وندمان','اللي صار شمل تهديد، تخويف، تكسير، أو أذى؟',[
    {label:'لا',target:abs('tool:repair-action')},
    {label:'نعم',target:abs('sit:04-current-risk')}
  ],{eyebrow:'SIT-ANG-04',understand:'/content/ANG-06'});
  choice('sit:04-current-risk','/anger/sit-04/current-risk','الخطر الحالي هو اللي بيحدد المسار','في احتمال فعلي هلا إنك تؤذي حدا أو تنفذ التهديد؟',[
    {label:'نعم أو ممكن',target:withSession('risk:acute',{risk_state:'acute'})},
    {label:'لا',target:abs('tool:repair-action')}
  ],{notice:'وجود تهديد سابق لا يعني تلقائيًا إن الخطر حالي.'});

  choice('sit:05','/anger/sit-05','بدي أحكي عن اللي صار أو أحط حد','هل الحديث آمن؟',[
    {label:'نعم',target:abs('sit:05-ready')},
    {label:'مش متأكد',target:abs('sit:05-safety')},
    {label:'لا',target:withSession('risk:conversation',{risk_state:'conversation_unsafe'})}
  ],{eyebrow:'SIT-ANG-05',understand:'/content/ANG-07'});
  choice('sit:05-safety','/anger/sit-05/safety','افحص السلامة أولًا','هل المواجهة ممكن تعرّضك لخطر أو انتقام أو أذى؟',[
    {label:'نعم أو ممكن',target:withSession('risk:conversation',{risk_state:'conversation_unsafe'})},
    {label:'لا، آمنة بما يكفي',target:abs('sit:05-ready')}
  ]);
  choice('sit:05-ready','/anger/sit-05/ready','قبل ما تحكي','إذا حكيت هلا، بتقدر تلتزم بالكلام بدون تهديد أو هجوم؟',[
    {label:'نعم',target:abs('sit:05-goal')},
    {label:'مش متأكد',target:abs('sit:05-pause-or-delay')},
    {label:'لا',target:withSession('exit:delay',{delay_has_return_plan:true,future_conversation:true})}
  ]);
  choice('sit:05-pause-or-delay','/anger/sit-05/pause-or-delay','خد مساحة قبل الكلام','شو أنسب هلا؟',[
    {label:'وقفة قصيرة قبل الرد',target:abs('audio:pause')},
    {label:'أأجل الحديث',target:withSession('exit:delay',{delay_has_return_plan:true,future_conversation:true})}
  ]);
  choice('sit:05-goal','/anger/sit-05/goal','شو بدك من الكلام؟','اختار الهدف الأقرب.',[
    {label:'أطلب تغيير',answerKey:'conversation_goal',target:abs('tool:assertive-start')},
    {label:'أوضح أثر اللي صار',answerKey:'conversation_goal',target:abs('tool:assertive-start')},
    {label:'أطلب اعتذار',answerKey:'conversation_goal',target:abs('tool:assertive-start')},
    {label:'أحط حد',answerKey:'conversation_goal',target:abs('tool:assertive-start')},
    {label:'أحل مشكلة',answerKey:'conversation_goal',target:abs('tool:assertive-start')},
    {label:'أنهي نقاش أو تواصل',answerKey:'conversation_goal',target:abs('tool:assertive-start')}
  ],{notice:'طلب الاعتذار ممكن. إجبار الطرف الثاني يعتذر مش تحت سيطرتك.'});

  choice('sit:06','/anger/sit-06','مش فاهم ليش هالموقف معصّبني لهالدرجة','شو حسّيت إنه صار؟',[
    ...['انظلمت','انهانت كرامتي','تجاهلني','سيطر علي','خذلني','تعدّى حد','منعني من شيء مهم','مش واضح'].map(label=>({label,answerKey:'appraisal',target:abs('sit:06-value')}))
  ],{eyebrow:'SIT-ANG-06',understand:'/content/ANG-05'});
  choice('sit:06-value','/anger/sit-06/value','شو انمسّ عندك؟','شو كان مهم إلك هون؟',[
    ...['احترام','عدل','أمان','استقلال','تقدير','ثقة','علاقة','وقت أو جهد','حدود','شيء ثاني'].map(label=>({label,answerKey:'value',target:abs('sit:06-action')}))
  ]);
  choice('sit:06-action','/anger/sit-06/action','الفهم لازم يخدم الفعل','هل في شيء واقعي لازم يتغير؟',[
    {label:'نعم، بدي أحكي أو أحط حد',target:abs('sit:05')},
    {label:'نعم، في خطوة ثانية',target:abs('next:start')},
    {label:'لا',target:withSession('audio:acceptance',{action_status:'none'})},
    {label:'مش عارف',target:abs('card:interpret')}
  ]);

  choice('sit:07','/anger/sit-07','الغضب بعده معي، بس ما عاد في شي أعمله','هل لسه في شيء واقعي بإيدك تعمله؟',[
    {label:'نعم',target:abs('card:action')},
    {label:'مش عارف',target:abs('card:action')},
    {label:'لا',target:withSession('sit:07-meaning',{action_status:'none'})}
  ],{eyebrow:'SIT-ANG-07',understand:'/content/ANG-08'});
  choice('sit:07-meaning','/anger/sit-07/meaning','قبل ما نترك الموقف','إذا بتحب، شو ظل مهم إلك رغم إنه ما بقي فعل؟',[
    {label:'بعرف شو المهم إلي',target:abs('audio:acceptance')},
    {label:'مش لازم أجاوب هلا',target:abs('audio:acceptance')}
  ],{notice:'هذا السؤال اختياري. ما رح نرجع نفتح المشكلة.'});

  // A-ANG-01 — Pause before reply.
  add({id:'audio:pause',path:'/anger/audio/pause',type:'media',title:'وقفة قبل الرد',desc:'مش هدفنا نطفي الغضب. بدنا مساحة صغيرة بينه وبين الفعل.',mediaType:'audio',placeholderTitle:'هون بتكون الممارسة الصوتية',placeholderBody:'حط الموبايل بعيد شوي. خذ مسافة إذا بتقدر. وإذا مريح إلك، بطّئ النفس شوي.',duration:'A-ANG-01',guard:c=>c.session.pause_used?withSession('exit:delay',{delay_has_return_plan:null}):null,onEnter:c=>c.setSession('pause_used',true),after:{prompt:'هل في رد لازم يصير الآن فعلًا؟',options:[
    {label:'لا، بقدر أأجل',target:withSession('exit:delay',{delay_has_return_plan:false})},
    {label:'نعم، لازم أرد بشي بسيط',target:abs('tool:minimal')},
    {label:'بدي أحكي بالموضوع لاحقًا',target:withSession('exit:delay',{future_conversation:true,delay_has_return_plan:true})},
    {label:'حاسس إني ممكن أؤذي أو أخوّف حدا',target:withSession('risk:acute',{risk_state:'acute'})}
  ]}});

  // A-ANG-02 — Replay disengagement. It never reopens review.
  add({id:'audio:replay',path:'/anger/audio/replay',type:'media',title:'اطلع من الإعادة',desc:'ما رح نحل الموقف من جديد.',mediaType:'audio',placeholderTitle:'هون بتكون الممارسة الصوتية',placeholderBody:'لاحظ رجعة المشهد، سمّيها إعادة، وارجع لشي حاضر.',duration:'A-ANG-02',guard:c=>c.session.replay_audio_used?abs('exit:replay'):null,onEnter:c=>c.setSession('replay_audio_used',true),after:{prompt:'هل صار عندك فعل واضح لازم تعمله؟',options:[
    {label:'نعم',target:abs('next:start')},
    {label:'لا',target:abs('exit:replay')},
    {label:'مش متأكد',target:abs('micro:new')}
  ]}});
  choice('micro:new','/anger/micro/new','فحص صغير، مش مراجعة جديدة','هل ظهر واحد من هدول؟',[
    {label:'معلومة جديدة',target:abs('info:start')},
    {label:'قرار أو فعل جديد',target:abs('next:start')},
    {label:'لا، نفس الشي',target:abs('exit:replay')}
  ],{eyebrow:'MICRO-ANG-NEW'});

  // A-ANG-03 — acceptance/defusion/values only after action_status=none.
  add({id:'audio:acceptance',path:'/anger/audio/acceptance',type:'media',title:'الغضب موجود، بس مش لازم يقودك',desc:'ما عاد في فعل مفيد بالموقف نفسه. هلا بنختار وين تروح طاقتك.',mediaType:'audio',placeholderTitle:'هون بتكون الممارسة الصوتية',placeholderBody:'أنا حاسس بالغضب، مش أنا الغضب. شو مهم إلي هلا؟',duration:'A-ANG-03',guard:c=>c.session.action_status!=='none'?abs('card:action'):(c.session.acceptance_audio_used?abs('exit:values'):null),onEnter:c=>c.setSession('acceptance_audio_used',true),after:{prompt:'شو خطوة صغيرة بترجعك لحياتك هلا؟',options:[
    {label:'أكمل شغلة قدامي',answerKey:'values_action',target:abs('exit:values')},
    {label:'أرتاح أو أمشي شوي',answerKey:'values_action',target:abs('exit:values')},
    {label:'أكون مع شخص آمن',answerKey:'values_action',target:abs('exit:values')},
    {label:'شيء ثاني بعرفه',answerKey:'values_action',target:abs('exit:values')}
  ]}});

  // TOOL-ANG-01 — minimal reply, with one deterministic self-check.
  form('tool:minimal','/anger/tool/minimal','رد بالحد الأدنى',[
    {key:'minimal_goal',label:'شو وظيفة الرد؟',type:'select',options:['تأجيل','تأكيد استلام','توضيح','رفض','خطوة عملية']},
    {key:'minimal_reply',label:'اكتب جملة أو جملتين قصار.',placeholder:'مش مناسب أحكي هلا، وبرجعلك لاحقًا.',required:true}
  ],abs('tool:minimal-check'),{onEnter:c=>c.setSession('minimal_reply_used',true)});
  choice('tool:minimal-check','/anger/tool/minimal/check','راجع الرد بنفسك','فيه إهانة، تهديد، سخرية، دفاع طويل، إثبات مين الغلطان، أو أكثر من موضوع؟',[
    {label:'لا',target:withSession('exit:action',{action_status:'found'})},
    {label:'نعم',target:abs('tool:minimal-rewrite')}
  ]);
  form('tool:minimal-rewrite','/anger/tool/minimal/rewrite','شيل كل شي مش ضروري',[
    {key:'minimal_reply',label:'خليه جملة أو جملتين للرد الحالي فقط.',required:true}
  ],withSession('exit:action',{action_status:'found'}),{guard:c=>c.guards.minimalRewriteUsed?withSession('exit:action',{action_status:'found'}):null,onEnter:c=>c.setGuard('minimalRewriteUsed',true)});

  // TOOL-ANG-02 — message clarity and controllable goals.
  choice('tool:clarity-goal','/anger/tool/clarity','شو بدك توصّل؟','شو هدفك الحقيقي؟',[
    ...['أوضح موقفي','أطلب تغيير','أطلب اعتذار','أحط حد','أفهم معلومة','أنهي الموضوع بوضوح'].map(label=>({label,answerKey:'clarity_goal',target:abs('tool:clarity-message')})),
    ...['أخليه يعتذر','أخليه يندم','أخليه يفهم','أخليه يخاف','أعلّمه درس'].map(label=>({label,answerKey:'clarity_goal_uncontrolled',target:abs('tool:clarity-reframe')}))
  ],{onEnter:c=>c.setSession('message_clarity_used',true)});
  choice('tool:clarity-reframe','/anger/tool/clarity/reframe','رجّع الهدف لشي تحت سيطرتك','إنت قادر تطلب نتيجة أو توضّح موقفك، بس مش قادر تضمن كيف الطرف الثاني يرد.',[
    ...['أوضح موقفي','أطلب تغيير','أطلب اعتذار','أحط حد','أفهم معلومة','أنهي الموضوع بوضوح'].map(label=>({label,answerKey:'clarity_goal',target:abs('tool:clarity-message')}))
  ]);
  form('tool:clarity-message','/anger/tool/clarity/message','شو الجملة الأساسية؟',[
    {key:'clarity_message',label:'شو أهم شيء بدك توصّله؟',required:true}
  ],abs('tool:clarity-next'));
  choice('tool:clarity-next','/anger/tool/clarity/next','صار جوهر الرسالة أوضح','شو اكتشفت؟',[
    {label:'بدي أحكيها',target:abs('sit:05')},
    {label:'المشكلة حد',target:abs('tool:assertive-start')},
    {label:'ما في شي لازم ينحكى',target:withSession('audio:acceptance',{action_status:'none'})}
  ]);

  // TOOL-ANG-03 — repair before explanation.
  choice('tool:repair-action','/anger/tool/repair','أصلّح قبل ما أبرر','شو عملت أو قلت؟',[
    ...['حكيت كلام جارح','رفعت صوتي','بعتت رسالة وأنا معصّب','هددت','خوّفت الشخص','كسرت أو أذيت شي','انسحبت بطريقة مؤذية','شيء ثاني'].map(label=>({label,answerKey:'repair_action',target:abs('tool:repair-impact')}))
  ],{onEnter:c=>c.setSession('repair_used',true)});
  choice('tool:repair-impact','/anger/tool/repair/impact','النية ما بتمحي الأثر','شو ممكن يكون أثره؟',[
    ...['جرحت','خوّفت','صعّدت المشكلة','كسرت الثقة','طلّعت الكلام عن الموضوع الأصلي','مش متأكد','شيء ثاني'].map(label=>({label,answerKey:'repair_impact',target:abs('tool:repair-responsibility')}))
  ]);
  form('tool:repair-responsibility','/anger/tool/repair/responsibility','الجزء اللي عليك',[
    {key:'repair_responsibility',label:'كمّل: أنا مسؤول عن ___',required:true}
  ],abs('tool:repair-self-check'));
  choice('tool:repair-self-check','/anger/tool/repair/self-check','مسؤولية بدون دفاع','الجملة فيها «بس» أو رجوع للوم الطرف الثاني؟',[
    {label:'لا',target:abs('tool:repair-fix')},
    {label:'نعم',target:abs('tool:repair-rewrite')}
  ]);
  form('tool:repair-rewrite','/anger/tool/repair/rewrite','خليك بالجزء اللي عليك',[
    {key:'repair_responsibility',label:'أنا مسؤول عن ___',required:true}
  ],abs('tool:repair-fix'),{guard:c=>c.guards.repairRewriteUsed?abs('tool:repair-fix'):null,onEnter:c=>c.setGuard('repairRewriteUsed',true)});
  choice('tool:repair-fix','/anger/tool/repair/fix','شو ممكن يتصلّح؟','اختار الأقرب.',[
    ...['أعتذر','أوضح إني غلطت بطريقة الكلام','أصحح معلومة','أرجع عن تهديد','أصلح ضرر عملي','أعطي مساحة','أرجع أحكي بعد ما أهدى','ما بعرف','ما في إصلاح مباشر'].map(label=>({label,answerKey:'repair_step',target:abs('tool:repair-original')}))
  ]);
  choice('tool:repair-original','/anger/tool/repair/original','بعد ما تحدد الإصلاح','المشكلة الأصلية بعدها موجودة؟',[
    {label:'بدي أحكي عنها',target:abs('sit:05')},
    {label:'بدي أحط حد',target:abs('tool:assertive-start')},
    {label:'لا',target:abs('exit:repair')},
    {label:'مش عارف',target:abs('card:interpret')}
  ]);

  // TOOL-ANG-04 — assertive conversation, one correction pass only.
  choice('tool:assertive-start','/anger/tool/assertive','احكيه بدون هجوم','هل الحديث آمن؟',[
    {label:'نعم',target:abs('tool:assertive-form')},
    {label:'مش متأكد',target:abs('sit:05-safety')},
    {label:'لا',target:withSession('risk:conversation',{risk_state:'conversation_unsafe'})}
  ],{onEnter:c=>c.setSession('assertive_tool_used',true)});
  form('tool:assertive-form','/anger/tool/assertive/form','رتّب المهم فقط',[
    {key:'assertive_event',label:'شو صار؟ صف السلوك بدون تفسير النية.',required:true},
    {key:'assertive_effect',label:'شو أثره عليك؟',required:true},
    {key:'assertive_request',label:'شو بدك يتغير؟',required:true},
    {key:'assertive_boundary',label:'إذا احتجت حد: شو إنت رح تعمل إذا استمر؟',placeholder:'اتركه فارغًا إذا الطلب وحده كفاية.'}
  ],abs('tool:assertive-control'));
  choice('tool:assertive-control','/anger/tool/assertive/control','الطلب غير الحد','الجملة الأساسية بتحكي شو إنت رح تعمل، ولا شو لازم الطرف الثاني يعمل؟',[
    {label:'شو أنا رح أعمل',target:abs('tool:assertive-threat')},
    {label:'شو هو لازم يعمل',target:abs('tool:assertive-request-note')},
    {label:'ما عندي حد، عندي طلب فقط',target:abs('tool:assertive-threat')}
  ]);
  choice('tool:assertive-request-note','/anger/tool/assertive/request-note','هذا طلب، مش حد','الطلب صالح، حتى لو كان طلب اعتذار. بس نجاحك ما بيعتمد على ضمان استجابته.',[
    {label:'واضح، كمّل',target:abs('tool:assertive-threat')},
    {label:'بدي أصيغه كحد تحت سيطرتي',target:abs('tool:assertive-rewrite')}
  ]);
  choice('tool:assertive-threat','/anger/tool/assertive/threat','آخر فحص','في الجملة تهديد أو عقوبة؟',[
    {label:'لا',target:abs('tool:assertive-ready')},
    {label:'نعم',target:abs('tool:assertive-rewrite')}
  ]);
  form('tool:assertive-rewrite','/anger/tool/assertive/rewrite','إعادة صياغة واحدة',[
    {key:'assertive_boundary',label:'اكتب طلبًا واضحًا، أو حدًا يصف شو إنت رح تعمل بدون تهديد.',required:true}
  ],abs('tool:assertive-ready'),{guard:c=>c.guards.assertiveRewriteUsed?abs('tool:assertive-ready'):null,onEnter:c=>c.setGuard('assertiveRewriteUsed',true)});
  choice('tool:assertive-ready','/anger/tool/assertive/ready','صار عندك كلام واضح','شو الخطوة هلا؟',[
    {label:'جاهز أحكيها',target:abs('exit:conversation')},
    {label:'بدي أأجل شوي',target:withSession('exit:delay',{future_conversation:true,delay_has_return_plan:true})},
    {label:'اكتشفت ما في داعي أحكي',target:abs('exit:done')},
    {label:'اكتشفت الحديث مش آمن',target:withSession('risk:conversation',{risk_state:'conversation_unsafe'})}
  ]);

  // WR-ANG-01 — one review only, with one camera-description correction.
  form('review:start','/anger/writing/review','راجع الموقف مرة واحدة',[
    {key:'review_camera',label:'اكتب شو صار كأن كاميرا صورته.',required:true}
  ],abs('review:camera-check'),{guard:c=>c.session.review_used?abs('audio:replay'):null,onEnter:c=>c.setSession('review_used',true)});
  choice('review:camera-check','/anger/writing/review/camera','افصل الحدث عن تفسير النية','اللي كتبته وصف لشي صار، ولا تفسير للنية؟',[
    {label:'وصف لشي صار',target:abs('review:meaning')},
    {label:'تفسير للنية',target:abs('review:rewrite')}
  ]);
  form('review:rewrite','/anger/writing/review/rewrite','ارجع للي انشاف أو انسمع',[
    {key:'review_camera',label:'شو صار فعلًا؟',required:true}
  ],abs('review:meaning'),{guard:c=>c.guards.reviewRewriteUsed?abs('review:meaning'):null,onEnter:c=>c.setGuard('reviewRewriteUsed',true)});
  form('review:meaning','/anger/writing/review/meaning','شو فهمت من الموقف؟',[
    {key:'review_meaning',label:'شو صار يعني إلك؟',required:true},
    {key:'review_value',label:'شو الشي المهم اللي انمسّ عندك؟',required:true}
  ],abs('review:new'));
  choice('review:new','/anger/writing/review/new','وقف عند الجديد','ظهر شيء جديد فعلًا؟',[
    {label:'معلومة ناقصة',target:abs('info:start')},
    {label:'فعل أو قرار واضح',target:abs('next:start')},
    {label:'لا، نفس التفسير عم يرجع',target:abs('audio:replay')}
  ]);

  // Cards and shared checks.
  choice('card:interpret','/anger/card/interpret','قبل ما تفسّر أكثر','شو طلع معك؟',[
    {label:'في فعل واضح',target:abs('next:start')},
    {label:'في معلومة ناقصة',target:abs('info:start')},
    {label:'بدي أحكي أو أحط حد',target:abs('sit:05')},
    {label:'بدي أثبت إني محق أو مش واضح',target:withSession('audio:acceptance',{action_status:'none'})}
  ],{eyebrow:'CARD-ANG-01'});
  choice('card:action','/anger/card/action','هل لسه في شيء بإيدك؟','اختار الشي الواقعي، مش النتيجة اللي بدك تفرضها.',[
    {label:'كلام لازم ينحكى',target:abs('sit:05')},
    {label:'حد تحت سيطرتي',target:abs('tool:assertive-start')},
    {label:'إصلاح لشي عملته',target:abs('tool:repair-action')},
    {label:'معلومة ناقصة',target:abs('info:start')},
    {label:'خطوة ثانية واضحة',target:abs('next:start')},
    {label:'لا شيء واقعي',target:withSession('audio:acceptance',{action_status:'none'})}
  ],{eyebrow:'CARD-ANG-02'});

  form('info:start','/anger/info','شو المعلومة الناقصة؟',[
    {key:'information_needed',label:'حدد المعلومة الفعلية.',required:true},
    {key:'information_source',label:'من أي مصدر حقيقي رح تاخدها؟',required:true}
  ],c=>{c.setSession('information_status','missing');return abs('exit:info')});

  form('next:start','/anger/next-real-step','شو الخطوة الحقيقية التالية؟',[
    {key:'next_action',label:'خطوة ممكن تنشاف، تحت سيطرتك، وممكنة واقعيًا.',placeholder:'مثال: أطلب توضيح بكرا.',required:true}
  ],abs('next:control'),{validate:v=>F.validators.concreteAction(v.next_action)});
  choice('next:control','/anger/next-real-step/control','Reality Check','الخطوة تعتمد على فعلك إنت، ولا على إجبار شخص يغيّر شعوره أو رده؟',[
    {label:'على فعلي أنا',target:withSession('exit:action',{action_status:'found'})},
    {label:'على رده هو',target:abs('next:rewrite')}
  ]);
  form('next:rewrite','/anger/next-real-step/rewrite','رجّعها لشي تحت سيطرتك',[
    {key:'next_action',label:'شو إنت رح تعمل؟',required:true}
  ],withSession('exit:action',{action_status:'found'}),{guard:c=>c.guards.nextRewriteUsed?abs('exit:done'):null,onEnter:c=>c.setGuard('nextRewriteUsed',true),validate:v=>F.validators.concreteAction(v.next_action)});

  // Priority safety states.
  add({id:'risk:acute',path:'/anger/risk/acute',type:'custom',title:'هلا الأولوية للسلامة',desc:'هذا Hard Stop. ما رح نعرض صوت أو كتابة أو إصلاح أو فيديو.',back:false,onEnter:c=>setRisk(c,'acute'),render:()=>'<div class="detail-note status-error"><p>ابعد عن المواجهة إذا بتقدر بأمان.</p><p>لا تواجه الشخص هلا.</p><p>خلي شخص آمن يعرف شو عم يصير.</p><p>وإذا في خطر مباشر، اطلب مساعدة فورية من خدمات الطوارئ المحلية.</p></div><button class="primary wide" data-go="/">اطلع من المسار</button>'});
  add({id:'risk:conversation',path:'/anger/risk/conversation',type:'custom',title:'المواجهة مش آمنة هلا',desc:'هذا مش حكم إن في طارئ آني. بس الحوار نفسه ممكن يعرّضك لأذى أو انتقام.',back:false,onEnter:c=>setRisk(c,'conversation_unsafe'),render:()=>'<div class="detail-note"><p>السلامة والدعم أهم من إنهاء الحديث اليوم.</p></div><div class="feature"><p>أوقف المواجهة هلا.</p><p>احكي مع شخص آمن.</p><p>ارجع للموقف لاحقًا فقط إذا صار آمن.</p></div><button class="primary wide" data-go="/">اطلع من المسار</button>'});

  const exitCopy={
    info:['في معلومة ناقصة فعلًا','حددها وخذها من مصدر حقيقي إذا بتقدر. ما في داعي تكمل تفسير بدونها.'],
    delay:['قرارك هلا إنك ما ترد أو ما تواجه','هذا كفاية لهذه اللحظة.'],
    action:['خطوتك واضحة','اعملها، وما في داعي تكمل تحليل هلا.'],
    conversation:['صار عندك كلام واضح','مش لازم يكون مثالي. احكي لما يكون الوقت مناسب وآمن.'],
    repair:['عرفت الجزء اللي عليك','وعرفت شو ممكن تصلحه. اعمل الإصلاح أولًا.'],
    replay:['ما طلع شيء جديد','إذا رجعت القصة، سمّها إعادة وارجع للي قدامك.'],
    values:['الغضب ممكن يضل موجود شوي','إنت اخترت شو تعمل رغم وجوده.'],
    done:['ما في شي لازم تعمله هلا','وقف هون.']
  };
  Object.entries(exitCopy).forEach(([type,[title,body]])=>exit('exit:'+type,'/anger/exit/'+type,title,body,c=>{
    const detail=type==='action'&&c.answers.next_action?'<div class="feature"><h2>'+esc(c.answers.next_action)+'</h2></div>':
      type==='conversation'&&c.answers.assertive_request?'<div class="feature"><p>'+esc(c.answers.assertive_event||'')+'</p><h2>'+esc(c.answers.assertive_request)+'</h2>'+(c.answers.assertive_boundary?'<p>'+esc(c.answers.assertive_boundary)+'</p>':'')+'</div>':
      type==='repair'&&c.answers.repair_step?'<div class="feature"><h2>'+esc(c.answers.repair_step)+'</h2></div>':'';
    return detail;
  },{back:false,cta:{label:'الرئيسية',path:'/'},onEnter:c=>setExit(c,type)}));

  const videoIds=VIDEO_TITLES.map((_,index)=>'ANG-'+String(index+1).padStart(2,'0'));
  const exitNodes={info:'exit:info',delay:'exit:delay',action:'exit:action',conversation:'exit:conversation',repair:'exit:repair',replay:'exit:replay',values:'exit:values',done:'exit:done'};
  F.register({
    id:'anger',title:'الغضب',icon:'fire',categoryPath:'/category/anger',categoryDesc:'شو محتاج الغضب هلا؟',categoryEyebrow:'Situation-first',situations,nodes,videoIds,
    sessionDefaults:()=>({
      episode_id:'anger-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),risk_state:'none',action_status:'unknown',information_status:'unknown',
      pause_used:false,review_used:false,replay_audio_used:false,acceptance_audio_used:false,minimal_reply_used:false,message_clarity_used:false,repair_used:false,assertive_tool_used:false,
      future_conversation:false,delay_has_return_plan:null,exit_state:null
    }),
    priorityRedirect(c,node){
      if(node.id.startsWith('risk:')||node.id.startsWith('exit:'))return null;
      if(c.session.risk_state==='acute')return abs('risk:acute');
      if(c.session.risk_state==='conversation_unsafe')return abs('risk:conversation');
      if(c.session.exit_state)return abs(exitNodes[c.session.exit_state]||'exit:done');
      if(c.session.action_status==='found')return abs('exit:action');
      if(c.session.information_status==='missing')return abs('exit:info');
      return null;
    },
    videos:{
      'ANG-01':{after:[{label:'اختار الموقف الأقرب إلك',target:'/category/anger',primary:true}]},
      'ANG-02':{after:[{label:'وقفة قبل الرد',target:'audio:pause',primary:true}]},
      'ANG-03':{after:[{label:'راجع الموقف مرة واحدة',target:'review:start',primary:true},{label:'اطلع من الإعادة',target:'audio:replay'}]},
      'ANG-04':{after:[{label:'شو بدك توصّل؟',target:'tool:clarity-goal',primary:true},{label:'افحص أمان الكلام',target:'sit:05'}]},
      'ANG-05':{after:[{label:'حدّد شو انمسّ',target:'sit:06',primary:true}]},
      'ANG-06':{after:[{label:'أصلّح قبل ما أبرر',target:'tool:repair-action',primary:true}]},
      'ANG-07':{after:[{label:'احكيه بدون هجوم',target:'sit:05',primary:true}]},
      'ANG-08':{after:[{label:'هل لسه في شيء بإيدك؟',target:'sit:07',primary:true}]}
    },
    categoryFooter:()=>'<div class="section-title"><h2>النموذج الأساسي</h2><small>الغضب مش هو التصرّف</small></div>'+row(videos.find(v=>v.id==='ANG-01'))
  });
})();
