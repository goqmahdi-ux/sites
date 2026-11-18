/* المنظمين: قائمة المنظمين، الدخول والصلاحيات برمز تلقائي، ومنطقة حضور الجامعة */
(()=>{
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ORG_URL=new URL('org/',location.href.split('?')[0].replace(/[^/]*$/,'')).href,SYS_URL=new URL('./',location.href.split('?')[0]).href;
const tok=()=>{try{return JSON.parse(localStorage.getItem('ks-token')||'null')}catch(e){return localStorage.getItem('ks-token')}};
async function api(r,b={}){const res=await fetch('api.php?r='+r,{method:'POST',headers:{'Content-Type':'application/json','X-Token':tok()||''},body:JSON.stringify(b)});let j={};try{j=await res.json()}catch(e){}if(!res.ok)throw new Error(j.msg||'صار خطأ، حاول مرة ثانية');return j}
const PERMS=[['checkin','تسجيل الضيوف'],['print','الطباعة'],['reprint','إعادة الطباعة'],['move','نقل ضيف لكرسي ثاني'],['free','تفريغ الكراسي'],['guests','إدارة قائمة الضيوف'],['export','تنزيل الكشف']];
const PRE={reg:{l:'استقبال وتسجيل',d:'يسجّل الضيوف ويطبع الستكرات',role:'staff',p:['checkin','print','reprint']},sup:{l:'مشرف',d:'كل صلاحيات الاستقبال مع النقل والتفريغ والقائمة',role:'staff',p:['checkin','print','reprint','move','free','guests','export']},view:{l:'منظم بدون تسجيل',d:'يدخل ويشوف القاعة والكراسي بس',role:'staff',p:[]},admin:{l:'مدير',d:'كل الصلاحيات',role:'admin',p:PERMS.map(x=>x[0])}};
const SHIFT={a:'12 ظهراً – 6 مساءً',b:'4 مساءً – 10 ليلاً'},SHS={a:'الوجبة الأولى',b:'الوجبة الثانية'};
const FIELDS=['الاستقبال والتسجيل','إرشاد الضيوف','تنظيم القاعة والجلسات','التنسيق اللوجستي','التغطية الإعلامية والتصوير'];
let D={orgs:[],zone:{},today:'',admins:[],loose:[],nvotes:0},q='',flt='all',fld='',day='';
const st=document.createElement('style');st.textContent=`
#orgP{position:fixed;inset:0;z-index:60;background:var(--bg,#f6f3f0);display:none;flex-direction:column;direction:rtl}#orgP.on{display:flex}
#orgP .opTop{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:14px 18px;background:#fff;border-bottom:1px solid rgba(0,0,0,.07)}
#orgP .opTop h2{margin:0;font-size:22px;color:#5a1238}#orgP .opSub{font-size:13px;color:#8a7f78}
#orgP .opAct{margin-inline-start:auto;display:flex;gap:8px;flex-wrap:wrap}
#orgP .opBar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;padding:12px 18px}
#orgP .opBar .inp{flex:1 1 220px;min-width:180px;margin:0}
#orgP .chips{display:flex;gap:6px;flex-wrap:wrap}#orgP .chips button{font:inherit;font-size:13px;padding:7px 12px;border-radius:999px;border:1px solid rgba(0,0,0,.1);background:#fff;cursor:pointer;color:#3a2a31}
#orgP .chips button.on{background:#5a1238;color:#fff;border-color:#5a1238}#orgP .chips button b{font-weight:700;margin-inline-start:4px}
#orgP select.os{font:inherit;font-size:13px;padding:7px 10px;border-radius:10px;border:1px solid rgba(0,0,0,.12);background:#fff}
#orgP .opList{flex:1;overflow:auto;padding:4px 18px 30px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;align-content:start}
#orgP .oc{background:#fff;border-radius:16px;border:1px solid rgba(0,0,0,.06);box-shadow:0 2px 8px rgba(0,0,0,.04);padding:12px 14px;display:flex;flex-direction:column;gap:8px}
#orgP .ocH{display:flex;gap:10px;align-items:center}#orgP .av{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:700;color:#fff;flex:none;background:#b06b8a}#orgP .av.m{background:#3f6f8f}
#orgP .ocH b{display:block;font-size:15.5px;line-height:1.35}#orgP .ocH small{color:#8a7f78;font-size:12.5px}
#orgP .pill{margin-inline-start:auto;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;white-space:nowrap;background:#f1ece9;color:#8a7f78}#orgP .pill.in{background:#e3f4ea;color:#1f7a4a}
#orgP .ocB{font-size:13px;color:#4a3d43;display:flex;flex-direction:column;gap:5px}#orgP .ocB a{color:#5a1238;text-decoration:none;font-weight:600}
#orgP .tags{display:flex;gap:4px;flex-wrap:wrap}#orgP .tags span{font-size:11.5px;background:#f6eef2;color:#5a1238;border-radius:7px;padding:2px 7px}
#orgP .ocF{display:flex;gap:6px;align-items:center;flex-wrap:wrap;border-top:1px dashed rgba(0,0,0,.08);padding-top:8px}
#orgP .ocF .btn{padding:7px 11px;font-size:13px;min-height:0}#orgP .pin{font-weight:700;letter-spacing:.08em;color:#1f7a4a;background:#e3f4ea;border-radius:8px;padding:4px 8px;font-size:13px}#orgP .rl{font-size:12px;color:#8a7f78}
#orgP .sh{font-size:11.5px;font-weight:700;border-radius:7px;padding:2px 8px;background:#efe6ff;color:#4b2a86}#orgP .sh.b{background:#ffe9d6;color:#8a4a12}#orgP .fu{font-size:11px;color:#1f7a4a;background:#e3f4ea;border-radius:7px;padding:2px 7px}
#orgM .lk{border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:12px;margin-bottom:10px}#orgM .lk b{display:block;color:#5a1238;margin-bottom:2px}#orgM .lk code{display:block;font-size:12.5px;direction:ltr;text-align:left;word-break:break-all;background:#f6f3f0;border-radius:8px;padding:6px 8px;margin:6px 0}#orgM .lk .row{margin-top:6px}
#orgP .vw{font-size:12px;color:#8a4a12;background:#fff4e5;border-radius:8px;padding:4px 8px}
#orgM .vl{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid rgba(0,0,0,.06);font-size:13.5px}#orgM .vl small{color:#8a7f78}#orgM .vh{margin:14px 0 6px;font-weight:700;color:#5a1238;font-size:14px}#orgM .vk{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:6px}#orgM .vk div{background:#f6f3f0;border-radius:12px;padding:10px;text-align:center}#orgM .vk b{display:block;font-size:24px;color:#5a1238}
#orgP .empty{grid-column:1/-1;text-align:center;color:#8a7f78;padding:40px}
#orgM{position:fixed;inset:0;z-index:70;background:rgba(20,8,14,.45);display:none;align-items:center;justify-content:center;padding:14px;direction:rtl}#orgM.on{display:flex}
#orgM .mc{background:#fff;border-radius:18px;width:min(560px,100%);max-height:92vh;overflow:auto;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
#orgM h3{margin:0 0 12px;color:#5a1238;font-size:19px}#orgM label{display:block;font-size:13px;color:#5a4a51;margin-bottom:10px}#orgM label .inp,#orgM label select{margin-top:4px;width:100%}
#orgM .g2{display:grid;grid-template-columns:1fr 1fr;gap:0 10px}#orgM .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#orgM .row .btn{flex:1 1 auto}
#orgM .seg2{display:flex;gap:6px}#orgM .seg2 button{flex:1;font:inherit;padding:9px;border-radius:10px;border:1px solid rgba(0,0,0,.12);background:#fff;cursor:pointer}#orgM .seg2 button.on{background:#5a1238;color:#fff;border-color:#5a1238}
#orgM .pre{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}#orgM .pre button{font:inherit;text-align:right;padding:10px;border-radius:12px;border:1px solid rgba(0,0,0,.12);background:#fff;cursor:pointer}#orgM .pre button b{display:block;font-size:14px}#orgM .pre button span{font-size:12px;color:#8a7f78}#orgM .pre button.on{border-color:#5a1238;box-shadow:0 0 0 2px #5a1238 inset}
#orgM .perms{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-bottom:10px}#orgM .perms label{display:flex;gap:6px;align-items:center;margin:0}
#orgM .bigPin{font-size:40px;font-weight:700;letter-spacing:.18em;text-align:center;color:#1f7a4a;background:#e3f4ea;border-radius:14px;padding:10px;margin:6px 0 4px;direction:ltr}
#orgM .err{color:#b3261e;font-size:13px;min-height:18px;margin-top:6px}#orgM .note{font-size:12.5px;color:#8a7f78;line-height:1.6}
#orgM .tg{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}#orgM .tg button{font:inherit;font-size:12.5px;padding:6px 10px;border-radius:999px;border:1px solid rgba(0,0,0,.12);background:#fff;cursor:pointer}#orgM .tg button.on{background:#f6eef2;border-color:#5a1238;color:#5a1238;font-weight:700}
.orgDrawer{margin:0 0 14px}
@media(max-width:600px){#orgP .opTop h2{font-size:19px}#orgP .opList{grid-template-columns:1fr;padding:4px 12px 30px}#orgM .g2,#orgM .pre{grid-template-columns:1fr}}`;
document.head.appendChild(st);
const P=document.createElement('div');P.id='orgP';P.setAttribute('role','dialog');P.setAttribute('aria-label','المنظمين');
P.innerHTML=`<div class="opTop"><div><h2>المنظمين</h2><div class="opSub" id="opSub"></div></div><div class="opAct">
<button class="btn primary" id="opAdd">+ إضافة منظم</button><button class="btn secondary" id="opZone">منطقة الحضور</button><button class="btn secondary" id="opVote">نتائج التصويت</button><button class="btn secondary" id="opLink">روابط المنظمين</button><button class="btn secondary" id="opCsv">تصدير Excel</button><button class="btn secondary" id="opClose">رجوع</button></div></div>
<div class="opBar"><input class="inp" id="opQ" type="search" placeholder="ابحث بالاسم أو الرقم أو السكن أو الجامعة"><div class="chips" id="opF"></div>
<select class="os" id="opFld" aria-label="المجال"><option value="">كل المجالات</option>${FIELDS.map(f=>`<option>${f}</option>`).join('')}</select><select class="os" id="opDay" aria-label="يوم الحضور"></select></div>
<div class="opList" id="opList"></div>`;
document.body.appendChild(P);
const M=document.createElement('div');M.id='orgM';M.innerHTML='<div class="mc" role="dialog"></div>';document.body.appendChild(M);
const mc=M.querySelector('.mc');const closeM=()=>M.classList.remove('on');M.addEventListener('click',e=>{if(e.target===M)closeM()});
const openM=h=>{mc.innerHTML=h;M.classList.add('on');const f=mc.querySelector('input,select');f&&setTimeout(()=>f.focus(),60)};
const T=document.createElement('div');T.id='orgT';T.setAttribute('role','status');T.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:80;background:#2b2226;color:#fff;padding:11px 18px;border-radius:12px;font-size:14.5px;box-shadow:0 8px 24px rgba(0,0,0,.25);display:none;max-width:92vw;text-align:center';document.body.appendChild(T);
const toast=(t,bad)=>{T.textContent=t;T.style.background=bad?'#b3261e':'#2b2226';T.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>T.style.display='none',2800)};
const hhmm=t=>new Date(t).toLocaleTimeString('ar-IQ',{hour:'numeric',minute:'2-digit'});
const wa=(ph,msg)=>'https://wa.me/'+(ph?'964'+ph.replace(/^0/,''):'')+'?text='+encodeURIComponent(msg);
const roleOf=o=>!o.uid?'':o.role==='admin'?'مدير':(Object.values(PRE).find(p=>p.role==='staff'&&p.p.length===o.perms.length&&p.p.every(x=>o.perms.includes(x)))||{l:'صلاحيات مخصصة'}).l;
const days=()=>{const s=new Set([D.today]);D.orgs.forEach(o=>Object.keys(o.att||{}).forEach(d=>s.add(d)));return[...s].sort().reverse()};
const dayLbl=d=>d===D.today?'اليوم':new Date(d+'T12:00').toLocaleDateString('ar-IQ',{weekday:'long',day:'numeric',month:'long'});
function counts(){const c={all:D.orgs.length,in:0,out:0,acc:0,f:0,m:0,sa:0,sb:0,sn:0,fu:0,vt:0,vw:0};D.orgs.forEach(o=>{(o.att||{})[day]?c.in++:c.out++;o.uid&&c.acc++;c[o.g==='m'?'m':'f']++;o.shift==='a'?c.sa++:o.shift==='b'?c.sb++:c.sn++;o.fu&&c.fu++;o.vote&&c.vt++;vwarn(o)&&c.vw++});return c}
const vwarn=o=>o.vote&&(o.vote.how==='name'||!o.vote.nameOk);
function render(){
 if(!day||!days().includes(day))day=D.today;
 $('#opDay').innerHTML=days().map(d=>`<option value="${d}"${d===day?' selected':''}>حضور ${dayLbl(d)}</option>`).join('');
 const c=counts();$('#opSub').textContent=`${c.all} منظم · حضر ${dayLbl(day)} ${c.in} · عندهم دخول للنظام ${c.acc} · صوّتوا ${c.vt} (الأولى ${c.sa}، الثانية ${c.sb})${(D.loose||[]).length?' · أصوات مو مربوطة '+D.loose.length:''} · حدّثوا معلوماتهم ${c.fu}`+(D.zone&&D.zone.on?'':' · منطقة الحضور غير مفعّلة');
 $('#opF').innerHTML=[['all','الكل',c.all],['in','حضروا',c.in],['out','ما حضروا',c.out],['acc','عندهم دخول',c.acc],['f','إناث',c.f],['m','ذكور',c.m],['sa','الوجبة الأولى',c.sa],['sb','الوجبة الثانية',c.sb],['sn','ما صوّتوا',c.sn],['fu','حدّثوا معلوماتهم',c.fu],['vw','تنبيهات التصويت',c.vw]].map(([k,l,n])=>`<button data-f="${k}" class="${flt===k?'on':''}">${l}<b>${n}</b></button>`).join('');
 const k=q.trim().replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي'),nq=s=>String(s||'').replace(/[إأآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
 const L=D.orgs.filter(o=>{const a=(o.att||{})[day];if(flt==='in'&&!a||flt==='out'&&a||flt==='acc'&&!o.uid||flt==='f'&&o.g==='m'||flt==='m'&&o.g!=='m'||flt==='sa'&&o.shift!=='a'||flt==='sb'&&o.shift!=='b'||flt==='sn'&&o.shift||flt==='fu'&&!o.fu||flt==='vw'&&!vwarn(o))return!1;if(fld&&!String(o.field||'').includes(fld))return!1;
  if(k){const h=nq([o.n,o.ph,o.area,o.uni,o.spec,o.field,o.soc].join(' '));if(!h.includes(k)&&!String(o.ph||'').includes(k.replace(/\D/g,'')||'§'))return!1}return!0})
  .sort((a,b)=>{const x=!!(a.att||{})[day],y=!!(b.att||{})[day];return(y-x)||String(a.n).localeCompare(String(b.n),'ar')});
 $('#opList').innerHTML=L.length?L.map(o=>{const a=(o.att||{})[day],tags=String(o.field||'').split(/[,،]/).map(s=>s.trim()).filter(Boolean);
  return`<div class="oc" data-id="${o.id}"><div class="ocH"><span class="av ${o.g==='m'?'m':''}" aria-hidden="true">${esc(String(o.n).trim()[0]||'؟')}</span><div><b>${esc(o.n)}</b><small>${o.g==='m'?'ذكر':'أنثى'}${o.age?' · '+o.age+' سنة':''}${o.area?' · '+esc(o.area):''}</small></div>
  <span class="pill ${a?'in':''}">${a?'حضر '+hhmm(a.t)+(a.by&&a.by!=='gps'?' (يدوي)':''):'ما حضر'}</span></div>
  <div class="ocB">${o.ph?`<div><a href="tel:${esc(o.ph)}">${esc(o.ph)}</a> · <a href="${wa(o.ph,'')}" target="_blank" rel="noopener">واتساب</a></div>`:'<div class="rl">بدون رقم</div>'}
  <div class="tags">${o.shift?`<span class="sh ${o.shift}" title="${SHIFT[o.shift]}">${SHS[o.shift]}</span>`:''}${o.fu?'<span class="fu">حدّث معلوماته</span>':''}</div>${o.vote&&o.vote.how==='name'?`<div class="vw">صوّت من رقم ثاني: <bdi>${esc(o.vote.ph)}</bdi></div>`:''}${o.vote&&!o.vote.nameOk?`<div class="vw">صوّت باسم: ${esc(o.vote.n)}</div>`:''}${o.uni||o.spec?`<div>${esc([o.uni,o.spec].filter(Boolean).join(' · '))}</div>`:''}${tags.length?`<div class="tags">${tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}</div>
  <div class="ocF">${o.uid?`<span class="pin" title="رمز الدخول">${esc(o.pin||'••••••')}</span><span class="rl">${esc(roleOf(o))}</span><button class="btn secondary" data-a="acc">الصلاحية</button>`:`<button class="btn primary" data-a="acc">إعطاء دخول</button>`}
  <button class="btn secondary" data-a="edit">تعديل</button><button class="btn secondary" data-a="mark">${a?'إلغاء الحضور':'حضور يدوي'}</button></div></div>`}).join(''):'<div class="empty">ماكو منظمين بهذا البحث</div>';
}
const load=async()=>{try{D=await api('orgs/list');render()}catch(e){toast(e.message,1)}};
setInterval(()=>{if(P.classList.contains('on')&&!M.classList.contains('on')&&!document.hidden)api('orgs/list').then(j=>{D=j;render()}).catch(()=>{})},20000);
const apply=j=>{if(j&&j.orgs){D=j;render()}};
async function open(){P.classList.add('on');const c=$('#closeAdmin');c&&$('#drawer').classList.contains('open')&&c.click();render();await load()}
$('#opClose').onclick=()=>P.classList.remove('on');
$('#opQ').oninput=e=>{q=e.target.value;render()};$('#opF').onclick=e=>{const b=e.target.closest('button');if(b){flt=b.dataset.f;render()}};
$('#opFld').onchange=e=>{fld=e.target.value;render()};$('#opDay').onchange=e=>{day=e.target.value;render()};
addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(M.classList.contains('on')){closeM();e.stopPropagation()}else if(P.classList.contains('on')){P.classList.remove('on');e.stopPropagation()}},!0);
const byId=id=>D.orgs.find(o=>o.id===id);
$('#opList').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b)return;const o=byId(b.closest('.oc').dataset.id);if(!o)return;
 if(b.dataset.a==='edit')edit(o);else if(b.dataset.a==='acc')access(o);
 else if(b.dataset.a==='mark'){const on=!(o.att||{})[day];if(!on&&!confirm('إلغاء حضور '+o.n+'؟'))return;try{apply(await api('orgs/mark',{id:o.id,day,on}))}catch(x){toast(x.message,1)}}};
/* إضافة وتعديل */
function edit(o){const n=!o;o=o||{g:'f'};let g=o.g==='m'?'m':'f',sh=o.shift||'';const sel=new Set(String(o.field||'').split(/[,،]/).map(s=>s.trim()).filter(Boolean));
 openM(`<h3>${n?'إضافة منظم':'تعديل المنظم'}</h3><label>الاسم الثلاثي<input class="inp" id="oN" maxlength="80" value="${esc(o.n||'')}"></label>
 <label>الجنس<div class="seg2" id="oG"><button type="button" data-g="f">أنثى</button><button type="button" data-g="m">ذكر</button></div></label>
 <div class="g2"><label>رقم الهاتف (واتساب)<input class="inp" id="oPh" inputmode="tel" maxlength="20" dir="ltr" value="${esc(o.ph||'')}" placeholder="07xxxxxxxxx"></label><label>العمر<input class="inp" id="oAge" inputmode="numeric" maxlength="3" value="${esc(o.age||'')}"></label></div>
 <div class="g2"><label>منطقة السكن<input class="inp" id="oArea" maxlength="80" value="${esc(o.area||'')}"></label><label>الجامعة أو المؤسسة<input class="inp" id="oUni" maxlength="120" value="${esc(o.uni||'')}"></label></div>
 <label>الاختصاص<input class="inp" id="oSpec" maxlength="120" value="${esc(o.spec||'')}" placeholder="مثلاً: طب، تمريض، إعلام"></label>
 <label>وقت الحضور<div class="seg2" id="oSh"><button type="button" data-s="a">12 ظهراً – 6 مساءً</button><button type="button" data-s="b">4 مساءً – 10 ليلاً</button><button type="button" data-s="">ما محدد</button></div></label>
 <label>مجال المساهمة<div class="tg" id="oFld">${FIELDS.map(f=>`<button type="button" class="${sel.has(f)?'on':''}">${f}</button>`).join('')}</div></label>
 <div class="g2"><label>التفرغ يومي المؤتمر<input class="inp" id="oAv" maxlength="60" value="${esc(o.avail||'')}"></label><label>حساب التواصل<input class="inp" id="oSoc" maxlength="160" dir="ltr" value="${esc(o.soc||'')}"></label></div>
 <label>خبرة سابقة أو ملاحظات<input class="inp" id="oExp" maxlength="400" value="${esc(o.exp||'')}"></label>
 <div class="err" id="oErr"></div><div class="row"><button class="btn primary" id="oSave">حفظ</button><button class="btn secondary" id="oCancel">إلغاء</button>${n?'':'<button class="btn danger" id="oDel">حذف المنظم</button>'}</div>`);
 const sg=()=>{mc.querySelectorAll('#oG button').forEach(b=>b.classList.toggle('on',b.dataset.g===g));mc.querySelectorAll('#oSh button').forEach(b=>b.classList.toggle('on',b.dataset.s===sh))};sg();
 mc.querySelector('#oSh').onclick=e=>{const b=e.target.closest('button');if(b){sh=b.dataset.s;sg()}};
 mc.querySelector('#oG').onclick=e=>{const b=e.target.closest('button');if(b){g=b.dataset.g;sg()}};
 mc.querySelector('#oFld').onclick=e=>{const b=e.target.closest('button');if(b){b.classList.toggle('on');b.classList.contains('on')?sel.add(b.textContent):sel.delete(b.textContent)}};
 mc.querySelector('#oCancel').onclick=closeM;
 mc.querySelector('#oSave').onclick=async()=>{const v=id=>mc.querySelector(id).value.trim();const extra=[...sel].filter(x=>!FIELDS.includes(x));
  const body={id:o.id||'',n:v('#oN'),g,ph:v('#oPh'),age:v('#oAge'),area:v('#oArea'),uni:v('#oUni'),spec:v('#oSpec'),shift:sh,field:[...FIELDS.filter(f=>sel.has(f)),...extra].join(', '),avail:v('#oAv'),soc:v('#oSoc'),exp:v('#oExp')};
  if(!body.n){mc.querySelector('#oErr').textContent='اكتب اسم المنظم';return}
  try{const j=await api('orgs/save',body);apply(j);closeM();toast(n?'انضاف المنظم':'انحفظ التعديل');if(n){const x=byId(j.id);x&&confirm('تريد تعطيه دخول للنظام هسه؟')&&access(x)}}catch(e){mc.querySelector('#oErr').textContent=e.message}};
 const d=mc.querySelector('#oDel');d&&(d.onclick=async()=>{if(!confirm('حذف '+o.n+' من قائمة المنظمين'+(o.uid?' وسحب دخوله للنظام':'')+'؟'))return;try{apply(await api('orgs/delete',{id:o.id}));closeM();toast('انحذف المنظم')}catch(e){mc.querySelector('#oErr').textContent=e.message}});
}
/* الدخول والصلاحية */
function access(o){let pre=o.uid?(o.role==='admin'?'admin':(Object.entries(PRE).find(([k,p])=>p.role==='staff'&&p.p.length===o.perms.length&&p.p.every(x=>o.perms.includes(x)))||['custom'])[0]):'reg';
 let perms=new Set(o.uid?o.perms:PRE.reg.p);const task=o.task||(String(o.field||'').split(/[,،]/)[0]||'').trim();
 const share=pin=>`السلام عليكم ${String(o.n).split(' ')[0]}\nرمز دخولك لنظام استقبال المؤتمر: ${pin}\nرابط النظام: ${SYS_URL}\nتسجيل حضورك (من داخل الجامعة): ${ORG_URL}`;
 const pinBox=()=>o.uid&&o.pin?`<div class="note">رمز الدخول الحالي</div><div class="bigPin">${esc(o.pin)}</div><div class="row" style="margin-top:4px"><a class="btn primary" target="_blank" rel="noopener" href="${wa(o.ph,share(o.pin))}">إرسال الرمز بالواتساب</a><button class="btn secondary" id="aCopy">نسخ</button></div>`:'';
 openM(`<h3>دخول ${esc(o.n)} للنظام</h3>${pinBox()}<div class="note" style="margin:12px 0 8px">شنو يگدر يسوي؟</div>
 <div class="pre" id="aPre">${Object.entries(PRE).map(([k,p])=>`<button type="button" data-k="${k}"><b>${p.l}</b><span>${p.d}</span></button>`).join('')}</div>
 <div class="perms" id="aPerms">${PERMS.map(([k,l])=>`<label><input type="checkbox" value="${k}">${l}</label>`).join('')}</div>
 <div class="g2"><label>المهمة<input class="inp" id="aTask" maxlength="80" value="${esc(task)}" placeholder="مثلاً: استقبال باب VIP"></label>
 <label>المدير المسؤول عنه<select id="aSup"><option value="">بدون</option>${D.admins.map(a=>`<option value="${a.id}"${a.id===o.sup?' selected':''}>${esc(a.name)}</option>`).join('')}</select></label></div>
 <div class="err" id="aErr"></div><div class="row"><button class="btn primary" id="aSave">${o.uid?'حفظ الصلاحية':'إعطاء دخول ورمز تلقائي'}</button>${o.uid?'<button class="btn secondary" id="aRegen">رمز جديد</button><button class="btn danger" id="aRev">سحب الدخول</button>':''}<button class="btn secondary" id="aCancel">إغلاق</button></div>
 <p class="note">الرمز يتولد تلقائي من 6 أرقام، والمنظم يدخل بيه من صفحة النظام. يطلع هم بالفريق والصلاحيات بلوحة الإدارة.</p>`);
 const sync=()=>{mc.querySelectorAll('#aPre button').forEach(b=>b.classList.toggle('on',b.dataset.k===pre));const ad=pre==='admin';mc.querySelectorAll('#aPerms input').forEach(i=>{i.checked=ad||perms.has(i.value);i.disabled=ad});mc.querySelector('#aSup').disabled=ad};sync();
 mc.querySelector('#aPre').onclick=e=>{const b=e.target.closest('button');if(!b)return;pre=b.dataset.k;perms=new Set(PRE[pre].p);sync()};
 mc.querySelector('#aPerms').onchange=e=>{e.target.checked?perms.add(e.target.value):perms.delete(e.target.value);const m=Object.entries(PRE).find(([k,p])=>p.role==='staff'&&p.p.length===perms.size&&p.p.every(x=>perms.has(x)));pre=m?m[0]:'custom';sync()};
 mc.querySelector('#aCancel').onclick=closeM;
 const save=async regen=>{const body={id:o.id,role:pre==='admin'?'admin':'staff',perms:[...perms],task:mc.querySelector('#aTask').value.trim(),sup:mc.querySelector('#aSup').value,regen:!!regen};
  const first=!o.uid;try{const j=await api('orgs/access',body);apply(j);const x=byId(o.id);if(x){access(x);toast(first?'انعطى دخول، هذا رمزه':regen?'انعمل رمز جديد':'انحفظت الصلاحية')}}catch(e){mc.querySelector('#aErr').textContent=e.message}};
 mc.querySelector('#aSave').onclick=()=>save(!1);
 const rg=mc.querySelector('#aRegen');rg&&(rg.onclick=()=>{if(confirm('الرمز القديم راح يبطل، ونطلع رمز جديد. نكمل؟'))save(!0)});
 const rv=mc.querySelector('#aRev');rv&&(rv.onclick=async()=>{if(!confirm('سحب دخول '+o.n+' للنظام؟ يبقى بقائمة المنظمين.'))return;try{apply(await api('orgs/revoke',{id:o.id}));closeM();toast('انسحب الدخول')}catch(e){mc.querySelector('#aErr').textContent=e.message}});
 const cp=mc.querySelector('#aCopy');cp&&(cp.onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(share(o.pin)).then(()=>toast('انتسخ'),()=>{})});
}
/* منطقة الحضور */
const SIBT=[[32.6137844,44.0077833],[32.6125035,44.0087411],[32.6121767,44.0087052],[32.6117606,44.0090085],[32.6114349,44.0083865],[32.6105507,44.0066625],[32.6123529,44.0054181],[32.6124399,44.0055777],[32.6126192,44.0054441],[32.6137237,44.0075199],[32.6138219,44.0077122]];
function polySvg(P){const la0=P.reduce((a,p)=>a+p[0],0)/P.length,k=Math.cos(la0*Math.PI/180),xs=P.map(p=>p[1]*k),ys=P.map(p=>-p[0]),x0=Math.min(...xs),y0=Math.min(...ys),w=Math.max(...xs)-x0,h=Math.max(...ys)-y0,s=Math.max(w,h)||1,pad=.08;
 const pts=P.map((p,i)=>((xs[i]-x0+(s-w)/2)/s*(1-2*pad)+pad)*100+','+((ys[i]-y0+(s-h)/2)/s*(1-2*pad)+pad)*100).join(' ');
 return `<svg viewBox="0 0 100 100" width="96" height="96" style="flex:none;background:#f6f1f3;border-radius:14px"><polygon points="${pts}" fill="rgba(94,19,52,.16)" stroke="#5e1334" stroke-width="1.6" stroke-linejoin="round"/></svg>`}
function zone(){const z=D.zone||{};let on=!!z.on,lat=z.lat,lng=z.lng,mode=(z.poly&&z.poly.length>2)?'poly':(lat!=null?'circle':'poly');
 const P=(z.poly&&z.poly.length>2)?z.poly:SIBT,cLa=+(P.reduce((a,p)=>a+p[0],0)/P.length).toFixed(6),cLo=+(P.reduce((a,p)=>a+p[1],0)/P.length).toFixed(6);
 const info=()=>lat!=null?`<div class="note">الموقع المحدد: <span dir="ltr">${lat}, ${lng}</span> · <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${lat},${lng}">شوفه على الخريطة</a></div>`:'<div class="note">ما محدد موقع بعد.</div>';
 openM(`<h3>منطقة حضور المنظمين</h3>
 <div class="seg2" id="zMode" style="margin:6px 0 12px"><button type="button" data-v="poly">حدود الجامعة بالضبط</button><button type="button" data-v="circle">دائرة حول نقطة</button></div>
 <div id="zPoly"><div style="display:flex;gap:12px;align-items:center">${polySvg(P)}<div><b style="display:block;margin-bottom:4px">جامعة السبطين للعلوم الطبية</b><div class="note" style="margin:0">المنظم يگدر يسجّل بس إذا جان داخل سور الجامعة. اللي برّه السور، حتى لو بالشارع المقابل، ما يگدر يسجّل.<br><a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${cLa},${cLo}">شوف الجامعة على الخريطة</a></div></div></div></div>
 <div id="zCirc"><p class="note">المنظم يگدر يسجّل حضوره بس إذا جان داخل هذي الدائرة. من تكون داخل الجامعة دوس «استخدم موقعي الحالي».</p>
 <div id="zInfo">${info()}</div><div class="row"><button class="btn primary" id="zMe">استخدم موقعي الحالي</button></div>
 <label style="margin-top:12px">أو الصق إحداثيات أو رابط خرائط Google<input class="inp" id="zTxt" dir="ltr" placeholder="32.6160, 44.0249"></label>
 <label>نصف القطر<select id="zR">${[100,150,200,300,500,800,1000,1500].map(r=>`<option value="${r}"${r===(z.r||300)?' selected':''}>${r<1000?r+' متر':(r/1000)+' كم'}</option>`).join('')}</select></label></div>
 <label style="margin-top:12px">الحالة<div class="seg2" id="zOn"><button type="button" data-v="1">مفعّلة</button><button type="button" data-v="0">موقوفة</button></div></label>
 <div class="err" id="zErr"></div><div class="row"><button class="btn primary" id="zSave">حفظ</button><button class="btn secondary" id="zCancel">إغلاق</button></div>`);
 const so=()=>mc.querySelectorAll('#zOn button').forEach(b=>b.classList.toggle('on',(b.dataset.v==='1')===on));
 const sm=()=>{mc.querySelectorAll('#zMode button').forEach(b=>b.classList.toggle('on',b.dataset.v===mode));mc.querySelector('#zPoly').style.display=mode==='poly'?'':'none';mc.querySelector('#zCirc').style.display=mode==='circle'?'':'none';mc.querySelector('#zErr').textContent=''};so();sm();
 mc.querySelector('#zMode').onclick=e=>{const b=e.target.closest('button');if(b){mode=b.dataset.v;sm()}};
 mc.querySelector('#zOn').onclick=e=>{const b=e.target.closest('button');if(b){on=b.dataset.v==='1';so()}};mc.querySelector('#zCancel').onclick=closeM;
 mc.querySelector('#zMe').onclick=()=>{const er=mc.querySelector('#zErr');if(!navigator.geolocation){er.textContent='هذا الجهاز ما يدعم تحديد الموقع';return}er.textContent='نحدد موقعك…';
  navigator.geolocation.getCurrentPosition(p=>{lat=+p.coords.latitude.toFixed(6);lng=+p.coords.longitude.toFixed(6);on=!0;so();mc.querySelector('#zInfo').innerHTML=info();er.textContent='دقة الموقع تقريباً '+Math.round(p.coords.accuracy)+' متر، دوس حفظ.'},
  x=>{er.textContent=x.code===1?'لازم تسمح للمتصفح يوصل لموقعك':'ما گدرنا نحدد موقعك، حاول مرة ثانية'},{enableHighAccuracy:!0,timeout:20000,maximumAge:0})};
 mc.querySelector('#zTxt').oninput=e=>{const t=e.target.value,m=t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||t.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||t.match(/(-?\d{1,2}\.\d{3,})\s*[,،\s]\s*(-?\d{1,3}\.\d{3,})/);
  if(m){lat=+(+m[1]).toFixed(6);lng=+(+m[2]).toFixed(6);mc.querySelector('#zInfo').innerHTML=info();mc.querySelector('#zErr').textContent=''}};
 mc.querySelector('#zSave').onclick=async()=>{let b;if(mode==='poly')b={poly:P,lat:cLa,lng:cLo,on};else{if(lat==null&&on){mc.querySelector('#zErr').textContent='حدّد الموقع أول';return}b={poly:null,r:+mc.querySelector('#zR').value,on};if(lat!=null){b.lat=lat;b.lng=lng}}
  try{apply(await api('zone/set',b));closeM();toast('انحفظت منطقة الحضور')}catch(e){mc.querySelector('#zErr').textContent=e.message}};
}

const LINKS=[{k:'in',t:'تسجيل الحضور بالجامعة',u:ORG_URL,d:'يفتحه المنظم من داخل الجامعة ويكتب رقمه، وحضوره يتسجّل هنا.',m:'رابط تسجيل حضور المنظمين لمؤتمر السيدة خديجة الكبرى (ع)\nافتحه من داخل الجامعة واكتب رقم هاتفك:\n'},
 {k:'info',t:'تحديث معلومات المنظمين',u:ORG_URL+'info/',d:'يكتب رقمه ومعلوماته. إذا موجود تنضاف المعلومات الجديدة عليه، وإذا مو موجود ينضاف منظم جديد.',m:'السلام عليكم، يرجى إكمال معلوماتك كمنظم لمؤتمر السيدة خديجة الكبرى (ع) عبر الرابط:\n'},
 {k:'vote',t:'التصويت على وقت الحضور',u:ORG_URL+'vote/',d:'يختار الوجبة الأولى (12 ظهراً – 6 مساءً) أو الثانية (4 مساءً – 10 ليلاً). النتيجة تطلع هنا بالفلاتر.',m:'السلام عليكم، يرجى اختيار وقت حضورك لتنظيم مؤتمر السيدة خديجة الكبرى (ع):\n12 ظهراً – 6 مساءً أو 4 مساءً – 10 ليلاً\n'}];
function link(){
 openM(`<h3>روابط المنظمين</h3>${LINKS.map(l=>`<div class="lk"><b>${l.t}</b><div class="note">${l.d}${l.k==='in'&&!(D.zone&&D.zone.on)?' <b style="display:inline;color:#b3261e">منطقة الحضور بعدها مو مفعّلة.</b>':''}</div><code>${esc(l.u)}</code><div class="row"><a class="btn primary" target="_blank" rel="noopener" href="${wa('',l.m+l.u)}">واتساب</a><button class="btn secondary" data-c="${l.k}">نسخ</button><a class="btn secondary" target="_blank" rel="noopener" href="${l.u}">فتح</a></div></div>`).join('')}<div class="row"><button class="btn secondary" id="lX">إغلاق</button></div>`);
 mc.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{const l=LINKS.find(x=>x.k===b.dataset.c);navigator.clipboard&&navigator.clipboard.writeText(l.u).then(()=>toast('انتسخ الرابط'),()=>{})});mc.querySelector('#lX').onclick=closeM}
function votes(){const c=counts(),L=D.loose||[],W=D.orgs.filter(vwarn),by=k=>D.orgs.filter(o=>o.shift===k).sort((a,b)=>String(a.n).localeCompare(String(b.n),'ar'));
 const row=o=>`<div class="vl"><span>${esc(o.n)} <small>${o.g==='m'?'ذكر':'أنثى'}</small></span><small dir="ltr">${esc(o.ph||'')}</small></div>`;
 openM(`<h3>نتائج التصويت على وقت الحضور</h3><div class="note">تنحسب من جديد كل ما تنفتح أو تتحدث القائمة: نقارن رقم المصوّت واسمه ويا قائمة المنظمين.</div>
 <div class="vk" style="margin-top:10px"><div><b>${c.sa}</b>الوجبة الأولى<br><small>12 ظهراً – 6 مساءً</small></div><div><b>${c.sb}</b>الوجبة الثانية<br><small>4 مساءً – 10 ليلاً</small></div></div>
 <div class="note">صوّتوا ${c.vt} من ${c.all} منظم · ما صوّتوا ${c.sn}</div>
 ${W.length?`<div class="vh">تنبيهات (${W.length})</div>${W.map(o=>`<div class="vl"><span>${esc(o.n)}<br><small>${o.vote.how==='name'?'انربط بالاسم، صوّت من رقم ثاني '+esc(o.vote.ph):'صوّت باسم: '+esc(o.vote.n)}</small></span><button class="btn secondary" data-e="${o.id}">تعديل</button></div>`).join('')}`:''}
 ${L.length?`<div class="vh">أصوات مو مربوطة بمنظم (${L.length})</div>${L.map((v,i)=>`<div class="vl"><span>${esc(v.n)}<br><small dir="ltr">${esc(v.ph)}</small> <small>${SHS[v.shift]||''}</small></span><button class="btn primary" data-l="${i}">أضفه منظم</button></div>`).join('')}`:''}
 <div class="vh">الوجبة الأولى (${c.sa})</div>${by('a').map(row).join('')||'<div class="note">ماكو</div>'}
 <div class="vh">الوجبة الثانية (${c.sb})</div>${by('b').map(row).join('')||'<div class="note">ماكو</div>'}
 <div class="row"><button class="btn secondary" id="vR">تحديث</button><button class="btn secondary" id="vX">إغلاق</button></div>`);
 mc.querySelector('#vX').onclick=closeM;mc.querySelector('#vR').onclick=async()=>{await load();votes()};
 mc.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const o=byId(b.dataset.e);o&&edit(o)});
 mc.querySelectorAll('[data-l]').forEach(b=>b.onclick=async()=>{const v=L[+b.dataset.l];try{apply(await api('orgs/save',{n:v.n,ph:v.ph,shift:v.shift,g:'f'}));toast('انضاف '+v.n+'، تأكد من الجنس');votes()}catch(e){toast(e.message,1)}});
}
function csv(){const H=['الاسم','الجنس','الهاتف','العمر','السكن','الجامعة أو الجهة','الاختصاص','وقت الحضور','الأيام المتاحة','مجالات المساهمة','الخبرة','حساب التواصل','دخول للنظام','المهمة','حدّث معلوماته',...days().map(d=>'حضور '+d)];
 const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const rows=D.orgs.map(o=>[o.n,o.g==='m'?'ذكر':'أنثى',o.ph,o.age||'',o.area,o.uni,o.spec,SHIFT[o.shift]||'',o.avail,o.field,o.exp,o.soc,o.uid?roleOf(o):'',o.task||'',o.fu?'نعم':'',...days().map(d=>(o.att||{})[d]?hhmm(o.att[d].t):'')]);
 const blob=new Blob(['﻿'+[H,...rows].map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='المنظمين-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);toast('نزل ملف المنظمين')}
$('#opAdd').onclick=()=>edit(null);$('#opZone').onclick=zone;$('#opLink').onclick=link;$('#opVote').onclick=votes;$('#opCsv').onclick=csv;
/* زر بالإعدادات (للمدير) */
const ico='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c2.6-.3 4.6 1.2 5 4.3"/></svg>';
const dw=$('#drawer .dScroll');if(dw){const d=document.createElement('div');d.className='orgDrawer';d.innerHTML='<button class="btn secondary block" type="button" id="orgBtn">'+ico+'<span>المنظمين</span></button><p class="help">قائمة المنظمين، الدخول والصلاحيات برمز تلقائي، وحضورهم من داخل الجامعة.</p>';
 const after=dw.querySelector('.dmDrawer');after?after.after(d):dw.prepend(d);d.querySelector('button').onclick=open;
 const chk=()=>{const ad=!!$('#openDash')&&!$('#openDash').hidden;d.hidden=!ad};chk();const op=$('#openAdmin');op&&op.addEventListener('click',chk)}
window.__orgs={open,load};
if(/[?&]orgs=1/.test(location.search)){const t=setInterval(()=>{const a=$('#auth');if(a&&a.hidden&&tok()){clearInterval(t);setTimeout(open,800)}},700)}
})();
