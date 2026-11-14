<<<<<<< HEAD
const seed = [
  {
    id: 1,
    name: 'Maya Rodriguez',
    role: 'Creative Director · Morrow Studio',
    met: 'Maker’s Market',
    city: 'Austin, TX',
    phone: '(512) 555-0184',
    email: 'maya@morrow.studio',
    notes: 'Talked for an hour about making small brands feel human. She is collecting matchbooks from every city she visits.',
    tags: ['design', 'maker', 'coffee'],
    avatar: 'MR',
    tone: 'rust'
  },
  {
    id: 2,
    name: 'Jon Bell',
    role: 'Founder · North Loop Coffee',
    met: 'The neighborhood coffee shop',
    city: 'Minneapolis, MN',
    phone: '(612) 555-0142',
    email: 'jon@northloop.co',
    notes: 'Runs a tiny roastery and knows every good breakfast spot in town. Send him the photo from the latte art throwdown.',
    tags: ['coffee', 'food', 'local'],
    avatar: 'JB',
    tone: 'teal'
  },
  {
    id: 3,
    name: 'Priya Shah',
    role: 'Product Lead · Kiteworks',
    met: 'Product Camp unconference',
    city: 'Chicago, IL',
    phone: '(773) 555-0127',
    email: 'priya@kiteworks.io',
    notes: 'Believes every good product starts with a sharp question. Wants to trade notes on community-led growth.',
    tags: ['product', 'ideas'],
    avatar: 'PS',
    tone: 'gold'
  },
  {
    id: 4,
    name: 'Theo Martin',
    role: 'Photographer',
    met: 'Train to Marfa',
    city: 'Marfa, TX',
    phone: '(432) 555-0156',
    email: 'theo@theomartin.photo',
    notes: 'Shooting desert light on old medium format. He recommended the little bookstore by the water tower.',
    tags: ['photography', 'travel'],
    avatar: 'TM',
    tone: 'teal'
  }
];

let people = loadPeople();
let activeLetter = 'ALL';
let deckIndex = 0;
let visiblePeople = sortByLastName(people);
let dragStart = null;

const $ = selector => document.querySelector(selector);

function loadPeople() {
  return JSON.parse(localStorage.getItem('retro-rolodex') || 'null') || seed;
}

function savePeople() {
  localStorage.setItem('retro-rolodex', JSON.stringify(people));
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character]);
}

function getLastName(person) {
  return person.name.trim().split(/\s+/).pop().toLocaleLowerCase();
}

function sortByLastName(list) {
  return [...list].sort((first, second) => {
    const lastNameOrder = getLastName(first).localeCompare(getLastName(second));
    return lastNameOrder || first.name.localeCompare(second.name);
=======
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
const initials = (name) => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const newId = () => window.crypto?.randomUUID?.() || `contact-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
  if (incoming.summary) contact.summary = incoming.summary;
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
    const contact = { ...rawContact, id: rawContact.id || newId(), facts: factsFor(rawContact) };
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
  let visible = contacts.filter((contact) => `${contact.name} ${contact.where} ${contact.summary || ''} ${factsFor(contact).join(' ')}`.toLowerCase().includes(query));
  if (sortMode === 'recent') visible = [...visible].reverse();
  if (sortMode === 'az') visible.sort((a, b) => a.name.localeCompare(b.name));
  profileGrid.replaceChildren();

  visible.forEach((contact, index) => {
    const card = document.createElement('article');
    card.className = `profile-card ${contact.color || 'green'}`;
    card.innerHTML = `<div class="card-top"><span class="profile-number">${String(index + 1).padStart(2, '0')}</span><button class="more-button" type="button" aria-label="Remove contact">•••</button></div><div class="portrait"><span>${initials(contact.name)}</span></div><div class="profile-info"><div class="tag">${contact.tag || 'NEW CONNECTION'}</div><h3></h3><p></p><div class="profile-meta"><span>${contact.meta || 'Pronouns not set'}</span><span>·</span><span>${contact.added || 'Added today'}</span></div></div><div class="memory-quote"><div class="memory-label">ORGANIZED MEMORY</div><ul class="fact-list"></ul></div>`;
    card.querySelector('h3').textContent = contact.name;
    card.querySelector('.profile-info p').textContent = contact.summary || contact.where || 'A memorable first meeting';
    const factList = card.querySelector('.fact-list');
    factsFor(contact).forEach((fact) => { const item = document.createElement('li'); item.textContent = fact; factList.append(item); });
    card.querySelector('.more-button').addEventListener('click', () => removeContact(contact));
    profileGrid.append(card);
>>>>>>> f220561ba671df243a51dc75a85dac09af8bb944
  });
}

function getFilteredPeople() {
  const query = $('#search').value.toLowerCase().trim();

  return sortByLastName(people).filter(person => {
    const matchesLetter = activeLetter === 'ALL'
      || getLastName(person)[0].toUpperCase() === activeLetter;

    const searchableText = [
      person.name,
      person.role,
      person.met,
      person.city,
      person.notes,
      ...person.tags
    ].join(' ').toLowerCase();

    return matchesLetter && (!query || searchableText.includes(query));
  });
}

function renderIndex() {
  const letters = ['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

  $('#index').innerHTML = letters.map(letter => {
    const label = letter === 'ALL' ? '★ All cards' : letter;
    const activeClass = letter === activeLetter ? 'active' : '';

    return `<button class="tab ${activeClass}" data-letter="${letter}">${label}</button>`;
  }).join('');

  document.querySelectorAll('[data-letter]').forEach(button => {
    button.onclick = () => {
      activeLetter = button.dataset.letter;
      deckIndex = 0;
      render();
    };
  });
}

function getToneClass(person) {
  if (person.tone === 'rust') return 'rust';
  if (person.tone === 'gold') return 'gold';
  return '';
}

function renderCard(person, position) {
  const stackClass = position === 0
    ? 'front'
    : `behind-${Math.min(position, 3)}`;
  const lastName = getLastName(person).toUpperCase();
  const firstLetter = lastName[0];
  const tags = person.tags
    .map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`)
    .join('');

  return `
    <article class="contact-card ${stackClass}">
      <div class="card-tab">${firstLetter}</div>

      <div class="card-header">
        <div class="avatar ${getToneClass(person)}">${escapeHtml(person.avatar)}</div>
        <div>
          <h2>${escapeHtml(person.name)}</h2>
          <div class="role">${escapeHtml(person.role)}</div>
        </div>
      </div>

      <hr class="card-rule" />

      <div class="card-fields">
        <div>
          <div class="label">Met at</div>
          <div class="value">${escapeHtml(person.met)}</div>
        </div>
        <div>
          <div class="label">Based in</div>
          <div class="value">${escapeHtml(person.city)}</div>
        </div>
        <div>
          <div class="label">Phone</div>
          <div class="value"><a href="tel:${escapeHtml(person.phone)}">${escapeHtml(person.phone)}</a></div>
        </div>
        <div>
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${escapeHtml(person.email)}">${escapeHtml(person.email)}</a></div>
        </div>
      </div>

      <div class="card-note">
        <div class="label">Remember this</div>
        ${escapeHtml(person.notes)}
      </div>

      <div class="tags">${tags}</div>
      <div class="card-number">CARD ${String(person.id).padStart(2, '0')} · LAST NAME: ${lastName}</div>
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
  const cardsToShow = visiblePeople.slice(deckIndex, deckIndex + 4);

  $('#cardStack').innerHTML = cardsToShow
    .map((person, index) => renderCard(person, index))
    .join('');

  const currentPerson = visiblePeople[deckIndex];
  const totalLabel = visiblePeople.length === 1 ? 'card' : 'cards';

  $('#count').textContent = `${visiblePeople.length} ${totalLabel}`;
  $('#position').textContent = `${deckIndex + 1} / ${visiblePeople.length} · ${getLastName(currentPerson).toUpperCase()}`;

  const isFirstCard = deckIndex === 0;
  const isLastCard = deckIndex === visiblePeople.length - 1;

  $('#prevBtn').disabled = isFirstCard;
  $('#nextBtn').disabled = isLastCard;
  $('#prevBtn').style.opacity = isFirstCard ? '.45' : '1';
  $('#nextBtn').style.opacity = isLastCard ? '.45' : '1';
}

function render() {
  renderIndex();
  renderDeck();
}

function moveDeck(amount) {
  if (!visiblePeople.length) return;

  deckIndex = Math.max(0, Math.min(
    deckIndex + amount,
    visiblePeople.length - 1
  ));
  renderDeck();
}

function buildPerson(form) {
  const name = form.get('name').trim();
  const tags = (form.get('tags') || 'new')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  return {
    id: Date.now(),
    name,
    role: form.get('role') || 'New connection',
    met: form.get('met') || 'Somewhere interesting',
    city: form.get('city') || '—',
    phone: form.get('phone') || '—',
    email: form.get('email') || '—',
    notes: form.get('notes') || 'Add a note next time you see them.',
    tags,
    avatar: name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
    tone: ['teal', 'rust', 'gold'][people.length % 3]
  };
}

function exportPeople() {
  const blob = new Blob([
    JSON.stringify(sortByLastName(people), null, 2)
  ], { type: 'application/json' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = 'my-rolodex.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

$('#prevBtn').onclick = () => moveDeck(-1);
$('#nextBtn').onclick = () => moveDeck(1);

$('#search').oninput = () => {
  deckIndex = 0;
  renderDeck();
};

<<<<<<< HEAD
$('#deckWindow').addEventListener('wheel', event => {
  event.preventDefault();
  moveDeck(event.deltaY > 0 ? 1 : -1);
}, { passive: false });

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') moveDeck(1);
  if (event.key === 'ArrowLeft') moveDeck(-1);
});

$('#deckWindow').addEventListener('pointerdown', event => {
  dragStart = event.clientX;
});

$('#deckWindow').addEventListener('pointerup', event => {
  if (dragStart === null) return;

  const distance = event.clientX - dragStart;
  if (Math.abs(distance) > 45) moveDeck(distance < 0 ? 1 : -1);
  dragStart = null;
});

$('#addBtn').onclick = () => {
  $('#personForm').reset();
  $('#personDialog').showModal();
};

$('#cancelBtn').onclick = () => $('#personDialog').close();

$('#personForm').onsubmit = event => {
  event.preventDefault();

  const person = buildPerson(new FormData(event.target));
  people.push(person);
  activeLetter = 'ALL';
  deckIndex = sortByLastName(people).findIndex(item => item.id === person.id);

  savePeople();
  $('#personDialog').close();
  render();
};

$('#exportBtn').onclick = exportPeople;

=======
const removeContact = (contact) => {
  if (!window.confirm(`Remove ${contact.name} from your orbit?`)) return;
  contacts = contacts.filter((item) => item !== contact);
  saveContacts();
  render();
  showToast(`${contact.name} was removed.`);
};

const addContact = ({ name, where, facts, tag = 'NEW CONNECTION', color = 'green', meta = 'Pronouns not set' }) => {
  const incoming = { id: newId(), name: clean(name) || 'New connection', where: clean(where), facts: uniqueFacts(facts), tag, color, meta, added: 'Added just now' };
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

const aiContactPayload = (contact) => ({
  id: contact.id,
  name: contact.name,
  where: contact.where || '',
  summary: contact.summary || '',
  facts: factsFor(contact),
});

const saveWithAI = async (note, fallback) => {
  const response = await fetch('/api/merge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts: contacts.map(aiContactPayload), new_note: note }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'The AI merge request failed.');
  }
  const result = await response.json();
  const aiContact = result.contact || {};
  const matchIndex = contacts.findIndex((contact) => contact.id === result.matched_contact_id);
  const previous = matchIndex >= 0 ? contacts[matchIndex] : null;
  const updated = {
    ...(previous || {}),
    id: previous?.id || newId(),
    name: clean(aiContact.name) || fallback.name,
    where: clean(aiContact.where) || previous?.where || fallback.where,
    summary: clean(aiContact.summary) || previous?.summary || '',
    facts: uniqueFacts(aiContact.facts?.length ? aiContact.facts : fallback.facts),
    tag: previous?.tag || 'NEW CONNECTION',
    color: previous?.color || 'green',
    meta: previous?.meta || 'Pronouns not set',
    added: previous ? 'AI updated just now' : 'Added just now',
  };
  if (matchIndex >= 0) contacts[matchIndex] = updated;
  else contacts.unshift(updated);
  saveContacts();
  render();
  showToast(previous ? `${updated.name} updated by AI.` : `${updated.name} was added by AI.`);
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

generateButton.addEventListener('click', async () => {
  const text = transcript.value.trim();
  if (!text) return showToast('Add a voice note or a few details first.');
  const fallback = parseCapture(text);
  generateButton.disabled = true;
  captureHint.textContent = 'AI is matching this note and organizing the profile…';
  try {
    await saveWithAI(text, fallback);
  } catch (error) {
    addContact(fallback);
    showToast(`Saved locally — AI is unavailable right now.`);
    console.warn(error);
  } finally {
    generateButton.disabled = false;
    captureHint.textContent = 'Voice notes become an organized profile in seconds.';
    transcript.value = '';
  }
});

searchInput.addEventListener('input', render);
document.querySelectorAll('.filter:not(.manual-trigger)').forEach((filter) => filter.addEventListener('click', () => {
  document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
  filter.classList.add('active');
  sortMode = filter.textContent === 'A–Z' ? 'az' : filter.textContent === 'Recently added' ? 'recent' : 'all';
  render();
}));
manualForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(manualForm);
  const fallback = { name: data.get('name'), where: data.get('where'), facts: [data.get('memory')] };
  try { await saveWithAI(`${fallback.name}. ${fallback.where}. ${fallback.facts[0]}`, fallback); }
  catch (error) { addContact(fallback); console.warn(error); }
  manualForm.reset();
  manualPanel.hidden = true;
});
closeManualButton.addEventListener('click', () => { manualPanel.hidden = true; });
manualTrigger.addEventListener('click', () => { manualPanel.hidden = false; manualForm.querySelector('input').focus(); });
document.addEventListener('keydown', (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); transcript.focus(); } });

// Persist the migration from the old one-memory shape to the merged facts shape.
saveContacts();
>>>>>>> f220561ba671df243a51dc75a85dac09af8bb944
render();
