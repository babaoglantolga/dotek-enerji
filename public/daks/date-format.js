/* Explicit Turkish date entry, independent of the browser's language. */
(() => {
  const valueProperty = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  const bound = new WeakSet();
  function bind(input) {
    if (bound.has(input) || !['date', 'month'].includes(input.type)) return;
    bound.add(input);
    const monthOnly = input.type === 'month';
    const display = document.createElement('input');
    display.type = 'text';
    display.id = input.id + 'Display';
    display.inputMode = 'numeric';
    display.required = input.required;
    display.disabled = input.disabled;
    display.placeholder = monthOnly ? 'AA.YYYY' : 'GG.AA.YYYY';
    display.maxLength = monthOnly ? 7 : 10;
    display.pattern = monthOnly ? '[0-9]{2}[.][0-9]{4}' : '[0-9]{2}[.][0-9]{2}[.][0-9]{4}';
    const label = input.id && document.querySelector(`label[for="${input.id}"]`);
    if (label) {
      label.htmlFor = display.id;
      display.setAttribute('aria-label', label.textContent.replace(/\s*\*$/, '') + (monthOnly ? ', ay yıl' : ', gün ay yıl'));
    }
    function update() {
      display.value = valueProperty.get.call(input).split('-').reverse().join('.');
      display.setCustomValidity('');
    }
    input.type = 'hidden';
    input.required = false;
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() { return valueProperty.get.call(this); },
      set(value) { valueProperty.set.call(this, value); update(); }
    });
    input.after(display);
    update();
    display.addEventListener('input', () => {
      const parts = display.value.split('.');
      let iso = '';
      if (monthOnly && /^\d{2}\.\d{4}$/.test(display.value)) {
        if (+parts[0] >= 1 && +parts[0] <= 12 && +parts[1] >= 1) iso = parts[1] + '-' + parts[0];
      } else if (!monthOnly && /^\d{2}\.\d{2}\.\d{4}$/.test(display.value)) {
        const [day, month, year] = parts;
        const candidate = `${year}-${month}-${day}`;
        const date = new Date(candidate + 'T00:00:00');
        if (date.getFullYear() === +year && date.getMonth() + 1 === +month && date.getDate() === +day) iso = candidate;
      }
      valueProperty.set.call(input, iso);
      display.setCustomValidity(display.value && !iso ? (monthOnly ? 'Ay.yıl şeklinde girin. Örnek: 11.2026' : 'Gün.ay.yıl şeklinde geçerli bir tarih girin. Örnek: 05.11.2026') : '');
    });
    display.addEventListener('change', () => { input.dispatchEvent(new Event('change', { bubbles: true })); });
    if (input.form) input.form.addEventListener('reset', () => queueMicrotask(update));
  }
  function scan() { document.querySelectorAll('input[type="date"],input[type="month"]').forEach(bind); }
  scan();
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
})();
