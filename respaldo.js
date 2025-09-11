async function cargarComponente(contenedorId, rutaArchivo) {
    try {
        const respuesta = await fetch(rutaArchivo);
        if (!respuesta.ok) {
            throw new Error(`Error al cargar ${rutaArchivo}: ${respuesta.status}`);
        }
        const html = await respuesta.text();
        const contenedor = document.getElementById(contenedorId);
        if (contenedor) {
            contenedor.innerHTML = html;
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

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', cargarComponentesBasicos);