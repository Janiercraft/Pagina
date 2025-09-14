(() => {
  'use strict';

  const CONFIG = {
    locale: 'es-CO',
    currency: 'COP',
    rates: {
      terrestre: { base: 15000, perKg: 1200 },
      aereo:    { base: 40000, perKg: 8000 },
      maritimo: { base: 20000, perKg: 600 }
    },
    distanceMultipliers: {
      local: 1.0,        
      regional: 1.25,    
      nacional: 1.6,    
      internacional: 2.0
    },
    maxSavedQuotes: 5
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const formatMoney = (n) => new Intl.NumberFormat(CONFIG.locale, {
    style: 'currency',
    currency: CONFIG.currency,
    maximumFractionDigits: 0
  }).format(Math.round(n));

  function saveQuote(quote) {
    try {
      const key = 'presupuestos_exoire';
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(quote);
      const truncated = arr.slice(0, CONFIG.maxSavedQuotes);
      localStorage.setItem(key, JSON.stringify(truncated));
    } catch (e) {
      console.warn('No se pudo guardar cotización:', e);
    }
  }

  function loadQuotes() {
    try {
      const raw = localStorage.getItem('presupuestos_exoire');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function renderSavedQuotes(container) {
    const arr = loadQuotes();
    if (!container) return;
    container.innerHTML = '';
    if (arr.length === 0) {
      container.innerHTML = '<p class="no-history">No hay cotizaciones recientes.</p>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'history-list';
    arr.forEach((q) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
        <div class="history-meta">
          <strong>${q.modalidad.toUpperCase()}</strong> — ${q.origen} → ${q.destino} • ${q.pesoKg} kg
          <div class="history-time">${new Date(q.timestamp).toLocaleString(CONFIG.locale)}</div>
        </div>
        <div class="history-price">Estimado: ${formatMoney(q.estimatedNational)}</div>
      `;
      list.appendChild(item);
    });
    container.appendChild(list);
  }

  function calculateBaseCost(modality, pesoKg) {
    const cfg = CONFIG.rates[modality];
    if (!cfg) throw new Error('Modalidad desconocida: ' + modality);
    const base = cfg.base;
    const variable = cfg.perKg * pesoKg;
    return { base, variable, subtotal: base + variable };
  }

  function handleSubmit(e) {
    e.preventDefault();
    const resultado = $('#resultado');
    if (!resultado) return;

    const modalidad = ($('#modalidad') && $('#modalidad').value) || '';
    const producto = ($('#producto') && $('#producto').value.trim()) || '';
    const pesoRaw = Number($('#peso') && $('#peso').value);
    const dimensiones = ($('#dimensiones') && $('#dimensiones').value) || 'Kilogramos';
    const origen = ($('#origen') && $('#origen').value.trim()) || '';
    const destino = ($('#destino') && $('#destino').value.trim()) || '';

    const errors = [];
    if (!modalidad) errors.push('Selecciona una modalidad de transporte.');
    if (!producto) errors.push('Ingresa el nombre del producto.');
    if (!origen) errors.push('Ingresa la ciudad de origen.');
    if (!destino) errors.push('Ingresa la ciudad de destino.');
    if (!pesoRaw || Number.isNaN(pesoRaw) || pesoRaw <= 0) errors.push('Ingresa un peso válido mayor que 0.');

    if (errors.length > 0) {
      resultado.innerHTML = `<div class="error"><strong>Error:</strong><ul>${errors.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
      resultado.setAttribute('aria-live','polite');
      return;
    }

    let pesoKg = pesoRaw;
    if (dimensiones.toLowerCase().includes('ton')) {
      pesoKg = pesoRaw * 1000;
    }

    let calc;
    try {
      calc = calculateBaseCost(modalidad, pesoKg);
    } catch (err) {
      resultado.innerHTML = `<div class="error">Error de cálculo: ${err.message}</div>`;
      return;
    }

    const multipliers = CONFIG.distanceMultipliers;
    const estimated = {
      local: Math.round(calc.subtotal * multipliers.local),
      regional: Math.round(calc.subtotal * multipliers.regional),
      national: Math.round(calc.subtotal * multipliers.nacional || calc.subtotal * multipliers.national),
      internacional: Math.round(calc.subtotal * multipliers.internacional)
    };
    const html = `
      <div class="estimate">
        <h4>Resumen de la cotización</h4>
        <div class="estimate-row"><strong>Producto:</strong> ${escapeHtml(producto)}</div>
        <div class="estimate-row"><strong>Modalidad:</strong> ${escapeHtml(modalidad)}</div>
        <div class="estimate-row"><strong>Peso (kg):</strong> ${Number(pesoKg)}</div>
        <div class="estimate-row"><strong>Ruta:</strong> ${escapeHtml(origen)} → ${escapeHtml(destino)}</div>
        <hr/>
        <div class="estimate-breakdown">
          <div>Tarifa base: <strong>${formatMoney(calc.base)}</strong></div>
          <div>Cargo por peso: <strong>${formatMoney(calc.variable)}</strong></div>
          <div class="subtotal">Subtotal estimado: <strong>${formatMoney(calc.subtotal)}</strong></div>
        </div>
        <hr/>
        <div class="estimate-ranges">
          <div><strong>Estimados por distancia (rangos):</strong></div>
          <ul>
            <li>Local (misma ciudad o corta): ${formatMoney(estimated.local)}</li>
            <li>Regional (50–500 km): ${formatMoney(estimated.regional)}</li>
            <li>Nacional (500–2000 km): ${formatMoney(estimated.national)}</li>
            <li>Internacional (&gt;2000 km): ${formatMoney(estimated.internacional)}</li>
          </ul>
        </div>
        <div class="note">Nota: este es un cálculo <em>estimado</em>. El precio final puede variar por combustible, impuestos, seguros y distancia exacta.</div>
      </div>
    `;

    resultado.innerHTML = html;
    resultado.setAttribute('aria-live','polite');

    const quoteObj = {
      timestamp: Date.now(),
      modalidad,
      producto,
      origen,
      destino,
      pesoKg: Math.round(pesoKg),
      estimatedLocal: estimated.local,
      estimatedRegional: estimated.regional,
      estimatedNational: estimated.national,
      estimatedInternational: estimated.internacional
    };
    saveQuote(quoteObj);
    const historyContainer = document.getElementById('presupuesto-history');
    if (historyContainer) renderSavedQuotes(historyContainer);
  }

  function escapeHtml(str = '') {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('Buscador');
    if (form) form.addEventListener('submit', handleSubmit);

    let historyContainer = document.getElementById('presupuesto-history');
    if (!historyContainer) {
      const resultado = document.getElementById('resultado');
      historyContainer = document.createElement('div');
      historyContainer.id = 'presupuesto-history';
      historyContainer.className = 'presupuesto-history';
      if (resultado && resultado.parentNode) resultado.parentNode.insertBefore(historyContainer, resultado.nextSibling);
      else document.body.appendChild(historyContainer);
    }
    renderSavedQuotes(historyContainer);
  });

})();
