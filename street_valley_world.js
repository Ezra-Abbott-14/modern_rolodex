import { STREET_VALLEY_CHARACTERS } from './street_valley_characters.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashText(value) {
  return [...String(value || '')].reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0) >>> 0;
}
function pickCharacter(contact, index) {
  const requestedGender = String(contact?.gender || '').toLowerCase();
  const matching = requestedGender === 'male' || requestedGender === 'female'
    ? STREET_VALLEY_CHARACTERS.filter(character => character.gender === requestedGender)
    : STREET_VALLEY_CHARACTERS;
  return matching[hashText(`${contact?.name || 'villager'}-${contact?.id || index}`) % matching.length];
}

function randomCharacter(index) {
  return STREET_VALLEY_CHARACTERS[(index * 17 + 11) % STREET_VALLEY_CHARACTERS.length];
}

function drawPixelVillager(context, actor, time) {
  const character = actor.character;
  const scale = actor.scale;
  const walking = actor.walkFrame === 1 ? -1 : 0;
  const x = Math.round(actor.x);
  const y = Math.round(actor.y + walking);
  const block = (offsetX, offsetY, width, height, color) => {
    context.fillStyle = color;
    context.fillRect(x + Math.round(offsetX * scale), y + Math.round(offsetY * scale), Math.round(width * scale), Math.round(height * scale));
  };

  context.save();
  context.globalAlpha = actor.opacity;
  context.fillStyle = '#40364d55';
  context.fillRect(x - 7 * scale, y + 23 * scale, 15 * scale, 3 * scale);

  const step = actor.walkFrame === 1 ? 1 : -1;
  block(-4 + step, 18, 3, 5, character.pants);
  block(1 - step, 18, 3, 5, character.pants);
  block(-5 + step, 23, 4, 2, '#493448');
  block(1 - step, 23, 4, 2, '#493448');

  block(-5, 9, 10, 10, character.shirt);
  block(-7, 11, 2, 7, character.shirt);
  block(5, 11, 2, 7, character.shirt);
  block(-2, 10, 4, 8, character.shirt === '#b55b58' ? '#f2c45a' : character.shirt);

  block(-4, 2, 8, 8, character.skin);
  block(-3, 0, 6, 3, character.hair);
  block(-5, 2, 2, 7, character.hair);
  block(3, 2, 2, character.hair);

  if (character.gender === 'female') {
    block(-5, 6, 2, 7, character.hair);
    block(3, 6, 2, 7, character.hair);
  } else {
    block(-3, -1, 6, 2, character.hair);
  }

  block(-2, 5, 1, 1, '#342a38');
  block(2, 5, 1, 1, '#342a38');
  block(-1, 8, 2, 1, '#9c5d58');

  if ((hashText(character.id) + Math.round(time / 500)) % 4 === 0) {
    block(6, 14, 2, 2, '#f2c45a');
  }
  context.restore();
}

function drawTree(context, x, y, scale = 1) {
  context.fillStyle = '#7c4d39';
  context.fillRect(x - 4 * scale, y + 19 * scale, 8 * scale, 15 * scale);
  context.fillStyle = '#3f7254';
  context.fillRect(x - 17 * scale, y - 4 * scale, 34 * scale, 25 * scale);
  context.fillStyle = '#5e9362';
  context.fillRect(x - 11 * scale, y - 11 * scale, 22 * scale, 19 * scale);
  context.fillStyle = '#84b96c';
  context.fillRect(x - 5 * scale, y - 15 * scale, 10 * scale, 12 * scale);
}

function drawHouse(context, x, y, color) {
  context.fillStyle = '#e1ae68';
  context.fillRect(x, y + 24, 112, 74);
  context.fillStyle = color;
  context.fillRect(x - 8, y + 7, 128, 30);
  context.fillStyle = '#f3d18a';
  context.fillRect(x + 42, y + 55, 28, 43);
  context.fillStyle = '#79b8c2';
  context.fillRect(x + 14, y + 52, 25, 22);
  context.fillStyle = '#fff0bd';
  context.fillRect(x + 17, y + 55, 19, 16);
  context.fillStyle = '#59475d';
  context.fillRect(x + 48, y + 72, 16, 26);
}

function drawWorld(context, width, height, actors, time) {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);

  context.fillStyle = '#8fbd73';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#9bc87b';
  for (let row = 0; row < height; row += 18) {
    for (let column = 0; column < width; column += 18) {
      if ((row / 18 + column / 18) % 2 === 0) context.fillRect(column, row, 9, 9);
    }
  }

  context.fillStyle = '#6fa9b0';
  context.fillRect(0, 0, width, 72);
  context.fillStyle = '#8bd0ca';
  for (let column = 0; column < width; column += 42) {
    context.fillRect(column + ((Math.floor(time / 500) * 3) % 20), 25, 20, 3);
  }

  drawHouse(context, 82, 54, '#b55b58');
  drawHouse(context, width - 200, 62, '#6e5a9b');
  drawTree(context, 42, 54, 1.1);
  drawTree(context, width - 48, 56, 1.15);
  drawTree(context, width - 286, 73, 0.8);

  context.fillStyle = '#d6a768';
  context.fillRect(0, 250, width, 88);
  context.fillStyle = '#e7c27d';
  context.fillRect(0, 265, width, 5);
  context.fillRect(0, 320, width, 5);
  context.fillStyle = '#f2d99a';
  context.fillRect(0, 285, width, 4);

  context.fillStyle = '#6f9c60';
  context.fillRect(0, 344, width, 76);
  context.fillStyle = '#86b66a';
  for (let column = 12; column < width; column += 31) {
    context.fillRect(column, 363 + (column % 13), 3, 12);
    context.fillRect(column + 7, 350 + (column % 17), 3, 9);
  }

  [...actors].sort((first, second) => first.y - second.y).forEach(actor => {
    drawPixelVillager(context, actor, time);
    if (actor.contactName && actor.showName) {
      context.font = '10px "DM Mono", monospace';
      context.textAlign = 'center';
      context.fillStyle = '#fff8e9';
      context.fillRect(actor.x - context.measureText(actor.contactName).width / 2 - 4, actor.y - 24, context.measureText(actor.contactName).width + 8, 15);
      context.fillStyle = '#59475d';
      context.fillText(actor.contactName, actor.x, actor.y - 13);
    }
  });
}

function createActor(character, index, contact = null) {
  const width = 900;
  const column = index % 8;
  const row = Math.floor(index / 8);
  const homeX = 80 + column * 105;
  const homeY = 286 + (row % 2) * 55 + (index % 3) * 7;
  return {
    id: contact ? `contact-${contact.id}` : `ambient-${character.id}`,
    character,
    contactName: contact?.name || '',
    showName: Boolean(contact),
    x: homeX,
    y: homeY,
    homeX,
    homeY,
    targetX: clamp(homeX + (index % 2 ? 92 : -92), 45, width - 45),
    targetY: clamp(homeY + (index % 3 - 1) * 42, 270, 380),
    speed: character.walkSpeed * 1.7,
    scale: 2,
    walkFrame: index % 2,
    direction: index % 2 === 0 ? 1 : -1,
    nextTurn: 0,
    idleUntil: 0,
    resting: false,
    opacity: contact ? 1 : 0.92,
  };
}

export function initStreetValleyWorld({ canvas, getContacts }) {
  if (!canvas) return;
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const toggle = document.querySelector('#streetValleyToggle');
  const countLabel = document.querySelector('#streetValleyCount');
  let actors = [];
  let paused = false;
  let lastSync = 0;
  let lastFrame = 0;

  function syncActors() {
    const contacts = typeof getContacts === 'function' ? getContacts() : [];
    const contactActors = contacts.map((contact, index) => {
      const existing = actors.find(actor => actor.id === `contact-${contact.id}`);
      return existing || createActor(pickCharacter(contact, index), index, contact);
    });
    const ambientCount = Math.max(8, 14 - contactActors.length);
    const ambientActors = Array.from({ length: ambientCount }, (_, index) => {
      const existing = actors.find(actor => actor.id === `ambient-${randomCharacter(index).id}`);
      return existing || createActor(randomCharacter(index), index + contactActors.length, null);
    });
    actors = [...contactActors, ...ambientActors];
    if (countLabel) countLabel.textContent = `${STREET_VALLEY_CHARACTERS.length} villagers · ${contacts.length} Rolodex connections`;
  }

  function chooseNextTarget(actor, now) {
    if (actor.x <= 60) actor.direction = 1;
    else if (actor.x >= width - 60) actor.direction = -1;
    else actor.direction = Math.random() < 0.5 ? -1 : 1;

    const travelDistance = 120 + Math.random() * 240;
    actor.targetX = clamp(actor.x + actor.direction * travelDistance, 45, width - 45);
    actor.targetY = clamp(actor.homeY + (Math.random() - 0.5) * 34, 270, 380);
    actor.nextTurn = now + 2800 + Math.random() * 3200;
  }

  function updateActors(delta, now) {
    actors.forEach(actor => {
      if (actor.resting) {
        if (actor.idleUntil > now) {
          actor.walkFrame = 0;
          return;
        }
        actor.resting = false;
        chooseNextTarget(actor, now);
      }
      const distanceX = actor.targetX - actor.x;
      const distanceY = actor.targetY - actor.y;
      const distance = Math.hypot(distanceX, distanceY);
      if (distance < 4) {
        actor.resting = true;
        actor.idleUntil = now + 450 + Math.random() * 1400;
        actor.walkFrame = 0;
        return;
      }
      if (now > actor.nextTurn) chooseNextTarget(actor, now);
      const directionX = (actor.targetX - actor.x) / Math.max(distance, 1);
      const directionY = (actor.targetY - actor.y) / Math.max(distance, 1);
      let separationX = 0;
      let separationY = 0;
      actors.forEach(other => {
        if (other === actor) return;
        const gapX = actor.x - other.x;
        const gapY = actor.y - other.y;
        const gap = Math.hypot(gapX, gapY);
        if (gap > 0 && gap < 34) {
          const push = (34 - gap) / 34;
          separationX += (gapX / gap) * push;
          separationY += (gapY / gap) * push;
        }
      });
      actor.x = clamp(actor.x + (directionX * actor.speed + separationX * 0.9) * delta, 45, width - 45);
      actor.y = clamp(actor.y + (directionY * actor.speed + separationY * 0.9) * delta, 270, 380);
      actor.walkFrame = Math.floor(now / 180) % 2;
    });
  }

  function loop(now) {
    if (!lastFrame) lastFrame = now;
    const delta = Math.min(2.2, (now - lastFrame) / 16.67);
    lastFrame = now;
    if (now - lastSync > 900) {
      syncActors();
      lastSync = now;
    }
    if (!paused) updateActors(delta, now);
    drawWorld(context, width, height, actors, now);
    window.requestAnimationFrame(loop);
  }

  syncActors();
  if (toggle) {
    toggle.addEventListener('click', () => {
      paused = !paused;
      toggle.textContent = paused ? 'Resume villagers' : 'Pause villagers';
      toggle.setAttribute('aria-pressed', String(paused));
    });
  }
  window.requestAnimationFrame(loop);
}
