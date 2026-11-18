import hashlib,sys
src,dst=sys.argv[1],sys.argv[2]
t=open(src,encoding='utf-8').read()
def rep(a,b,cnt=1):
    global t
    n=t.count(a); assert n==cnt,(a[:90],n); t=t.replace(a,b)
# --- colours: نساء وردي، رجال أسود (VIP أغمق)
rep("window.__seatCol=function(id){var p=String(id).slice(1).split('-'),r=+p[0],g=__zg(r,+p[1]);return __vipRC(r,+p[1])?(g==='m'?'#a9c6ef':'#d2b6ee'):(g==='m'?'#d9e7f9':'#efe2fb')};",
    "window.__seatCol=function(id){var p=String(id).slice(1).split('-'),r=+p[0],g=__zg(r,+p[1]);return __vipRC(r,+p[1])?(g==='m'?'#000000':'#e0478a'):(g==='m'?'#4a4a4e':'#f8c5da')};\nwindow.__seatTxt=function(id){var p=String(id).slice(1).split('-'),r=+p[0];return (__zg(r,+p[1])==='f'&&!__vipRC(r,+p[1]))?'#7a1d48':'#fff'};")
rep("</script>\n<script>(()=>{var Xi={LEFT:0,","</script>\n<style>.gdot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-inline-end:6px;vertical-align:0}.gdot.m{background:#111}.gdot.f{background:#e8679c}.seg button.on[data-g=\"m\"]{box-shadow:0 1px 3px rgba(16,24,40,.12),inset 0 -3px 0 #111}.seg button.on[data-g=\"f\"]{box-shadow:0 1px 3px rgba(16,24,40,.12),inset 0 -3px 0 #e8679c}.legend .gm{background:#1d1d1f}.legend .gf{background:#e8679c}.legend .gt{background:#a3a3a8}</style>\n<script>(()=>{var Xi={LEFT:0,")
for g,lab in [('m','VIP رجال'),('f','VIP نساء'),('m','عادي رجال'),('f','عادي نساء')]:
    rep('data-g="%s" role="radio" aria-checked="false"><b>%s</b>'%(g,lab),'data-g="%s" role="radio" aria-checked="false"><b><i class="gdot %s"></i>%s</b>'%(g,g,lab))
# 3D: فارغ = لون الجنس، محجوز = رمادي
rep('var oi={free:new Ht("#2A9C64"),taken:new Ht("#C23A40"),','var oi={free:new Ht("#2A9C64"),men:new Ht("#1d1d1f"),women:new Ht("#E8679C"),taken:new Ht("#A3A3A8"),')
rep('bt.seats[i.id]?oi.taken:oi.free)','bt.seats[i.id]?oi.taken:__zg(i.r,i.c)==="m"?oi.men:oi.women)')
rep('''<ul class="legend">
      <li><i class="f"></i>فارغ</li>
      <li><i class="t"></i>محجوز</li>''','''<ul class="legend">
      <li><i class="gf"></i>نساء</li>
      <li><i class="gm"></i>رجال</li>
      <li><i class="gt"></i>محجوز</li>''')
# 2D map
rep('e.style.background=L?"#d0021b":D?"#f3a6a6":O?"#9aa0a6":__seatCol(s);e.style.color=L||O?"#fff":"#456";','e.style.background=L?"#d0021b":D?"#f5a04a":O?"#c7c7cc":__seatCol(s);e.style.color=L||D?"#fff":O?"#555":__seatTxt(s);')
rep('background:#f3a6a6;vertical-align:-2px"></i>','background:#f5a04a;vertical-align:-2px"></i>')
rep('background:#9aa0a6;vertical-align:-2px"></i>','background:#c7c7cc;vertical-align:-2px"></i>')
SW=lambda c:'<i style="display:inline-block;width:14px;height:14px;border-radius:4px;background:%s;vertical-align:-2px"></i>'%c
rep('<span>'+SW('#a9c6ef')+' VIP رجال</span><span>'+SW('#d2b6ee')+' VIP نساء</span><span>'+SW('#d9e7f9')+' رجال</span><span>'+SW('#efe2fb')+' نساء</span>',
    '<span>'+SW('#000000')+' VIP رجال</span><span>'+SW('#4a4a4e')+' رجال</span><span>'+SW('#e0478a')+' VIP نساء</span><span>'+SW('#f8c5da')+' نساء</span>')
open(dst,'w',encoding='utf-8').write(t)
print(hashlib.sha256(open(src,encoding='utf-8').read().encode()).hexdigest()[:8],'->',hashlib.sha256(t.encode()).hexdigest()[:8])
t=open(dst,encoding='utf-8').read()
for a,b in [('<b id="sVip">60</b><small>من 60</small>','<b id="sVip">70</b><small>من 70</small>'),('<b id="sReg">270</b><small>من 270</small>','<b id="sReg">260</b><small>من 260</small>')]:
    assert t.count(a)==1; t=t.replace(a,b)
open(dst,'w',encoding='utf-8').write(t)
print('final',hashlib.sha256(t.encode()).hexdigest()[:8])
