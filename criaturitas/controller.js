class Criaturitas {
  constructor(mapController, flowerQT) {
    this.map = mapController
    this.flowerQT = flowerQT

    this.packer = new Packer(W, H, xRes, yRes, xRes * 3)

    this.criaturas = {
      [CriaturaType.abeja]: [],
      [CriaturaType.catarina]: [],
      [CriaturaType.polilla]: [],
    }
    this.eventRLim = random(0.35, 0.85)
    this.eventHandler = new EventHandler(mapController, flowerQT)

    criaturasCsController = new CriaturasConstrains(mapController)

    this.availableTypes = availableCriaturas
  }

  get totalCriaturas() {
    const nB = this.criaturas[CriaturaType.abeja].length
    const nC = this.criaturas[CriaturaType.catarina].length
    const nP = this.criaturas[CriaturaType.polilla].length
    return nB + nC + nP
  }

  get hasEvents() {
    return this.eventHandler.events.size > 0
  }

  maybeAddCriatura(x, y, w, h) {
    let type = random(this.availableTypes)

    if (!criaturasCsController.shouldPlaceWConstrains(x, y, type)) {
      return false
    }

    const i = floor(x / this.map.xRes)
    const j = floor(y / this.map.yRes)
    const t = this.map.hMapN(i, j).heading() + PI / 2

    const rPE = random()
    const currentEN = this.eventHandler.events.size
    if (
      this.eventHandler.types.length > 0 &&
      rPE - 0.035 * currentEN < this.eventRLim
    ) {
      const added = this.eventHandler.addEvent(x, y, w, h, t, this.packer, type)

      if (added.length <= 0) return false

      this.criaturas[type].push(...added)
      return true
    }

    let added = false

    const c = criaturasCsController.birthCreature(type, x, y, t, w, h)

    if (c.canPack(this.packer)) {
      added = true
      c.pack(this.packer)
      this.criaturas[type].push(c)
    }

    return added
  }

  setupCriaturas() {
    const types = [
      CriaturaType.abeja,
      CriaturaType.catarina,
      CriaturaType.polilla,
    ]
    types.forEach((k) => {
      this.criaturas[k].forEach((criatura) => criatura.setupBody())
    })

    if (this.totalCriaturas > 0) {
      console.log(`🐝 total de criaturas: `, this.totalCriaturas)

      let availableStr = ''
      this.availableTypes.forEach(
        (t, i, a) => (availableStr += `${t}${i === a.length - 1 ? '.' : ', '}`),
      )
      console.log(`🐝 posibles criaturas: `, availableStr)

      this.eventHandler.logEvents()
    }
  }

  *drawAll(cnv, deleteFromCnvs = []) {
    for (const _ of this.drawMoths(cnv, deleteFromCnvs)) {
      yield 0
    }

    for (const _ of this.drawLadies(cnv)) {
      yield 1
    }

    for (const _ of this.drawBees(cnv, deleteFromCnvs)) {
      yield 2
    }
  }

  *drawBees(cnv, deleteFromCnvs = []) {
    const bs = this.criaturas[CriaturaType.abeja]
    for (let i = 0; i < bs.length; i++) {
      for (const _ of bs[i].draw(cnv, deleteFromCnvs)) {
        yield 0
      }
    }
  }

  *drawLadies(cnv) {
    const ladies = this.criaturas[CriaturaType.catarina]
    for (let i = 0; i < ladies.length; i++) {
      for (const _ of ladies[i].draw(cnv)) {
        yield 0
      }
    }
  }

  *drawMoths(cnv, deleteFromCnvs = []) {
    const moths = this.criaturas[CriaturaType.polilla]
    for (let i = 0; i < moths.length; i++) {
      for (const _ of moths[i].draw(cnv, deleteFromCnvs)) {
        yield 0
      }
    }
  }
}
