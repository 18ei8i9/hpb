// ============================================================
// HABITACIONES
// ============================================================
const roomData = {
  doble: {
    titulo: 'Habitación Doble',
    capacidad: '2 personas',
    precio: 'ARS 52.000',
    detalle: 'Ideal para pareja o dos huéspedes. Incluye aire acondicionado, TV por cable, minibar, Wi‑Fi y desayuno buffet.'
  },
  matrimonial: {
    titulo: 'Habitación Matrimonial',
    capacidad: '2 personas',
    precio: 'ARS 58.000',
    detalle: 'Cama matrimonial, baño privado con secador de pelo, calefacción y mobiliario de madera.'
  },
  triple: {
    titulo: 'Habitación Triple',
    capacidad: '3 personas',
    precio: 'ARS 72.000',
    detalle: 'Pensada para familias o grupos pequeños, con la comodidad y servicios del hotel incluidos.'
  }
};

const detailBox = document.getElementById('room-detail');
const roomButtons = document.querySelectorAll('.room-card');

roomButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selected = roomData[button.dataset.room];
    detailBox.innerHTML = `
      <h3>${selected.titulo}</h3>
      <p><strong>Capacidad:</strong> ${selected.capacidad}</p>
      <p><strong>Tarifa desde:</strong> ${selected.precio} por noche</p>
      <p>${selected.detalle}</p>
    `;
  });
});


// ============================================================
// CONFIGURACIÓN
// ============================================================
const WORKER_URL    = "https://hpbs.nickenbote.workers.dev/";
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyQ1RxBScdbi-bimtSrAjXbv8CeQDqVD9utEcmsUbqHCAcr41cUyqrO6Pozq78RW5wRuA/exec";

const HOTEL_CONTEXT = `Sos el asistente virtual del Hotel Puerto Bandera, un hotel 2 estrellas ubicado en Buenos Aires 1020, Rosario, Santa Fe, Argentina.
Respondé siempre en español rioplatense, de forma amable, breve y profesional. Máximo 3 oraciones por respuesta.

HABITACIONES disponibles (todas incluyen AC, TV cable, minibar, baño privado, calefacción, teléfono, secador de pelo):
- doble: 2 personas — ARS 52.000/noche
- matrimonial: 2 personas — ARS 58.000/noche
- triple: 3 personas — ARS 72.000/noche

SERVICIOS: Desayuno buffet, Wi-Fi gratuito, gimnasio, conserjería, estacionamiento.

UBICACIÓN: Buenos Aires 1020, Rosario. A 200m del Monumento a la Bandera.
TELÉFONO: +54 341 440 0930

SISTEMA DE RESERVAS:
- Cuando alguien quiera consultar disponibilidad o reservar, pedile: nombre, teléfono, tipo de habitación (doble/matrimonial/triple), fecha de llegada y fecha de salida.
- Las fechas deben estar en formato YYYY-MM-DD.
- Cuando tengas todos los datos, respondé EXACTAMENTE con este formato JSON y nada más:
  {"accion":"disponibilidad","habitacion":"doble","checkin":"2025-06-01","checkout":"2025-06-03","nombre":"Juan","telefono":"341123456"}
- Si el usuario confirma que quiere reservar después de ver disponibilidad, respondé con:
  {"accion":"reservar","habitacion":"doble","checkin":"2025-06-01","checkout":"2025-06-03","nombre":"Juan","telefono":"341123456"}

REGLAS:
- Solo respondé sobre el hotel
- Si no sabés algo, invitalos a llamar al hotel
- Nunca inventes información`;


// ============================================================
// CHATBOT
// ============================================================
let conversationHistory = [];

const chatToggle   = document.getElementById('chat-toggle');
const chatBox      = document.getElementById('chatbot');
const chatClose    = document.getElementById('chat-close');
const chatForm     = document.getElementById('chat-form');
const chatInput    = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatToggle.addEventListener('click', () => {
  const isHidden = chatBox.classList.toggle('hidden');
  if (!isHidden && conversationHistory.length === 0) mostrarBienvenida();
});
chatClose.addEventListener('click', () => chatBox.classList.add('hidden'));

function appendMessage(type, html) {
  const p = document.createElement('p');
  p.className = type;
  p.innerHTML = html;
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return p;
}

function mostrarBienvenida() {
  appendMessage('bot', '¡Hola! 👋 Soy el asistente del <strong>Hotel Puerto Bandera</strong>. Puedo informarte sobre habitaciones y <strong>gestionar tu reserva</strong>. ¿En qué puedo ayudarte?');

  const opciones = ['🛏️ Habitaciones', '📍 Ubicación', '☕ Servicios', '📅 Consultar disponibilidad'];
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:6px 8px;';

  opciones.forEach(opcion => {
    const btn = document.createElement('button');
    btn.textContent = opcion;
    btn.style.cssText = `background:#ffe8bf;border:1px solid #c89a3d;color:#3d2a00;border-radius:999px;padding:4px 12px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;transition:background .15s;`;
    btn.addEventListener('mouseenter', () => btn.style.background = '#ffd98a');
    btn.addEventListener('mouseleave', () => btn.style.background = '#ffe8bf');
    btn.addEventListener('click', () => { wrap.remove(); enviarMensaje(opcion); });
    wrap.appendChild(btn);
  });

  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Consultar disponibilidad en Google Sheets
async function consultarDisponibilidad(params) {
  const url = `${SHEET_API_URL}?action=disponibilidad&habitacion=${encodeURIComponent(params.habitacion)}&checkin=${params.checkin}&checkout=${params.checkout}`;
  const res = await fetch(url);
  return await res.json();
}

// Crear reserva en Google Sheets
async function crearReserva(params) {
  const url = `${SHEET_API_URL}?action=reservar&nombre=${encodeURIComponent(params.nombre)}&telefono=${encodeURIComponent(params.telefono)}&habitacion=${encodeURIComponent(params.habitacion)}&checkin=${params.checkin}&checkout=${params.checkout}`;
  const res = await fetch(url);
  return await res.json();
}

// Mostrar botones de confirmación de reserva
function mostrarConfirmacionReserva(params) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:8px;padding:4px 0;flex-wrap:wrap;';

  const btnSi = document.createElement('button');
  btnSi.textContent = '✅ Sí, confirmar reserva';
  btnSi.style.cssText = `background:#1d2a36;color:#fff;border:none;border-radius:20px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;`;

  const btnNo = document.createElement('button');
  btnNo.textContent = '❌ No, cancelar';
  btnNo.style.cssText = `background:#ffe8bf;border:1px solid #c89a3d;color:#3d2a00;border-radius:20px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:'Inter',sans-serif;`;

  btnSi.addEventListener('click', async () => {
    wrap.remove();
    const typing = appendMessage('bot', '<em style="opacity:.5">Procesando reserva...</em>');
    const resultado = await crearReserva(params);
    if (resultado.exito) {
      typing.innerHTML = `🎉 <strong>${resultado.mensaje}</strong><br>Guardamos tu reserva. Te esperamos, ${params.nombre}!`;
    } else {
      typing.innerHTML = `Lo sentimos, ${resultado.mensaje}`;
    }
  });

  btnNo.addEventListener('click', () => {
    wrap.remove();
    appendMessage('bot', 'Entendido, cancelamos la reserva. ¿Puedo ayudarte con algo más?');
  });

  wrap.appendChild(btnSi);
  wrap.appendChild(btnNo);
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Llamada al Worker (Groq)
async function llamarIA(mensajeUsuario) {
  conversationHistory.push({ role: 'user', content: mensajeUsuario });
  const typing = appendMessage('bot', '<em style="opacity:.5">Escribiendo...</em>');

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: HOTEL_CONTEXT,
        messages: conversationHistory
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(JSON.stringify(data.error));

    const respuesta = data.choices?.[0]?.message?.content || 'No pude procesar tu consulta.';
    conversationHistory.push({ role: 'assistant', content: respuesta });

    // Detectar si la IA devolvió un JSON de acción
    const jsonMatch = respuesta.match(/\{[\s\S]*"accion"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const accion = JSON.parse(jsonMatch[0]);

        if (accion.accion === 'disponibilidad') {
          typing.innerHTML = '🔍 Consultando disponibilidad...';
          const resultado = await consultarDisponibilidad(accion);

          if (resultado.disponible) {
            typing.innerHTML = `✅ <strong>${resultado.mensaje}</strong><br>
              📅 Llegada: <strong>${accion.checkin}</strong> | Salida: <strong>${accion.checkout}</strong><br>
              🛏️ Habitación: <strong>${accion.habitacion}</strong><br>
              ¿Confirmamos la reserva?`;
            mostrarConfirmacionReserva(accion);
          } else {
            typing.innerHTML = `❌ ${resultado.mensaje}<br>¿Querés que busquemos otra fecha o tipo de habitación?`;
          }
        } else if (accion.accion === 'reservar') {
          typing.innerHTML = '📋 Procesando reserva...';
          const resultado = await crearReserva(accion);
          typing.innerHTML = resultado.exito
            ? `🎉 <strong>${resultado.mensaje}</strong>`
            : `❌ ${resultado.mensaje}`;
        }
        return;
      } catch (e) {
        // No era JSON válido, mostrar respuesta normal
      }
    }

    typing.innerHTML = respuesta.replace(/\n/g, '<br>');

  } catch (err) {
    console.error('Error:', err);
    typing.innerHTML = 'Hubo un problema. Llamanos al <a href="tel:+543414400930" style="color:#c89a3d;">+54 341 440 0930</a>.';
  }
}

function enviarMensaje(texto) {
  if (!texto) return;
  appendMessage('user', texto);
  chatInput.value = '';
  llamarIA(texto);
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = chatInput.value.trim();
  if (texto) enviarMensaje(texto);
});
