async function tryFetchVariants(ruta) {
  const variants = [ruta, './' + ruta, '/' + ruta];
  for (const v of variants) {
    try {
      const resp = await fetch(v, { cache: 'no-store' });
      if (resp && resp.ok) {
        console.debug(`[respaldo] fetch OK -> ${v}`);
        return { response: resp, usedPath: v };
      } else {
        console.debug(`[respaldo] fetch fallo (status ${resp ? resp.status : 'no resp'}) -> ${v}`);
      }
    } catch (err) {
      console.debug(`[respaldo] fetch error -> ${v}`, err);
    }
  }
  return { response: null, usedPath: null };
}

function looksDangerousScriptText(text) {
  if (!text) return false;
  const patterns = [
    /\bwindow\.location\b/i,
    /\blocation\.href\b/i,
    /\blocation\.replace\b/i,
    /\blocation\.assign\b/i,
    /\bdocument\.location\b/i,
    /\btop\.location\b/i,
    /\bparent\.location\b/i,
  ];
  return patterns.some(rx => rx.test(text));
}

async function cargarComponente(contenedorId, rutaArchivo) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) {
    console.warn(`[respaldo] contenedor no encontrado: ${contenedorId}`);
    return;
  }

  try {
    const { response, usedPath } = await tryFetchVariants(rutaArchivo);
    if (!response) {
      throw new Error(`No se encontró el archivo en variantes: ${rutaArchivo}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const baseUrl = response.url || usedPath || location.href;

    console.debug(`[respaldo] parsed HTML desde: ${baseUrl}`);

    doc.querySelectorAll('title, base').forEach(n => n.remove());
    doc.querySelectorAll('meta[http-equiv]').forEach(n => {
      const eq = (n.getAttribute('http-equiv') || '').toLowerCase();
      if (eq === 'refresh') n.remove();
    });

    (function resolveRelativeAttrs() {
      const attrs = ['src', 'href', 'poster'];
      for (const attr of attrs) {
        const els = Array.from(doc.querySelectorAll('[' + attr + ']'));
        for (const el of els) {
          const val = el.getAttribute(attr);
          if (!val) continue;
          if (/^(#|mailto:|tel:|javascript:)/i.test(val)) continue;
          try {
            const resolved = new URL(val, baseUrl).href;
            el.setAttribute(attr, resolved);
          } catch (e) {
            console.warn('[respaldo] no se pudo resolver', val, 'desde', baseUrl);
          }
        }
      }
    })();

    function isStylesheetLoaded(href) {
      return Array.from(document.styleSheets).some(s => s.href === href);
    }

    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    const cssLoadPromises = [];
    for (const link of links) {
      const href = link.getAttribute('href') || '';
      try {
        const hrefResolved = new URL(href, baseUrl).href;
        let existing = document.querySelector(`link[rel="stylesheet"][href="${hrefResolved}"]`);
        if (!existing) {
          existing = document.createElement('link');
          existing.rel = 'stylesheet';
          existing.href = hrefResolved;
          document.head.appendChild(existing);
          console.debug('[respaldo] appended stylesheet:', hrefResolved);
        } else {
          console.debug('[respaldo] stylesheet ya presente:', hrefResolved);
        }

        if (isStylesheetLoaded(hrefResolved)) {
          cssLoadPromises.push(Promise.resolve());
        } else {
          cssLoadPromises.push(new Promise((resolve) => {
            const onFinish = () => {
              existing.removeEventListener('load', onFinish);
              existing.removeEventListener('error', onFinish);
              resolve();
            };
            existing.addEventListener('load', onFinish);
            existing.addEventListener('error', onFinish);
            setTimeout(onFinish, 2500);
          }));
        }
      } catch (e) {
        console.warn('[respaldo] error resolviendo stylesheet href:', href, e);
      }
      link.remove();
    }

    const scripts = Array.from(doc.querySelectorAll('script'));
    const externalScripts = [];
    for (const s of scripts) {
      const src = s.getAttribute('src');
      if (src) {
        let resolved;
        try { resolved = new URL(src, baseUrl).href; } catch(e){ resolved = src; }
        if (/\.(html|htm)(?:$|\?)/i.test(resolved)) {
          console.warn('[respaldo] descartado script-src que apunta a HTML:', resolved);
          s.remove();
        } else {
          externalScripts.push(resolved);
          s.remove();
        }
      } else {
        const txt = s.textContent || '';
        if (looksDangerousScriptText = looksDangerousScriptText) {} 
        if (looksDangerousScriptText(txt)) {
          console.warn('[respaldo] script inline descartado por patrones peligrosos');
          s.remove();
        } else {
          s.dataset.inline = 'true';
        }
      }
    }

    await Promise.all(cssLoadPromises);

    const prevVis = contenedor.style.visibility;
    contenedor.style.visibility = 'hidden';

    contenedor.innerHTML = doc.body.innerHTML;
    requestAnimationFrame(() => {
      contenedor.style.visibility = prevVis || 'visible';
    });

    try {
      const inlines = Array.from(contenedor.querySelectorAll('script[data-inline="true"], script'));
      for (const inline of inlines) {
        const txt = inline.textContent || '';
        if (looksDangerousScriptText(txt)) {
          console.warn('[respaldo] evitando ejecucion inline por seguridad');
          continue;
        }
        const newScript = document.createElement('script');
        newScript.text = txt;
        document.body.appendChild(newScript);
        if (inline.parentNode) inline.parentNode.removeChild(inline);
      }
    } catch (e) {
      console.warn('[respaldo] error ejecutando scripts inline:', e);
    }

    for (const src of externalScripts) {
      try {
        if (document.querySelector(`script[src="${src}"]`)) {
          console.debug('[respaldo] script externo ya agregado:', src);
          continue;
        }

        if (/\.(html|htm)(?:$|\?)/i.test(src)) {
          console.warn('[respaldo] saltando script externo que apunta a HTML:', src);
          continue;
        }

        await new Promise((resolve) => {
          const sEl = document.createElement('script');
          sEl.src = src;
          sEl.async = false;
          sEl.onload = () => { console.debug('[respaldo] script cargado:', src); resolve(); };
          sEl.onerror = () => { console.warn('[respaldo] error cargando script:', src); resolve(); };
          document.body.appendChild(sEl);
        });
      } catch (err) {
        console.warn('[respaldo] excepción cargando script externo:', src, err);
      }
    }

    console.debug('[respaldo] carga de componente finalizada:', rutaArchivo);
  } catch (err) {
    console.error('[respaldo] error cargando componente:', rutaArchivo, err);
    try {
      console.debug('[respaldo] intentando fallback: insertar HTML bruto (sin procesar scripts).');
      const { response } = await tryFetchVariants(rutaArchivo);
      if (response) {
        const raw = await response.text();
        contenedor.innerHTML = raw;
      }
    } catch (e2) {
      console.error('[respaldo] fallback también falló:', e2);
    }
  }
}

async function cargarComponentesBasicos() {
  await Promise.all([
    cargarComponente('contenedor-navegacion', 'Nav_y_footer/navbar.html'),
    cargarComponente('contenedor-pie', 'Nav_y_footer/footer.html')
  ]).catch(e => console.error('[respaldo] error en cargarComponentesBasicos:', e));
}

document.addEventListener('DOMContentLoaded', cargarComponentesBasicos);
