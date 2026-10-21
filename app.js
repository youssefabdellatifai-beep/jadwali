const courses={net:{name:'Computer Network',ar:'شبكات الحاسب',color:'#2FA8FF',tint:'#E8F4FF',edge:'#b5d8f3'},db:{name:'Database Management',ar:'قواعد البيانات',color:'#00C2A8',tint:'#e6f8f2',edge:'#b5dfd3'},oop:{name:'OOP',ar:'البرمجة كائنية التوجه',color:'#7A5CFF',tint:'#efebff',edge:'#d2c8fa'},prog:{name:'Programming (2)',ar:'البرمجة ٢',color:'#FF4D6D',tint:'#fff0f2',edge:'#f2c4ce'},os:{name:'Operating System',ar:'نظم التشغيل',color:'#e7b02a',tint:'#FFF5D6',edge:'#e8d69a'},disc:{name:'Discrete Structure',ar:'التراكيب المتقطعة',color:'#72819a',tint:'#edf0f5',edge:'#cbd2df'}};
const days=['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء'],enDays=['SATURDAY','SUNDAY','MONDAY','TUESDAY','WEDNESDAY'],ranges={1:[1,2,3,4,5],2:[6,7,8,9,10],3:[11,12,13,14],4:[15,16,17,18]},times=['09:00','11:00','13:00','15:00','17:00'];
let activeCourse='',activeTeacher='',personalView=null;
const $=s=>document.querySelector(s);let saved={};try{saved=JSON.parse(localStorage.getItem('fci-preferences'))}catch(e){}if(!saved)saved={};
let group=ranges[saved.group]?Number(saved.group):1,section=Number(saved.section)?Number(saved.section):0,view=innerWidth<761?'day':'week';
const todayName=new Intl.DateTimeFormat('ar-EG',{weekday:'long',timeZone:'Africa/Cairo'}).format(new Date());
let day=Math.max(0,days.indexOf(todayName));$('#group').value=group;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const taBox=document.createElement('div');
taBox.id='ta-explorer';
taBox.className='ta-explorer';
$('.course-explorer').appendChild(taBox);

function splitTeachers(str){return str?str.split(',').map(s=>s.trim()).filter(Boolean):[]}
function hasTeacher(r,t){return splitTeachers(r.teacher).some(x=>x.toLowerCase()===t.toLowerCase())}

function getTeachersList(courseKey){
  const map=new Map();
  schedule.forEach(r=>{
    if(courseKey&&r.course!==courseKey)return;
    splitTeachers(r.teacher).forEach(name=>{
      const key=name.toLowerCase();
      if(!map.has(key))map.set(key,{name,sections:new Set(),groups:new Set(),courses:new Set()});
      const item=map.get(key);
      item.courses.add(courses[r.course].ar);
      if(r.kind==='L')item.groups.add(r.group);
      r.sections.forEach(s=>item.sections.add(s));
    });
  });
  return Array.from(map.values()).sort((a,b)=>{
    const aDr=a.name.startsWith('Dr')?1:(a.name.startsWith('Prof')?1:0);
    const bDr=b.name.startsWith('Dr')?1:(b.name.startsWith('Prof')?1:0);
    if(aDr!==bDr)return aDr-bDr;
    return a.name.localeCompare(b.name);
  });
}

function renderTeachersBar(){
  const list=getTeachersList(activeCourse);
  const title=activeCourse?`معيدين ومحاضرين ${courses[activeCourse].ar}`:'كل المعيدين والمحاضرين (اضغط على الاسم لعرض جدوله وسكاشنه)';
  taBox.innerHTML=`<div class="ta-header"><span>${title}</span>${activeTeacher?`<button class="teacher-tag" id="clear-ta">✕ إلغاء فلتر المعيد</button>`:'<small>اضغط على أي اسم لعرض جدوله الخاص</small>'}</div><div class="ta-list">${list.map(t=>{
    const secs=Array.from(t.sections).sort((a,b)=>a-b);
    const grps=Array.from(t.groups).sort((a,b)=>a-b);
    const info=[];
    if(secs.length)info.push('سكشن '+secs.join('، '));
    if(grps.length)info.push('مجموعة '+grps.join('، '));
    const isSel=activeTeacher.toLowerCase()===t.name.toLowerCase();
    return `<button class="ta-chip ${isSel?'selected':''}" data-teacher="${esc(t.name)}" aria-pressed="${isSel}"><strong dir="ltr">${esc(t.name)}</strong><span>${info.join(' · ')}</span></button>`;
  }).join('')}</div>`;
}

function sectionOptions(){if(!ranges[group].includes(section))section=0;$('#section').innerHTML='<option value="0">كل سكاشن المجموعة</option>'+ranges[group].map(x=>`<option value="${x}">سكشن ${x}</option>`).join('');$('#section').value=section}

function baseRows(){
  let rows=schedule;
  if(activeCourse)rows=rows.filter(r=>r.course===activeCourse);
  if(activeTeacher)rows=rows.filter(r=>hasTeacher(r,activeTeacher));
  if(activeCourse)return rows;
  if(activeTeacher)return rows;
  return rows.filter(r=>r.kind==='L'?r.group===group:section?r.sections.includes(section):r.group===group);
}

function filtered(){const q=$('#search').value.trim().toLowerCase(),k=$('#kind').value;return baseRows().filter(r=>['all',r.kind].includes(k)&&[courses[r.course].name,courses[r.course].ar,r.teacher?r.teacher:'',r.room?r.room:''].some(s=>String(s).toLowerCase().includes(q)))}
function persist(){try{localStorage.setItem('fci-preferences',JSON.stringify({group,section}))}catch(e){}}

function card(r){
  const c=courses[r.course],isMode=Boolean(activeCourse)+Boolean(activeTeacher)>0;
  const rm=r.room?r.room:'القاعة غير مذكورة',tc=r.teacher?r.teacher:'المحاضر غير مذكور';
  return `<button class="card" data-id="${r.id}" style="--accent:${c.color};--tint:${c.tint};--edge:${c.edge}" aria-label="${esc(c.ar)}، ${days[r.day]}، ${times[r.slot]}، تفاصيل"><span class="card-top"><span>${r.kind==='L'?'محاضرة':'سكشن'}</span><span>${isMode?'المجموعة '+r.group:'↗'}</span></span><h3>${c.name}</h3><div class="room" dir="auto">${esc(rm)}</div>${ r.teacher?`<div class="course-teacher" dir="auto">${esc(tc)}</div>`:''}${r.sections.length?`<span class="sections">سكشن <bdi>${r.sections.join('، ')}</bdi></span>`:''}</button>`;
}

function render(){
  syncCourseUI();
  renderTeachersBar();
  const rows=filtered(),lectures=rows.filter(r=>r.kind==='L').length,dayCount=new Set(rows.map(r=>r.day)).size;
  const allSecs=[...new Set(rows.flatMap(r=>r.sections))].sort((a,b)=>a-b);
  $('#summary').innerHTML=`<span><strong>${lectures}</strong> محاضرات</span><i class="divider"></i><span><strong>${rows.length-lectures}</strong> سكاشن</span><i class="divider"></i><span>${dayCount} أيام بها مواعيد</span>`+(activeTeacher&&allSecs.length?`<i class="divider"></i><span>السكاشن: <strong>${allSecs.join('، ')}</strong></span>`:'');
  
  $('#selection-note').textContent=activeTeacher
    ?`بتشوف جدول (${activeTeacher}) ${activeCourse?'في مادة '+courses[activeCourse].ar:'في كل المواد'}. غير المجموعة أو السكشن فوق للرجوع لجدولك الشخصي.`
    :activeCourse
    ?'كل مواعيد المادة لكل المجموعات والسكاشن. اختار معيد من الشريط فوق عشان تشوف سكاشنه وجدوله.'
    :section
    ?`بتشوف محاضرات المجموعة ${group} والسكاشن المذكور فيها سكشن ${section}، حتى لو اتكتبت في صف مجموعة تانية بالمصدر.`
    :'بتشوف كل مواعيد المجموعة. اختار سكشنك عشان يظهر جدولك الشخصي.';

  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',b.dataset.view===view)});
  $('#daytabs').innerHTML=view==='day'?`<div class="daytabs">${days.map((x,i)=>`<button data-day="${i}" class="${i===day?'active':''}" aria-pressed="${i===day}">${x}</button>`).join('')}</div>`:'';
  if(!rows.length){$('#content').innerHTML='<div class="empty-results"><b>مفيش مواعيد مطابقة</b>جرّب اسم تاني أو غيّر الفلتر.<br><button class="reset" id="reset">عرض كل المواعيد</button></div>';return}
  if(view==='week'){
    let h='<div class="mobile-note">اسحب الجدول أفقيًا لعرض باقي الأيام ←</div><div class="board"><div class="week"><div class="corner">الوقت</div>';
    h+=days.map((x,i)=>`<div class="cell dayhead ${x===todayName?'today':''}">${x}<small>${enDays[i]}${x===todayName?' · اليوم':''}</small></div>`).join('');
    for(let t=0;t<4;t++){
      h+=`<div class="cell time" dir="ltr">${times[t]}<span>—</span>${times[t+1]}</div>`;
      for(let d=0;d<5;d++){
        const entries=rows.filter(r=>r.day===d&&r.slot===t);
        h+=`<div class="cell">${entries.length?entries.map(card).join(''):'<div class="empty-slot" aria-label="لا توجد مواعيد">·</div>'}</div>`;
      }
    }
    $('#content').innerHTML=h+'</div></div>';
  }else{
    const entries=rows.filter(r=>r.day===day);
    $('#content').innerHTML=entries.length?[0,1,2,3].filter(t=>entries.some(r=>r.slot===t)).map(t=>`<div class="daily-slot"><div class="daily-time">${times[t]}<small>إلى ${times[t+1]}</small></div><div>${entries.filter(r=>r.slot===t).map(card).join('')}</div></div>`).join(''):'<div class="empty-results"><b>اليوم فاضي من المواعيد دي ✳</b>اختار يوم تاني أو غيّر الفلتر.</div>';
  }
}

$('#group').addEventListener('change',e=>{
  group=Number(e.target.value);section=0;
  activeCourse='';activeTeacher='';
  if(personalView){view=personalView;personalView=null;}
  sectionOptions();persist();render();
});

$('#section').addEventListener('change',e=>{
  section=Number(e.target.value);
  activeCourse='';activeTeacher='';
  if(personalView){view=personalView;personalView=null;}
  persist();render();
});

$('#search').addEventListener('input',render);
$('#kind').addEventListener('change',render);

document.addEventListener('click',e=>{
  const v=e.target.closest('[data-view]');if(v){view=v.dataset.view;render()}
  const d=e.target.closest('[data-day]');if(d){day=Number(d.dataset.day);render()}
  const c=e.target.closest('[data-id]');if(c)showDetail(Number(c.dataset.id));
  if(e.target.closest('#reset')){$('#search').value='';$('#kind').value='all';render()}
  if(e.target.closest('#clear-ta')){activeTeacher='';render();return;}
  const t=e.target.closest('[data-teacher]');
  if(t){
    const chosen=t.dataset.teacher;
    if(activeTeacher.toLowerCase()===chosen.toLowerCase()){
      activeTeacher='';
      if(!activeCourse&&personalView){view=personalView;personalView=null;}
    }else{
      if(!activeCourse&&!activeTeacher)personalView=view;
      activeTeacher=chosen;
      view='week';
    }
    $('#search').value='';$('#kind').value='all';
    if($('#details').open)$('#details').close();
    render();
  }
});

function showDetail(id){
  const r=schedule.find(r=>r.id===id),c=courses[r.course],rm=r.room?r.room:'غير مذكور في المصدر';
  const fields=[['اليوم',days[r.day]],['الفترة',`${times[r.slot]} — ${times[r.slot+1]}`],['المكان',rm],['المجموعة في المصدر',r.group],...(r.sections.length?[['السكاشن',r.sections.join('، ')]]:[])];
  let teacherHTML='غير مذكور في المصدر';
  if(r.teacher){teacherHTML=splitTeachers(r.teacher).map(t=>`<button class="teacher-tag" data-teacher="${esc(t)}">${esc(t)} ↗</button>`).join(' ')}
  $('#detail-content').innerHTML=`<span class="modal-tag">${r.kind==='L'?'محاضرة':'سكشن'} · ${c.ar}</span><h2 class="modal-course">${c.name}</h2><dl>${fields.map(([k,v])=>`<div><dt>${k}</dt><dd dir="auto">${esc(v)}</dd></div>`).join('')}<div><dt>المحاضر / المعيد</dt><dd dir="auto">${teacherHTML}</dd></div></dl><p class="small">اضغط على اسم المعيد لعرض كل سكاشنه وجدوله الكامل.</p><a class="outline" href="timetable.pdf" target="_blank" rel="noopener">↗ راجع الجدول الأصلي</a>`;
  $('#details').showModal();
}

$('#details .close').onclick=()=>$('#details').close();
$('#details').addEventListener('click',e=>{if(e.target===$('#details')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
$('#legend').innerHTML=Object.values(courses).map(c=>`<div class="legend"><i class="color-dot" style="background:${c.color}"></i>${c.ar}</div>`).join('');
$('#course-choices').innerHTML=Object.entries(courses).map(([key,c])=>`<button class="course-choice" data-course="${key}" aria-pressed="false" style="--course-color:${c.color};--course-tint:${c.tint}"><span class="course-choice-title">${c.ar}</span><span class="course-choice-en" dir="ltr">${c.name}</span><span class="course-choice-arrow" aria-hidden="true">↗</span></button>`).join('');

function selectCourse(key){
  if(!courses[key])return;
  if(activeCourse===key&&!activeTeacher){
    activeCourse='';
    view=personalView?personalView:view;
    personalView=null;
    render();
    return;
  }
  if(!activeCourse&&!activeTeacher)personalView=view;
  activeCourse=key;
  activeTeacher='';
  view='week';
  $('#search').value='';$('#kind').value='all';
  render();
}

function syncCourseUI(){
  const isMode=Boolean(activeCourse)+Boolean(activeTeacher)>0;
  document.body.classList.toggle('course-mode',isMode);
  $('#personal-return').setAttribute('aria-pressed',!isMode);
  $('.side-title').textContent='01 / ظبّط جدولك';
  document.querySelectorAll('[data-course]').forEach(b=>{
    b.classList.toggle('selected',b.dataset.course===activeCourse);
    b.setAttribute('aria-pressed',b.dataset.course===activeCourse);
  });

  if(activeTeacher){
    const sub=activeCourse?` · ${courses[activeCourse].ar}`:'';
    $('#schedule-title').textContent='02 / جدول: '+activeTeacher+sub;
    $('#course-identity').hidden=false;
    const rows=baseRows();
    const secs=[...new Set(rows.flatMap(r=>r.sections))].sort((a,b)=>a-b);
    $('#course-identity').innerHTML=`<i style="background:var(--navy)"></i><strong>${esc(activeTeacher)}</strong><span dir="ltr">${activeCourse?courses[activeCourse].name:'Instructor Schedule'}</span><small>${secs.length?'يدرّس السكاشن: '+secs.join('، '):'محاضرات عامة'}</small>`;
  }else if(activeCourse){
    const c=courses[activeCourse];
    $('#schedule-title').textContent='02 / جدول '+c.ar;
    $('#course-identity').hidden=false;
    $('#course-identity').innerHTML=`<i style="background:${c.color}"></i><strong>${c.ar}</strong><span dir="ltr">${c.name}</span><small>كل المجموعات · كل السكاشن</small>`;
  }else{
    $('#schedule-title').textContent='02 / جدول الأسبوع';
    $('#course-identity').hidden=true;
  }
}

$('#course-choices').addEventListener('click',e=>{const b=e.target.closest('[data-course]');if(b)selectCourse(b.dataset.course)});
$('#personal-return').addEventListener('click',()=>{
  if(!activeCourse&&!activeTeacher)return;
  activeCourse='';activeTeacher='';
  view=personalView?personalView:view;
  personalView=null;
  $('#search').value='';$('#kind').value='all';
  render();
});

sectionOptions();
render();
