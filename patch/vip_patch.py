import hashlib,sys
src,dst=sys.argv[1],sys.argv[2]
t=open(src,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global t
    n=t.count(a)
    assert n==cnt,(a[:80],n)
    t=t.replace(a,b)
U=lambda s:s.encode('unicode_escape').decode()  # not used
# --- helper script before bundle
HELP='''<script>
/* تقسيم الكراسي حسب الجنس: القسم B كله رجال، والصف الأول من القسم A رجال (VIP)، وباقي A والقسم C كله نساء */
window.__vg=null;
window.__zg=function(r,c){return (c>10&&c<21)||(c<=10&&r===1)?'m':'f'};
window.__zgId=function(id){var p=String(id).slice(1).split('-');return __zg(+p[0],+p[1])};
window.__gl=function(g){return g==='m'?'رجال':g==='f'?'نساء':''};
window.__segCounts=function(seats){var k={vm:0,vf:0,rm:0,rf:0};for(var r=1;r<=11;r++)for(var c=1;c<=30;c++){if(seats&&seats['R'+r+'-'+c])continue;k[(r<=2?'v':'r')+__zg(r,c)]++}
 [['cVipM','vm'],['cVipF','vf'],['cRegM','rm'],['cRegF','rf']].forEach(function(x){var e=document.getElementById(x[0]);if(e)e.textContent=k[x[1]]+' متاح'})};
window.__seatCol=function(id){var p=String(id).slice(1).split('-'),r=+p[0],g=__zg(r,+p[1]);return r<=2?(g==='m'?'#a9c6ef':'#d2b6ee'):(g==='m'?'#d9e7f9':'#efe2fb')};
</script>
'''
rep('<script>(()=>{var Xi={LEFT:0,',HELP+'<script>(()=>{var Xi={LEFT:0,')
# --- markup
rep('''<div class="seg" role="radiogroup" aria-label="فئة الضيف">
          <button data-cat="VIP" role="radio" aria-checked="false"><b>VIP</b><span id="cVip">50 متاح</span></button>
          <button data-cat="عادي" role="radio" aria-checked="false"><b>عادي</b><span id="cReg">300 متاح</span></button>
        </div>''','''<div class="seg" role="radiogroup" aria-label="فئة الضيف">
          <button data-cat="VIP" data-g="m" role="radio" aria-checked="false"><b>VIP رجال</b><span id="cVipM">30 متاح</span></button>
          <button data-cat="VIP" data-g="f" role="radio" aria-checked="false"><b>VIP نساء</b><span id="cVipF">30 متاح</span></button>
          <button data-cat="عادي" data-g="m" role="radio" aria-checked="false"><b>عادي رجال</b><span id="cRegM">90 متاح</span></button>
          <button data-cat="عادي" data-g="f" role="radio" aria-checked="false"><b>عادي نساء</b><span id="cRegF">180 متاح</span></button>
        </div>''')
# --- bundle edits
rep('function*Wu(n){let[t,e]=n==="VIP"?[1,fn]:[fn+1,ns];for(let i=t;i<=e;i++)for(let s=1;s<=hi;s++)yield Sr(i,s)}',
    'function*Wu(n,g){let[t,e]=n==="VIP"?[1,fn]:[fn+1,ns];for(let i=t;i<=e;i++)for(let s=1;s<=hi;s++)(!g||__zg(i,s)===g)&&(yield Sr(i,s))}')
rep('function FM(n){for(let t of Wu(n))','function FM(n){for(let t of Wu(n,__vg))')
rep('if(!Nn)return null;if(ci&&!bt.seats[ci]&&Rc(ci)===Nn)return','if(!Nn||!__vg)return null;if(ci&&!bt.seats[ci]&&Rc(ci)===Nn&&__zgId(ci)===__vg)return')
rep('R("#cVip").textContent=n+" \\u0645\\u062A\\u0627\\u062D",R("#cReg").textContent=t+" \\u0645\\u062A\\u0627\\u062D",','__segCounts(bt.seats),')
rep('let l=c.dataset.cat===Nn;','let l=c.dataset.cat===Nn&&c.dataset.g===__vg;')
rep('n.addEventListener("click",()=>{kM(n.dataset.cat),Ue.focus()})','n.addEventListener("click",()=>{__vg=n.dataset.g||null,kM(n.dataset.cat),Ue.focus()})')
rep('ci=null,Nn=t.c,Jn())','ci=null,Nn=t.c,__vg=t.gd||null,Jn())')
rep('{name:t,cat:Nn,seat:n.id,','{name:t,cat:Nn,gd:__vg,seat:n.id,')
rep('let a=Nn;cm(),Nn=a,Jn()','let a=Nn;cm(),Nn=a,__vg=null,Jn()')
rep('On=!0}ci=t.id,Nn=Rc(t.id),Jn()','On=!0}{let zg=__zgId(t.id),kg=xe&&xe.gd||(Nn&&__vg);if(kg&&kg!==zg){Vt("هذا الكرسي مخصّص لل"+__gl(zg)+" فقط",!0);return}__vg=zg}ci=t.id,Nn=Rc(t.id),Jn()')
rep('${s.r}${s.vip?" \\u00B7 VIP":""}</span>','${s.r}${s.vip?" \\u00B7 VIP":""} \\u00B7 ${__gl(__zgId(n.id))}</span>')
rep('\\u0643\\u0644 \\u0643\\u0631\\u0627\\u0633\\u064A ${Nn} \\u0645\\u062D\\u062C\\u0648\\u0632\\u0629','\\u0643\\u0644 \\u0643\\u0631\\u0627\\u0633\\u064A ${Nn} ${__gl(__vg)} \\u0645\\u062D\\u062C\\u0648\\u0632\\u0629')
rep('"\\u0627\\u062E\\u062A\\u0627\\u0631 \\u0627\\u0644\\u0641\\u0626\\u0629 \\u062D\\u062A\\u0649 \\u064A\\u0637\\u0644\\u0639 \\u0627\\u0644\\u0643\\u0631\\u0633\\u064A."','"اختار الفئة (رجال أو نساء) حتى يطلع الكرسي."')
rep('\\u0627\\u062E\\u062A\\u0627\\u0631 \\u0641\\u0626\\u062A\\u0647 \\u062D\\u062A\\u0649 \\u064A\\u062A\\u062D\\u062C\\u0632\\u0644\\u0647 \\u0643\\u0631\\u0633\\u064A.','اختار فئته (رجال أو نساء) حتى يتحجزله كرسي.')
rep('!l){for(let h of Wu(r))if(!e.seats[h])','!l){for(let h of Wu(r,t.gd))if(!e.seats[h])')
# --- seat map
rep('e.dataset.v==="1"?"#f1dfb8":"#cfe8d8"','__seatCol(s)')
SW=lambda c:'<i style="display:inline-block;width:14px;height:14px;border-radius:4px;background:%s;vertical-align:-2px"></i>'%c
rep('<span>'+SW('#f1dfb8')+' VIP</span>','<span>'+SW('#a9c6ef')+' VIP رجال</span><span>'+SW('#d2b6ee')+' VIP نساء</span><span>'+SW('#d9e7f9')+' رجال</span><span>'+SW('#efe2fb')+' نساء</span>')
rep('\\u0642\\u0633\\u0645 ${b}</div>','\\u0642\\u0633\\u0645 ${b}<div style="font-size:12px;font-weight:600;color:#8a7f78;margin-top:2px">${b==="A"?"الصف 1 رجال · الباقي نساء":b==="B"?"رجال فقط":"نساء فقط"}</div></div>')
# --- demo tour step
rep("const pickSug=()=>{const it=$$('#suggest .sItem');if(!it.length)return;const g=it.find(x=>!x.querySelector('.badge.in'))||it[0];g.dispatchEvent(new MouseEvent('mousedown',{bubbles:!0,cancelable:!0}))};",
    "const pickSug=()=>{const it=$$('#suggest .sItem');if(!it.length)return;const g=it.find(x=>!x.querySelector('.badge.in'))||it[0];const v=/VIP/.test(g.textContent);g.dispatchEvent(new MouseEvent('mousedown',{bubbles:!0,cancelable:!0}));setTimeout(()=>{if(window.__vg)return;const b=document.querySelector('.seg button[data-cat=\"'+(v?'VIP':'عادي')+'\"][data-g=\"f\"]');b&&b.click()},350)};")
rep("p:'تُحدَّد الفئة تلقائياً من القائمة، وإذا كان الضيف جديداً وغير مُدرج فيها، يكتب الموظف اسمه ويختار فئته.'",
    "p:'يختار الموظف فئة الضيف وجنسه بضغطة واحدة. القسم B والصف الأول من القسم A للرجال، وباقي القسم A والقسم C للنساء، فلا يُجلَس أحد في غير قسمه.'")
open(dst,'w',encoding='utf-8').write(t)
print(hashlib.sha256(open(src,encoding='utf-8').read().encode()).hexdigest()[:8],'->',hashlib.sha256(t.encode()).hexdigest()[:8],len(t))
