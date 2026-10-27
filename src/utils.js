export function numberToChar(number) {
  switch (number) {
    case 1:
      return "A";
    case 2:
      return "B";
    case 3:
      return "C";
    case 4:
      return "D";
    case 5:
      return "E";
    case 6:
      return "F";
    case 7:
      return "G";
    case 8:
      return "H";
    case 9:
      return "I";
    case 10:
      return "J";
    default:
      return "";
  }
}

function charToNumber(char) {
  switch (char) {
    case "A":
      return 0;
    case "B":
      return 1;
    case "C":
      return 2;
    case "D":
      return 3;
    case "E":
      return 4;
    case "F":
      return 5;
    case "G":
      return 6;
    case "H":
      return 7;
    case "I":
      return 8;
    case "J":
      return 9;
    default:
      return 10;
  }
}

export function getXY(id) {
  return [charToNumber(id.substring(0, 1)), id.substring(1) - 1];
}

export function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function setShip(masts, board) {
  let result = [];
  let tries = 0;
  while (tries < 100) {
    ++tries;
    result = [];
    let x = getRandom(0, 10);
    let y = getRandom(0, 10);
    let vh = getRandom(0, 2);
    if (vh === 0) {
      if (x + masts > 10) continue;
      let ok = true;
      for (let i = 0; i < masts; i++) {
        if (x + i < 10 && board[x + i][y]) ok = false;
      }
      if (!ok) continue;
      for (let i = -1; i < masts + 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (x + i >= 0 && y + j >= 0 && x + i < 10 && y + j < 10)
            board[x + i][y + j] = true;
        }
      }
      for (let i = 0; i < masts; i++) {
        result.push(`${numberToChar(x + i + 1)}${y + 1}`);
      }
      break;
    } else {
      if (y + masts > 10) continue;
      let ok = true;
      for (let i = 0; i < masts; i++) {
        if (y + i < 10 && board[x][y + i]) ok = false;
      }
      if (!ok) continue;
      for (let j = -1; j < masts + 1; j++) {
        for (let i = -1; i <= 1; i++) {
          if (x + i >= 0 && y + j >= 0 && x + i < 10 && y + j < 10)
            board[x + i][y + j] = true;
        }
      }
      for (let i = 0; i < masts; i++) {
        result.push(`${numberToChar(x + 1)}${y + i + 1}`);
      }
      break;
    }
  }
  return result;
}

function getNewBoard() {
  const board = [];
  for (let i = 0; i < 10; i++) {
    board[i] = [];
    for (let j = 0; j < 10; j++) {
      board[i][j] = false;
    }
  }
  return board;
}

export function generateShips() {
  while (true) {
    const board = getNewBoard();
    const ships = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1].map((masts) =>
      setShip(masts, board),
    );
    if (!ships.find((ship) => ship.length < 1)) return ships;
  }
}
