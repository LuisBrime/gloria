const FlowerSpacingType = {
  near: 'cerca',
  far: 'no tan cerca',
  whereverYouAre: 'lejillos',
}

const GardenType = {
  parque: 'parque',
  anillado: 'anillado',
  duo: 'dúo',
}

const RiverFlowType = {
  tranquilo: 'tranquilo',
  fluyente: 'fluyente',
  aceptance: 'aceptación',
}

const CriaturaType = {
  abeja: 'abeja',
  catarina: 'catarina',
  polilla: 'polilla',
}

const EventType = {
  flowerDance: 'baile a flor',
  parade: 'desfile',
  resting: 'descansando',
}

let flowerSpacingType
let flowerPadding
let reflectionCap

let gardenType
let riverFlowType
let availableCriaturas
let availableEvents

function setupParams() {
  const pR = random()
  let pi
  if (pR < 0.382) {
    // 38.2%
    pi = random([0, 3])
  } else if (pR < 0.698) {
    // 27.4%
    pi = random([1, 2])
  } else if (pR < 0.945) {
    // 18.7%
    pi = random([4, 5])
  } else {
    // 7.1%
    pi = random([6, 7, 8])
  }
  setupPalette(pi)
  console.log(`🎨 paleta de colores: `, palette.name)

  flowerSpacingType = random([
    FlowerSpacingType.near,
    FlowerSpacingType.near,
    FlowerSpacingType.near,
    FlowerSpacingType.near,
    FlowerSpacingType.near,
    FlowerSpacingType.near,
    FlowerSpacingType.near,
    FlowerSpacingType.near,
    FlowerSpacingType.far,
    FlowerSpacingType.far,
    FlowerSpacingType.far,
    FlowerSpacingType.whereverYouAre,
  ])
  switch (flowerSpacingType) {
    case FlowerSpacingType.near:
      flowerPadding = random(xRes * 2, xRes * 3.5)
      reflectionCap = floor(random(12, 19))
      break
    case FlowerSpacingType.far:
      flowerPadding = random(xRes * 5.8, xRes * 8.85)
      reflectionCap = floor(random(7, 12))
      break
    case FlowerSpacingType.whereverYouAre:
      flowerPadding = random(xRes * 9, xRes * 13)
      reflectionCap = floor(random(4, 9))
      break
  }

  let gR = random()
  if (gR < 0.431) {
    gardenType = GardenType.parque
  } else if (gR < 0.779) {
    gardenType = GardenType.anillado
  } else {
    gardenType = GardenType.duo
  }

  riverFlowType = RiverFlowType.tranquilo
  const rfR = random()
  if (rfR < 0.125) {
    riverFlowType = RiverFlowType.fluyente
  } else if (rfR < 0.145) {
    riverFlowType = RiverFlowType.aceptance
  }

  availableCriaturas = []
  if (random() < 0.5) availableCriaturas.push(CriaturaType.abeja)
  if (random() < 0.389) availableCriaturas.push(CriaturaType.catarina)
  if (random() < 0.185) availableCriaturas.push(CriaturaType.polilla)

  availableEvents = []
  nCriaturas = 0
  if (random() < 0.35) {
    availableEvents.push(...Array(5).fill(EventType.flowerDance))
    nCriaturas += random([6, 6, 6, 10, 10, 10, 20])
  }
  if (random() < 0.208) {
    availableEvents.push(...Array(2).fill(EventType.parade))
    nCriaturas += random([5, 5, 5, 7, 7, 12])
  }
  if (random() < 0.0915) {
    availableEvents.push(...Array(2).fill(EventType.resting))
    nCriaturas += random([2, 3, 3, 3, 3, 5])
  }

  if (random() < 0.485) {
    const nP = random()
    if (nP < 0.175) {
      nCriaturas += random([10, 10, 10, 10, 10, 11, 15])
    } else if (nP < 0.95) {
      nCriaturas += random([
        ...Array(2).fill(1),
        ...Array(5).fill(2),
        ...Array(3).fill(3),
        ...Array(2).fill(4),
      ])
    } else {
      nCriaturas += 24
    }
  }

  // Create it here to reset seeds after garden config
  // is done.
  gardenController = new GardenController()

  // Reset seed to remain a bit deterministic
  resetSeeds()
}

function resetSeeds() {
  randomSeed(rSeed)
  noiseSeed(nSeed)
  noisex.seed(nSeed)
}
