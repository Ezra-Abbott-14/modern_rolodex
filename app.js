const recordButton = document.querySelector('#recordButton');
const transcript = document.querySelector('#transcript');
const generateButton = document.querySelector('#generateButton');
const profileGrid = document.querySelector('#profileGrid');
const profileCount = document.querySelector('#profileCount');
const captureHint = document.querySelector('#captureHint');
const toast = document.querySelector('#toast');
const searchInput = document.querySelector('#searchInput');
const manualPanel = document.querySelector('#manualPanel');
const manualForm = document.querySelector('#manualForm');
const closeManualButton = document.querySelector('#closeManualButton');
const manualTrigger = document.querySelector('#manualTrigger');

const STORAGE_KEY = 'folio-contacts-v1';
let recognition;
let listening = false;
let sortMode = 'all';
const seedContacts = [
  { name: 'Maya Chen', where: 'Met at the Saturday market', memory: 'First gallery show is in October.', tag: 'CREATIVE SPARK', color: 'coral', meta: 'She / her' },
  { name: 'Jon Bell', where: 'Introduced by Nora at Bloom', memory: 'Training for his first half marathon.', tag: 'GOOD ENERGY', color: 'blue', meta: 'He / him' },
  { name: 'Amara Lewis', where: 'On the train to Portland', memory: 'Knows the best tiny bookstores.', tag: 'THE CONNECTOR', color: 'yellow', meta: 'She / her' },
];
const showToast = (message) => { toast.textContent = message; toast.classList.add('show'); window.setTimeout(() => toast.classList.remove('show'), 3200); };
const loadContacts = () => { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(saved) && saved.length ? saved : seedContacts; } catch { return seedContacts; } };
let contacts = loadContacts();
const saveContacts = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const clean = (value) => String(value || '').replace(/[.!?]+$/, '');

const render = () => {
  const query = searchInput.value.trim().toLowerCase();
  let visible = contacts.filter((contact) => `${contact.name} ${contact.where} ${contact.memory}`.toLowerCase().includes(query));
  if (sortMode === 'recent') visible = [...visible].reverse();
  if (sortMode === 'az') visible.sort((a, b) => a.name.localeCompare(b.name));
  profileGrid.replaceChildren();
  visible.forEach((contact, index) => {
    const card = document.createElement('article');
    card.className = `profile-card ${contact.color || 'green'}`;
    card.innerHTML = `<div class="card-top"><span class="profile-number">${String(index + 1).padStart(2, '0')}</span><button class="more-button" type="button" aria-label="Remove contact">•••</button></div><div class="portrait"><span>${initials(contact.name)}</span></div><div class="profile-info"><div class="tag">${contact.tag || 'NEW CONNECTION'}</div><h3></h3><p></p><div class="profile-meta"><span>${contact.meta || 'Pronouns not set'}</span><span>·</span><span>${contact.added || 'Added today'}</span></div></div><div class="memory-quote"></div>`;
    card.querySelector('h3').textContent = contact.name;
    card.querySelector('.profile-info p').textContent = contact.where || 'A memorable first meeting';
    card.querySelector('.memory-quote').textContent = `“${contact.memory || 'A detail worth remembering.'}”`;
    card.querySelector('.more-button').addEventListener('click', () => removeContact(contact));
    profileGrid.append(card);
  });
  profileCount.textContent = String(contacts.length).padStart(2, '0');
  if (!visible.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'No people match that search yet.'; profileGrid.append(empty); }
};
const removeContact = (contact) => { if (!window.confirm(`Remove ${contact.name} from your orbit?`)) return; contacts = contacts.filter((item) => item !== contact); saveContacts(); render(); showToast(`${contact.name} was removed.`); };
const addContact = ({ name, where, memory, tag = 'NEW CONNECTION', color = 'green', meta = 'Pronouns not set' }) => { contacts.unshift({ name: clean(name), where: clean(where) || 'A memorable first meeting', memory: clean(memory) || 'A detail worth remembering.', tag, color, meta, added: 'Added just now' }); saveContacts(); render(); showToast(`${name} was added to your orbit.`); };

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US';
  recognition.onresult = (event) => { transcript.value = Array.from(event.results).map((result) => result[0].transcript).join(''); };
  recognition.onend = () => { listening = false; recordButton.classList.remove('recording'); recordButton.querySelector('.record-label').textContent = 'Tap to speak'; captureHint.textContent = 'Voice note captured. Ready to make a profile?'; };
  recognition.onerror = () => showToast('I couldn’t hear that. Try again or type your note.');
} else captureHint.textContent = 'Voice input is not supported here, but you can type your note.';
recordButton.addEventListener('click', () => { if (!recognition) return showToast('Voice input is not supported by this browser.'); if (listening) return recognition.stop(); transcript.focus(); recognition.start(); listening = true; recordButton.classList.add('recording'); recordButton.querySelector('.record-label').textContent = 'Listening…'; captureHint.textContent = 'Speak naturally — I’ll keep the important details.'; });
const extract = (text, patterns, fallback) => { for (const pattern of patterns) { const match = text.match(pattern); if (match) return match[1].trim().replace(/[.!?]+$/, ''); } return fallback; };
generateButton.addEventListener('click', () => { const text = transcript.value.trim(); if (!text) return showToast('Add a voice note or a few details first.'); const name = extract(text, [/(?:about|met|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/, /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/], 'New connection'); const where = extract(text, [/(?:at|on|through|during)\s+([^.!?]+)/i], 'A memorable first meeting'); const memory = extract(text, [/(?:told me|mentioned|remember that|is)\s+([^.!?]+)/i], 'A detail worth remembering'); addContact({ name, where, memory }); transcript.value = ''; });
searchInput.addEventListener('input', render);
document.querySelectorAll('.filter:not(.manual-trigger)').forEach((filter) => filter.addEventListener('click', () => { document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active')); filter.classList.add('active'); sortMode = filter.textContent === 'A–Z' ? 'az' : filter.textContent === 'Recently added' ? 'recent' : 'all'; render(); }));
manualForm.addEventListener('submit', (event) => { event.preventDefault(); const data = new FormData(manualForm); addContact({ name: data.get('name'), where: data.get('where'), memory: data.get('memory') }); manualForm.reset(); manualPanel.hidden = true; });
closeManualButton.addEventListener('click', () => { manualPanel.hidden = true; });
manualTrigger.addEventListener('click', () => { manualPanel.hidden = false; manualForm.querySelector('input').focus(); });
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); transcript.focus(); } });
render();
