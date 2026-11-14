import { initStreetValleyWorld } from './street_valley_world.js';
import { extractProfile, populateProfileForm } from './profile-api.mjs';

const introLoader = document.querySelector('#introLoader');
if (introLoader) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const introDuration = reducedMotion ? 250 : 5300;
  window.setTimeout(() => {
    introLoader.classList.add('is-done');
    introLoader.setAttribute('aria-hidden', 'true');
    document.body.classList.add('animation-done');
    document.body.classList.remove('animation-lock');
    window.setTimeout(() => introLoader.remove(), 550);
  }, introDuration);
}

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

const CONTACT_FIELDS = ['name', 'role', 'met', 'city', 'phone', 'email', 'notes', 'gender', 'pronouns', 'appearance'];
let people = [];
let storageReady = false;
let storageLoading = true;
let activeLetter = 'ALL';
let deckIndex = 0;
let visiblePeople = sortByLastName(people);
let dragStart = null;
let wheelDelta = 0;
let wheelLocked = false;

const $ = selector => document.querySelector(selector);

const sessionToken = document.querySelector('meta[name="csrf-token"]')?.content;
if (sessionToken) {
  $('#logoutBtn').hidden = false;
  $('#logoutBtn').onclick = async () => {
    try {
      const response = await fetch('/logout', {method:'POST',headers:{'X-CSRF-Token':sessionToken}});
      if (!response.ok) throw new Error();
      window.location.assign('/login');
    } catch { window.alert('Sign out failed. Check your connection and retry.'); }
  };
}

function apiError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(path, {
      ...options,
      headers: {'Content-Type': 'application/json',
        ...(sessionToken ? {'X-CSRF-Token': sessionToken} : {}),
        ...(options.headers || {})}
    });
  } catch {
    throw apiError('The database server could not be reached. Start the backend and try again.', 'BACKEND_UNREACHABLE');
  }
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    throw apiError('The database server returned an invalid response. Try again.', 'BAD_RESPONSE');
  }
  if (!response.ok) throw apiError(payload.error || `Database request failed (${response.status}).`, payload.code || 'DATABASE_ERROR');
  return payload;
}

function toUiPerson(contact, index = 0) {
  const name = String(contact.name || '').trim();
  return {
    ...contact,
    name,
    role: contact.role || 'New connection',
    met: contact.met || 'Somewhere interesting',
    city: contact.city || '—',
    phone: contact.phone || '—',
    email: contact.email || '—',
    notes: contact.notes || 'Add a note next time you see them.',
    events: Array.isArray(contact.events) ? contact.events : [],
    tags: Array.isArray(contact.tags) ? contact.tags : [],
    avatar: name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase(),
    tone: ['teal', 'rust', 'gold'][index % 3]
  };
}

function contactPayload(person, sourceText) {
  const payload = {};
  CONTACT_FIELDS.forEach(field => { payload[field] = person[field] ?? null; });
  payload.events = Array.isArray(person.events) ? person.events : [];
  payload.tags = Array.isArray(person.tags) ? person.tags : [];
  if (sourceText) payload.source_text = sourceText;
  return payload;
}

async function loadPeople() {
  const payload = await apiRequest('/api/contacts');
  if (!Array.isArray(payload.contacts)) throw apiError('The database returned an invalid contact list.', 'BAD_RESPONSE');
  return payload.contacts.map((contact, index) => toUiPerson(contact, index));
}

async function createPerson(person, sourceText) {
  const payload = await apiRequest('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(contactPayload(person, sourceText))
  });
  return toUiPerson(payload.contact, people.length);
}

async function updatePerson(id, changes) {
  const payload = await apiRequest(`/api/contacts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes)
  });
  return toUiPerson(payload.contact, people.findIndex(person => person.id === id));
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

  const stack = $('#cardStack');
  const flipClass = amount > 0 ? 'flip-next' : 'flip-prev';
  stack.classList.remove('flip-next', 'flip-prev');
  void stack.offsetWidth;
  stack.classList.add(flipClass);
  deckIndex = Math.max(0, Math.min(
    deckIndex + amount,
    visiblePeople.length - 1
  ));
  renderDeck();
  window.setTimeout(() => stack.classList.remove(flipClass), 620);
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
  if ($('#personDialog').open || $('#updateDialog').open || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
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
  if (!storageReady) return setCaptureStatus('The database is still loading. Try again in a moment.', true);
  $('#personForm').reset();
  setCaptureStatus('Add a note, organize the details, then review and save below.');
  $('#personDialog').showModal();
};

$('#cancelBtn').onclick = () => $('#personDialog').close();
$('#personDialog').addEventListener('cancel', event => {
  if (extracting) event.preventDefault();
});

$('#personForm').onsubmit = async event => {
  event.preventDefault();

  if (extracting || !storageReady) return;
  const person = buildPerson(new FormData(event.target));
  if (!person.name) return setCaptureStatus('Please enter the person’s name.', true);
  try {
    const savedPerson = await createPerson(person, $('#meetingNote').value.trim());
    people.push(savedPerson);
    activeLetter = 'ALL';
    $('#search').value = '';
    deckIndex = sortByLastName(people).findIndex(item => item.id === savedPerson.id);
    $('#personDialog').close();
    render();
    setCaptureStatus(`${savedPerson.name} added.`);
  } catch (error) {
    setCaptureStatus(error.message, true);
  }
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
  if (!note) return setCaptureStatus('Add a note before organizing it.', true);
  extracting = true;
  $('#cancelBtn').disabled = true;
  $('#generateBtn').disabled = true;
  $('#meetingNote').readOnly = true;
  $('#personForm .modal-actions button:last-child').disabled = true;
  $('#generateBtn').textContent = 'Extracting…';
  setCaptureStatus('Organizing your note…');
  try {
    const profile = await extractProfile(note);
    for (const name of ['name', 'role', 'met', 'city', 'phone', 'email', 'notes', 'gender', 'pronouns', 'appearance']) {
      $('#personForm').elements.namedItem(name).value = profile[name] || '';
    }
    $('#personForm').elements.namedItem('events').value = (profile.events || []).join('\n');
    $('#personForm').elements.namedItem('tags').value = (profile.tags || []).join(', ');
    setCaptureStatus('Details organized. Review them below, then save your card.');
    populateProfileForm($('#personForm'), profile);
    setCaptureStatus('Details extracted with Gemini. Review them below, then save your card.');
  } catch (error) {
    setCaptureStatus(error.message, true);
    const expired = ['AUTH_REQUIRED', 'CSRF_FAILED'].includes(error.code);
    $('#serviceHelp').hidden = !expired && !['WRONG_SERVER', 'BACKEND_UNREACHABLE'].includes(error.code);
    if (expired) {
      const link = $('#serviceHelp a');
      link.href = '/login';
      link.textContent = 'Sign in again, then refresh this page (copy your note first)';
    }
  } finally {
    extracting = false;
    $('#cancelBtn').disabled = false;
    $('#generateBtn').disabled = false;
    $('#meetingNote').readOnly = false;
    $('#personForm .modal-actions button:last-child').disabled = false;
    $('#generateBtn').textContent = 'Organize note';
  }
};

function populateUpdateNames() {
  const select = $('#updateName');
  select.replaceChildren();
  sortByLastName(people).forEach(person => {
    const option = document.createElement('option');
    option.value = person.id;
    option.textContent = person.name;
    select.append(option);
  });
  loadUpdateFields();
}

function loadUpdateFields() {
  const person = people.find(item => String(item.id) === String($('#updateName').value));
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

$('#updateForm').onsubmit = async event => {
  event.preventDefault();
  const person = people.find(item => String(item.id) === String($('#updateName').value));
  const selected = [...event.target.querySelectorAll('[data-field]:checked')];
  if (!person) return;
  if (!selected.length) return window.alert('Select at least one field to update.');
  const changes = {};
  selected.forEach(checkbox => {
    const field = checkbox.dataset.field;
    const input = event.target.querySelector(`[data-update-value="${field}"]`);
    changes[field] = field === 'tags'
      ? input.value.split(',').map(value => value.trim()).filter(Boolean)
      : field === 'events'
        ? input.value.split('\n').map(value => value.trim()).filter(Boolean)
        : input.value.trim();
  });
  try {
    const savedPerson = await updatePerson(person.id, changes);
    people = people.map(item => item.id === person.id ? savedPerson : item);
    $('#updateDialog').close();
    activeLetter = 'ALL';
    $('#search').value = '';
    deckIndex = sortByLastName(people).findIndex(item => item.id === person.id);
    render();
  } catch (error) {
    window.alert(error.message);
  }
};

const aboutDialog = $('#aboutDialog');
$('#aboutBtn').onclick = () => aboutDialog.showModal();
$('#aboutCloseBtn').onclick = () => aboutDialog.close();
$('#aboutReturnBtn').onclick = () => aboutDialog.close();
aboutDialog.addEventListener('click', event => {
  if (event.target === aboutDialog) aboutDialog.close();
});

const whyCopy = $('[data-why-copy]');
const whyTitle = $('[data-why-title]');
const whyDetail = $('[data-why-detail]');
const whyTabs = document.querySelectorAll('[data-why-tab]');
const whyContent = {
  remember: {
    copy: 'Rolodexi reinvents the old card file as a quiet place to save the small detail you want to remember next time.',
    title: 'One person.<br />One living card.',
    detail: 'Where you met.<br />What to pick up.'
  },
  organize: {
    copy: 'We built Rolodexi to turn scattered contact notes into an accessible, self-writing archive that can keep growing with you.',
    title: 'Why we did<br />that.',
    detail: 'Searchable database.<br />Available on the web.<br />Self-writing card.<br />Replicable with JSON.'
  }
};

whyTabs.forEach(tab => {
  tab.onclick = () => {
    const content = whyContent[tab.dataset.whyTab];
    if (!content) return;
    whyTabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    whyCopy.innerHTML = `${content.copy}`;
    whyTitle.innerHTML = content.title;
    whyDetail.innerHTML = content.detail;
  };
});

// Keep the ma prototype's movable-block interaction: the archive cards and
// editorial bento cards gently follow the pointer, then settle back in place.
const movableGroups = [
  { parent: '.machine', items: '.contact-card', strength: 12 },
  { parent: '.why-bento', items: '.why-bento-card', strength: 18 }
];

movableGroups.forEach(({ parent, items, strength }) => {
  const area = document.querySelector(parent);
  if (!area) return;
  area.addEventListener('pointermove', event => {
    const rect = area.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    [...area.querySelectorAll(items)].forEach((block, index) => {
      const depth = Math.min(strength, 7) * (1 + index * .08);
      const tilt = x * (index % 2 ? -.45 : .45);
      block.classList.add('is-moving');
      block.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0) rotate(${tilt}deg)`;
    });
  });
  area.addEventListener('pointerleave', () => {
    [...area.querySelectorAll(items)].forEach(block => {
      block.classList.remove('is-moving');
      block.style.transform = '';
    });
  });
});

render();

async function startApp() {
  try {
    people = await loadPeople();
    storageReady = true;
    storageLoading = false;
    render();
    setCaptureStatus(people.length ? `${people.length} saved contact${people.length === 1 ? '' : 's'} loaded.` : 'Your database is ready. Add your first connection.');
  } catch (error) {
    storageLoading = false;
    setCaptureStatus(error.message, true);
  }
}

startApp();

initStreetValleyWorld({
  canvas: document.querySelector('#streetValleyCanvas'),
  getContacts: () => people
});
