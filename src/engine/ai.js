export const OPPONENTS = [
  {
    id: "random",
    name: "Felek",
    role: "Odkrywca",
    level: "Na rozgrzewkę",
    icon: "✦",
    description:
      "Strzela losowo. Lubi niespodzianki i daje Ci czas na znalezienie własnej taktyki.",
  },
  {
    id: "hunter",
    name: "Hugo",
    role: "Łowca",
    level: "Czujny rywal",
    icon: "⌖",
    description:
      "Szuka losowo, ale po trafieniu sprawdza sąsiadów i podąża wzdłuż statku.",
  },
  {
    id: "parity",
    name: "Ada",
    role: "Strategini",
    level: "Krok do przodu",
    icon: "◇",
    description:
      "Szuka w szachownicę i dobija trafione statki. Nie pomija też pojedynczych masztów.",
  },
  {
    id: "sonar",
    name: "Lena",
    role: "Nawigatorka",
    level: "Pełne skupienie",
    icon: "◉",
    description:
      "Liczy możliwe położenia pozostałych statków. Celuje tam, gdzie pasuje najwięcej układów.",
  },
];

function pick(items, random) {
  return items.length ? items[Math.floor(random() * items.length)] : null;
}

function candidates(cells) {
  return cells.flatMap((line, row) =>
    line.flatMap((state, col) => (state === "unknown" ? [[row, col]] : [])),
  );
}

function targets(cells) {
  const hits = cells.flatMap((line, row) =>
    line.flatMap((state, col) => (state === "hit" ? [[row, col]] : [])),
  );
  const scores = new Map();
  for (const [row, col] of hits) {
    for (const [dr, dc] of [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]) {
      const r = row + dr,
        c = col + dc;
      if (cells[r]?.[c] !== "unknown") continue;
      const score = cells[row - dr]?.[col - dc] === "hit" ? 5 : 1;
      const key = `${r},${c}`;
      scores.set(key, (scores.get(key) ?? 0) + score);
    }
  }
  const best = Math.max(0, ...scores.values());
  return [...scores]
    .filter(([, score]) => score === best)
    .map(([key]) => key.split(",").map(Number));
}

function density(cells, remaining, choices, random) {
  const scores = Array.from({ length: 10 }, () => Array(10).fill(0));
  for (const length of remaining) {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        for (const [dr, dc] of length === 1
          ? [[0, 1]]
          : [
            [0, 1],
            [1, 0],
          ]) {
          const parts = Array.from({ length }, (_, i) => [
            row + dr * i,
            col + dc * i,
          ]);
          if (
            !parts.every(([r, c]) => ["unknown", "hit"].includes(cells[r]?.[c]))
          )
            continue;
          // Distinct ships cannot touch, including diagonally.
          if (
            parts.some(([r, c]) =>
              [-1, 0, 1].some((dy) =>
                [-1, 0, 1].some(
                  (dx) =>
                    cells[r + dy]?.[c + dx] === "hit" &&
                    !parts.some(([pr, pc]) => pr === r + dy && pc === c + dx),
                ),
              ),
            )
          )
            continue;
          for (const [r, c] of parts) scores[r][c]++;
        }
      }
    }
  }
  const best = Math.max(...choices.map(([r, c]) => scores[r][c]));
  return pick(
    choices.filter(([r, c]) => scores[r][c] === best),
    random,
  );
}

export function chooseShot(
  { cells, remaining },
  strategy = "hunter",
  random = Math.random,
) {
  const available = candidates(cells);
  if (!available.length) return null;
  if (strategy === "random") return pick(available, random);
  const pursuit = targets(cells);
  if (strategy === "sonar")
    return density(
      cells,
      remaining,
      pursuit.length ? pursuit : available,
      random,
    );
  if (pursuit.length) return pick(pursuit, random);
  if (strategy === "parity" && remaining.some((length) => length > 1)) {
    const checkerboard = available.filter(([r, c]) => (r + c) % 2 === 0);
    if (checkerboard.length) return pick(checkerboard, random);
  }
  return pick(available, random);
}
