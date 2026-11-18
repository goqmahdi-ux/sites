/* عرض النظام: جولة تلقائية تشرح كل جزء وتعيد نفسها. ما تكتب أي بيانات ولا تطبع شي */
(()=>{
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],wait=ms=>new Promise(r=>setTimeout(r,ms));
const vis=el=>{if(!el)return!1;const r=el.getBoundingClientRect();if(r.width<4||r.height<4)return!1;const c=getComputedStyle(el);return c.display!=='none'&&c.visibility!=='hidden'};
const st=document.createElement('style');st.textContent=`
#dmo{position:fixed;inset:0;z-index:100000;pointer-events:none;display:none}#dmo.on{display:block}
#dmo .dmHole{position:fixed;left:50%;top:50%;width:0;height:0;border-radius:14px;box-shadow:0 0 0 200vmax rgba(24,8,16,.58);outline:3px solid #c9a45c;outline-offset:3px;transition:left .5s,top .5s,width .5s,height .5s,outline-color .3s}
#dmo .dmHole.none{outline-color:transparent}
#dmo .dmCard{position:fixed;pointer-events:auto;width:min(540px,calc(100vw - 24px));background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.35);padding:16px 18px 12px;direction:rtl;text-align:right;transition:left .45s,right .45s,top .45s,bottom .45s;font-family:inherit}
#dmo .dmTop{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#8a7f78;margin-bottom:6px}
#dmo .dmTag{background:#5a1238;color:#fff;border-radius:999px;padding:3px 11px;font-weight:600}
#dmo .dmT{margin:0 0 6px;font-size:23px;color:#5a1238;line-height:1.3}
#dmo .dmP{margin:0 0 12px;font-size:17.5px;line-height:1.75;color:#2b2226}
#dmo .dmBar{height:5px;background:#f0e6ea;border-radius:5px;overflow:hidden;margin-bottom:10px}#dmo .dmBar i{display:block;height:100%;width:0;background:#c9a45c}
#dmo .dmCtl{display:flex;gap:8px;align-items:center}#dmo .dmCtl button{font:inherit;font-size:17px;min-width:46px;height:42px;border-radius:11px;border:1px solid #e6dce0;background:#fff;color:#5a1238;cursor:pointer;font-weight:700}
#dmo .dmCtl .dmX{margin-inline-start:auto;background:#5a1238;color:#fff;border-color:#5a1238;padding:0 16px;font-size:15px}
#dmo .dmCtl button:focus-visible{outline:3px solid #c9a45c;outline-offset:2px}
.dmDrawer{margin:0 0 14px}.dmDrawer .help{margin-top:6px}
@media(max-width:700px){#dmo .dmT{font-size:19px}#dmo .dmP{font-size:15.5px;line-height:1.65}}`;
document.head.appendChild(st);
const ov=document.createElement('div');ov.id='dmo';
ov.innerHTML='<div class="dmHole"></div><div class="dmCard" role="dialog" aria-label="عرض النظام" aria-live="polite"><div class="dmTop"><span class="dmN"></span><span class="dmTag">عرض النظام</span></div><h3 class="dmT"></h3><p class="dmP"></p><div class="dmBar"><i></i></div><div class="dmCtl"><button data-a="prev" aria-label="السابق">&#8250;</button><button data-a="play" aria-label="إيقاف مؤقت">&#10074;&#10074;</button><button data-a="next" aria-label="التالي">&#8249;</button><button data-a="fs" aria-label="ملء الشاشة">&#9974;</button><button data-a="x" class="dmX">إنهاء العرض</button></div></div>';
document.body.appendChild(ov);
const hole=ov.querySelector('.dmHole'),card=ov.querySelector('.dmCard'),bar=ov.querySelector('.dmBar i'),bPlay=ov.querySelector('[data-a=play]');

/* أدوات التحكم بالواجهة، كلها عرض بس */
const opened=new Set;
const collapse=()=>{opened.forEach(s=>s.classList.add('cl'));opened.clear()};
const expand=s=>{collapse();if(s&&s.classList.contains('cl')){s.classList.remove('cl');opened.add(s)}};
const secOf=q=>{const e=$(q);return e?e.closest('.dSec'):null};
const isOpen={drawer:()=>!!$('#drawer')&&$('#drawer').classList.contains('open'),dash:()=>!!$('#dash')&&!$('#dash').hidden,map:()=>{const m=$('#seatMap');return!!m&&m.style.display==='flex'}};
async function ctx(c){
 if(c!=='map'&&isOpen.map()){const x=$('#smX');x&&x.click()}
 if(c!=='dash'&&isOpen.dash()){const t=$('.tab[data-tab="print"]');t&&t.click();$('#dashClose').click()}
 if(c!=='drawer'&&isOpen.drawer()){collapse();$('#closeAdmin').click()}
 if(c==='drawer'&&!isOpen.drawer()){$('#openAdmin').click();await wait(480)}
 if(c==='dash'&&!isOpen.dash()){$('#openDash').click();await wait(350)}
 if(c==='map'&&!isOpen.map()){const b=$('#mapBtn');b&&b.click();await wait(300)}
}
const vscroll=el=>{const r=el.getBoundingClientRect();let p=el.parentElement;while(p&&p!==document.body&&p!==document.documentElement){const c=getComputedStyle(p);if(/(auto|scroll)/.test(c.overflowY)&&p.scrollHeight>p.clientHeight+4){const q=p.getBoundingClientRect();if(r.top<q.top||r.bottom>q.bottom||r.height>q.height*.6)p.scrollBy({top:(r.top+r.height/2)-(q.top+q.height/2),behavior:'smooth'});return}p=p.parentElement}if(r.top<0||r.bottom>innerHeight)window.scrollBy({top:(r.top+r.height/2)-innerHeight/2,behavior:'smooth'})};
const clearName=()=>{const n=$('#nameIn');if(!n)return;n.value='';n.dispatchEvent(new Event('input'));const s=$('#suggest');s&&(s.hidden=!0)};
const words=()=>{const bad=/^(كرسي|قسم|حاضر|الصف|صف|دكتور|السيد|السيدة)$/;const w=[];$$('#recent li').slice(0,3).forEach(li=>(li.textContent.match(/[ء-ي]{3,}/g)||[]).forEach(x=>{if(!bad.test(x)&&!w.includes(x))w.push(x)}));return['محمد','علي','حسين',...w.slice(0,3),'أحمد','زينب','فاطمة']};
async function typeName(){const n=$('#nameIn');if(!n)return;for(const w of words()){clearName();await wait(200);for(let k=1;k<=w.length;k++){if(!run||i!==typeStep)return;n.value=w.slice(0,k);n.dispatchEvent(new Event('input'));await wait(190)}if(!$('#suggest').hidden)return;await wait(250)}}
const pickSug=()=>{const it=$$('#suggest .sItem');if(!it.length)return;const g=it.find(x=>!x.querySelector('.badge.in'))||it[0];g.dispatchEvent(new MouseEvent('mousedown',{bubbles:!0,cancelable:!0}))};
const view=v=>{const b=$(`.views button[data-view="${v}"]`);b&&b.click()};
const tab=t=>{const b=$(`.tab[data-tab="${t}"]`);b&&b.click()};
const admin=()=>!!$('#openDash')&&!$('#openDash').hidden;

/* الخطوات */
const S=[
 {c:'main',do:()=>{clearName();view('hall')},el:'.top',t:'نظام استقبال المؤتمر',p:'هذا النظام يسجّل حضور الضيوف، يعطي كل ضيف كرسي، ويطبع ستكر الباج. خلونا نمشي عليه جزء جزء.',ms:8000},
 {c:'main',el:'.kpis',t:'العدادات المباشرة',p:'كم كرسي VIP فارغ، كم كرسي عادي فارغ، وكم ضيف حضر لحد هسه. تتحدث لحظياً من كل الأجهزة.'},
 {c:'main',el:'#live',t:'حالة الاتصال',p:'الأخضر معناه الجهاز مربوط، وكل أجهزة الاستقبال تشوف نفس البيانات بنفس اللحظة.',ms:6000},
 {c:'main',do:clearName,el:'.panel .field',t:'البحث عن الضيف',p:'موظف الاستقبال يكتب اسم الضيف، والنظام يطلعه من قائمة المدعوين مباشرة.',run:typeName,ms:8500,type:1},
 {c:'main',el:'#suggest',t:'نتائج البحث',p:'تطلع الأسماء المطابقة ويا فئة كل ضيف: VIP أو عادي. وإذا الضيف حاضر يبين وين كاعد.',ms:6500},
 {c:'main',do:pickSug,el:'.seg',t:'الفئة',p:'الفئة تنحدد تلقائي من القائمة. وإذا الضيف جديد ومو بالقائمة، الموظف يكتب اسمه ويختار فئته.',ms:7000},
 {c:'main',el:'#seatCard',t:'الكرسي المخصص',p:'النظام يختار أول كرسي فارغ بفئة الضيف: رقم الصف، القسم، ورقم الكرسي، ويأشره بالخريطة.'},
 {c:'main',el:'#confirmBtn',t:'تسجيل وطباعة',p:'دوسة وحدة: يتسجّل الحضور وينطبع ستكر الباج بالصف والكرسي. بالعرض ما راح ندوسه.'},
 {c:'main',do:()=>{clearName();view('hall')},el:'#hall',t:'خريطة القاعة',p:'القاعة كاملة 3D: الأخضر فارغ، الرصاصي محجوز، والكرسي المختار يتلون. تشوفها كاملة، أو صفوف الـ VIP، أو من المسرح.',ms:10000,sub:[[3300,()=>view('vip')],[6600,()=>view('stage')]]},
 {c:'main',do:()=>view('hall'),el:'#mapBtn',t:'اختار من الخريطة',p:'إذا الضيف يريد مكان معين، تفتح خريطة الكراسي وتختار الكرسي بإيدك.',ms:6000},
 {c:'map',el:'#seatMap',t:'خريطة الكراسي',p:'ثلاث أقسام A وB وC، كل قسم 10 كراسي و11 صف، والصفين الأولى VIP. الأحمر آخر ستكر انطبع، والرصاصي محجوز.',ms:9000},
 {c:'main',el:()=>$('.recentWrap'),t:'آخر الحضور',p:'آخر الضيوف الي تسجلوا ووين كعدوا، ومنها تكدر تعيد طباعة الستكر.'},
 {c:'main',el:'#myJobsWrap',t:'طلبات الطباعة مالتي',p:'إذا سجّلت من التلفون، الستكر ينطبع من الحاسبة المربوطة بالطابعة، وتتابع حالة طلبك هنا.'},
 {c:'main',el:'#hostGuide',t:'مسار المضيف',p:'دليل 3D لأماكن المنظمين من باب الاستقبال لحد كرسي الضيف، ويا صور واقعية لكل محطة.',ms:6500},
 {c:'main',el:'#openAdmin',t:'الضيوف والإعدادات',p:'من هنا تدير قائمة الضيوف، الطباعة، والحسابات.',ms:5000},
 {c:'drawer',do:()=>expand(secOf('#bulkIn')),el:()=>secOf('#bulkIn'),t:'إضافة قائمة ضيوف',p:'تلصق قائمة الأسماء كاملة مرة وحدة، كل سطر اسم، وتكتب vip بعد اسم ضيف الـ VIP.'},
 {c:'drawer',do:()=>expand(secOf('#gList')),el:()=>secOf('#gList'),t:'قائمة الضيوف',p:'بحث بالأسماء وفلترة: الكل، VIP، عادي، حضروا، وما حضروا.'},
 {c:'drawer',do:()=>expand(secOf('#stickerPrev')),el:()=>secOf('#stickerPrev'),t:'الطباعة',p:'معاينة الستكر، وطباعة ستكرات الكراسي لصف كامل أو لكرسي واحد مثل B7.',ms:8000},
 {c:'drawer',do:()=>expand($('#accSec')),el:'#accSec',t:'الحسابات',p:'كل موظف يدخل برمزه: مدير بكل الصلاحيات، أو استقبال يسجّل ويطبع بس.'},
 {c:'main',need:admin,el:'#openDash',t:'لوحة الإدارة',p:'للمدير بس: طلبات الطباعة، الفريق، وسجل الحضور.',ms:5000},
 {c:'dash',need:admin,do:()=>tab('print'),el:'.pane[data-pane="print"]',t:'طلبات الطباعة',p:'كل طلب يمر بثلاث مراحل: بانتظار الطباعة، انطبع، وتسلّم. وتكدر تخلي الحاسبة تطبع الطلبات الجديدة تلقائياً.',ms:8500},
 {c:'dash',need:admin,do:()=>tab('team'),el:'.pane[data-pane="team"]',t:'الفريق والصلاحيات',p:'تضيف كل شخص بمهمته والمدير المسؤول عنه، وطلبات الطباعة مالته تروح لمديره.'},
 {c:'dash',need:admin,do:()=>tab('log'),el:'.pane[data-pane="log"]',t:'سجل الحضور',p:'كل ضيف وصل، وين كعد، ومنو سجّله، وتكدر تنزّل الكشف Excel.'},
 {c:'main',do:()=>tab('print'),el:null,t:'خلص العرض',p:'العرض يعيد نفسه من البداية. دوس «إنهاء العرض» حتى ترجع للنظام.',ms:6000}
];
const typeStep=S.findIndex(s=>s.type);

/* المحرك */
let run=!1,paused=!1,i=0,el=null,dur=7500,el0=0,lastT=0,subN=0,busy=!1,dir=1;
async function go(n,d=1){
 if(!run)return;busy=!0;dir=d;let tries=0;
 while(tries++<S.length){
  i=(n+S.length)%S.length;const s=S[i];
  if(s.need&&!s.need()){n=i+d;continue}
  try{await ctx(s.c);s.do&&await s.do()}catch(e){}
  await wait(380);if(!run){busy=!1;return}
  el=s.el?(typeof s.el==='function'?s.el():$(s.el)):null;
  if(s.el&&!vis(el)){n=i+d;continue}
  break}
 if(el)try{vscroll(el)}catch(e){}
 ov.querySelector('.dmN').textContent=(i+1)+' / '+S.length;
 ov.querySelector('.dmT').textContent=S[i].t;ov.querySelector('.dmP').textContent=S[i].p;
 dur=S[i].ms||7500;el0=0;subN=0;busy=!1;
 if(S[i].run)S[i].run();
}
function place(r){
 const W=innerWidth,H=innerHeight,cw=card.offsetWidth,ch=card.offsetHeight,m=16;let L,T;
 if(!r){L=(W-cw)/2;T=(H-ch)/2}
 else if(W<700){T=(r.top+r.height/2>H*.5)?m:H-ch-m;L=(W-cw)/2}
 else if(r.width<W*.55){const cx=r.left+r.width/2;L=cx>W/2?Math.max(m,r.left-cw-24):Math.min(W-cw-m,r.right+24);if(L<m||L+cw>W-m)L=(W-cw)/2;T=Math.min(Math.max(m,r.top+r.height/2-ch/2),H-ch-m);
  if(L<r.right&&L+cw>r.left&&T<r.bottom&&T+ch>r.top)T=(r.top+r.height/2>H*.5)?m:H-ch-m}
 else{T=(r.top+r.height/2>H*.5)?m:H-ch-m;L=(W-cw)/2}
 card.style.left=L+'px';card.style.top=T+'px'}
function frame(now){
 requestAnimationFrame(frame);if(!run)return;const dt=Math.min(100,now-(lastT||now));lastT=now;
 let r=null;if(el&&vis(el)){const b=el.getBoundingClientRect(),p=8;r={left:Math.max(4,b.left-p),top:Math.max(4,b.top-p),right:Math.min(innerWidth-4,b.right+p),bottom:Math.min(innerHeight-4,b.bottom+p)};r.width=r.right-r.left;r.height=r.bottom-r.top}
 if(r){Object.assign(hole.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});hole.classList.remove('none')}
 else{Object.assign(hole.style,{left:innerWidth/2+'px',top:innerHeight/2+'px',width:'0px',height:'0px'});hole.classList.add('none')}
 place(r);
 if(busy||paused)return;el0+=dt;bar.style.width=Math.min(100,el0/dur*100)+'%';
 const sub=S[i].sub||[];while(subN<sub.length&&el0>=sub[subN][0]){try{sub[subN][1]()}catch(e){}subN++}
 if(el0>=dur){busy=!0;go(i+1,1)}}
requestAnimationFrame(frame);
function start(){if(run)return;const a=$('#auth');if(a&&!a.hidden)return;run=!0;paused=!1;bPlay.innerHTML='&#10074;&#10074;';ov.classList.add('on');go(0,1)}
async function stop(){if(!run)return;run=!1;ov.classList.remove('on');try{await ctx('main');clearName();view('hall')}catch(e){}if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}
const togglePause=()=>{paused=!paused;bPlay.innerHTML=paused?'&#9654;':'&#10074;&#10074;';bPlay.setAttribute('aria-label',paused?'تشغيل':'إيقاف مؤقت')};
ov.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b||busy&&b.dataset.a!=='x')return;const a=b.dataset.a;
 if(a==='x')stop();else if(a==='play')togglePause();else if(a==='next'){busy=!0;go(i+1,1)}else if(a==='prev'){busy=!0;go(i-1,-1)}
 else if(a==='fs'){if(document.fullscreenElement)document.exitFullscreen().catch(()=>{});else document.documentElement.requestFullscreen().catch(()=>{})}});
addEventListener('keydown',e=>{if(!run)return;if(e.key==='Escape'){e.stopPropagation();stop()}else if(e.key===' '){e.preventDefault();togglePause()}else if(busy)return;else if(e.key==='ArrowLeft'){busy=!0;go(i+1,1)}else if(e.key==='ArrowRight'){busy=!0;go(i-1,-1)}},!0);

/* الأزرار: بالشريط الفوقاني وبالإعدادات */
const ico='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M10 8.2v5.6l4.6-2.8z" fill="currentColor"/></svg>';
const hb=document.createElement('button');hb.className='btn secondary';hb.id='demoBtn';hb.type='button';hb.setAttribute('aria-label','عرض النظام');hb.innerHTML=ico+'<span>عرض النظام</span>';
const ref=$('#hostGuide')||$('#openAdmin');ref&&ref.parentElement.insertBefore(hb,ref);hb.onclick=start;
const dw=$('#drawer .dScroll');if(dw){const d=document.createElement('div');d.className='dmDrawer';d.innerHTML='<button class="btn primary block" type="button" id="demoBtn2">'+ico+'<span>عرض النظام</span></button><p class="help">يشرح كل أجزاء النظام تلقائياً، جزء جزء، ويعيد نفسه. مناسب لتدريب الموظفين وللعرض على شاشة.</p>';dw.prepend(d);d.querySelector('button').onclick=async()=>{const c=$('#closeAdmin');c&&c.click();await wait(300);start()}}
if(/[?&]demo=1/.test(location.search)){const t=setInterval(()=>{const a=$('#auth');if(a&&a.hidden&&$('#mapBtn')){clearInterval(t);setTimeout(start,1500)}},700)}
window.__demo={start,stop};
})();
