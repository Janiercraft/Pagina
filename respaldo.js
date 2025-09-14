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
    doc.querySelectorAll('title, meta, base').forEach(n => n.remove());
    
    const baseUrl = respuesta.url;

    function isStylesheetLoaded(href) {
      return Array.from(document.styleSheets).some(s => s.href === href);
    }

    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    const loadPromises = [];

    for (const link of links) {
      const hrefRaw = link.getAttribute('href') || '';
      const href = new URL(hrefRaw, baseUrl).href;

      let existing = document.querySelector(`link[rel="stylesheet"][href="${href}"]`);

      if (!existing) {
        existing = document.createElement('link');
        existing.rel = 'stylesheet';
        existing.href = href;
        document.head.appendChild(existing);
      }

      if (isStylesheetLoaded(href)) {
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

      link.remove();
    }

    const scripts = Array.from(doc.querySelectorAll('script'));
    for (const s of scripts) s.remove();

    await Promise.all(loadPromises);

    const prevVisibility = contenedor.style.visibility;
    contenedor.style.visibility = 'hidden';

    contenedor.innerHTML = doc.body.innerHTML;

    requestAnimationFrame(() => {
      contenedor.style.visibility = prevVisibility || 'visible';
    });
    for (const s of scripts) {
      if (s.src) {
        const srcResolved = new URL(s.getAttribute('src'), baseUrl).href;
        if (!document.querySelector(`script[src="${srcResolved}"]`)) {
          await new Promise((resolve, reject) => {
            const scriptEl = document.createElement('script');
            scriptEl.src = srcResolved;
            scriptEl.async = false; // preserva orden
            scriptEl.onload = () => resolve();
            scriptEl.onerror = () => {
              console.error('Error cargando script:', srcResolved);
              resolve(); // resolvemos para no bloquear la página
            };
            document.body.appendChild(scriptEl);
          });
        }
      } else {
        const inline = document.createElement('script');
        inline.text = s.textContent;
        document.body.appendChild(inline);
      }
    }
  } catch (error) {
    console.error('Error cargando componente:', error);
  }
}

async function cargarComponentesBasicos() {
  await Promise.all([
    cargarComponente('contenedor-navegacion', '/Nav_y_footer/navbar.html'),
    cargarComponente('contenedor-pie', '/Nav_y_footer/footer.html')
  ]);
}

document.addEventListener('DOMContentLoaded', cargarComponentesBasicos);
