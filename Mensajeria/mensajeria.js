class ChatBot {
    constructor() {
        this.currentDepartment = 'soporte';
        this.departments = {
            soporte: {
                name: 'Soporte Técnico',
                avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922510.png',
                responses: {
                    'exportación': '📦 Para exportar necesitas: certificado de origen, factura comercial, lista de empaque y permisos específicos según el producto. ¿Te gustaría más detalles sobre algún documento?',
                    'importación': '📋 Los requisitos básicos incluyen: registro como importador, declaración de importación, certificados sanitarios (si aplica) y pago de aranceles. ¿Qué producto planeas importar?',
                    'requisitos': '✅ Los requisitos varían según el país de destino. Te recomiendo una consulta personalizada para tu caso específico.',
                    'asesoría': '📅 ¡Perfecto! Puedes agendar una asesoría de 30 minutos por solo $50. ¿Prefieres presencial o virtual?',
                    'tarifas': '💰 Nuestras tarifas son competitivas y varían según el servicio. Te envío la lista completa por correo. ¿Cuál es tu email?',
                    'documentos': '📄 Los documentos principales son: factura comercial, certificado de origen, lista de empaque, y certificados específicos según el producto.',
                    'tiempos': '⏰ Los tiempos de procesamiento varían entre 3-15 días hábiles dependiendo del país y tipo de mercancía.',
                    'default': '🤔 No estoy seguro de cómo ayudarte con eso. ¿Podrías ser más específico o elegir una de las opciones rápidas?'
                }
            },
            comercial: {
                name: 'Área Comercial',
                avatar: 'https://cdn-icons-png.flaticon.com/512/2922/2922522.png',
                responses: {
                    'servicios': '🎯 Ofrecemos: tramitación aduanera, asesoría comercial internacional, gestión logística y consultoría en comercio exterior.',
                    'cotización': '💼 Te preparo una cotización personalizada. ¿Podrías contarme más sobre tu proyecto?',
                    'default': '👋 ¡Hola! Soy del área comercial. Estoy aquí para ayudarte con información sobre nuestros servicios y cotizaciones.'
                }
            },
            logistica: {
                name: 'Logística',
                avatar: 'https://cdn-icons-png.flaticon.com/512/995/995326.png',
                responses: {
                    'seguimiento': '📍 Para el seguimiento de tu envío necesito el número de guía. ¿Lo tienes a mano?',
                    'transporte': '🚚 Trabajamos con transporte marítimo, aéreo y terrestre. ¿Qué tipo de carga manejas?',
                    'default': '🚛 ¡Hola! Soy del área logística. Te ayudo con seguimiento de envíos y opciones de transporte.'
                }
            }
        };
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('sendBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        document.querySelectorAll('.quick-response').forEach(btn => {
            btn.addEventListener('click', () => {
                const response = btn.dataset.response;
                document.getElementById('messageInput').value = response;
                this.sendMessage();
            });
        });

        document.querySelectorAll('.contact').forEach(contact => {
            contact.addEventListener('click', () => {
                document.querySelectorAll('.contact').forEach(c => c.classList.remove('active'));
                contact.classList.add('active');
                this.currentDepartment = contact.dataset.department;
                this.updateHeader();
                this.sendWelcomeMessage();
                this.closeMobileSidebar();
            });
        });

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const sidebar = document.querySelector('.sidebar');

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileSidebar());
        }

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => this.closeMobileSidebar());
        }

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileSidebar();
            }
        });

        if (window.innerWidth > 768) {
            document.getElementById('messageInput').focus();
        }
    }

    toggleMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobileOverlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
        if (sidebar.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeMobileSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('mobileOverlay');
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();
        if (!message) return;
        this.addMessage(message, 'sent');
        input.value = '';
        this.showTypingIndicator();
        setTimeout(() => {
            this.hideTypingIndicator();
            this.generateBotResponse(message);
        }, 1500);
    }

    addMessage(content, type) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const department = this.departments[this.currentDepartment];
        const avatar = type === 'sent'
            ? 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
            : department.avatar;
        messageDiv.innerHTML = `
            <img src="${avatar}" alt="Avatar" class="message-avatar">
            <div class="bubble">
                ${content}
                <span class="time">${time}</span>
            </div>
        `;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    generateBotResponse(userMessage) {
        const department = this.departments[this.currentDepartment];
        const message = userMessage.toLowerCase();
        let response = department.responses.default;
        for (const [keyword, botResponse] of Object.entries(department.responses)) {
            if (keyword !== 'default' && message.includes(keyword)) {
                response = botResponse;
                break;
            }
        }
        this.addMessage(response, 'received');
    }

    showTypingIndicator() {
        document.getElementById('typingIndicator').classList.add('active');
    }

    hideTypingIndicator() {
        document.getElementById('typingIndicator').classList.remove('active');
    }

    updateHeader() {
        const department = this.departments[this.currentDepartment];
        document.getElementById('headerTitle').textContent = department.name;
        const headerAvatar = document.getElementById('headerAvatar');
        headerAvatar.src = department.avatar;
        headerAvatar.style.background = department.color;
    }

    sendWelcomeMessage() {
        setTimeout(() => {
            const department = this.departments[this.currentDepartment];
            const welcomeMessage = department.responses.default ||
                `¡Hola! Soy del ${department.name}. ¿En qué puedo ayudarte?`;
            this.addMessage(welcomeMessage, 'received');
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatBot();
});