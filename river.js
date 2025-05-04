class River {
  constructor(minWaterSize, maxWaterSize) {
    this.minWaterSize = minWaterSize
    this.maxWaterSize = maxWaterSize

    this.packer = new Packer(W, H, xRes * 1.5, yRes * 1.5, xRes * 0.05)

    this.waterDots = []
    this.reflectionTreshold = 0.03505
    this.sizeDR = random(0.035, 0.25)

    this.flowType = riverFlowType
    console.log(`🏞️ flujo del río: `, this.flowType)
  }

  maybeAddToRiver(x, y) {
    let currentSize = this.minWaterSize
    let lastAdded, canAdd

    while (currentSize < this.maxWaterSize) {
      const r = currentSize / 2
      const pc = new PackedCircle(x, y, r, min(r * 0.33, 2))

      canAdd = this.packer.addShape(pc.circles, false)

      if (!canAdd && !lastAdded) return false

      if (!canAdd && lastAdded) {
        this.packer.addShape(pc.circles)
        this.waterDots.push({ x, y, r, packed: lastAdded })
        return true
      } else if (canAdd) {
        lastAdded = pc
      }

      currentSize *= 1 + this.sizeDR
    }

    if (canAdd && lastAdded) {
      this.packer.addShape(lastAdded.circles)
      this.waterDots.push({ x, y, r: lastAdded.r, packed: lastAdded })
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
      const dN = abs(0.38095 - n)
      let isReflection = false
      if (dN < this.reflectionTreshold) {
        const reflectedC = this.getReflectionColor(w, l, filled, flowerQuadTree)
        c = reflectedC ?? c
        isReflection = !!reflectedC
      }

      const pen = new Pen(c)
      pen.setSW(penSW * random(2.5, 3.2))

      Object.assign(w, {
        c,
        pen,
        filled,
        isReflection,
        t: 0,
      })
    })

    // Sort array leaving reflections at the end
    const sortedWaterDots = []
    this.waterDots.forEach((w) => {
      if (w.isReflection) {
        sortedWaterDots.push(w)
      } else {
        sortedWaterDots.unshift(w)
      }
    })
    this.waterDots = sortedWaterDots
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
        vertices.push(createVector(px, py))
      }

      w.vertices = vertices
    })

    const isFlowing =
      this.flowType === RiverFlowType.fluyente ||
      this.flowType === RiverFlowType.aceptance

    this.waterDots.forEach((w) => {
      let nVOff = 0
      let dvn = random(15, 500)
      w.vertices.forEach((v) => {
        for (let i = 0; i < 7; i++) {
          const { x: wx, y: wy } = pointToOG(w.x, w.y)
          const n = detailedNoise.noise(wx + nVOff, wy + nVOff, -1, 1)
          v.x += n * w.r * 0.65
          v.y += n * w.r * (isFlowing ? 0.61 : 0.06)
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
    for (let i = 0; i < this.waterDots.length; i++) {
      const { filled, packed, pen, t, vertices } = this.waterDots[i]

      canva.push()
      canva.translate(packed.x, packed.y)
      canva.rotate(t)

      if (filled) {
        if (!((i + 1) % (rows * 0.45))) yield 0

        canva.beginShape()
        pen.c.setAlpha(alpha(pen.c) - 52)
        canva.fill(pen.c)
        canva.noStroke()
        canva.curveVertex(vertices[0].x, vertices[0].y)
        for (let j = 0; j < vertices.length; j++) {
          const v = vertices[j]
          canva.curveVertex(v.x, v.y)
        }
        canva.endShape()
      } else {
        for (const _ of pen.drawMemoed(canva, 10)) {
          yield 0
        }
      }

      canva.pop()
    }
  }
}
