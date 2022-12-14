import { generateShips, getXY, getRandom, sleep, shuffle, printBoardInConsole } from './utils'

function bind(methods, object) {
  methods.forEach(method => object[method] = object[method].bind(object))
}

export class Board {
  constructor({color, opponent, ships}) {
    bind(['getBox','setShips','shoot','setMishits','isShipDown'], this)

    this.color = color
    this.opponent = opponent
    this.ships = ships
    this.boxes = []
    for (let i = 0; i < 10; i++) {
      this.boxes[i] = []
      for (let j = 0; j < 10; j++)
        this.boxes[i][j] = {
          ship: false,
          shot: false,
          color: color,
          shoot: () => this.shoot(i, j)
        }
    }
    this.setShips(false)
  }

  reset() {
    this.boxes.forEach(row => {
      row.forEach(box => {
        box.ship = false
        box.shot = false
      })
    })
    this.setShips()
  }

  isShipDown(ship) {
    for (let mast of ship) {
      const [x, y] = getXY(mast)
      if(!this.boxes[x][y].shot) return false
    }
    return true
  }

  shoot(x, y) {
    let won = true
    this.boxes[x][y].shot = true
    for (let ship of this.ships) {
      if(this.isShipDown(ship)) {
        this.shipDown(ship)
      } else {
        won = false
      }
    }
    return [this.boxes[x][y].ship, won]
  }

  shipDown(ship) {
    for (let mast of ship) {
      const [x, y] = getXY(mast)
      this.setMishits(x, y)
    }
  }

  setMishits(i, j){
    if(i-1>=0 && j-1>=0) 
      this.boxes[i-1][j-1].shot = true
    if(i-1>=0) 
      this.boxes[i-1][j].shot = true
    if(i-1>=0 && j+1<10) 
      this.boxes[i-1][j+1].shot = true
    if(j+1<10) 
      this.boxes[i][j+1].shot = true
    if(j-1>=0) 
      this.boxes[i][j-1].shot = true
    if(i+1<10 && j+1<10) 
      this.boxes[i+1][j+1].shot = true
    if(i+1<10 && j-1>=0) 
      this.boxes[i+1][j-1].shot = true
    if(i+1<10) 
      this.boxes[i+1][j].shot = true
  }

  getBox(x, y) {
    return this.boxes[x][y]
  }

  setShips(generate = true) {
    if(generate) this.ships = generateShips()
    for (const ship of this.ships) {
      for (const mast of ship) {
        const [x, y] = getXY(mast)
        this.boxes[x][y].ship = true
      }
    }
    printBoardInConsole(this.boxes, this.color)
  }
}

export class AI {
  constructor(board, fire) {
    this.board = board
    this.fire = fire
    this.last = undefined
    this.masts = []
  }

  reset() {
    this.last = undefined
    this.masts = []
  }

  maxMin(xy) {
    let maxMin = {}
    maxMin.max = this.masts[0][xy]
    maxMin.min = this.masts[0][xy]
    for (let i = 1; i < this.masts.length; i++) {
      if (this.masts[i][xy] > maxMin.max) maxMin.max = this.masts[i][xy]
      if (this.masts[i][xy] < maxMin.min) maxMin.min = this.masts[i][xy]
    }
    return maxMin
  }

  around(i, j) {
    if(this.masts.length < 2) {
      const boxes = []
      if(i-1>=0 && !this.board.boxes[i-1][j].shot) boxes.push([i-1,j])
      if(i+1<10 && !this.board.boxes[i+1][j].shot) boxes.push([i+1,j])
      if(j-1>=0 && !this.board.boxes[i][j-1].shot) boxes.push([i,j-1])
      if(j+1<10 && !this.board.boxes[i][j+1].shot) boxes.push([i,j+1])

      shuffle(boxes)

      if(boxes.length) return boxes[0]
      else return this.selectRandom()

    } else {
      if (this.masts[0][0] === this.masts[1][0]) {
        let [x, y] = [this.masts[0][0], this.maxMin(1)]
        if(y.min-1>=0 && !this.board.boxes[x][y.min-1].shot) return [x,y.min-1]
        if(y.max+1<10 && !this.board.boxes[x][y.max+1].shot) return [x,y.max+1]
      } else {
        let [x, y] = [this.maxMin(0), this.masts[0][1]]
        if(x.min-1>=0 && !this.board.boxes[x.min-1][y].shot) return [x.min-1,y]
        if(x.max+1<10 && !this.board.boxes[x.max+1][y].shot) return [x.max+1,y]
      }
      this.reset()
      return this.selectRandom()
    }
  }

  selectRandom() {
    const [x, y] = [getRandom(0, 10), getRandom(0, 10)]
    if(this.board.getBox(x, y).shot) return this.selectRandom()
    return [x, y]
  }

  async play() {
    await sleep(500)
    const [x, y] = this.last ? this.around(this.last[0], this.last[1]) : this.selectRandom()
    const result = this.fire(this.board.getBox(x,y))

    if(result) {
      this.last = []
      this.last[0] = x
      this.last[1] = y
      this.masts.push(this.last)
      this.play()
    }
  }
}

export class Store {
  constructor() {
    bind(['fire', 'changePlayer', 'newGame'], this)

    this.activePlayer = true
    this.gameOver = true
    this.playerRed = new Board({ color: 'red', opponent: true, ships: [
      ['B2','B3','B4','C2','D2','E2','E3','E4','F4','G4','H4','I4','I3','I2'],
      ['B6','C6','D6','E6','F6','G6','H6','I6','E7','B8','C8','D8','E8','F8','G8','H8','I8'],
      ['B10','C10','D10','E10','F10','G10','H10','I10']
    ]})
    this.playerGreen = new Board({ color: 'green', opponent: false, ships: [
      ['B1','C1','D1','E1','F1','G1','H1','I1'],
      ['B3','C3','D3','E3','F3','G3','H3','I3','B4','B5','C5','D5','E5','E4'],
      ['B7','B8','B9','C7','D7','E7','E8','E9','F9','G9','H9','I9','I8','I7']
    ]})
    this.ai = new AI(this.playerRed, this.fire)
    this.register = []
  }

  update() {
    this.register.forEach(u => u())
  }

  changePlayer() {
    this.update()
    this.activePlayer = !this.activePlayer
    if(!this.activePlayer) this.ai.play()
    this.update()
  }

  fire(box) {
    const [result, won] = box.shoot()
    this.update()
    if(won) {
      this.gameOver = true
      this.update()
      return false
    } else {
      if(!result) {this.changePlayer(); return false}
      else return true
    }
  }

  newGame() {
    // eslint-disable-next-line no-console
    console.clear()
    this.activePlayer = true
    this.gameOver = false
    this.playerRed.reset()
    this.playerGreen.reset()
    this.playerGreen.opponent = false
    this.ai.reset()
    this.update()
  }
}

const store = new Store()

export function useStore() {
  return store
}
