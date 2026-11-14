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
  { name: 'Maya Chen', where: 'Met at the Saturday market', facts: ['Artist', 'First gallery show is in October.'], tag: 'CREATIVE SPARK', color: 'coral', meta: 'She / her' },
  { name: 'Jon Bell', where: 'Introduced by Nora at Bloom', facts: ['Training for his first half marathon.'], tag: 'GOOD ENERGY', color: 'blue', meta: 'He / him' },
  { name: 'Amara Lewis', where: 'On the train to Portland', facts: ['Knows the best tiny bookstores.'], tag: 'THE CONNECTOR', color: 'yellow', meta: 'She / her' },
];

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3200);
};
const clean = (value) => String(value || '').replace(/[.!?]+$/, '').trim();
const nameKey = (value) => clean(value).toLowerCase().replace(/[^a-z0-9]/g, '');
const firstName = (value) => nameKey(value).split(' ')[0];
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const formatFact = (value) => {
  const fact = clean(value);
  if (/^(an?|the)\s+/i.test(fact)) return fact.replace(/^(an?|the)\s+/i, '').replace(/^./, (letter) => letter.toUpperCase());
  return fact.replace(/^./, (letter) => letter.toUpperCase());
};
const uniqueFacts = (facts) => [...new Set(facts.map(formatFact).filter(Boolean))];
const factsFor = (contact) => uniqueFacts(Array.isArray(contact.facts) ? contact.facts : [contact.memory]);

// Temporary local matching for the MVP. The AI backend can replace this with
// semantic matching later, while keeping the same mergeContact() interface.
const samePerson = (left, right) => {
  const leftKey = nameKey(left);
  const rightKey = nameKey(right);
  return leftKey === rightKey || (leftKey && rightKey && (leftKey.startsWith(rightKey) || rightKey.startsWith(leftKey)));
};

const mergeContact = (contact, incoming) => {
  contact.facts = uniqueFacts([...factsFor(contact), ...incoming.facts]);
  if (incoming.where && incoming.where !== 'A memorable first meeting' && contact.where !== incoming.where) {
    contact.where = contact.where ? `${contact.where}; ${incoming.where}` : incoming.where;
  }
  contact.added = 'Updated just now';
  return contact;
};

const loadContacts = () => {
  let saved = seedContacts;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(parsed) && parsed.length) saved = parsed;
  } catch { /* Use the starter contacts when storage is unavailable. */ }

  // Also clean up duplicates from earlier versions of the prototype.
  return saved.reduce((merged, rawContact) => {
    const contact = { ...rawContact, facts: factsFor(rawContact) };
    const existing = merged.find((item) => samePerson(item.name, contact.name));
    if (existing) mergeContact(existing, contact);
    else merged.push(contact);
    return merged;
  }, []);
};

let contacts = loadContacts();
const saveContacts = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));

const render = () => {
  const query = searchInput.value.trim().toLowerCase();
  let visible = contacts.filter((contact) => `${contact.name} ${contact.where} ${factsFor(contact).join(' ')}`.toLowerCase().includes(query));
  if (sortMode === 'recent') visible = [...visible].reverse();
  if (sortMode === 'az') visible.sort((a, b) => a.name.localeCompare(b.name));
  profileGrid.replaceChildren();

  visible.forEach((contact, index) => {
    const card = document.createElement('article');
    card.className = `profile-card ${contact.color || 'green'}`;
    card.innerHTML = `<div class="card-top"><span class="profile-number">${String(index + 1).padStart(2, '0')}</span><button class="more-button" type="button" aria-label="Remove contact">•••</button></div><div class="portrait"><span>${initials(contact.name)}</span></div><div class="profile-info"><div class="tag">${contact.tag || 'NEW CONNECTION'}</div><h3></h3><p></p><div class="profile-meta"><span>${contact.meta || 'Pronouns not set'}</span><span>·</span><span>${contact.added || 'Added today'}</span></div></div><div class="memory-quote"><div class="memory-label">ORGANIZED MEMORY</div><ul class="fact-list"></ul></div>`;
    card.querySelector('h3').textContent = contact.name;
    card.querySelector('.profile-info p').textContent = contact.where || 'A memorable first meeting';
    const factList = card.querySelector('.fact-list');
    factsFor(contact).forEach((fact) => { const item = document.createElement('li'); item.textContent = fact; factList.append(item); });
    card.querySelector('.more-button').addEventListener('click', () => removeContact(contact));
    profileGrid.append(card);
  });
  profileCount.textContent = String(contacts.length).padStart(2, '0');
  if (!visible.length) { const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'No people match that search yet.'; profileGrid.append(empty); }
};

const removeContact = (contact) => {
  if (!window.confirm(`Remove ${contact.name} from your orbit?`)) return;
  contacts = contacts.filter((item) => item !== contact);
  saveContacts();
  render();
  showToast(`${contact.name} was removed.`);
};

const addContact = ({ name, where, facts, tag = 'NEW CONNECTION', color = 'green', meta = 'Pronouns not set' }) => {
  const incoming = { name: clean(name) || 'New connection', where: clean(where), facts: uniqueFacts(facts), tag, color, meta, added: 'Added just now' };
  const existing = contacts.find((contact) => samePerson(contact.name, incoming.name));
  if (existing) {
    mergeContact(existing, incoming);
    saveContacts();
    render();
    showToast(`${existing.name} updated — new information merged.`);
    return;
  }
  contacts.unshift(incoming);
  saveContacts();
  render();
  showToast(`${incoming.name} was added to your orbit.`);
};

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.onresult = (event) => { transcript.value = Array.from(event.results).map((result) => result[0].transcript).join(''); };
  recognition.onend = () => { listening = false; recordButton.classList.remove('recording'); recordButton.querySelector('.record-label').textContent = 'Tap to speak'; captureHint.textContent = 'Voice note captured. Ready to make a profile?'; };
  recognition.onerror = () => showToast('I couldn’t hear that. Try again or type your note.');
} else captureHint.textContent = 'Voice input is not supported here, but you can type your note.';

recordButton.addEventListener('click', () => {
  if (!recognition) return showToast('Voice input is not supported by this browser.');
  if (listening) return recognition.stop();
  transcript.focus();
  recognition.start();
  listening = true;
  recordButton.classList.add('recording');
  recordButton.querySelector('.record-label').textContent = 'Listening…';
  captureHint.textContent = 'Speak naturally — I’ll keep the important details.';
});

const extract = (text, patterns, fallback) => {
  for (const pattern of patterns) { const match = text.match(pattern); if (match) return clean(match[1]); }
  return fallback;
};
const extractName = (text) => {
  const afterIntro = text.match(/(?:about|met|named)\s+(.+)/i)?.[1] || text;
  const words = afterIntro.match(/[A-Za-z]+/g) || [];
  const stopWords = new Set(['at', 'on', 'in', 'through', 'during', 'is', 'was', 'go', 'goes', 'went', 'works', 'lives', 'said', 'has', 'and']);
  if (!words[0]) return 'New connection';
  return words[1] && !stopWords.has(words[1].toLowerCase()) ? `${words[0]} ${words[1]}` : words[0];
};
const parseCapture = (text) => {
  const name = extractName(text);
  const where = extract(text, [/(?:at|on|through|during)\s+([^.!?]+)/i], 'A memorable first meeting');
  const fact = extract(text, [/(?:told me|mentioned|remember that|is|works as|works at|go(?:es)? to|went to)\s+([^.!?]+)/i], text.replace(new RegExp(`^${name}\\s*`, 'i'), ''));
  return { name, where, facts: [fact] };
};

generateButton.addEventListener('click', () => {
  const text = transcript.value.trim();
  if (!text) return showToast('Add a voice note or a few details first.');
  addContact(parseCapture(text));
  transcript.value = '';
});

searchInput.addEventListener('input', render);
document.querySelectorAll('.filter:not(.manual-trigger)').forEach((filter) => filter.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
  filter.classList.add('active');
  sortMode = filter.textContent === 'A–Z' ? 'az' : filter.textContent === 'Recently added' ? 'recent' : 'all';
  render();
}));
manualForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(manualForm);
  addContact({ name: data.get('name'), where: data.get('where'), facts: [data.get('memory')] });
  manualForm.reset();
  manualPanel.hidden = true;
});
closeManualButton.addEventListener('click', () => { manualPanel.hidden = true; });
manualTrigger.addEventListener('click', () => { manualPanel.hidden = false; manualForm.querySelector('input').focus(); });
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); transcript.focus(); } });

// Persist the migration from the old one-memory shape to the merged facts shape.
saveContacts();
render();
