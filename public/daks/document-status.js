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
    return n<0?{tone:'due',label:Math.abs(n)+' gün gecikti · kontrol et'}:n===0?{tone:'due',label:'BUGÜN SON GÜN'}:{tone:'ok',label:'Zamanı gelmedi'};
  }
  let inspectionStatus=status(car.inspection);
  const inspectionPeriod=period(inspection)||period({note:car.inspectionCheckNote});
  if(!car.inspection&&inspection){
    inspectionStatus={tone:'missing',label:'Harç ödendi · sonuç doğrulanmadı'};
  }
  if(!car.inspection&&car.officialCheckDate&&car.officialInspectionFee==='none')inspectionStatus={tone:'missing',label:'Harç borcu yok · sonuç doğrulanmadı'};
  if(car.officialCheckDate&&car.officialInspectionFee==='debt')inspectionStatus={tone:'due',label:'MUAYENE BORCU VAR · kontrol et'};
  const inspectionOutstanding=(car.inspectionCheckNote||'').match(/Ödenecek (?:cezalı )?muayene harcı:\s*([\d.,]+)\s*TL/i)?.[1]||null;
  const roadPaymentBlocked=/online seyrüsefer ödemesi engelleniyor/i.test(car.inspectionCheckNote||'');
  const roadStatus=status(roadEnd);
  const statuses=[roadStatus,inspectionStatus];
  const group=statuses.some(s=>s.tone==='due')?'due':statuses.some(s=>s.tone==='missing')?'missing':'ok';
  return {inspectionOutstanding,roadPaymentBlocked,road,inspection,roadPeriod:period(road),inspectionPeriod,roadEnd,roadStatus,inspectionStatus,group};
}
