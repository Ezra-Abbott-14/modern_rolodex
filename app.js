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

let people = loadPeople();
let activeLetter = 'ALL';
let deckIndex = 0;
let visiblePeople = sortByLastName(people);
let dragStart = null;

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
  moveDeck(event.deltaY > 0 ? 1 : -1);
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
  setCaptureStatus('Dictate or type, extract the details, then review and save below.');
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
  people.push(person);
  try {
    savePeople();
  } catch {
    people = previousPeople;
    setCaptureStatus('Your browser could not save this card. Export existing cards or free browser storage, then retry.', true);
    return;
  }
  activeLetter = 'ALL';
  $('#search').value = '';
  deckIndex = sortByLastName(people).findIndex(item => item.id === person.id);

  $('#personDialog').close();
  render();
};

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

render();
