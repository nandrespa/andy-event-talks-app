/* ──────────────────────────────────────────────────────────────
   BigQuery Release Notes — Main Application JS
────────────────────────────────────────────────────────────── */

'use strict';

/* ── DOM refs ─────────────────────────────────────────────── */
const refreshBtn       = document.getElementById('refresh-btn');
const entriesGrid      = document.getElementById('entries-grid');
const loadingState     = document.getElementById('loading-state');
const errorState       = document.getElementById('error-state');
const errorMsg         = document.getElementById('error-msg');
const emptyState       = document.getElementById('empty-state');
const lastUpdatedEl    = document.getElementById('last-updated');
const summaryBar       = document.getElementById('summary-bar');
const filterBar        = document.getElementById('filter-bar');

// Tweet modal
const modalOverlay     = document.getElementById('tweet-modal-overlay');
const modalClose       = document.getElementById('modal-close');
const tweetTextarea    = document.getElementById('tweet-textarea');
const charCount        = document.getElementById('char-count');
const postTweetBtn     = document.getElementById('post-tweet-btn');

/* ── State ────────────────────────────────────────────────── */
let allEntries   = [];
let activeFilter = 'all';

/* ── Fetch & Render ───────────────────────────────────────── */
async function loadReleaseNotes() {
  setLoading(true);

  try {
    const resp = await fetch('/api/release-notes');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.status !== 'ok') throw new Error(data.message || 'Unknown error');

    allEntries = data.entries;
    updateSummary();
    renderEntries();
    lastUpdatedEl.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    showError(err.message);
  } finally {
    setLoading(false);
  }
}

function setLoading(on) {
  refreshBtn.disabled = on;
  refreshBtn.classList.toggle('loading', on);
  loadingState.classList.toggle('visible', on);
  if (on) {
    errorState.classList.remove('visible');
    emptyState.classList.remove('visible');
    entriesGrid.innerHTML = '';
    summaryBar.style.opacity = '0.4';
    filterBar.style.display = 'none';
  } else {
    summaryBar.style.opacity = '1';
    filterBar.style.display = '';
  }
}

function showError(msg) {
  loadingState.classList.remove('visible');
  errorState.classList.add('visible');
  errorMsg.textContent = msg;
  entriesGrid.innerHTML = '';
}

/* ── Summary pills ────────────────────────────────────────── */
function updateSummary() {
  const total    = allEntries.length;
  const features = countType('feature');
  const anns     = countType('announcement');

  document.getElementById('pill-total').textContent   = `${total} releases`;
  document.getElementById('pill-feature').textContent = `${features} features`;
  document.getElementById('pill-ann').textContent     = `${anns} announcements`;
}

function countType(type) {
  return allEntries.filter(e => detectTypes(e.content).includes(type)).length;
}

/* ── Filter bar ───────────────────────────────────────────── */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeFilter = btn.dataset.filter;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderEntries();
  });
});

/* ── Type detection ───────────────────────────────────────── */
function detectTypes(html) {
  const labels = [];
  const h3Re = /<h3[^>]*>([^<]+)<\/h3>/gi;
  let m;
  while ((m = h3Re.exec(html)) !== null) {
    labels.push(m[1].toLowerCase().trim());
  }
  return labels;
}

function normalizeType(raw) {
  const r = raw.toLowerCase().trim();
  if (r.includes('feature'))      return 'feature';
  if (r.includes('announc'))      return 'announcement';
  if (r.includes('issue') || r.includes('fix') || r.includes('bug')) return 'issue';
  if (r.includes('deprecat'))     return 'deprecation';
  if (r.includes('change') || r.includes('updat')) return 'changed';
  if (r.includes('break'))        return 'breaking';
  return 'other';
}

/* ── Strip HTML to plain text ─────────────────────────────── */
function htmlToPlainText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/* ── Color h3 badges by type ──────────────────────────────── */
function colorizeBadges(container) {
  container.querySelectorAll('h3').forEach(h3 => {
    const type = normalizeType(h3.textContent);
    h3.setAttribute('data-type', type);
  });
}

/* ── Render entries grid ──────────────────────────────────── */
function renderEntries() {
  loadingState.classList.remove('visible');
  errorState.classList.remove('visible');

  let entries = allEntries;

  // Apply filter
  if (activeFilter !== 'all') {
    entries = allEntries.filter(e => detectTypes(e.content).includes(activeFilter));
  }

  if (entries.length === 0) {
    emptyState.classList.add('visible');
    entriesGrid.innerHTML = '';
    return;
  }

  emptyState.classList.remove('visible');
  entriesGrid.innerHTML = '';

  entries.forEach((entry, idx) => {
    const card = buildCard(entry, idx);
    entriesGrid.appendChild(card);
  });
}

/* ── Build a single card ──────────────────────────────────── */
function buildCard(entry, idx) {
  const card = document.createElement('article');
  card.className = 'entry-card';
  card.style.animationDelay = `${idx * 45}ms`;
  card.dataset.id = entry.id;

  const needsTruncation = entry.content.length > 400;

  card.innerHTML = `
    <div class="card-header">
      <div class="card-date">${escapeHtml(entry.title)}</div>
      <div class="card-actions">
        <a href="${escapeHtml(entry.link)}" target="_blank" rel="noopener"
           class="card-link" title="Open in docs" id="docs-link-${idx}">↗</a>
        <button class="tweet-btn" data-idx="${idx}" id="tweet-btn-${idx}" title="Tweet this update">
          𝕏&nbsp;Tweet
        </button>
      </div>
    </div>
    <div class="card-content">
      <div class="card-content-inner${needsTruncation ? '' : ' expanded'}" id="content-inner-${idx}">
        ${entry.content}
      </div>
      ${needsTruncation ? `<button class="read-more-btn" data-idx="${idx}" id="read-more-${idx}">Show more ▾</button>` : ''}
    </div>
  `;

  // Colorize h3 badges
  colorizeBadges(card.querySelector('.card-content'));

  // Read-more toggle
  if (needsTruncation) {
    const readMoreBtn = card.querySelector('.read-more-btn');
    const inner = card.querySelector('.card-content-inner');
    readMoreBtn.addEventListener('click', e => {
      e.stopPropagation();
      const expanded = inner.classList.toggle('expanded');
      readMoreBtn.textContent = expanded ? 'Show less ▴' : 'Show more ▾';
    });
  }

  // Tweet button
  card.querySelector('.tweet-btn').addEventListener('click', e => {
    e.stopPropagation();
    openTweetModal(entry);
  });

  // Highlight card on click
  card.addEventListener('click', () => {
    document.querySelectorAll('.entry-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
  });

  return card;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Tweet Modal ──────────────────────────────────────────── */
function openTweetModal(entry) {
  const plain   = htmlToPlainText(entry.content).trim();
  const snippet = plain.length > 200 ? plain.slice(0, 197) + '…' : plain;
  const draft   = `📊 BigQuery update (${entry.title}):\n\n${snippet}\n\n${entry.link}\n\n#BigQuery #GoogleCloud #DataEngineering`;
  const capped  = draft.slice(0, 280);

  tweetTextarea.value = capped;
  updateCharCount();

  // Fill source card
  document.getElementById('modal-source-date').textContent    = entry.title;
  document.getElementById('modal-source-snippet').textContent = snippet;

  modalOverlay.classList.add('open');
  setTimeout(() => tweetTextarea.focus(), 300);
}

function closeTweetModal() {
  modalOverlay.classList.remove('open');
}

modalClose.addEventListener('click', closeTweetModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeTweetModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTweetModal(); });

/* ── Tweet compose & post ─────────────────────────────────── */
function updateCharCount() {
  const len = tweetTextarea.value.length;
  const remaining = 280 - len;
  charCount.textContent = remaining;
  charCount.className = 'char-count' +
    (remaining < 20 ? ' warning' : '') +
    (remaining < 0  ? ' over'    : '');
  postTweetBtn.disabled = len === 0 || remaining < 0;
}

tweetTextarea.addEventListener('input', updateCharCount);

postTweetBtn.addEventListener('click', () => {
  const text = tweetTextarea.value.trim();
  if (!text) return;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'width=560,height=420,noopener,noreferrer');
  closeTweetModal();
});

/* ── Refresh button ───────────────────────────────────────── */
refreshBtn.addEventListener('click', loadReleaseNotes);

/* ── Boot ─────────────────────────────────────────────────── */
loadReleaseNotes();
