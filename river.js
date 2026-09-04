class River {
  constructor(minWaterSize, maxWaterSize) {
    this.minWaterSize = minWaterSize
    this.maxWaterSize = maxWaterSize

    this.packer = new Packer(W, H, xRes * 1.5, yRes * 1.5, xRes * 0.05)

    this.waterDots = []
    this.reflectionTreshold = 0.505
    this.sizeDR = random(0.035, 0.25)

    this.flowType = riverFlowType
    console.log(`🏞️ flujo del río: `, this.flowType)
  }

  maybeAddToRiver(x, y) {
    let currentSize = this.minWaterSize
    let lastValidR = null
    let canAdd = false

    while (currentSize < this.maxWaterSize) {
      const r = currentSize / 2
      const cr = Math.min(r * 0.33, xRes * 0.35)
      canAdd = PackedCircle.canPackCircle(this.packer, x, y, r, cr)

      if (!canAdd && lastValidR === null) return false

      if (!canAdd && lastValidR !== null) {
        const lastCR = Math.min(lastValidR * 0.33, xRes * 0.35)
        const pc = new PackedCircle(x, y, lastValidR, lastCR)

        this.packer.addShape(pc.circles)
        this.waterDots.push({ x, y, r: lastValidR, packed: pc })
        return true
      } else if (canAdd) {
        lastValidR = r
      }

      currentSize *= 1 + this.sizeDR
    }

    if (canAdd && lastValidR !== null) {
      const lastCR = Math.min(lastValidR * 0.33, xRes * 0.35)
      const pc = new PackedCircle(x, y, lastValidR, lastCR)
      this.packer.addShape(pc.circles)
      this.waterDots.push({ x, y, r: lastValidR, packed: pc })
      return true
    }

    return false
  }

  colorWater(flowerQuadTree) {
    this.waterDots.forEach((w) => {
      const xMi = floor(w.x / mapController.xRes)
      const yMi = floor(w.y / mapController.yRes)
      const l = abs(mapController.lMap[xMi][yMi])

      const rCi = floor(map(l, 0, 1, 0, palette.riverPalette.length))
      let c = color(palette.riverPalette[rCi])
      const filled = random() < 0.1345

      const n = mapController.hMap[xMi][yMi]
      const dN = abs((WATER_NOISE_LIMIT * 0.998) - n)
      let isReflection = false
      if (dN < this.reflectionTreshold) {
        const reflectedC = this.getReflectionColor(w, l, filled, flowerQuadTree)
        c = reflectedC ?? c
        isReflection = !!reflectedC
      }

      const pen = new Pen(c)
      pen.setSW(penSW * random(2.5, 3.2))

      let fillColor = null
      if (filled) {
        fillColor = color(c)
        fillColor.setAlpha(alpha(fillColor) - 52)
      }

      Object.assign(w, {
        c,
        pen,
        filled,
        fillColor,
        isReflection,
        t: 0,
      })
    })

    // Sort array leaving reflections at the end
    const reflections = []
    const nonReflections = []
    for (let i = 0; i < this.waterDots.length; i++) {
      const w = this.waterDots[i]
      if (w.isReflection) {
        reflections.push(w)
      } else {
        nonReflections.push(w)
      }
    }
    nonReflections.reverse()
    this.waterDots = nonReflections.concat(reflections)
  }

  getReflectionColor(w, l, filled, flowerQuadTree) {
    if (l < 0.0448) return

    const qs = w.r + this.maxWaterSize * 5
    const quadQuery = new Quad(w.x - qs * 0.5, w.y - qs * 0.5, qs, qs)
    const nearFlowers = flowerQuadTree.query(quadQuery, Flowers.FlowerQuadKey)
    if (!nearFlowers || nearFlowers.length <= 0) return

    const addedReflect = flowerQuadTree.add(w, Flowers.ReflectionQuadKey, false)
    if (!addedReflect) return

    let currentD = Infinity
    let closestFlower
    nearFlowers.forEach((flower) => {
      const dx = flower.x - w.x
      const dy = flower.y - w.y
      const d = dx * dx + dy * dy

      if (d < currentD) {
        closestFlower = flower
        currentD = d
      }
    })
    if (!closestFlower) return

    const sc = closestFlower.c
    const c = color(
      hue(sc),
      saturation(sc),
      lightness(sc),
      map(l, 0, 1, filled ? 84 : 69, filled ? 92 : 81),
    )
    return c
  }

  wrapWater() {
    this.waterDots.forEach((w) => {
      const vertices = []

      for (let t = 0; t <= TAU; t += TAU / 20) {
        const px = w.r * cos(t)
        const py = w.r * sin(t)
        vertices.push({x: px, y: py})
      }

      w.vertices = vertices
    })

    const isFlowing =
      this.flowType === RiverFlowType.fluyente ||
      this.flowType === RiverFlowType.aceptance
    const yFactor = isFlowing ? 0.61 : 0.06

    this.waterDots.forEach((w) => {
      const wx = toOGX(w.x)
      const wy = toOGY(w.y)

      let nVOff = 0
      let dvn = random(15, 500)

      w.vertices.forEach((v) => {
        for (let i = 0; i < 7; i++) {
          const n = detailedNoise.noise(wx + nVOff, wy + nVOff, -1, 1)
          v.x += n * w.r * 0.65
          v.y += n * w.r * yFactor
        }

        nVOff += dvn
      })
    })

    if (isFlowing) {
      this.waterDots.forEach((w) => {
        const i = floor(w.x / mapController.xRes)
        const j = floor(w.y / mapController.yRes)
        let t
        if (this.flowType === RiverFlowType.fluyente) {
          t = mapController.hMapT(i, j)
        } else {
          t = mapController.hMapN(i, j).heading()
        }

        w.vertices.forEach((v) => {
          v.x = v.x * cos(t) - v.y * sin(t)
          v.y = v.y * cos(t) + v.x * sin(t)
        })
      })
    }

    // Pre calc pen points to draw if needed
    this.waterDots.forEach((w) => {
      const { filled, pen, vertices } = w

      if (!filled) {
        for (let i = 0; i < vertices.length; i++) {
          const cv = vertices[i]
          const nv = i === vertices.length - 1 ? vertices[0] : vertices[i + 1]
          pen.memoLine(cv, nv)
        }
      }
    })
  }

  *drawWater(canva) {
    const yieldBatch = Math.max(1, Math.floor(rows * 0.1))

    for (let i = 0; i < this.waterDots.length; i++) {
      if (i !== 0 && i % yieldBatch === 0) yield 0

      const {
        fillColor,
        filled,
        packed,
        pen,
        t,
        vertices,
      } = this.waterDots[i]

      canva.push()
      canva.translate(packed.x, packed.y)
      canva.rotate(t)

      if (filled) {
        canva.beginShape()
        canva.fill(fillColor)
        canva.noStroke()
        canva.curveVertex(vertices[0].x, vertices[0].y)
        for (let j = 0; j < vertices.length; j++) {
          const v = vertices[j]
          canva.curveVertex(v.x, v.y)
        }
        canva.endShape()
      } else {
        pen.displayMemoed(canva)
      }

      canva.pop()
    }

    // cleanup
    this.waterDots = []
  }
}
