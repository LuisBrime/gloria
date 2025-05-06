class MapController {
  constructor(w, h, xRes, yRes) {
    this.w = w
    this.h = h
    this.xRes = xRes
    this.yRes = yRes

    this.cols = floor(w / xRes) + 1
    this.rows = floor(h / yRes) + 1

    this.hMap = []
    this.eMap = []
    this.dMap = []
    this.lMap = []

    this.tSmoothing = random([
      PI,
      PI,
      -PI,
      -PI,
      PI * 0.5,
      -PI * 0.5,
      PI * 0.25,
      -PI * 0.25,
    ])

    this.setupHeightMap()
    this.setupLightMap()
  }

  setupHeightMap() {
    let xoff = 0
    for (let i = 0; i < this.cols; i++) {
      this.hMap[i] = []
      this.eMap[i] = []
      this.dMap[i] = []

      const x = map(i * this.xRes, 0, this.w, 0, originalW)
      let yoff = 0
      for (let j = 0; j < this.rows; j++) {
        const y = map(j * this.yRes, 0, this.h, 0, originalH)

        const n =
          floor(detailedNoise.noise(x + xoff, y + yoff) * 100000) / 100000

        this.hMap[i].push(n)
        this.eMap[i].push(0.1)
        this.dMap[i].push(0.001)

        yoff += 0.0005
      }

      xoff += 0.005
    }
  }

  hMapN(i, j) {
    const x = i * this.xRes
    const y = j * this.yRes
    const t = this.hMapT(i, j)

    const nx = x + this.xRes * cos(t)
    const ny = y + this.yRes * sin(t)

    return createVector(-1 * (ny - y), nx - x).normalize()
  }

  hMapT(i, j) {
    const h = this.hMap[i][j]
    return h * PI * map(j, 0, this.rows, 1, 0.45) + this.tSmoothing
  }

  setupLightMap() {
    for (let i = 0; i < this.cols; i++) {
      this.lMap[i] = []
      for (let j = 0; j < this.rows; j++) {
        const v = createVector(i * this.xRes, j * this.yRes)
        const l = p5.Vector.sub(mainStar, v).normalize()
        const hN = this.hMapN(i, j)
        this.lMap[i].push(p5.Vector.dot(hN, l))
      }
    }
  }

  erodeHMap() {
    const l = random(0.5, 2)
    const maxDI = 60 * l
    const initialS = 0
    const initialWV = 1
    const inertia = 0.58
    const sedimentCapacityFactor = 40
    const minSedimentCapacity = 1.0175
    const depositS = 0.85
    const erodeS = 0.9
    const g = 4
    const evaporateS = 0.5 / l

    for (let d = 0; d < (originalW * originalH) * 0.885; d++) {
      const r1 = random()
      const r2 = random()
      const p = createVector(random(this.w), random(this.h))
      const dir = createVector(0, 0)

      let s = initialS
      let wv = initialWV
      let sediment = 0

      for (let i = 0; i < maxDI; i++) {
        const nX = round(p.x)
        const nY = round(p.y)

        if (nX < 0 || nX >= this.cols - 1 || nY < 0 || nY >= this.rows - 1) {
          break
        }

        const nXP = nX * this.xRes
        const nYP = nY * this.yRes

        const offsetX = constrain(
          map(p.x > nXP ? p.x - nXP : nXP - p.x, 0, this.xRes - 1, 0, 1),
          0,
          1,
        )
        const offsetY = constrain(
          map(p.y > nYP ? p.y - nYP : nYP - p.y, 0, this.yRes - 1, 0, 1),
          0,
          1,
        )
        const ggh = this.heightAndGradient(nXP, nYP)

        if (ggh.some((x) => isNaN(x))) break

        dir.x = (dir.x * inertia) - ggh[0] * (1 - inertia)
        dir.y = (dir.y * inertia) - ggh[1] * (1 - inertia)
        dir.normalize()
        p.add(dir)

        if (dir.x === 0 && dir.y === 0) break
        if (p.x < 0 || p.x >= this.w || p.y < 0 || p.y >= this.h) break

        const nH = this.heightAndGradient(p.x, p.y)[2]
        if (isNaN(nH)) break

        const dH = nH - ggh[2]
        const sedimentCap = max(
          -dH * s * wv * sedimentCapacityFactor,
          minSedimentCapacity,
        )

        if (sediment > sedimentCap || dH > 0) {
          const amountToDeposit =
            dH > 0
              ? min(dH, sediment)
              : (sediment - sedimentCap) * depositS * this.dMap[nX][nY]
          sediment -= amountToDeposit

          const c1 = (1 - offsetX) * (1 - offsetY)
          const c2 = offsetX * (1 - offsetY)
          const c3 = (1 - offsetX) * offsetY
          const c4 = offsetX * offsetY

          this.hMap[nX][nY] += amountToDeposit * c1
          this.hMap[nX + 1][nY] += amountToDeposit * c2
          this.hMap[nX][nY + 1] += amountToDeposit * c3
          this.hMap[nX + 1][nY + 1] += amountToDeposit * c4
        } else {
          for (let dri = 0; dri < 4; dri++) {
            for (let drj = 0; drj < 4; drj++) {
              let influence = 1 / sq(4 + 1)

              let _nX = nX + dri
              let _nY = nY + drj

              if (r1 < 0.5) _nX = nX - dri
              if (r2 < 0.5) _nY = nY - drj

              if (
                _nX < 0 ||
                _nX >= this.cols - 1 ||
                _nY < 0 ||
                _nY >= this.rows - 1
              ) {
                break
              }

              const amountToErode =
                min((sedimentCap - sediment) * erodeS, -dH) *
                this.eMap[_nX][_nY] *
                influence
              const wErodeAmount = amountToErode * 0.75

              const dSediment =
                this.hMap[_nX][_nY] < wErodeAmount
                  ? this.hMap[_nX][_nY]
                  : wErodeAmount
              this.hMap[_nX][_nY] -= dSediment
              sediment += dSediment
            }
          }
        }

        s = sqrt(s * s + abs(dH) * g)
        wv *= 1 - evaporateS

        if (wv < 0.0001) break
      }
    }
  }

  heightAndGradient(x, y) {
    const xi = floor(x / this.xRes)
    const yi = floor(y / this.yRes)
    if (xi < 0 || xi >= this.cols - 1 || yi < 0 || yi >= this.rows - 1) {
      return [0, 0, 0]
    }

    const xf = constrain(map(x - xi * this.xRes, 0, this.xRes - 1, 0, 1), 0, 1)
    const yf = constrain(map(y - yi * this.yRes, 0, this.yRes - 1, 0, 1), 0, 1)

    const hNW = this.hMap[xi][yi]
    const hNE = this.hMap[xi + 1][yi]
    const hSW = this.hMap[xi][yi + 1]
    const hSE = this.hMap[xi + 1][yi + 1]

    const gX = (hNE - hNW) * (1 - yf) + (hSE - hSW) * yf
    const gY = (hSW - hNW) * (1 - xf) + (hSE - hNE) * xf
    const ht =
      hNW * (1 - xf) * (1 - yf) +
      hNE * xf * (1 - yf) +
      hSW * (1 - xf) * yf +
      hSE * xf * yf

    return [gX, gY, ht]
  }

  blurHMap(it = 1, stg = 0.2) {
    let sum, count
    for (let k = 0; k < it; k++) {
      for (let i = 0; i < this.hMap.length; i++) {
        for (let j = 0; j < this.hMap[0].length; j++) {
          sum = 0
          count = 0

          if (i > 0) {
            count++
            sum += this.hMap[i - 1][j]

            if (j > 0) {
              count++
              sum += this.hMap[i - 1][j - 1]
            }

            if (j < this.hMap[0].length - 1) {
              count++
              sum += this.hMap[i - 1][j + 1]
            }
          }

          if (i < this.hMap.length - 1) {
            count++
            sum += this.hMap[i + 1][j]

            if (j > 0) {
              count++
              sum += this.hMap[i + 1][j - 1]
            }

            if (j < this.hMap[0].length - 1) {
              count++
              sum += this.hMap[i + 1][j + 1]
            }
          }

          count++
          sum += this.hMap[i][j]

          this.hMap[i][j] = lerp(this.hMap[i][j], sum / count, stg)
        }
      }
    }
  }
}
