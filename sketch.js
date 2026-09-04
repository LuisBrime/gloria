const originalW = 1080
const originalH = 1080
let W
let H
let ratio

const GRID_CELL_RATIO = 0.0035
const MAP_CELL_RATIO = GRID_CELL_RATIO * 8
const FINE_GRID_DIVS = Math.floor(1 / GRID_CELL_RATIO)
const MAP_GRID_DIVS = Math.floor(1 / MAP_CELL_RATIO)
const WATER_NOISE_LIMIT = 0.3811875

let nSeed, rSeed
let noiseScale = 0.001
let definition = 3

let palettes = []
let palette

let penSW

let scene
let cnv, riverCnv, grassCnv, beeCnv, textureCnv
let flattenedCnv
let _layersFlattened = false

let ogXRes, ogYRes
let xRes, yRes
let rows, cols
let displayMarginX, displayMarginY

let detailedNoise
let mapController
let grassController
let riverController
let flowerController
let mainStar
let gardenController
let criaturasController

let g

let renderingDone
let preRenderingDone
let toggleTexture

let toggleSign
let signD
let _cachedSignElement = null

function setup() {
  rSeed = floor($fx.rand() * 100000000)
  nSeed = floor($fx.rand() * 100000000)
  console.log(`
    💡 Hash: ${$fx.hash}
    💡 Random seed: ${rSeed}
    💡 Noise seed: ${nSeed}
  `)

  globalSetup()
}

function sizeCanvas() {
  const currentW = window.innerWidth
  const currentH = window.innerHeight

  ratio = currentW / originalW
  if (originalH * ratio > currentH) {
    ratio = currentH / originalH
  }

  W = originalW * ratio
  H = originalH * ratio
}

function setupGraphics() {
  // sanity buffer cleanup
  if (riverCnv) riverCnv.remove()
  if (grassCnv) grassCnv.remove()
  if (cnv) cnv.remove()
  if (beeCnv) beeCnv.remove()
  if (textureCnv) textureCnv.remove()
  if (flattenedCnv) flattenedCnv.remove()

  _layersFlattened = false
  flattenedCnv = null
  textureCnv = null

  const canvasElm = document.getElementById('mainCanvas')
  scene = createCanvas(W, H, canvasElm)

  cnv = createGraphics(W, H)
  riverCnv = createGraphics(W, H)
  grassCnv = createGraphics(W, H)
  beeCnv = createGraphics(W, H)

  const params = new URLSearchParams(window.location.search)
  const scale = params.get('scale')
  if (Boolean(scale)) {
    definition = parseInt(scale)
  }

  pixelDensity(definition)
  cnv.pixelDensity(definition)
  riverCnv.pixelDensity(definition)
  grassCnv.pixelDensity(definition)
  beeCnv.pixelDensity(definition)
}

function globalSetup() {
  sizeCanvas()

  randomSeed(rSeed)
  noiseSeed(nSeed)
  noisex.seed(nSeed)
  colorMode(HSL, 360, 100, 100, 100)

  setupGraphics()

  setupGlobalVariables()
  setupParams()
  setupControllers()
  setupDrawingData()
}

function setupGlobalVariables() {
  ogXRes = originalW * GRID_CELL_RATIO
  ogYRes = originalH * GRID_CELL_RATIO

  penSW = W * 0.0005

  xRes = W / FINE_GRID_DIVS
  yRes = H / FINE_GRID_DIVS
  rows = FINE_GRID_DIVS + 1
  cols = FINE_GRID_DIVS + 1

  displayMarginX = [W * 0.05, W * 0.95]
  displayMarginY = [H * 0.05, H * 0.95]

  mainStar = createVector(
    random(-W * 0.25, W * 1.25),
    random(H * 1.025, H * 1.1),
  )

  renderingDone = false
  preRenderingDone = false
  toggleTexture = true
  toggleSign = true
  _cachedSignElement = null
  const dwh = map(random(), 0, 1, 0.986, 1.019)
  signD = {
    x: W * random(0.889, 0.913),
    y: H * random(0.9568, 0.968),
    w: W * 0.056 * dwh,
    h: H * 0.01975 * dwh,
  }
}

function setupControllers() {
  detailedNoise = new DetailedNoise()

  const mapXRes = W / MAP_GRID_DIVS
  const mapYRes = H / MAP_GRID_DIVS
  mapController = new MapController(W, H, mapXRes, mapYRes)
  mapController.erodeHMap()
  mapController.cleanup()
  mapController.blurHMap()

  flowerController = new Flowers()
  grassController = new GrassController()
  riverController = new River(xRes * 0.45, xRes * 7)

  g = drawLand()
}

function setupDrawingData() {
  setupLand()
  setupFlowers()
  setupCriaturas()

  flowerController.setupFlowers()
  grassController.setupGrass()
  riverController.colorWater(flowerController.flowerQuadTree)
  riverController.wrapWater()
  criaturasController.setupCriaturas()

  // Cleanup
  flowerController.packer = null
  riverController.packer = null
  criaturasController.packer = null
  flowerController.flowerQuadTree = null
  criaturasController.flowerQT = null
  criaturasController.eventHandler.flowerQT = null
  mapController.lMap = null

  $fx.features({
    palette: palette.name,
    'flower spacing': flowerSpacingType,
    'garden type': gardenType,
    'river flow type': riverFlowType,
    'has creatures': criaturasController.totalCriaturas > 0,
    'has events': criaturasController.hasEvents,
  })

  p5grain.setup()
}

function addWater(x, y) {
  let cx = x
  let cy = y
  const rW = random(-1.5, 1.5)
  for (let i = 0; i < 20; i++) {
    if (riverController.maybeAddToRiver(cx, cy)) break

    cx += xRes * rW
    cy += yRes * rW
  }
}

function addPasto(x, y) {
  const i = floor(x / mapController.xRes)
  const j = floor(y / mapController.yRes)

  let t
  let outlined
  if (
    i < 0 ||
    i >= mapController.cols - 1 ||
    j < 0 ||
    j >= mapController.rows - 1
  ) {
    t = 0
    outlined = true
  } else {
    const n = mapController.hMapN(i, j)
    t = n.heading()
    outlined = abs(mapController.lMap[i][j]) < 0.41495
  }

  grassController.addGrass(x, y, t, outlined)
}

function setupLand() {
  let xoff = random(-15, 15)
  let yoff = random(-15, 15)
  for (let i = 0; i < 5550; i++) {
    const x = random(W * 0.0085, W * 0.9915)
    const y = random(H * 0.0085, H * 0.9915)

    if (
      x < displayMarginX[0] ||
      x > displayMarginX[1] ||
      y < displayMarginY[0] ||
      y > displayMarginY[1]
    ) {
      continue
    }

    const i = floor(x / mapController.xRes)
    const j = floor(y / mapController.yRes)

    xoff += 0.0085
    yoff += 0.0099

    if (mapController.hMap[i][j] <= WATER_NOISE_LIMIT) {
      addWater(x, y)
    } else {
      addPasto(x, y)
    }
  }
}

function setupFlowers() {
  let xoff = 0
  let yoff = 0
  for (let i = 0; i < 5555; i++) {
    const x = random(W * 0.005, W * 0.995)
    const y = random(H * 0.005, H * 0.995)

    if (
      x < displayMarginX[0] ||
      x > displayMarginX[1] ||
      y < displayMarginY[0] ||
      y > displayMarginY[1]
    ) {
      continue
    }

    const xi = floor(x / mapController.xRes)
    const yi = floor(y / mapController.yRes)

    if (mapController.hMap[xi][yi] <= WATER_NOISE_LIMIT + 0.0041225) {
      continue
    }

    const l = mapController.lMap[xi][yi]

    xoff += 0.85
    yoff += 0.99

    let fCi
    let c
    fCi = floor(map(abs(l), 0, 1, 0, palette.flowerPalette.length))
    c = color(palette.flowerPalette[fCi])
    c.setAlpha(random(82, 98))

    const flowerType =
      gardenController.noiseFlowerType(x, y) ?? FlowerType.basic
    let r = random(
      xRes * (flowerType === FlowerType.daisy ? 3.852 : 3.0885),
      xRes * (flowerType === FlowerType.daisy ? 5.1505 : 4.0015),
    )

    if (flowerType === FlowerType.cempa) {
      r *= random(0.92, 0.95)
    }

    flowerController.maybeAddFlower(x, y, r, c, flowerType, fCi)
  }
}

const MAX_CRIATURA_TRIES = 1_000
function setupCriaturas() {
  criaturasController = new Criaturitas(
    mapController,
    flowerController.flowerQuadTree,
  )
  let tries = 0

  while (
    criaturasController.availableTypes.length > 0 &&
    tries < MAX_CRIATURA_TRIES &&
    criaturasController.totalCriaturas < nCriaturas
  ) {
    const x = random(displayMarginX[0], displayMarginX[1])
    const y = random(displayMarginY[0], displayMarginY[1])
    const w = random(xRes * 5.25, xRes * 6)
    const h = w * random(0.78, 0.85)

    criaturasController.maybeAddCriatura(x, y, w, h)

    tries++
  }
}

function draw() {
  const gen = g.next()

  if (gen.done) {
    noLoop()
    renderingDone = true
    preRenderingDone = true
    console.log(`🎉 Rendering done!`)
    $fx.preview()

    flattenedCnv = createGraphics(W, H)
    flattenedCnv.pixelDensity(definition)
    flattenedCnv.background(palette.bg)
    flattenedCnv.image(riverCnv, 0, 0)
    flattenedCnv.image(grassCnv, 0, 0)
    flattenedCnv.image(cnv, 0, 0)
    flattenedCnv.image(beeCnv, 0, 0)

    // deallocate
    riverCnv.remove()
    grassCnv.remove()
    cnv.remove()
    beeCnv.remove()
    riverCnv = null
    grassCnv = null
    cnv = null
    beeCnv = null
    _layersFlattened = true

    // Memory cleanup
    detailedNoise = null
    mapController = null
    grassController = null
    riverController = null
    flowerController = null
    gardenController = null
    criaturasController = null
  }

  showCanvases(gen.done)
}

function showCanvases(withTexture = false) {
  if (_layersFlattened) {
    image(flattenedCnv, 0, 0)
  } else {
    background(palette.bg)

    image(riverCnv, 0, 0)
    image(grassCnv, 0, 0)
    image(cnv, 0, 0)
    image(beeCnv, 0, 0)
  }

  if (renderingDone && toggleSign) drawSignature()

  if (withTexture) {
    if (!textureCnv) {
      textureCnv = createGraphics(W, H)
      textureCnv.pixelDensity(definition)
      granulateSimple(17.5, true, textureCnv)
    }
    image(textureCnv, 0, 0)
  }
}

function drawSignature() {
  if (_cachedSignElement) {
    image(_cachedSignElement, signD.x, signD.y, signD.w, signD.h)
    return
  }

  // Using a str cuz I want n I can
  const signatureSvgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" id="signature" viewBox="401.711 309.536 418.166 195.633">
      <path
        d="M 455.33,357.52 C 454.99 356.53, 454.35 355.27, 452.54 353.97 C 450.74 352.67, 449.23 351.65, 446.29 351.02 C 443.35 350.38, 441.38 350.08, 437.84 350.82 C 434.29 351.55, 432.35 352.45, 428.56 354.69 C 424.77 356.92, 422.53 358.61, 418.90 362.01 C 415.27 365.40, 413.10 367.82, 410.42 371.66 C 407.74 375.50, 406.48 377.65, 405.49 381.21 C 404.49 384.78, 404.43 386.54, 405.44 389.47 C 406.46 392.40, 407.77 393.96, 410.57 395.86 C 413.37 397.75, 415.54 398.34, 419.42 398.95 C 423.31 399.56, 425.80 399.48, 429.97 398.90 C 434.15 398.32, 436.43 397.63, 440.30 396.04 C 444.17 394.45, 446.08 393.27, 449.34 390.95 C 452.59 388.63, 454.20 387.13, 456.56 384.44 C 458.92 381.74, 459.88 380.04, 461.14 377.48 C 462.39 374.92, 462.67 373.50, 462.84 371.65 C 463.01 369.80, 462.66 368.80, 461.99 368.25 C 461.32 367.70, 460.20 367.64, 459.51 368.89 C 458.82 370.14, 458.16 371.40, 458.53 374.51 C 458.91 377.62, 459.77 379.72, 461.39 384.44 C 463.01 389.15, 464.30 392.16, 466.63 398.08 C 468.97 404.01, 470.44 407.56, 473.06 414.06 C 475.69 420.56, 477.36 424.13, 479.75 430.58 C 482.14 437.02, 483.43 440.30, 485.02 446.30 C 486.60 452.30, 487.29 455.16, 487.68 460.58 C 488.07 465.99, 487.91 468.66, 486.98 473.38 C 486.04 478.11, 485.15 480.39, 483.00 484.19 C 480.85 488.00, 479.41 489.73, 476.21 492.40 C 473.01 495.07, 471.00 496.12, 466.98 497.55 C 462.96 498.98, 460.58 499.40, 456.11 499.55 C 451.64 499.71, 449.12 499.43, 444.65 498.33 C 440.17 497.22, 437.72 496.21, 433.73 494.02 C 429.73 491.84, 427.82 490.45, 424.68 487.40 C 421.53 484.35, 420.10 482.50, 418.00 478.75 C 415.90 475.01, 414.85 473.14, 414.17 468.70 C 413.48 464.26, 413.97 461.28, 414.57 456.55 C 415.17 451.83, 416.09 449.09, 417.16 445.06 C 418.23 441.04, 419.70 438.28, 419.93 436.44 C 420.16 434.59, 419.37 434.25, 418.31 435.83 C 417.25 437.41, 415.89 440.25, 414.62 444.33 C 413.35 448.41, 412.54 451.28, 411.95 456.23 C 411.36 461.19, 410.90 464.34, 411.67 469.09 C 412.44 473.85, 413.55 475.96, 415.79 479.99 C 418.04 484.02, 419.55 485.98, 422.90 489.23 C 426.24 492.49, 428.28 493.94, 432.50 496.25 C 436.73 498.57, 439.29 499.63, 444.03 500.81 C 448.77 501.98, 451.44 502.29, 456.20 502.13 C 460.96 501.96, 463.53 501.54, 467.85 499.98 C 472.18 498.42, 474.39 497.26, 477.84 494.34 C 481.29 491.41, 482.83 489.47, 485.09 485.36 C 487.35 481.25, 488.22 478.78, 489.14 473.79 C 490.05 468.81, 490.13 466.02, 489.67 460.42 C 489.20 454.83, 488.46 451.92, 486.82 445.82 C 485.18 439.73, 483.86 436.44, 481.47 429.94 C 479.08 423.45, 477.41 419.88, 474.87 413.34 C 472.33 406.81, 470.88 403.24, 468.78 397.28 C 466.67 391.32, 465.53 388.23, 464.35 383.55 C 463.18 378.87, 463.37 376.76, 462.90 373.89 C 462.43 371.02, 462.40 370.30, 462.01 369.22 C 461.62 368.13, 461.46 368.14, 460.97 368.46 C 460.49 368.78, 460.26 369.35, 459.58 370.81 C 458.90 372.26, 458.69 373.43, 457.56 375.72 C 456.43 378.00, 455.94 379.70, 453.93 382.24 C 451.92 384.78, 450.46 386.24, 447.51 388.43 C 444.55 390.62, 442.73 391.75, 439.14 393.21 C 435.55 394.67, 433.39 395.24, 429.55 395.72 C 425.72 396.20, 423.38 396.13, 419.96 395.59 C 416.53 395.04, 414.74 394.44, 412.43 393.00 C 410.12 391.57, 409.20 390.61, 408.39 388.42 C 407.58 386.23, 407.52 385.06, 408.39 382.04 C 409.27 379.02, 410.30 376.89, 412.79 373.31 C 415.28 369.72, 417.39 367.29, 420.85 364.11 C 424.31 360.92, 426.57 359.30, 430.09 357.39 C 433.62 355.48, 435.43 354.92, 438.46 354.54 C 441.50 354.17, 442.84 354.96, 445.28 355.53 C 447.71 356.11, 448.86 356.75, 450.65 357.42 C 452.43 358.10, 453.28 358.90, 454.22 358.92 C 455.15 358.94, 455.66 358.51, 455.33 357.52"
      />
      <path
        d="M 494.03,313.23 C 493.52 314.20, 492.81 315.18, 493.02 318.07 C 493.24 320.97, 494.03 323.07, 495.10 327.71 C 496.16 332.35, 496.96 335.62, 498.36 341.29 C 499.75 346.96, 500.60 350.24, 502.06 356.06 C 503.52 361.87, 504.32 365.13, 505.66 370.37 C 507.00 375.60, 507.50 377.97, 508.75 382.23 C 510.00 386.48, 510.55 388.34, 511.92 391.64 C 513.28 394.93, 513.84 396.44, 515.58 398.69 C 517.33 400.94, 518.36 401.84, 520.64 402.91 C 522.93 403.97, 524.34 404.21, 527.00 404.00 C 529.66 403.78, 531.11 403.25, 533.93 401.85 C 536.76 400.45, 538.08 399.37, 541.14 396.99 C 544.21 394.62, 546.01 393.00, 549.27 389.98 C 552.53 386.96, 554.28 385.12, 557.44 381.89 C 560.61 378.66, 562.17 376.84, 565.11 373.83 C 568.06 370.81, 569.73 369.16, 572.17 366.81 C 574.61 364.45, 575.71 363.48, 577.31 362.05 C 578.92 360.61, 579.40 360.16, 580.18 359.64 C 580.95 359.11, 581.16 359.31, 581.21 359.43 C 581.26 359.55, 580.85 359.69, 580.41 360.24 C 579.97 360.79, 579.43 361.16, 579.02 362.20 C 578.60 363.23, 578.51 364.11, 578.34 365.41 C 578.18 366.71, 578.27 367.36, 578.17 368.69 C 578.08 370.02, 577.92 370.82, 577.88 372.08 C 577.83 373.35, 577.98 374.08, 577.94 375.03 C 577.90 375.99, 577.77 376.12, 577.68 376.85 C 577.58 377.59, 577.39 378.10, 577.46 378.72 C 577.52 379.34, 577.76 379.47, 578.00 379.95 C 578.23 380.42, 578.26 380.55, 578.62 381.09 C 578.97 381.64, 579.11 382.31, 579.76 382.68 C 580.40 383.04, 581.04 383.00, 581.82 382.90 C 582.61 382.80, 582.97 382.45, 583.68 382.17 C 584.40 381.88, 584.62 381.77, 585.39 381.48 C 586.16 381.18, 586.60 381.12, 587.54 380.69 C 588.48 380.27, 589.06 380.12, 590.10 379.37 C 591.14 378.63, 591.80 378.14, 592.72 376.96 C 593.64 375.78, 594.22 375.05, 594.70 373.47 C 595.18 371.90, 595.34 370.89, 595.14 369.10 C 594.94 367.31, 594.60 366.15, 593.69 364.52 C 592.77 362.89, 592.04 362.08, 590.58 360.94 C 589.12 359.80, 588.00 359.25, 586.39 358.84 C 584.78 358.43, 583.77 358.44, 582.55 358.87 C 581.32 359.30, 580.74 359.90, 580.27 360.99 C 579.81 362.08, 579.67 362.99, 580.23 364.32 C 580.79 365.66, 581.40 366.50, 583.06 367.67 C 584.73 368.84, 586.05 369.46, 588.55 370.16 C 591.05 370.85, 592.53 370.99, 595.57 371.13 C 598.61 371.28, 600.48 371.09, 603.76 370.87 C 607.05 370.65, 608.91 370.47, 612.00 370.04 C 615.09 369.61, 616.70 369.31, 619.22 368.73 C 621.74 368.15, 622.89 367.42, 624.58 367.15 C 626.27 366.87, 626.57 366.76, 627.66 367.36 C 628.76 367.96, 629.07 368.74, 630.06 370.17 C 631.05 371.59, 631.55 372.58, 632.60 374.47 C 633.65 376.36, 634.08 377.61, 635.31 379.63 C 636.53 381.65, 637.21 383.07, 638.73 384.56 C 640.25 386.05, 641.36 386.83, 642.90 387.09 C 644.45 387.34, 645.36 386.89, 646.44 385.82 C 647.53 384.75, 647.85 383.65, 648.34 381.73 C 648.82 379.82, 648.83 378.63, 648.86 376.25 C 648.90 373.87, 648.69 372.34, 648.52 369.82 C 648.35 367.30, 648.12 366.00, 648.01 363.67 C 647.90 361.33, 647.76 360.07, 647.97 358.15 C 648.18 356.23, 648.29 355.50, 649.05 354.06 C 649.82 352.62, 650.27 352.07, 651.80 350.95 C 653.33 349.84, 654.61 349.41, 656.70 348.49 C 658.80 347.57, 660.29 347.22, 662.26 346.35 C 664.22 345.48, 665.75 344.92, 666.53 344.14 C 667.30 343.35, 667.23 342.79, 666.14 342.41 C 665.06 342.04, 663.39 341.93, 661.10 342.26 C 658.81 342.59, 657.09 342.96, 654.70 344.07 C 652.31 345.19, 650.94 346.17, 649.17 347.83 C 647.40 349.48, 646.88 350.42, 645.85 352.35 C 644.82 354.29, 644.49 355.25, 644.03 357.52 C 643.57 359.79, 643.61 361.20, 643.53 363.70 C 643.45 366.20, 643.63 367.50, 643.65 370.01 C 643.68 372.53, 643.61 374.03, 643.67 376.28 C 643.73 378.53, 643.85 379.64, 643.95 381.27 C 644.06 382.89, 644.22 383.72, 644.20 384.40 C 644.19 385.08, 644.27 385.19, 643.87 384.66 C 643.46 384.14, 643.05 383.29, 642.18 381.79 C 641.30 380.29, 640.59 379.13, 639.48 377.18 C 638.36 375.23, 637.89 373.96, 636.62 372.03 C 635.35 370.10, 634.64 369.04, 633.12 367.54 C 631.60 366.04, 630.79 365.29, 629.02 364.52 C 627.26 363.76, 626.44 363.69, 624.31 363.71 C 622.19 363.74, 620.98 364.20, 618.40 364.64 C 615.82 365.08, 614.40 365.51, 611.43 365.92 C 608.46 366.33, 606.66 366.56, 603.55 366.67 C 600.45 366.77, 598.63 366.69, 595.90 366.43 C 593.16 366.18, 591.96 365.97, 589.89 365.38 C 587.82 364.79, 586.89 364.09, 585.54 363.48 C 584.18 362.86, 583.73 362.65, 583.11 362.30 C 582.49 361.96, 582.48 361.82, 582.43 361.77 C 582.38 361.71, 582.37 361.78, 582.87 362.03 C 583.37 362.29, 583.93 362.55, 584.93 363.04 C 585.93 363.54, 586.89 363.77, 587.88 364.49 C 588.86 365.22, 589.29 365.63, 589.87 366.66 C 590.45 367.69, 590.62 368.55, 590.77 369.64 C 590.92 370.73, 590.96 371.25, 590.63 372.13 C 590.30 373.01, 589.77 373.31, 589.13 374.04 C 588.49 374.78, 588.07 375.30, 587.42 375.82 C 586.77 376.35, 586.59 376.41, 585.88 376.67 C 585.17 376.93, 584.63 376.88, 583.88 377.11 C 583.13 377.34, 582.69 377.67, 582.14 377.84 C 581.59 378.01, 581.46 377.89, 581.13 377.95 C 580.79 378.00, 580.68 377.89, 580.46 378.12 C 580.25 378.35, 580.08 378.82, 580.05 379.09 C 580.01 379.36, 580.16 379.49, 580.29 379.47 C 580.42 379.45, 580.54 379.35, 580.69 378.99 C 580.83 378.63, 580.77 378.34, 581.02 377.68 C 581.27 377.03, 581.62 376.77, 581.93 375.73 C 582.24 374.69, 582.41 373.81, 582.57 372.46 C 582.74 371.12, 582.66 370.31, 582.76 369.03 C 582.86 367.74, 582.91 367.18, 583.07 366.04 C 583.22 364.89, 583.44 364.37, 583.54 363.29 C 583.64 362.22, 583.78 361.70, 583.56 360.66 C 583.33 359.62, 583.25 358.77, 582.41 358.09 C 581.57 357.41, 580.82 357.03, 579.36 357.28 C 577.90 357.53, 577.04 357.93, 575.12 359.35 C 573.21 360.78, 572.22 361.93, 569.79 364.41 C 567.36 366.90, 565.86 368.70, 562.98 371.79 C 560.10 374.88, 558.55 376.69, 555.39 379.87 C 552.24 383.05, 550.47 384.83, 547.21 387.69 C 543.94 390.55, 542.08 392.07, 539.07 394.18 C 536.06 396.29, 534.66 397.01, 532.16 398.24 C 529.65 399.47, 528.60 399.99, 526.57 400.33 C 524.54 400.67, 523.66 400.69, 522.00 399.95 C 520.34 399.20, 519.75 398.50, 518.28 396.60 C 516.80 394.70, 516.05 393.46, 514.62 390.44 C 513.20 387.42, 512.49 385.61, 511.13 381.49 C 509.77 377.36, 509.22 374.99, 507.84 369.80 C 506.46 364.61, 505.65 361.34, 504.25 355.52 C 502.85 349.70, 502.06 346.41, 500.84 340.72 C 499.61 335.03, 498.96 331.71, 498.11 327.09 C 497.27 322.47, 497.11 320.39, 496.60 317.62 C 496.09 314.85, 496.09 314.10, 495.58 313.23 C 495.06 312.35, 494.54 312.26, 494.03 313.23"
      />
      <path
        d="M 691.01,358.85 C 690.60 359.62, 690.59 360.58, 690.67 362.30 C 690.76 364.01, 690.97 365.22, 691.44 367.43 C 691.92 369.63, 692.25 371.15, 693.04 373.33 C 693.82 375.52, 694.52 376.57, 695.37 378.36 C 696.23 380.15, 696.59 381.02, 697.31 382.30 C 698.03 383.58, 698.34 384.02, 698.98 384.76 C 699.62 385.49, 700.00 385.73, 700.52 385.99 C 701.03 386.25, 701.25 386.16, 701.56 386.06 C 701.88 385.95, 701.98 385.74, 702.10 385.46 C 702.23 385.17, 702.26 385.13, 702.18 384.65 C 702.10 384.17, 702.00 383.84, 701.70 383.06 C 701.39 382.28, 701.12 382.01, 700.66 380.75 C 700.20 379.49, 699.98 378.54, 699.41 376.75 C 698.83 374.96, 698.38 373.92, 697.78 371.80 C 697.18 369.68, 697.04 368.25, 696.40 366.15 C 695.76 364.05, 695.32 362.86, 694.59 361.31 C 693.86 359.77, 693.45 358.93, 692.73 358.43 C 692.02 357.94, 691.42 358.08, 691.01 358.85"
      />
      <path
        d="M 688.88,316.29 C 689.26 315.85, 689.12 315.52, 688.86 315.76 C 688.60 316.00, 687.78 317.08, 687.57 317.50 C 687.37 317.91, 687.63 318.32, 687.84 317.84 C 688.04 317.37, 688.72 315.69, 688.60 315.12 C 688.48 314.55, 687.74 314.54, 687.22 315.00 C 686.70 315.46, 686.08 316.83, 686.02 317.42 C 685.97 318.02, 686.38 318.20, 686.95 317.98 C 687.52 317.75, 688.50 316.74, 688.88 316.29"
      />
      <path
        d="M 777.33,361.95 C 777.25 361.06, 776.91 360.10, 775.66 358.73 C 774.40 357.37, 773.46 356.16, 771.04 355.13 C 768.61 354.10, 766.84 353.49, 763.53 353.57 C 760.22 353.65, 758.19 354.28, 754.50 355.55 C 750.82 356.81, 748.63 357.80, 745.11 359.90 C 741.59 361.99, 739.50 363.39, 736.91 366.01 C 734.32 368.63, 733.09 370.31, 732.17 372.98 C 731.25 375.65, 731.42 377.15, 732.30 379.36 C 733.18 381.57, 734.16 382.68, 736.56 384.04 C 738.96 385.41, 740.84 385.85, 744.29 386.19 C 747.73 386.52, 749.88 386.30, 753.79 385.72 C 757.71 385.15, 759.89 384.52, 763.87 383.32 C 767.84 382.13, 770.05 381.31, 773.66 379.75 C 777.27 378.19, 779.08 377.26, 781.93 375.54 C 784.77 373.82, 786.17 372.82, 787.87 371.14 C 789.56 369.46, 790.04 368.16, 790.42 367.14 C 790.80 366.12, 790.12 365.62, 789.77 366.04 C 789.42 366.46, 788.78 367.46, 788.66 369.23 C 788.54 371.00, 788.46 372.39, 789.17 374.88 C 789.89 377.37, 790.52 379.14, 792.25 381.69 C 793.98 384.24, 795.28 385.67, 797.84 387.63 C 800.40 389.59, 802.32 390.37, 805.04 391.50 C 807.76 392.63, 809.22 392.94, 811.43 393.29 C 813.63 393.64, 815.07 393.56, 816.07 393.26 C 817.06 392.95, 817.11 392.44, 816.38 391.77 C 815.66 391.11, 814.34 390.80, 812.44 389.91 C 810.55 389.03, 809.28 388.51, 806.90 387.35 C 804.52 386.20, 802.66 385.78, 800.55 384.13 C 798.45 382.48, 797.62 381.25, 796.38 379.08 C 795.13 376.92, 795.02 375.40, 794.32 373.30 C 793.63 371.19, 793.56 370.12, 792.90 368.55 C 792.25 366.98, 791.89 366.04, 791.06 365.44 C 790.22 364.83, 789.87 364.94, 788.72 365.51 C 787.58 366.08, 787.06 366.89, 785.31 368.28 C 783.57 369.68, 782.59 370.78, 780.00 372.48 C 777.40 374.17, 775.75 375.22, 772.34 376.77 C 768.93 378.32, 766.75 379.13, 762.95 380.21 C 759.16 381.30, 757.00 381.82, 753.34 382.21 C 749.69 382.61, 747.71 382.49, 744.68 382.19 C 741.65 381.89, 740.16 381.49, 738.21 380.71 C 736.26 379.93, 735.50 379.57, 734.93 378.28 C 734.37 376.99, 734.49 376.20, 735.40 374.25 C 736.30 372.31, 737.15 370.82, 739.45 368.55 C 741.74 366.27, 743.64 364.77, 746.87 362.87 C 750.11 360.97, 752.29 360.03, 755.63 359.05 C 758.96 358.06, 760.81 357.89, 763.54 357.95 C 766.27 358.02, 767.35 358.64, 769.29 359.39 C 771.23 360.15, 771.87 360.97, 773.23 361.73 C 774.58 362.48, 775.24 363.13, 776.06 363.17 C 776.88 363.22, 777.41 362.84, 777.33 361.95"
      />
    </svg>
  `
  const xmlDoc = new DOMParser().parseFromString(
    signatureSvgStr,
    'image/svg+xml',
  )
  const signElm = xmlDoc.getElementById('signature')
  const penHex = color(palette.penColor).toString('#rrggbb')
  signElm.style.fill = penHex
  signElm.style.stroke = penHex
  signElm.setAttribute('width', signD.w)
  signElm.setAttribute('height', signD.h)

  // All this to add it to the canvas
  const xmlStr = new XMLSerializer().serializeToString(xmlDoc)
  const blob = new Blob([xmlStr], { type: 'image/svg+xml;charset=utf-8' })
  const signUrl = window.URL.createObjectURL(blob)
  const img = new Image(signD.w, signD.h)
  const pe = new p5.Element(img)
  pe.width = signD.w
  pe.height = signD.h

  img.onload = () => {
    _cachedSignElement = pe
    URL.revokeObjectURL(signUrl)
    image(pe, signD.x, signD.y, signD.w, signD.h)
  }
  img.src = signUrl
}

function* drawLand() {
  for (const _ of riverController.drawWater(riverCnv)) {
    yield 0
  }

  for (const _ of grassController.draw(grassCnv)) {
    yield 1
  }

  for (const _ of flowerController.drawFlowers(cnv)) {
    yield 2
  }

  for (const _ of criaturasController.drawAll(beeCnv, [
    cnv,
    grassCnv,
    riverCnv,
  ])) {
    yield 3
  }
}

function keyTyped() {
  if (key === 't') {
    if (!preRenderingDone) {
      console.log(`😩 Rendering hasn't finished, please wait a little more...`)
      return
    }

    toggleTexture = !toggleTexture
    preRenderingDone = false

    if (toggleTexture) {
      console.log(`🥸 Loading texture, please wait a few seconds...`)
      
      showCanvases(true)
    } else {
      console.log(`🥸 Removing texture...`)

      if (textureCnv) {
        textureCnv.remove()
        textureCnv = null
      }
      showCanvases(false)
    }

    preRenderingDone = true
  } else if (key === 'f') {
    toggleSign = !toggleSign
    console.log(`💡 ${toggleSign ? 'Adding' : 'Removing'} signature...`)
    showCanvases(toggleTexture)
  } else if (key === 's') {
    saveCanvas(scene, `${rSeed}-${nSeed}`, 'png')
  }
}

const _ogPoint = { x: 0, y: 0 }
function pointToOG(x, y) {
  _ogPoint.x = (x / W) * originalW
  _ogPoint.y = (y / H) * originalH
  return _ogPoint
}

function toOGX(x) {
  return (x / W) * originalW
}

function toOGY(y) {
  return (y / H) * originalH
}
