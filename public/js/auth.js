// CivicEase JWT Authentication Client Module
const AUTH_API_BASE = (window.location.protocol === 'file:' || (window.location.hostname === 'localhost' && window.location.port !== '3000') || (window.location.hostname === '127.0.0.1' && window.location.port !== '3000'))
  ? 'http://localhost:3000'
  : '';

function getAuthToken() {
  return localStorage.getItem('civicease_jwt') || null;
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('civicease_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAuthHeaders() {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function saveAuth(token, user) {
  localStorage.setItem('civicease_jwt', token);
  localStorage.setItem('civicease_user', JSON.stringify(user));
  updateAuthTopbars();
}

function logout() {
  localStorage.removeItem('civicease_jwt');
  localStorage.removeItem('civicease_user');
  updateAuthTopbars();
  if (window.location.pathname.includes('retailer.html')) {
    checkOfficerGate();
  }
}

function updateAuthTopbars() {
  const user = getCurrentUser();
  const authNav = document.getElementById('authNavContainer');
  if (!authNav) return;

  if (user) {
    authNav.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:11px;font-weight:700;background:#e2ece0;color:#285b49;padding:5px 9px;border-radius:12px;">
          ${escapeAuthText(user.name)} (${user.role === 'officer' ? 'Officer' : 'Citizen'})
        </span>
        <button id="logoutBtn" style="border:1px solid #dce4dc;background:#fff;border-radius:7px;padding:6px 10px;font:600 11px var(--sans);color:#833;cursor:pointer;">
          Sign Out
        </button>
      </div>
    `;
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
  } else {
    authNav.innerHTML = `
      <button id="loginOpenBtn" style="border:1px solid #dce4dc;background:#fff;border-radius:7px;padding:6px 12px;font:600 11px var(--sans);color:#285b49;cursor:pointer;">
        Sign In / Register
      </button>
    `;
    const loginOpenBtn = document.getElementById('loginOpenBtn');
    if (loginOpenBtn) loginOpenBtn.addEventListener('click', () => openAuthModal('login'));
  }
}

function escapeAuthText(s) {
  const d = document.createElement('div');
  d.textContent = String(s || '');
  return d.innerHTML;
}

// Render Authentication Modal
function openAuthModal(defaultTab = 'login', onSuccess = null) {
  let modalBackdrop = document.getElementById('authModalBackdrop');
  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'authModalBackdrop';
    modalBackdrop.className = 'modal-backdrop';
    document.body.appendChild(modalBackdrop);
  }

  modalBackdrop.hidden = false;
  document.body.classList.add('body-lock');

  modalBackdrop.innerHTML = `
    <section class="modal" role="dialog" aria-modal="true" style="max-width:440px;">
      <button class="close-modal" id="closeAuthModal" aria-label="Close">x</button>
      <div class="eyebrow">CIVICEASE SECURE ACCESS</div>
      <h2 id="authModalTitle" style="margin:6px 0 14px;">Account Access</h2>
      
      <div style="display:flex;gap:6px;background:#f0f4ee;padding:4px;border-radius:8px;margin-bottom:16px;">
        <button id="tabLoginBtn" style="flex:1;border:0;border-radius:6px;padding:8px;font:700 11px var(--sans);cursor:pointer;background:${defaultTab==='login'?'#fff':'transparent'};color:${defaultTab==='login'?'#285b49':'#6a7a70'};">
          Sign In
        </button>
        <button id="tabRegisterBtn" style="flex:1;border:0;border-radius:6px;padding:8px;font:700 11px var(--sans);cursor:pointer;background:${defaultTab==='register'?'#fff':'transparent'};color:${defaultTab==='register'?'#285b49':'#6a7a70'};">
          Register
        </button>
      </div>

      <div id="authAlert" style="display:none;background:#fde8e8;color:#9b1c1c;padding:9px 12px;border-radius:6px;font-size:11px;margin-bottom:12px;"></div>

      <form id="authForm" style="display:grid;gap:12px;">
        <div id="nameFieldGroup" style="display:${defaultTab==='register'?'grid':'none'};gap:5px;">
          <label style="font-size:10px;font-weight:700;">Full Name</label>
          <input id="authNameInput" type="text" placeholder="e.g. Rahul Verma" style="border:1px solid #dfe6df;border-radius:6px;padding:10px;font:11px var(--sans);" />
        </div>

        <div style="display:grid;gap:5px;">
          <label style="font-size:10px;font-weight:700;">Email Address</label>
          <input id="authEmailInput" type="email" required placeholder="you@example.com" style="border:1px solid #dfe6df;border-radius:6px;padding:10px;font:11px var(--sans);" />
        </div>

        <div style="display:grid;gap:5px;">
          <label style="font-size:10px;font-weight:700;">Password</label>
          <input id="authPasswordInput" type="password" required placeholder="Enter password" style="border:1px solid #dfe6df;border-radius:6px;padding:10px;font:11px var(--sans);" />
        </div>

        <div id="roleFieldGroup" style="display:${defaultTab==='register'?'grid':'none'};gap:5px;">
          <label style="font-size:10px;font-weight:700;">Account Role</label>
          <select id="authRoleInput" style="border:1px solid #dfe6df;border-radius:6px;padding:10px;font:11px var(--sans);">
            <option value="citizen">Citizen (Appointment Booker)</option>
            <option value="officer">Officer (Center Administrator)</option>
          </select>
        </div>

        <button type="submit" class="primary-button modal-action" style="margin-top:8px;">
          <span id="authSubmitText">${defaultTab==='login'?'Sign In with JWT':'Create Account & Generate JWT'}</span>
          <span>-&gt;</span>
        </button>
      </form>

      <div style="margin-top:16px;border-top:1px solid #edf1ec;padding-top:12px;font-size:10px;color:#7a8a80;">
        <div style="font-weight:700;margin-bottom:6px;">Quick 1-Click Demo Accounts:</div>
        <div style="display:flex;gap:6px;">
          <button id="quickCitizenBtn" style="border:1px solid #dce4dc;background:#f9fbf9;border-radius:5px;padding:5px 8px;font:600 10px var(--sans);cursor:pointer;color:#355642;">
            Demo Citizen (Rahul)
          </button>
          <button id="quickOfficerBtn" style="border:1px solid #dce4dc;background:#f9fbf9;border-radius:5px;padding:5px 8px;font:600 10px var(--sans);cursor:pointer;color:#285b49;">
            Demo Officer (Admin)
          </button>
        </div>
      </div>
    </section>
  `;

  let currentTab = defaultTab;
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const nameGroup = document.getElementById('nameFieldGroup');
  const roleGroup = document.getElementById('roleFieldGroup');
  const submitText = document.getElementById('authSubmitText');
  const alertBox = document.getElementById('authAlert');

  function setTab(tab) {
    currentTab = tab;
    alertBox.style.display = 'none';
    if (tab === 'login') {
      tabLoginBtn.style.background = '#fff';
      tabLoginBtn.style.color = '#285b49';
      tabRegisterBtn.style.background = 'transparent';
      tabRegisterBtn.style.color = '#6a7a70';
      nameGroup.style.display = 'none';
      roleGroup.style.display = 'none';
      submitText.textContent = 'Sign In with JWT';
    } else {
      tabRegisterBtn.style.background = '#fff';
      tabRegisterBtn.style.color = '#285b49';
      tabLoginBtn.style.background = 'transparent';
      tabLoginBtn.style.color = '#6a7a70';
      nameGroup.style.display = 'grid';
      roleGroup.style.display = 'grid';
      submitText.textContent = 'Create Account & Generate JWT';
    }
  }

  tabLoginBtn.addEventListener('click', () => setTab('login'));
  tabRegisterBtn.addEventListener('click', () => setTab('register'));

  // Quick pre-fill buttons
  document.getElementById('quickCitizenBtn').addEventListener('click', () => {
    setTab('login');
    document.getElementById('authEmailInput').value = 'rahul@gmail.com';
    document.getElementById('authPasswordInput').value = 'password123';
  });
  document.getElementById('quickOfficerBtn').addEventListener('click', () => {
    setTab('login');
    document.getElementById('authEmailInput').value = 'officer@civicease.gov';
    document.getElementById('authPasswordInput').value = 'admin123';
  });

  // Close modal
  document.getElementById('closeAuthModal').addEventListener('click', closeAuthModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeAuthModal();
  });

  // Handle Form Submission
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmailInput').value.trim();
    const password = document.getElementById('authPasswordInput').value.trim();
    const name = document.getElementById('authNameInput').value.trim();
    const role = document.getElementById('authRoleInput').value;

    alertBox.style.display = 'none';

    try {
      const endpoint = currentTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = currentTab === 'login'
        ? { email, password }
        : { name, email, password, role };

      const res = await fetch(`${AUTH_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.success && data.token) {
        saveAuth(data.token, data.user);
        closeAuthModal();
        if (onSuccess) onSuccess(data.user);
        if (window.location.pathname.includes('retailer.html')) {
          checkOfficerGate();
        }
      } else {
        alertBox.textContent = data.error || 'Authentication failed.';
        alertBox.style.display = 'block';
      }
    } catch (err) {
      alertBox.textContent = 'Network error during authentication.';
      alertBox.style.display = 'block';
    }
  });
}

function closeAuthModal() {
  const modalBackdrop = document.getElementById('authModalBackdrop');
  if (modalBackdrop) modalBackdrop.hidden = true;
  document.body.classList.remove('body-lock');
}

// Check officer access gate on retailer.html
function checkOfficerGate() {
  const user = getCurrentUser();
  const gate = document.getElementById('officerAccessGate');
  const mainDash = document.querySelector('.dash-container');

  if (!gate) return;

  if (!user || user.role !== 'officer') {
    gate.style.display = 'flex';
    if (mainDash) mainDash.style.filter = 'blur(4px)';
  } else {
    gate.style.display = 'none';
    if (mainDash) mainDash.style.filter = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthTopbars();
  if (window.location.pathname.includes('retailer.html')) {
    checkOfficerGate();
  }
});
