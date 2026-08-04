document.getElementById("year").textContent = new Date().getFullYear();

// Keep anchor-jump scroll offset in sync with the sticky header's real
// height, since the nav wraps to extra lines on narrow viewports.
function syncHeaderScrollOffset() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const offset = header.getBoundingClientRect().height + 16;
  document.documentElement.style.setProperty("--header-offset", `${offset}px`);
}
syncHeaderScrollOffset();
window.addEventListener("resize", syncHeaderScrollOffset);

const outcomeLabels = { win: "W", draw: "D", loss: "L" };
const today = new Date();
today.setHours(0, 0, 0, 0);

// Deterministic per-fixture RNG so results are stable across reloads,
// but still shift automatically if a club's star rating changes.
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 15), 1 | h);
    h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

// The rest of the EFL Championship. Star ratings are a fixed squad-quality
// reputation (not derived from results); everything else about a club's
// record - games played, W/D/L, GD, points, table position - is simulated
// so the table actually moves as time passes, same as the fixtures do.
const LEAGUE_CLUBS = [
  { name: "Leeds United", stars: 4 },
  { name: "Sheffield United", stars: 3 },
  { name: "Burnley", stars: 3.5 },
  { name: "Sunderland", stars: 3.5 },
  { name: "Coventry City", stars: 3 },
  { name: "Middlesbrough", stars: 3 },
  { name: "West Bromwich Albion", stars: 2.5 },
  { name: "Norwich City", stars: 2.5 },
  { name: "Watford", stars: 2.5 },
  { name: "Bristol City", stars: 2.5 },
  { name: "Hull City", stars: 3 },
  { name: "Preston North End", stars: 2.5 },
  { name: "Millwall", stars: 2 },
  { name: "Blackburn Rovers", stars: 2 },
  { name: "Swansea City", stars: 2 },
  { name: "Stoke City", stars: 2.5 },
  { name: "Cardiff City", stars: 1.5 },
  { name: "Queens Park Rangers", stars: 1.5 },
  { name: "Portsmouth", stars: 1.5 },
  { name: "Plymouth Argyle", stars: 1.5 },
  { name: "Oxford United", stars: 1 },
  { name: "Derby County", stars: 1 },
  { name: "Sheffield Wednesday", stars: 1 },
];

function pickOutcome(opponentStars, lionsStars, rng) {
  const diff = opponentStars - lionsStars;
  const winWeight = Math.max(0.05, 1 - 0.35 * diff);
  const lossWeight = Math.max(0.05, 1 + 0.35 * diff);
  const drawWeight = 1;
  const total = winWeight + drawWeight + lossWeight;
  const r = rng() * total;
  if (r < winWeight) return "win";
  if (r < winWeight + drawWeight) return "draw";
  return "loss";
}

function pickScore(outcome, rng) {
  const small = () => Math.floor(rng() * 3); // 0, 1, or 2
  if (outcome === "win") {
    const opp = Math.floor(rng() * 2); // 0 or 1
    const lions = opp + 1 + Math.floor(rng() * 2); // opp + 1 or 2
    return { lions, opp };
  }
  if (outcome === "loss") {
    const lions = Math.floor(rng() * 2);
    const opp = lions + 1 + Math.floor(rng() * 2);
    return { lions, opp };
  }
  const g = small();
  return { lions: g, opp: g };
}

const clubStars = new Map(LEAGUE_CLUBS.map((c) => [c.name, c.stars]));
const LIONS_STARS = 2.5;
const lionsStars = LIONS_STARS;

const fixtureRows = [...document.querySelectorAll(".fixtures-table tbody tr[data-date]")];

fixtureRows.forEach((row) => {
  if (row.dataset.outcome) return; // already-played games keep their recorded result
  const opponent = row.children[1].textContent.trim();
  const opponentStars = clubStars.get(opponent) ?? 2.5;
  const rng = seededRandom(`${row.dataset.date}|${opponent}`);
  const outcome = pickOutcome(opponentStars, lionsStars, rng);
  const { lions, opp } = pickScore(outcome, rng);
  row.dataset.outcome = outcome;
  row.dataset.score = `${lions}–${opp}`;
});

const upcoming = fixtureRows
  .filter((row) => new Date(row.dataset.date) >= today)
  .sort((a, b) => new Date(a.dataset.date) - new Date(b.dataset.date));
const nextRow = upcoming[0];

fixtureRows.forEach((row) => {
  const resultCell = row.querySelector(".fx-result");
  const rowDate = new Date(row.dataset.date);

  if (row === nextRow) {
    row.classList.add("is-next");
    resultCell.innerHTML = '<span class="badge">Next match</span>';
  } else if (rowDate < today) {
    const outcome = row.dataset.outcome;
    resultCell.textContent = `${outcomeLabels[outcome]} ${row.dataset.score}`;
    resultCell.classList.add(`result-${outcome}`);
  } else {
    resultCell.textContent = "—";
  }
});

if (nextRow) {
  const scrollBox = nextRow.closest(".table-scroll--fixtures");
  if (scrollBox) {
    scrollBox.scrollTop = nextRow.offsetTop - scrollBox.clientHeight / 2;
  }
}

// --- Standings ---------------------------------------------------------
// Everyone in the league plays the same number of games as FC Lions do
// (derived from how many of our fixtures have actually happened). Our own
// row comes straight from the real, already-revealed fixture results; the
// other 23 clubs' records are simulated with the same win/draw/loss model
// used for our own results, seeded per club so the sequence is stable and
// just keeps extending as more games get played rather than reshuffling.

function computeLionsRecord() {
  const record = { name: "FC Lions", stars: LIONS_STARS, played: 0, w: 0, d: 0, l: 0, gd: 0 };
  fixtureRows.forEach((row) => {
    if (new Date(row.dataset.date) >= today) return;
    const [gf, ga] = row.dataset.score.split("–").map(Number);
    record.played += 1;
    record.gd += gf - ga;
    if (row.dataset.outcome === "win") record.w += 1;
    else if (row.dataset.outcome === "draw") record.d += 1;
    else record.l += 1;
  });
  record.pts = record.w * 3 + record.d;
  return record;
}

function simulateClubRecord(club, gamesPlayed) {
  const rng = seededRandom(`club-form|${club.name}`);
  const record = { name: club.name, stars: club.stars, played: gamesPlayed, w: 0, d: 0, l: 0, gd: 0 };
  for (let i = 0; i < gamesPlayed; i++) {
    // pickOutcome(opponentStars, teamStars, rng): treat "league average"
    // (the same 2.5 baseline FC Lions is built around) as the opponent.
    const outcome = pickOutcome(LIONS_STARS, club.stars, rng);
    const { lions: gf, opp: ga } = pickScore(outcome, rng);
    record.gd += gf - ga;
    if (outcome === "win") record.w += 1;
    else if (outcome === "draw") record.d += 1;
    else record.l += 1;
  }
  record.pts = record.w * 3 + record.d;
  return record;
}

function renderStandings() {
  const body = document.getElementById("standings-body");
  if (!body) return;

  const gamesPlayed = fixtureRows.filter((row) => new Date(row.dataset.date) < today).length;
  const lions = computeLionsRecord();
  const table = [lions, ...LEAGUE_CLUBS.map((club) => simulateClubRecord(club, gamesPlayed))];
  table.sort((a, b) => b.pts - a.pts || b.gd - a.gd);

  body.innerHTML = "";
  table.forEach((club, i) => {
    const pos = i + 1;
    const tr = document.createElement("tr");
    if (club.name === "FC Lions") tr.className = "is-you";
    else if (pos <= 3) tr.className = "is-promotion";
    else if (pos > table.length - 3) tr.className = "is-relegation";

    const gdText = club.gd > 0 ? `+${club.gd}` : club.gd < 0 ? `−${Math.abs(club.gd)}` : "0";
    const pct = (club.stars / 5) * 100;
    tr.innerHTML =
      `<td>${pos}</td><td>${club.name}</td><td>${club.played}</td><td>${club.w}</td>` +
      `<td>${club.d}</td><td>${club.l}</td><td>${gdText}</td><td>${club.pts}</td>` +
      `<td><span class="stars" style="--pct: ${pct}%;" aria-label="${club.stars} out of 5 stars">` +
      `<span class="stars-track">&#9733;&#9733;&#9733;&#9733;&#9733;</span>` +
      `<span class="stars-fill">&#9733;&#9733;&#9733;&#9733;&#9733;</span></span></td>`;
    body.appendChild(tr);
  });
}

renderStandings();

// Ages: random 19-35, weighted so ~75% of players land in the 24-29 prime range.
function pickAge(rng) {
  const core = [24, 25, 26, 27, 28, 29];
  const edges = [19, 20, 21, 22, 23, 30, 31, 32, 33, 34, 35];
  if (rng() < 0.75) {
    return core[Math.floor(rng() * core.length)];
  }
  return edges[Math.floor(rng() * edges.length)];
}

function playerAge(name) {
  return pickAge(seededRandom(`age|${name}`));
}

// Transfer fee: rises with rating, and rises the younger the player is
// (more years of resale value left), floored/capped to a sane range.
function computePrice(rating, age) {
  const raw = (rating - 55) * 0.3 * ((36 - age) / 15);
  return Math.round(Math.max(0.5, Math.min(9, raw)) * 10) / 10;
}

// Career progression: rating rises while a player is developing (18-24),
// holds flat in their prime (25-28 gets a smaller bump, 29-30 plateaus),
// then declines from 31 onward. Players retire once they turn 36.
const RETIREMENT_AGE = 36;

function ratingDeltaForAge(age) {
  if (age >= 18 && age <= 24) return 2;
  if (age >= 25 && age <= 28) return 1;
  if (age >= 31 && age <= 33) return -1;
  if (age >= 34 && age <= 35) return -2;
  return 0;
}

// Each player ages up once a year, but on their own random day rather than
// everyone turning older on the same date. Day is capped at 28 so every
// month is a valid target without worrying about month length/leap years.
function playerBirthday(name) {
  const rng = seededRandom(`birthday|${name}`);
  return { month: 1 + Math.floor(rng() * 12), day: 1 + Math.floor(rng() * 28) };
}

// How many times a given month/day anniversary falls strictly after
// `from` and on/before `to`.
function countAnniversaries(from, to, month, day) {
  let count = 0;
  let year = from.getFullYear();
  let anniversary = new Date(year, month - 1, day);
  if (anniversary <= from) {
    year += 1;
    anniversary = new Date(year, month - 1, day);
  }
  while (anniversary <= to) {
    count += 1;
    year += 1;
    anniversary = new Date(year, month - 1, day);
  }
  return count;
}

// --- Squad / bench / shortlist -------------------------------------------

const ROSTER_KEY = "fcLionsRoster";
const SIGNED_KEY = "fcLionsSignedProspects";

const defaultRoster = [
  { id: "marisol-ferreira", name: "Marisol Ferreira", number: 1, rating: 70, position: "GK", positionLabel: "Goalkeeper", group: "starter" },
  { id: "dax-okoye", name: "Dax Okoye", number: 2, rating: 68, position: "DEF", positionLabel: "Right Back", group: "starter" },
  { id: "teodor-blake", name: "Teodor Blake", number: 4, rating: 71, position: "DEF", positionLabel: "Centre Back", group: "starter" },
  { id: "ines-kowalczyk", name: "Ines Kowalczyk", number: 5, rating: 72, position: "DEF", positionLabel: "Centre Back", group: "starter" },
  { id: "rowan-achebe", name: "Rowan Achebe", number: 3, rating: 67, position: "DEF", positionLabel: "Left Back", group: "starter" },
  { id: "naomi-vasquez", name: "Naomi Vasquez", number: 6, rating: 69, position: "MID", positionLabel: "Defensive Mid", group: "starter" },
  { id: "idris-halloran", name: "Idris Halloran", number: 8, rating: 70, position: "MID", positionLabel: "Central Mid", group: "starter" },
  { id: "priya-sundaram", name: "Priya Sundaram", number: 10, rating: 75, position: "MID", positionLabel: "Attacking Mid", group: "starter" },
  { id: "levi-marchetti", name: "Levi Marchetti", number: 7, rating: 71, position: "FWD", positionLabel: "Right Wing", group: "starter" },
  { id: "astrid-nilsen", name: "Astrid Nilsen", number: 11, rating: 70, position: "FWD", positionLabel: "Left Wing", group: "starter" },
  { id: "cormac-diallo", name: "Cormac Diallo", number: 9, rating: 76, position: "FWD", positionLabel: "Striker", group: "starter" },
  { id: "soren-vance", name: "Soren Vance", number: 12, rating: 62, position: "GK", positionLabel: "Goalkeeper", group: "bench" },
  { id: "malia-fitzgerald", name: "Malia Fitzgerald", number: 13, rating: 64, position: "DEF", positionLabel: "Centre Back", group: "bench" },
  { id: "emeka-solheim", name: "Emeka Solheim", number: 14, rating: 63, position: "DEF", positionLabel: "Right Back", group: "bench" },
  { id: "freya-ibanez", name: "Freya Ibanez", number: 15, rating: 65, position: "MID", positionLabel: "Central Mid", group: "bench" },
  { id: "tobias-renner", name: "Tobias Renner", number: 16, rating: 64, position: "MID", positionLabel: "Attacking Mid", group: "bench" },
  { id: "zara-kowalski", name: "Zara Kowalski", number: 17, rating: 66, position: "FWD", positionLabel: "Left Winger", group: "bench" },
  { id: "milo-adeyemi", name: "Milo Adeyemi", number: 18, rating: 63, position: "FWD", positionLabel: "Striker", group: "bench" },
];

// Two prospects for each of the 11 specific positions used across the
// squad/bench (price isn't stored here - it's computed from rating + age
// so it stays consistent with whatever age gets generated for display).
const SHORTLIST_POSITIONS = [
  { position: "GK", positionLabel: "Goalkeeper" },
  { position: "DEF", positionLabel: "Right Back" },
  { position: "DEF", positionLabel: "Centre Back" },
  { position: "DEF", positionLabel: "Left Back" },
  { position: "MID", positionLabel: "Defensive Mid" },
  { position: "MID", positionLabel: "Central Mid" },
  { position: "MID", positionLabel: "Attacking Mid" },
  { position: "FWD", positionLabel: "Right Wing" },
  { position: "FWD", positionLabel: "Left Wing" },
  { position: "FWD", positionLabel: "Second Striker" },
  { position: "FWD", positionLabel: "Striker" },
];

const PROSPECT_FIRST_NAMES = [
  "Jonah", "Petra", "Aleksander", "Kofi", "Ryder", "Mina", "Théo", "Sana", "Ines", "Farid",
  "Otto", "Wren", "Grace", "Ilya", "Noor", "Talia", "Bassem", "Yara", "Declan", "Camille",
  "Marcus", "Selin", "Zeynep", "Rafael", "Amara", "Lukas", "Priyanka", "Dario", "Freja",
  "Kwame", "Elin", "Matteo",
];

const PROSPECT_LAST_NAMES = [
  "Ekwueme", "Novak", "Dahl", "Adjei", "Voss", "Okafor", "Marchand", "Bello", "Baptiste",
  "Nasser", "Lindgren", "Delacroix", "Odutayo", "Petrenko", "Farouk", "Munroe", "Khoury",
  "Sundqvist", "Fairweather", "Osei", "Vidal", "Aydin", "Larsson", "Mensah", "Costa",
  "Iversen", "Haddad", "Brenner", "Solano", "Whitfield", "Kowalski", "Duarte",
];

let shortlistGenerationCounter = 0;

function generateShortlist() {
  const usedNames = new Set(roster.map((p) => p.name));
  const prospects = [];

  SHORTLIST_POSITIONS.forEach(({ position, positionLabel }) => {
    for (let i = 0; i < 2; i++) {
      let name;
      do {
        const first = PROSPECT_FIRST_NAMES[Math.floor(Math.random() * PROSPECT_FIRST_NAMES.length)];
        const last = PROSPECT_LAST_NAMES[Math.floor(Math.random() * PROSPECT_LAST_NAMES.length)];
        name = `${first} ${last}`;
      } while (usedNames.has(name));
      usedNames.add(name);
      shortlistGenerationCounter += 1;

      prospects.push({
        id: `prospect-${shortlistGenerationCounter}-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        name,
        rating: 65 + Math.floor(Math.random() * 11), // 65-75
        position,
        positionLabel,
      });
    }
  });

  return prospects;
}

function loadRoster() {
  try {
    const saved = JSON.parse(localStorage.getItem(ROSTER_KEY));
    if (Array.isArray(saved) && saved.length) {
      // Backfill age for roster state saved before career progression existed.
      saved.forEach((p) => {
        if (!Number.isFinite(p.age)) p.age = playerAge(p.name);
      });
      return saved;
    }
  } catch {
    // ignore malformed storage
  }
  return defaultRoster.map((p) => ({ ...p, age: playerAge(p.name) }));
}

function loadSignedIds() {
  try {
    const saved = JSON.parse(localStorage.getItem(SIGNED_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {
    // ignore malformed storage
  }
  return [];
}

const roster = loadRoster();
const signedIds = loadSignedIds();

function saveRoster() {
  localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
}

function saveSignedIds() {
  localStorage.setItem(SIGNED_KEY, JSON.stringify(signedIds));
}

const SHORTLIST_KEY = "fcLionsShortlist";

function loadShortlist() {
  try {
    const saved = JSON.parse(localStorage.getItem(SHORTLIST_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    // ignore malformed storage
  }
  return generateShortlist();
}

function saveShortlist() {
  localStorage.setItem(SHORTLIST_KEY, JSON.stringify(shortlistProspects));
}

let shortlistProspects = loadShortlist();

// Each player has their own random birthday (see playerBirthday) and ages
// up once a year on that day rather than everyone turning older together.
// Catches up on however many of a player's individual birthdays have
// passed since the site was last opened, applying each one in order so
// the correct rating bracket applies at every step of their career.
const AGE_CHECKED_KEY = "fcLionsAgeCheckedAt";

function applyAging() {
  const now = new Date();
  const storedISO = localStorage.getItem(AGE_CHECKED_KEY);
  const lastChecked = storedISO ? new Date(storedISO) : now;
  let changed = false;

  for (let idx = roster.length - 1; idx >= 0; idx--) {
    const player = roster[idx];
    const { month, day } = playerBirthday(player.name);
    const birthdaysPassed = countAnniversaries(lastChecked, now, month, day);

    for (let i = 0; i < birthdaysPassed; i++) {
      player.rating = Math.max(40, Math.min(99, player.rating + ratingDeltaForAge(player.age)));
      player.age += 1;
      changed = true;
      if (player.age >= RETIREMENT_AGE) {
        roster.splice(idx, 1);
        break;
      }
    }
  }

  if (changed) saveRoster();
  localStorage.setItem(AGE_CHECKED_KEY, now.toISOString());
}

applyAging();

// Selling: a listed player waits 24 real hours before an offer comes in.
// Checked on every load (like aging) so it catches up whenever you return,
// rather than needing the page to stay open.
const SELL_WAIT_MS = 24 * 60 * 60 * 1000;

function generateOfferAmount(player) {
  const rng = seededRandom(`offer|${player.id}|${player.listedAt}`);
  const base = computePrice(player.rating, player.age);
  const multiplier = 0.7 + rng() * 0.6; // buyers rarely pay exactly market value
  return Math.round(Math.max(0.3, base * multiplier) * 10) / 10;
}

function checkOffers() {
  const now = Date.now();
  let changed = false;
  roster.forEach((player) => {
    if (player.listedAt && !player.offerAmount) {
      const elapsed = now - new Date(player.listedAt).getTime();
      if (elapsed >= SELL_WAIT_MS) {
        player.offerAmount = generateOfferAmount(player);
        changed = true;
      }
    }
  });
  if (changed) saveRoster();
}

checkOffers();

let activeFilter = "all";

// Formation order for display, so a promoted/swapped-in player lands in
// their actual slot instead of wherever they happened to sit in the array.
const POSITION_ORDER = [
  "Goalkeeper",
  "Right Back", "Centre Back", "Left Back",
  "Defensive Mid", "Central Mid", "Attacking Mid",
  "Right Wing", "Right Winger", "Left Wing", "Left Winger", "Winger",
  "Second Striker", "Striker",
];

function positionSortIndex(positionLabel) {
  const idx = POSITION_ORDER.indexOf(positionLabel);
  return idx === -1 ? POSITION_ORDER.length : idx;
}

function renderPlayerCard(player, { draggable = false, onActivate = null } = {}) {
  const li = document.createElement("li");
  li.className = "player-card";
  li.dataset.position = player.position;
  li.dataset.id = player.id;
  li.hidden = activeFilter !== "all" && player.position !== activeFilter;

  if (draggable) {
    li.draggable = true;
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", player.id);
      e.dataTransfer.effectAllowed = "move";
      li.classList.add("is-dragging");
    });
    li.addEventListener("dragend", () => li.classList.remove("is-dragging"));
  }

  const top = document.createElement("div");
  top.className = "player-top";
  const ratingEl = document.createElement("span");
  ratingEl.className = "player-rating";
  ratingEl.textContent = player.rating;
  const numberEl = document.createElement("span");
  numberEl.className = "player-number";
  numberEl.textContent = player.number ? `#${player.number}` : "";
  top.append(ratingEl, numberEl);

  const nameEl = document.createElement("span");
  nameEl.className = "player-name";
  nameEl.textContent = player.name;

  const age = Number.isFinite(player.age) ? player.age : playerAge(player.name);
  const posEl = document.createElement("span");
  posEl.className = "player-position";
  posEl.textContent = `${player.positionLabel} · Age ${age}`;

  const priceEl = document.createElement("span");
  priceEl.className = "player-price";
  priceEl.textContent = `£${computePrice(player.rating, age)}m`;
  li.append(top, nameEl, posEl, priceEl);

  if (player.offerAmount) {
    const statusEl = document.createElement("span");
    statusEl.className = "badge player-status-badge";
    statusEl.textContent = `Offer: £${player.offerAmount}m`;
    li.append(statusEl);
  } else if (player.listedAt) {
    const statusEl = document.createElement("span");
    statusEl.className = "badge player-status-badge badge-muted";
    statusEl.textContent = "Listed for sale";
    li.append(statusEl);
  }

  if (onActivate) {
    li.tabIndex = 0;
    li.setAttribute("role", "button");
    li.addEventListener("click", () => onActivate(player));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onActivate(player);
      }
    });
  }

  return li;
}

const starterList = document.getElementById("starters-roster");
const benchList = document.getElementById("bench-roster");
const shortlistList = document.getElementById("shortlist-roster");

function renderRoster() {
  if (!starterList || !benchList) return;
  starterList.innerHTML = "";
  benchList.innerHTML = "";
  const byPosition = (a, b) => positionSortIndex(a.positionLabel) - positionSortIndex(b.positionLabel);
  roster
    .filter((p) => p.group === "starter")
    .sort(byPosition)
    .forEach((p) => starterList.appendChild(renderPlayerCard(p, { draggable: true, onActivate: openSellFlow })));
  roster
    .filter((p) => p.group === "bench")
    .sort(byPosition)
    .forEach((p) => benchList.appendChild(renderPlayerCard(p, { draggable: true, onActivate: openSellFlow })));
}

function renderShortlist() {
  if (!shortlistList) return;
  shortlistList.innerHTML = "";
  shortlistProspects
    .filter((p) => !signedIds.includes(p.id))
    .forEach((p) => shortlistList.appendChild(renderPlayerCard(p, { onActivate: openBuyModal })));
}

[starterList, benchList].forEach((list) => {
  if (!list) return;
  list.addEventListener("dragover", (e) => {
    e.preventDefault();
    list.classList.add("is-drop-target");
  });
  list.addEventListener("dragleave", () => list.classList.remove("is-drop-target"));
  list.addEventListener("drop", (e) => {
    e.preventDefault();
    list.classList.remove("is-drop-target");
    const id = e.dataTransfer.getData("text/plain");
    const draggedPlayer = roster.find((p) => p.id === id);
    if (!draggedPlayer) return;

    const destinationGroup = list.dataset.group;
    const sourceGroup = draggedPlayer.group;
    if (sourceGroup === destinationGroup) return;

    // Swap with a same-role player already in the destination list:
    // promoting a bench player benches the destination's weakest starter
    // in that exact role (Right Back <-> Right Back, not any defender),
    // and vice versa - benching a starter promotes the destination's
    // strongest bench player in that role. Falls back to the broader
    // position group only if no exact-role match exists there.
    const exactRoleMatch = roster.filter(
      (p) => p.id !== draggedPlayer.id && p.group === destinationGroup && p.positionLabel === draggedPlayer.positionLabel
    );
    const broadPositionMatch = roster.filter(
      (p) => p.id !== draggedPlayer.id && p.group === destinationGroup && p.position === draggedPlayer.position
    );
    const samePosition = exactRoleMatch.length ? exactRoleMatch : broadPositionMatch;
    let swapPartner = null;
    if (samePosition.length) {
      swapPartner = samePosition.reduce((best, p) => {
        if (destinationGroup === "starter") {
          return p.rating < best.rating ? p : best; // weakest starter gets benched
        }
        return p.rating > best.rating ? p : best; // strongest bench player gets promoted
      });
    }

    draggedPlayer.group = destinationGroup;
    if (swapPartner) swapPartner.group = sourceGroup;

    saveRoster();
    renderRoster();
  });
});

// --- Transfer budget --------------------------------------------------

const BUDGET_KEY = "fcLionsBudget";
const INITIAL_BUDGET = 9;

function loadBudget() {
  const saved = parseFloat(localStorage.getItem(BUDGET_KEY));
  return Number.isFinite(saved) ? saved : INITIAL_BUDGET;
}

function saveBudget() {
  localStorage.setItem(BUDGET_KEY, String(budget));
}

let budget = loadBudget();

function renderBudget() {
  const el = document.getElementById("transfer-budget-value");
  if (el) el.textContent = `£${Math.round(budget * 10) / 10}m`;
}
renderBudget();

// --- Buy confirmation modal ------------------------------------------------

const buyModal = document.getElementById("buy-modal");
const buyModalName = document.getElementById("buy-modal-name");
const buyModalPrice = document.getElementById("buy-modal-price");
const buyModalYes = document.getElementById("buy-modal-yes");
const buyModalNo = document.getElementById("buy-modal-no");
let pendingProspect = null;
let pendingPrice = 0;
let pendingAge = 0;

function openBuyModal(prospect) {
  if (!buyModal) return;
  pendingProspect = prospect;
  pendingAge = playerAge(prospect.name);
  pendingPrice = computePrice(prospect.rating, pendingAge);
  buyModalName.textContent = prospect.name;
  buyModalPrice.textContent = `£${pendingPrice}m`;

  const canAfford = pendingPrice <= budget;
  buyModalYes.disabled = !canAfford;
  buyModalYes.textContent = canAfford ? "Yes" : "Not enough budget";
  buyModal.hidden = false;
  buyModalYes.focus();
}

function closeBuyModal() {
  if (!buyModal) return;
  buyModal.hidden = true;
  pendingProspect = null;
}

if (buyModal) {
  buyModalNo.addEventListener("click", closeBuyModal);
  buyModal.addEventListener("click", (e) => {
    if (e.target === buyModal) closeBuyModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !buyModal.hidden) closeBuyModal();
  });
  buyModalYes.addEventListener("click", () => {
    if (!pendingProspect || pendingPrice > budget) return;
    const nextNumber = roster.reduce((max, p) => Math.max(max, p.number || 0), 0) + 1;
    roster.push({ ...pendingProspect, number: nextNumber, group: "bench", age: pendingAge });
    signedIds.push(pendingProspect.id);
    budget = Math.round((budget - pendingPrice) * 10) / 10;
    saveRoster();
    saveSignedIds();
    saveBudget();
    renderRoster();
    renderShortlist();
    renderBudget();
    closeBuyModal();
  });
}

// --- Sell confirmation modal ------------------------------------------------

const sellModal = document.getElementById("sell-modal");
const sellModalName = document.getElementById("sell-modal-name");
const sellModalYes = document.getElementById("sell-modal-yes");
const sellModalNo = document.getElementById("sell-modal-no");
let pendingSellPlayer = null;

function closeSellModal() {
  if (!sellModal) return;
  sellModal.hidden = true;
  pendingSellPlayer = null;
}

if (sellModal) {
  sellModalNo.addEventListener("click", closeSellModal);
  sellModal.addEventListener("click", (e) => {
    if (e.target === sellModal) closeSellModal();
  });
  sellModalYes.addEventListener("click", () => {
    if (!pendingSellPlayer) return;
    pendingSellPlayer.listedAt = new Date().toISOString();
    saveRoster();
    closeSellModal();
    renderRoster();
    renderOffersButton();
    openSearchingModal();
  });
}

// --- "Searching for buyers" info modal -------------------------------------

const searchingModal = document.getElementById("searching-modal");
const searchingModalOk = document.getElementById("searching-modal-ok");

function openSearchingModal() {
  if (!searchingModal) return;
  searchingModal.hidden = false;
  searchingModalOk.focus();
}

function closeSearchingModal() {
  if (!searchingModal) return;
  searchingModal.hidden = true;
}

if (searchingModal) {
  searchingModalOk.addEventListener("click", closeSearchingModal);
  searchingModal.addEventListener("click", (e) => {
    if (e.target === searchingModal) closeSearchingModal();
  });
}

// --- Incoming offers ---------------------------------------------------

const offersModal = document.getElementById("offers-modal");
const offersModalClose = document.getElementById("offers-modal-close");
const offersButton = document.getElementById("offers-button");
const offersCountEl = document.getElementById("offers-count");
const offersListEl = document.getElementById("offers-list");

function readyOffers() {
  return roster.filter((p) => p.offerAmount);
}

function renderOffersButton() {
  if (!offersCountEl) return;
  const n = readyOffers().length;
  offersCountEl.textContent = String(n);
  offersCountEl.hidden = n === 0;
}
renderOffersButton();

function renderOffersList() {
  if (!offersListEl) return;
  offersListEl.innerHTML = "";
  const offers = readyOffers();

  if (!offers.length) {
    const empty = document.createElement("li");
    empty.className = "offer-empty";
    empty.textContent = "No offers yet. List a player for sale and check back in 24 hours.";
    offersListEl.appendChild(empty);
    return;
  }

  offers.forEach((player) => {
    const row = document.createElement("li");
    row.className = "offer-row";

    const info = document.createElement("div");
    info.className = "offer-row-info";
    const nameEl = document.createElement("span");
    nameEl.className = "offer-row-name";
    nameEl.textContent = player.name;
    const amountEl = document.createElement("span");
    amountEl.className = "offer-row-amount";
    amountEl.textContent = `£${player.offerAmount}m offer`;
    info.append(nameEl, amountEl);

    const actions = document.createElement("div");
    actions.className = "offer-row-actions";
    const acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.className = "btn btn-primary";
    acceptBtn.textContent = "Accept";
    acceptBtn.addEventListener("click", () => acceptOffer(player.id));
    const rejectBtn = document.createElement("button");
    rejectBtn.type = "button";
    rejectBtn.className = "btn btn-ghost-light";
    rejectBtn.textContent = "Reject";
    rejectBtn.addEventListener("click", () => rejectOffer(player.id));
    actions.append(acceptBtn, rejectBtn);

    row.append(info, actions);
    offersListEl.appendChild(row);
  });
}

function acceptOffer(playerId) {
  const idx = roster.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  budget = Math.round((budget + roster[idx].offerAmount) * 10) / 10;
  roster.splice(idx, 1);
  saveRoster();
  saveBudget();
  renderRoster();
  renderBudget();
  renderOffersButton();
  renderOffersList();
}

function rejectOffer(playerId) {
  const player = roster.find((p) => p.id === playerId);
  if (!player) return;
  delete player.listedAt;
  delete player.offerAmount;
  saveRoster();
  renderRoster();
  renderOffersButton();
  renderOffersList();
}

function openOffersModal() {
  if (!offersModal) return;
  renderOffersList();
  offersModal.hidden = false;
}

function closeOffersModal() {
  if (!offersModal) return;
  offersModal.hidden = true;
}

if (offersButton) offersButton.addEventListener("click", openOffersModal);
if (offersModal) {
  offersModalClose.addEventListener("click", closeOffersModal);
  offersModal.addEventListener("click", (e) => {
    if (e.target === offersModal) closeOffersModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (sellModal && !sellModal.hidden) closeSellModal();
  if (searchingModal && !searchingModal.hidden) closeSearchingModal();
  if (offersModal && !offersModal.hidden) closeOffersModal();
});

// Clicking an owned player: if they already have a ready offer, jump
// straight to the offers list; if still waiting on one, remind the user;
// otherwise open the sell confirmation.
function openSellFlow(player) {
  if (player.offerAmount) {
    openOffersModal();
    return;
  }
  if (player.listedAt) {
    openSearchingModal();
    return;
  }
  if (!sellModal) return;
  pendingSellPlayer = player;
  sellModalName.textContent = player.name;
  sellModal.hidden = false;
  sellModalYes.focus();
}

renderRoster();
renderShortlist();

const refreshShortlistButton = document.getElementById("refresh-shortlist");
if (refreshShortlistButton) {
  refreshShortlistButton.addEventListener("click", () => {
    shortlistProspects = generateShortlist();
    saveShortlist();
    renderShortlist();
    refreshShortlistButton.classList.remove("is-spinning");
    void refreshShortlistButton.offsetWidth; // restart the animation on repeat clicks
    refreshShortlistButton.classList.add("is-spinning");
  });
}

// --- Position filter (applies to starters + bench, not the shortlist) -----

const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("is-active"));
    button.classList.add("is-active");
    activeFilter = button.dataset.filter;

    document
      .querySelectorAll("#starters-roster .player-card, #bench-roster .player-card")
      .forEach((card) => {
        card.hidden = activeFilter !== "all" && card.dataset.position !== activeFilter;
      });
  });
});
