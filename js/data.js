/* ============================================================
   Данные игры: буквы, слова, похожие буквы, список режимов
   ============================================================ */

window.ABC = window.ABC || {};

ABC.ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

ABC.LETTERS = [
  { l: "A", name: "эй",     ipa: "/eɪ/",        word: "Apple",      ru: "яблоко",       emoji: "🍎" },
  { l: "B", name: "би",     ipa: "/biː/",       word: "Ball",       ru: "мяч",          emoji: "⚽" },
  { l: "C", name: "си",     ipa: "/siː/",       word: "Cat",        ru: "кошка",        emoji: "🐱" },
  { l: "D", name: "ди",     ipa: "/diː/",       word: "Dog",        ru: "собака",       emoji: "🐶" },
  { l: "E", name: "и",      ipa: "/iː/",        word: "Egg",        ru: "яйцо",         emoji: "🥚" },
  { l: "F", name: "эф",     ipa: "/ef/",        word: "Fish",       ru: "рыба",         emoji: "🐟" },
  { l: "G", name: "джи",    ipa: "/dʒiː/",      word: "Goat",       ru: "коза",         emoji: "🐐" },
  { l: "H", name: "эйч",    ipa: "/eɪtʃ/",      word: "Hat",        ru: "шляпа",        emoji: "🎩" },
  { l: "I", name: "ай",     ipa: "/aɪ/",        word: "Ice cream",  ru: "мороженое",    emoji: "🍦" },
  { l: "J", name: "джей",   ipa: "/dʒeɪ/",      word: "Juice",      ru: "сок",          emoji: "🧃" },
  { l: "K", name: "кей",    ipa: "/keɪ/",       word: "Key",        ru: "ключ",         emoji: "🔑" },
  { l: "L", name: "эл",     ipa: "/el/",        word: "Lion",       ru: "лев",          emoji: "🦁" },
  { l: "M", name: "эм",     ipa: "/em/",        word: "Monkey",     ru: "обезьяна",     emoji: "🐵" },
  { l: "N", name: "эн",     ipa: "/en/",        word: "Nose",       ru: "нос",          emoji: "👃" },
  { l: "O", name: "оу",     ipa: "/əʊ/",        word: "Orange",     ru: "апельсин",     emoji: "🍊" },
  { l: "P", name: "пи",     ipa: "/piː/",       word: "Panda",      ru: "панда",        emoji: "🐼" },
  { l: "Q", name: "кью",    ipa: "/kjuː/",      word: "Queen",      ru: "королева",     emoji: "👑" },
  { l: "R", name: "ар",     ipa: "/ɑː/",        word: "Rabbit",     ru: "кролик",       emoji: "🐰" },
  { l: "S", name: "эс",     ipa: "/es/",        word: "Sun",        ru: "солнце",       emoji: "☀️" },
  { l: "T", name: "ти",     ipa: "/tiː/",       word: "Tiger",      ru: "тигр",         emoji: "🐯" },
  { l: "U", name: "ю",      ipa: "/juː/",       word: "Umbrella",   ru: "зонт",         emoji: "☂️" },
  { l: "V", name: "ви",     ipa: "/viː/",       word: "Van",        ru: "фургон",       emoji: "🚐" },
  { l: "W", name: "дабл-ю", ipa: "/ˈdʌbljuː/",  word: "Watermelon", ru: "арбуз",        emoji: "🍉" },
  { l: "X", name: "экс",    ipa: "/eks/",       word: "Xylophone",  ru: "ксилофон",     emoji: "🎹" },
  { l: "Y", name: "уай",    ipa: "/waɪ/",       word: "Yacht",      ru: "яхта",         emoji: "⛵" },
  { l: "Z", name: "зед",    ipa: "/zed/",       word: "Zebra",      ru: "зебра",        emoji: "🦓" }
];

/* Слова для игры «Собери слово» — только короткие и знакомые детям */
ABC.WORDS = [
  { w: "CAT",  ru: "кошка",    emoji: "🐱" },
  { w: "DOG",  ru: "собака",   emoji: "🐶" },
  { w: "SUN",  ru: "солнце",   emoji: "☀️" },
  { w: "FISH", ru: "рыба",     emoji: "🐟" },
  { w: "BALL", ru: "мяч",      emoji: "⚽" },
  { w: "EGG",  ru: "яйцо",     emoji: "🥚" },
  { w: "HAT",  ru: "шляпа",    emoji: "🎩" },
  { w: "KEY",  ru: "ключ",     emoji: "🔑" },
  { w: "LION", ru: "лев",      emoji: "🦁" },
  { w: "MILK", ru: "молоко",   emoji: "🥛" },
  { w: "STAR", ru: "звезда",   emoji: "⭐" },
  { w: "FROG", ru: "лягушка",  emoji: "🐸" },
  { w: "BEAR", ru: "медведь",  emoji: "🐻" },
  { w: "CAKE", ru: "торт",     emoji: "🍰" },
  { w: "BIRD", ru: "птица",    emoji: "🐦" },
  { w: "MOON", ru: "луна",     emoji: "🌙" },
  { w: "TREE", ru: "дерево",   emoji: "🌳" },
  { w: "BOOK", ru: "книга",    emoji: "📚" },
  { w: "DUCK", ru: "утка",     emoji: "🦆" },
  { w: "BUS",  ru: "автобус",  emoji: "🚌" }
];

/* Похожие по начертанию буквы — для правдоподобных вариантов ответа */
ABC.SIMILAR = [
  ["b", "d", "p", "q"],
  ["m", "n", "w", "u"],
  ["i", "j", "l", "t"],
  ["o", "c", "q", "g"],
  ["s", "z", "c"],
  ["e", "f", "l"],
  ["a", "e", "o"],
  ["v", "u", "w", "y"],
  ["k", "x", "h"],
  ["r", "n", "m"],
  ["y", "v", "u"]
];

/* Режимы игры. kind: game — запускается через игровой экран */
ABC.GAME_LIST = [
  {
    id: "alphabet",
    kind: "alphabet",
    title: "Алфавит",
    desc: "Карточки с буквами, словами и озвучкой",
    emoji: "🔤",
    accent: "#6c5ce7",
    tint: "#efedff",
    meta: "26 букв"
  },
  {
    id: "trace",
    kind: "trace",
    title: "Прописи",
    desc: "Обведи букву и потренируй руку",
    emoji: "✏️",
    accent: "#ff5f92",
    tint: "#ffe9f2",
    meta: "26 букв"
  },
  {
    id: "find",
    kind: "game",
    title: "Найди букву",
    desc: "Соотнеси заглавную и строчную буквы",
    emoji: "🔎",
    accent: "#0ea5e9",
    tint: "#e5f6ff",
    meta: "10 заданий"
  },
  {
    id: "listen",
    kind: "game",
    title: "Слушай и выбирай",
    desc: "Узнай букву на слух",
    emoji: "🎧",
    accent: "#e8a300",
    tint: "#fff4dc",
    meta: "10 заданий"
  },
  {
    id: "word",
    kind: "game",
    title: "Собери слово",
    desc: "Составь английское слово по картинке",
    emoji: "🧩",
    accent: "#0ea371",
    tint: "#e2fbf1",
    meta: "8 слов"
  },
  {
    id: "order",
    kind: "game",
    title: "По порядку",
    desc: "Расставь буквы по алфавиту",
    emoji: "🔠",
    accent: "#8b5cf6",
    tint: "#f1e9ff",
    meta: "6 наборов"
  },
  {
    id: "memory",
    kind: "game",
    title: "Пары букв",
    desc: "Найди заглавную и строчную пару",
    emoji: "🃏",
    accent: "#ef4444",
    tint: "#ffe8e8",
    meta: "12 карточек"
  }
];

ABC.getLetter = function (ch) {
  if (!ch) return null;
  const upper = String(ch).toUpperCase();
  return ABC.LETTERS.find((item) => item.l === upper) || null;
};
