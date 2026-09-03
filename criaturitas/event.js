class EventHandler {
  constructor(map, flowerQT) {
    this.map = map
    this.flowerQT = flowerQT
    this.events = new Set()

    this.setupTypes()
  }

  setupTypes() {
    // Setup some global values for parade
    this.paradeAmplitude = random(xRes * 5, xRes * 20)
    this.paradePeriod = random(2.1, 5.15)
    this.paradeDx = random(xRes * 9, xRes * 20)

    this.types = availableEvents
  }

  addEvent(x, y, w, h, t, packer, cType) {
    const type = random(this.types)

    let added = []
    if (type === EventType.flowerDance) {
      added = this.flowerDance(x, y, w, h, packer, cType)
    } else if (type === EventType.parade) {
      added = this.parade(x, y, w, h, t, packer, cType)
    } else if (type === EventType.resting) {
      added = this.rest(x, y, w, h, t, packer, cType)
    }

    if (added.length > 0) this.events.add(type)

    return added
  }

  queryNearFlowers(x, y, sw, sh) {
    const ash = sh ?? sw
    const query = new Quad(x - sw * 0.5, y - ash * 0.5, sw, ash)
    return this.flowerQT.query(query, Flowers.FlowerQuadKey)
  }

  closestFlower(x, y, flowerQuery) {
    let currentD = Infinity
    let closest

    flowerQuery.forEach((flower) => {
      const dx = flower.x - x
      const dy = flower.y - y
      const d = dx * dx + dy * dy

      if (d < currentD) {
        closest = flower
        currentD = d
      }
    })

    return closest
  }

  flowerDance(x, y, w, h, packer, cType) {
    const nearFlowers = this.queryNearFlowers(x, y, max(w, h) * 3)
    if (!nearFlowers || nearFlowers.length <= 0) return []

    const closestF = this.closestFlower(x, y, nearFlowers)
    if (!closestF) return []

    const closestV = createVector(closestF.x, closestF.y)
    const nCs = floor(random(4, 9))
    const danceR = map(nCs, 4, 8, w * 1.25, w * 1.95)
    const addedCs = []
    const rDR = random([
      ...Array(20).fill(0),
      ...Array(15).fill(PI / 15),
      ...Array(6).fill(PI / 10),
    ])

    let drPv = 1
    for (let dt = 0; dt < TAU; dt += TAU / nCs) {
      const dp = random(0.885, 1.1)
      const nx = closestV.x + danceR * cos(dt) * dp
      const ny = closestV.y + danceR * sin(dt) * dp

      if (!criaturasCsController.shouldPlaceWConstrains(nx, ny, cType)) {
        continue
      }

      const c = criaturasCsController.birthCreature(cType, nx, ny, 0, w, h)
      c.setT(Math.atan2(closestV.y - c.pos.y, closestV.x - c.pos.x))

      if (c.canPack(packer)) {
        c.pack(packer)
        addedCs.push(c)
      }

      drPv *= -1
    }

    return addedCs
  }

  parade(x, y, w, h, t, packer, cType) {
    const nP = floor(map(this.paradeAmplitude, xRes * 5, xRes * 20, 5, 9))
    const trigF = random([sin, cos])
    const initialT = random() < 0.2 ? 0 : t
    const initialX = x
    const initialY = y

    let addedCs = []

    const rotateParade = (nX, nY) => {
      const dx = nX - initialX
      const dy = nY - initialY
      const cosT = cos(initialT)
      const sinT = sin(initialT)

      return [
        initialX + dx * cosT - dy * sinT,
        initialY + dx * sinT + dy * cosT,
      ]
    }

    for (let i = 0; i < nP; i++) {
      const dt = map(i, 0, nP, 0, TAU)
      const ny = initialY + this.paradeAmplitude * trigF(dt * this.paradePeriod)
      const nx = initialX + this.paradeDx * i

      const [rNx, rNy] = rotateParade(nx, ny)

      if (!criaturasCsController.shouldPlaceWConstrains(rNx, rNy, cType)) {
        continue
      }

      const ci = floor(rNx / this.map.xRes)
      const cj = floor(rNy / this.map.yRes)
      const nT = this.map.hMapN(ci, cj).heading() + PI / 2

      const c = criaturasCsController.birthCreature(cType, rNx, rNy, nT, w, h)

      if (c.canPack(packer)) {
        c.pack(packer)
        addedCs.push(c)
      }
    }

    return addedCs
  }

  rest(x, y, w, h, t, packer, cType) {
    let addedCs = []

    const restingFlowers = this.queryNearFlowers(
      x,
      y,
      random(w * 5, w * 8.5),
      random(h * 5, h * 8.5),
    )
    if (!restingFlowers || restingFlowers.length <= 0) return []

    restingFlowers.forEach((flower) => {
      const cT = flower.t ?? t
      const c = criaturasCsController.birthCreature(
        cType,
        flower.x + w * 0.5 * cos(cT),
        flower.y + h * 0.5 * sin(cT),
        cT,
        w,
        h,
      )

      if (c.canPack(packer)) {
        c.pack(packer)
        addedCs.push(c)
      }
    })

    return addedCs
  }

  logEvents() {
    const nE = this.events.size
    if (nE > 0) {
      let eS = ``
      Array.from(this.events).forEach(
        (e, i) => (eS += `${e}${i === nE - 1 ? '.' : ', '}`),
      )
      console.log(`🐝 eventos de criaturas: `, eS)
    }
  }
}
