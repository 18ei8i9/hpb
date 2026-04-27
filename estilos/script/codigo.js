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
// CHATBOT — via Cloudflare Worker (proxy de Gemini)
// ============================================================

const WORKER_URL = "https://hpbs.nickenbote.workers.dev/";

const HOTEL_CONTEXT = `
Sos el asistente virtual del Hotel Puerto Bandera, un hotel 2 estrellas ubicado en Buenos Aires 1020, Rosario, Santa Fe, Argentina.
Respondé siempre en español rioplatense, de forma amable, breve y profesional. Máximo 3 oraciones por respuesta.

INFORMACIÓN DEL HOTEL:
- Nombre: Hotel Puerto Bandera
- Dirección: Buenos Aires 1020, Rosario, Santa Fe
- Teléfono: +54 341 440 0930
- Categoría: 2 estrellas
- A 200-250 m del Monumento Nacional a la Bandera
- A 300 m de peatonal Córdoba, cerca de Catedral y Plaza 25 de Mayo
- A 10 min en auto de la terminal de autobuses
- A 25 min del Aeropuerto de Fisherton

HABITACIONES (todas incluyen AC, TV cable, minibar, baño privado, calefacción, teléfono, secador de pelo):
- Doble: 2 personas — ARS 52.000/noche
- Matrimonial: 2 personas — ARS 58.000/noche
- Triple: 3 personas — ARS 72.000/noche

SERVICIOS INCLUIDOS EN TODAS LAS HABITACIONES:
- Desayuno buffet, Wi-Fi gratuito, recepción, gimnasio, conserjería, estacionamiento, renta de autos

RESERVAS:
- Para reservar llamar al +54 341 440 0930 o dejar datos en el chat
- Si alguien quiere reservar, pedile: nombre, fechas y tipo de habitación

REGLAS:
- Respondé preguntas sobre el hotel con la info de arriba
- Si no sabés algo, invitalos a llamar al hotel
- Nunca inventes información
- No menciones el teléfono a menos que sea necesario o te lo pidan
`;

let conversationHistory = [];

const chatToggle  = document.getElementById('chat-toggle');
const chatBox     = document.getElementById('chatbot');
const chatClose   = document.getElementById('chat-close');
const chatForm    = document.getElementById('chat-form');
const chatInput   = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

// Abrir / cerrar
chatToggle.addEventListener('click', () => {
  const isHidden = chatBox.classList.toggle('hidden');
  if (!isHidden && conversationHistory.length === 0) {
    mostrarBienvenida();
  }
});
chatClose.addEventListener('click', () => chatBox.classList.add('hidden'));

// Agregar mensaje al DOM
function appendMessage(type, html) {
  const p = document.createElement('p');
  p.className = type;
  p.innerHTML = html;
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return p;
}

// Bienvenida con botones rápidos
function mostrarBienvenida() {
  appendMessage('bot', '¡Hola! 👋 Soy el asistente del <strong>Hotel Puerto Bandera</strong>. ¿En qué puedo ayudarte?');

  const opciones = ['🛏️ Habitaciones', '📍 Ubicación', '☕ Servicios', '📞 Quiero reservar'];
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:6px 8px;';

  opciones.forEach(opcion => {
    const btn = document.createElement('button');
    btn.textContent = opcion;
    btn.style.cssText = `
      background:#ffe8bf;border:1px solid #c89a3d;color:#3d2a00;
      border-radius:999px;padding:4px 12px;font-size:12px;cursor:pointer;
      font-family:'Inter',sans-serif;transition:background .15s;
    `;
    btn.addEventListener('mouseenter', () => btn.style.background = '#ffd98a');
    btn.addEventListener('mouseleave', () => btn.style.background = '#ffe8bf');
    btn.addEventListener('click', () => {
      wrap.remove();
      enviarMensaje(opcion);
    });
    wrap.appendChild(btn);
  });

  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Formulario de reserva
function mostrarFormularioReserva() {
  const inputStyle = `
    width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:6px;
    padding:6px 9px;font-size:12.5px;margin-bottom:5px;font-family:'Inter',sans-serif;
  `;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'background:#fff8ee;border:1px solid #c89a3d44;border-radius:8px;padding:10px;margin:4px 0;';
  wrap.innerHTML = `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#222;">Dejanos tus datos y te contactamos 😊</p>
    <input id="lead-nombre"   type="text" placeholder="Tu nombre"                          style="${inputStyle}">
    <input id="lead-checkin"  type="text" placeholder="Llegada (ej: 15 de mayo)"           style="${inputStyle}">
    <input id="lead-checkout" type="text" placeholder="Salida (ej: 18 de mayo)"            style="${inputStyle}">
    <input id="lead-hab"      type="text" placeholder="Habitación: doble / matrimonial / triple" style="${inputStyle}">
    <input id="lead-tel"      type="tel"  placeholder="Teléfono o email de contacto"       style="${inputStyle}">
    <button id="lead-enviar" style="width:100%;background:#1d2a36;color:#fff;border:none;border-radius:6px;padding:8px;font-size:13px;cursor:pointer;margin-top:2px;font-weight:600;">
      Enviar consulta
    </button>
  `;
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  document.getElementById('lead-enviar').addEventListener('click', () => {
    const nombre   = document.getElementById('lead-nombre').value.trim();
    const checkin  = document.getElementById('lead-checkin').value.trim();
    const checkout = document.getElementById('lead-checkout').value.trim();
    const hab      = document.getElementById('lead-hab').value.trim();
    const tel      = document.getElementById('lead-tel').value.trim();

    if (!nombre || !tel) {
      alert('Por favor ingresá al menos tu nombre y teléfono o email.');
      return;
    }

    wrap.remove();
    appendMessage('bot',
      `¡Gracias, <strong>${nombre}</strong>! 🎉 Recibimos tu consulta. ` +
      `Te contactamos pronto al <strong>${tel}</strong>. ` +
      `También podés llamarnos directamente al <a href="tel:+543414400930" style="color:#c89a3d;">+54 341 440 0930</a>.`
    );

    console.log('LEAD:', { nombre, checkin, checkout, hab, tel });
  });
}

// Llamada al Worker
async function llamarGemini(mensajeUsuario) {
  conversationHistory.push({
    role: 'user',
    parts: [{ text: mensajeUsuario }]
  });

  const typing = appendMessage('bot', '<em style="opacity:.5">Escribiendo...</em>');

  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: HOTEL_CONTEXT }] },
        contents: conversationHistory,
        generationConfig: { temperature: 0.65, maxOutputTokens: 300 }
      })
    });

    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'No pude procesar tu consulta. Llamanos al +54 341 440 0930.';

    conversationHistory.push({
      role: 'model',
      parts: [{ text: respuesta }]
    });

    typing.innerHTML = respuesta.replace(/\n/g, '<br>');

    // Si menciona reserva → mostrar formulario
    const palabrasReserva = ['reservar', 'reserva', 'habitación', 'disponibilidad', 'quiero quedarme'];
    if (palabrasReserva.some(p => mensajeUsuario.toLowerCase().includes(p))) {
      setTimeout(mostrarFormularioReserva, 600);
    }

  } catch (err) {
    console.error('Error:', err);
    typing.innerHTML = 'Hubo un problema. Llamanos al <a href="tel:+543414400930" style="color:#c89a3d;">+54 341 440 0930</a>.';
  }
}

function enviarMensaje(texto) {
  if (!texto) return;
  appendMessage('user', texto);
  chatInput.value = '';
  llamarGemini(texto);
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = chatInput.value.trim();
  if (texto) enviarMensaje(texto);
});
