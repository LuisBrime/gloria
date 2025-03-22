class Pen {
  constructor(c) {
    this.c = color(c)

    this.acc = 0.25
    this.density = 1

    this.points = []

    this.currentPointIndex = 0

    this.pen = createVector(0, 0)

    this.sW = 0.85

    this.memoed = []
    this.figureMemoed = []
  }

  setAcc(acc) {
    this.acc = acc
  }

  setDensity(density) {
    this.density = density

    if (typeof this.calculatePoints !== 'undefined') {
      this.calculatePoints()
    }
  }

  setColor(c) {
    this.c = c
  }

  setSW(sW) {
    this.sW = sW
  }

  memoDisplay() {
    this.pen.x = this.points[0].x
    this.pen.y = this.points[1].y

    for (let i = 1; i < this.points.length; i++) {
      const target = this.points[i]
      const dx = target.x - this.pen.x
      const dy = target.y - this.pen.y

      const wobble = createVector(
        random(0.25, 0.95),
        random(0.25, 0.95),
      ).rotate(PI)
      this.pen.x += wobble.x
      this.pen.y += wobble.y

      const np = max(floor(random(4.8, 7.17)), round(random(7, 15) * this.acc))
      const dd = random(0.65, 1)
      const offset = createVector(0, 0)
      for (let j = 0; j < np; j++) {
        const r = map(j, 0, np - 1, 0, dd)
        offset.x = sqrt(random()) * map(r, 0, dd, 0.15, 0.5) * 2
        offset.rotate(random(TAU))

        this.figureMemoed.push({
          x: this.pen.x + offset.x + dx * r,
          y: this.pen.y + offset.y + dy * r,
          w: this.sW,
        })
      }

      this.pen = p5.Vector.mult(target, dd)
    }
  }

  memoLine(start, end, eP = 0.287, dSW = 0.15) {
    const linePoints = []
    const steps = max(
      floor(random(4, 8.2)),
      round(random(4, 10.2) / this.density),
    )

    const [dx, dy] = [(end.x - start.x) / steps, (end.y - start.y) / steps]

    for (let i = 0; i < steps; i++) {
      const [nx, ny] = [start.x + i * dx, start.y + i * dy]
      let [xo, yo] = [5, 5]

      const { x: nOGX, y: nOGY } = pointToOG(nx, ny)
      const firstNoise = map(
        noisex.simplex2(nOGX * 0.68 + xo, nOGY * 0.68 + yo),
        -0.92,
        1,
        0,
        1,
      )
      if (firstNoise < eP) {
        continue
      }

      const secondNoise = map(
        noisex.simplex2(nOGX * 0.15 + xo, nOGY * 0.15 + yo),
        -0.75,
        1,
        0,
        1,
      )
      const sW = secondNoise * this.sW + this.sW * (dSW + 0.15)
      linePoints.push({ sW, x: nx, y: ny })

      xo += 0.55
      yo += 0.55
    }

    this.memoed.push(linePoints)
  }

  memoCircle(pos, r, eP = 0.275, dSW = 0.15) {
    this.memoEllipse(pos, r, r, eP, dSW)
  }

  memoEllipse(pos, rx, ry, eP = 0.275, dSW = 0.15) {
    const ellipsePoints = []
    let [xo, yo] = [5, 5]

    const np = max(
      floor(random(25, 38.8)),
      round(random(35, 50) / this.density),
    )
    for (let t = 0; t <= TAU; t += TAU / np) {
      const [nx, ny] = [pos.x + rx * cos(t), pos.y + ry * sin(t)]
      const { x: nOGX, y: nOGY } = pointToOG(nx, ny)

      const firstNoise = map(
        noisex.simplex2(nOGX * 0.68 + xo, nOGY * 0.68 + yo),
        -0.92,
        1,
        0,
        1,
      )
      if (firstNoise < eP) {
        continue
      }

      const secondNoise = map(
        noisex.simplex2(nOGX * 0.15 + xo, nOGY * 0.15 + yo),
        -0.75,
        1,
        0,
        1,
      )
      const sW = secondNoise * this.sW + this.sW * (dSW + 0.075)
      ellipsePoints.push({ sW, x: nx, y: ny })

      xo += 0.55
      yo += 0.55
    }

    this.memoed.push(ellipsePoints)
  }

  displayMemoed(cnv) {
    cnv.push()
    cnv.stroke(this.c)

    for (let i = 0; i < this.memoed.length; i++) {
      const points = this.memoed[i]
      for (let j = 0; j < points.length; j++) {
        cnv.push()
        const { x, y, sW } = points[j]
        cnv.translate(x, y)
        cnv.strokeWeight(sW)
        cnv.point(0, 0)
        cnv.pop()
      }
    }

    cnv.pop()
  }

  *drawMemoed(cnv, maxYN = 150) {
    cnv.push()
    cnv.stroke(this.c)

    for (let i = 0; i < this.memoed.length; i++) {
      const points = this.memoed[i]

      for (let j = 0; j < points.length; j++) {
        if (!((j + 1) % floor(maxYN))) yield 0

        cnv.push()
        const { x, y, sW } = points[j]
        cnv.translate(x, y)
        cnv.strokeWeight(sW)
        cnv.point(0, 0)
        cnv.pop()
      }
    }

    cnv.pop()
  }

  displayMemoedFigure(cnv) {
    cnv.push()
    cnv.noStroke()
    cnv.fill(this.c)

    for (let i = 0; i < this.figureMemoed.length; i++) {
      const { x, y, w } = this.figureMemoed[i]
      cnv.push()
      cnv.translate(x, y)
      cnv.circle(0, 0, w)
      cnv.pop()
    }

    cnv.pop()
  }

  *drawMemoedFigure(cnv, maxYN = 150) {
    cnv.push()
    cnv.noStroke()
    cnv.fill(this.c)

    for (let i = 0; i < this.figureMemoed.length; i++) {
      if (!((i + 1) % floor(maxYN))) yield 0

      const { x, y, w } = this.figureMemoed[i]
      cnv.push()
      cnv.translate(x, y)
      cnv.circle(0, 0, w)
      cnv.pop()
    }

    cnv.pop()
  }
}

class OvalPen extends Pen {
  constructor(rx, ry, c) {
    super(c)

    this.rx = rx
    this.ry = ry
  }

  calculatePoints() {
    this.points = []
    const np = max(floor(random(3.2, 9.1)), round(random(7, 11) / this.density))

    for (let i = 0; i < np; i++) {
      const dx = map(i, 0, np - 1, -this.rx / 2, this.rx / 2)
      const ht = (this.ry / 2) * sqrt(1 - sq(dx) / sq(this.rx / 2))

      this.points.push(createVector(dx, ht))
      this.points.push(createVector(dx, -ht))
    }
  }
}

class RectPen extends Pen {
  constructor(w, h, c) {
    super(c)

    this.w = w
    this.h = h
  }

  calculatePoints() {
    this.points = []

    const p1 = createVector(-this.w / 2, 0)
    const p2 = createVector(-this.w / 2, this.h)
    const p3 = createVector(this.w / 2, 0)
    const p4 = createVector(this.w / 2, this.h)

    const np = max(floor(random(2.9, 8.5)), round(random(3) / this.density))

    function lerpWNoise(p1, p2, dt) {
      const x = lerp(p1.x, p2.x, dt)
      const y = lerp(p1.y, p2.y, dt)
      const { x: ogX, y: ogY } = pointToOG(x, y)
      const t = noisex.simplex2(ogX * 0.06, ogY * 0.06) * TAU
      return createVector(x + cos(t), y + sin(t))
    }

    for (let i = 0; i < np; i++) {
      const ds = map(i, 0, np - 1, 0, 1)
      this.points.push(lerpWNoise(p1, p2, ds))
      this.points.push(lerpWNoise(p3, p4, ds))
    }
  }
}
