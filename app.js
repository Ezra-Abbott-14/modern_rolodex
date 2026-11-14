import { initStreetValleyWorld } from './street_valley_world.js';
import { extractProfile } from './profile-api.mjs';

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
];

const STREET_VALLEY_LINES = {
  'maya rodriguez': 'Creative brain, neighborhood energy — she makes the room feel less like a pitch and more like a place to belong.',
  'maya': 'Artist energy with a real-world calendar — the kind of person who turns a gallery plan into a reason to reconnect.',
  'maya chen': 'A thoughtful designer who can make a big idea feel like a conversation over coffee.',
  'jon bell': 'The friend who remembers your breakfast order and turns a five-minute coffee into a real check-in.',
  'priya shah': 'Sharp questions, warm follow-through — she wants the honest version, then helps make it useful.',
  'theo martin': 'Chases good light and quiet roads; the camera is just how he stays curious.',
  'willow brooks': 'Soft-spoken maker energy, with strong opinions about soup and the tiny objects that make a home.',
  'avery chen': 'Balcony-garden optimist; will hand you a tomato and a plan before you can say you are too busy.',
  'omar patel': 'Bookshop neighbor who turns a recommendation into a conversation and remembers what you were looking for.',
  'nina kim': 'Sees the funny little creature in everyone; her eye for old design makes ordinary things feel alive.',
  'elliot james': 'Collects the sounds most people walk past, because he knows a city is made of small moments.'
};

const DEFAULT_GENDERS = {
  'maya rodriguez': 'female',
  'maya chen': 'female',
  'maya': 'female',
  'jon bell': 'male',
  'priya shah': 'female',
  'theo martin': 'male',
  'willow brooks': 'female',
  'omar patel': 'male',
  'nina kim': 'female'
};

let people = loadPeople();
let activeLetter = 'ALL';
let deckIndex = 0;
let visiblePeople = sortByLastName(people);
let dragStart = null;
let wheelDelta = 0;
let wheelLocked = false;

const $ = selector => document.querySelector(selector);

function loadPeople() {
  try {
    const saved = JSON.parse(localStorage.getItem('retro-rolodex') || 'null');
    if (Array.isArray(saved) && saved.every(person => person && typeof person.name === 'string' && person.name.trim() && Array.isArray(person.tags))) return saved;
  } catch { /* Recover gracefully from unavailable or corrupted storage. */ }
  return structuredClone(seed);
}

function savePeople() {
  localStorage.setItem('retro-rolodex', JSON.stringify(people));
}

function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function samePerson(first, second) {
  const firstKey = normalizeName(first);
  return firstKey !== '' && firstKey === normalizeName(second);
}

function getPersonGender(person) {
  return person.gender === undefined
    ? DEFAULT_GENDERS[normalizeName(person.name)] || ''
    : person.gender;
}

function getGenderClass(person) {
  const gender = normalizeName(getPersonGender(person));
  if (gender === 'male' || gender === 'man') return 'male';
  if (gender === 'female' || gender === 'woman') return 'female';
  return 'human';
}

function getGenderLabel(person) {
  const gender = getGenderClass(person);
  return gender === 'male' ? 'MALE HUMAN' : gender === 'female' ? 'FEMALE HUMAN' : 'HUMAN / NOT SET';
}

function trimSentence(value) {
  return String(value || '').trim().replace(/[.!?]+$/, '');
}

function getStreetValleyLine(person) {
  const knownLine = person.streetValley || STREET_VALLEY_LINES[normalizeName(person.name)];
  if (knownLine) return knownLine;

  const name = person.name.trim() || 'This person';
  const role = person.role && !['New connection', '—'].includes(person.role.trim())
    ? trimSentence(person.role)
    : '';
  const met = person.met && !['Somewhere interesting', '—'].includes(person.met.trim())
    ? trimSentence(person.met)
    : '';
  const city = person.city && person.city.trim() !== '—' ? trimSentence(person.city) : '';
  const memory = person.notes && person.notes !== 'Add a note next time you see them.'
    ? trimSentence(person.notes.split('\n')[0])
    : '';

  const identity = role
    ? `${name} is a real person before they are a ${role}`
    : `${name} is more than a contact`;
  const context = [
    met ? `You met at ${met}` : '',
    city ? `they are based in ${city}` : ''
  ].filter(Boolean).join('; ');
  const thread = memory
    ? `The human thread to keep: “${memory}”`
    : 'Keep the small detail that made you want to stay in touch';

  return `${identity}.${context ? ` ${context}.` : ''} ${thread}.`;
}

function mergeUnique(first, second) {
  return [...new Set([...(first || []), ...(second || [])].map(value => String(value).trim()).filter(Boolean))];
}

function mergePerson(existing, incoming) {
  for (const field of ['role', 'met', 'city', 'phone', 'email', 'appearance', 'gender', 'pronouns']) {
    if (incoming[field] && incoming[field] !== '—' && incoming[field] !== 'New connection' && incoming[field] !== 'Somewhere interesting') {
      existing[field] = incoming[field];
    }
  }
  if (incoming.notes && incoming.notes !== 'Add a note next time you see them.') {
    const oldNotes = String(existing.notes || '');
    if (!oldNotes.toLowerCase().includes(incoming.notes.toLowerCase())) {
      existing.notes = oldNotes ? `${oldNotes}\n• ${incoming.notes}` : incoming.notes;
    }
  }
  existing.events = mergeUnique(existing.events, incoming.events);
  existing.tags = mergeUnique(existing.tags, incoming.tags);
  return existing;
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
      person.appearance,
      person.gender,
      person.pronouns,
      ...(person.events || []),
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
      <div class="card-tab">${escapeHtml(firstLetter)}</div>

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

      <div class="street-valley-note ${getGenderClass(person)}">
        <div class="street-valley-header">
          <div class="street-valley-portrait ${getGenderClass(person)}" aria-hidden="true">
            <span class="pixel-hair"></span><span class="pixel-face"></span><span class="pixel-eye left"></span><span class="pixel-eye right"></span><span class="pixel-body"></span><span class="pixel-shirt"></span>
          </div>
          <div><div class="street-valley-kicker">STREET VALLEY · HUMAN TAKE</div><div class="street-valley-gender">${getGenderLabel(person)}</div></div>
        </div>
        <div class="street-valley-copy">${escapeHtml(getStreetValleyLine(person))}</div>
      </div>

      <div class="tags">${tags}</div>
      <div class="memory-details">
        ${person.appearance ? `<p><span class="label">Appearance</span><br>${escapeHtml(person.appearance)}</p>` : ''}
        ${person.gender ? `<p><span class="label">Gender</span><br>${escapeHtml(person.gender)}</p>` : ''}
        ${person.pronouns ? `<p><span class="label">Pronouns</span><br>${escapeHtml(person.pronouns)}</p>` : ''}
        ${person.events?.length ? `<p><span class="label">Memorable events</span><br>${person.events.map(escapeHtml).join('<br>')}</p>` : ''}
      </div>
      <div class="card-number">CARD ${escapeHtml(String(person.id))} · LAST NAME: ${escapeHtml(lastName)}</div>
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
    appearance: form.get('appearance') || '',
    gender: form.get('gender') || '',
    pronouns: form.get('pronouns') || '',
    events: (form.get('events') || '').split('\n').map(value => value.trim()).filter(Boolean),
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

$('#deckWindow').addEventListener('wheel', event => {
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
  if ($('#personDialog').open || /INPUT|TEXTAREA/.test(event.target.tagName)) return;
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
  setCaptureStatus('Type a note, extract the details, then review and save below.');
  $('#personDialog').showModal();
};

$('#cancelBtn').onclick = () => $('#personDialog').close();
$('#personDialog').addEventListener('cancel', event => {
  if (extracting) event.preventDefault();
});

$('#personForm').onsubmit = event => {
  event.preventDefault();

  if (extracting) return;
  const person = buildPerson(new FormData(event.target));
  if (!person.name) return setCaptureStatus('Please enter the person’s name.', true);
  const previousPeople = [...people];
  const existing = people.find(item => samePerson(item.name, person.name));
  const savedPerson = existing ? mergePerson(existing, person) : person;
  if (!existing) people.push(person);
  try {
    savePeople();
  } catch {
    people = previousPeople;
    setCaptureStatus('Your browser could not save this card. Export existing cards or free browser storage, then retry.', true);
    return;
  }
  activeLetter = 'ALL';
  $('#search').value = '';
  deckIndex = sortByLastName(people).findIndex(item => item.id === savedPerson.id);

  $('#personDialog').close();
  render();
  setCaptureStatus(existing ? `${existing.name} updated — new information was added to the same card.` : `${person.name} added.`);
};

$('#exportBtn').onclick = exportPeople;

let extracting = false;

function setCaptureStatus(message, error = false) {
  $('#serviceHelp').hidden = true;
  $('#captureStatus').textContent = message;
  $('#captureStatus').classList.toggle('error', error);
}

$('#generateBtn').onclick = async () => {
  if (extracting) return;
  const note = $('#meetingNote').value.trim();
  if (!note) return setCaptureStatus('Type a note before extracting a profile.', true);
  extracting = true;
  $('#cancelBtn').disabled = true;
  $('#generateBtn').disabled = true;
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
    $('#serviceHelp').hidden = !['WRONG_SERVER', 'BACKEND_UNREACHABLE'].includes(error.code);
  } finally {
    extracting = false;
    $('#cancelBtn').disabled = false;
    $('#generateBtn').disabled = false;
    $('#meetingNote').readOnly = false;
    $('#personForm .modal-actions button:last-child').disabled = false;
    $('#generateBtn').textContent = 'Extract profile';
  }
};

function populateUpdateNames() {
  const select = $('#updateName');
  select.replaceChildren();
  sortByLastName(people).forEach(person => {
    const option = document.createElement('option');
    option.value = person.name;
    option.textContent = person.name;
    select.append(option);
  });
  loadUpdateFields();
}

function loadUpdateFields() {
  const person = people.find(item => samePerson(item.name, $('#updateName').value));
  if (!person) return;
  document.querySelectorAll('[data-update-value]').forEach(input => {
    const field = input.dataset.updateValue;
    input.value = field === 'tags'
      ? (person.tags || []).join(', ')
      : field === 'events'
        ? (person.events || []).join('\n')
        : person[field] || '';
    input.disabled = true;
    const checkbox = document.querySelector(`[data-field="${field}"]`);
    if (checkbox) checkbox.checked = false;
  });
}

$('#updateBtn').onclick = () => {
  if (!people.length) return;
  populateUpdateNames();
  $('#updateDialog').showModal();
};

$('#cancelUpdateBtn').onclick = () => $('#updateDialog').close();
$('#updateName').onchange = loadUpdateFields;
document.querySelectorAll('[data-field]').forEach(checkbox => {
  checkbox.onchange = () => {
    const input = document.querySelector(`[data-update-value="${checkbox.dataset.field}"]`);
    if (input) input.disabled = !checkbox.checked;
  };
});

$('#updateForm').onsubmit = event => {
  event.preventDefault();
  const person = people.find(item => samePerson(item.name, $('#updateName').value));
  const selected = [...event.target.querySelectorAll('[data-field]:checked')];
  if (!person) return;
  if (!selected.length) return window.alert('Select at least one field to update.');
  selected.forEach(checkbox => {
    const field = checkbox.dataset.field;
    const input = event.target.querySelector(`[data-update-value="${field}"]`);
    if (field === 'tags') person.tags = input.value.split(',').map(value => value.trim()).filter(Boolean);
    else if (field === 'events') person.events = input.value.split('\n').map(value => value.trim()).filter(Boolean);
    else person[field] = input.value.trim();
  });
  savePeople();
  $('#updateDialog').close();
  activeLetter = 'ALL';
  $('#search').value = '';
  deckIndex = sortByLastName(people).findIndex(item => item.id === person.id);
  render();
};

render();

initStreetValleyWorld({
  canvas: document.querySelector('#streetValleyCanvas'),
  getContacts: () => people
});
