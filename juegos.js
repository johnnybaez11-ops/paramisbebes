const games = [
  {
    title: "El piano de Michi",
    category: "aprender",
    categoryLabel: "Aprender · Música",
    description: "Escucha a Michi y aprende, nota a nota, «Estrellita, ¿dónde estás?».",
    age: "Ideal para peques",
    emoji: "🐱🎹",
    background: "#ffe2ee",
    href: "./juegos/piano-michi/"
  },
  {
    title: "Botellitas de colores",
    category: "aprender",
    categoryLabel: "Aprender · Colores",
    description: "Ordena los colores y resuelve divertidos retos de lógica.",
    age: "Colores y lógica",
    emoji: "🧃🌈",
    background: "#ddf7e9",
    href: "./juegos/botellitas/"
  },
  {
    title: "Gatito y bolas de nieve",
    category: "aventura",
    categoryLabel: "Aventura",
    description: "Acompaña al gatito en un juego de nieve lleno de movimiento.",
    age: "Juego de reflejos",
    emoji: "🐱❄️",
    background: "#dceeff",
    href: "./juegos/gatito-nieve/"
  },
  {
    title: "Block Brawl: Isla del Trueno",
    category: "accion",
    categoryLabel: "Acción 3D",
    description: "Explora la arena, juega contra bots y descubre sus desafíos.",
    age: "Para jugar con un adulto",
    emoji: "🥊🌩️",
    background: "#ffe9c9",
    href: "./juegos/block-brawl/"
  }
];

const grid = document.querySelector("#game-grid");
const count = document.querySelector("#game-count");

function createGameCard(game) {
  const card = document.createElement("article");
  card.className = "game-card";
  card.dataset.category = game.category;

  const link = document.createElement("a");
  link.className = "game-link";
  link.href = game.href;
  link.setAttribute("aria-label", `Jugar ${game.title}. ${game.description}`);

  const art = document.createElement("div");
  art.className = "game-art";
  art.style.setProperty("--game-bg", game.background);
  art.setAttribute("aria-hidden", "true");

  const category = document.createElement("span");
  category.className = "category-pill";
  category.textContent = game.categoryLabel;

  const emoji = document.createElement("span");
  emoji.className = "game-emoji";
  emoji.textContent = game.emoji;
  art.append(category, emoji);

  const copy = document.createElement("div");
  copy.className = "game-copy";

  const title = document.createElement("h3");
  title.className = "game-title";
  title.textContent = game.title;

  const description = document.createElement("p");
  description.className = "game-description";
  description.textContent = game.description;

  const meta = document.createElement("div");
  meta.className = "game-meta";

  const age = document.createElement("span");
  age.className = "game-age";
  age.textContent = game.age;

  const play = document.createElement("span");
  play.className = "play-label";
  play.textContent = "Jugar →";

  meta.append(age, play);
  copy.append(title, description, meta);
  link.append(art, copy);
  card.append(link);
  return card;
}

games.forEach((game) => grid.append(createGameCard(game)));

function setFilter(filter) {
  const cards = Array.from(grid.children);
  const visibleCount = cards.filter((card) => {
    const visible = filter === "todos" || card.dataset.category === filter;
    card.hidden = !visible;
    return visible;
  }).length;
  count.textContent = `${visibleCount} ${visibleCount === 1 ? "juego" : "juegos"}`;
}

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((filterButton) => {
      filterButton.setAttribute("aria-pressed", String(filterButton === button));
    });
    setFilter(button.dataset.filter);
  });
});

setFilter("todos");
