// Tamamı kurgusal örnek veriler; kimlik alanları gerçek numara içermez.
const cars = [
  {plate:'DT 004', model:'Ford Transit', year:2014, owner:'Örnek Sahip D', identity:'DEMO-004', assigned:'other', road:'2026-08-15', inspection:'2026-11-20', service:'2026-10-20'},
  {plate:'DT 002', model:'Mercedes-Benz Sprinter', year:2022, owner:'Örnek Sahip B', identity:'DEMO-002', assigned:'other', road:'2027-02-10', inspection:'2026-10-18', service:'2026-10-12'},
  {plate:'DT 001', model:'Ford Transit', year:2026, owner:'Örnek Sahip A', identity:'DEMO-001', assigned:'driver', road:'2027-06-01', inspection:'2027-06-01', service:'2026-12-15'},
  {plate:'DT 003', model:'Volkswagen Crafter', year:2018, owner:'Örnek Sahip C', identity:'DEMO-003', assigned:'other', road:'2026-10-25', inspection:'2026-09-10', service:'2026-09-25'}
];
const $ = id => document.getElementById(id);
const records = [];
let editingPlate=null;
function openVehicleEditor(car){
  if(!isPrivileged())return;
  editingPlate=car?car.plate:null;$('vehicleForm').reset();
  $('addVehiclePanel').hidden=false;$('addVehicleButton').setAttribute('aria-expanded','true');
  $('addVehiclePanel').querySelector('h2').textContent=car?'Araç bilgilerini düzenleyin':'Araç bilgilerini girin';
  $('vehicleForm').querySelector('button[type="submit"]').textContent=car?'Değişiklikleri kaydet':'Aracı listeye ekle';
  if(car){const r=weekly[car.plate];const fields={newPlate:car.plate,newModel:car.model,newYear:car.year,newKm:r.km,newOwner:car.owner,newIdentity:car.identity,newTitleDate:car.titleDate||'',newDriver:r.driver,newResponsible:car.responsible||'',newAssignment:car.assigned,newRoad:car.road||'',newInspection:car.inspection||'',newService:car.service||'',newTankCapacity:car.tankCapacity||'',newConsumptionLimit:car.consumptionLimit||'',newClass:car.vehicleClass||'unknown',newFirstRoad:car.firstRoad||'',newFirstInspection:car.firstInspection||''};for(const [id,value] of Object.entries(fields))$(id).value=value;}
  $('vehicleMessage').textContent='';$('addVehiclePanel').scrollIntoView({behavior:'smooth',block:'start'});$('newPlate').focus();
}
const weekly = {
  'DT 001': {km:12400, date:'2026-10-01', maintenance:'done', driver:'Örnek Şoför A'},
  'DT 002': {km:86500, date:'2026-09-24', maintenance:'done', driver:'Örnek Şoför B'},
  'DT 003': {km:172300, date:'2026-10-01', maintenance:'pending', driver:'Örnek Şoför C'},
  'DT 004': {km:248600, date:'2026-09-20', maintenance:'done', driver:'Örnek Şoför D'}
};
let databaseRevision=null;
async function loadDatabase(){
 try{const response=await fetch('/api/state',{cache:'no-store'});if(!response.ok)throw new Error();const saved=await response.json();cars.splice(0,cars.length,...saved.cars);records.splice(0,records.length,...saved.records);for(const key of Object.keys(weekly))delete weekly[key];Object.assign(weekly,saved.weekly);databaseRevision=saved.revision;render();}
 catch(error){document.querySelectorAll('form button[type="submit"],#addVehicleButton').forEach(el=>el.disabled=true);if($('saveStatus'))$('saveStatus').textContent='Veritabanına bağlanılamadı. Bilgi girmeyin. İnternet bağlantınızı kontrol edip sayfayı yenileyin.';}
}
let savePending=false;
async function persistData(){
 if(databaseRevision===null||savePending){alert('Veritabanı hazır değil veya kayıt işlemi sürüyor.');return false;}
 savePending=true;
 try{const response=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:databaseRevision,cars,weekly,records})});const saved=await response.json();if(!response.ok)throw new Error(saved.error);databaseRevision=saved.revision;return true;}
 catch(error){alert('Kaydedilmedi: '+error.message+'. Bu sayfayı yenilemeden yedeğinizi indirin.');return false;}
 finally{savePending=false;}
}
function weekStart(){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d;}
function weekState(car){const report=weekly[car.plate];return {report,missing:!report.date||new Date(report.date+'T00:00:00')<weekStart()};}
function renderWeekly(){
  if(!$('alerts'))return;
  $('alerts').replaceChildren();let count=0;
  for(const car of visibleCars()){
    const {report,missing}=weekState(car);
    const text=missing?'Bu haftanın kilometre ve bakım bildirimi henüz alınmadı.':report.maintenance==='pending'?'Şoför haftalık bakımın yapılmadığını bildirdi.':report.maintenance==='unreported'?'Bu haftanın bakım durumu bildirilmedi.':'';
    if(!text)continue;count++;
    const row=document.createElement('div');row.className='row';const body=document.createElement('div');const title=document.createElement('strong');title.textContent=car.plate+' · '+text;const sub=document.createElement('span');sub.className='cell-sub';sub.textContent='Bildirim alıcıları: '+report.driver+' ve '+(car.responsible||'araç sorumlusu')+' · Önizleme, gönderilmedi';body.append(title,sub);row.append(body);$('alerts').append(row);
  }
  $('alertCount').textContent=count;$('alertsEmpty').hidden=count>0;
}
function renderSchedule(){
  if(!$('scheduleList'))return;$('scheduleList').replaceChildren();
  const today=new Date();today.setHours(0,0,0,0);
  for(const car of visibleCars()){
    const plan=trackingPlan(car);const row=document.createElement('div');row.className='row';
    const body=document.createElement('div');const title=document.createElement('strong');title.textContent=car.plate;
    const road=document.createElement('span');road.className='cell-sub';road.textContent='Seyrüsefer: '+plan.road;
    const inspection=document.createElement('span');inspection.className='cell-sub';inspection.textContent='Muayene: '+plan.inspection;
    const first=document.createElement('span');first.className='cell-sub';first.textContent='İlk muayene: '+(car.firstInspection?new Date(car.firstInspection+'T00:00:00').toLocaleDateString('tr-TR'):'Girilmedi');
    body.append(title,road,inspection,first);const status=document.createElement('span');status.className='badge';
    const due=[plan.roadDue,plan.inspectionDue].filter(Boolean).some(d=>(d-today)/86400000<=30);
    status.textContent=due?'Kontrol et':(!plan.inspectionDue||!plan.roadDue)?'Bilgi / takvim tamamla':'Planlandı';
    if(due)status.classList.add('warn');row.append(body,status);$('scheduleList').append(row);
  }
}
function renderRoadAlerts(){
  if(!$('roadAlerts'))return;
  $('roadAlerts').replaceChildren();const now=new Date();
  const due=visibleCars().filter(car=>{if(!car.firstRoad)return false;const date=new Date(car.firstRoad+'T00:00:00');return date<=now&&date.getMonth()===now.getMonth();});
  $('roadAlerts').hidden=due.length===0;
  for(const car of due){const item=document.createElement('div');item.className='road-alarm';item.setAttribute('role','alert');const icon=document.createElement('span');icon.className='alarm-icon';icon.textContent='!';icon.setAttribute('aria-hidden','true');const body=document.createElement('div');const title=document.createElement('strong');title.textContent=car.plate+' — SEYRÜSEFER KONTROL ET';const detail=document.createElement('p');detail.textContent='Seyrüsefer ödeme ayı geldi. Resmî sorgulama üzerinden kontrol edin.';const query=document.createElement('a');query.className='link alarm-query';query.href='https://online.vergi.gov.ct.tr/gvdos_online-vergi/akosths.jsp?token=d1078f5e3dc646b78d5d4e5842f21e97feb48d366bc7617458b6679dec12675154a01fccc42292bb04d926bc259dbc75e39dd8e202535fd70a7098396c74a6f7';query.target='_blank';query.rel='noopener noreferrer';query.textContent='Seyrüseferi kontrol et ↗';body.append(title,detail,query);item.append(icon,body);$('roadAlerts').append(item);}
}
const allowedRoles = ['admin','office','vehicle','driver'];
function isPrivileged(){return ['admin','office'].includes($('role').value);}
const requestedRole = new URLSearchParams(location.search).get('role');
if (allowedRoles.includes(requestedRole)) $('role').value = requestedRole;
function visibleCars(){const selected=$('driverProfile')?.value;return cars.filter(car => $('role').value !== 'driver' || (selected?weekly[car.plate]?.driver===selected:car.assigned==='driver')).sort((a,b) => b.year - a.year || a.plate.localeCompare(b.plate));}
function dateStatus(date){
  if(!date)return {label:'Bilgi girilmedi',style:'warn',date:'—'};
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(date+'T00:00:00');
  const days = Math.ceil((due-today)/86400000);
  return {label:days<0?'Süresi geçti':days<=30?'Yaklaşıyor':'Güncel',style:days<0?'overdue':days<=30?'warn':'',date:due.toLocaleDateString('tr-TR')};
}
function cell(text,className){const el=document.createElement('td');const content=document.createElement('span');content.textContent=text;if(className)content.className=className;el.append(content);return el;}
function deadlineCell(date,service=false){const state=dateStatus(date);const td=cell(!date?'Bilgi girilmedi':service?(state.style==='overdue'?'Bakım gecikti':state.style==='warn'?'Bakım yaklaşıyor':'Planlandı'):state.label,'badge '+state.style);const sub=document.createElement('span');sub.className='cell-sub';sub.textContent=(service?'Planlanan: ':'Geçerlilik: ')+state.date;td.append(sub);return td;}
function roadCell(car){
  if(!car.firstRoad)return cell('İlk ödeme tarihi girilmeli','badge warn');
  const first=new Date(car.firstRoad+'T00:00:00');const now=new Date();
  const td=cell(first.toLocaleDateString('tr-TR',{month:'long'}),'badge');
  const sub=document.createElement('span');sub.className='cell-sub';sub.textContent='İlk ödeme: '+first.toLocaleDateString('tr-TR');td.append(sub);
  if(first.getMonth()===now.getMonth()&&first<=now){const alert=document.createElement('span');alert.className='cell-sub badge warn';alert.textContent='Kontrol et';td.append(alert);}
  return td;
}
function renderFuel(){
 if(!$('fuelRecords'))return;
 const visible=visibleCars(),old=$('fuelPlate').value;$('fuelPlate').replaceChildren();
 for(const car of visible){const option=document.createElement('option');option.value=car.plate;option.textContent=car.plate+' · '+car.model;$('fuelPlate').append(option);}if(visible.some(car=>car.plate===old))$('fuelPlate').value=old;
 const items=records.filter(r=>r.kind==='fuel'&&visible.some(car=>car.plate===r.plate)).sort((a,b)=>b.fuelDate.localeCompare(a.fuelDate));
 $('fuelRecords').replaceChildren();$('fuelEmpty').hidden=items.length>0;
 const total=items.reduce((sum,r)=>sum+r.litres,0),cost=items.reduce((sum,r)=>sum+r.amount,0);
 $('fuelSummary').textContent=items.length+' alım · '+total.toLocaleString('tr-TR',{maximumFractionDigits:2})+' litre · '+cost.toLocaleString('tr-TR',{maximumFractionDigits:2})+' TL';
 for(const r of items){const car=cars.find(c=>c.plate===r.plate);const interval=fuelInterval(r,records,Number(car?.consumptionLimit));const metrics=fuelMetrics(r,records);const row=document.createElement('tr');for(const value of [r.plate,new Date(r.fuelDate+'T00:00:00').toLocaleDateString('tr-TR'),r.driver,r.fuelType,r.litres.toLocaleString('tr-TR')+' L',r.amount.toLocaleString('tr-TR')+' TL',r.km.toLocaleString('tr-TR')+' km',metrics.distance===null?'—':metrics.distance.toLocaleString('tr-TR')+' km',metrics.rate===null?'Hesaplanamaz':metrics.rate.toLocaleString('tr-TR',{maximumFractionDigits:2})+' L/100 km',r.fullTank?'Tam depo':'Kısmi / belirtilmedi',r.station||'—'])row.append(cell(value));if(auditFuel(r,car,records).length){row.style.background='#6b1e2b';row.title=auditFuel(r,car,records).join(' · ');}$('fuelRecords').append(row);}
}
function fuelMetrics(entry,all){
 const chronological=all.filter(r=>r.kind==='fuel'&&r.plate===entry.plate).sort((a,b)=>a.fuelDate.localeCompare(b.fuelDate)||a.km-b.km);
 const index=chronological.indexOf(entry);if(index<=0)return {distance:null,rate:null};
 const distance=entry.km-chronological[index-1].km;
 if(distance<=0)return {distance:null,rate:null};
 if(!entry.fullTank)return {distance,rate:null};
 let litres=entry.litres;
 for(let i=index-1;i>=0;i--){const prev=chronological[i];if(prev.fuelType!==entry.fuelType)return {distance,rate:null};if(chronological[i+1].km<=prev.km)return {distance,rate:null};if(prev.fullTank){const span=entry.km-prev.km;return {distance,rate:litres/span*100};}litres+=prev.litres;}
 return {distance,rate:null};
}
function fuelInterval(entry,all,limit){
 const list=all.filter(r=>r.kind==='fuel'&&r.plate===entry.plate).sort((a,b)=>a.fuelDate.localeCompare(b.fuelDate)||a.km-b.km),index=list.indexOf(entry);
 if(index<=0)return null;const previous=list[index-1],distance=entry.km-previous.km;
 if(distance<=0||previous.fuelType!==entry.fuelType)return null;
 const rate=entry.litres/distance*100,expected=limit>0?distance*limit/100:null;
 return {distance,rate,cost:entry.amount/distance,previousKm:previous.km,km:entry.km,litres:entry.litres,expected,excess:expected===null?null:Math.max(0,entry.litres-expected),estimated:!(previous.fullTank&&entry.fullTank)};
}
function monthlyFuel(month,entries){
 const groups=new Map();
 for(const r of entries){if(r.kind!=='fuel'||r.fuelDate.slice(0,7)!==month)continue;if(!groups.has(r.plate))groups.set(r.plate,{plate:r.plate,Benzin:0,Mazot:0,LPG:0,litres:0,amount:0,count:0});const g=groups.get(r.plate);if(Object.hasOwn(g,r.fuelType))g[r.fuelType]+=r.litres;g.litres+=r.litres;g.amount+=r.amount;g.count++;}
 return [...groups.values()].sort((a,b)=>a.plate.localeCompare(b.plate));
}
function consumptionWindow(readings){
 const first=readings.findIndex(r=>r.fullTank);let last=-1;for(let i=readings.length-1;i>first;i--)if(readings[i].fullTank){last=i;break;}
 if(first<0||last<=first)return null;const window=readings.slice(first,last+1);
 if(window.some((r,i)=>r.fuelType!==window[0].fuelType||(i>0&&r.km<=window[i-1].km)))return null;
 const km=window[window.length-1].km-window[0].km,litres=window.slice(1).reduce((n,r)=>n+r.litres,0),amount=window.slice(1).reduce((n,r)=>n+r.amount,0);
 return {km,litres,rate:litres/km*100,cost:amount/km,start:window[0].fuelDate,end:window[window.length-1].fuelDate};
}
function renderMonthlyFuel(){
 if(!$('monthlyRows'))return;
 const now=new Date();if(!$('fuelMonth').value)$('fuelMonth').value=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
 const month=$('fuelMonth').value,groups=monthlyFuel(month,records),fmt=n=>n.toLocaleString('tr-TR',{maximumFractionDigits:2});
 $('monthlyRows').replaceChildren();
 for(const car of cars.slice().sort((a,b)=>b.year-a.year)){
  const g=groups.find(item=>item.plate===car.plate)||{plate:car.plate,litres:0,amount:0,count:0};
  const readings=records.filter(r=>r.kind==='fuel'&&r.plate===car.plate&&r.fuelDate.slice(0,7)===month).sort((a,b)=>a.fuelDate.localeCompare(b.fuelDate)||a.km-b.km);
  let distance=null;if(readings.length>=2&&readings.every((r,i)=>i===0||r.km>=readings[i-1].km))distance=readings[readings.length-1].km-readings[0].km;
  const card=document.createElement('article');card.className='monthly-car-card';const title=document.createElement('h3');title.textContent=car.plate;const subtitle=document.createElement('p');subtitle.textContent=car.model+' · '+new Date(month+'-01T00:00:00').toLocaleDateString('tr-TR',{month:'long',year:'numeric'});card.append(title,subtitle);
  for(const [label,value] of [['Alınan yakıt',fmt(g.litres)+' LT'],['Yakıt tutarı',fmt(g.amount)+' TL'],['Yapılan km',distance===null?'Kayıt yetersiz':fmt(distance)+' KM']]){const metric=document.createElement('div');metric.className='monthly-metric';const caption=document.createElement('span');caption.textContent=label;const number=document.createElement('strong');number.textContent=value;metric.append(caption,number);card.append(metric);}
  const note=document.createElement('small');note.textContent=readings.length>=2?'İlk alım: '+fmt(readings[0].km)+' km · Son alım: '+fmt(readings[readings.length-1].km)+' km. Fark, bu iki yakıt alımı arasındaki mesafedir.':'KM hesabı için ilk ve sonraki yakıt alımındaki kilometre kaydı gerekir.';card.append(note);$('monthlyRows').append(card);
  const cycles=fuelCycles(records,car.plate),selected=cycles.filter(c=>c.end.slice(0,7)===month),consumption=selected[selected.length-1];
  const history=consumption?cycles.filter(c=>c.end<=consumption.start):[];
  const baseline=history.length>=3?history.reduce((n,c)=>n+c.litres,0)/history.reduce((n,c)=>n+c.km,0)*100:null;
  for(const [label,value] of [['Tam dolum dönemi',consumption?fmt(consumption.km)+' KM':'İki tam dolum gerekli'],['Dönem yakıtı',consumption?fmt(consumption.litres)+' LT':'—'],['Tüketim',consumption?fmt(consumption.rate)+' L/100 km':'Hesaplanamaz'],['Geçmiş ortalama',baseline?fmt(baseline)+' L/100 km':'En az 3 geçmiş dönem gerekli']]){const metric=document.createElement('div');metric.className='monthly-metric';const caption=document.createElement('span');caption.textContent=label;const number=document.createElement('strong');number.textContent=value;metric.append(caption,number);card.append(metric);}
  const issues=readings.flatMap(r=>auditFuel(r,car,records));const limit=Number(car.consumptionLimit);
  if(consumption&&limit>0&&consumption.rate>limit)issues.push('Belirlenen tüketim sınırı aşıldı');
  if(consumption&&baseline&&consumption.rate>baseline*1.2)issues.push('Kendi geçmişine göre %20 üzerinde tüketim (inceleme eşiği)');
  const status=document.createElement('p');status.className='consumption-status';status.textContent=issues.length?'KONTROL ET: '+[...new Set(issues)].join(' · '):'Girilen kayıtlarda eşleştirme uyarısı yok.';if(issues.length)status.classList.add('high-consumption');card.append(status);
  if(consumption){const note=document.createElement('small');note.textContent='Tam dolum dönemi: '+consumption.start+' – '+consumption.end+'. Başlangıç dolumu hariç, ara alımlar ve son dolum dahil. Uyarı tek başına yakıt hırsızlığı kanıtı değildir.';card.append(note);}

 }
 $('monthlyEmpty').textContent=groups.length?'':'Seçilen ayda yakıt alım kaydı yok.';
 const sum=key=>groups.reduce((n,g)=>n+g[key],0);$('monthlyTotals').textContent='Benzin: '+fmt(sum('Benzin'))+' L · Mazot: '+fmt(sum('Mazot'))+' L · LPG: '+fmt(sum('LPG'))+' L · Toplam: '+fmt(sum('litres'))+' L · '+fmt(sum('amount'))+' TL';
 $('monthArchive').replaceChildren();const months=[...new Set(records.filter(r=>r.kind==='fuel').map(r=>r.fuelDate.slice(0,7)))].sort().reverse();
 for(const m of months){const button=document.createElement('button');button.type='button';button.style.width='auto';button.textContent=new Date(m+'-01T00:00:00').toLocaleDateString('tr-TR',{month:'long',year:'numeric'});button.addEventListener('click',()=>{$('fuelMonth').value=m;renderMonthlyFuel();renderFuelAudit();});$('monthArchive').append(button);}
}
function renderTable(){
  if(!$('vehicles'))return;
  const query=$('search').value.trim().toLocaleLowerCase('tr-TR');
  const filtered=visibleCars().filter(car=>[car.plate,car.model,isPrivileged()?car.owner:'',String(car.year)].join(' ').toLocaleLowerCase('tr-TR').includes(query));
  $('vehicles').replaceChildren();$('noResults').hidden=filtered.length>0;
  for(const car of filtered){const row=document.createElement('tr');const plate=cell(car.plate,'plate-chip');const model=document.createElement('span');model.className='cell-sub';model.textContent=car.model;plate.append(model);const {report,missing}=weekState(car);const km=cell(report.km.toLocaleString('tr-TR')+' km');const date=document.createElement('span');date.className='cell-sub';date.textContent='Son bildirim: '+(report.date?new Date(report.date+'T00:00:00').toLocaleDateString('tr-TR'):'Haftalık bildirim yok');km.append(date);const status=cell(missing?'Bildirim bekleniyor':report.maintenance==='done'?'Bakım bildirildi':report.maintenance==='pending'?'Bakım yapılmadı':'Bakım bildirimi eksik','badge '+(missing?'warn':report.maintenance==='pending'?'overdue':report.maintenance==='unreported'?'warn':''));row.append(plate,cell(car.year));if(isPrivileged())row.append(cell(car.owner),cell(car.identity),cell(car.titleDate?new Date(car.titleDate+'T00:00:00').toLocaleDateString('tr-TR'):'Bilgi girilmedi'));row.append(roadCell(car),deadlineCell(car.inspection),deadlineCell(car.service,true),km,status);if(isPrivileged()){const action=document.createElement('td');const edit=document.createElement('button');edit.type='button';edit.textContent='Düzenle';edit.style.padding='8px 10px';edit.setAttribute('aria-label',car.plate+' düzenle');edit.addEventListener('click',()=>openVehicleEditor(car));action.append(edit);row.append(action);}$('vehicles').append(row);}
}
function render(){
  if($('driverProfile')){const previous=$('driverProfile').value;const names=[...new Set(cars.map(car=>weekly[car.plate]?.driver).filter(Boolean))];$('driverProfile').replaceChildren();for(const name of names){const option=document.createElement('option');option.value=name;option.textContent=name;$('driverProfile').append(option);}if(names.includes(previous))$('driverProfile').value=previous;}
  const role=$('role').value, driver=role==='driver', visible=visibleCars();
  document.querySelectorAll('[data-hide-driver]').forEach(el=>{el.hidden=driver;});
  document.querySelectorAll('[data-driver-only]').forEach(el=>{el.hidden=!driver;});
  document.querySelectorAll('[data-backup-admin]').forEach(el=>{el.hidden=!isPrivileged();});
  document.querySelectorAll('[data-private]').forEach(el=>{el.hidden=!isPrivileged();});
  if($('addVehicleButton'))$('addVehicleButton').hidden=!isPrivileged();
  if(!isPrivileged()&&$('addVehiclePanel'))$('addVehiclePanel').hidden=true;
  if($('dpms'))$('dpms').hidden=!['admin','office'].includes(role);
  if($('moduleCount'))$('moduleCount').textContent=['admin','office'].includes(role)?'2':'1';
  $('carCount').textContent=visible.length;
  renderRoadAlerts();
  renderMonthlyFuel();
  $('scope').textContent=driver?'Kendinize atanmış araç ve ilgili kontrol kayıtları.':$('vehicles')?'Araç sayısı ve tüm araçların belge ile bakım takibi.':role==='vehicle'?'Araçlarınızı DAKS üzerinden yönetin.':'Personel ve araç operasyonlarınıza buradan ulaşın.';
  if($('open'))$('open').href='daks.html?role='+encodeURIComponent(role);
  if($('home'))$('home').href='index.html?role='+encodeURIComponent(role);
  if($('addVehicleButton'))$('addVehicleButton').hidden=!isPrivileged();
  if(driver&&$('addVehiclePanel'))$('addVehiclePanel').hidden=true;
  if(!$('plate'))return;
  const selected=$('plate').value;$('plate').replaceChildren();
  for(const car of visible){const option=document.createElement('option');option.value=car.plate;option.textContent=car.plate+' · '+car.model;$('plate').append(option);}
  if(visible.some(car=>car.plate===selected))$('plate').value=selected;
  renderTable();renderWeekly();renderSchedule();renderFuel();renderFuelAudit();$('records').replaceChildren();
  const filtered=records.filter(r=>r.kind!=='fuel'&&(!driver||visible.some(car=>car.plate===r.plate)));$('empty').hidden=filtered.length>0;
  for(const r of filtered){const row=document.createElement('div');row.className='row';const content=document.createElement('span');content.textContent=r.plate+' · '+r.km+' km · '+r.date+' · '+r.checks.join(', ')+(r.note?' · '+r.note:'');const status=document.createElement('span');status.className='status';status.textContent=r.result;row.append(content,status);$('records').append(row);}
  $('message').textContent='';
}
$('role').addEventListener('change',render);
if($('driverProfile'))$('driverProfile').addEventListener('change',render);
if($('search'))$('search').addEventListener('input',renderTable);
if($('fuelMonth'))$('fuelMonth').addEventListener('change',()=>{renderMonthlyFuel();renderFuelAudit();});
if($('form'))$('form').addEventListener('submit',async e=>{e.preventDefault();const checks=Array.from(document.querySelectorAll('input[name="check"]:checked')).map(el=>el.value);if(!checks.length){$('message').textContent='En az bir kontrol alanı seçin.';return;}if($('result').value==='Sorun bildirildi'&&!$('note').value.trim()){$('message').textContent='Tespit edilen sorunu açıklayın.';return;}const report=weekly[$('plate').value];const km=Number($('km').value);if(km<report.km){$('message').textContent='Kilometre son bildirilen değerden düşük olamaz ('+report.km.toLocaleString('tr-TR')+' km).';return;}const today=new Date();report.km=km;report.date=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');report.maintenance=$('maintenance').value;records.unshift({plate:$('plate').value,km:$('km').value,result:$('result').value,note:$('note').value.trim(),checks,author:$('role').value,date:new Date().toLocaleString('tr-TR')});if(!await persistData())return;$('form').reset();render();$('message').textContent='Haftalık bildirim veritabanına kaydedildi; kilometre ve bakım durumu güncellendi.';});
if($('vehicleForm')){
  function closeVehicle(){ $('addVehiclePanel').hidden=true;$('addVehicleButton').setAttribute('aria-expanded','false');$('addVehicleButton').focus(); }
  $('addVehicleButton').addEventListener('click',()=>openVehicleEditor(null));
  $('cancelVehicle').addEventListener('click',closeVehicle);
  $('vehicleForm').addEventListener('submit',async e=>{
    e.preventDefault();if(!isPrivileged())return;
    const value=id=>$(id).value.trim();
    const plate=value('newPlate').replace(/\s+/g,'').toUpperCase();
    if(!/^[A-Z0-9-]+$/.test(plate)){$('vehicleMessage').textContent='Plakada yalnızca harf, rakam ve tire kullanın.';return;}
    if(cars.some(car=>car.plate!==editingPlate&&car.plate.replace(/\s+/g,'').toUpperCase()===plate)){$('vehicleMessage').textContent='Bu plaka zaten kayıtlı.';return;}
    for(const id of ['newModel','newOwner','newIdentity','newDriver','newResponsible']){if(!value(id)){$('vehicleMessage').textContent='Zorunlu alanları doldurun.';$(id).focus();return;}}
    const year=Number(value('newYear')),km=Number(value('newKm'));
    if(!Number.isInteger(year)||year<1900||year>2100||!Number.isInteger(km)||km<0||km>99999999){$('vehicleMessage').textContent='Model yılı ve kilometre değerlerini kontrol edin.';return;}
    const now=new Date();const titleDate=new Date(value('newTitleDate')+'T00:00:00');now.setHours(0,0,0,0);
    if(titleDate>now){$('vehicleMessage').textContent='Koçan tarihi gelecekte olamaz.';return;}
    const updated={plate,model:value('newModel'),year,owner:value('newOwner'),identity:value('newIdentity'),titleDate:value('newTitleDate'),responsible:value('newResponsible'),assigned:value('newAssignment'),road:value('newRoad'),inspection:value('newInspection'),service:value('newService'),tankCapacity:value('newTankCapacity')?Number(value('newTankCapacity')):null,consumptionLimit:value('newConsumptionLimit')?Number(value('newConsumptionLimit')):null,vehicleClass:value('newClass'),firstRoad:value('newFirstRoad'),firstInspection:value('newFirstInspection')};
    const editing=editingPlate!==null;
    const previous=editing?weekly[editingPlate]:null;
    if(editing){cars[cars.findIndex(car=>car.plate===editingPlate)]=updated;for(const record of records)if(record.plate===editingPlate)record.plate=plate;if(editingPlate!==plate)delete weekly[editingPlate];}else cars.push(updated);
    weekly[plate]={km,date:previous?.date||null,maintenance:previous?.maintenance||'unreported',driver:value('newDriver')};
    if(!await persistData())return;$('search').value='';$('vehicleForm').reset();render();$('plate').value=plate;
    $('vehicleMessage').textContent=plate+(editing?' güncellendi.':' listeye eklendi.')+' Bilgiler yerel veritabanına kaydedildi.';
    editingPlate=null;$('addVehiclePanel').querySelector('h2').textContent='Araç bilgilerini girin';$('vehicleForm').querySelector('button[type="submit"]').textContent='Aracı listeye ekle';
    $('addVehiclePanel').hidden=true;
    $('addVehicleButton').setAttribute('aria-expanded','false');
    $('saveStatus').textContent=plate+(editing?' bilgileri güncellendi.':' listeye eklendi.');
    $('vehicles').scrollIntoView({behavior:'smooth',block:'center'});
  });
}
async function updateBackupTime(){if(!$('lastBackup'))return;try{const response=await fetch('/api/backup-time',{cache:'no-store'});if(!response.ok)throw new Error();const data=await response.json();$('lastBackup').textContent=data.lastBackup?new Date(data.lastBackup).toLocaleString('tr-TR',{timeZone:'Europe/Bucharest'}):'Henüz yedek alınmadı';}catch(error){$('lastBackup').textContent='Yedek zamanı okunamadı';}}
if($('exportBackup'))$('exportBackup').addEventListener('click',async()=>{
  if(!isPrivileged())return;
  const blob=new Blob([JSON.stringify({version:1,cars,weekly,records},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='dotek-daks-yedek-'+new Date().toISOString().slice(0,10)+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('backupStatus').textContent='Yedek indirme başlatıldı. Dosyayı saklayın.';
  try{const response=await fetch('/api/backup-time',{method:'POST'});if(!response.ok)throw new Error();await updateBackupTime();}catch(error){$('backupStatus').textContent='Yedek indirme başlatıldı; son yedek zamanı veritabanına yazılamadı.';}
});
if($('importBackup'))$('importBackup').addEventListener('change',async e=>{
  if(!isPrivileged())return;const file=e.target.files[0];if(!file)return;
  try{const data=JSON.parse(await file.text());if(!Array.isArray(data.cars)||!data.weekly||!Array.isArray(data.records)||!data.cars.every(car=>typeof car.plate==='string'&&typeof car.model==='string'&&Number.isInteger(car.year)&&data.weekly[car.plate]&&Number.isFinite(data.weekly[car.plate].km)))throw new Error('Invalid backup');let added=0;for(const car of data.cars){if(cars.some(c=>c.plate.replace(/\s+/g,'').toUpperCase()===car.plate.replace(/\s+/g,'').toUpperCase()))continue;cars.push(car);weekly[car.plate]=data.weekly[car.plate];added++;}for(const record of data.records){if(cars.some(c=>c.plate===record.plate)&&!records.some(r=>JSON.stringify(r)===JSON.stringify(record)))records.push(record);}if(!await persistData())return;render();$('backupStatus').textContent=added+' eksik araç geri yüklendi. Mevcut araçların üzerine yazılmadı.';}catch(error){$('backupStatus').textContent='Dosya geçerli bir DAKS yedeği değil; geri yüklenemedi.';}e.target.value='';
});
if($('fuelForm'))$('fuelForm').addEventListener('submit',async e=>{
 e.preventDefault();if($('role').value!=='driver')return;
 const plate=$('fuelPlate').value;if(!visibleCars().some(car=>car.plate===plate))return;
 const litres=Number($('fuelLitres').value),amount=Number($('fuelAmount').value),km=Number($('fuelKm').value),fuelDate=$('fuelDate').value;
 const today=new Date();today.setHours(0,0,0,0);
 if(!(litres>0&&litres<=2000&&amount>0&&amount<=1000000&&Number.isInteger(km)&&km>=0&&km<=99999999)||!fuelDate||new Date(fuelDate+'T00:00:00')>today){$('fuelMessage').textContent='Miktar, tutar, kilometre ve alım tarihini kontrol edin.';return;}
 const entry={kind:'fuel',plate,litres,amount,km,fuelDate,receiptNo:$('fuelReceipt').value.trim(),unitPrice:$('fuelUnitPrice').value?Number($('fuelUnitPrice').value):null,fullTank:$('fuelFullTank').checked,fuelType:$('fuelType').value,station:$('fuelStation').value.trim(),driver:weekly[plate].driver,author:'driver',date:new Date().toLocaleString('tr-TR')};records.unshift(entry);
 if(!await persistData()){records.splice(records.indexOf(entry),1);$('fuelMessage').textContent='Yakıt alımı kaydedilemedi; formdaki bilgiler korunuyor.';return;}
 $('fuelForm').reset();renderFuel();renderFuelAudit();$('fuelMessage').textContent='Yakıt alımı veritabanına kaydedildi.';
});
loadDatabase();
updateBackupTime();










