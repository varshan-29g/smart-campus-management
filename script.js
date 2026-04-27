/* ══════════════════════════════════════
   SMART CAMPUS — COMPLETE SCRIPT
   GAT, Bengaluru
══════════════════════════════════════ */

/* ── PAGE NAVIGATION ── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return false;
}

/* ════════════════════════════════════
   STUDENT DATA STORE
════════════════════════════════════ */

let STUDENTS = [];

async function loadStudents() {
  const res = await fetch("http://localhost:5000/students");
  const data = await res.json();

  STUDENTS = data;

  renderStudentTable();   // refresh table
}
async function addNewStudent() {
  const id = document.getElementById('new-id').value;
  const name = document.getElementById('new-name').value;
  const dept = document.getElementById('new-dept').value;
  const sem = document.getElementById('new-sem').value;

  try {
    const res = await fetch("http://localhost:5000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id,
        name,
        dept,
        sem
      })
    });

    const data = await res.text();

    console.log(data);

    alert("Student Added Successfully");

    loadStudents();

  } catch (err) {
    console.error(err);
    alert("Error adding student");
  }
}
  async function addNewStudent() {
  const id = document.getElementById('new-id').value;
  const name = document.getElementById('new-name').value;
  const dept = document.getElementById('new-dept').value;
  const sem = document.getElementById('new-sem').value;

  try {
    await fetch("http://localhost:5000/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id,
        name,
        dept,
        sem
      })
    });

    alert("Student Added Successfully");

    loadStudents();

  } catch (err) {
    console.error(err);
    alert("Error adding student");
  }
}

async function acDeleteStudent(id) {
  await fetch(`http://localhost:5000/students/${id}`, {
    method: "DELETE"
  });

  loadStudents(); // refresh
}
/* ════════════════════════════════════
   ATTENDANCE PORTAL
════════════════════════════════════ */
function attendanceLogin() {
  const inputVal = document.getElementById('att-student-id').value.trim().toUpperCase();
  const errEl = document.getElementById('att-login-error');
  errEl.textContent = '';

  if (!inputVal) {
    errEl.textContent = 'Please enter your Student ID.';
    return;
  }

  const student = STUDENTS.find(s => s.id === inputVal);
  if (!student) {
    errEl.textContent = '❌ Student ID not found. Please check and try again.';
    return;
  }

  // Hide login, show dashboard
  document.getElementById('att-login-screen').style.display = 'none';
  document.getElementById('att-dashboard-screen').style.display = 'block';

  renderAttendanceDashboard(student);
}

function attendanceLogout() {
  document.getElementById('att-login-screen').style.display = 'block';
  document.getElementById('att-dashboard-screen').style.display = 'none';
  document.getElementById('att-student-id').value = '';
  document.getElementById('att-login-error').textContent = '';
}

function computeOverall(student) {
  let totalPresent = 0, totalHeld = 0;
  student.subjects.forEach(s => { totalPresent += s.present; totalHeld += s.held; });
  return { totalPresent, totalHeld, pct: Math.round((totalPresent / totalHeld) * 100) };
}

function renderAttendanceDashboard(student) {
  document.getElementById('att-dash-name').textContent = student.name;
  document.getElementById('att-dash-info').textContent = `${student.id} · ${student.dept} · ${student.sem} Semester`;

  const { totalPresent, totalHeld, pct } = computeOverall(student);
  const totalAbsent = totalHeld - totalPresent;

  document.getElementById('att-total-present').textContent = totalPresent;
  document.getElementById('att-total-held').textContent = totalHeld;
  document.getElementById('att-total-absent').textContent = totalAbsent;

  // Animate semicircle gauge
  // Arc path: from (20,115) to (200,115) — semicircle with r=90
  // Total arc length ≈ π * 90 ≈ 283
  const ARC_LEN = 283;
  const arcEl = document.getElementById('att-gauge-arc');
  const pctEl = document.getElementById('att-gauge-pct');
  const statusEl = document.getElementById('att-gauge-status');

  const dashOffset = ARC_LEN - (pct / 100) * ARC_LEN;

  // Color by status
  let color = '#5BC8C5', statusText = '✓ Good Standing', statusClass = 'good';
  if (pct < 75) { color = '#ef5350'; statusText = '✗ Below Minimum'; statusClass = 'danger'; }
  else if (pct < 85) { color = '#FFD600'; statusText = '⚠ Near Threshold'; statusClass = 'warn'; }

  arcEl.setAttribute('stroke', color);
  setTimeout(() => {
    arcEl.style.strokeDashoffset = dashOffset;
    arcEl.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)';
  }, 100);

  pctEl.textContent = pct + '%';
  pctEl.setAttribute('fill', color);
  statusEl.textContent = statusText;
  statusEl.className = 'att-gauge-badge ' + statusClass;

  // Warning box
  const warnBox = document.getElementById('att-warning-box');
  if (pct < 75) {
    const needed = Math.ceil((0.75 * totalHeld - totalPresent) / 0.25);
    document.getElementById('att-classes-needed').textContent = needed > 0 ? needed : 0;
    warnBox.style.display = 'block';
  } else {
    warnBox.style.display = 'none';
  }

  // Subject cards
  const grid = document.getElementById('att-subjects-grid');
  grid.innerHTML = '';
  student.subjects.forEach(subj => {
    const sp = Math.round((subj.present / subj.held) * 100);
    let cls = 'good';
    if (sp < 75) cls = 'danger';
    else if (sp < 85) cls = 'warn';

    const card = document.createElement('div');
    card.className = `att-subject-card ${cls}`;
    card.innerHTML = `
      <div class="att-subj-name">${subj.name}</div>
      <div class="att-subj-bar-wrap"><div class="att-subj-bar ${cls}" style="width:0%" data-pct="${sp}"></div></div>
      <div class="att-subj-footer">
        <span class="att-subj-pct ${cls}">${sp}%</span>
        <span class="att-subj-count">${subj.present}/${subj.held} classes</span>
      </div>
    `;
    grid.appendChild(card);
  });

  // Animate bars
  setTimeout(() => {
    document.querySelectorAll('.att-subj-bar').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
      bar.style.transition = 'width 1s cubic-bezier(.4,0,.2,1)';
    });
  }, 200);
}

/* ════════════════════════════════════
   ACCESS CONTROL SYSTEM
════════════════════════════════════ */
const ADMIN_ID = '9090';
const ADMIN_PW = '0909';

function accessLogin() {
  const id = document.getElementById('access-admin-id').value.trim();
  const pw = document.getElementById('access-admin-pw').value.trim();
  const errEl = document.getElementById('access-login-error');
  errEl.textContent = '';

  if (!id || !pw) { errEl.textContent = 'Please enter both Admin ID and Password.'; return; }
  if (id !== ADMIN_ID || pw !== ADMIN_PW) {
    errEl.textContent = '❌ Invalid credentials. Access denied.';
    return;
  }

  // Clear fields
  document.getElementById('access-admin-id').value = '';
  document.getElementById('access-admin-pw').value = '';

  showPage('access-dashboard');
  renderStudentTable();
  populateStudentSelect();
}

/* ─ Table rendering ─ */
function renderStudentTable() {
  const query = (document.getElementById('ac-search')?.value || '').toLowerCase();
  const tbody = document.getElementById('ac-table-body');
  tbody.innerHTML = '';

  const filtered = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px">No students found.</td></tr>';
    return;
  }

  filtered.forEach(student => {
    const { pct } = computeOverall(student);
    let pillClass = 'good';
    if (pct < 75) pillClass = 'danger';
    else if (pct < 85) pillClass = 'warn';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700;color:var(--navy)">${student.id}</td>
      <td>${student.name}</td>
      <td>${student.dept}</td>
      <td>${student.sem}</td>
      <td><span class="ac-pct-pill ${pillClass}">${pct}%</span></td>
      <td><span class="ac-pct-pill ${pillClass}">${pct >= 75 ? 'Active' : 'At Risk'}</span></td>
      <td>
        <button class="ac-action-btn" onclick="acEditStudent('${student.id}')">Edit</button>
        <button class="ac-action-btn del" onclick="acDeleteStudent('${student.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function populateStudentSelect() {
  const sel = document.getElementById('ac-att-student-select');
  if (!sel) return;
  sel.innerHTML = '<option value="">-- Choose a Student --</option>';
  STUDENTS.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.id})`;
    sel.appendChild(opt);
  });
}

function acEditStudent(id) {
  // Switch to attendance tab and select that student
  document.querySelectorAll('.ac-tab').forEach((t, i) => {
    t.classList.toggle('active', i === 1);
  });
  document.querySelectorAll('.ac-tab-content').forEach((c, i) => {
    c.classList.toggle('active', i === 1);
  });
  const sel = document.getElementById('ac-att-student-select');
  if (sel) { sel.value = id; loadStudentForEdit(); }
}

function acDeleteStudent(id) {
  if (!confirm(`Are you sure you want to remove student ${id}? This cannot be undone.`)) return;
  const idx = STUDENTS.findIndex(s => s.id === id);
  if (idx !== -1) {
    STUDENTS.splice(idx, 1);
    renderStudentTable();
    populateStudentSelect();
  }
}

function loadStudentForEdit() {
  const sel = document.getElementById('ac-att-student-select');
  const editorDiv = document.getElementById('ac-att-subject-editor');
  const formDiv = document.getElementById('ac-att-subjects-form');
  const msg = document.getElementById('ac-save-msg');
  if (msg) msg.textContent = '';

  if (!sel.value) { editorDiv.style.display = 'none'; return; }

  const student = STUDENTS.find(s => s.id === sel.value);
  if (!student) return;

  editorDiv.style.display = 'block';
  formDiv.innerHTML = '';

  student.subjects.forEach((subj, i) => {
    const row = document.createElement('div');
    row.className = 'ac-subj-row';
    row.innerHTML = `
      <label>${subj.name}</label>
      <div class="ac-subj-inputs">
        <input type="number" id="subj-present-${i}" value="${subj.present}" min="0" max="999" />
        <span>present /</span>
        <input type="number" id="subj-held-${i}" value="${subj.held}" min="1" max="999" />
        <span>held</span>
      </div>
    `;
    formDiv.appendChild(row);
  });
}

function openCalendar(fileName) {
  window.open(fileName, '_blank');
}

function saveAttendanceEdit() {
  const sel = document.getElementById('ac-att-student-select');
  const msg = document.getElementById('ac-save-msg');
  if (!sel.value) return;

  const student = STUDENTS.find(s => s.id === sel.value);
  if (!student) return;

  let valid = true;
  student.subjects.forEach((subj, i) => {
    const p = parseInt(document.getElementById(`subj-present-${i}`).value);
    const h = parseInt(document.getElementById(`subj-held-${i}`).value);
    if (isNaN(p) || isNaN(h) || h < 1 || p > h || p < 0) {
      valid = false;
    } else {
      subj.present = p;
      subj.held = h;
    }
  });

  if (!valid) {
    msg.textContent = '❌ Please check values — present cannot exceed held, and held must be ≥ 1.';
    msg.style.color = '#d32f2f';
    return;
  }

  msg.textContent = `✅ Attendance for ${student.name} updated successfully!`;
  msg.style.color = '#1a7a3e';
  renderStudentTable();
}

function addNewStudent() {
  const id = document.getElementById('new-id').value.trim().toUpperCase();
  const name = document.getElementById('new-name').value.trim();
  const dept = document.getElementById('new-dept').value;
  const sem = document.getElementById('new-sem').value;
  const errEl = document.getElementById('add-student-error');
  errEl.textContent = '';

  if (!id || !name) { errEl.textContent = 'Student ID and Name are required.'; return; }
  if (STUDENTS.find(s => s.id === id)) { errEl.textContent = '❌ Student ID already exists.'; return; }
  if (!/^[A-Z0-9]{4,12}$/.test(id)) { errEl.textContent = '❌ ID must be 4–12 uppercase letters/numbers.'; return; }

  STUDENTS.push({
    id, name, dept, sem,
    subjects: [
      { name: 'Subject 1', present: 0, held: 0 },
      { name: 'Subject 2', present: 0, held: 0 },
      { name: 'Subject 3', present: 0, held: 0 },
      { name: 'Subject 4', present: 0, held: 0 },
    ]
  });

  document.getElementById('new-id').value = '';
  document.getElementById('new-name').value = '';
  errEl.textContent = `✅ ${name} (${id}) added! Go to Edit Attendance to set their subjects.`;
  errEl.style.color = '#1a7a3e';
  renderStudentTable();
  populateStudentSelect();
}

/* ─ Tab switching ─ */
function acTab(name, el) {
  document.querySelectorAll('.ac-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ac-tab-content').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('ac-tab-' + name).classList.add('active');
  if (name === 'attendance') populateStudentSelect();
}

/* ════════════════════════════════════
   LIBRARY MODULE
════════════════════════════════════ */
const BOOKS = [
  { title: 'Introduction to Machine Learning', author: 'Ethem Alpaydin', emoji: '🤖', available: true },
  { title: 'Clean Code', author: 'Robert C. Martin', emoji: '💻', available: true },
  { title: 'Design Patterns', author: 'Gang of Four', emoji: '🏗️', available: false },
  { title: 'Database System Concepts', author: 'Silberschatz et al.', emoji: '🗄️', available: true },
  { title: 'Computer Networks', author: 'Andrew Tanenbaum', emoji: '🌐', available: false },
  { title: 'Operating System Concepts', author: 'Silberschatz & Galvin', emoji: '⚙️', available: true },
  { title: 'Artificial Intelligence: A Modern Approach', author: 'Russell & Norvig', emoji: '🧠', available: true },
  { title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', emoji: '📐', available: false },
];

function renderBooks(list) {
  const grid = document.getElementById('lib-books-grid');
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(book => {
    const card = document.createElement('div');
    card.className = 'lib-book-card';
    card.innerHTML = `
      <div class="lib-book-spine" style="background:${book.available ? '#e8f9f8' : '#fce8e8'}">${book.emoji}</div>
      <div class="lib-book-info">
        <h4>${book.title}</h4>
        <p>${book.author}</p>
        <span class="lib-avail ${book.available ? 'yes' : 'no'}">${book.available ? '✓ Available' : '✗ Issued'}</span>
        ${book.available ? `<button class="lib-reserve-btn" onclick="this.textContent='Reserved ✓';this.style.background='#1a7a3e'">Reserve</button>` : `<button class="lib-reserve-btn" style="background:#999" disabled>Unavailable</button>`}
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterBooks() {
  const q = document.getElementById('lib-search').value.toLowerCase();
  const filtered = BOOKS.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  renderBooks(filtered);
}

/* ════════════════════════════════════
   CANTEEN MODULE
════════════════════════════════════ */
const MENU = [
  { name: 'Masala Dosa', price: 40, emoji: '🥞' },
  { name: 'Veg Biryani', price: 80, emoji: '🍛' },
  { name: 'Sandwich', price: 35, emoji: '🥪' },
  { name: 'Filter Coffee', price: 20, emoji: '☕' },
  { name: 'Samosa (2pc)', price: 25, emoji: '🔺' },
  { name: 'Paneer Roll', price: 60, emoji: '🌯' },
  { name: 'Juice', price: 30, emoji: '🥤' },
  { name: 'Meals (Full)', price: 65, emoji: '🍱' },
];

const cart = {};

function renderCanteen() {
  const grid = document.getElementById('canteen-grid');
  if (!grid) return;
  grid.innerHTML = '';
  MENU.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'canteen-item';
    div.innerHTML = `
      <div class="food-emoji">${item.emoji}</div>
      <h4>${item.name}</h4>
      <div class="price">₹${item.price}</div>
      <div class="canteen-qty">
        <button onclick="changeQty(${i}, -1)">−</button>
        <span id="qty-${i}">0</span>
        <button onclick="changeQty(${i}, 1)">+</button>
      </div>
    `;
    grid.appendChild(div);
  });
}

function changeQty(i, delta) {
  cart[i] = Math.max(0, (cart[i] || 0) + delta);
  document.getElementById('qty-' + i).textContent = cart[i];
  updateCart();
}

function updateCart() {
  let totalItems = 0, totalPrice = 0;
  Object.entries(cart).forEach(([i, q]) => {
    totalItems += q;
    totalPrice += q * MENU[i].price;
  });
  const bar = document.getElementById('canteen-cart-bar');
  if (totalItems > 0) {
    bar.style.display = 'flex';
    document.getElementById('canteen-cart-label').textContent = `${totalItems} item${totalItems > 1 ? 's' : ''} in cart`;
    document.getElementById('canteen-cart-total').textContent = `₹${totalPrice}`;
  } else {
    bar.style.display = 'none';
  }
  document.getElementById('canteen-order-msg').style.display = 'none';
}

function placeOrder() {
  const token = 'T' + Math.floor(100 + Math.random() * 900);
  document.getElementById('canteen-token').textContent = token;
  document.getElementById('canteen-order-msg').style.display = 'block';
  document.getElementById('canteen-cart-bar').style.display = 'none';
  // Reset cart
  MENU.forEach((_, i) => {
    cart[i] = 0;
    const el = document.getElementById('qty-' + i);
    if (el) el.textContent = '0';
  });
}

/* ════════════════════════════════════
   AI STUDY ASSISTANT
════════════════════════════════════ */
const AI_RESPONSES = {
  keywords: [
    { keys: ['machine learning', 'ml'], reply: 'Machine Learning is a branch of AI where systems learn from data to improve over time without being explicitly programmed. Key types include Supervised Learning, Unsupervised Learning, and Reinforcement Learning. GAT covers this in the 5th semester under CSE (AI-ML).' },
    { keys: ['big o', 'time complexity', 'space complexity'], reply: 'Big O notation describes algorithm efficiency. O(1) = constant, O(log n) = logarithmic, O(n) = linear, O(n²) = quadratic. For example, binary search is O(log n) while bubble sort is O(n²). Always aim for the lowest complexity for large datasets.' },
    { keys: ['dbms', 'normalization', 'database'], reply: 'Normalization in DBMS eliminates data redundancy. 1NF: atomic values. 2NF: no partial dependencies. 3NF: no transitive dependencies. BCNF is a stricter version of 3NF. Always normalize to at least 3NF in real-world systems.' },
    { keys: ['data structure', 'array', 'linked list', 'tree', 'graph'], reply: 'Key Data Structures: Arrays (O(1) access), Linked Lists (O(1) insert/delete), Stacks & Queues (LIFO/FIFO), Trees (BST, AVL, Heap), Graphs (BFS/DFS traversal). These form the foundation of DSA — a core subject in all engineering programs at GAT.' },
    { keys: ['neural network', 'deep learning', 'cnn', 'rnn'], reply: 'Deep Learning uses multi-layered Neural Networks. CNNs are for image recognition, RNNs for sequential data like text. Key concepts: forward propagation, backpropagation, activation functions (ReLU, sigmoid), and gradient descent optimization.' },
    { keys: ['os', 'operating system', 'process', 'thread', 'scheduling'], reply: 'Operating Systems manage hardware and software resources. Key topics: Process Management (PCB, states), CPU Scheduling (FCFS, SJF, Round Robin), Memory Management (paging, segmentation), Deadlocks (Banker\'s Algorithm), and File Systems.' },
  ],
  default: 'That\'s a great question! Based on your GAT curriculum, I recommend reviewing the relevant module textbooks. Could you be more specific about what aspect you\'re struggling with? I\'m here to help break it down for you.'
};

function aiSend() {
  const input = document.getElementById('ai-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendAIMsg(text, 'user');

  // Typing indicator
  const typingId = 'typing-' + Date.now();
  appendAITyping(typingId);

  setTimeout(() => {
    const el = document.getElementById(typingId);
    if (el) el.remove();

    let reply = AI_RESPONSES.default;
    const lower = text.toLowerCase();
    for (const item of AI_RESPONSES.keywords) {
      if (item.keys.some(k => lower.includes(k))) { reply = item.reply; break; }
    }
    appendAIMsg(reply, 'ai');
  }, 1000 + Math.random() * 600);
}

function aiQuick(text) {
  document.getElementById('ai-input').value = text;
  aiSend();
}

function appendAIMsg(text, role) {
  const box = document.getElementById('ai-chat-box');
  const div = document.createElement('div');
  div.className = `ai-msg ${role}`;
  div.innerHTML = `
    <div class="ai-avatar">${role === 'ai' ? '🤖' : '👤'}</div>
    <div class="ai-bubble">${text}</div>
  `;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function appendAITyping(id) {
  const box = document.getElementById('ai-chat-box');
  const div = document.createElement('div');
  div.className = 'ai-msg ai ai-typing';
  div.id = id;
  div.innerHTML = `<div class="ai-avatar">🤖</div><div class="ai-bubble">Thinking…</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ════════════════════════════════════
   DIGITAL ID CARD
════════════════════════════════════ */
function generateID() {
  const inputVal = document.getElementById('did-input').value.trim().toUpperCase();
  const errEl = document.getElementById('did-error');
  const cardWrap = document.getElementById('did-card-wrap');
  errEl.textContent = '';
  cardWrap.style.display = 'none';

  if (!inputVal) { errEl.textContent = 'Please enter a Student ID.'; return; }

  const student = STUDENTS.find(s => s.id === inputVal);
  if (!student) { errEl.textContent = '❌ Student ID not found.'; return; }

  document.getElementById('did-name').textContent = student.name;
  document.getElementById('did-sid').textContent = student.id;
  document.getElementById('did-dept').textContent = student.dept;
  document.getElementById('did-sem').textContent = student.sem + ' Semester';

  cardWrap.style.display = 'block';
}

/* ════════════════════════════════════
   INIT
════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderBooks(BOOKS);
  renderCanteen();
});

window.onload = () => {
  loadStudents();
};