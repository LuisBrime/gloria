class Pen {
  constructor(c) {
    this.c = color(c)

    this.acc = 0.25
    this.density = 1

    this.points = []

    this.currentPointIndex = 0

    this.pen = {x: 0, y: 0}

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

      this.pen.x += -random(0.05, 0.65) * ratio
      this.pen.y += -random(0.05, 0.65) * ratio

      const np = max(floor(random(4.8, 7.17)), round(random(7, 15) * this.acc))
      const dd = random(0.65, 1)
      let offsetAngle = 0
      for (let j = 0; j < np; j++) {
        const r = map(j, 0, np - 1, 0, dd)
        
        const offsetMg = Math.sqrt(random()) * map(r, 0, dd, 0.15, 0.5) * 2 * ratio
        offsetAngle += random(TAU)
        const offsetX = Math.cos(offsetAngle) * offsetMg
        const offsetY = Math.sin(offsetAngle) * offsetMg

        this.figureMemoed.push(
          this.pen.x + offsetX + dx * r,
          this.pen.y + offsetY + dy * r,
          this.sW,
        )
      }

      this.pen.x *= dd
      this.pen.y *= dd
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
      linePoints.push(nx, ny, sW)

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
      ellipsePoints.push(nx, ny, sW)

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
      for (let j = 0; j < points.length; j += 3) {
        cnv.strokeWeight(points[j + 2])
        cnv.point(points[j], points[j + 1])
      }
    }

    cnv.pop()
  }

  *drawMemoed(cnv, maxYN = 150) {
    cnv.push()
    cnv.stroke(this.c)
    const stepStride = Math.max(1, Math.floor(maxYN)) * 3

    for (let i = 0; i < this.memoed.length; i++) {
      const points = this.memoed[i]

      for (let j = 0; j < points.length; j += 3) {
        if ((j + 3) % stepStride === 0) yield 0

        cnv.strokeWeight(points[j + 2])
        cnv.point(points[j], points[j + 1])
      }
    }

    cnv.pop()
  }

  displayMemoedFigure(cnv) {
    cnv.push()
    cnv.noStroke()
    cnv.fill(this.c)

    for (let i = 0; i < this.figureMemoed.length; i += 3) {
      cnv.circle(
        this.figureMemoed[i],
        this.figureMemoed[i + 1],
        this.figureMemoed[i + 2],
      )
    }

    cnv.pop()
  }

  *drawMemoedFigure(cnv, maxYN = 150) {
    cnv.push()
    cnv.noStroke()
    cnv.fill(this.c)
    const stepStride = Math.max(1, Math.floor(maxYN)) * 3

    for (let i = 0; i < this.figureMemoed.length; i += 3) {
      if ((i + 3) % stepStride === 0) yield 0

      cnv.circle(
        this.figureMemoed[i],
        this.figureMemoed[i + 1],
        this.figureMemoed[i + 2]
      )
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

    const hw = this.w * 0.5
    const p1 = { x: -hw, y: 0 }
    const p2 = { x: -hw, y: this.h }
    const p3 = { x: hw, y: 0 }
    const p4 = { x: hw, y: this.h}

    const np = max(floor(random(2.9, 8.5)), round(random(3) / this.density))

    const tw = this.w
    const th = this.h
    function lerpWNoise(p1, p2, dt) {
      const x = lerp(p1.x, p2.x, dt)
      const y = lerp(p1.y, p2.y, dt)

      const ogx = (x / (tw || 1)) * 10
      const ogy = (y / (th || 1)) * 10
      const t = noisex.simplex2(ogx * 0.06, ogy * 0.06) * TAU

      return {
        x: x + Math.cos(t) * ratio,
        y: y + Math.sin(t) * ratio,
      }
    }

    for (let i = 0; i < np; i++) {
      const ds = map(i, 0, np - 1, 0, 1)
      this.points.push(lerpWNoise(p1, p2, ds))
      this.points.push(lerpWNoise(p3, p4, ds))
    }
  }
}
