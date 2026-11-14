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

render();
