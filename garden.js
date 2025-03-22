class GardenController {
  constructor() {
    this.setupType()
  }

  setupType() {
    this.type = gardenType
    console.log(`💐 tipo de jardín: `, this.type)

    switch (this.type) {
      case GardenType.parque:
        this.setupParque()
        break
      case GardenType.anillado:
        this.setupAnillado()
        break
      case GardenType.duo:
        this.setupDuo()
        break
    }
  }

  setupParque() {
    const possibleFlowerTypes = shuffle([
      FlowerType.basic,
      FlowerType.basic,
      FlowerType.basic,
      FlowerType.daisy,
      FlowerType.daisy,
      FlowerType.daisy,
      FlowerType.daisy,
      FlowerType.cempa,
      FlowerType.cempa,
      FlowerType.gladioli,
      FlowerType.gladioli,
      FlowerType.tulip,
      FlowerType.tulip,
      FlowerType.tulip,
      FlowerType.cactus,
      FlowerType.violet,
      FlowerType.violet,
      FlowerType.peony,
      FlowerType.peony,
    ])

    this.noiseFlowerType = (x, y) => {
      const i = floor(x / mapController.xRes)
      const j = floor(y / mapController.yRes)

      if (
        i < 0 ||
        i >= mapController.cols ||
        j < 0 ||
        j >= mapController.rows
      ) {
        return null
      }

      const fi = floor(
        map(mapController.hMap[i][j], 0, 1, 0, possibleFlowerTypes.length),
      )

      return possibleFlowerTypes[fi]
    }
  }

  setupAnillado() {
    const anilladoX = random(W * 0.1, W * 0.9)
    const anilladoY = random(H * 0.1, H * 0.9)

    const minR = random(xRes * 9, xRes * 35)
    const maxR = random(W * 0.5, W * 1.2)
    this.anilloW = random(xRes * 25, xRes * 40)
    const anilloM = this.anilloW * random(0.47, 0.785)
    const nAnillos = random([1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 6])

    let currentAnillo = 0
    let currentR = minR
    const anillos = []
    while (currentAnillo < nAnillos && currentR < maxR) {
      const flowerType = random([
        FlowerType.daisy,
        FlowerType.daisy,
        FlowerType.daisy,
        FlowerType.daisy,
        FlowerType.cempa,
        FlowerType.cempa,
        FlowerType.gladioli,
        FlowerType.tulip,
        FlowerType.tulip,
        FlowerType.cactus,
        FlowerType.violet,
        FlowerType.violet,
        FlowerType.peony,
        FlowerType.peony,
      ])

      anillos.push({
        flowerType,
        r: currentR,
        x: anilladoX,
        y: anilladoY,
      })

      currentR += this.anilloW + anilloM
      currentAnillo++
    }

    console.log(`💐 número de anillos: `, anillos.length)
    let aS = ``
    anillos.forEach(
      (a, i) =>
        (aS += `${a.flowerType}${i === anillos.length - 1 ? '.' : ', '}`),
    )
    console.log(`💐 tipos de flores en anillos: `, aS)

    this.anillos = anillos

    this.noiseFlowerType = (x, y) => {
      let flowerType = FlowerType.basic

      this.anillos.forEach((a) => {
        const dr = sq(x - a.x) + sq(y - a.y)
        const outerR = a.r + this.anilloW

        if (dr > a.r * a.r && dr <= outerR * outerR) {
          flowerType = a.flowerType
          return
        }
      })

      return flowerType
    }
  }

  setupDuo() {
    const possibleFlowerTypes = shuffle([
      ...Array(10).fill(FlowerType.basic),
      ...Array(12).fill(FlowerType.daisy),
      ...Array(7).fill(FlowerType.cempa),
      FlowerType.gladioli,
      FlowerType.gladioli,
      FlowerType.tulip,
      FlowerType.tulip,
      FlowerType.tulip,
      FlowerType.cactus,
      FlowerType.violet,
      FlowerType.violet,
      FlowerType.peony,
      FlowerType.peony,
    ])
    const duoTypes = new Set()

    while (duoTypes.size < 2) {
      const nextTypeIdx = floor(random(possibleFlowerTypes.length))
      duoTypes.add(possibleFlowerTypes[nextTypeIdx])
    }

    this.finalTypes = shuffle([
      ...Array.from(duoTypes),
      ...Array.from(duoTypes),
      ...Array.from(duoTypes),
    ])

    let dS = ``
    Array.from(duoTypes).forEach(
      (t, i) => (dS += `${t}${i === 1 ? '.' : ', '}`),
    )
    console.log(`💐 tipos duo: `, dS)

    this.noiseFlowerType = (x, y) => {
      const i = floor(x / mapController.xRes)
      const j = floor(y / mapController.yRes)

      if (
        i < 0 ||
        i >= mapController.cols ||
        j < 0 ||
        j >= mapController.rows
      ) {
        return null
      }

      const fi = floor(
        map(mapController.hMap[i][j], 0, 1, 0, this.finalTypes.length),
      )

      return this.finalTypes[fi]
    }
  }
}
