(function () {
  function injectStylesIfNeeded() {
    if (document.getElementById('rastreo-inline-styles')) return;
    const css = `
      /* Estilos específicos para los botones generados por rastreo.js */
      .rastreo-btn {
        padding: 8px 12px;
        border-radius: 6px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        font-family: inherit;
        font-size: 0.95rem;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      }
      .rastreo-btn.primary {
        background: #0f172a;
        color: #ffffff;
      }
      .rastreo-btn.secondary {
        background: #f1f5f9;
        color: #0f172a;
        border: 1px solid rgba(0,0,0,0.06);
      }
      .rastreo-btn.ghost {
        background: transparent;
        color: #0f172a;
        border: 1px solid rgba(255,255,255,0.06);
      }
      #resultado input, #resultado select {
        margin-top:6px;
        margin-bottom:6px;
        padding:8px;
        border-radius:6px;
        border:1px solid #ddd;
        width:100%;
        box-sizing:border-box;
      }
      #resultado h3 { margin:0 0 8px 0; }
    `;
    const st = document.createElement('style');
    st.id = 'rastreo-inline-styles';
    st.appendChild(document.createTextNode(css));
    document.head.appendChild(st);
  }

  injectStylesIfNeeded();

  const STEP_TITLES = ['Order Placed', 'Processing', 'Shipping'];
  const ALL_STATUSES = ['Order Placed', 'Processing', 'Shipping', 'Delivered'];

  const STORAGE_KEY = 'rastreo_db_v1';

  const SAMPLE_DB = {
    'ABC123': {
      code: 'ABC123',
      readableLocation: 'Centro de distribución Exoire S.A.S',
      updatedAt: '2025-09-18 10:24',
      status: 'Processing',
      timeline: [
        { title: 'Order Placed', time: '2025-09-17 09:20', note: 'Orden creada' },
        { title: 'Processing', time: '2025-09-18 10:24', note: 'En revisión' },
        { title: 'Shipping', time: '2025-09-19 08:00', note: 'En camino' }
      ]
    },
    'XYZ789': {
      code: 'XYZ789',
      readableLocation: 'Sucursal Turbo',
      updatedAt: '2025-09-18 16:00',
      status: 'Delivered',
      timeline: [
        { title: 'Order Placed', time: '2025-09-16 11:10' },
        { title: 'Processing', time: '2025-09-17 13:00' },
        { title: 'Shipping', time: '2025-09-18 09:00' },
        { title: 'Delivered', time: '2025-09-18 16:00' }
      ]
    },
    'LMN456': {
      code: 'LMN456',
      readableLocation: 'Almacén principal',
      updatedAt: '2025-09-18 09:00',
      status: 'Order Placed',
      timeline: [
        { title: 'Order Placed', time: '2025-09-18 09:00' }
      ]
    }
  };

  function loadDB() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DB));
        return Object.assign({}, SAMPLE_DB);
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error cargando DB de rastreo:', e);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DB));
      return Object.assign({}, SAMPLE_DB);
    }
  }

  function saveDB(db) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Error guardando DB de rastreo:', e);
    }
  }

  let DB = loadDB();
  let currentCode = null;

  const form = document.getElementById('rastreoForm');
  const inputCodigo = document.getElementById('codigo');
  const resultadoDiv = document.getElementById('resultado');
  const stepperSteps = Array.from(document.querySelectorAll('.stepper-step'));
  const btnPrev = document.querySelector('.stepper-controls .stepper-button');
  const btnNext = document.querySelector('.stepper-controls .stepper-button-primary');

  function renderResult(card) {
    if (!card) {
      resultadoDiv.style.display = 'none';
      currentCode = null;
      return;
    }

    currentCode = card.code;
    resultadoDiv.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <div><strong>Código:</strong> ${escapeHtml(card.code)}</div>
        <div><strong>Estado actual:</strong> ${escapeHtml(card.status)}</div>
        <div><strong>Ubicación actual:</strong> ${escapeHtml(card.readableLocation || '-')}</div>
        <div><strong>Última actualización:</strong> ${escapeHtml(card.updatedAt || '-')}</div>
      </div>
      <hr style="margin:10px 0;">
      <div id="timelineContainer"></div>
      <div style="margin-top:12px; display:flex; gap:8px;">
        <button id="btnCreateUpdate" class="rastreo-btn primary" style="display:none;">Editar seguimiento</button>
        <button id="btnShowOnMap" class="rastreo-btn secondary">Ver ubicación (abrir)</button>
      </div>
    `;
    resultadoDiv.style.display = 'block';

    const timelineContainer = document.getElementById('timelineContainer');
    timelineContainer.innerHTML = '';
    if (Array.isArray(card.timeline) && card.timeline.length) {
      for (let i = 0; i < card.timeline.length; i++) {
        const t = card.timeline[i];
        const item = document.createElement('div');
        item.style.padding = '6px 0';
        item.innerHTML = `<strong>${escapeHtml(t.title)}</strong> — ${escapeHtml(t.time || '')} ${t.note ? `<div style="color:#555">${escapeHtml(t.note)}</div>` : ''}`;
        timelineContainer.appendChild(item);
      }
    } else {
      timelineContainer.textContent = 'Sin historial disponible.';
    }

    const btnEdit = document.getElementById('btnCreateUpdate');
    if (btnEdit) {
      btnEdit.style.display = 'none';
      btnEdit.addEventListener('click', function () {
        openEditForm(card.code);
      });
    }

    const btnMap = document.getElementById('btnShowOnMap');
    if (btnMap) {
      btnMap.addEventListener('click', function () {
        if (card.readableLocation) {
          const q = encodeURIComponent(card.readableLocation);
          window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
        } else {
          alert('No hay ubicación disponible para este seguimiento.');
        }
      });
    }

    updateStepperForCode(card);
  }

  function statusToIndex(status) {
    const idx = ALL_STATUSES.indexOf(status);
    return idx >= 0 ? idx : 0;
  }

  function updateStepperForCode(card) {
    if (!card) {
      stepperSteps.forEach(s => {
        s.classList.remove('stepper-completed', 'stepper-active', 'stepper-pending');
        s.classList.add('stepper-pending');
      });
      return;
    }

    const idx = statusToIndex(card.status);
    if (idx >= stepperSteps.length) {
      stepperSteps.forEach((el, i) => {
        el.classList.remove('stepper-active', 'stepper-pending');
        el.classList.add('stepper-completed');
        const t = (card.timeline && card.timeline[i]) ? card.timeline[i] : null;
        updateStepperContent(el, t);
      });
      showDeliveredBadge(card);
      return;
    }

    removeDeliveredBadge();

    stepperSteps.forEach((el, i) => {
      el.classList.remove('stepper-completed', 'stepper-active', 'stepper-pending');
      if (i < idx) {
        el.classList.add('stepper-completed');
      } else if (i === idx) {
        el.classList.add('stepper-active');
      } else {
        el.classList.add('stepper-pending');
      }
      const t = (card.timeline && card.timeline[i]) ? card.timeline[i] : null;
      updateStepperContent(el, t);
    });
  }

  function updateStepperContent(stepEl, timelineEntry) {
    try {
      const titleEl = stepEl.querySelector('.stepper-title');
      const statusEl = stepEl.querySelector('.stepper-status');
      const timeEl = stepEl.querySelector('.stepper-time');
      if (timelineEntry) {
        if (titleEl) titleEl.textContent = timelineEntry.title || titleEl.textContent;
        if (statusEl) statusEl.textContent = timelineEntry.note || (statusEl.textContent || '');
        if (timeEl) timeEl.textContent = timelineEntry.time || timeEl.textContent || '';
      } else {
        if (timeEl) timeEl.textContent = timeEl.datasetOriginal || timeEl.textContent || '';
      }
    } catch (e) {
    }
  }

  function showDeliveredBadge(card) {
    const stepperBox = document.querySelector('.stepper-box');
    if (!stepperBox) return;
    if (stepperBox.querySelector('.delivered-badge')) return;
    const badge = document.createElement('div');
    badge.className = 'delivered-badge';
    badge.style.cssText = 'background:#1f7a1f;color:#fff;padding:8px 12px;border-radius:8px;margin-bottom:10px;font-weight:700;text-align:center;';
    const deliveredTime = (card.timeline && card.timeline.find(t => /deliver/i.test(t.title))) ? (card.timeline.find(t => /deliver/i.test(t.title)).time) : (card.updatedAt || '');
    badge.textContent = `Entregado • ${deliveredTime}`;
    stepperBox.insertBefore(badge, stepperBox.firstChild);
  }

  function removeDeliveredBadge() {
    const stepperBox = document.querySelector('.stepper-box');
    if (!stepperBox) return;
    const existing = stepperBox.querySelector('.delivered-badge');
    if (existing) existing.remove();
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const raw = inputCodigo.value || '';
      const code = raw.trim().toUpperCase();
      if (!code) {
        showMessage('Ingrese un código válido.', true);
        return;
      }
      searchAndRender(code);
    });
  }

  function showMessage(msg, isError) {
    resultadoDiv.style.display = 'block';
    resultadoDiv.innerHTML = `<div style="padding:8px;background:${isError ? '#ffe6e6' : '#eafaf1'};border-radius:6px;color:${isError ? '#8b0000' : '#064e3b'}">${escapeHtml(msg)}</div>`;
  }

  function searchAndRender(code) {
    const rec = DB[code];
    if (rec) {
      renderResult(rec);
    } else {
      resultadoDiv.style.display = 'block';
      resultadoDiv.innerHTML = `
        <div style="padding:8px;background:#fff3cd;border-radius:6px;color:#664d03;">
          No se encontró información para el código <strong>${escapeHtml(code)}</strong>.
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button id="btnCreateNew" class="rastreo-btn primary">Crear seguimiento</button>
          <button id="btnTryAgain" class="rastreo-btn secondary">Volver</button>
        </div>
      `;
      document.getElementById('btnCreateNew').addEventListener('click', function () {
        openCreateForm(code);
      });
      document.getElementById('btnTryAgain').addEventListener('click', function () {
        resultadoDiv.style.display = 'none';
      });
    }
  }

  function openCreateForm(codePrefill) {
    resultadoDiv.innerHTML = `
      <div style="background:#fff;padding:12px;border-radius:8px;">
        <h3>Crear seguimiento</h3>
        <label style="display:block;margin-top:8px;">Código</label>
        <input id="new_code" value="${escapeHtml(codePrefill || '')}" style="width:100%;padding:8px;" />
        <label style="display:block;margin-top:8px;">Ubicación inicial</label>
        <input id="new_loc" placeholder="Ej: Centro de distribución" style="width:100%;padding:8px;" />
        <label style="display:block;margin-top:8px;">Estado inicial</label>
        <select id="new_status" style="width:100%;padding:8px;">
          <option value="Order Placed">Order Placed</option>
          <option value="Processing">Processing</option>
          <option value="Shipping">Shipping</option>
          <option value="Delivered">Delivered</option>
        </select>
        <div style="margin-top:10px;display:flex;gap:8px;">
          <button id="btnSaveNew" class="rastreo-btn primary">Guardar</button>
          <button id="btnCancelNew" class="rastreo-btn secondary">Cancelar</button>
        </div>
      </div>
    `;

    document.getElementById('btnCancelNew').addEventListener('click', function () {
      resultadoDiv.style.display = 'none';
    });

    document.getElementById('btnSaveNew').addEventListener('click', function () {
      const code = (document.getElementById('new_code').value || '').trim().toUpperCase();
      const loc = (document.getElementById('new_loc').value || '').trim() || 'Sin ubicación';
      const status = document.getElementById('new_status').value || 'Order Placed';
      if (!code) {
        alert('Ingresa un código válido.');
        return;
      }
      const now = new Date();
      const formatted = formatDateTime(now);
      const timeline = [{ title: 'Order Placed', time: formatted }];
      if (status === 'Processing') timeline.push({ title: 'Processing', time: formatted });
      if (status === 'Shipping') timeline.push({ title: 'Processing', time: formatted }, { title: 'Shipping', time: formatted });
      if (status === 'Delivered') timeline.push({ title: 'Processing', time: formatted }, { title: 'Shipping', time: formatted }, { title: 'Delivered', time: formatted });

      const rec = {
        code,
        readableLocation: loc,
        updatedAt: formatted,
        status,
        timeline
      };
      DB[code] = rec;
      saveDB(DB);
      renderResult(rec);
    });
  }

  function openEditForm(code) {
    alert('Funcionalidad de edición no implementada en esta demo. Puedes crear un nuevo seguimiento si lo deseas.');
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', function () {
      if (!currentCode) {
        showMessage('Primero busca un código para poder avanzar/retroceder su estado.', true);
        return;
      }
      const rec = DB[currentCode];
      if (!rec) return;
      let idx = statusToIndex(rec.status);
      idx = Math.max(0, idx - 1);
      rec.status = ALL_STATUSES[idx] || ALL_STATUSES[ALL_STATUSES.length - 1];
      const now = formatDateTime(new Date());
      rec.timeline = rec.timeline || [];
      if (!rec.timeline.find(t => t.title === rec.status)) rec.timeline.push({ title: rec.status, time: now });
      rec.updatedAt = now;
      DB[currentCode] = rec;
      saveDB(DB);
      renderResult(rec);
    });
  }

  if (btnNext) {
    btnNext.addEventListener('click', function () {
      if (!currentCode) {
        showMessage('Primero busca un código para poder avanzar/retroceder su estado.', true);
        return;
      }
      const rec = DB[currentCode];
      if (!rec) return;
      let idx = statusToIndex(rec.status);
      idx = Math.min(ALL_STATUSES.length - 1, idx + 1);
      rec.status = ALL_STATUSES[idx] || ALL_STATUSES[ALL_STATUSES.length - 1];
      const now = formatDateTime(new Date());
      rec.timeline = rec.timeline || [];
      if (!rec.timeline.find(t => t.title === rec.status)) rec.timeline.push({ title: rec.status, time: now });
      rec.updatedAt = now;
      DB[currentCode] = rec;
      saveDB(DB);
      renderResult(rec);
    });
  }

  function formatDateTime(d) {
    const pad = n => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }

  window.addEventListener('load', function () {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      const c = codeParam.trim().toUpperCase();
      inputCodigo.value = c;
      searchAndRender(c);
      return;
    }
    resultadoDiv.style.display = 'none';
  });

})();
