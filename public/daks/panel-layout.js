/* Navigation changes presentation only; existing forms, roles and storage remain in charge. */
(() => {
  const nav = document.getElementById('workspaceNav');
  if (!nav) return;
  const role = document.getElementById('role');
  const sections = [...document.querySelectorAll('[data-workspace]')];
  const labels = {
    vehicles: ['Araç bilgileri', 'Araç listesi, belgeler ve güncel kilometre bilgileri.'],
    fuel: ['Yakıt kayıtları', 'Aylık yakıt özeti, alım kayıtları ve fiş / kart eşleştirmesi.'],
    service: ['Servis ve giderler', 'Bakım, tamir, sigorta ve araç envanteri.'],
    checks: ['Kontroller', 'Haftalık takip, seyrüsefer ve muayene işlemleri.'],
    weekly: ['Haftalık bildirimler', 'Kilometre ve bakım bildirimlerini inceleyin.'],
    backup: ['Yedekleme', 'Dosya yedeği alın ve son yedek zamanını görün.']
  };
  let active = 'vehicles';
  let previousRole;
  function show(key, focus = false) {
    active = key;
    for (const section of sections) section.classList.toggle('workspace-inactive', section.dataset.workspace !== key);
    for (const button of nav.children) {
      if (button.dataset.view === key) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    }
    const driver = role.value === 'driver';
    document.getElementById('workspaceTitle').textContent = driver && key === 'fuel' ? 'Yakıt girişi' : labels[key][0];
    document.getElementById('workspaceDescription').textContent = driver && key === 'weekly' ? 'Aracınızı seçin, kilometre ve bakım kontrolünü kaydedin.' : labels[key][1];
    if (focus) document.getElementById('workspaceTitle').focus({ preventScroll: true });
  }
  function refresh() {
    const driver = role.value === 'driver';
    const allowed = driver ? ['weekly', 'fuel', 'vehicles'] : ['vehicles', 'fuel', 'service', 'checks', 'weekly', ...(['admin', 'office'].includes(role.value) ? ['backup'] : [])];
    nav.replaceChildren();
    for (const key of allowed) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.view = key;
      button.textContent = driver && key === 'fuel' ? 'Yakıt girişi' : key === 'vehicles' ? 'Araçlar' : labels[key][0];
      button.addEventListener('click', () => show(key, true));
      nav.append(button);
    }
    if (!allowed.includes(active) || (driver && previousRole !== role.value)) active = allowed[0];
    previousRole = role.value;
    show(active);
  }
  // The service cards can also open the existing vehicle editor.
  const editor = document.getElementById('addVehiclePanel');
  new MutationObserver(() => { if (!editor.hidden && active !== 'vehicles') show('vehicles'); }).observe(editor, { attributes: true, attributeFilter: ['hidden'] });
  function updateCount() {
    document.getElementById('workspaceCount').textContent = (document.getElementById('carCount').textContent || '0') + ' araç';
  }
  new MutationObserver(updateCount).observe(document.getElementById('carCount'), { childList: true, characterData: true, subtree: true });
  document.getElementById('workspaceTitle').tabIndex = -1;
  role.addEventListener('change', refresh);
  // Keep the monthly overview compact; calculations remain available on demand.
  function compactMonthlyCards() {
    for (const card of document.querySelectorAll('#monthlyRows .monthly-car-card')) {
      if (card.querySelector('.consumption-details')) continue;
      const extra = [...card.children].filter(el => el.matches('.monthly-metric,small,.consumption-status')).slice(3);
      if (!extra.length) continue;
      const details = document.createElement('details');
      details.className = 'consumption-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Tüketim ve kontrol ayrıntıları';
      details.append(summary, ...extra);
      card.append(details);
    }
  }
  new MutationObserver(compactMonthlyCards).observe(document.getElementById('monthlyRows'), { childList: true });
  compactMonthlyCards();
  refresh();
  updateCount();
})();
