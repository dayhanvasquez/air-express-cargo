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
    box.innerHTML = `<strong>Guía ${n.replace(/[<>&"]/g, '')}</strong><br>El seguimiento en línea estará disponible pronto. Mientras tanto, escríbenos a <a href="mailto:${CONTACT_EMAIL}?subject=Seguimiento%20${encodeURIComponent(n)}" style="color:#005BAA;font-weight:600">${CONTACT_EMAIL}</a> y te informamos el estado.`;
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
// VALORES FICTICIOS DE PRUEBA: reemplazar por la tabla real de tarifas.
const SERVICES = [
  { id: 'terrestre', name: 'Envío terrestre', badge: 'Más económico', base: 6000, perKg: 450,
    time: '4 a 5 días hábiles', detail: 'Salida todos los viernes. La opción más barata cuando no hay apuro.', maxKg: null },
  { id: 'prime', name: 'Aéreo Prime', badge: null, base: 12000, perKg: 1400,
    time: '24 a 48 horas', detail: 'Por avión, desde el retiro de tu carga.', maxKg: 110 },
  { id: 'overnight', name: 'Aéreo Overnight', badge: 'Más rápido', base: 16000, perKg: 1900,
    time: 'Menos de 24 horas', detail: 'Llega al día siguiente. Bultos de hasta 25 kg.', maxKg: 25 },
];
// Factor ficticio por ciudad (lejanía / acceso)
const CITY_FACTOR = { 'Santiago': 1, 'Punta Arenas': 1, 'Puerto Natales': 1.15, 'Porvenir': 1.2, 'Puerto Williams': 1.45, 'Coyhaique': 0.9 };
const clp = n => '$' + (Math.round(n / 10) * 10).toLocaleString('es-CL');

const calcForm = $('#calcForm');
if (calcForm) {
  const num = id => parseFloat(($(id).value || '').replace(',', '.'));
  function calculate() {
    const origen = $('#qOrigen').value, destino = $('#qDestino').value;
    const alto = num('#qAlto'), largo = num('#qLargo'), ancho = num('#qAncho'), peso = num('#qPeso');
    const err = $('#calcError');
    let msg = '';
    if (origen === destino) msg = 'El origen y el destino deben ser distintos.';
    else if (![alto, largo, ancho, peso].every(v => v > 0)) msg = 'Ingresa alto, largo, ancho y peso mayores a cero.';
    err.textContent = msg; err.classList.toggle('show', !!msg);
    if (msg) { showResults(false); return false; }
    $('#ratesSub').textContent = `${origen} → ${destino}`;

    const volKg = (alto * largo * ancho) / 6000;
    const kg = Math.max(peso, volKg);
    const factor = Math.max(CITY_FACTOR[origen], CITY_FACTOR[destino]);
    const maxSide = Math.max(alto, largo, ancho);

    $('#rates').innerHTML = SERVICES.map(s => {
      let blocked = '';
      if (s.maxKg && peso > s.maxKg) blocked = `Disponible para bultos de hasta ${s.maxKg} kg.`;
      else if (s.id !== 'terrestre' && maxSide > 100) blocked = 'Por avión, ningún lado puede superar 1 metro.';
      const price = (s.base + kg * s.perKg) * factor;
      const subject = encodeURIComponent(`Solicitud ${s.name}: ${origen} → ${destino}`);
      const body = encodeURIComponent(`Servicio: ${s.name}\nRuta: ${origen} → ${destino}\nMedidas: ${alto} x ${largo} x ${ancho} cm\nPeso: ${peso} kg\nTarifa referencial: ${clp(price)}\n\nNombre:\nEmpresa:\nTeléfono:\nDirección de retiro:`);
      return `<article class="rate rate-${s.id}${blocked ? ' rate-off' : ''}">
        ${s.badge ? `<span class="rate-badge">${s.badge}</span>` : ''}
        <h3>${s.name}</h3>
        <p class="rate-time">${s.time}</p>
        ${blocked ? `<p class="rate-price rate-na">No disponible</p><p class="rate-detail">${blocked}</p>`
          : `<p class="rate-price">${clp(price)}</p><p class="rate-detail">${s.detail}</p>
             <a class="btn btn-primary rate-btn" href="mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}">Solicitar</a>`}
      </article>`;
    }).join('');
    $('#rates').insertAdjacentHTML('beforeend', `<p class="rate-kg">Peso cobrado: <strong>${kg.toLocaleString('es-CL', { maximumFractionDigits: 1 })} kg</strong>${volKg > peso ? ' (volumétrico)' : ''}</p>`);
    return true;
  }
  const results = $('#results');
  const submitBtn = $('.calc-btn', calcForm);
  function showResults(on) {
    results.hidden = !on;
    $('.calc-layout').classList.toggle('has-results', on);
    submitBtn.textContent = on ? 'Volver a cotizar' : 'Cotizar';
  }
  calcForm.addEventListener('submit', e => {
    e.preventDefault();
    if (calculate()) {
      showResults(true);
      // En pantallas angostas las tarifas quedan debajo: bajamos hasta ellas
      if (window.innerWidth <= 980) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}
