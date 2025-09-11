async function cargarComponente(contenedorId, rutaArchivo) {
  try {
    const respuesta = await fetch(rutaArchivo);
    if (!respuesta.ok) {
      throw new Error(`Error al cargar ${rutaArchivo}: ${respuesta.status}`);
    }

    const html = await respuesta.text();
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    // Parsear HTML para manipularlo
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // BASE para resolver rutas relativas (usa la URL real del fetch)
    const baseUrl = respuesta.url;

    // 1) Mover <link rel="stylesheet"> al <head> (sin duplicados)
    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
    for (const link of links) {
      const hrefRaw = link.getAttribute('href') || '';
      // resolver href relativo respecto al archivo cargado
      const href = new URL(hrefRaw, baseUrl).href;
      // evitar duplicados
      if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = href;
        document.head.appendChild(newLink);
      }
      // quitar del doc para que no se inserte en el contenedor
      link.remove();
    }

    // 2) Extraer scripts (para poder ejecutarlos después) y quitar del contenido
    const scripts = Array.from(doc.querySelectorAll('script'));
    for (const s of scripts) s.remove();

    // 3) Insertar el HTML "limpio" (sin links ni scripts)
    contenedor.innerHTML = doc.body.innerHTML;

    // 4) Ejecutar scripts extraídos (si hay)
    for (const s of scripts) {
      if (s.src) {
        // script con src -> crear <script src=...> y esperar que cargue
        const srcResolved = new URL(s.getAttribute('src'), baseUrl).href;
        // evitar duplicar scripts externos por src
        if (!document.querySelector(`script[src="${srcResolved}"]`)) {
          await new Promise((resolve, reject) => {
            const scriptEl = document.createElement('script');
            scriptEl.src = srcResolved;
            scriptEl.async = false; // preserva orden
            scriptEl.onload = () => resolve();
            scriptEl.onerror = () => reject(new Error('Error cargando script: ' + srcResolved));
            document.body.appendChild(scriptEl);
          });
        }
      } else {
        // script inline -> ejecutar creando un nuevo <script> con text
        const inline = document.createElement('script');
        inline.text = s.textContent;
        document.body.appendChild(inline);
      }
    }
  } catch (error) {
    console.error('Error cargando componente:', error);
  }
}

// Función para cargar solo la navegación y el footer
async function cargarComponentesBasicos() {
  await Promise.all([
    cargarComponente('contenedor-navegacion', '/Nav_y_footer/navbar.html'),
    cargarComponente('contenedor-pie', '/Nav_y_footer/footer.html')
  ]);
}

document.addEventListener('DOMContentLoaded', cargarComponentesBasicos);
