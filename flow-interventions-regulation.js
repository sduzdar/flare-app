'use strict';

(function(){
  window.FlareInterventions=window.FlareInterventions||{};

  window.FlareInterventions.registerRegulation=function(h){
    const {add,abs,choice,exit}=h;

    // A-OT-01 — Disengagement
    add({id:'disengage:media',path:'/thinking-tool/disengage',type:'media',title:'اطلع من الحلقة',desc:'دقيقتين. ما رح نحل الموضوع من جديد.',mediaType:'audio',placeholderTitle:'هون بتكون الممارسة الصوتية',placeholderBody:'التسجيل سيُضاف لاحقًا.',duration:'A-OT-01 · 2–3 دقائق',after:{prompt:'قدرت ترجع لشيء ثاني؟',options:[
      {label:'نعم',target:abs('exit:disengaged')},
      {label:'شوي',target:abs('disengage:anchor')},
      {label:'لا',target:abs('disengage:no')}
    ]},onEnter:c=>c.incGuard('disengagePlays')});

    choice('disengage:no','/thinking-tool/disengage-no','لسه الحلقة ماسكة','شو بناسبك؟',[
      {label:'جرّب معي مرة ثانية',target:abs('disengage:repeat')},
      {label:'ساعدني أحدد شو لازم أرجعله هلا',target:abs('next:type')}
    ]);

    add({id:'disengage:repeat',path:'/thinking-tool/disengage-repeat',type:'media',title:'محاولة ثانية قصيرة',desc:'مرة واحدة فقط، وبعدها ما بدنا نضل داخل التطبيق.',mediaType:'audio',placeholderTitle:'نفس الممارسة — مرة أخيرة',placeholderBody:'التسجيل سيُضاف لاحقًا.',duration:'A-OT-01 · إعادة واحدة فقط',guard:c=>c.guards.disengagementRepeatUsed&&c.session.currentNode!=='disengage:repeat'?abs('exit:done'):null,onEnter:c=>c.setGuard('disengagementRepeatUsed',true),after:{prompt:'بعد المحاولة الثانية:',options:[
      {label:'أطلع وأجرب',target:abs('exit:done')},
      {label:'ساعدني أحدد شو أعمل',target:abs('next:type')}
    ]}});

    add({id:'disengage:anchor',path:'/thinking-tool/anchor',type:'custom',title:'ارجع للمكان',desc:'مش مطلوب منك تكون طلعت من الفكرة بالكامل.',render:()=>'<div class="feature"><p>اختار شيء واحد شايفه قدامك.</p><p>صوت واحد حواليك.</p><p>وإحساس واحد بجسمك.</p><p>وهلا ارجع للسؤال: شو الشي الواحد اللي بدك تعمله خلال الدقائق العشر الجاية؟</p></div><div class="actions"><button class="primary" data-flow-target="'+h.goAbs('next:type')+'">حدد الخطوة</button><button class="secondary" data-flow-target="'+h.goAbs('exit:done')+'">بعرف شو رح أعمل</button></div>'});

    // A-OT-02 — Uncertainty
    add({id:'uncertainty:media',path:'/thinking-tool/uncertainty',type:'media',title:'خلّي الاحتمال احتمال',desc:'ما رح نثبت إنه رح يصير، ولا إنه ما رح يصير، ولا رح نطمنك.',mediaType:'audio',placeholderTitle:'هون بتكون الممارسة الصوتية',placeholderBody:'التسجيل سيُضاف لاحقًا.',duration:'A-OT-02 · 2–3 دقائق',onEnter:c=>{c.setGuard('uncertaintyUsed',true);if(c.guards.enoughUsed)c.setGuard('blockEnough',true)},after:{prompt:'في خطوة مفيدة تقدر تعملها الآن؟',options:[
      {label:'نعم',target:abs('next:type')},
      {label:'في معلومة حقيقية ناقصة',target:abs('info:start')},
      {label:'لا، ما في شيء إضافي',target:abs('exit:uncertainty')}
    ]}});

    exit('exit:disengaged','/thinking-done/disengaged','تمام. سكّر FLARE وروح كمل الشي اللي اخترته.','',()=>'<div class="feature"><p>نجاح الخطوة مش إن الفكرة تختفي. النجاح إنك تقدر ترجع لشيء اخترته.</p></div>',{cta:{label:'الرئيسية',path:'/'},onEnter:c=>{c.session.complete=true;persist()}});
    exit('exit:uncertainty','/thinking-done/uncertainty','تمام.','ما في شيء إضافي مطلوب منك الآن.',()=>'<div class="feature"><p>خلّي الجزء المجهول للمستقبل، وارجع للي بإيدك اليوم.</p></div>',{cta:{label:'الرئيسية',path:'/'},onEnter:c=>{c.session.complete=true;persist()}});
    exit('exit:done','/thinking-done/exit','تمام. وقف هون.','ما في محتوى إضافي لازم تشوفه الآن.',()=>'<div class="feature"><h2>ارجع للي بإيدك اليوم.</h2><p>نجاح الخطوة مش إن الفكرة تختفي. النجاح إنك تقدر ترجع لشيء اخترته.</p></div>',{cta:{label:'الرئيسية',path:'/'},onEnter:c=>{c.session.complete=true;persist()}});
  };
})();