const recordButton = document.querySelector('#recordButton');
const transcript = document.querySelector('#transcript');
const generateButton = document.querySelector('#generateButton');
const profileGrid = document.querySelector('#profileGrid');
const profileCount = document.querySelector('#profileCount');
const captureHint = document.querySelector('#captureHint');
const toast = document.querySelector('#toast');

let recognition;
let listening = false;

const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3200);
};

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.onresult = (event) => {
    transcript.value = Array.from(event.results).map((result) => result[0].transcript).join('');
  };
  recognition.onend = () => {
    listening = false;
    recordButton.classList.remove('recording');
    recordButton.querySelector('.record-label').textContent = 'Tap to speak';
    captureHint.textContent = 'Voice note captured. Ready to make a profile?';
  };
  recognition.onerror = () => showToast('I couldn’t hear that. Try again or type your note.');
} else {
  captureHint.textContent = 'Voice input is not supported here, but you can type your note.';
}

recordButton.addEventListener('click', () => {
  if (!recognition) return showToast('Voice input is not supported by this browser.');
  if (listening) {
    recognition.stop();
    return;
  }
  transcript.focus();
  recognition.start();
  listening = true;
  recordButton.classList.add('recording');
  recordButton.querySelector('.record-label').textContent = 'Listening…';
  captureHint.textContent = 'Speak naturally — I’ll keep the important details.';
});

const extract = (text, patterns, fallback) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim().replace(/[.!?]+$/, '');
  }
  return fallback;
};

generateButton.addEventListener('click', () => {
  const text = transcript.value.trim();
  if (!text) return showToast('Add a voice note or a few details first.');

  const name = extract(text, [/(?:about|met|named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/, /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/], 'New connection');
  const where = extract(text, [/(?:at|on|through|during)\s+([^.!?]+)/i], 'A memorable first meeting');
  const event = extract(text, [/(?:told me|mentioned|remember that|is)\s+([^.!?]+)/i], 'A detail worth remembering');
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const card = document.createElement('article');
  card.className = 'profile-card green';
  card.style.background = '#b8d6a5';
  card.innerHTML = `<div class="card-top"><span class="profile-number">${String(profileGrid.children.length + 1).padStart(2, '0')}</span><button class="more-button" type="button" aria-label="More options for ${name}">•••</button></div><div class="portrait" aria-label="Initials for ${name}"><span>${initials}</span></div><div class="profile-info"><div class="tag">NEW CONNECTION</div><h3>${name}</h3><p>${where}</p><div class="profile-meta"><span>Pronouns not set</span><span>·</span><span>Added just now</span></div></div><div class="memory-quote">“${event}.”</div>`;
  profileGrid.prepend(card);
  profileCount.textContent = String(profileGrid.children.length).padStart(2, '0');
  transcript.value = '';
  showToast(`${name} was added to your orbit.`);
});

document.querySelectorAll('.filter').forEach((filter) => {
  filter.addEventListener('click', () => {
    document.querySelectorAll('.filter').forEach((item) => item.classList.remove('active'));
    filter.classList.add('active');
    const cards = Array.from(profileGrid.children);
    if (filter.textContent === 'A–Z') cards.sort((a, b) => a.dataset.name?.localeCompare(b.dataset.name) || a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent)).forEach((card) => profileGrid.appendChild(card));
  });
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    transcript.focus();
  }
});
