/* ========================================
   CONFIGURACIÓN DE COLORES GLOBALES
   ======================================== */

// Paleta de colores consistente para toda la aplicación
const colors = {
    primary: '#2563eb',     // Azul sólido principal
    secondary: '#3b82f6',   // Azul secundario
    accent: '#60a5fa',      // Azul claro para acentos
    gray: '#6b7280',        // Gris medio
    darkGray: '#374151',    // Gris oscuro para textos
    lightGray: '#f3f4f6'    // Gris claro para fondos
};

/* ========================================
   GRÁFICO DE BARRAS - VOLUMEN DE COMERCIO
   ======================================== */

// Obtener el contexto del canvas para el gráfico de barras
const ctxBar = document.getElementById('barChart').getContext('2d');

// Crear el gráfico de barras comparativo
const barChart = new Chart(ctxBar, {
    type: 'bar', // Tipo de gráfico: barras
    data: {
        // Etiquetas del eje X (trimestres)
        labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
        datasets: [{
            // Primera serie de datos: Exportaciones
            label: 'Exportaciones (M USD)',
            data: [580, 650, 720, 890], // Datos en millones de USD
            backgroundColor: colors.primary, // Color de relleno
            borderColor: colors.primary,     // Color del borde
            borderWidth: 0,                  // Sin borde visible
            borderRadius: 8,                 // Bordes redondeados en las barras
            borderSkipped: false,            // Aplica borderRadius a todos los lados
        }, {
            // Segunda serie de datos: Importaciones
            label: 'Importaciones (M USD)',
            data: [420, 480, 520, 610], // Datos en millones de USD
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
        }]
    },
    options: {
        responsive: true,              // Se adapta al tamaño del contenedor
        maintainAspectRatio: false,    // Permite altura fija
        plugins: {
            // Configuración de la leyenda
            legend: {
                position: 'top', // Posición arriba del gráfico
                labels: {
                    font: {
                        size: 12,
                        weight: '600' // Semi-bold
                    },
                    color: colors.darkGray,
                    usePointStyle: true,  // Usa puntos en lugar de rectángulos
                    padding: 20           // Espaciado alrededor de las etiquetas
                }
            },
            // Configuración de los tooltips (ventanas emergentes)
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)', // Fondo casi blanco
                titleColor: colors.darkGray,    // Color del título
                bodyColor: colors.darkGray,     // Color del texto
                borderColor: colors.primary,    // Borde azul
                borderWidth: 1,
                cornerRadius: 12,               // Bordes redondeados
                displayColors: false            // Oculta los cuadros de color
            }
        },
        scales: {
            // Configuración del eje Y (valores)
            y: {
                beginAtZero: true, // Comienza desde cero
                grid: {
                    color: 'rgba(107, 114, 128, 0.1)', // Líneas de cuadrícula muy sutiles
                    drawBorder: false                   // Sin borde en el eje
                },
                ticks: {
                    color: colors.gray,
                    font: {
                        size: 11
                    },
                    // Formato personalizado para mostrar valores como "$XXXm"
                    callback: function(value) {
                        return '$' + value + 'M';
                    }
                }
            },
            // Configuración del eje X (etiquetas)
            x: {
                grid: {
                    display: false // Oculta las líneas verticales de la cuadrícula
                },
                ticks: {
                    color: colors.gray,
                    font: {
                        size: 11,
                        weight: '500'
                    }
                }
            }
        },
        // Configuración de la animación de entrada
        animation: {
            duration: 2000,           // 2 segundos de duración
            easing: 'easeOutQuart'    // Curva de animación suave
        }
    }
});

/* ========================================
   GRÁFICO DE TORTA - DISTRIBUCIÓN POR CATEGORÍAS
   ======================================== */

// Obtener el contexto del canvas para el gráfico de torta
const ctxPie = document.getElementById('pieChart').getContext('2d');

// Crear el gráfico de dona (doughnut)
const pieChart = new Chart(ctxPie, {
    type: 'doughnut', // Tipo dona (torta con hueco central)
    data: {
        // Categorías de productos
        labels: ['Productos Químicos', 'Maquinaria', 'Textiles', 'Alimentos', 'Electrónicos', 'Otros'],
        datasets: [{
            // Porcentajes para cada categoría
            data: [25, 22, 18, 15, 12, 8],
            backgroundColor: [
                colors.primary,    // Azul principal
                colors.secondary,  // Azul secundario  
                colors.accent,     // Azul claro
                '#8b5cf6',        // Violeta
                '#10b981',        // Verde
                colors.gray       // Gris
            ],
            borderWidth: 0,       // Sin bordes entre segmentos
            hoverOffset: 15       // Separación al hacer hover (efecto de "salir")
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%', // Tamaño del hueco central (60% del radio)
        plugins: {
            // Configuración de la leyenda
            legend: {
                position: 'bottom', // Posición debajo del gráfico
                labels: {
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    color: colors.darkGray,
                    usePointStyle: true, // Usa círculos en lugar de rectángulos
                    padding: 15          // Espaciado entre elementos
                }
            },
            // Configuración de tooltips
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: colors.darkGray,
                bodyColor: colors.darkGray,
                borderColor: colors.primary,
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: false,
                callbacks: {
                    // Formato personalizado para mostrar porcentajes
                    label: function(context) {
                        return context.label + ': ' + context.parsed + '%';
                    }
                }
            }
        },
        // Configuración de animaciones
        animation: {
            animateRotate: true,      // Anima la rotación
            duration: 2000,           // Duración de 2 segundos
            easing: 'easeOutQuart'    // Curva de animación suave
        }
    }
});

/* ========================================
   ANIMACIONES DE ENTRADA Y EFECTOS VISUALES
   ======================================== */

// Configuración del Intersection Observer para animaciones de entrada
const observerOptions = {
    threshold: 0.1,                    // Se activa cuando el 10% del elemento es visible
    rootMargin: '0px 0px -50px 0px'   // Margen inferior para activar la animación antes
};

// Crear el observer para detectar cuando los elementos entran en la vista
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Añadir un pequeño delay para escalonar las animaciones
            entry.target.style.animationDelay = '0.2s';
            // Aplicar la clase de animación fadeIn
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observar todas las tarjetas y secciones para animarlas cuando aparezcan
document.querySelectorAll('.chart-card, .data-section, .summary-card').forEach(card => {
    observer.observe(card);
});

/* ========================================
   FUNCIONES ADICIONALES Y UTILIDADES
   ======================================== */

// Función para actualizar datos de los gráficos (opcional para uso futuro)
function updateChartData(chart, newData) {
    chart.data.datasets[0].data = newData;
    chart.update('active'); // Animación suave al actualizar
}

// Función para cambiar tema de colores (opcional para uso futuro)
function changeTheme(newColors) {
    Object.assign(colors, newColors);
    // Aquí se podrían actualizar los gráficos con los nuevos colores
}

/* ========================================
   EVENTOS Y INTERACCIONES
   ======================================== */

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar animación inicial al header
    const header = document.querySelector('.header');
    if (header) {
        header.classList.add('fade-in');
    }
    
    // Log para confirmar que el script se ha cargado correctamente
    console.log('📊 Dashboard de Comercio Internacional cargado correctamente');
    console.log('✅ Gráficos inicializados:', {
        barChart: barChart ? 'OK' : 'Error',
        pieChart: pieChart ? 'OK' : 'Error'
    });
});

/* ========================================
   DATOS ADICIONALES PARA REFERENCIA
   ======================================== */

// Datos de ejemplo adicionales que podrían usarse para actualizar los gráficos
const additionalData = {
    // Datos históricos por año
    yearlyData: {
        2023: { exports: [520, 580, 640, 720], imports: [380, 420, 460, 540] },
        2024: { exports: [580, 650, 720, 890], imports: [420, 480, 520, 610] }
    },
    
    // Categorías adicionales de productos
    productCategories: [
        { name: 'Productos Químicos', percentage: 25, color: '#2563eb' },
        { name: 'Maquinaria', percentage: 22, color: '#3b82f6' },
        { name: 'Textiles', percentage: 18, color: '#60a5fa' },
        { name: 'Alimentos', percentage: 15, color: '#8b5cf6' },
        { name: 'Electrónicos', percentage: 12, color: '#10b981' },
        { name: 'Otros', percentage: 8, color: '#6b7280' }
    ],
    
    // Países principales de comercio
    topCountries: [
        { name: 'Estados Unidos', value: 850, flag: '🇺🇸' },
        { name: 'China', value: 720, flag: '🇨🇳' },
        { name: 'Alemania', value: 650, flag: '🇩🇪' },
        { name: 'Brasil', value: 480, flag: '🇧🇷' },
        { name: 'México', value: 420, flag: '🇲🇽' }
    ]
};