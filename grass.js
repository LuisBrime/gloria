class GrassController {
  constructor() {
    this.grass = []
    this.grassParams = []
    this.grassSW = xRes * 1.25
  }

  addGrass(x, y, t, outlined) {
    const i = floor(x / mapController.xRes)
    const j = floor(y / mapController.yRes)
    this.grassParams.push({
      x,
      y,
      i,
      j,
      t,
      outlined,
      c: color(random(palette.grassPalette)),
      dir: random([-1, 1]),
    })
  }

  setupGrass() {
    for (let i = 0; i < this.grassParams.length; i++) {
      const gp = this.grassParams[i]
      const h = mapController.hMap[gp.i][gp.j]
      const minL = Math.max(
        xRes * 0.05,
        map(h, 0.305, 1, xRes * 0.275, xRes * 0.105)
      )
      const maxL = map(h, 0.305, 1, xRes * 0.885, xRes * 1.215)

      this.grass.push(
        new Grass(
          gp.x,
          gp.y,
          gp.t,
          gp.c,
          this.grassSW,
          gp.outlined,
          gp.dir,
          minL,
          maxL,
        ),
      )
    }

    // Cleanup
    this.grassParams = [];
  }

  *draw(cnv) {
    const yieldBatch = Math.max(10, Math.floor(this.grass.length / 30))

    cnv.push()
    for (let i = 0; i < this.grass.length; i++) {
      if (i !== 0 && i % yieldBatch === 0) yield 0
      this.grass[i].display(cnv)
    }
    cnv.pop()

    // Cleanup
    this.grass = []
  }
}

class Grass {
  constructor(
    x,
    y,
    t,
    c,
    sW = 3,
    outlined = false,
    dir = 1,
    minL = xRes * 0.05,
    maxL = xRes * 0.95,
  ) {
    this.p = { x, y }
    this.t = t
    this.c = c
    this.sW = sW
    this.outlined = outlined
    this.minL = minL
    this.maxL = maxL

    if (dir > 0) {
      this.tRate = random(1.025, 1.085)
    } else {
      this.tRate = random(0.915, 0.975)
    }

    this.dTRate = random(0.95, 1.05)

    const { x: ogX, y: ogY } = pointToOG(this.p.x, this.p.y)
    this.initialTNoise = noisex.simplex2(
      ogX * noiseScale * 2,
      ogY * noiseScale * 2,
    )
    this.initialT = map(
      this.initialTNoise,
      -1,
      1,
      -this.t * 0.25,
      this.t * 0.25,
    )

    this.setupPens()
  }

  setupPens() {
    this.pens = []

    const lmt = Math.max(xRes * 0.025, this.minL)
    for (let l = this.maxL; l > lmt; l *= 0.85) {
      const swn = map(l, this.minL, this.maxL, 0, 1)
      const sw = lerp(this.sW * 0.03, this.sW, swn)

      const p = { pen: new RectPen(sw, l, this.c) }
      if (!this.outlined) {
        const borderPen = new Pen(palette.penColor)
        p.borderPen = borderPen
      }

      this.pens.push(p)
    }

    this.pens.forEach(({ pen: p, borderPen }, i, a) => {
      // Pre calculate points for the pen
      const hw = p.w * 0.5
      const l = p.h

      const ll = [{x: -hw, y: 0}, {x: -hw, y: -l}]
      const rl = [{x: hw, y: 0}, {x: hw, y: -l}]
      if (this.outlined) {
        p.setSW(penSW * 0.194 * (a.length - i))
        p.memoLine(ll[0], ll[1], 0.105)
        p.memoLine(rl[0], rl[1], 0.105)
      } else {
        p.setAcc(0.45 + 0.25 * (a.length - i))
        p.setDensity(0.915)
        p.setSW(penSW * 0.0589 * (a.length - i))
        p.memoDisplay()

        borderPen.setSW(penSW * 0.148 * (a.length - i))
        borderPen.memoLine(ll[0], ll[1], 0.215)
        borderPen.memoLine(rl[0], rl[1], 0.215)
      }
    })
  }

  display(cnv) {
    cnv.push()
    cnv.translate(this.p.x, this.p.y)
    cnv.rotate(this.t)

    cnv.erase()
    this.drawPenGrassito(cnv, this.initialT, this.tRate, 0, true)
    cnv.noErase()

    this.drawPenGrassito(cnv, this.initialT, this.tRate)
    cnv.pop()
  }

  drawPenGrassito(cnv, t, dt, pi = 0, filled = false) {
    cnv.push()
    cnv.rotate(t)

    const { pen, borderPen } = this.pens[pi]

    if (borderPen) borderPen.displayMemoed(cnv)

    if (filled) {
      cnv.push()
      cnv.fill(this.c)
      cnv.rectMode(CENTER)
      cnv.rect(0, -pen.h * 0.5, pen.w, pen.h)
      cnv.pop()
    } else {
      if (this.outlined) {
        pen.displayMemoed(cnv)
      } else {
        pen.displayMemoedFigure(cnv)
      }
    }

    cnv.translate(0, -pen.h * (this.outlined ? 0.95 : 0.8))
    if (pi < this.pens.length - 1) {
      this.drawPenGrassito(cnv, t * dt, dt * this.dTRate, pi + 1, filled)
    }

    cnv.pop()
  }
}
