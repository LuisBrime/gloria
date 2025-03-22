class DetailedNoise {
  constructor() {
    const ms = random(0.15, 0.46)
    const s = map(ms, 0, 0.61, 0.8, 0.35)

    this.noiseD = [
      [0.6, ms],
      [s, 2 * ms],
      [pow(s, 2), 4 * ms],
      [pow(s, 3), 8 * ms],
      [pow(s, 4), 16 * ms],
      [pow(s, 5), 32 * ms],
    ]
  }

  noise(x, y, minConstrain = 0, maxConstrain = 1) {
    let n = 0
    let nT = 0
    for (let i = 0; i < this.noiseD.length; i++) {
      const [a, f] = this.noiseD[i]
      n +=
        norm(
          noisex.simplex2(x * noiseScale * f * 2, y * noiseScale * f * 2),
          -1,
          1,
        ) * a
      nT += a
    }

    return constrain(
      map(n, 0, nT, minConstrain, maxConstrain),
      minConstrain,
      maxConstrain,
    )
  }
}
