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

render();
