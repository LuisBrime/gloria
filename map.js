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

    this._gghBuffer = [0, 0, 0]
    this._nBuffer = {
      x: 0,
      y: 0,
      heading: function() {
        return Math.atan2(this.x, this.y)
      },
    }

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
          Math.floor(detailedNoise.noise(x + xoff, y + yoff) * 100000) / 100000

        this.hMap[i].push(n)
        this.eMap[i].push(0.1)
        this.dMap[i].push(0.001)

        yoff += 0.0005
      }

      xoff += 0.005
    }
  }

  hMapN(i, j) {
    const t = this.hMapT(i, j)

    const dx = -this.yRes * Math.sin(t)
    const dy = this.xRes * Math.cos(t)
    const l = Math.hypot(dx, dy) || 1

    this._nBuffer.x = dx / l
    this._nBuffer.y = dy / l

    return this._nBuffer
  }

  hMapT(i, j) {
    const h = this.hMap[i][j]
    return h * PI * map(j, 0, this.rows, 1, 0.45) + this.tSmoothing
  }

  setupLightMap() {
    const starX = mainStar.x
    const starY = mainStar.y

    for (let i = 0; i < this.cols; i++) {
      this.lMap[i] = []
      const vx = i * this.xRes

      for (let j = 0; j < this.rows; j++) {
        const vy = j * this.yRes

        const dx = starX - vx
        const dy = starY - vy
        const dl = Math.hypot(dx, dy) || 1

        const nx = dx / dl
        const ny = dy / dl

        const hN = this.hMapN(i, j)
        const dot = hN.x * nx + hN.y * ny
        this.lMap[i].push(dot)
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

    const totalDrops = Math.floor(originalW * originalH * 0.885)

    for (let d = 0; d < totalDrops; d++) {
      const r1 = random()
      const r2 = random()

      let px = random(this.w)
      let py = random(this.h)
      let dirX = 0
      let dirY = 0

      let s = initialS
      let wv = initialWV
      let sediment = 0

      for (let i = 0; i < maxDI; i++) {
        const nX = Math.round(px)
        const nY = Math.round(py)

        if (nX < 0 || nX >= this.cols - 1 || nY < 0 || nY >= this.rows - 1) {
          break
        }

        const nXP = nX * this.xRes
        const nYP = nY * this.yRes

        const offsetX = constrain(
          map(px > nXP ? px - nXP : nXP - px, 0, this.xRes - 1, 0, 1),
          0,
          1,
        )
        const offsetY = constrain(
          map(py > nYP ? py - nYP : nYP - py, 0, this.yRes - 1, 0, 1),
          0,
          1,
        )

        this.heightAndGradient(nXP, nYP, this._gghBuffer)
        const ggh0 = this._gghBuffer[0]
        const ggh1 = this._gghBuffer[1]
        const ggh2 = this._gghBuffer[2]

        if (isNaN(ggh0) || isNaN(ggh1) || isNaN(ggh2)) break

        dirX = dirX * inertia - ggh0 * (1 - inertia)
        dirY = dirY * inertia - ggh1 * (1 - inertia)
        
        const dirL = Math.hypot(dirX, dirY)
        if (dirL > 0) {
          dirX /= dirL
          dirY /= dirL
        }

        px += dirX
        py += dirY

        if (dirX === 0 && dirY === 0) break
        if (px < 0 || px >= this.w || py < 0 || py >= this.h) break

        this.heightAndGradient(px, py, this._gghBuffer)
        const nH = this._gghBuffer[2]
        if (isNaN(nH)) break

        const dH = nH - ggh2
        const sedimentCap = Math.max(
          -dH * s * wv * sedimentCapacityFactor,
          minSedimentCapacity,
        )

        if (sediment > sedimentCap || dH > 0) {
          const amountToDeposit =
            dH > 0
              ? Math.min(dH, sediment)
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
              let influence = 1 / 25

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
                Math.min((sedimentCap - sediment) * erodeS, -dH) *
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

        s = Math.sqrt(s * s + Math.abs(dH) * g)
        wv *= 1 - evaporateS

        if (wv < 0.0001) break
      }
    }
  }

  heightAndGradient(x, y, out = [0, 0, 0]) {
    const xi = Math.floor(x / this.xRes)
    const yi = Math.floor(y / this.yRes)
    if (xi < 0 || xi >= this.cols - 1 || yi < 0 || yi >= this.rows - 1) {
      out[0] = 0
      out[1] = 0
      out[2] = 0
      return out
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

    out[0] = gX
    out[1] = gY
    out[2] = ht
    return out
  }

  cleanup() {
    this.eMap = null
    this.dMap = null
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
