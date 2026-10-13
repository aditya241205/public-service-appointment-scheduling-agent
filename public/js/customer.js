let services = [];
let selectedService = null;
let selectedDate = null;
let selectedSlot = null;
let rescheduleRef = null;

let chatHistory = [];

const byId = (id) => document.getElementById(id);

// Automatically route to backend if page is opened via file:// or different port (e.g. Live Server)
const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000'))
  ? 'http://localhost:3000'
  : '';

const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const formatDateYMD = (d) => d.toISOString().split('T')[0];
const dayLabel = (d) => new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);

function escapeText(s) {
  const d = document.createElement('div');
  d.textContent = String(s || '');
  return d.innerHTML;
}

function getStoredRefs() {
  try {
    return JSON.parse(localStorage.getItem('civicease-refs') || '[]');
  } catch {
    return [];
  }
}

function addStoredRef(ref) {
  const refs = getStoredRefs();
  if (!refs.includes(ref)) {
    refs.push(ref);
    localStorage.setItem('civicease-refs', JSON.stringify(refs));
  }
  updateCount();
}

function removeStoredRef(ref) {
  const refs = getStoredRefs().filter(r => r !== ref);
  localStorage.setItem('civicease-refs', JSON.stringify(refs));
  updateCount();
}

async function updateCount() {
  const countEl = byId('bookingCount');
  if (!countEl) return;
  const refs = getStoredRefs();
  countEl.textContent = refs.length;
}

// Fetch services from backend
async function fetchServices() {
  try {
    const res = await fetch(`${API_BASE}/api/services`);
    const data = await res.json();
    if (data.success) {
      services = data.services;
      renderServices();
    }
  } catch (err) {
    console.error('Failed to load services:', err);
    byId('noResults').textContent = 'Unable to connect to server. Please ensure backend is running.';
    byId('noResults').hidden = false;
  }
}

function renderServices(filter = '') {
  const grid = byId('serviceGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const list = services.filter(s => `${s.name} ${s.short}`.toLowerCase().includes(filter.toLowerCase()));
  byId('noResults').hidden = list.length > 0;

  list.forEach(s => {
    const card = document.createElement('article');
    card.className = 'service-card';
    card.innerHTML = `
      <div class="service-icon">${s.icon || 'DOC'}</div>
      <h3>${escapeText(s.name)}</h3>
      <p>${escapeText(s.short)}</p>
      <div class="service-meta">
        <span class="duration">Time: ${escapeText(s.duration)}</span>
        <button class="card-link" data-service="${s.id}">View and book <span>-&gt;</span></button>
      </div>
    `;
    grid.append(card);
  });
}

function showModal(content) {
  byId('modalContent').innerHTML = content;
  byId('modalBackdrop').hidden = false;
  document.body.classList.add('body-lock');
}

function closeModal() {
  byId('modalBackdrop').hidden = true;
  document.body.classList.remove('body-lock');
  selectedService = null;
  selectedDate = null;
  selectedSlot = null;
  rescheduleRef = null;
}

async function openService(id) {
  selectedService = services.find(s => s.id === id);
  if (!selectedService) return;

  const defaultDate = dayOffset(1);
  selectedDate = defaultDate;
  selectedSlot = null;

  const s = selectedService;
  showModal(`
    <div class="eyebrow">PUBLIC SERVICE</div>
    <h2 id="modalTitle">${escapeText(s.name)}</h2>
    <p>${escapeText(s.description)}</p>
    <div class="requirements">
      <h3>Required Checklist</h3>
      <ul>${s.requirements.map(x => `<li>${escapeText(x)}</li>`).join('')}</ul>
    </div>
    <label class="field-label" for="dateSelect">Select Date</label>
    <select id="dateSelect" class="form-grid" style="width:100%;border:1px solid #dfe6df;border-radius:6px;padding:10px;font:11px var(--sans)">
      ${[1, 2, 3, 4, 5].map(n => {
        const d = dayOffset(n);
        const ymd = formatDateYMD(d);
        return `<option value="${ymd}" ${n === 1 ? 'selected' : ''}>${dayLabel(d)} (${ymd})</option>`;
      }).join('')}
    </select>
    <label class="field-label">Available Time Slots</label>
    <div class="slot-grid" id="slotsContainer">
      <div style="grid-column:1/-1;font-size:11px;color:#77857c;">Loading slot availability...</div>
    </div>
    <div id="bookingForm"></div>
  `);

  await loadSlotGrid(s.id, formatDateYMD(defaultDate));
}

async function loadSlotGrid(serviceId, dateYmd) {
  const container = byId('slotsContainer');
  if (!container) return;
  container.innerHTML = '<div style="grid-column:1/-1;font-size:11px;color:#77857c;">Checking slots...</div>';

  try {
    const res = await fetch(`${API_BASE}/api/services/${serviceId}/slots?date=${dateYmd}`);
    const data = await res.json();
    if (!data.success || !data.slots) {
      container.innerHTML = `<div style="grid-column:1/-1;color:#b03434;">Unable to load slots.</div>`;
      return;
    }

    container.innerHTML = data.slots.map(slot => {
      const isSelected = selectedSlot === slot.time;
      const disabledAttr = !slot.available ? 'disabled' : '';
      const badge = !slot.available ? ` · ${slot.reason}` : '';
      return `<button class="slot ${isSelected ? 'selected' : ''}" data-slot="${escapeText(slot.time)}" ${disabledAttr}>${escapeText(slot.time)}${badge}</button>`;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="grid-column:1/-1;color:#b03434;">Error loading slots.</div>`;
  }
}

function showBookingForm() {
  if (!selectedSlot) return;
  byId('bookingForm').innerHTML = `
    <form id="bookForm" style="margin-top:16px;">
      <div class="form-grid">
        <label>Your Name<input name="name" required placeholder="Full Name (e.g. John Doe)" maxlength="60"></label>
        <label>Email Address<input name="email" type="email" required placeholder="you@example.com"></label>
      </div>
      <button class="primary-button modal-action" type="submit">
        ${rescheduleRef ? 'Confirm Reschedule' : 'Confirm Appointment'} <span>-&gt;</span>
      </button>
    </form>
  `;
  byId('bookingForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function openBookings() {
  showModal(`
    <div class="eyebrow">YOUR VISITS</div>
    <h2 id="modalTitle">My Appointments</h2>
    <p>Track, reschedule, or cancel your booked visits.</p>
    <div id="bookingList" style="margin-top:16px;">
      <div style="font-size:12px;color:#7a8a80;">Fetching bookings...</div>
    </div>
  `);

  const listEl = byId('bookingList');
  const storedRefs = getStoredRefs();

  try {
    const res = await fetch(`${API_BASE}/api/bookings`);
    const data = await res.json();
    let userBookings = [];
    if (data.success && data.bookings) {
      userBookings = data.bookings.filter(b => storedRefs.includes(b.ref));
    }

    if (!userBookings.length) {
      listEl.innerHTML = '<div class="empty-bookings">You have no active appointments saved.<br>Pick a service below or ask the AI Agent to book one.</div>';
      return;
    }

    listEl.innerHTML = userBookings.map(b => `
      <article class="booking-item">
        <div style="display:flex;justify-content:space-between;align-items:start;">
          <h3>${escapeText(b.serviceName)}</h3>
          <span class="badge-status ${b.status}">${escapeText(b.status)}</span>
        </div>
        <p><strong>Date & Time:</strong> ${escapeText(b.dateLabel || b.date)} · ${escapeText(b.time)}</p>
        <p><strong>Citizen:</strong> ${escapeText(b.name)} (${escapeText(b.email)})</p>
        <span class="booking-id">Reference ID: <strong>${escapeText(b.ref)}</strong></span>
        ${b.status === 'confirmed' ? `
          <div class="booking-actions">
            <button class="text-action" data-reschedule="${escapeText(b.ref)}" data-service="${b.serviceId}">Reschedule</button>
            <button class="text-action" style="color:#b23535;border-color:#f3d4d4;" data-cancel="${escapeText(b.ref)}">Cancel</button>
          </div>
        ` : ''}
      </article>
    `).join('');
  } catch (err) {
    listEl.innerHTML = '<div class="empty-bookings" style="color:#b23535;">Failed to fetch bookings.</div>';
  }
}

async function startReschedule(ref, serviceId) {
  rescheduleRef = ref;
  await openService(serviceId);
  const title = byId('modalTitle');
  if (title) title.textContent = `Reschedule Appointment (${ref})`;
}

// Event Listeners for UI
document.addEventListener('DOMContentLoaded', () => {
  fetchServices();
  updateCount();

  byId('serviceGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-service]');
    if (b) openService(b.dataset.service);
  });

  byId('serviceSearch').addEventListener('input', e => renderServices(e.target.value));
  byId('openBookings').addEventListener('click', openBookings);
  byId('closeModal').addEventListener('click', closeModal);
  byId('modalBackdrop').addEventListener('click', e => {
    if (e.target === byId('modalBackdrop')) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeAssistant();
    }
  });

  byId('modalContent').addEventListener('change', async e => {
    if (e.target.id === 'dateSelect' && selectedService) {
      selectedDate = new Date(e.target.value);
      selectedSlot = null;
      byId('bookingForm').innerHTML = '';
      await loadSlotGrid(selectedService.id, e.target.value);
    }
  });

  byId('modalContent').addEventListener('click', async e => {
    const slotBtn = e.target.closest('[data-slot]');
    if (slotBtn && !slotBtn.disabled) {
      selectedSlot = slotBtn.dataset.slot;
      byId('modalContent').querySelectorAll('.slot').forEach(x => x.classList.toggle('selected', x === slotBtn));
      showBookingForm();
      return;
    }

    const cancelBtn = e.target.closest('[data-cancel]');
    if (cancelBtn) {
      const ref = cancelBtn.dataset.cancel;
      if (confirm(`Cancel appointment ${ref}?`)) {
        try {
          const res = await fetch(`${API_BASE}/api/bookings/${ref}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: 'Citizen cancelled from portal' })
          });
          const data = await res.json();
          if (data.success) {
            alert('Appointment cancelled.');
            await openBookings();
          } else {
            alert(data.error || 'Failed to cancel appointment.');
          }
        } catch (err) {
          alert('Network error while cancelling.');
        }
      }
      return;
    }

    const resBtn = e.target.closest('[data-reschedule]');
    if (resBtn) {
      startReschedule(resBtn.dataset.reschedule, resBtn.dataset.service);
      return;
    }
  });

  byId('modalContent').addEventListener('submit', async e => {
    if (e.target.id !== 'bookForm') return;
    e.preventDefault();

    const data = new FormData(e.target);
    const name = String(data.get('name')).trim();
    const email = String(data.get('email')).trim();
    if (!name || !email || !selectedSlot) return;

    const dateYmd = formatDateYMD(selectedDate || dayOffset(1));

    if (rescheduleRef) {
      try {
        const res = await fetch(`${API_BASE}/api/bookings/${rescheduleRef}/reschedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newDate: dateYmd,
            newTime: selectedSlot
          })
        });
        const result = await res.json();
        if (result.success) {
          showModal(`
            <div class="eyebrow">APPOINTMENT UPDATED</div>
            <h2 id="modalTitle">Rescheduled Successfully</h2>
            <p>Your appointment has been rescheduled to the new time slot.</p>
            <div class="notice">
              <strong>${escapeText(result.booking.serviceName)}</strong><br>
              ${escapeText(result.booking.dateLabel || dateYmd)} · ${escapeText(selectedSlot)}<br>
              Reference ID: <strong>${escapeText(result.booking.ref)}</strong><br><br>
              Please bring the required documents. A confirmation has been registered.
            </div>
            <button class="primary-button modal-action" id="doneButton">Done</button>
          `);
          byId('doneButton').addEventListener('click', closeModal);
        } else {
          alert(result.error || 'Failed to reschedule.');
        }
      } catch (err) {
        alert('Network error while rescheduling.');
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: selectedService.id,
            date: dateYmd,
            time: selectedSlot,
            name,
            email
          })
        });
        const result = await res.json();
        if (result.success) {
          addStoredRef(result.booking.ref);
          showModal(`
            <div class="eyebrow">CONFIRMED</div>
            <h2 id="modalTitle">Appointment Confirmed!</h2>
            <p>Your visit has been reserved in the civic appointment system.</p>
            <div class="notice">
              <strong>${escapeText(result.booking.serviceName)}</strong><br>
              ${escapeText(result.booking.dateLabel || dateYmd)} · ${escapeText(selectedSlot)}<br>
              Reference ID: <strong>${escapeText(result.booking.ref)}</strong><br><br>
              Please arrive 10 minutes early with your photo ID and checklist items.
            </div>
            <button class="primary-button modal-action" id="doneButton">Done</button>
          `);
          byId('doneButton').addEventListener('click', closeModal);
        } else {
          alert(result.error || 'Failed to confirm booking.');
        }
      } catch (err) {
        alert('Network error during booking.');
      }
    }
  });

  // Assistant Drawer Logic
  const panel = byId('assistantPanel');
  function closeAssistant() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }
  function openAssistant() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    byId('chatInput').focus();
  }

  byId('assistantFab').addEventListener('click', openAssistant);
  byId('openAssistant').addEventListener('click', openAssistant);
  byId('closeAssistant').addEventListener('click', closeAssistant);

  // Agent Chat Form
  byId('chatForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = byId('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addChatMessage(text, 'user');
    chatHistory.push({ role: 'user', content: text });

    const loadingId = 'agentLoadingMsg';
    const loadDiv = document.createElement('div');
    loadDiv.id = loadingId;
    loadDiv.className = 'message bot';
    loadDiv.innerHTML = `<span class="agent-loading"><span class="agent-spinner"></span> CivicEase Agent is thinking & executing tools...</span>`;
    byId('chatMessages').append(loadDiv);
    byId('chatMessages').scrollTop = byId('chatMessages').scrollHeight;

    try {
      const res = await fetch(`${API_BASE}/api/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'customer',
          messages: chatHistory
        })
      });

      const data = await res.json();
      const loadEl = byId(loadingId);
      if (loadEl) loadEl.remove();

      if (data.success) {
        if (data.actionsTaken && data.actionsTaken.length > 0) {
          data.actionsTaken.forEach(action => {
            const badge = document.createElement('div');
            badge.className = 'agent-action-badge';
            const detailStr = JSON.stringify(action.arguments || {});
            badge.innerHTML = `
              <div class="badge-title">[Tool Action] Autonomous Tool: <code>${escapeText(action.tool)}</code></div>
              <div class="badge-detail">Args: ${escapeText(detailStr)}</div>
            `;
            byId('chatMessages').append(badge);

            if (action.tool === 'book_appointment' && action.result && action.result.ref) {
              addStoredRef(action.result.ref);
            }
          });
        }

        addChatMessage(data.reply, 'bot');
        chatHistory.push({ role: 'assistant', content: data.reply });
      } else {
        addChatMessage(`Agent error: ${data.error || 'Could not process request.'}`, 'bot');
      }
    } catch (err) {
      const loadEl = byId(loadingId);
      if (loadEl) loadEl.remove();
      addChatMessage('Error communicating with Agent service.', 'bot');
    }
  });

  byId('chatMessages').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    byId('chatInput').value = b.textContent;
    byId('chatForm').requestSubmit();
  });
});

function addChatMessage(text, who) {
  const el = document.createElement('div');
  el.className = `message ${who}`;
  el.textContent = text;
  byId('chatMessages').append(el);
  byId('chatMessages').scrollTop = byId('chatMessages').scrollHeight;
}
