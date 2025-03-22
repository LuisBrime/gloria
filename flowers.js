const FlowerType = {
  basic: 'puntito',
  daisy: 'margarita',
  gladioli: 'gladioli',
  cempa: 'cempasúchil',
  tulip: 'tulipan',
  cactus: 'cactus',
  violet: 'violeta',
  peony: 'peonia',
}

const PHI = (1 + Math.sqrt(5)) / 2

class Flowers {
  constructor() {
    this.spacingType = flowerSpacingType
    console.log(`🌷 espaciado: `, this.spacingType)

    this.packer = new Packer(W, H, xRes, yRes, flowerPadding)
    this.flowers = []

    this.flowerQuadTree = new QuadTree(new Quad(0, 0, W, H))
    this.flowerQuadTree.setCapacityKey(Flowers.FlowerQuadKey, 5)
    this.flowerQuadTree.setCapacityKey(Flowers.ReflectionQuadKey, reflectionCap)
  }

  static FlowerQuadKey = 'flowers'
  static ReflectionQuadKey = 'reflections'

  maybeAddFlower(x, y, r, c, type = FlowerType.basic, ci = 0) {
    let flower

    const i = floor(x / mapController.xRes)
    const j = floor(y / mapController.yRes)
    const t = mapController.hMapN(i, j).heading() + PI / 2

    switch (type) {
      case FlowerType.basic:
        flower = new BasicFlower(x, y, r, c)
        break
      case FlowerType.daisy:
        flower = new DaisyFlower(x, y, r, t, c)
        break
      case FlowerType.gladioli:
        flower = new GladioliFlower(x, y, r, r, t, c)
        break
      case FlowerType.cempa:
        flower = new CempaFlower(x, y, r, t, c)
        break
      case FlowerType.tulip:
        flower = new TulipFlower(x, y, r, t, c)
        break
      case FlowerType.cactus:
        flower = new CactusFlower(x, y, r, t, c, ci)
        break
      case FlowerType.violet:
        flower = new VioletFlower(x, y, r, t, c, ci)
        break
      case FlowerType.peony:
        flower = new PeonyFlower(x, y, r, t, c)
        break
    }

    const canAdd = flower.canPack(this.packer)
    if (!canAdd) return false

    flower.pack(this.packer)

    this.flowers.push(flower)
    this.flowerQuadTree.add(flower, Flowers.FlowerQuadKey)

    return true
  }

  setupFlowers() {
    this.flowers.forEach((f) => f.setupFlower())
  }

  *drawFlowers(canva) {
    for (let i = 0; i < this.flowers.length; i++) {
      const flower = this.flowers[i]

      for (const _ of flower.drawG(canva)) {
        yield 0
      }
    }
  }
}

class AFlower {
  constructor(x, y, c) {
    this.x = x
    this.y = y
    this.c = c
    this.packed = undefined
  }

  canPack(packer) {}
  pack(packer) {}
  setupFlower() {}
  *drawG(cnv) {}
}

class BasicFlower extends AFlower {
  constructor(x, y, r, c) {
    super(x, y, c)

    this.r = r
  }

  canPack(packer) {
    this.packed = { x: this.x, y: this.y, r: this.r }
    return packer.canAddCircle(this.packed.x, this.packed.y, this.packed.r)
  }

  pack(packer) {
    packer.addCircle({
      x: this.packed.x,
      y: this.packed.y,
      r: this.packed.r,
    })
  }

  setupFlower() {
    const pen = new OvalPen(this.r, this.r, this.c)
    this.pen = pen
    this.pen.setSW(penSW * 1.572)
    this.pen.setAcc(0.75 + 0.5)
    this.pen.setDensity(random(0.295, 0.35))
    this.pen.memoDisplay()

    const borderPen = new Pen(palette.penColor)
    this.borderPen = borderPen
    this.borderPen.setSW(penSW * 3.28)
    this.borderPen.memoCircle(
      {
        x: random(-this.r * 0.018, this.r * 0.018),
        y: random(-this.r * 0.018, this.r * 0.018),
      },
      this.r * random(0.289, 0.55),
      0.225,
      0.24,
    )

    this.setupOutlines()
  }

  setupOutlines() {
    if (random() < 0.625) {
      const nO = random([1, 1, 1, 1, 2, 2, 2, 3, 3, 3])

      for (let i = 0; i < nO; i++) {
        let w, h

        const plane = random()
        if (plane < 0.33) {
          w = this.pen.rx * 0.85
          h = this.pen.ry * 0.85
        } else if (plane < 0.66) {
          w = this.pen.rx * random(0.38, 0.58)
          h = this.pen.ry * 0.85
        } else {
          w = this.pen.rx * 0.85
          h = this.pen.ry * random(0.38, 0.58)
        }

        this.pen.memoEllipse({ x: 0, y: 0 }, w, h, 0.242, 0.192)
      }
    }
  }

  *drawG(cnv) {
    cnv.push()
    cnv.translate(this.x, this.y)

    // Fill
    for (const _ of this.pen.drawMemoedFigure(cnv)) {
      yield 1
    }

    // Outlines if any
    for (const _ of this.pen.drawMemoed(cnv)) {
      yield 2
    }

    // Border
    for (const _ of this.borderPen.drawMemoed(cnv)) {
      yield 0
    }

    cnv.pop()
  }
}

class DaisyFlower extends AFlower {
  constructor(x, y, r, t, c) {
    super(x, y, c)

    this.r = r
    this.t = t
  }

  canPack(packer) {
    this.packed = { x: this.x, y: this.y, r: this.r * 0.95 }
    return packer.canAddCircle(this.packed.x, this.packed.y, this.packed.r)
  }

  pack(packer) {
    packer.addCircle(this.packed)
  }

  generatePetalPoints() {
    this.petalPoints = []
    this.petalN = random([5, 5, 5, 5, 7])
    const petalL = this.r * 0.5
    const petalW =
      this.r *
      random(
        this.petalN === 5 ? 0.285 : 0.225,
        this.petalN === 5 ? 0.335 : 0.2695,
      )

    const p1 = { x: 0, y: petalW * 0.5 }
    const cp1 = { x: petalL * 0.25, y: petalW }
    const cp2 = { x: petalL * 0.75, y: petalW }
    const p2 = { x: petalL, y: 0 }

    const rsPs = []
    const lsPs = []

    for (let i = 0; i < 20; i++) {
      const dt = map(i, 0, 19, 0, 1)

      const dx = bezierPoint(p1.x, cp1.x, cp2.x, p2.x, dt)
      const dyp = bezierPoint(p1.y, cp1.y, cp2.y, p2.y, dt)
      const dyn = bezierPoint(p1.y, -cp1.y, -cp2.y, p2.y, dt)

      const rV = createVector(dx, dyp)
      this.petalPoints.push(rV)
      rsPs.push(rV)

      if (i < 19) {
        const lV = createVector(dx, dyn)
        this.petalPoints.push(lV)
        lsPs.unshift(lV)
      }
    }

    this.petalTs = Array(this.petalN).fill(0)
    this.petalTs.forEach((_, i, a) => {
      const t = map(i, 0, this.petalN, 0, TAU) + random(-PI / 13, PI / 13)
      const dt = random(-PI / 16, PI / 16)
      a[i] = { t, dt }
    })

    this.contourPs = [...rsPs, ...lsPs]
  }

  setupFlower() {
    const pen = new OvalPen(this.r * 0.47, this.r * 0.47, this.c)
    pen.setSW(penSW * 1.02)
    pen.setAcc(0.75 + 0.45)
    pen.setDensity(random(0.45, 0.65))
    pen.memoDisplay()

    const borderPen = new Pen(palette.penColor)
    borderPen.setSW(penSW * 2.8)
    borderPen.memoCircle(
      {
        x: random(-this.r * 0.018, this.r * 0.018),
        y: random(-this.r * 0.018, this.r * 0.018),
      },
      this.r * random(0.1695, 0.2195),
    )

    const petalBorderPen = new Pen(palette.penColor)
    petalBorderPen.setSW(penSW * 2.39)

    this.generatePetalPoints()
    // Fill drawing
    for (let i = 0; i < this.petalPoints.length - 1; i++) {
      const cp = this.petalPoints[i]
      const np = this.petalPoints[i + 1]
      pen.memoLine(cp, np, 0.1, 0.45)
    }

    for (let i = 0; i < this.contourPs.length - 1; i++) {
      const cp = this.contourPs[i]
      const np = this.contourPs[i + 1]
      petalBorderPen.memoLine(cp, np, 0.2)
    }

    this.pen = pen
    this.borderPen = borderPen
    this.petalBorderPen = petalBorderPen
  }

  *drawG(cnv) {
    cnv.push()
    cnv.translate(this.x, this.y)
    cnv.rotate(this.t)

    for (let i = 0; i < this.petalN; i++) {
      const { t, dt } = this.petalTs[i]
      const dx = this.r * cos(t) * 0.33
      const dy = this.r * sin(t) * 0.33
      const fT = p5.Vector.sub(
        createVector(dx, dy),
        createVector(0, 0),
      ).heading()
      cnv.push()
      cnv.translate(dx, dy)
      cnv.rotate(fT + dt)

      for (const _ of this.pen.drawMemoed(cnv)) {
        yield 0
      }

      for (const _ of this.petalBorderPen.drawMemoed(cnv)) {
        yield 1
      }

      cnv.pop()
    }

    for (const _ of this.pen.drawMemoedFigure(cnv)) {
      yield 2
    }

    for (const _ of this.borderPen.drawMemoed(cnv)) {
      yield 3
    }

    cnv.pop()
  }
}

class GladioliFlower extends AFlower {
  constructor(x, y, w, h, t, c) {
    super(x, y, c)

    this.w = w
    this.h = h
    this.t = t
  }

  setNewH(h) {
    this.h = h
  }

  canPack(packer) {
    this.packed = new PackedRect(
      this.x,
      this.y + this.h * 0.45,
      this.w,
      this.h * 1.162,
      this.t,
      flowerPadding * 0.785,
    )

    return packer.addShape(this.packed.circles, false)
  }

  pack(packer) {
    packer.addShape(this.packed.circles)
  }

  generatePetalPoints() {
    this.petalPoints = []

    const p1 = { x: this.internalFlowerW * 0.5, y: 0 }
    const cp1 = {
      x: this.internalFlowerW * 0.505,
      y: -this.internalFlowerH * 0.025,
    }
    const cp2 = {
      x: this.internalFlowerW * 0.5,
      y: -this.internalFlowerH * 0.825,
    }
    const p2 = {
      x: this.internalFlowerW * 0.105,
      y: -this.internalFlowerH * 0.88,
    }
    const cp3 = {
      x: this.internalFlowerW * 0.05,
      y: -this.internalFlowerH * 0.88,
    }
    const cp4 = {
      x: 0,
      y: -this.internalFlowerH * 0.93,
    }
    const p3 = { x: 0, y: -this.internalFlowerH }

    const fBP = (dt, isX = true, isNegative = false) => {
      return bezierPoint(
        isX ? p1.x * (isNegative ? -1 : 1) : p1.y,
        isX ? cp1.x * (isNegative ? -1 : 1) : cp1.y,
        isX ? cp2.x * (isNegative ? -1 : 1) : cp2.y,
        isX ? p2.x * (isNegative ? -1 : 1) : p2.y,
        dt,
      )
    }

    const sBP = (dt, isX = true, isNegative = false) => {
      return bezierPoint(
        isX ? p2.x * (isNegative ? -1 : 1) : p2.y,
        isX ? cp3.x * (isNegative ? -1 : 1) : cp3.y,
        isX ? cp4.x * (isNegative ? -1 : 1) : cp4.y,
        isX ? p3.x * (isNegative ? -1 : 1) : p3.y,
        dt,
      )
    }

    const rsPs = []
    const lsPs = []

    for (let i = 0; i < 20; i++) {
      const dt = map(i, 0, 19, 0, 1)

      let dxp, dxn, dy
      if (i < 12) {
        dxp = fBP(dt, true)
        dxn = fBP(dt, true, true)
        dy = fBP(dt, false)
      } else {
        dxp = sBP(dt, true)
        dxn = sBP(dt, true, true)
        dy = sBP(dt, false)
      }

      const rV = createVector(dxp, dy)
      this.petalPoints.push(rV)
      rsPs.push(rV)

      if (i < 19) {
        const lV = createVector(dxn, dy)
        this.petalPoints.push(lV)
        lsPs.unshift(lV)
      }
    }

    this.petalTs = Array(6).fill(0)
    this.petalTs.forEach((_, i, a) => {
      const t = map(i, 0, 5, 0, TAU) + random(-PI / 13, PI / 13)
      const dt = random(-PI / 16, PI / 16)
      a[i] = { t, dt }
    })
    this.contourPs = [...rsPs, ...lsPs]
  }

  setupFlower() {
    this.internalFlowersN = random([3, 3, 3, 3, 4, 4, 5])
    this.h = this.w * map(this.internalFlowersN, 3, 5, 2.25, 3.75)

    this.internalFlowerW = this.w * 0.5 * random(0.96, 1.04)
    this.internalFlowerH =
      (this.h / this.internalFlowersN) * random(0.926, 0.986)
    this.internalFlowers = []
    const dr = this.internalFlowerW * 0.47

    this.generatePetalPoints()

    for (let i = 0; i < this.internalFlowersN; i++) {
      const pen = new OvalPen(dr, dr, this.c)
      pen.setSW(penSW * 0.802)
      pen.setAcc(0.75 + 0.2)
      pen.setDensity(random(0.25, 0.45))
      pen.memoDisplay()

      const petalBorderPen = new Pen(palette.penColor)
      petalBorderPen.setSW(penSW * 2.1)

      for (let i = 0; i < this.petalPoints.length - 1; i++) {
        const cp = this.petalPoints[i]
        const np = this.petalPoints[i + 1]
        pen.memoLine(cp, np, 0.192, 0.35)
      }

      for (let i = 0; i < this.contourPs.length - 1; i++) {
        const cp = this.contourPs[i]
        const np = this.contourPs[i + 1]
        petalBorderPen.memoLine(cp, np, 0.201, 0.3)
      }

      this.internalFlowers.push({
        pen,
        petalBorderPen,
      })
    }

    const rootPen = new RectPen(
      this.w * 0.25,
      this.h * 0.475,
      random(palette.grassPalette),
    )

    rootPen.setSW(penSW * 1.39)
    rootPen.setAcc(0.75 + 0.45)
    rootPen.setDensity(random(0.25, 0.45))
    rootPen.memoDisplay()
    rootPen.setSW(penSW * 3.279)
    rootPen.memoLine(
      createVector(rootPen.w * 0.5, 0),
      createVector(rootPen.w * 0.5, rootPen.h),
      0.1,
      0.4,
    )
    rootPen.memoLine(
      createVector(-rootPen.w * 0.5, 0),
      createVector(-rootPen.w * 0.5, rootPen.h),
      0.1,
      0.4,
    )

    this.rootPen = rootPen
  }

  *drawRoot(cnv) {
    cnv.push()

    const oldC = this.rootPen.c
    this.rootPen.setColor(palette.penColor)
    for (const _ of this.rootPen.drawMemoed(cnv)) {
      yield 1
    }

    this.rootPen.setColor(oldC)
    for (const _ of this.rootPen.drawMemoedFigure(cnv)) {
      yield 0
    }

    cnv.pop()
  }

  *drawG(cnv) {
    cnv.push()
    cnv.translate(this.x, this.y)
    cnv.rotate(this.t)

    for (const _ of this.drawRoot(cnv)) {
      yield 0
    }

    const dy = this.h / this.internalFlowersN

    for (let i = 0; i < this.internalFlowers.length; i++) {
      const { pen, petalBorderPen } = this.internalFlowers[i]

      cnv.push()
      cnv.translate(0, -dy * i)
      cnv.rotate((PI / 4) * (i % 2 ? -1 : 1))

      for (const _ of pen.drawMemoedFigure(cnv)) {
        yield 2
      }

      for (let j = 0; j < 6; j++) {
        const { t, dt } = this.petalTs[j]
        const dx = this.internalFlowerW * cos(t) * 0.34
        const dy = this.internalFlowerW * sin(t) * 0.34
        const pT = p5.Vector.sub(
          createVector(dx, dy),
          createVector(0, 0),
        ).heading()

        cnv.push()
        cnv.translate(dx, dy)
        cnv.rotate(pT + dt)

        for (const _ of pen.drawMemoed(cnv)) {
          yield 0
        }

        for (const _ of petalBorderPen.drawMemoed(cnv)) {
          yield 1
        }

        cnv.pop()
      }

      cnv.pop()
    }

    cnv.pop()
  }
}

class CempaFlower extends AFlower {
  constructor(x, y, r, t, c) {
    super(x, y, c)

    this.r = r
    this.t = t
  }

  canPack(packer) {
    this.packed = { x: this.x, y: this.y, r: this.r }
    return packer.canAddCircle(this.packed.x, this.packed.y, this.packed.r)
  }

  pack(packer) {
    packer.addCircle(this.packed)
  }

  setupFlower() {
    const dr = random(1.75, 1.93)
    const pen = new OvalPen(this.r * dr, this.r * dr, this.c)
    pen.setAcc(0.75 + 0.45)
    pen.setDensity(random(0.52, 0.65))
    pen.memoDisplay()
    this.pen = pen

    this.setupPetals()
  }

  setupPetals() {
    this.petalsN = random([34, 34, 34, 34, 34, 55])
    this.petalW = this.r * 0.305
    this.petalH = this.r * 0.235

    this.setupPetalPoints()

    this.petals = []
    for (let i = 0; i < this.petalsN; i++) {
      const dp = map(i, 0, this.petalsN, 0, 1)
      const dt = i * PHI + random(-PHI * 0.0125, PHI * 0.0125)
      const dr = this.r * dp

      const px = cos(dt * TAU) * dr
      const py = sin(dt * TAU) * dr
      const pp = createVector(px, py)
      const dirT = p5.Vector.sub(pp, createVector(0, 0)).heading()

      const dd = this.petalW * random(0.08, 0.13)
      const ps = this.petalPoints.map((p, i, a) => {
        return createVector(
          p.x + (i === 0 || i === a.length - 1 ? 0 : random(-dd, dd)),
          p.y + (i === 0 || i === a.length - 1 ? 0 : random(-dd, dd)),
        )
      })

      const petalPen = new Pen(palette.penColor)
      petalPen.setSW(penSW * 1.25)

      this.petals.push({
        pen: petalPen,
        points: ps,
        pos: pp,
        t: dirT + PI / 2 + random(-PI / 16, PI / 16),
      })
    }

    this.petals.forEach(({ points, pen }) => {
      for (let i = 0; i < points.length - 1; i++) {
        pen.memoLine(points[i], points[i + 1], 0.1)
      }
    })
  }

  setupPetalPoints() {
    const hw = this.petalW * 0.5
    const cph = this.petalH * 0.95
    const bp1 = { x: -hw, y: 0 }
    const bcp1 = { x: -hw, y: -cph }
    const bcp2 = { x: hw, y: -cph }
    const bp2 = { x: hw, y: 0 }

    const petalPointAt = (dt) => {
      const nx = bezierPoint(bp1.x, bcp1.x, bcp2.x, bp2.x, dt)
      const ny = bezierPoint(bp1.y, bcp1.y, bcp2.y, bp2.y, dt)
      return { x: nx, y: ny }
    }

    const petalPoints = []
    for (let i = 0; i < 5; i++) {
      const dt = map(i, 0, 4, 0, 1)
      const p = petalPointAt(dt)
      petalPoints.push(p)
    }

    this.petalPoints = petalPoints
  }

  *drawG(cnv) {
    cnv.push()
    cnv.translate(this.x, this.y)
    cnv.rotate(this.t)

    for (const _ of this.pen.drawMemoedFigure(cnv)) {
      yield 0
    }

    for (let i = 0; i < this.petals.length; i++) {
      const { pen, pos, t } = this.petals[i]
      cnv.push()
      cnv.translate(pos.x, pos.y)
      cnv.rotate(t)

      for (const _ of pen.drawMemoed(cnv)) {
        yield 1
      }

      cnv.pop()
    }

    cnv.pop()
  }
}

class TulipFlower extends AFlower {
  constructor(x, y, w, t, c) {
    super(x, y, c)

    this.w = w * 0.779
    this.h = this.w * 1.9
    this.t = t
  }

  canPack(packer) {
    this.packed = new PackedRect(
      this.x,
      this.y + this.h * 0.45,
      this.w,
      this.h,
      this.t,
      flowerPadding * 0.385,
    )

    return packer.addShape(this.packed.circles, false)
  }

  pack(packer) {
    packer.addShape(this.packed.circles)
  }

  setupFlower() {
    this.setupPetals()
    this.setupPens()
  }

  setupPetals() {
    this.petalPoints = []

    const p1 = { x: 0, y: 0 }
    const cp1 = {
      x: this.w * 0.8,
      y: -this.h * 0.1,
    }
    const cp2 = {
      x: this.w * 0.2,
      y: -this.h * 0.85,
    }
    const p2 = {
      x: 0,
      y: -this.h,
    }

    const petalBez = (dt, isX = true, isNegative = false) => {
      return bezierPoint(
        isX ? p1.x * (isNegative ? -1 : 1) : p1.y,
        isX ? cp1.x * (isNegative ? -1 : 1) : cp1.y,
        isX ? cp2.x * (isNegative ? -1 : 1) : cp2.y,
        isX ? p2.x * (isNegative ? -1 : 1) : p2.y,
        dt,
      )
    }

    const rsPs = []
    const lsPs = []

    for (let i = 0; i < 19; i++) {
      const dt = map(i, 0, 18, 0, 1)

      const dy = petalBez(dt, false)
      const dxp = petalBez(dt, true)
      const dxn = petalBez(dt, true, true)

      const { x: ogX, y: ogY } = pointToOG(this.x, this.y)
      const tv = p5.Vector.fromAngle(
        noisex.simplex2(ogX * 0.6, ogY * 0.6) * TAU,
      ).mult(random(0.8, 1.2))

      const rV = createVector(dxp, dy)
      this.petalPoints.push(p5.Vector.add(rV, tv))
      rsPs.push(rV)

      if (i < 18) {
        const lV = createVector(dxn, dy)
        this.petalPoints.push(p5.Vector.add(lV, tv))
        lsPs.unshift(lV)
      }
    }

    this.petalDs = [
      {
        x: this.w * random(0.01, 0.015),
        y: this.h * random(0.0025, 0.025) * -1,
        t: 1 * random(0.36, 0.45) * PI * 0.225,
      },
      {
        x: this.w * random(-0.015, 0.005),
        y: 0,
        t: random(0.1, 0.2) * PI * -0.225,
      },
      {
        x: this.w * random(0.01, 0.0025),
        y: 0,
        t: 1 * random(0.674, 0.829) * PI * 0.225,
      },
    ]
    this.contourPs = [...rsPs, ...lsPs]
  }

  setupPens() {
    const borderPen = new Pen(palette.penColor)
    borderPen.setSW(penSW * 1.28)
    borderPen.setDensity(random(0.25, 0.45))

    const petalPen = new Pen(this.c)
    petalPen.setSW(penSW * 0.942)
    petalPen.setDensity(random(0.15, 0.35))

    const rootPen = new RectPen(
      this.w * 0.25,
      this.h * 0.475,
      random(palette.grassPalette),
    )
    rootPen.setSW(penSW * 1.39)
    rootPen.setAcc(0.75 + 0.45)
    rootPen.setDensity(random(0.45, 0.575))

    for (let i = 0; i < this.contourPs.length - 1; i++) {
      const cp = this.contourPs[i]
      const np = this.contourPs[i + 1]
      borderPen.memoLine(cp, np, 0.1, 0.3)
    }

    for (let i = 0; i < this.petalPoints.length - 1; i++) {
      const cp = this.petalPoints[i]
      const np = this.petalPoints[i + 1]
      petalPen.memoLine(cp, np, 0.19, 0.3)
    }

    rootPen.memoDisplay()
    rootPen.setSW(penSW * 3.279)
    rootPen.memoLine(
      createVector(rootPen.w * 0.5, 0),
      createVector(rootPen.w * 0.5, rootPen.h),
      0.1,
      0.4,
    )
    rootPen.memoLine(
      createVector(-rootPen.w * 0.5, 0),
      createVector(-rootPen.w * 0.5, rootPen.h),
      0.1,
      0.4,
    )

    this.borderPen = borderPen
    this.petalPen = petalPen
    this.rootPen = rootPen
  }

  *drawG(cnv) {
    cnv.push()
    cnv.translate(this.x, this.y)
    cnv.rotate(this.t)

    for (const _ of this.drawRoot(cnv)) {
      yield 0
    }

    for (let i = 0; i < this.petalDs.length; i++) {
      const { x, y, t } = this.petalDs[i]

      cnv.push()
      cnv.translate(x, y)
      cnv.rotate(t)

      for (const _ of this.petalPen.drawMemoed(cnv)) {
        yield 1
      }

      for (const _ of this.borderPen.drawMemoed(cnv)) {
        yield 2
      }

      cnv.pop()
    }

    cnv.pop()
  }

  *drawRoot(cnv) {
    cnv.push()

    for (const _ of this.rootPen.drawMemoedFigure(cnv)) {
      yield 1
    }

    this.rootPen.setColor(palette.penColor)
    for (const _ of this.rootPen.drawMemoed(cnv)) {
      yield 0
    }

    cnv.pop()
  }
}

class CactusFlower extends AFlower {
  constructor(x, y, w, t, c, ci) {
    super(x, y, c)

    this.w = w
    this.h = this.w * 2.867
    this.t = t

    this.flowerC = color(
      palette.flowerPalette[(ci + 1) % palette.flowerPalette.length],
    )
  }

  canPack(packer) {
    this.packed = new PackedRect(
      this.x,
      this.y + this.h * 0.5,
      this.w * 0.786,
      this.h,
      this.t,
      flowerPadding * 0.295,
    )

    return packer.addShape(this.packed.circles, false)
  }

  get hasLeftArm() {
    return Boolean(this.leftArm)
  }

  get hasRightArm() {
    return Boolean(this.rightArm)
  }

  pack(packer) {
    packer.addShape(this.packed.circles)
  }

  setupFlower() {
    this.setupBody()
    this.setupArms()
  }

  setupBody() {
    this.bodyW = this.w * random(0.524, 0.6282)
    this.thornL = this.w * random(0.5, 0.54)

    const bodyBz = (dt) => {
      const x = bezierPoint(
        this.bodyW * 0.5,
        this.bodyW * 0.5,
        this.bodyW * 0.5,
        0,
        dt,
      )
      const y = bezierPoint(0, -this.h * 0.85, -this.h, -this.h, dt)
      return { x, y }
    }

    const bodyRPs = []
    const bodyLPs = []
    const bodyFPs = []
    for (let i = 0; i < 100; i++) {
      const dt = map(i, 0, 100, 0, 1)

      const rP = bodyBz(dt)
      bodyRPs.push(rP)
      bodyFPs.push(rP)

      if (i < 99) {
        const lP = { ...rP, x: rP.x * -1 }
        bodyLPs.unshift(lP)
        bodyFPs.push(lP)
      }
    }
    const bodyConPs = [...bodyRPs, ...bodyLPs]

    const fillPen = new Pen(this.c)
    fillPen.setSW(penSW * 1.42)
    for (let i = 0; i < bodyFPs.length - 1; i++) {
      const p = bodyFPs[i]
      const np = bodyFPs[i + 1]
      fillPen.memoLine(p, np, 0.1, 0.35)
    }

    const borderPen = new Pen(palette.penColor)
    borderPen.setSW(penSW * 2.1)
    for (let i = 0; i < bodyConPs.length - 1; i++) {
      const p = bodyConPs[i]
      const np = bodyConPs[i + 1]
      borderPen.memoLine(p, np, 0.201, 0.3)
    }

    const thornPen = new Pen(palette.penColor)
    thornPen.setSW(penSW * 1.96)
    this.thornDt = PI / 4
    const thornDx = this.bodyW * 0.25
    for (let i = 0; i < 8; i++) {
      const dy = map(i, 0, 8, -this.h * 0.1, -this.h * 0.95)

      thornPen.memoLine(
        { x: thornDx, y: dy },
        {
          x: thornDx + this.thornL * cos(this.thornDt),
          y: dy - this.thornL * sin(this.thornDt),
        },
        0.05,
        0.3,
      )
      thornPen.memoLine(
        { x: -thornDx, y: dy },
        {
          x: -thornDx + this.thornL * cos(this.thornDt * 3),
          y: dy - this.thornL * sin(this.thornDt * 3),
        },
        0.05,
        0.3,
      )
    }

    this.body = { fillPen, borderPen, thornPen }
  }

  setupArms() {
    this.nArms = random([1, 1, 1, 1, 2, 2])
    this.maxArmW = this.bodyW * random(1.19, 1.86)

    let arms = []
    const isLeft = random([false, true])
    const firstArm = {
      isLeft,
      x: random(this.bodyW * 0.95, this.bodyW * 1.15) * isLeft ? -1 : 1,
      y: random(-this.h * 0.367, -this.h * 0.5829),
      w: random(this.maxArmW * 0.894, this.maxArmW * 0.935),
      h: random(-this.h * 0.3, -this.h * 0.37),
      mW: random(this.h * 0.147, this.h * 0.21),
      headDir: random([1, -1, -1, -1, -1]),
      hasFlower: random([false, false, true]),
    }

    arms.push(firstArm)
    if (isLeft) {
      this.leftArm = firstArm
    } else {
      this.rightArm = firstArm
    }

    if (this.nArms > 1) {
      const secondArm = {
        isLeft: !isLeft,
        x: random(this.bodyW * 0.95, this.bodyW * 1.15) * isLeft ? 1 : -1,
        y: random(-this.h * 0.367, -this.h * 0.5829),
        w: random(this.maxArmW * 0.894, this.maxArmW * 0.935),
        h: random(-this.h * 0.3, -this.h * 0.37),
        mW: random(this.h * 0.147, this.h * 0.21),
        headDir: random([1, -1, -1, -1, -1]),
        hasFlower: random([false, false, true]),
      }

      arms.push(secondArm)
      if (this.hasLeftArm) {
        this.rightArm = secondArm
      } else {
        this.leftArm = secondArm
      }
    }

    arms.forEach((arm) => {
      const largeLW = arm.w
      const shortLW = arm.w * 0.45
      const dx = arm.isLeft ? -1 : 1

      arm.baseTop = { x: arm.x, y: arm.y - arm.mW * 0.5 }
      arm.baseBot = { x: arm.x, y: arm.y + arm.mW * 0.5 }

      const tw = arm.headDir < 0 ? shortLW : largeLW
      arm.topLEnd = {
        x: arm.baseTop.x + dx * tw,
        y: arm.baseTop.y,
      }

      const bw = arm.headDir < 0 ? largeLW : shortLW
      arm.botLEnd = {
        x: arm.baseBot.x + dx * bw,
        y: arm.baseBot.y,
      }

      const armFlowRef = arm.headDir < 0 ? arm.baseTop : arm.baseBot
      arm.flowerP = {
        x: armFlowRef.x + dx * arm.w * 0.75,
        y: armFlowRef.y - arm.headDir * arm.h,
      }

      const bigBzRef = arm.headDir < 0 ? arm.topLEnd : arm.botLEnd
      const bigBz = (dt) => {
        const x = bezierPoint(
          bigBzRef.x,
          bigBzRef.x,
          bigBzRef.x,
          arm.flowerP.x,
          dt,
        )

        const y = bezierPoint(
          bigBzRef.y,
          bigBzRef.y - arm.headDir * arm.h * 0.75,
          bigBzRef.y - arm.headDir * arm.h,
          arm.flowerP.y,
          dt,
        )

        return { x, y }
      }

      const smolDPY = arm.h - arm.mW * 0.5
      const smolBzRef = arm.headDir < 0 ? arm.botLEnd : arm.topLEnd
      const smolBz = (dt) => {
        const x = bezierPoint(
          smolBzRef.x,
          smolBzRef.x,
          smolBzRef.x,
          arm.flowerP.x,
          dt,
        )

        const y = bezierPoint(
          smolBzRef.y,
          smolBzRef.y - arm.headDir * smolDPY * 0.85,
          smolBzRef.y - arm.headDir * smolDPY,
          arm.flowerP.y,
          dt,
        )

        return { x, y }
      }

      const lsPs = []
      const rsPs = []
      const fillPs = []
      for (let i = 0; i < 85; i++) {
        const dt = map(i, 0, 85, 0, 1)

        if (dt < 0.45) {
          const ddt = map(dt, 0, 0.45, 0, 0.96)
          const dxT = arm.topLEnd.x - arm.baseTop.x
          const dyT = arm.topLEnd.y - arm.baseTop.y

          const lP = {
            x: arm.baseTop.x + dxT * ddt,
            y: arm.baseTop.y + dyT * ddt,
          }
          fillPs.push(lP)
          lsPs.unshift(lP)

          const dxB = arm.botLEnd.x - arm.baseBot.x
          const dyB = arm.botLEnd.y - arm.baseBot.y

          const rP = {
            x: arm.baseBot.x + dxB * ddt,
            y: arm.baseBot.y + dyB * ddt,
          }
          fillPs.push(rP)
          rsPs.push(rP)
        } else {
          const ddt = map(dt, 0.45, 1, 0, 1)

          const lSP = bigBz(ddt)
          fillPs.push(lSP)
          lsPs.unshift(lSP)

          if (i < 84) {
            const sSP = smolBz(ddt)
            fillPs.push(sSP)
            rsPs.push(sSP)
          }
        }
      }

      arm.fillPs = fillPs
      arm.contourPs = [...rsPs, ...lsPs]

      arm.shortLW = shortLW
      arm.largeLW = largeLW
    })

    arms.forEach((arm) => {
      const fillPen = new Pen(this.c)
      fillPen.setSW(penSW * 1.42)
      const borderPen = new Pen(palette.penColor)
      borderPen.setSW(penSW * 2.1)

      for (let i = 0; i < arm.fillPs.length - 1; i++) {
        const p = arm.fillPs[i]
        const np = arm.fillPs[i + 1]
        fillPen.memoLine(p, np, 0.1, 0.35)
      }

      for (let i = 0; i < arm.contourPs.length - 1; i++) {
        const p = arm.contourPs[i]
        const np = arm.contourPs[i + 1]
        borderPen.memoLine(p, np, 0.201, 0.3)
      }

      arm.fillPen = fillPen
      arm.borderPen = borderPen

      if (arm.hasFlower) {
        const flowerPen = new OvalPen(
          random(arm.w * 0.1, arm.w * 0.2),
          random(arm.w * 0.5, arm.w * 0.62),
          this.flowerC,
        )
        flowerPen.setSW(penSW * 0.802)
        flowerPen.setAcc(0.75 + 0.45)
        flowerPen.setDensity(0.45)
        flowerPen.memoDisplay()

        const fFP = {
          x: arm.flowerP.x + flowerPen.rx * random(-0.2, 0.2),
          y: arm.flowerP.y + arm.headDir * flowerPen.ry * random(0.45, 0.56),
          t: (PI / 4) * arm.headDir,
        }
        const sFP = {
          x: arm.flowerP.x + flowerPen.rx * random(-0.2, 0.2),
          y: arm.flowerP.y + arm.headDir * flowerPen.ry * random(0.45, 0.56),
          t: ((3 * PI) / 4) * arm.headDir,
        }

        arm.flowerData = {
          flowerPen,
          petalPs: [fFP, sFP],
        }
      }

      const thornPen = new Pen(palette.penColor)
      thornPen.setSW(penSW * 1.6)
      const tDt = this.thornDt * (arm.isLeft ? -3 : -1) * arm.headDir
      const tDx = arm.w * 0.817 * (arm.isLeft ? -1 : 1)
      for (let i = 0; i < 4; i++) {
        const dy = map(i, 0, 4, -arm.h * 0.05, -arm.h * 0.98) * arm.headDir

        thornPen.memoLine(
          { x: arm.x + tDx, y: arm.y + dy },
          {
            x: arm.x + tDx + this.thornL * cos(tDt),
            y: arm.y + dy - this.thornL * sin(tDt),
          },
          0.1,
          0.3,
        )
      }
      arm.thornPen = thornPen
    })

    this.arms = arms
  }

  *drawG(cnv) {
    cnv.push()
    cnv.translate(this.x, this.y)
    cnv.rotate(this.t)

    for (const _ of this.drawArms(cnv)) {
      yield 0
    }

    for (const _ of this.drawBody(cnv)) {
      yield 1
    }

    cnv.pop()
  }

  *drawBody(cnv) {
    cnv.push()
    for (const _ of this.body.fillPen.drawMemoed(cnv)) {
      yield 0
    }

    for (const _ of this.body.borderPen.drawMemoed(cnv)) {
      yield 1
    }

    for (const _ of this.body.thornPen.drawMemoed(cnv)) {
      yield 2
    }
    cnv.pop()
  }

  *drawArms(cnv) {
    cnv.push()
    for (let i = 0; i < this.arms.length; i++) {
      const a = this.arms[i]

      for (const _ of a.fillPen.drawMemoed(cnv)) {
        yield 0
      }

      for (const _ of a.borderPen.drawMemoed(cnv)) {
        yield 1
      }

      for (const _ of a.thornPen.drawMemoed(cnv)) {
        yield 2
      }

      if (a.hasFlower) {
        const { flowerPen, petalPs } = a.flowerData

        cnv.push()
        for (let j = 0; j < petalPs.length; j++) {
          cnv.push()
          const petal = petalPs[j]
          cnv.translate(petal.x, petal.y)
          cnv.rotate(petal.t)
          for (const _ of flowerPen.drawMemoedFigure(cnv)) {
            yield 3
          }
          cnv.pop()
        }
        cnv.pop()
      }
    }
    cnv.pop()
  }
}

class VioletFlower extends AFlower {
  constructor(x, y, r, t, c, ci) {
    super(x, y, c)

    this.r = r
    this.t = t
    this.centerC = color(
      palette.flowerPalette[(ci + 1) % palette.flowerPalette.length],
    )
  }

  canPack(packer) {
    this.packed = { x: this.x, y: this.y, r: this.r }
    return packer.canAddCircle(this.packed.x, this.packed.y, this.packed.r)
  }

  pack(packer) {
    packer.addCircle(this.packed)
  }

  setupFlower() {
    this.innerR = this.r * random(0.205, 0.26)
    this.petalN = random([4, 5, 5, 5, 5, 5])
    this.petalW = this.r * random(0.62, 0.714)
    this.petalH = this.petalW * random(0.95, 1.16)
    this.petalsT =
      this.petalN === 4
        ? [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4]
        : [PI / 12, PI / 2, (11 * PI) / 12, (4 * PI) / 3, (5 * PI) / 3]
    this.setupPetals()
    this.setupPens()
  }

  setupPetals() {
    this.petalPoints = []

    const p1 = { x: 0, y: this.petalW * 0.56 }
    const cp1 = { x: this.petalH * 0.1, y: this.petalW * 0.87 }
    const cp2 = { x: this.petalH * 0.43, y: this.petalW * 0.8 }
    const p2 = { x: this.petalH * 0.5, y: this.petalW * 0.6 }
    const cp3 = { x: this.petalH * 0.8, y: this.petalW * 0.2 }
    const cp4 = { x: this.petalH * 0.9, y: this.petalW * 0.5 }
    const p3 = { x: this.petalH, y: 0 }
    const petalBez = (dt) => {
      let ndt, bx, by
      if (dt < 0.4) {
        ndt = map(dt, 0, 0.4, 0, 1)
        bx = bezierPoint(p1.x, cp1.x, cp2.x, p2.x, ndt)
        by = bezierPoint(p1.y, cp1.y, cp2.y, p2.y, ndt)
      } else {
        ndt = map(dt, 0.4, 1, 0, 1)
        bx = bezierPoint(p2.x, cp3.x, cp4.x, p3.x, ndt)
        by = bezierPoint(p2.y, cp3.y, cp4.y, p3.y, ndt)
      }

      return { x: bx, y: by }
    }

    const lsPs = []
    const rsPs = []
    for (let i = 0; i < 30; i++) {
      const dt = map(i, 0, 30, 0, 1)
      const petalP = petalBez(dt)
      this.petalPoints.push(petalP)
      rsPs.push(petalP)

      if (i < 29) {
        const nPP = { ...petalP, y: petalP.y * -1 }
        this.petalPoints.push(nPP)
        lsPs.unshift(nPP)
      }
    }

    this.contourPs = [...rsPs, ...lsPs]

    const cDt = PI / 10
    this.centerPs = [
      {
        dr: random(this.innerR * 0.425, this.innerR * 0.78),
        t: random(cDt, TAU / 3 - cDt),
      },
      {
        dr: random(this.innerR * 0.425, this.innerR * 0.78),
        t: random(TAU / 3 + cDt, (2 * TAU) / 3 - cDt),
      },
      {
        dr: random(this.innerR * 0.425, this.innerR * 0.78),
        t: random((2 * TAU) / 3 + cDt, TAU - cDt),
      },
    ]

    this.petalsT.forEach((t) => (t += random(-PI / 10, PI / 10)))
  }

  setupPens() {
    const borderPen = new Pen(palette.penColor)
    borderPen.setSW(penSW * 1.28)
    borderPen.setDensity(random(0.25, 0.45))

    const petalPen = new Pen(this.c)
    petalPen.setSW(penSW * 0.942)
    petalPen.setDensity(random(0.285, 0.35))

    for (let i = 0; i < this.contourPs.length - 1; i++) {
      const cp = this.contourPs[i]
      const np = this.contourPs[i + 1]
      borderPen.memoLine(cp, np, 0.1, 0.3)
    }

    for (let i = 0; i < this.petalPoints.length - 1; i++) {
      const cp = this.petalPoints[i]
      const np = this.petalPoints[i + 1]
      petalPen.memoLine(cp, np, 0.05, 0.3)
    }

    const centerFillPen = new OvalPen(this.innerR, this.innerR, this.c)
    centerFillPen.setAcc(0.75 + 0.45)
    centerFillPen.setDensity(0.46)
    centerFillPen.memoDisplay()
    const centerPen = new OvalPen(
      this.innerR * 0.125,
      this.innerR * 0.125,
      this.centerC,
    )
    centerPen.setSW(penSW * 0.382)
    centerPen.setAcc(0.75)
    centerPen.setDensity(random(0.45, 0.65))
    centerPen.memoDisplay()

    this.borderPen = borderPen
    this.petalPen = petalPen
    this.centerFillPen = centerFillPen
    this.centerPen = centerPen
  }

  *drawG(cnv) {
    cnv.push()
    cnv.translate(this.x, this.y)
    cnv.rotate(this.t)

    for (const _ of this.centerFillPen.drawMemoedFigure(cnv)) {
      yield 0
    }

    for (let i = 0; i < this.petalN; i++) {
      const t = this.petalsT[i]
      cnv.push()
      cnv.rotate(t)
      cnv.translate(this.r * 0.214, 0)

      for (const _ of this.petalPen.drawMemoed(cnv)) {
        yield 1
      }

      for (const _ of this.borderPen.drawMemoed(cnv)) {
        yield 2
      }

      cnv.pop()
    }

    for (let i = 0; i < this.centerPs.length; i++) {
      const { dr, t: ct } = this.centerPs[i]
      cnv.push()
      cnv.translate(dr * cos(ct), dr * sin(ct))
      for (const _ of this.centerPen.drawMemoedFigure(cnv)) {
        yield 3
      }
      cnv.pop()
    }

    cnv.pop()
  }
}

class PeonyFlower extends AFlower {
  constructor(x, y, r, t, c) {
    super(x, y, c)

    this.r = r
    this.t = t
  }

  canPack(packer) {
    this.packed = new PackedRect(
      this.x,
      this.y + this.r * 0.45,
      this.r,
      this.r * 1.1,
      this.t,
      flowerPadding * 0.385,
    )

    return packer.addShape(this.packed.circles, false)
  }

  pack(packer) {
    packer.addShape(this.packed.circles)
  }

  setupFlower() {
    this.petalN = random([29, 34, 34, 34, 55, 55])
    this.minPetalW = this.r * 0.603
    this.maxPetalW = this.r * 0.815
    this.minPetalH = this.r * 0.238
    this.maxPetalH = this.r * 0.328

    this.bigPetalWA = [1, 0.45, 0.25, 0.95]
    this.bigPetalWAS = this.bigPetalWA.reduce((p, c) => p + c, 0)
    this.bigPetalWF = [1, random(0.87, 1.4), random(1.28, 2.2), random(7, 9)]

    this.smolPetalWA = [0.25, 0.115, 0.075, 0.025]
    this.smolPetalWAS = this.smolPetalWA.reduce((p, c) => p + c, 0)
    this.smolPetalWF = [1, random(3.3, 3.87), random(3, 4), random(14, 17)]

    this.setupPetals()
  }

  setupPetals() {
    const bigPetalF = (dt) => {
      let dy = 0
      for (let i = 0; i < this.bigPetalWA.length; i++) {
        const a = this.bigPetalWA[i]
        const f = this.bigPetalWF[i]
        dy += sin(dt * f) * a
      }
      return map(dy, -this.bigPetalWAS, this.bigPetalWAS, -1, 1)
    }

    const smolPetalF = (dt) => {
      let dy = 0
      for (let i = 0; i < this.smolPetalWA.length; i++) {
        const a = this.smolPetalWA[i]
        const f = this.smolPetalWF[i]
        dy += sin(dt * f) * a
      }
      return map(dy, -this.smolPetalWAS, this.smolPetalWAS, -1, 1)
    }

    const petals = []
    for (let i = 0; i < this.petalN; i++) {
      const dlr = map(i, 0, this.petalN, 1, 0)
      const petalT = i * PHI + random(-PHI * 0.0125, PHI * 0.0125)
      const dr = this.r * dlr

      const pos = createVector(cos(petalT * TAU) * dr, sin(petalT * TAU) * dr)
      const petalDir = p5.Vector.sub(pos, createVector(0, 0)).heading()
      const ps = []
      const fillPen = new Pen(this.c)
      fillPen.setSW(penSW * 1.672)
      const borderPen = new Pen(palette.penColor)
      borderPen.setSW(penSW * 0.821)

      const petalType = floor(map(i, 0, this.petalN, 4, 0))
      const nPs = map(i, 0, this.petalN, 25, 10)
      const pf = petalType <= 1 ? smolPetalF : bigPetalF
      const dw = map(i, 0, this.petalN, this.maxPetalW, this.minPetalW)
      const dh = map(i, 0, this.petalN, this.maxPetalH, this.minPetalH)

      for (let j = 0; j < nPs; j++) {
        const phw = dw * 0.5
        const px = map(j, 0, nPs, -phw, phw)
        const pDT = map(px, -phw, phw, 0, TAU)

        const py = pf(pDT) * dh
        ps.push({ x: px, y: py })
      }

      petals.push({
        pos,
        fillPen,
        borderPen,
        points: ps,
        t: petalDir + PI / 2 + random(-PI / 16, PI / 16),
      })
    }

    petals.forEach(({ borderPen, points }) => {
      for (let i = 0; i < points.length - 1; i++) {
        const p = points[i]
        const np = points[i + 1]
        borderPen.memoLine(p, np, 0.14, 0.3)
      }
    })

    petals.forEach(({ fillPen, points }) => {
      let si = 0
      let ei = points.length - 1
      while (si < points.length * 0.5 && ei > points.length * 0.5) {
        const p = points[si]
        const op = points[ei]
        fillPen.memoLine(p, op, 0.05, 0.425)

        si++
        ei--
      }
    })

    const rootPen = new RectPen(
      this.r * 0.27,
      this.r * 0.705,
      random(palette.grassPalette),
    )
    rootPen.setSW(penSW * 1.59)
    rootPen.setAcc(0.75 + 0.45)
    rootPen.setDensity(random(0.45, 0.575))
    rootPen.memoDisplay()
    rootPen.setSW(penSW * 3.279)
    rootPen.memoLine(
      createVector(rootPen.w * 0.5, 0),
      createVector(rootPen.w * 0.5, rootPen.h),
      0.1,
      0.4,
    )
    rootPen.memoLine(
      createVector(-rootPen.w * 0.5, 0),
      createVector(-rootPen.w * 0.5, rootPen.h),
      0.1,
      0.4,
    )

    this.petals = petals
    this.rootPen = rootPen
  }

  *drawG(cnv) {
    cnv.push()
    cnv.translate(this.x, this.y)
    cnv.rotate(this.t)

    for (const _ of this.drawRoot(cnv)) {
      yield 0
    }

    for (let i = 0; i < this.petals.length; i++) {
      for (const _ of this.drawPetal(cnv, this.petals[i])) yield 1
    }

    cnv.pop()
  }

  *drawRoot(cnv) {
    cnv.push()
    cnv.translate(0, this.r * 0.864)

    for (const _ of this.rootPen.drawMemoedFigure(cnv)) {
      yield 0
    }

    this.rootPen.setColor(palette.penColor)
    for (const _ of this.rootPen.drawMemoed(cnv)) {
      yield 1
    }

    cnv.pop()
  }

  *drawPetal(cnv, petal) {
    cnv.push()
    cnv.translate(petal.pos.x, petal.pos.y)
    cnv.rotate(petal.t)

    for (const _ of petal.fillPen.drawMemoed(cnv)) {
      yield 0
    }

    for (const _ of petal.borderPen.drawMemoed(cnv)) {
      yield 1
    }

    cnv.pop()
  }
}
