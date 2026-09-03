let criaturasCsController

class Criatura {
  constructor(x, y, t, w, h) {
    this.pos = createVector(x, y)
    this.t = t
    this.w = w
    this.h = h
  }

  setT(t) {
    this.t = t
  }

  canPack(packer) {
    this.packed = new PackedEllipse(
      this.x,
      this.y,
      this.w * 1.1,
      this.h * 1.1,
      this.t,
      xRes * 1.1,
    )
    return packer.addShape(this.packed.circles, false)
  }

  pack(packer) {
    packer.addShape(this.packed.circles)
  }

  setupBody() {}
  *draw(cnv, deleteFromCnvs = []) {}
}

class Abejita extends Criatura {
  constructor(x, y, t, w, h) {
    super(x, y, t, w, h)
  }

  setupBody() {
    const bodyPen = new OvalPen(
      this.w * 0.9,
      this.h * 0.9,
      palette.beePalette.body,
    )
    bodyPen.setSW(penSW * 3.1)
    bodyPen.setAcc(0.75 + 0.45)
    bodyPen.setDensity(random(0.25, 0.45))
    bodyPen.memoDisplay()

    const de = random(0.3695, 0.4195)
    bodyPen.setSW(penSW * 3.082)
    bodyPen.memoEllipse(
      {
        x: random(-this.w * 0.018, this.w * 0.018),
        y: random(-this.h * 0.018, this.h * 0.018),
      },
      this.w * de,
      this.h * de,
      0.18,
      0.2,
    )
    this.bodyPen = bodyPen

    this.setupWings()
    this.setupStripes()
    this.setupStinger()
  }

  setupWings() {
    this.setupWingPoints()

    const wingsPen = new Pen(palette.beePalette.wings)
    wingsPen.setSW(penSW * 2.15)
    for (let i = 0; i < this.contourPs.length - 1; i++) {
      wingsPen.memoLine(this.contourPs[i], this.contourPs[i + 1])
    }

    this.wingsPen = wingsPen
  }

  setupWingPoints() {
    this.wingPoints = []
    this.wingTs = [
      -PI / 4 + random(-PI / 12, PI / 12),
      PI / 4 + random(-PI / 12, PI / 12),
    ]

    const wingH = this.h * 0.43
    const wingW = wingH

    const p1 = { x: wingW * 0.5, y: 0 }
    const cp1 = { x: wingW * 0.5, y: -wingH * 0.25 }
    const cp2 = { x: wingW * 0.5, y: -wingH * 0.9 }
    const p2 = { x: 0, y: -wingH }

    this.rsPs = []
    this.lsPs = []

    for (let i = 0; i < 14; i++) {
      const dt = map(i, 0, 13, 0, 1)

      const dxp = bezierPoint(p1.x, cp1.x, cp2.x, p2.x, dt)
      const dxn = bezierPoint(-p1.x, -cp1.x, -cp2.x, -p2.x, dt)
      const dy = bezierPoint(p1.y, cp1.y, cp2.y, p2.y, dt)

      const rV = createVector(dxp, dy)
      this.wingPoints.push(rV)
      this.rsPs.push(rV)

      if (i < 13) {
        const lV = createVector(dxn, dy)
        this.wingPoints.push(lV)
        this.lsPs.unshift(lV)
      }
    }

    this.contourPs = [...this.rsPs, ...this.lsPs]
  }

  setupStripes() {
    const stripesPen = new Pen(palette.beePalette.stripes)
    stripesPen.setSW(penSW * 4.938)

    const dx = this.w * 0.1425
    const dy = this.h * 0.375
    const dxp = random(0.885, 1.08)
    const dyp = random(0.85, 0.925)

    let stripeTop = createVector(-dx * dxp, -dy * dyp * 0.96)
    let stripeBot = createVector(-dx * dxp, dy * dyp)
    stripesPen.memoLine(stripeTop, stripeBot, 0.02, 0.65)

    stripeTop = createVector(dx * dxp, -dy * dyp * 0.96)
    stripeBot = createVector(dx * dxp, dy * dyp)
    stripesPen.memoLine(stripeTop, stripeBot, 0.02, 0.65)

    this.stripesPen = stripesPen
  }

  setupStinger() {
    const sW = this.h * 0.28
    const sH = this.w * 0.245

    const p1 = createVector(sW * 0.5, 0)
    const p2 = createVector(0, -sH)
    const p3 = createVector(-sW * 0.5, 0)

    this.stingerPoints = []
    for (let i = 0; i < 14; i++) {
      const dt = map(i, 0, 13, 0, 1)

      const dp = p5.Vector.lerp(p1, p2, dt)
      this.stingerPoints.push(dp)

      if (i < 13) {
        const np = p5.Vector.lerp(p3, p2, dt)
        this.stingerPoints.push(np)
      }
    }

    const stingerPen = new Pen(palette.beePalette.stripes)
    stingerPen.setSW(penSW * 2.428)

    for (let i = 0; i < this.stingerPoints.length - 1; i++) {
      stingerPen.memoLine(
        this.stingerPoints[i],
        this.stingerPoints[i + 1],
        0.1,
        0.15,
      )
    }

    this.stingerPen = stingerPen
  }

  *draw(cnv, deleteFromCnvs = []) {
    cnv.push()
    cnv.translate(this.pos.x, this.pos.y)
    cnv.rotate(this.t)

    for (let j = 0; j < deleteFromCnvs.length; j++) {
      const dC = deleteFromCnvs[j]
      dC.push()
      dC.translate(this.pos.x, this.pos.y)
      dC.rotate(this.t)
    }

    for (const _ of this.drawBody(cnv)) {
      yield 2
    }

    for (const _ of this.drawWings(cnv, deleteFromCnvs)) {
      yield 0
    }

    for (const _ of this.drawStinger(cnv)) {
      yield 1
    }

    for (const _ of this.drawStripes(cnv)) {
      yield 3
    }

    cnv.pop()

    for (let j = 0; j < deleteFromCnvs.length; j++) {
      deleteFromCnvs[j].pop()
    }
  }

  *drawBody(cnv) {
    for (const _ of this.bodyPen.drawMemoedFigure(cnv)) {
      yield 0
    }

    this.bodyPen.setColor(palette.beePalette.stripes)
    for (const _ of this.bodyPen.drawMemoed(cnv)) {
      yield 1
    }
  }

  *drawWings(cnv, deleteFromCnvs = []) {
    cnv.push()
    cnv.translate(0, -this.h * 0.405)

    for (let j = 0; j < deleteFromCnvs.length; j++) {
      const dC = deleteFromCnvs[j]
      dC.push()
      dC.translate(0, -this.h * 0.405)
    }

    for (let i = 0; i < 2; i++) {
      const t = this.wingTs[i]
      const dx = this.w * 0.084 * (i % 2 ? 1 : -1)

      cnv.push()
      cnv.translate(dx, 0)
      cnv.rotate(t)

      cnv.erase()
      cnv.push()
      cnv.fill(palette.beePalette.body)
      cnv.beginShape()
      for (let j = 0; j < this.contourPs.length; j++) {
        const cp = this.contourPs[j]
        cnv.vertex(cp.x, cp.y)
      }
      cnv.endShape(CLOSE)
      cnv.pop()
      cnv.noErase()

      for (let j = 0; j < deleteFromCnvs.length; j++) {
        const deleteCnv = deleteFromCnvs[j]
        deleteCnv.push()
        deleteCnv.translate(dx, 0)
        deleteCnv.rotate(t)

        deleteCnv.erase()
        deleteCnv.push()
        deleteCnv.fill(palette.beePalette.body)
        deleteCnv.beginShape()
        for (let k = 0; k < this.contourPs.length; k++) {
          const cp = this.contourPs[k]
          deleteCnv.vertex(cp.x, cp.y)
        }
        deleteCnv.endShape(CLOSE)
        deleteCnv.pop()
        deleteCnv.noErase()

        deleteCnv.pop()
      }

      for (const _ of this.wingsPen.drawMemoed(cnv)) {
        yield 0
      }

      cnv.pop()
    }

    for (let j = 0; j < deleteFromCnvs.length; j++) {
      deleteFromCnvs[j].pop()
    }

    cnv.pop()
  }

  *drawStinger(cnv) {
    cnv.push()
    cnv.translate(-this.w * 0.45, 0)
    cnv.rotate(-PI / 2)

    for (const _ of this.stingerPen.drawMemoed(cnv)) {
      yield 0
    }

    cnv.pop()
  }

  *drawStripes(cnv) {
    for (const _ of this.stripesPen.drawMemoed(cnv)) {
      yield 0
    }
  }
}

class Catarina extends Criatura {
  constructor(x, y, t, w, h) {
    super(x, y, t, w, h)
  }

  setupBody() {
    const bodyPen = new OvalPen(
      this.w * 0.78,
      this.h * 0.78,
      palette.ladyPalette.body,
    )
    bodyPen.setSW(penSW * 3.1)
    bodyPen.setAcc(0.75 + 0.45)
    bodyPen.setDensity(random(0.25, 0.45))
    bodyPen.memoDisplay()

    const de = random(0.3895, 0.4195)
    bodyPen.setSW(penSW * 3.18)
    bodyPen.memoEllipse(
      {
        x: random(-this.w * 0.018, this.w * 0.018),
        y: random(-this.h * 0.018, this.h * 0.018),
      },
      this.w * de,
      this.h * de,
      0.18,
      0.2,
    )
    bodyPen.memoLine(
      createVector(-this.w * 0.45, 0),
      createVector(this.w * 0.45, 0),
      0.18,
      0.2,
    )

    this.bodyPen = bodyPen

    this.setupHead()
    this.setupDots()
  }

  setupHead() {
    const headPen = new OvalPen(
      this.w * 0.425,
      this.w * 0.425,
      palette.ladyPalette.dots,
    )
    headPen.setSW(penSW * 2.8)
    headPen.setAcc(0.75 + 0.45)
    headPen.setDensity(random(0.25, 0.45))
    headPen.memoDisplay()
    headPen.setSW(penSW * 1.9)
    headPen.memoEllipse(
      {
        x: random(-headPen.rx * 0.1, headPen.rx * 0.1),
        y: random(-headPen.ry * 0.1, headPen.ry * 0.1),
      },
      headPen.rx * 0.5,
      headPen.ry * 0.5,
      0.18,
      0.2,
    )
    this.headPen = headPen

    const p1 = { x: 0, y: 0 }
    const cp1 = { x: 0, y: -this.h * 0.05 }
    const cp2 = { x: this.w * 0.2, y: -this.h * random(-0.1, 0.1) }
    const p2 = { x: this.w * 0.34, y: -this.h * random(0.18, 0.24) }

    const antenaBezierX = (dt, isLeft = false) => {
      return bezierPoint(
        p1.x * (isLeft ? -1 : 1),
        cp1.x * (isLeft ? -1 : 1),
        cp2.x * (isLeft ? -1 : 1),
        p2.x * (isLeft ? -1 : 1),
        dt,
      )
    }

    const leftAntenaPs = []
    const rightAntenaPs = []
    for (let i = 0; i < 9; i++) {
      const dt = map(i, 0, 8, 0, 1)

      const dxp = antenaBezierX(dt)
      const dxn = antenaBezierX(dt, true)
      const dy = bezierPoint(p1.y, cp1.y, cp2.y, p2.y, dt)

      const lV = createVector(dxn, dy)
      leftAntenaPs.push(lV)
      const rV = createVector(dxp, dy)
      rightAntenaPs.push(rV)
    }

    const antenaSW = penSW * 2.58
    const leftAntenaPen = new Pen(palette.ladyPalette.dots)
    leftAntenaPen.setSW(antenaSW)
    for (let i = 0; i < leftAntenaPs.length - 1; i++) {
      const cP = leftAntenaPs[i]
      const nP = leftAntenaPs[i + 1]
      leftAntenaPen.memoLine(cP, nP, 0.1)
    }
    this.leftAntenaPen = leftAntenaPen

    const rightAntenaPen = new Pen(palette.ladyPalette.dots)
    rightAntenaPen.setSW(antenaSW)
    for (let i = 0; i < rightAntenaPs.length - 1; i++) {
      const cP = rightAntenaPs[i]
      const nP = rightAntenaPs[i + 1]
      rightAntenaPen.memoLine(cP, nP, 0.1)
    }
    this.rightAntenaPen = rightAntenaPen
  }

  setupDots() {
    const dR = random(this.w * 0.0024, this.w * 0.003)
    const nD = random([
      ...Array(10).fill(3),
      ...Array(20).fill(5),
      ...Array(6).fill(6),
    ])

    const dots = []
    for (let i = 0; i < nD; i++) {
      const dw = this.w * 0.3905
      const dotX = constrain(randomGaussian(0, dw * 0.9), -dw, dw)
      const dotYP = constrain(
        randomGaussian(this.h * 0.2, this.h * 0.495),
        -this.h * 0.102,
        this.h * 0.3485,
      )
      const dotYN = -dotYP

      dots.push(
        ...[
          { x: dotX, y: dotYP },
          { x: dotX, y: dotYN },
        ],
      )
    }
    this.dots = dots

    const dotsPen = new OvalPen(dR, dR, palette.ladyPalette.dots)
    dotsPen.setSW(penSW * 0.62)
    dotsPen.setDensity(random(0.25, 0.45))
    dotsPen.memoDisplay()
    this.dotsPen = dotsPen
  }

  *draw(cnv) {
    cnv.push()
    cnv.translate(this.pos.x, this.pos.y)
    cnv.rotate(this.t)

    for (const _ of this.drawHead(cnv)) {
      yield 0
    }

    for (const _ of this.drawBody(cnv)) {
      yield 1
    }

    for (const _ of this.drawDots(cnv)) {
      yield 2
    }

    cnv.pop()
  }

  *drawBody(cnv) {
    for (const _ of this.bodyPen.drawMemoedFigure(cnv)) {
      yield 0
    }

    this.bodyPen.setColor(palette.ladyPalette.dots)
    for (const _ of this.bodyPen.drawMemoed(cnv)) {
      yield 1
    }
  }

  *drawDots(cnv) {
    cnv.push()

    cnv.beginClip()
    cnv.push()
    cnv.beginShape()
    cnv.fill(palette.ladyPalette.dots)

    for (let i = 0; i < this.bodyPen.memoed.length; i++) {
      const line = this.bodyPen.memoed[i]

      for (let j = 0; j < line.length; j += 3) {
        cnv.vertex(line[j], line[j + 1])
      }
    }

    cnv.endShape(CLOSE)
    cnv.pop()
    cnv.endClip()

    for (let i = 0; i < this.dots.length; i++) {
      const { x, y } = this.dots[i]
      cnv.push()
      cnv.translate(x, y)

      for (const _ of this.dotsPen.drawMemoedFigure(cnv)) {
        yield 0
      }

      cnv.pop()
    }

    cnv.pop()
  }

  *drawHead(cnv) {
    cnv.push()
    cnv.translate(this.w * 0.39, 0)

    // Left antena
    const antenaDx = this.w * 0.16
    const antenaDy = this.h * 0.0425
    cnv.push()
    cnv.translate(antenaDx, -antenaDy)
    cnv.rotate(PI / 2)

    for (const _ of this.leftAntenaPen.drawMemoed(cnv)) {
      yield 0
    }
    cnv.pop()

    // Right antena
    cnv.push()
    cnv.translate(antenaDx, antenaDy)
    cnv.rotate(PI / 2)

    for (const _ of this.rightAntenaPen.drawMemoed(cnv)) {
      yield 1
    }
    cnv.pop()

    for (const _ of this.headPen.drawMemoedFigure(cnv)) {
      yield 2
    }

    this.headPen.setColor(color(palette.penColor))
    for (const _ of this.headPen.drawMemoed(cnv)) {
      yield 3
    }

    cnv.pop()
  }
}

class Polilla extends Criatura {
  constructor(x, y, t, w, h) {
    super(x, y, t, w, h)
  }

  setupBody() {
    const bodyPen = new OvalPen(
      this.w * 0.35,
      this.h * 0.4,
      palette.mothPalette.body,
    )
    const abdomenPen = new OvalPen(
      this.w * 0.5,
      this.h * 0.135,
      palette.mothPalette.body,
    )
    const headPen = new OvalPen(
      this.w * 0.105,
      this.h * 0.105,
      palette.mothPalette.body,
    )

    Array.from([bodyPen, abdomenPen, headPen]).forEach((pen) => {
      pen.setSW(penSW * 1.21)
      pen.setAcc(2)
      pen.setDensity(random(0.15, 0.25))
      pen.memoDisplay()

      pen.setSW(penSW * 2.68)
    })
    bodyPen.memoEllipse(
      {
        x: random(-bodyPen.rx * 0.1, bodyPen.rx * 0.1),
        y: random(-bodyPen.ry * 0.1, bodyPen.ry * 0.1),
      },
      bodyPen.rx * 0.56,
      bodyPen.ry * 0.56,
      0.18,
      0.2,
    )

    abdomenPen.memoEllipse(
      {
        x: random(-abdomenPen.rx * 0.1, abdomenPen.rx * 0.1),
        y: random(-abdomenPen.ry * 0.1, abdomenPen.ry * 0.1),
      },
      abdomenPen.rx * 0.79,
      abdomenPen.ry * 0.975,
      0.18,
      0.2,
    )

    headPen.memoEllipse(
      {
        x: random(-headPen.rx * 0.1, headPen.rx * 0.1),
        y: random(-headPen.ry * 0.1, headPen.ry * 0.1),
      },
      headPen.rx * 0.9,
      headPen.ry * 0.9,
      0.18,
      0.2,
    )

    this.bodyPen = bodyPen
    this.abdomenPen = abdomenPen
    this.headPen = headPen

    this.setupAntenas()
    this.setupForewings()
  }

  setupAntenas() {
    const p1 = { x: 0, y: 0 }
    const cp1 = { x: this.w * random(0.05, 0.2), y: 0 }
    const cp2 = { x: this.w * random(0.05, 0.25), y: -this.h * 0.15 }
    const p2 = { x: this.w * 0.25, y: -this.h * 0.2 }
    const antenaBezierX = (dt, isLeft = false) => {
      const s = isLeft ? -1 : 1
      return bezierPoint(p1.x * s, cp1.x * s, cp2.x * s, p2.x * s, dt)
    }

    const leftAntenaPs = []
    const rightAntenaPs = []
    for (let i = 0; i < 9; i++) {
      const dt = map(i, 0, 8, 0, 1)

      const dxp = antenaBezierX(dt)
      const dxn = antenaBezierX(dt, true)
      const dy = bezierPoint(p1.y, cp1.y, cp2.y, p2.y, dt)

      const lV = createVector(dxn, dy)
      leftAntenaPs.push(lV)
      const rV = createVector(dxp, dy)
      rightAntenaPs.push(rV)
    }

    const antenaSW = penSW * 2.58
    const leftAntenaPen = new Pen(palette.mothPalette.wings)
    leftAntenaPen.setSW(antenaSW)
    for (let i = 0; i < leftAntenaPs.length - 1; i++) {
      const cP = leftAntenaPs[i]
      const nP = leftAntenaPs[i + 1]
      leftAntenaPen.memoLine(cP, nP, 0.1)
    }
    this.leftAntenaPen = leftAntenaPen

    const rightAntenaPen = new Pen(palette.mothPalette.wings)
    rightAntenaPen.setSW(antenaSW)
    for (let i = 0; i < rightAntenaPs.length - 1; i++) {
      const cP = rightAntenaPs[i]
      const nP = rightAntenaPs[i + 1]
      rightAntenaPen.memoLine(cP, nP, 0.1)
    }
    this.rightAntenaPen = rightAntenaPen
  }

  setupForewings() {
    const p1 = { x: 0, y: 0 }
    const p2 = { x: this.w * 0.405, y: this.h * 0.25 }
    const p3 = { x: this.w * 0.285, y: this.h * 0.305 }
    const p4 = { x: 0, y: this.h * 0.165 }
    const cps = [
      { x: this.w * 0.4, y: this.h * 0.1 },
      { x: this.w * 0.545, y: this.h * 0.165 },
      { x: this.w * 0.38, y: this.h * 0.25 },
      { x: this.w * 0.355, y: this.h * 0.29 },
      { x: this.w * 0.235, y: this.h * 0.305 },
      { x: this.w * 0.05, y: this.h * 0.175 },
    ]

    // I don't want to mess up the points but I want bigger wings
    Array.from([p1, p2, p3, p4, ...cps]).forEach((p) => {
      p.x *= 1.82
      p.y *= 1.82
    })

    const bezierPointAt = (fp, fcp, scp, sp, dt) => {
      const x = bezierPoint(fp.x, fcp.x, scp.x, sp.x, dt)
      const y = bezierPoint(fp.y, fcp.y, scp.y, sp.y, dt)

      return { x, y }
    }

    const fwFB = (dt) => bezierPointAt(p1, cps[0], cps[1], p2, dt)
    const swFB = (dt) => bezierPointAt(p2, cps[2], cps[3], p3, dt)
    const twFB = (dt) => bezierPointAt(p3, cps[4], cps[5], p4, dt)

    this.leftWingPs = []
    this.rightWingPs = []
    for (let i = 0; i < 40; i++) {
      let bF, dT
      const di = map(i, 0, 40, 0, 1)
      if (di < 0.4) {
        bF = fwFB
        dT = map(di, 0, 0.4, 0, 1)
      } else if (di < 0.55) {
        bF = swFB
        dT = map(di, 0.4, 0.55, 0, 1)
      } else {
        bF = twFB
        dT = map(di, 0.55, 1, 0, 1)
      }

      const p = bF(dT)
      this.rightWingPs.push(p)
      this.leftWingPs.push({ ...p, x: p.x * -1 })
    }

    const leftWingPen = new Pen(palette.mothPalette.wings)
    leftWingPen.setSW(penSW * 3.15)
    for (let i = 0; i < this.leftWingPs.length - 1; i++) {
      const p = this.leftWingPs[i]
      const np = this.leftWingPs[i + 1]
      leftWingPen.memoLine(p, np, 0.1)
    }

    const rightWingPen = new Pen(palette.mothPalette.wings)
    rightWingPen.setSW(penSW * 3.15)
    for (let i = 0; i < this.rightWingPs.length - 1; i++) {
      const p = this.rightWingPs[i]
      const np = this.rightWingPs[i + 1]
      rightWingPen.memoLine(p, np, 0.1)
    }

    this.leftWingPen = leftWingPen
    this.rightWingPen = rightWingPen
  }

  *draw(cnv, deleteFromCnvs) {
    cnv.push()
    cnv.translate(this.pos.x, this.pos.y)
    cnv.rotate(this.t)

    for (let i = 0; i < deleteFromCnvs.length; i++) {
      const dCnv = deleteFromCnvs[i]
      dCnv.push()
      dCnv.translate(this.pos.x, this.pos.y)
      dCnv.rotate(this.t)
    }

    for (const _ of this.drawHead(cnv)) {
      yield 0
    }

    for (const _ of this.drawBody(cnv)) {
      yield 1
    }

    for (const _ of this.drawWings(cnv, deleteFromCnvs)) {
      yield 2
    }

    cnv.pop()

    for (let i = 0; i < deleteFromCnvs.length; i++) {
      deleteFromCnvs[i].pop()
    }
  }

  *drawHead(cnv) {
    cnv.push()
    cnv.translate(this.w * 0.374, 0)

    const antenaDx = this.w * 0.08
    const antenaDy = this.h * 0.0387
    cnv.push()
    cnv.translate(antenaDx, -antenaDy)
    cnv.rotate(PI / 2)

    for (const _ of this.leftAntenaPen.drawMemoed(cnv)) {
      yield 0
    }
    cnv.pop()

    cnv.push()
    cnv.translate(antenaDx, antenaDy)
    cnv.rotate(PI / 2)

    for (const _ of this.rightAntenaPen.drawMemoed(cnv)) {
      yield 0
    }
    cnv.pop()

    for (const _ of this.headPen.drawMemoedFigure(cnv)) {
      yield 2
    }
    this.headPen.setColor(color(palette.penColor))
    for (const _ of this.headPen.drawMemoed(cnv)) {
      yield 3
    }

    cnv.pop()
  }

  *drawBody(cnv) {
    cnv.push()
    cnv.translate(-this.w * 0.25, 0)
    for (const _ of this.abdomenPen.drawMemoedFigure(cnv)) {
      yield 2
    }
    this.abdomenPen.setColor(color(palette.penColor))
    for (const _ of this.abdomenPen.drawMemoed(cnv)) {
      yield 3
    }
    cnv.pop()

    cnv.push()
    cnv.translate(this.w * 0.1, 0)
    for (const _ of this.bodyPen.drawMemoedFigure(cnv)) {
      yield 0
    }
    this.bodyPen.setColor(color(palette.penColor))
    for (const _ of this.bodyPen.drawMemoed(cnv)) {
      yield 1
    }
    cnv.pop()
  }

  *drawWings(cnv, deleteFromCnvs) {
    cnv.push()
    cnv.translate(-this.w * 0.038, 0)

    // Erase left wing
    for (let i = 0; i < deleteFromCnvs.length; i++) {
      const dCnv = deleteFromCnvs[i]
      dCnv.push()
      dCnv.translate(-this.w * 0.038, 0)

      dCnv.push()
      dCnv.translate(0, -this.h * 0.185)
      dCnv.rotate(PI / 2 - PI / 5.5)

      dCnv.erase()
      dCnv.push()
      dCnv.fill(palette.mothPalette.body)
      dCnv.beginShape()
      for (let j = 0; j < this.leftWingPs.length; j++) {
        const wp = this.leftWingPs[j]
        dCnv.vertex(wp.x, wp.y)
      }
      dCnv.endShape(CLOSE)
      dCnv.pop()
      dCnv.noErase()

      dCnv.pop()
    }

    cnv.push()
    cnv.translate(0, -this.h * 0.185)
    cnv.rotate(PI / 2 - PI / 5.5)

    for (const _ of this.leftWingPen.drawMemoed(cnv)) {
      yield 0
    }
    cnv.pop()

    // Erase right wing
    for (let i = 0; i < deleteFromCnvs.length; i++) {
      const dCnv = deleteFromCnvs[i]
      dCnv.push()
      dCnv.translate(0, this.h * 0.185)
      dCnv.rotate(PI / 2 + PI / 5.5)

      dCnv.erase()
      dCnv.push()
      dCnv.fill(palette.mothPalette.body)
      dCnv.beginShape()
      for (let j = 0; j < this.rightWingPs.length; j++) {
        const wp = this.rightWingPs[j]
        dCnv.vertex(wp.x, wp.y)
      }
      dCnv.endShape(CLOSE)
      dCnv.pop()
      dCnv.noErase()

      dCnv.pop()
      dCnv.pop()
    }

    cnv.push()
    cnv.translate(0, this.h * 0.185)
    cnv.rotate(PI / 2 + PI / 5.5)

    for (const _ of this.rightWingPen.drawMemoed(cnv)) {
      yield 1
    }
    cnv.pop()

    cnv.pop()
  }
}

class CriaturasConstrains {
  constructor(map) {
    this.map = map

    this.criaturaClassMap = {
      [CriaturaType.abeja]: Abejita,
      [CriaturaType.catarina]: Catarina,
      [CriaturaType.polilla]: Polilla,
    }
  }

  shouldPlaceWConstrains(x, y, type) {
    if (
      x < displayMarginX[0] ||
      x > displayMarginX[1] ||
      y < displayMarginY[0] ||
      y > displayMarginY[1]
    ) {
      return false
    }

    const i = floor(x / this.map.xRes)
    const j = floor(y / this.map.yRes)
    if (type === CriaturaType.catarina) {
      const h = this.map.hMap[i][j]
      return h > WATER_NOISE_LIMIT
    }

    return true
  }

  birthCreature(type, x, y, t, w, h) {
    let aT = t
    let aH = h

    if (type === CriaturaType.catarina) {
      aT += PI
      aH = w * random(0.89, 0.96)
    } else if (type === CriaturaType.polilla) {
      aH = w * random(1.179, 1.235)
    }

    return new this.criaturaClassMap[type](x, y, aT, w, aH)
  }
}
