'use strict';

(function(){
  const finalTitles=[
    'ليش التفكير ما عم يوصل لنهاية؟',
    'عم تفهم اللي صار… ولا عم تعيده؟',
    'عم تخطّط… ولا عم تطارد الاحتمالات؟',
    'يمكن ناقصك يقين، مش معلومة',
    'ليش كل جواب بيطلع سؤال جديد؟',
    'مش كل فكرة بدها جواب',
    'متى لازم توقف تفكير وتتحرّك؟'
  ];

  const thinkingSituations=[
    {id:'past',title:'عم أعيد موقف صار',desc:'الموضوع خلص، بس مخي لسه راجعله.',video:'thinking-1'},
    {id:'future',title:'عم بفكر بكل الأشياء اللي ممكن تصير',desc:'كل احتمال بيفتح احتمال ثاني.',video:'thinking-2'},
    {id:'decision',title:'مش قادر آخد قرار',desc:'فكرت كثير ولسه مش عارف أختار.',video:'thinking-3'},
    {id:'questions',title:'كل ما ألاقي جواب، بيطلع سؤال جديد',desc:'بحس لازم أفهم الموضوع للآخر.',video:'thinking-4'},
    {id:'loop',title:'عارف إني فكرت كفاية، بس مش قادر أتركه',desc:'نفس الأفكار عم ترجع رغم إني فاهمها.',video:'thinking-5'},
    {id:'certainty',title:'بدي أكون متأكد قبل ما أتحرك',desc:'لسه ببحث، بسأل، أو أراجع قبل ما أقرر.',video:'thinking-3'}
  ];

  const tcat=cats.find(function(c){return c.id==='thinking'});
  if(tcat){
    tcat.name='التفكير الزائد';
    tcat.short='التفكير الزائد';
    tcat.desc='نفهم شو عم يعمل التفكير هلا، ونوصل لأقصر خطوة مفيدة.';
    tcat.titles=finalTitles.slice();
  }
  finalTitles.forEach(function(title,i){
    const v=videos.find(function(x){return x.id==='thinking-'+i});
    if(v)v.title=title;
  });

  const originalCategory=category;
  const originalContent=content;

  function thinkingCategory(){
    return back('/library','المكتبة')+
      intro('التفكير الزائد','شو عم بصير معك هلا؟','Prototype · Situation-first')+
      '<div class="list">'+thinkingSituations.map(function(s){
        return '<button class="row-card" data-go="/thinking/'+s.id+'">'+
          '<span class="icon-wrap">'+icon('mind')+'</span>'+
          '<span><h3>'+esc(s.title)+'</h3><small>'+esc(s.desc)+'</small></span>'+
          icon('arrow','arrow')+'</button>';
      }).join('')+'</div>'+
      '<div class="section-title"><h2>إذا بدك تفهم النموذج</h2><small>مش لازم تبدأ بفيديو</small></div>'+
      row(videos.find(function(v){return v.id==='thinking-0'}))+
      '<div class="section-title"><h2>بعد ما تتضح خطوتك</h2><small>فيديو ختامي اختياري</small></div>'+
      row(videos.find(function(v){return v.id==='thinking-6'}));
  }

  function understandButton(s){
    return '<button class="secondary wide" style="margin-top:14px" data-go="/content/'+s.video+'">بدي أفهم شو عم بصير معي</button>';
  }

  function thinkingSituation(id,stage){
    const s=thinkingSituations.find(function(x){return x.id===id});
    if(!s)return notfound();
    const head=back('/category/thinking','التفكير الزائد')+intro(s.title,s.desc,'شو عم بصير معك هلا؟');

    if(id==='past'){
      if(stage==='check'){
        return head+
          '<div class="feature"><h2>لما ترجع للموقف، عم تكتشف شيء جديد؟</h2>'+
          '<div class="actions"><button class="primary" data-go="/thinking-tool/review">آه، في شيء جديد</button>'+
          '<button class="secondary" data-go="/thinking-tool/disengage">لا، تقريبًا نفس الشي</button></div></div>'+
          understandButton(s);
      }
      return head+
        '<div class="feature"><h2>هل في شيء بالموقف لسه محتاج منك تصرّف؟</h2>'+
        '<div class="stack">'+
        '<button class="row-card" data-go="/thinking-tool/next-step"><h3>آه، الخطوة واضحة</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/review"><h3>آه، بس بدي أراجع الموقف مرة واحدة</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking/past/check"><h3>لا، أو مش متأكد</h3>'+icon('arrow','arrow')+'</button>'+
        '</div></div>'+understandButton(s);
    }

    if(id==='future'){
      return head+
        '<div class="feature"><h2>في شيء مفيد تقدر تعمله الآن لو صار هذا الاحتمال؟</h2>'+
        '<div class="stack">'+
        '<button class="row-card" data-go="/thinking-tool/plan"><h3>آه، في خطوة عملية</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/uncertainty"><h3>لا، ما في شيء إضافي بإيدي</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/disengage"><h3>عندي خطة أصلًا، بس الـ«وإذا؟» مستمرة</h3>'+icon('arrow','arrow')+'</button>'+
        '</div></div>'+understandButton(s);
    }

    if(id==='decision'){
      if(stage==='waiting'){
        return head+
          '<div class="feature"><h2>شو الشي اللي عم تستناه قبل ما تقرر؟</h2>'+
          '<div class="stack">'+
          '<button class="row-card" data-go="/thinking-tool/info"><h3>معلومة محددة فعلًا</h3>'+icon('arrow','arrow')+'</button>'+
          '<button class="row-card" data-go="/thinking-tool/enough"><h3>ضمان، راحة كاملة، أو إني ما أندم</h3>'+icon('arrow','arrow')+'</button>'+
          '</div></div>'+understandButton(s);
      }
      return head+
        '<div class="feature"><h2>في معلومة محددة ناقصتك، لو عرفتها ممكن تغيّر القرار؟</h2>'+
        '<div class="actions">'+
        '<button class="primary" data-go="/thinking-tool/info">نعم</button>'+
        '<button class="secondary" data-go="/thinking-tool/enough">لا</button>'+
        '<button class="secondary" data-go="/thinking/decision/waiting">مش عارف</button>'+
        '</div></div>'+understandButton(s);
    }

    if(id==='questions'){
      return head+
        '<div class="feature"><h2>إذا عرفت جواب السؤال هلا، شو رح يتغير؟</h2>'+
        '<div class="stack">'+
        '<button class="row-card" data-go="/thinking-tool/next-step"><h3>قرار أو فعل</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/info"><h3>في معلومة فعلًا لازم أعرفها</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/card-question"><h3>راحة أو طمأنة</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/enough"><h3>بدي جواب نهائي يسكر الموضوع</h3>'+icon('arrow','arrow')+'</button>'+
        '</div></div>'+understandButton(s);
    }

    if(id==='loop'){
      return head+
        '<div class="feature"><h2>تمام. ما بدنا نحل الموضوع من جديد.</h2>'+
        '<p>المطلوب هلا نساعدك تطلع من الحلقة، أو تفهم ليش الفكرة بتضل ترجع.</p>'+
        '<div class="actions">'+
        '<button class="primary" data-go="/thinking-tool/disengage">طلعني من الحلقة — دقيقتين</button>'+
        '<button class="secondary" data-go="/content/thinking-5">بدي أفهم ليش التفكير بيرجع</button>'+
        '</div></div>';
    }

    if(id==='certainty'){
      return head+
        '<div class="feature"><h2>شو الشي اللي لسه بدك تتأكد منه؟</h2>'+
        '<div class="stack">'+
        '<button class="row-card" data-go="/thinking-tool/info"><h3>معلومة ممكن أعرفها فعلًا</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/enough"><h3>بدي أضمن النتيجة أو ما أندم</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/uncertainty"><h3>المعلومات موجودة، بس المجهول لسه مزعجني</h3>'+icon('arrow','arrow')+'</button>'+
        '</div></div>'+understandButton(s);
    }

    return notfound();
  }

  function thinkingVideoContent(id){
    const v=videos.find(function(x){return x.id===id});
    if(!v)return notfound();
    const transitions={
      'thinking-0':'<button class="primary" data-go="/category/thinking">اختار الموقف الأقرب إلك</button>',
      'thinking-1':'<button class="primary" data-go="/thinking-tool/review">راجع الموقف مرة واحدة</button><button class="secondary" data-go="/thinking-tool/disengage">اطلع من الحلقة</button>',
      'thinking-2':'<button class="primary" data-go="/thinking-tool/plan">شو بإيدك تعمل؟</button><button class="secondary" data-go="/thinking-tool/uncertainty">خلّي الاحتمال احتمال</button>',
      'thinking-3':'<button class="primary" data-go="/thinking-tool/enough">نقطة الكفاية</button><button class="secondary" data-go="/thinking-tool/info">ناقصني معلومة</button>',
      'thinking-4':'<button class="primary" data-go="/thinking-tool/card-question">قبل ما تجاوب السؤال الجديد</button><button class="secondary" data-go="/thinking-tool/disengage">اطلع من الحلقة</button>',
      'thinking-5':'<button class="primary" data-go="/thinking-tool/disengage">اطلع من الحلقة</button>',
      'thinking-6':'<button class="primary" data-go="/thinking-tool/next-step">شو الخطوة الحقيقية التالية؟</button><button class="secondary" data-go="/thinking-tool/enough">نقطة الكفاية</button>'
    };
    return back('/category/thinking','التفكير الزائد')+
      '<div class="detail-head"><div><div class="eyebrow">فيديو · Prototype</div><h1>'+esc(v.title)+'</h1></div></div>'+
      '<div class="video-stage"><span class="play-disc">'+icon('play')+'</span><h2>هون بيكون الفيديو بعد تسجيله</h2><p>النص النهائي موجود في Master Teleprompter على Drive.</p></div>'+
      '<div class="section-title"><h2>بعد الفيديو</h2></div>'+
      '<div class="actions">'+(transitions[id]||'')+'</div>';
  }

  category=function(id){
    if(id==='thinking')return thinkingCategory();
    return originalCategory(id);
  };

  content=function(id){
    if(id.indexOf('thinking-')===0)return thinkingVideoContent(id);
    return originalContent(id);
  };

  function thinkingTool(id){
    const home=back('/category/thinking','التفكير الزائد');

    if(id==='info'){
      return home+intro('شو المعلومة الناقصة؟','إذا في معلومة حقيقية، ما بدنا نفكر بدلها. بدنا نحددها ونطلع نجيبها.')+
        '<form id="thinking-info-form">'+
        '<div class="field"><label>شو المعلومة المحددة؟</label><input name="info" required placeholder="مثال: مدة العقد، نتيجة الفحص، موعد…"></div>'+
        '<div class="field"><label>من وين رح تجيبها؟</label><input name="source" required placeholder="شخص، مختص، وثيقة، موقع رسمي…"></div>'+
        '<button class="primary" type="submit">حدد الخطوة واطلع</button></form>';
    }

    if(id==='next-step'){
      return home+intro('شو الخطوة الحقيقية التالية؟','مش لازم تعرف كل اللي بعدين. بدنا أقرب حركة حقيقية.')+
        '<form id="thinking-next-form">'+
        '<div class="field"><label>شو نوع الخطوة؟</label><select name="type"><option>أجيب معلومة</option><option>أحكي مع شخص</option><option>آخد قرار</option><option>أجهز شيء</option><option>أجرب خطوة صغيرة</option><option>أوقف شيء</option><option>شيء ثاني</option></select></div>'+
        '<div class="field"><label>شو الخطوة نفسها؟</label><input name="step" required placeholder="شيء ممكن نعرف إذا صار أو ما صار"></div>'+
        '<div class="field"><label>متى؟</label><select name="when"><option>هلا</option><option>اليوم</option><option>بكرا</option><option>بوقت أحدده</option></select></div>'+
        '<button class="primary" type="submit">ثبت الخطوة</button></form>';
    }

    if(id==='review'){
      return home+intro('راجع الموقف مرة واحدة','هاي مراجعة إلها بداية ونهاية، مش مساحة مفتوحة للدوران.')+
        '<form id="thinking-review-form">'+
        '<div class="field"><label>لو في كاميرا بالمكان، شو كانت سجلت؟</label><textarea name="camera" required placeholder="شو انقال؟ شو صار؟ مين عمل شو؟"></textarea></div>'+
        '<div class="field"><label>إنت شو فهمت من اللي صار؟</label><textarea name="meaning" required></textarea></div>'+
        '<div class="field"><label>شو الشي الجديد فعلًا؟</label><textarea name="new" placeholder="إذا ما في جديد، اكتب: نفس اللي بعرفه"></textarea></div>'+
        '<div class="field"><label>هل في خطوة بدها تصير؟</label><input name="action" placeholder="اختياري"></div>'+
        '<button class="primary" type="submit">خلص المراجعة</button></form>';
    }

    if(id==='plan'){
      return home+intro('شو بإيدك تعمل؟','مش بدنا نخطط لكل المستقبل. بدنا خطوة معقولة واحدة.')+
        '<form id="thinking-plan-form">'+
        '<div class="field"><label>شو الخطوة المعقولة اللي بإيدك الآن؟</label><input name="step" required></div>'+
        '<div class="field"><label>في شيء لازم يصير قبلها؟</label><input name="pre" placeholder="اتركها فاضية إذا لا"></div>'+
        '<button class="primary" type="submit">هاي الخطة كافية الآن</button></form>';
    }

    if(id==='enough'){
      return home+intro('نقطة الكفاية','مش مطلوب توصل لليقين. بدنا نعرف إذا فعلًا ناقصك شيء مهم.')+
        '<form id="thinking-enough-form">'+
        '<div class="field"><label>شو القرار اللي قدامك؟</label><input name="decision" required></div>'+
        '<div class="field"><label>شو أهم المعلومات اللي عندك؟</label><textarea name="known" required placeholder="حتى ثلاث نقاط أساسية"></textarea></div>'+
        '<div class="field"><label>في معلومة محددة ناقصتك؟</label><input name="missing" placeholder="إذا ما في، اكتب: لا"></div>'+
        '<div class="field"><label>شو الشي اللي لسه مستنيه قبل ما تتحرك؟</label><input name="waiting" placeholder="معلومة؟ ضمان؟ راحة 100%؟"></div>'+
        '<button class="primary" type="submit">شوف نقطة الكفاية</button>'+
        '<p class="help">في قرارات الصحة، القانون، السلامة أو المال الكبير: الأولوية لمعلومة موضوعية أو رأي مختص.</p></form>';
    }

    if(id==='card-more'){
      return home+intro('قبل ما تكمل تفكير','Checkpoint سريع، مش تحليل جديد.')+
        '<div class="feature"><p>في شيء جديد؟</p><p>الجديد يغيّر فهم، قرار، أو فعل؟</p><p>في خطوة ممكن تعملها؟</p><p>إذا كملت تفكير، شو الجديد اللي متوقع يطلع؟</p></div>'+
        '<div class="actions"><button class="primary" data-go="/thinking-tool/next-step">في خطوة واضحة</button><button class="secondary" data-go="/thinking-tool/info">ناقصني معلومة</button><button class="secondary" data-go="/thinking-tool/disengage">نفس الكلام عم يرجع</button><button class="secondary" data-go="/thinking-tool/enough">عم أدور على ضمان</button></div>';
    }

    if(id==='card-question'){
      return home+intro('قبل ما تجاوب السؤال الجديد','مش كل سؤال جديد لازم يصير مهمة جديدة.')+
        '<div class="feature"><p>إذا عرفت الجواب، شو رح يتغير؟</p><p>في معلومة فعلًا ممكن تعرفها؟</p><p>ولا بدك من الجواب راحة، طمأنة، أو إحساس إن الموضوع انتهى؟</p></div>'+
        '<div class="actions"><button class="primary" data-go="/thinking-tool/next-step">الجواب يغيّر فعل أو قرار</button><button class="secondary" data-go="/thinking-tool/info">في معلومة حقيقية</button><button class="secondary" data-go="/thinking-tool/disengage">بدي راحة أو طمأنة</button><button class="secondary" data-go="/thinking-tool/enough">بدي جواب نهائي</button></div>';
    }

    if(id==='disengage'){
      return home+intro('اطلع من الحلقة','دقيقتين. ما رح نحل الموضوع من جديد.')+
        '<div class="video-stage"><span class="play-disc">'+icon('headphones')+'</span><h2>هون بتكون الممارسة الصوتية</h2><p>لاحظ إن الفكرة رجعت، لا تكمل الحوار معها، رجّع جزء من انتباهك للمكان، واختار شو بدك تعمل بالعشر دقايق الجايين.</p><span class="pill">A-OT-01 · 2–3 دقائق</span></div>'+
        '<div class="section-title"><h2>بعد الممارسة</h2></div>'+
        '<div class="feature"><h2>قدرت ترجع لشيء ثاني؟</h2><div class="actions"><button class="primary" data-go="/thinking-done/exit">نعم</button><button class="secondary" data-go="/thinking-tool/anchor">شوي</button><button class="secondary" data-go="/thinking-tool/disengage-repeat">لا</button></div></div>';
    }

    if(id==='disengage-repeat'){
      return home+intro('محاولة ثانية قصيرة','مرة واحدة فقط، وبعدها ما بدنا نضل داخل التطبيق.')+
        '<div class="feature"><p>لاحظ الفكرة. لا تجاوبها الآن. انتبه لشيء شايفه، صوت حواليك، وإحساس بجسمك. بعدين اختار فعلًا واحدًا للعشر دقايق الجايين.</p></div>'+
        '<div class="actions"><button class="primary" data-go="/thinking-done/exit">أطلع وأجرب</button><button class="secondary" data-go="/thinking-tool/next-step">ساعدني أحدد شو أعمل</button></div>';
    }

    if(id==='anchor'){
      return home+intro('ارجع للمكان','مش مطلوب تكون طلعت من الفكرة بالكامل.')+
        '<div class="feature"><p>اختار شيء واحد شايفه قدامك.</p><p>صوت واحد حواليك.</p><p>وإحساس واحد بجسمك.</p><p>شو الشي الواحد اللي بدك تعمله خلال الدقائق العشر الجاية؟</p></div>'+
        '<div class="actions"><button class="primary" data-go="/thinking-tool/next-step">حدد الخطوة</button><button class="secondary" data-go="/thinking-done/exit">بعرف شو رح أعمل</button></div>';
    }

    if(id==='uncertainty'){
      return home+intro('خلّي الاحتمال احتمال','ما رح نثبت إنه رح يصير، ولا إنه ما رح يصير، ولا رح نطمنك.')+
        '<div class="video-stage"><span class="play-disc">'+icon('headphones')+'</span><h2>هون بتكون الممارسة الصوتية</h2><p>حط الاحتمال بمكانه الحقيقي: شيء ممكن يصير، وإنت ما بتعرف إذا رح يصير. إذا في فعل اعمله؛ إذا ما في، خلّي الجزء المجهول للمستقبل.</p><span class="pill">A-OT-02 · 2–3 دقائق</span></div>'+
        '<div class="section-title"><h2>بعد الممارسة</h2></div>'+
        '<div class="feature"><h2>في خطوة مفيدة تقدر تعملها الآن؟</h2><div class="actions"><button class="primary" data-go="/thinking-tool/next-step">نعم</button><button class="secondary" data-go="/thinking-tool/info">في معلومة حقيقية ناقصة</button><button class="secondary" data-go="/thinking-done/exit">لا، ما في شيء إضافي</button></div></div>';
    }

    return notfound();
  }

  function thinkingDone(id){
    const home=back('/category/thinking','التفكير الزائد');

    if(id==='info'){
      const v=state.notes['thinking-info']||{};
      return home+intro('صار واضح شو ناقصك','ما بدنا نكمل تفكير داخل FLARE.')+
        '<div class="feature"><h2>'+esc(v.info||'المعلومة اللي حددتها')+'</h2><p>المصدر: '+esc(v.source||'المصدر اللي اخترته')+'</p></div>'+
        '<button class="primary wide" data-go="/">اطلع وروح جيبها</button>';
    }

    if(id==='next'){
      const v=state.notes['thinking-next']||{};
      return home+intro('خطوتك التالية','خلص. الباقي مش مطلوب منك هلا.')+
        '<div class="feature"><h2>'+esc(v.step||'الخطوة اللي حددتها')+'</h2><p>'+esc(v.when||'هلا')+'</p></div>'+
        '<button class="primary wide" data-go="/">اطلع واعملها</button>';
    }

    if(id==='review'){
      const v=state.notes['thinking-review']||{};
      return home+intro('خلصت المراجعة','ما بدنا نفتح نفس الموقف مرة ثانية هلا.')+
        '<div class="feature"><p><b>الشي الجديد:</b> '+esc(v.new||'ما في شيء جديد')+'</p><p><b>الخطوة:</b> '+esc(v.action||'ما في خطوة إضافية')+'</p></div>'+
        '<div class="actions"><button class="primary" data-go="'+(v.action?'/thinking-tool/next-step':'/thinking-done/exit')+'">'+(v.action?'حدد الخطوة':'خلص، اطلع')+'</button><button class="secondary" data-go="/thinking-tool/disengage">المشهد لسه عم يرجع</button></div>';
    }

    if(id==='plan'){
      const v=state.notes['thinking-plan']||{};
      return home+intro('هذا كافي الآن','مش مطلوب منك تخطط لكل اللي بعده.')+
        '<div class="feature"><h2>'+esc(v.step||'خطوتك')+'</h2>'+(v.pre?'<p>قبلها: '+esc(v.pre)+'</p>':'')+'</div>'+
        '<button class="primary wide" data-go="/">اطلع واعملها</button>';
    }

    if(id==='enough'){
      return home+intro('وصلت لنقطة الكفاية؟','هلا القرار يضل إلك. FLARE بس بيساعدك تميّز شو ناقص.')+
        '<div class="stack">'+
        '<button class="row-card" data-go="/thinking-tool/next-step"><h3>آه، عندي كفاية للخطوة التالية</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/info"><h3>لا، ناقصني شيء محدد</h3>'+icon('arrow','arrow')+'</button>'+
        '<button class="row-card" data-go="/thinking-tool/uncertainty"><h3>المعلومات موجودة، بس لسه بدي ضمان</h3>'+icon('arrow','arrow')+'</button>'+
        '</div>';
    }

    if(id==='exit'){
      return home+intro('تمام. وقف هون.','ما في محتوى إضافي لازم تشوفه الآن.')+
        '<div class="feature"><h2>ارجع للي بإيدك اليوم.</h2><p>نجاح الخطوة مش إن الفكرة تختفي. النجاح إنك تقدر ترجع لشيء اخترته.</p></div>'+
        '<button class="primary wide" data-go="/">الرئيسية</button>';
    }

    return notfound();
  }

  function renderThinkingRoute(){
    const r=route().split('/').filter(Boolean);
    let html=null;
    if(r[0]==='thinking')html=thinkingSituation(r[1],r[2]||'');
    else if(r[0]==='thinking-tool')html=thinkingTool(r[1]);
    else if(r[0]==='thinking-done')html=thinkingDone(r[1]);
    if(html===null)return false;
    shell();
    document.querySelector('#app').innerHTML='<div class="screen-in">'+html+'</div>';
    document.title='FLARE — '+(document.querySelector('h1')?.textContent||'التفكير الزائد');
    return true;
  }

  document.addEventListener('submit',function(e){
    const f=e.target;
    if(!f||!f.id||f.id.indexOf('thinking-')!==0)return;
    e.preventDefault();
    const d=new FormData(f);

    if(f.id==='thinking-info-form'){
      state.notes['thinking-info']={info:d.get('info').toString(),source:d.get('source').toString()};
      persist();
      go('/thinking-done/info');
    }else if(f.id==='thinking-next-form'){
      state.notes['thinking-next']={type:d.get('type').toString(),step:d.get('step').toString(),when:d.get('when').toString()};
      persist();
      go('/thinking-done/next');
    }else if(f.id==='thinking-review-form'){
      state.notes['thinking-review']={camera:d.get('camera').toString(),meaning:d.get('meaning').toString(),new:d.get('new').toString(),action:d.get('action').toString().trim()};
      persist();
      go('/thinking-done/review');
    }else if(f.id==='thinking-plan-form'){
      state.notes['thinking-plan']={step:d.get('step').toString(),pre:d.get('pre').toString().trim()};
      persist();
      go('/thinking-done/plan');
    }else if(f.id==='thinking-enough-form'){
      state.notes['thinking-enough']={decision:d.get('decision').toString(),known:d.get('known').toString(),missing:d.get('missing').toString(),waiting:d.get('waiting').toString()};
      persist();
      go('/thinking-done/enough');
    }
  });

  window.addEventListener('hashchange',function(){
    renderThinkingRoute();
  });

  if(route()==='/category/thinking'){
    render();
  }else{
    renderThinkingRoute();
  }
})();
