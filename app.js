<<<<<<< HEAD
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
let sortMode = 'all';

const seedContacts = [
  { name: 'Maya Chen', where: 'Met at the Saturday market', facts: ['Artist', 'First gallery show is in October.'], tag: 'CREATIVE SPARK', color: 'coral', meta: 'She / her' },
  { name: 'Jon Bell', where: 'Introduced by Nora at Bloom', facts: ['Training for his first half marathon.'], tag: 'GOOD ENERGY', color: 'blue', meta: 'He / him' },
  { name: 'Amara Lewis', where: 'On the train to Portland', facts: ['Knows the best tiny bookstores.'], tag: 'THE CONNECTOR', color: 'yellow', meta: 'She / her' },
=======
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
  },
  {
    id: 5,
    name: 'Willow Brooks',
    role: 'Ceramicist · Soft Corner Studio',
    met: 'A rainy Sunday flea market',
    city: 'Seattle, WA',
    phone: '(206) 555-0191',
    email: 'willow@softcorner.studio',
    notes: 'Makes tiny blue vases and keeps a list of every good soup she has ever had.',
    tags: ['ceramics', 'art', 'soup'],
    avatar: 'WB',
    tone: 'rust'
  },
  {
    id: 6,
    name: 'Avery Chen',
    role: 'Urban Gardener · Greenline',
    met: 'The community garden workday',
    city: 'Denver, CO',
    phone: '(303) 555-0168',
    email: 'avery@greenline.co',
    notes: 'Growing tomatoes on a balcony and trying to convince everyone that marigolds belong in every garden.',
    tags: ['plants', 'community', 'outdoors'],
    avatar: 'AC',
    tone: 'gold'
  },
  {
    id: 7,
    name: 'Omar Patel',
    role: 'Independent Bookshop Owner',
    met: 'The bookstore reading series',
    city: 'Portland, OR',
    phone: '(503) 555-0135',
    email: 'omar@paperlanternbooks.com',
    notes: 'Recommended three strange and wonderful novels. Ask him about the author who writes entirely on postcards.',
    tags: ['books', 'writing', 'local'],
    avatar: 'OP',
    tone: 'teal'
  },
  {
    id: 8,
    name: 'Nina Kim',
    role: 'Illustrator · Freelance',
    met: 'A tiny poster show downtown',
    city: 'Los Angeles, CA',
    phone: '(323) 555-0174',
    email: 'hello@ninakimdraws.com',
    notes: 'Draws expressive little animals and has a very good eye for vintage matchbook design.',
    tags: ['illustration', 'design', 'vintage'],
    avatar: 'NK',
    tone: 'rust'
  },
  {
    id: 9,
    name: 'Elliot James',
    role: 'Sound Designer · Field Notes Audio',
    met: 'The neighborhood record store',
    city: 'Brooklyn, NY',
    phone: '(718) 555-0116',
    email: 'elliot@fieldnotesaudio.com',
    notes: 'Records small everyday sounds: train doors, grocery carts, and the click of old light switches.',
    tags: ['music', 'audio', 'curious'],
    avatar: 'EJ',
    tone: 'gold'
  }
>>>>>>> d224744b696f5e66fac191d4e9d8d09289b1642a
];

let people = loadPeople();
let activeLetter = 'ALL';
let deckIndex = 0;
let visiblePeople = [];
let dragStart = null;

const $ = selector => document.querySelector(selector);

function loadPeople() {
  return JSON.parse(localStorage.getItem('retro-rolodex') || 'null') || seed;
}

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
    $('#prevBtn').disabled = true;
    $('#nextBtn').disabled = true;
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
  const blob = new Blob([JSON.stringify(sortByLastName(people), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'my-rolodex.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

function populateUpdateNames() {
  const select = $('#updateName');
  select.replaceChildren();
  sortByLastName(people).forEach((person) => {
    const option = document.createElement('option');
    option.value = person.name;
    option.textContent = person.name;
    select.append(option);
  });
  loadUpdateFields();
}

function loadUpdateFields() {
  const person = people.find((item) => samePerson(item.name, $('#updateName').value));
  if (!person) return;
  document.querySelectorAll('[data-update-value]').forEach((input) => {
    const field = input.dataset.updateValue;
    input.value = field === 'tags' ? person.tags.join(', ') : person[field] || '';
    input.disabled = true;
    const checkbox = document.querySelector(`[data-field="${field}"]`);
    if (checkbox) checkbox.checked = false;
  });
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

$('#search').oninput = () => {
  deckIndex = 0;
  renderDeck();
};

<<<<<<< HEAD
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
=======
$('#deckWindow').addEventListener('wheel', event => {
>>>>>>> d224744b696f5e66fac191d4e9d8d09289b1642a
  event.preventDefault();
  if (wheelLocked) return;
  wheelDelta += event.deltaY;
  if (Math.abs(wheelDelta) < 100) return;
  moveDeck(wheelDelta > 0 ? 1 : -1);
  wheelDelta = 0;
  wheelLocked = true;
  window.setTimeout(() => { wheelLocked = false; }, 550);
}, { passive: false });

document.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') moveDeck(1);
  if (event.key === 'ArrowLeft') moveDeck(-1);
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); transcript.focus(); }
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
  showToast(`${person.name} updated.`);
};
$('#personForm').onsubmit = (event) => { event.preventDefault(); const person = buildPerson(new FormData(event.target)); const existing = people.find((item) => samePerson(item.name, person.name)); if (existing) { existing.notes = `${existing.notes}\n• ${person.notes}`; showToast(`${existing.name} updated.`); } else { people.push(person); showToast(`${person.name} added.`); } savePeople(); $('#personDialog').close(); activeLetter = 'ALL'; deckIndex = 0; render(); };
$('#exportBtn').onclick = exportPeople;

let extracting = false;
let recognition;
let listening = false;
let noteBeforeRecording = '';

function setCaptureStatus(message, error = false) {
  $('#serviceHelp').hidden = true;
  $('#captureStatus').textContent = message;
  $('#captureStatus').classList.toggle('error', error);
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = event => {
    const words = Array.from(event.results).map(result => result[0].transcript).join(' ');
    $('#meetingNote').value = [noteBeforeRecording, words].filter(Boolean).join(' ').slice(0, 8000);
  };
  recognition.onerror = event => {
    setCaptureStatus(event.error === 'not-allowed'
      ? 'Microphone access was denied. Allow it in your browser or type your note.'
      : 'Dictation stopped. Check your microphone and connection, or type your note.', true);
  };
  recognition.onend = () => {
    listening = false;
    $('#recordBtn').textContent = '● Dictate a note';
    $('#recordBtn').setAttribute('aria-pressed', 'false');
  };
} else {
  $('#recordBtn').disabled = true;
  $('#recordBtn').title = 'Use Chrome or Edge for dictation, or type your note.';
}

$('#recordBtn').onclick = () => {
  if (!recognition) return;
  if (listening) return recognition.stop();
  noteBeforeRecording = $('#meetingNote').value.trim();
  try {
    recognition.start();
    listening = true;
    $('#recordBtn').textContent = '■ Stop dictation';
    $('#recordBtn').setAttribute('aria-pressed', 'true');
    setCaptureStatus('Listening… tell us their name and the details you want to remember.');
  } catch {
    setCaptureStatus('Could not start dictation. Try again or type your note.', true);
  }
};

$('#personDialog').addEventListener('close', () => {
  if (listening) recognition.stop();
});

$('#generateBtn').onclick = async () => {
  if (extracting) return;
  const note = $('#meetingNote').value.trim();
  if (!note) return setCaptureStatus('Dictate or type a note before extracting a profile.', true);
  if (listening) recognition.stop();
  extracting = true;
  $('#cancelBtn').disabled = true;
  $('#generateBtn').disabled = true;
  $('#recordBtn').disabled = true;
  $('#meetingNote').readOnly = true;
  $('#personForm .modal-actions button:last-child').disabled = true;
  $('#generateBtn').textContent = 'Extracting…';
  setCaptureStatus('Finding the details in your memory…');
  try {
    const profile = await extractProfile(note);
    for (const name of ['name', 'role', 'met', 'city', 'phone', 'email', 'notes', 'gender', 'pronouns', 'appearance']) {
      $('#personForm').elements.namedItem(name).value = profile[name] || '';
    }
    $('#personForm').elements.namedItem('events').value = (profile.events || []).join('\n');
    $('#personForm').elements.namedItem('tags').value = (profile.tags || []).join(', ');
    setCaptureStatus('Details extracted with Gemini. Review them below, then save your card.');
  } catch (error) {
    setCaptureStatus(error.message, true);
    $('#serviceHelp').hidden = error.code !== 'WRONG_SERVER';
  } finally {
    extracting = false;
    $('#cancelBtn').disabled = false;
    $('#generateBtn').disabled = false;
    $('#recordBtn').disabled = !recognition;
    $('#meetingNote').readOnly = false;
    $('#personForm .modal-actions button:last-child').disabled = false;
    $('#generateBtn').textContent = 'Extract profile';
  }
};

savePeople();
render();
