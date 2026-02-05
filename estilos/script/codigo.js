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

// Chatbot (placeholder)
// Cuando tengas tu webhook, reemplazá este valor.
const CHAT_WEBHOOK_URL = 'https://chatboothpb.up.railway.app/webhook/3d6ca3d4-b253-424f-8e2c-66c0a0e5daa2/chat';

const chatToggle = document.getElementById('chat-toggle');
const chatBox = document.getElementById('chatbot');
const chatClose = document.getElementById('chat-close');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

chatToggle.addEventListener('click', () => chatBox.classList.toggle('hidden'));
chatClose.addEventListener('click', () => chatBox.classList.add('hidden'));

function appendMessage(type, text) {
  const p = document.createElement('p');
  p.className = type;
  p.textContent = text;
  chatMessages.appendChild(p);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  chatInput.value = '';

  if (!CHAT_WEBHOOK_URL) {
    appendMessage('bot', 'Webhook aún no configurado. Más adelante conectaremos este chat con tu backend.');
    return;
  }

  try {
    const res = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    if (!res.ok) throw new Error('Error en respuesta del webhook');

    const data = await res.json();
    appendMessage('bot', data.reply || 'Mensaje recibido.');
  } catch (err) {
    appendMessage('bot', 'No pude conectar con el asistente en este momento.');
  }
});
