let servicesList = [];
let officerChatHistory = [];

const byId = (id) => document.getElementById(id);

function escapeText(s) {
  const d = document.createElement('div');
  d.textContent = String(s || '');
  return d.innerHTML;
}

const formatDateYMD = (d) => d.toISOString().split('T')[0];

document.addEventListener('DOMContentLoaded', async () => {
  const today = new Date();
  byId('currentDateDisplay').textContent = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
  }).format(today);

  const todayYmd = formatDateYMD(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowYmd = formatDateYMD(tomorrow);

  byId('slotMatrixDate').value = tomorrowYmd;

  await loadServices();
  await loadAnalytics();
  await loadBookings();
  await loadSlotMatrix();

  byId('filterDate').addEventListener('change', loadBookings);
  byId('filterService').addEventListener('change', loadBookings);
  byId('filterStatus').addEventListener('change', loadBookings);
  byId('filterSearch').addEventListener('input', debounce(loadBookings, 300));

  byId('slotMatrixService').addEventListener('change', loadSlotMatrix);
  byId('slotMatrixDate').addEventListener('change', loadSlotMatrix);

  byId('closeOfficerModal').addEventListener('click', closeOfficerModal);
  byId('officerModalBackdrop').addEventListener('click', e => {
    if (e.target === byId('officerModalBackdrop')) closeOfficerModal();
  });

  const panel = byId('officerAssistantPanel');
  const openOfficerChat = () => {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    byId('officerChatInput').focus();
  };
  const closeOfficerChat = () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  };

  byId('openOfficerChatBtn').addEventListener('click', openOfficerChat);
  byId('officerAssistantFab').addEventListener('click', openOfficerChat);
  byId('closeOfficerAssistant').addEventListener('click', closeOfficerChat);

  byId('officerChatMessages').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    byId('officerChatInput').value = btn.textContent;
    byId('officerChatForm').requestSubmit();
  });

  byId('officerChatForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = byId('officerChatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addOfficerChatMessage(text, 'user');
    officerChatHistory.push({ role: 'user', content: text });

    const loadingId = 'officerAgentLoading';
    const loadDiv = document.createElement('div');
    loadDiv.id = loadingId;
    loadDiv.className = 'message bot';
    loadDiv.innerHTML = `<span class="agent-loading"><span class="agent-spinner"></span> Operations Agent is executing operations tools...</span>`;
    byId('officerChatMessages').append(loadDiv);
    byId('officerChatMessages').scrollTop = byId('officerChatMessages').scrollHeight;

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'retailer',
          messages: officerChatHistory
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
              <div class="badge-title">[Operations Action] Autonomous Tool: <code>${escapeText(action.tool)}</code></div>
              <div class="badge-detail">Args: ${escapeText(detailStr)}</div>
            `;
            byId('officerChatMessages').append(badge);
          });

          await loadBookings();
          await loadSlotMatrix();
          await loadAnalytics();
        }

        addOfficerChatMessage(data.reply, 'bot');
        officerChatHistory.push({ role: 'assistant', content: data.reply });
      } else {
        addOfficerChatMessage(`Error: ${data.error || 'Agent request failed.'}`, 'bot');
      }
    } catch (err) {
      const loadEl = byId(loadingId);
      if (loadEl) loadEl.remove();
      addOfficerChatMessage('Network error communicating with agent.', 'bot');
    }
  });
});

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

async function loadServices() {
  try {
    const res = await fetch('/api/services');
    const data = await res.json();
    if (data.success) {
      servicesList = data.services;

      const filterSelect = byId('filterService');
      const matrixSelect = byId('slotMatrixService');

      filterSelect.innerHTML = '<option value="">All Services</option>';
      matrixSelect.innerHTML = '';

      servicesList.forEach(s => {
        filterSelect.innerHTML += `<option value="${s.id}">${escapeText(s.name)}</option>`;
        matrixSelect.innerHTML += `<option value="${s.id}">${escapeText(s.name)}</option>`;
      });
    }
  } catch (err) {
    console.error('Failed to load services:', err);
  }
}

async function loadAnalytics() {
  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    if (data.success && data.analytics) {
      const a = data.analytics;
      byId('statTotalBookings').textContent = a.totalBookings || 0;
      byId('statActiveBookings').textContent = a.activeBookings || 0;
      byId('statCancelledBookings').textContent = a.cancelledBookings || 0;
      byId('statBlockedSlots').textContent = a.blockedSlotsCount || 0;
    }
  } catch (err) {
    console.error('Failed to load analytics:', err);
  }
}

async function loadBookings() {
  const tbody = byId('bookingsTableBody');
  const date = byId('filterDate').value;
  const serviceId = byId('filterService').value;
  const status = byId('filterStatus').value;
  const query = byId('filterSearch').value.trim();

  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (serviceId) params.append('serviceId', serviceId);
  if (status) params.append('status', status);
  if (query) params.append('query', query);

  try {
    const res = await fetch(`/api/bookings?${params.toString()}`);
    const data = await res.json();

    if (!data.success || !data.bookings || data.bookings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#7a8a80;padding:24px;">No appointment records match the selected filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.bookings.map(b => `
      <tr>
        <td><strong>${escapeText(b.ref)}</strong></td>
        <td>
          <div style="font-weight:600;">${escapeText(b.name)}</div>
          <div style="font-size:10px;color:#6b7c72;">${escapeText(b.email)}</div>
        </td>
        <td>${escapeText(b.serviceName)}</td>
        <td>
          <div>${escapeText(b.dateLabel || b.date)}</div>
          <div style="font-weight:600;color:#285b49;">${escapeText(b.time)}</div>
        </td>
        <td>
          <span class="badge-status ${b.status}">${escapeText(b.status)}</span>
        </td>
        <td>
          <div class="table-actions">
            ${b.status === 'confirmed' ? `
              <button class="table-btn" onclick="openOfficerRescheduleModal('${escapeText(b.ref)}', '${escapeText(b.serviceId)}')">Reschedule</button>
              <button class="table-btn danger" onclick="officerCancelBooking('${escapeText(b.ref)}')">Cancel</button>
            ` : `
              <span style="font-size:10px;color:#88998e;">${b.cancellationReason || 'No actions'}</span>
            `}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#b03434;padding:24px;">Error loading bookings.</td></tr>`;
  }
}

async function loadSlotMatrix() {
  const container = byId('slotManagerContainer');
  const serviceId = byId('slotMatrixService').value || (servicesList[0] && servicesList[0].id);
  const date = byId('slotMatrixDate').value;

  if (!serviceId || !date) return;

  container.innerHTML = '<div style="grid-column:1/-1;font-size:12px;color:#7a8a80;">Loading slot matrix...</div>';

  try {
    const res = await fetch(`/api/services/${serviceId}/slots?date=${date}`);
    const data = await res.json();

    if (!data.success || !data.slots) {
      container.innerHTML = '<div style="grid-column:1/-1;color:#b03434;">Unable to load slots.</div>';
      return;
    }

    container.innerHTML = data.slots.map(slot => {
      const isBlocked = slot.status === 'blocked';
      const isFull = slot.status === 'full';
      const actionType = isBlocked ? 'unblock' : 'block';
      const btnText = isBlocked ? 'Unblock Slot' : 'Block Slot';

      return `
        <div class="slot-block-item ${isBlocked ? 'is-blocked' : (isFull ? 'is-full' : '')}">
          <div>
            <div class="slot-time">${escapeText(slot.time)}</div>
            <div class="slot-status-label">${escapeText(slot.reason)}</div>
          </div>
          <button class="slot-block-btn" onclick="toggleSlotBlock('${escapeText(serviceId)}', '${escapeText(date)}', '${escapeText(slot.time)}', '${actionType}')">
            ${btnText}
          </button>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<div style="grid-column:1/-1;color:#b03434;">Error fetching slots.</div>';
  }
}

window.toggleSlotBlock = async function (serviceId, date, time, action) {
  try {
    const res = await fetch('/api/slots/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, date, time, action })
    });
    const data = await res.json();
    if (data.success) {
      await loadSlotMatrix();
      await loadAnalytics();
    } else {
      alert(data.error || 'Failed to update slot.');
    }
  } catch (err) {
    alert('Network error while toggling slot.');
  }
};

window.officerCancelBooking = async function (ref) {
  const reason = prompt(`Enter administrative cancellation reason for ${ref}:`, 'Officer administrative cancellation');
  if (reason === null) return;

  try {
    const res = await fetch(`/api/bookings/${ref}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Booking ${ref} cancelled.`);
      await loadBookings();
      await loadAnalytics();
      await loadSlotMatrix();
    } else {
      alert(data.error || 'Failed to cancel booking.');
    }
  } catch (err) {
    alert('Network error while cancelling.');
  }
};

window.openOfficerRescheduleModal = async function (ref, serviceId) {
  const modal = byId('officerModalContent');
  modal.innerHTML = `
    <div class="eyebrow">OFFICER ACTIONS</div>
    <h2>Reschedule Booking ${escapeText(ref)}</h2>
    <p>Select a new appointment date and time for the citizen.</p>
    <div style="margin:16px 0;">
      <label class="field-label">Select New Date</label>
      <input type="date" id="officerRescheduleDate" class="filter-input" style="width:100%;margin-bottom:12px;" />
      <label class="field-label">Available Slots</label>
      <div class="slot-grid" id="officerRescheduleSlots">Select a date above...</div>
    </div>
    <button class="primary-button modal-action" id="officerConfirmRescheduleBtn" disabled>
      Confirm New Time <span>-&gt;</span>
    </button>
  `;

  byId('officerModalBackdrop').hidden = false;

  const dateInput = byId('officerRescheduleDate');
  const slotsDiv = byId('officerRescheduleSlots');
  const confirmBtn = byId('officerConfirmRescheduleBtn');
  let chosenSlot = null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  dateInput.value = formatDateYMD(tomorrow);

  const loadRescheduleSlots = async () => {
    const d = dateInput.value;
    if (!d) return;
    slotsDiv.innerHTML = 'Loading slots...';
    try {
      const res = await fetch(`/api/services/${serviceId}/slots?date=${d}`);
      const data = await res.json();
      if (data.success && data.slots) {
        slotsDiv.innerHTML = data.slots.map(s => `
          <button class="slot ${chosenSlot === s.time ? 'selected' : ''}" data-time="${s.time}" ${!s.available ? 'disabled' : ''}>
            ${s.time} ${!s.available ? `(${s.reason})` : ''}
          </button>
        `).join('');
      }
    } catch {
      slotsDiv.innerHTML = 'Error loading slots.';
    }
  };

  dateInput.addEventListener('change', loadRescheduleSlots);
  await loadRescheduleSlots();

  slotsDiv.addEventListener('click', e => {
    const btn = e.target.closest('[data-time]');
    if (btn && !btn.disabled) {
      chosenSlot = btn.dataset.time;
      slotsDiv.querySelectorAll('.slot').forEach(b => b.classList.toggle('selected', b === btn));
      confirmBtn.disabled = false;
    }
  });

  confirmBtn.addEventListener('click', async () => {
    if (!chosenSlot) return;
    try {
      const res = await fetch(`/api/bookings/${ref}/reschedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: dateInput.value,
          newTime: chosenSlot
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Booking ${ref} rescheduled successfully!`);
        closeOfficerModal();
        await loadBookings();
        await loadSlotMatrix();
      } else {
        alert(data.error || 'Failed to reschedule.');
      }
    } catch {
      alert('Network error during reschedule.');
    }
  });
};

function closeOfficerModal() {
  byId('officerModalBackdrop').hidden = true;
}

function addOfficerChatMessage(text, who) {
  const el = document.createElement('div');
  el.className = `message ${who}`;
  el.textContent = text;
  byId('officerChatMessages').append(el);
  byId('officerChatMessages').scrollTop = byId('officerChatMessages').scrollHeight;
}
