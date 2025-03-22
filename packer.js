class Packer {
  constructor(w, h, xRes, yRes, padding) {
    this.w = w
    this.h = h

    this.xRes = xRes
    this.yRes = yRes
    this.xDivs = ceil(w / xRes)
    this.yDivs = ceil(h / yRes)

    this.padding = padding

    this.items = []

    this.generateGrid()
  }

  generateGrid() {
    this.grid = []
    for (let i = 0; i < this.xDivs; i++) {
      this.grid[i] = []
      for (let j = 0; j < this.yDivs; j++) {
        this.grid[i].push({
          i,
          j,
          x: i * this.xRes,
          y: j * this.yRes,
          c: [],
        })
      }
    }
  }

  circleDist(c1, c2) {
    const dx = c2.x - c1.x
    const dy = c2.y - c1.y
    const rs = c1.r + c2.r
    return dx * dx + dy * dy - rs * rs
  }

  cell(x, y) {
    return this.grid[floor(x / this.xRes)][floor(y / this.yRes)]
  }

  cellsAround(x, y, r) {
    const tl = [
      floor((x - r - this.padding) / this.xRes),
      floor((y - r - this.padding) / this.yRes),
    ]
    const br = [
      floor((x + r + this.padding) / this.xRes),
      floor((y + r + this.padding) / this.yRes),
    ]

    const cells = []
    for (let i = tl[0]; i <= br[0]; i++) {
      for (let j = tl[1]; j <= br[1]; j++) {
        if (i < 0 || i >= this.xDivs || j < 0 || j >= this.yDivs) continue
        cells.push(this.grid[i][j])
      }
    }

    return cells
  }

  canAddCircle(x, y, r) {
    const cToAdd = { x, y, r, t: [] }

    // Out of bounds
    if (
      cToAdd.x - cToAdd.r < 0 ||
      cToAdd.x + cToAdd.r > this.w ||
      cToAdd.y - cToAdd.r < 0 ||
      cToAdd.y + cToAdd.r > this.h
    ) {
      return false
    }

    // Collission
    const adjCells = this.cellsAround(cToAdd.x, cToAdd.y, cToAdd.r)
    for (const cell of adjCells) {
      for (const otherC of cell.c) {
        const d = this.circleDist(cToAdd, otherC)

        if (d - this.padding * this.padding < 0) {
          return false
        }
      }
    }

    return true
  }

  addCircle(c) {
    const adjCells = this.cellsAround(c.x, c.y, c.r)
    adjCells.forEach((cell) => {
      this.grid[cell.i][cell.j].c.push(c)
      if (!c.t) c.t = []
      c.t.push(`${cell.i},${cell.j}`)
    })
    this.items.push(c)
  }

  addShape(shapeCircles, actuallyAdd = true) {
    for (const c of shapeCircles) {
      if (!this.canAddCircle(c.x, c.y, c.r)) return false
    }

    if (actuallyAdd) {
      shapeCircles.forEach((c) => this.addCircle(c))
    }

    return true
  }
}

class PackedShape {
  constructor(x, y, t = 0, circleR = 5) {
    this.x = x
    this.y = y
    this.t = t
    this.circleR = circleR

    this.circles = []
  }
}

class PackedRect extends PackedShape {
  constructor(x, y, w, h, t = 0, circleR = 5) {
    super(x, y, t, circleR)

    this.w = w
    this.h = h

    this.setupCircles()
  }

  setupCircles() {
    const cosT = cos(this.t)
    const sinT = sin(this.t)
    const cx = this.x
    const cy = this.y
    const w = this.w
    const h = this.h

    const bl = [
      cx - (w / 2) * cosT - (h / 2) * sinT,
      cy - (w / 2) * sinT + (h / 2) * cosT,
    ]
    const br = [
      cx + (w / 2) * cosT - (h / 2) * sinT,
      cy + (w / 2) * sinT + (h / 2) * cosT,
    ]
    const tr = [
      cx + (w / 2) * cosT + (h / 2) * sinT,
      cy + (w / 2) * sinT - (h / 2) * cosT,
    ]
    const tl = [
      cx - (w / 2) * cosT + (h / 2) * sinT,
      cy - (w / 2) * sinT - (h / 2) * cosT,
    ]

    const d = this.circleR * 2

    const tsd = dist(tl[0], tl[1], tr[0], tr[1])
    const tsnc = ceil(tsd / d)
    for (let i = 0; i < tsnc; i++) {
      const dt = norm(i, 0, tsnc)
      this.circles.push({
        x: lerp(tl[0], tr[0], dt),
        y: lerp(tl[1], tr[1], dt),
        r: this.circleR,
      })
    }

    const rsd = dist(tr[0], tr[1], br[0], br[1])
    const rsnc = ceil(rsd / d)
    for (let i = 0; i < rsnc; i++) {
      const dt = norm(i, 0, rsnc)
      this.circles.push({
        x: lerp(tr[0], br[0], dt),
        y: lerp(tr[1], br[1], dt),
        r: this.circleR,
      })
    }

    const bsd = dist(br[0], br[1], bl[0], bl[1])
    const bsnc = ceil(bsd / d)
    for (let i = 0; i < bsnc; i++) {
      const dt = norm(i, 0, bsnc)
      this.circles.push({
        x: lerp(br[0], bl[0], dt),
        y: lerp(br[1], bl[1], dt),
        r: this.circleR,
      })
    }

    const lsd = dist(bl[0], bl[1], tl[0], tl[1])
    const lsnc = ceil(lsd / d)
    for (let i = 0; i < lsnc; i++) {
      const dt = norm(i, 0, lsnc)
      this.circles.push({
        x: lerp(bl[0], tl[0], dt),
        y: lerp(bl[1], tl[1], dt),
        r: this.circleR,
      })
    }
  }
}

class PackedCircle extends PackedShape {
  constructor(x, y, r, circleR = 5) {
    super(x, y, 0, circleR)

    this.r = r

    this.setupCircles()
  }

  setupCircles() {
    const prm = TAU * this.r
    const nc = ceil(prm / (this.circleR * 2))

    for (let t = 0; t <= TAU; t += TAU / nc) {
      this.circles.push({
        x: this.x + this.r * cos(t),
        y: this.y + this.r * sin(t),
        r: this.circleR,
      })
    }
  }
}

class PackedEllipse extends PackedShape {
  constructor(x, y, rx, ry, t = 0, circleR = 5) {
    super(x, y, t, circleR)

    this.rx = rx
    this.ry = ry

    this.setupCircles()
  }

  setupCircles() {
    const fx = (t) => {
      return this.rx * cos(t) * cos(this.t) - this.ry * sin(t) * sin(this.t)
    }
    const fy = (t) => {
      return this.rx * cos(t) * sin(this.t) + this.ry * sin(t) * cos(this.t)
    }

    const prm = PI * sqrt((sq(this.rx) + sq(this.ry)) * 2)
    const nc = ceil(prm / (this.circleR * 2))

    for (let t = 0; t <= TAU; t += TAU / nc) {
      this.circles.push({
        x: this.x + fx(t),
        y: this.y + fy(t),
        r: this.circleR,
      })
    }
  }
}

class PackedPolygon extends PackedShape {
  constructor(x, y, vertices, t = 0, circleR = 5) {
    super(x, y, t, circleR)

    this.vertices = vertices

    this.setupCircles()
  }

  setupCircles() {
    const rotatedV = []
    for (let i = 0; i < this.vertices.length; i++) {
      const { x, y } = this.vertices[i]
      const ax = this.x + x
      const ay = this.y + y
      const cosT = cos(this.t)
      const sinT = sin(this.t)
      const dx = ax - this.x
      const dy = ay - this.y

      const nx = this.x + dx * cosT - dy * sinT
      const ny = this.y + dx * sinT + dy * cosT

      rotatedV.push({ x: nx, y: ny })
    }

    for (let i = 0; i < rotatedV.length; i++) {
      const cV = rotatedV[i]
      const nV = i === rotatedV.length - 1 ? rotatedV[0] : rotatedV[i + 1]

      const d = dist(cV.x, cV.y, nV.x, nV.y)
      const nc = ceil(d / (this.circleR * 2))

      for (let j = 0; j < nc; j++) {
        const dt = norm(j, 0, nc)
        this.circles.push({
          x: lerp(cV.x, nV.x, dt),
          y: lerp(cV.y, nV.y, dt),
          r: this.circleR,
        })
      }
    }
  }
}
