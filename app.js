const PEOPLE_KEY = 'retro-rolodex';
const transcript = document.querySelector('#transcript');
const generateButton = document.querySelector('#generateButton');
const captureHint = document.querySelector('#captureHint');
const toast = document.querySelector('#toast');

const seed = [
  { id: 1, name: 'Maya', role: 'Artist', met: 'Saturday market', city: '—', phone: '—', email: '—', notes: 'Collects matchbooks from every city she visits.', tags: ['art', 'maker'], avatar: 'M', tone: 'rust' },
  { id: 2, name: 'Maya Chen', role: 'Designer · Morrow Studio', met: 'Maker’s Market', city: 'Austin, TX', phone: '(512) 555-0184', email: 'maya@morrow.studio', notes: 'Makes small brands feel human.', tags: ['design', 'coffee'], avatar: 'MC', tone: 'teal' },
  { id: 3, name: 'Jon Bell', role: 'Founder · North Loop Coffee', met: 'Neighborhood coffee shop', city: 'Minneapolis, MN', phone: '(612) 555-0142', email: 'jon@northloop.co', notes: 'Knows every good breakfast spot in town.', tags: ['coffee', 'local'], avatar: 'JB', tone: 'gold' },
  { id: 4, name: 'Priya Shah', role: 'Product Lead · Kiteworks', met: 'Product Camp unconference', city: 'Chicago, IL', phone: '(773) 555-0127', email: 'priya@kiteworks.io', notes: 'Wants to trade notes on community-led growth.', tags: ['product', 'ideas'], avatar: 'PS', tone: 'rust' },
  { id: 5, name: 'Omar Patel', role: 'Independent bookshop owner', met: 'Bookstore reading series', city: 'Portland, OR', phone: '(503) 555-0135', email: 'omar@paperlanternbooks.com', notes: 'Recommended three strange and wonderful novels.', tags: ['books', 'local'], avatar: 'OP', tone: 'teal' },
];

const $ = (selector) => document.querySelector(selector);
const clean = (value) => String(value || '').trim();
const normalizeName = (value) => clean(value).toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
const newId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const showToast = (message) => {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3500);
};

function normalizePerson(raw, index) {
  const facts = Array.isArray(raw.facts) ? raw.facts.filter(Boolean) : [];
  return {
    id: raw.id ?? newId(),
    name: clean(raw.name) || `New connection ${index + 1}`,
    role: clean(raw.role) || 'New connection',
    met: clean(raw.met || raw.where) || 'Somewhere interesting',
    city: clean(raw.city) || '—',
    phone: clean(raw.phone) || '—',
    email: clean(raw.email) || '—',
    notes: clean(raw.notes || raw.summary) || facts.join('\n• ') || 'Add a note next time you see them.',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    avatar: clean(raw.avatar) || clean(raw.name).split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    tone: raw.tone || ['teal', 'rust', 'gold'][index % 3],
  };
}

function loadPeople() {
  try {
    const saved = JSON.parse(localStorage.getItem(PEOPLE_KEY) || 'null');
    return Array.isArray(saved) && saved.length ? saved.map(normalizePerson) : seed.map(normalizePerson);
  } catch {
    return seed.map(normalizePerson);
  }
}

let people = loadPeople();
let activeLetter = 'ALL';
let deckIndex = 0;
let visiblePeople = [];
let dragStart = null;

function savePeople() {
  localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);
}

function getLastName(person) {
  return person.name.trim().split(/\s+/).pop().toLocaleLowerCase();
}

function sortByLastName(list) {
  return [...list].sort((first, second) => {
    const lastNameOrder = getLastName(first).localeCompare(getLastName(second));
    return lastNameOrder || first.name.localeCompare(second.name);
  });
}

function getFilteredPeople() {
  const query = $('#search').value.toLowerCase().trim();
  return sortByLastName(people).filter((person) => {
    const matchesLetter = activeLetter === 'ALL' || getLastName(person)[0].toUpperCase() === activeLetter;
    const searchableText = [person.name, person.role, person.met, person.city, person.notes, ...person.tags].join(' ').toLowerCase();
    return matchesLetter && (!query || searchableText.includes(query));
  });
}

function renderIndex() {
  const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
  $('#index').innerHTML = letters.map((letter) => `<button class="tab ${letter === activeLetter ? 'active' : ''}" data-letter="${letter}">${letter === 'ALL' ? '★ All cards' : letter}</button>`).join('');
  document.querySelectorAll('[data-letter]').forEach((button) => {
    button.onclick = () => { activeLetter = button.dataset.letter; deckIndex = 0; render(); };
  });
}

function getToneClass(person) {
  return person.tone === 'rust' ? 'rust' : person.tone === 'gold' ? 'gold' : '';
}

function renderCard(person, position) {
  const stackClass = position === 0 ? 'front' : `behind-${Math.min(position, 3)}`;
  const lastName = getLastName(person).toUpperCase();
  const firstLetter = lastName[0];
  const tags = person.tags.map((tag) => `<span class="tag">#${escapeHtml(tag)}</span>`).join('');
  const notes = escapeHtml(person.notes).replace(/\n/g, '<br />');
  return `<article class="contact-card ${stackClass}">
    <div class="card-tab">${firstLetter}</div>
    <div class="card-header"><div class="avatar ${getToneClass(person)}">${escapeHtml(person.avatar)}</div><div><h2>${escapeHtml(person.name)}</h2><div class="role">${escapeHtml(person.role)}</div></div></div>
    <hr class="card-rule" />
    <div class="card-fields"><div><div class="label">Met at</div><div class="value">${escapeHtml(person.met)}</div></div><div><div class="label">Based in</div><div class="value">${escapeHtml(person.city)}</div></div><div><div class="label">Phone</div><div class="value"><a href="tel:${escapeHtml(person.phone)}">${escapeHtml(person.phone)}</a></div></div><div><div class="label">Email</div><div class="value"><a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a></div></div></div>
    <div class="card-note"><div class="label">Remember this</div>${notes}</div>
    <div class="tags">${tags}</div><div class="card-number">CARD ${String(person.id).padStart(2, '0')} · LAST NAME: ${lastName}</div>
  </article>`;
}

function renderDeck() {
  visiblePeople = getFilteredPeople();
  if (!visiblePeople.length) {
    $('#cardStack').innerHTML = '<div class="empty-card">No cards match this stack.<br />Try a different letter or add someone new.</div>';
    $('#count').textContent = '0 cards';
    $('#position').textContent = '';
    return;
  }
  deckIndex = Math.max(0, Math.min(deckIndex, visiblePeople.length - 1));
  $('#cardStack').innerHTML = visiblePeople.slice(deckIndex, deckIndex + 4).map(renderCard).join('');
  const currentPerson = visiblePeople[deckIndex];
  $('#count').textContent = `${visiblePeople.length} ${visiblePeople.length === 1 ? 'card' : 'cards'}`;
  $('#position').textContent = `${deckIndex + 1} / ${visiblePeople.length} · ${getLastName(currentPerson).toUpperCase()}`;
  const first = deckIndex === 0;
  const last = deckIndex === visiblePeople.length - 1;
  $('#prevBtn').disabled = first;
  $('#nextBtn').disabled = last;
  $('#prevBtn').style.opacity = first ? '.45' : '1';
  $('#nextBtn').style.opacity = last ? '.45' : '1';
}

function render() { renderIndex(); renderDeck(); }
function moveDeck(amount) {
  if (!visiblePeople.length) return;
  deckIndex = Math.max(0, Math.min(deckIndex + amount, visiblePeople.length - 1));
  renderDeck();
}

function extractName(text) {
  const afterIntro = text.match(/(?:about|met|named)\s+(.+)/i)?.[1] || text;
  const words = afterIntro.match(/[A-Za-z]+/g) || [];
  const stopWords = new Set(['at', 'on', 'in', 'through', 'during', 'is', 'was', 'go', 'goes', 'went', 'works', 'lives', 'said', 'has', 'and']);
  if (!words[0]) return 'New connection';
  return words[1] && !stopWords.has(words[1].toLowerCase()) ? `${words[0]} ${words[1]}` : words[0];
}

function parseNote(text) {
  const name = extractName(text);
  const remainder = text.replace(new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[:,;-]?\\s*`, 'i'), '').trim();
  return { name, notes: remainder || text };
}

function samePerson(first, second) {
  return normalizeName(first) === normalizeName(second) && normalizeName(first) !== '';
}

function notesFromAI(contact) {
  const facts = Array.isArray(contact.facts) ? contact.facts.filter(Boolean) : [];
  return [clean(contact.summary), ...facts.map((fact) => `• ${clean(fact)}`)].filter(Boolean).join('\n');
}

function updateOrAddLocally(fallback) {
  const index = people.findIndex((person) => samePerson(person.name, fallback.name));
  if (index >= 0) {
    const existing = people[index];
    const incoming = clean(fallback.notes);
    if (incoming && !existing.notes.toLowerCase().includes(incoming.toLowerCase())) existing.notes = `${existing.notes}\n• ${incoming}`;
    savePeople();
    render();
    showToast(`${existing.name} updated locally.`);
    return;
  }
  const person = normalizePerson({ ...fallback, id: newId(), role: 'New connection', met: 'Somewhere interesting', city: '—', tags: ['new'] }, people.length);
  people.unshift(person);
  savePeople();
  render();
  showToast(`${person.name} added locally.`);
}

async function saveWithAI(note, fallback) {
  const response = await fetch('/api/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contacts: people.map((person) => ({ id: person.id, name: person.name, role: person.role, where: person.met, city: person.city, notes: person.notes, tags: person.tags })),
      captured_name: fallback.name,
      new_note: note,
    }),
  });
  if (!response.ok) throw new Error(`AI merge failed with status ${response.status}`);
  const result = await response.json();
  const contact = result.contact || {};
  const matchedIndex = people.findIndex((person) => String(person.id) === String(result.matched_contact_id));
  if (matchedIndex >= 0) {
    const existing = people[matchedIndex];
    if (!samePerson(existing.name, fallback.name)) throw new Error('AI returned a non-exact contact match.');
    existing.notes = notesFromAI(contact) || existing.notes;
    existing.met = clean(contact.where) || existing.met;
    savePeople();
    render();
    showToast(`${existing.name} updated by AI.`);
    return;
  }
  const newPerson = normalizePerson({ id: newId(), name: contact.name || fallback.name, role: 'New connection', met: contact.where, notes: notesFromAI(contact) || fallback.notes, tags: ['new'] }, people.length);
  people.unshift(newPerson);
  savePeople();
  render();
  showToast(`${newPerson.name} added by AI.`);
}

function buildPerson(form) {
  const name = clean(form.get('name'));
  return normalizePerson({ id: newId(), name, role: form.get('role'), met: form.get('met'), city: form.get('city'), phone: form.get('phone'), email: form.get('email'), notes: form.get('notes'), tags: (form.get('tags') || 'new').split(',').map((tag) => tag.trim()).filter(Boolean), avatar: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(), tone: ['teal', 'rust', 'gold'][people.length % 3] }, people.length);
}

function exportPeople() {
  const blob = new Blob([JSON.stringify(sortByLastName(people), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'my-rolodex.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

generateButton.onclick = async () => {
  const note = transcript.value.trim();
  if (!note) return showToast('Write a note first.');
  const fallback = parseNote(note);
  generateButton.disabled = true;
  captureHint.textContent = 'AI is checking the exact person name and organizing the memory…';
  try { await saveWithAI(note, fallback); }
  catch (error) { updateOrAddLocally(fallback); console.warn(error); }
  finally { generateButton.disabled = false; captureHint.textContent = 'Same name merges into one card; Maya and Maya Chen stay separate.'; transcript.value = ''; }
};

$('#prevBtn').onclick = () => moveDeck(-1);
$('#nextBtn').onclick = () => moveDeck(1);
$('#search').oninput = () => { deckIndex = 0; renderDeck(); };
$('#deckWindow').addEventListener('wheel', (event) => { event.preventDefault(); moveDeck(event.deltaY > 0 ? 1 : -1); }, { passive: false });
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') moveDeck(1);
  if (event.key === 'ArrowLeft') moveDeck(-1);
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); transcript.focus(); }
});
$('#deckWindow').addEventListener('pointerdown', (event) => { dragStart = event.clientX; });
$('#deckWindow').addEventListener('pointerup', (event) => { if (dragStart === null) return; const distance = event.clientX - dragStart; if (Math.abs(distance) > 45) moveDeck(distance < 0 ? 1 : -1); dragStart = null; });
$('#addBtn').onclick = () => { $('#personForm').reset(); $('#personDialog').showModal(); };
$('#cancelBtn').onclick = () => $('#personDialog').close();
$('#personForm').onsubmit = (event) => { event.preventDefault(); const person = buildPerson(new FormData(event.target)); const existing = people.find((item) => samePerson(item.name, person.name)); if (existing) { existing.notes = `${existing.notes}\n• ${person.notes}`; showToast(`${existing.name} updated.`); } else { people.push(person); showToast(`${person.name} added.`); } savePeople(); $('#personDialog').close(); activeLetter = 'ALL'; deckIndex = 0; render(); };
$('#exportBtn').onclick = exportPeople;

savePeople();
render();
