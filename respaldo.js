async function cargarComponente(contenedorId, rutaArchivo) {
  try {
    const respuesta = await fetch(rutaArchivo);
    if (!respuesta.ok) {
      throw new Error(`Error al cargar ${rutaArchivo}: ${respuesta.status}`);
    }

    const html = await respuesta.text();
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('title, base').forEach(n => n.remove());
    doc.querySelectorAll('meta[http-equiv]').forEach(n => {
      const eq = (n.getAttribute('http-equiv') || '').toLowerCase();
      if (eq === 'refresh') n.remove();
    });

    const baseUrl = respuesta.url;
    (function resolveRelativeAttrs() {
      const attrsToFix = ['src', 'href', 'poster'];
      for (const attr of attrsToFix) {
        const els = Array.from(doc.querySelectorAll('[' + attr + ']'));
        for (const el of els) {
          const val = el.getAttribute(attr);
          if (!val) continue;
          if (/^(#|mailto:|tel:|javascript:)/i.test(val)) continue;
          try {
            const resolved = new URL(val, baseUrl).href;
            el.setAttribute(attr, resolved);
          } catch (e) {
            console.warn('No se pudo resolver URL para', val, 'desde', baseUrl);
          }
        }
      }
    })();

    function isStylesheetLoaded(href) {
      return Array.from(document.styleSheets).some(s => s.href === href);
    }

    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    const loadPromises = [];

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
        }

        if (isStylesheetLoaded(hrefResolved)) {
          loadPromises.push(Promise.resolve());
        } else {
          loadPromises.push(new Promise((resolve) => {
            const onFinish = () => {
              existing.removeEventListener('load', onFinish);
              existing.removeEventListener('error', onFinish);
              resolve();
            };
            existing.addEventListener('load', onFinish);
            existing.addEventListener('error', onFinish);
            setTimeout(onFinish, 2000);
          }));
        }
      } catch (e) {
        console.warn('Error resolviendo href de stylesheet:', href, e);
      }
      link.remove();
    }

    const scripts = Array.from(doc.querySelectorAll('script'));
    const safeExternalScripts = [];

    const redirectPatterns = [
      /\bwindow\.location\b/i,
      /\blocation\.href\b/i,
      /\blocation\.replace\b/i,
      /\blocation\.assign\b/i,
      /\btop\.location\b/i,
      /\bparent\.location\b/i,
      /\bwindow\.location\.href\b/i,
      /\bdocument\.location\b/i
    ];

    function isScriptDangerousText(text) {
      if (!text) return false;
      return redirectPatterns.some(rx => rx.test(text));
    }

    for (const s of scripts) {
      const src = s.getAttribute('src');
      if (src) {
        let resolved;
        try {
          resolved = new URL(src, baseUrl).href;
        } catch (e) {
          resolved = src;
        }

        if (/\.(html|htm)(?:$|\?)/i.test(resolved)) {
          console.warn('Se descarta script con src a HTML por seguridad:', resolved);
          s.remove();
          continue;
        }
        safeExternalScripts.push(resolved);
        s.remove();
      } else {
        const txt = s.textContent || '';
        if (isScriptDangerousText(txt)) {
          console.warn('Se descartó un script inline por contener redirecciones potenciales.');
          s.remove();
        } else {
          console.warn('Script inline detectado y descartado (ejecución inline deshabilitada).');
          s.remove();
        }
      }
    }

    await Promise.all(loadPromises);

    const prevVisibility = contenedor.style.visibility;
    contenedor.style.visibility = 'hidden';

    contenedor.innerHTML = doc.body.innerHTML;

    requestAnimationFrame(() => {
      contenedor.style.visibility = prevVisibility || 'visible';
    });

    for (const srcResolved of safeExternalScripts) {
      try {
        if (document.querySelector(`script[src="${srcResolved}"]`)) continue;

        const srcOrigin = (new URL(srcResolved, location.href)).origin;
        const pageOrigin = location.origin;
        if (srcOrigin !== pageOrigin) {
          console.warn('Omitiendo script cross-origin por seguridad:', srcResolved);
          continue;
        }

        try {
          const headResp = await fetch(srcResolved, { method: 'HEAD' });
          if (!headResp.ok) {
            console.warn('HEAD para script no OK, omitiendo:', srcResolved);
            continue;
          }
        } catch (e) {
          console.warn('HEAD falló para script; omitiendo por seguridad:', srcResolved);
          continue;
        }

        await new Promise((resolve) => {
          const scriptEl = document.createElement('script');
          scriptEl.src = srcResolved;
          scriptEl.async = false;
          scriptEl.onload = () => resolve();
          scriptEl.onerror = () => {
            console.warn('Error cargando script externo:', srcResolved);
            resolve();
          };
          document.body.appendChild(scriptEl);
        });
      } catch (err) {
        console.error('Error tratando de cargar script externo:', err);
      }
    }

  } catch (error) {
    console.error('Error cargando componente:', error);
  }
}

async function cargarComponentesBasicos() {
  await Promise.all([
    cargarComponente('contenedor-navegacion', 'Nav_y_footer/navbar.html'),
    cargarComponente('contenedor-pie', 'Nav_y_footer/footer.html')
  ]).catch(e => console.error('Error cargando componentes basicos:', e));
}

document.addEventListener('DOMContentLoaded', cargarComponentesBasicos);