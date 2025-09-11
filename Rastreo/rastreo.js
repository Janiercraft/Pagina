const datosTrazabilidad = {
        'ABC123': { estado: 'En tránsito', ubicacion: 'Centro de distribución Exoire S.A.S', fecha: '18-09-25' },
        'XYZ789': { estado: 'Entregado', ubicacion: 'Sucursal Turbo', fecha: '18-09-25' },
        'LMN456': { estado: 'Pendiente de envío', ubicacion: 'Almacén principal', fecha: '18-09-25' }
      };

      document.getElementById('rastreoForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const codigo = document.getElementById('codigo').value.trim().toUpperCase();
        const resultadoDiv = document.getElementById('resultado');
        if (datosTrazabilidad[codigo]) {
          const info = datosTrazabilidad[codigo];
          resultadoDiv.innerHTML = `
                    <strong>Estado:</strong> ${info.estado}<br>
                    <strong>Ubicación actual:</strong> ${info.ubicacion}<br>
                    <strong>Fecha de actualización:</strong> ${info.fecha}
                `;
          resultadoDiv.style.display = 'block';
        } else {
          resultadoDiv.innerHTML = 'No se encontró información para el código ingresado.';
          resultadoDiv.style.display = 'block';
        }
      });