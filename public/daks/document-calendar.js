/* Calendar uses confirmed dates; historical inspection periods stay historical. */
(() => {
 const section=document.createElement('section');section.className='card';section.dataset.workspace='calendar';section.dataset.hideDriver='';
 section.innerHTML='<h2>Muayene ve seyrüsefer takvimi</h2><div class="calendar-toolbar"><button type="button" id="calendarPrev" aria-label="Önceki ay">‹</button><h3 id="calendarTitle"></h3><button type="button" id="calendarNext" aria-label="Sonraki ay">›</button><button type="button" id="calendarToday">Bu ay</button></div><p>Seyrüsefer: bitiş ve ödeme ayının 10’u · Ay sonundaki doğrulanmış muayene: ayın 1’inde uyarı. Gri kayıtlar geçmiş harç dönemidir.</p><div id="calendarGrid" class="document-calendar"></div><h3>Sıradaki tarihler</h3><div id="calendarUpcoming"></div><details><summary>Kesin tarihi eksik araçlar</summary><div id="calendarMissing"></div></details>';
 document.querySelector('main').append(section);
 const now=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 let month=now().slice(0,7);
 const node=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 function draw(){
  const events=[],missing=[],today=now();
  for(const car of visibleCars()){
   const info=vehicleDocumentInfo(car,records,today),add=(date,label,type)=>{if(/^\d{4}-\d{2}-\d{2}$/.test(date||''))events.push({date,label,plate:car.plate,type});};
   if(info.roadEnd){add(info.roadEnd,'Seyrüsefer bitişi','road');const d=new Date(info.roadEnd+'T12:00:00');d.setDate(10);d.setMonth(d.getMonth()+1);add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-10`,'Seyrüsefer kontrol et','road');}
   else missing.push(car.plate+' · Seyrüsefer bitişi doğrulanmadı');
   if(car.inspection){add(car.inspection,'Muayene son tarih','inspection');if(Number(car.inspection.slice(8))>=25)add(car.inspection.slice(0,8)+'01','Muayene ayı başladı · kontrol et','inspection');}
   else {missing.push(car.plate+' · Sonraki muayene tarihi doğrulanmadı');if(info.inspectionPeriod){const end=info.inspectionPeriod[1];if(/^\d{2}\.\d{2}\.\d{4}$/.test(end))add(end.split('.').reverse().join('-'),'Geçmiş muayene harç dönemi sonu','history');}}
  }
  events.sort((a,b)=>a.date.localeCompare(b.date)||a.plate.localeCompare(b.plate));
  const base=new Date(month+'-01T12:00:00');document.getElementById('calendarTitle').textContent=base.toLocaleDateString('tr-TR',{month:'long',year:'numeric'});
  const grid=document.getElementById('calendarGrid');grid.replaceChildren();
  for(const day of ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'])grid.append(node('div',day,'calendar-weekday'));
  for(let i=0;i<(base.getDay()+6)%7;i++)grid.append(node('div','','calendar-blank'));
  const count=new Date(base.getFullYear(),base.getMonth()+1,0).getDate();
  for(let day=1;day<=count;day++){const date=month+'-'+String(day).padStart(2,'0'),box=node('div','','calendar-day'+(date===today?' calendar-today':''));box.append(node('strong',String(day)));for(const e of events.filter(e=>e.date===date))box.append(node('div',e.plate+' · '+e.label,'calendar-event '+e.type));grid.append(box);}
  const upcoming=document.getElementById('calendarUpcoming');upcoming.replaceChildren();const future=events.filter(e=>e.date>=today&&e.type!=='history').slice(0,16);for(const e of future)upcoming.append(node('p',e.date.split('-').reverse().join('.')+' · '+e.plate+' · '+e.label));if(!future.length)upcoming.append(node('p','Doğrulanmış yaklaşan tarih yok.'));
  document.getElementById('calendarMissing').replaceChildren(...missing.map(text=>node('p',text)));
 }
 function shift(n){const d=new Date(month+'-01T12:00:00');d.setMonth(d.getMonth()+n);month=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;draw();}
 document.getElementById('calendarPrev').onclick=()=>shift(-1);document.getElementById('calendarNext').onclick=()=>shift(1);document.getElementById('calendarToday').onclick=()=>{month=now().slice(0,7);draw();};
 const original=window.render;window.render=function(...args){const result=original.apply(this,args);draw();return result;};draw();
})();
