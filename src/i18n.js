/* eslint max-len: ["warn", { "code": 120, "ignoreStrings": true }] */
const translations = {
  "Wygrana!!!": "Victory!!!",
  "Atakujesz": "You’re attacking",
  "Jesteś atakowany": "You’re under attack",
  "statki": "battleship",
  "Zamknij": "Close",
  "Ustawienia": "Settings",
  "Tempo rywala": "Opponent pace",
  "Spokojne": "Relaxed",
  "Zwykłe": "Normal",
  "Szybkie": "Fast",
  "Zasady gry": "How to play",
  "Wybierz rywala i ustaw flotę. Zaczynasz Ty.": "Choose an opponent and arrange your fleet. You go first.",

  "Statki — bitwa na spokojnych wodach": "Battleship — a battle on calm waters",
  "Klasyczna bitwa morska. Wybierz rywala, przygotuj flotę i odkryj swoją zwycięską taktykę.":
    "Classic Battleship. Choose an opponent, prepare your fleet and find your winning strategy.",
  "Statki — strona główna": "Battleship home",
  "Mała flota. Wielka taktyka.": "Small fleet. Big tactics.",
  "BITWA MORSKA / 01": "BATTLESHIP / 01",
  "WITAJ NA POKŁADZIE": "WELCOME ABOARD",
  "Spokojne morze.<br /><span>Celne decyzje.</span>":
    "Calm seas.<br /><span>Sharp decisions.</span>",
  "Dwie floty, sto pól i jeden cel. Znajdź wszystkie statki rywala, zanim on odnajdzie Twoje.":
    "Two fleets, a hundred squares and one goal. Find all the enemy ships before they find yours.",
  "54° N &nbsp; 18° E<br />SEKTOR OTWARTY":
    "54° N &nbsp; 18° E<br />OPEN SECTOR",
  "Z kim wypływasz?": "Who are you sailing against?",
  "Wybór przeciwnika": "Choose an opponent",
  "Uczciwa bitwa: każdy rywal zna tylko oddane strzały i rozmiary niezatopionych statków.":
    "A fair battle: each opponent knows only past shots and the sizes of ships still afloat.",
  Rozgrywka: "Battle",
  "Losuj flotę": "Shuffle fleet",
  "Rozpocznij bitwę": "Start battle",
  "Plansza przeciwnika": "Enemy board",
  "Flota przeciwnika": "Enemy fleet",
  "Twoja flota": "Your fleet",
  "Twoja plansza": "Your board",
  "Legenda planszy": "Board legend",
  "<i class=\"legend-ship\"></i>Twój statek":
    "<i class=\"legend-ship\"></i>Your ship",
  "<i class=\"legend-miss\">·</i>Pudło": "<i class=\"legend-miss\">·</i>Miss",
  "<i class=\"legend-hit pen-cross\">×</i>Trafienie": "<i class=\"legend-hit pen-cross\">×</i>Hit",
  "<i class=\"legend-sunk pen-cross\">×</i>Zatopiony": "<i class=\"legend-sunk pen-cross\">×</i>Sunk",
  "KRÓTKA ODPRAWA": "A QUICK BRIEFING",
  "Wiesz, co robić, kapitanie.": "You know the drill, captain.",
  "<strong>Przygotuj flotę.</strong> Masz 10 statków i 20 masztów. Losuj ustawienie do woli przed startem.":
    "<strong>Prepare your fleet.</strong> You have 10 ships occupying 20 squares. Shuffle as often as you like before starting.",
  "<strong>Wybierz pole rywala.</strong> Trafienie daje kolejny strzał. Pudło przekazuje turę przeciwnikowi.":
    "<strong>Choose an enemy square.</strong> A hit gives you another shot. A miss passes the turn to your opponent.",
  "<strong>Zatop całą flotę.</strong> Statki są proste i nie stykają się. Wodę wokół zatopionego oznaczymy za Ciebie.":
    "<strong>Sink the entire fleet.</strong> Ships are straight and never touch. Water around a sunk ship is marked automatically.",
  "Dobry plan. Odrobina szczęścia.": "A good plan. A little luck.",
  "STATKI <span aria-hidden=\"true\">✦</span> GRAJ PO SWOJEMU":
    "BATTLESHIP <span aria-hidden=\"true\">✦</span> PLAY YOUR WAY",
  Odkrywca: "Explorer",
  "Na rozgrzewkę": "Warm-up",
  "Strzela losowo. Lubi niespodzianki i daje Ci czas na znalezienie własnej taktyki.":
    "Fires at random. Enjoys surprises and gives you time to find your own tactics.",
  Łowca: "Hunter",
  "Czujny rywal": "Alert opponent",
  "Szuka losowo, ale po trafieniu sprawdza sąsiadów i podąża wzdłuż statku.":
    "Searches at random, then checks neighbours after a hit and follows the ship.",
  Strategini: "Strategist",
  "Krok do przodu": "One step ahead",
  "Szuka w szachownicę i dobija trafione statki. Nie pomija też pojedynczych masztów.":
    "Searches in a checkerboard pattern and finishes damaged ships. Single-square ships are covered too.",
  Nawigatorka: "Navigator",
  "Pełne skupienie": "Fully focused",
  "Liczy możliwe położenia pozostałych statków. Celuje tam, gdzie pasuje najwięcej układów.":
    "Counts possible positions of the remaining ships and targets the most likely squares.",
  "{length} {size}: {state}": "{length}-square ship: {state}",
  maszt: "maszt",
  maszty: "maszty",
  pływa: "afloat",
  zatopiony: "sunk",
  "Zwycięstwo! Morze jest Twoje.": "Victory! The sea is yours.",
  "{name} wygrywa tę bitwę": "{name} wins this battle",
  "Twój ruch.": "Your turn.",
  "Ruch przeciwnika.": "Opponent’s turn.",
  "Zagraj ponownie": "Play again",
  "Nowa gra": "New game",
  "Wybierz styl przeciwnika": "Choose an opponent’s style",
  "Zmiana rywala przy nowej grze": "Change opponents in a new game",
  "Flota {name}": "{name}’s fleet",
  Ty: "You",
  Zatopiony: "Sunk",
  Trafiony: "Hit",
  Pudło: "Miss",
  nieodkryte: "unexplored",
  pudło: "miss",
  "woda przy zatopionym statku": "water around a sunk ship",
  trafiony: "hit",
  statek: "ship",
  Język: "Language",
};
const PAGE_TITLE = "Statki — bitwa na spokojnych wodach";
const PAGE_DESCRIPTION =
  "Klasyczna bitwa morska. Wybierz rywala, przygotuj flotę i odkryj swoją zwycięską taktykę.";
const storageKey = "statki-language";
export function detectLanguage(saved, languages) {
  if (saved === "pl" || saved === "en") return saved;
  for (const language of languages) {
    const code = language.toLowerCase().split(/[-_]/)[0];
    if (code === "pl" || code === "en") return code;
  }
  return "en";
}
function initialLanguage() {
  let saved = null;
  try {
    saved = localStorage.getItem(storageKey);
  } catch {
    /* Storage may be blocked. */
  }
  return detectLanguage(
    saved,
    typeof navigator === "undefined"
      ? []
      : navigator.languages?.length
        ? navigator.languages
        : [navigator.language],
  );
}
export let language = initialLanguage();
const listeners = new Set();
export function subscribe(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
export function setLanguage(value) {
  language = value;
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    /* Switching still works without persistence. */
  }
  updateDocument();
  listeners.forEach((listener) => listener());
}
export function t(source, values = {}) {
  const key = source.replace(/\s+/g, " ").trim();
  const translated = language === "en" ? (translations[key] ?? source) : source;
  return translated.replace(/\{(\w+)\}/g, (match, key) =>
    String(values[key] ?? match),
  );
}
function updateDocument() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = language;
  document.title = t(PAGE_TITLE);
  document
    .querySelector("meta[name=\"description\"]")
    ?.setAttribute("content", t(PAGE_DESCRIPTION));
}
updateDocument();
