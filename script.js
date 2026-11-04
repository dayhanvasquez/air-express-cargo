// Air Express Cargo — interacciones del sitio
const CONTACT_EMAIL = 'contacto@airexpresscargo.cl';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Año del footer
$$('#year').forEach(el => (el.textContent = new Date().getFullYear()));

// Menú móvil
const menuBtn = $('#menuBtn');
if (menuBtn) menuBtn.addEventListener('click', () => $('#nav').classList.toggle('open'));
$$('#nav a').forEach(a => a.addEventListener('click', () => $('#nav').classList.remove('open')));

// Pestañas del hero
function openTab(name) {
  $$('.tab').forEach(t => {
    const on = t.dataset.tab === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', on);
  });
  $$('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + name));
}
$$('.tab').forEach(t => t.addEventListener('click', () => openTab(t.dataset.tab)));
$$('[data-open-tab]').forEach(a => a.addEventListener('click', () => openTab(a.dataset.openTab)));

// Rastreo (sin backend: deriva al ejecutivo)
const trackForm = $('#trackForm');
if (trackForm) {
  trackForm.addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#trackNum').value.trim();
    const box = $('#trackResult');
    box.innerHTML = `<strong>Guía ${n.replace(/[<>&"]/g, '')}</strong><br>El seguimiento en línea estará disponible pronto. Mientras tanto, escríbenos a <a href="mailto:${CONTACT_EMAIL}?subject=Seguimiento%20${encodeURIComponent(n)}" style="color:#1d6fd8;font-weight:600">${CONTACT_EMAIL}</a> y te informamos el estado.`;
    box.classList.add('show');
  });
}

// Contacto
const contactForm = $('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const body = `Nombre: ${$('#cName').value}\nEmpresa: ${$('#cCompany').value}\nCorreo: ${$('#cEmail').value}\nTeléfono: ${$('#cPhone').value}\n\n${$('#cMsg').value}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Contacto web - ' + $('#cName').value)}&body=${encodeURIComponent(body)}`;
    $('#contactOk').style.display = 'block';
  });
}

// ---------- Cotizador ----------
const quoteForm = $('#quoteForm');
if (quoteForm) {
  let step = 1;
  const total = 3;
  const steps = $$('.form-step', quoteForm);
  const prevBtn = $('#prevBtn');
  const nextBtn = $('#nextBtn');

  function rowTemplate(type) {
    const row = document.createElement('div');
    row.className = 'pkg-row';
    row.dataset.type = type;
    const ph = type === 'pallet' ? ['120', '100', '150'] : ['50', '40', '30'];
    row.innerHTML = `
      <div class="field"><input type="number" min="1" value="1" aria-label="Cantidad" data-k="q"></div>
      <div class="field"><input type="number" min="0" placeholder="${ph[0]}" aria-label="Largo cm" data-k="l"></div>
      <div class="field"><input type="number" min="0" placeholder="${ph[1]}" aria-label="Ancho cm" data-k="w"></div>
      <div class="field"><input type="number" min="0" placeholder="${ph[2]}" aria-label="Alto cm" data-k="h"></div>
      <div class="field"><input type="number" min="0" step="0.1" placeholder="kg" aria-label="Peso kg" data-k="kg"></div>
      <button type="button" class="icon-btn" aria-label="Eliminar fila">×</button>`;
    $('.icon-btn', row).addEventListener('click', () => { row.remove(); updateSummary(); });
    return row;
  }
  $('#addPkg').addEventListener('click', () => { $('#pkgList').append(rowTemplate('bulto')); });
  $('#addPallet').addEventListener('click', () => { $('#palletList').append(rowTemplate('pallet')); });
  $('#detailToggle').addEventListener('change', e => {
    $('#detailBox').classList.toggle('show', e.target.checked);
    if (e.target.checked && !$('#pkgList').children.length && !$('#palletList').children.length) {
      $('#pkgList').append(rowTemplate('bulto'));
    }
    updateSummary();
  });

  function readRows() {
    return $$('.pkg-row', quoteForm).map(r => {
      const g = k => parseFloat($(`[data-k="${k}"]`, r).value) || 0;
      return { type: r.dataset.type, q: g('q'), l: g('l'), w: g('w'), h: g('h'), kg: g('kg') };
    }).filter(r => r.q > 0 && (r.l || r.w || r.h || r.kg));
  }

  function updateSummary() {
    const v = n => (quoteForm.elements[n] ? quoteForm.elements[n].value.trim() : '');
    $('#s-op').textContent = quoteForm.elements.operacion.value;
    $('#s-mod').textContent = quoteForm.elements.modalidad.value;
    $('#s-ruta').textContent = v('origen') || v('destino') ? `${v('origen') || '?'} → ${v('destino') || '?'}` : '—';
    $('#s-merc').textContent = v('mercancia') || '—';

    const detailed = $('#detailToggle').checked;
    const rows = detailed ? readRows() : [];
    let units = 0, vol = 0, kg = 0, pallets = 0, bultos = 0;
    rows.forEach(r => {
      units += r.q;
      r.type === 'pallet' ? (pallets += r.q) : (bultos += r.q);
      vol += r.q * (r.l * r.w * r.h) / 1e6;
      kg += r.q * r.kg;
    });
    if (rows.length) {
      const parts = [];
      if (bultos) parts.push(`${bultos} bulto${bultos > 1 ? 's' : ''}`);
      if (pallets) parts.push(`${pallets} pallet${pallets > 1 ? 's' : ''}`);
      $('#s-bultos').textContent = parts.join(' + ');
    } else {
      $('#s-bultos').textContent = v('cantBultos') || '—';
    }
    const peso = kg > 0 ? kg : parseFloat(v('pesoTotal'));
    $('#s-peso').textContent = peso ? `${peso.toLocaleString('es-CL')} kg` : '—';
    $('#s-vol').textContent = vol > 0 ? `${vol.toLocaleString('es-CL', { maximumFractionDigits: 2 })} m³` : '—';
  }
  quoteForm.addEventListener('input', updateSummary);
  quoteForm.addEventListener('change', updateSummary);

  function validate(n) {
    const err = $(`[data-error="${n}"]`);
    let ok = true;
    if (n === 1) ok = quoteForm.elements.origen.value.trim() && quoteForm.elements.destino.value.trim();
    if (n === 2) ok = quoteForm.elements.mercancia.value.trim() && parseFloat(quoteForm.elements.pesoTotal.value) > 0;
    if (n === 3) ok = quoteForm.elements.empresa.value.trim() && quoteForm.elements.nombre.value.trim() && /\S+@\S+\.\S+/.test(quoteForm.elements.email.value);
    if (err) err.classList.toggle('show', !ok);
    return !!ok;
  }

  function render() {
    steps.forEach(s => s.classList.toggle('active', +s.dataset.step === step));
    $$('.progress-step').forEach((p, i) => {
      p.classList.toggle('done', i + 1 < step);
      p.classList.toggle('current', i + 1 === step);
    });
    prevBtn.style.visibility = step > 1 && step <= total ? 'visible' : 'hidden';
    nextBtn.textContent = step === total ? 'Enviar solicitud' : 'Continuar →';
    $('#formNav').style.display = step > total ? 'none' : 'flex';
    window.scrollTo({ top: quoteForm.getBoundingClientRect().top + window.scrollY - 160, behavior: 'smooth' });
  }

  function buildEmail() {
    const f = quoteForm.elements;
    const lines = [
      'SOLICITUD DE COTIZACIÓN',
      '',
      `Operación: ${f.operacion.value}`,
      `Modalidad: ${f.modalidad.value}`,
      `Origen: ${f.origen.value}`,
      `Destino: ${f.destino.value}`,
      `Fecha estimada: ${f.fecha.value || 'No indicada'}`,
      '',
      `Mercancía: ${f.mercancia.value}`,
      `Peso total aprox.: ${f.pesoTotal.value} kg`,
      `Cantidad bultos/pallets: ${f.cantBultos.value || 'No indicada'}`,
    ];
    if ($('#detailToggle').checked) {
      const rows = readRows();
      if (rows.length) {
        lines.push('', 'DETALLE DE MEDIDAS');
        rows.forEach(r => lines.push(`- ${r.q} ${r.type}(s): ${r.l}x${r.w}x${r.h} cm, ${r.kg} kg c/u`));
        lines.push(`Volumen total: ${$('#s-vol').textContent}`);
      }
      if (f.obs.value.trim()) lines.push('', `Observaciones: ${f.obs.value}`);
    }
    lines.push('', 'CONTACTO',
      `Empresa: ${f.empresa.value}`, `RUT: ${f.rut.value}`,
      `Nombre: ${f.nombre.value}`, `Cargo: ${f.cargo.value}`,
      `Correo: ${f.email.value}`, `Teléfono: ${f.telefono.value}`);
    return lines.join('\n');
  }

  nextBtn.addEventListener('click', () => {
    if (!validate(step)) return;
    if (step === total) {
      const subject = `Cotización ${quoteForm.elements.modalidad.value} - ${quoteForm.elements.empresa.value}`;
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildEmail())}`;
    }
    step++;
    render();
  });
  prevBtn.addEventListener('click', () => { if (step > 1) { step--; render(); } });

  updateSummary();
}
