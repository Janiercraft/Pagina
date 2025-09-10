const colors = {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    gray: '#6b7280',
    darkGray: '#374151',
    lightGray: '#f3f4f6'
};

const ctxBar = document.getElementById('barChart').getContext('2d');

const barChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
        labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
        datasets: [{
            label: 'Exportaciones (M USD)',
            data: [580, 650, 720, 890],
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
        }, {
            label: 'Importaciones (M USD)',
            data: [420, 480, 520, 610],
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 12,
                        weight: '600'
                    },
                    color: colors.darkGray,
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: colors.darkGray,
                bodyColor: colors.darkGray,
                borderColor: colors.primary,
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(107, 114, 128, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: colors.gray,
                    font: {
                        size: 11
                    },
                    callback: function(value) {
                        return '$' + value + 'M';
                    }
                }
            },
            x: {
                grid: {
                    display: false
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
        animation: {
            duration: 2000,
            easing: 'easeOutQuart'
        }
    }
});

const ctxPie = document.getElementById('pieChart').getContext('2d');

const pieChart = new Chart(ctxPie, {
    type: 'doughnut',
    data: {
        labels: ['Productos Químicos', 'Maquinaria', 'Textiles', 'Alimentos', 'Electrónicos', 'Otros'],
        datasets: [{
            data: [25, 22, 18, 15, 12, 8],
            backgroundColor: [
                colors.primary,
                colors.secondary,
                colors.accent,
                '#8b5cf6',
                '#10b981',
                colors.gray
            ],
            borderWidth: 0,
            hoverOffset: 15
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        size: 11,
                        weight: '500'
                    },
                    color: colors.darkGray,
                    usePointStyle: true,
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: colors.darkGray,
                bodyColor: colors.darkGray,
                borderColor: colors.primary,
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: false,
                callbacks: {
                    label: function(context) {
                        return context.label + ': ' + context.parsed + '%';
                    }
                }
            }
        },
        animation: {
            animateRotate: true,
            duration: 2000,
            easing: 'easeOutQuart'
        }
    }
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationDelay = '0.2s';
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

document.querySelectorAll('.chart-card, .data-section, .summary-card').forEach(card => {
    observer.observe(card);
});

function updateChartData(chart, newData) {
    chart.data.datasets[0].data = newData;
    chart.update('active');
}

function changeTheme(newColors) {
    Object.assign(colors, newColors);
}

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    if (header) {
        header.classList.add('fade-in');
    }
    
    console.log('📊 Dashboard de Comercio Internacional cargado correctamente');
    console.log('✅ Gráficos inicializados:', {
        barChart: barChart ? 'OK' : 'Error',
        pieChart: pieChart ? 'OK' : 'Error'
    });
});

const additionalData = {
    yearlyData: {
        2023: { exports: [520, 580, 640, 720], imports: [380, 420, 460, 540] },
        2024: { exports: [580, 650, 720, 890], imports: [420, 480, 520, 610] }
    },
    
    productCategories: [
        { name: 'Productos Químicos', percentage: 25, color: '#2563eb' },
        { name: 'Maquinaria', percentage: 22, color: '#3b82f6' },
        { name: 'Textiles', percentage: 18, color: '#60a5fa' },
        { name: 'Alimentos', percentage: 15, color: '#8b5cf6' },
        { name: 'Electrónicos', percentage: 12, color: '#10b981' },
        { name: 'Otros', percentage: 8, color: '#6b7280' }
    ],
    
    topCountries: [
        { name: 'Estados Unidos', value: 850, flag: '🇺🇸' },
        { name: 'China', value: 720, flag: '🇨🇳' },
        { name: 'Alemania', value: 650, flag: '🇩🇪' },
        { name: 'Brasil', value: 480, flag: '🇧🇷' },
        { name: 'México', value: 420, flag: '🇲🇽' }
    ]
};
