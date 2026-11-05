/* Derive document cards from existing records without changing stored data. */
function vehicleDocumentInfo(car, records, today) {
  today ||= (() => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const rows=records.filter(r=>r.kind==='service'&&r.plate===car.plate).slice().sort((a,b)=>(b.svcDate||'').localeCompare(a.svcDate||''));
  const road=rows.find(r=>/seyrüsefer dönemi/i.test(r.note||''));
  const inspection=rows.find(r=>/muayene (dönemi|tarihleri)/i.test(r.note||''));
  const period=r=>(r?.note||'').match(/(?:muayene dönemi|muayene tarihleri|seyrüsefer dönemi):?\s*([\d.]+)\s*[–-]\s*([\d.]+)/i)?.slice(1).map(s=>s.replace(/\.+$/,''))||null;
  const end=road?.note?.match(/ruhsat bitişi:\s*(\d{2}\.\d{2}\.\d{4})/i)?.[1];
  const roadEnd=car.road||(end?end.split('.').reverse().join('-'):'');
  const missing={tone:'missing',label:'Bilgi eksik'};
  const days=date=>Math.round((Date.parse(date+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000);
  function status(date) {
    if(!date)return {...missing};
    const n=days(date);if(!Number.isFinite(n))return {...missing};
    return n<0?{tone:'due',label:'Süresi geçti · kontrol et'}:n<=30?{tone:'due',label:'Kontrol zamanı geldi · '+n+' gün kaldı'}:{tone:'ok',label:'Zamanı gelmedi'};
  }
  const insurance=car.insurance?status(car.insurance):car.insuranceMonth?(car.insuranceMonth<=today.slice(0,7)?{tone:'due',label:'Sigorta ayı geldi / geçti · poliçeyi kontrol et'}:{tone:'ok',label:'Zamanı gelmedi · kesin gün eksik'}):{...missing};
  let inspectionStatus=status(car.inspection);
  const inspectionPeriod=period(inspection);
  if(!car.inspection&&inspection){
    const p=inspectionPeriod?.[1];const iso=p&&p.split('.').reverse().join('-');
    inspectionStatus=iso&&days(iso)<0?{tone:'due',label:'Dönem geçti · muayene sonucunu kontrol et'}:{tone:'missing',label:'Harç ödendi · muayene sonucu eksik'};
  }
  const roadStatus=status(roadEnd);
  const statuses=[roadStatus,insurance,inspectionStatus];
  const group=statuses.some(s=>s.tone==='due')?'due':statuses.some(s=>s.tone==='missing')?'missing':'ok';
  return {road,inspection,roadPeriod:period(road),inspectionPeriod,roadEnd,roadStatus,insuranceStatus:insurance,inspectionStatus,group};
}
