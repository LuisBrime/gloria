class Quad {
  constructor(x, y, w, h) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  contains(point) {
    return (
      point.x >= this.x &&
      point.x < this.x + this.w &&
      point.y >= this.y &&
      point.y < this.y + this.h
    )
  }

  intersects(range) {
    return (
      this.x < range.x + range.w &&
      this.x + this.w > range.x &&
      this.y < range.y + range.h &&
      this.y + this.h > range.y
    )
  }
}

class QuadTree {
  constructor(boundary) {
    this.boundary = boundary
    this.divided = false
    this.capacities = {}
  }

  setCapacityKey(key, capacity) {
    const values = { capacity }

    if (!(key in this.capacities)) {
      values.references = []
    }

    this.capacities[key] = values
  }

  branchOut() {
    this.divided = true
    const x = this.boundary.x
    const y = this.boundary.y
    const hw = this.boundary.w / 2
    const hh = this.boundary.h / 2

    this.ne = new QuadTree(new Quad(x + hw, y, hw, hh))
    this.nw = new QuadTree(new Quad(x, y, hw, hh))
    this.se = new QuadTree(new Quad(x + hw, y + hh, hw, hh))
    this.sw = new QuadTree(new Quad(x, y + hh, hw, hh))

    const capacitiesKs = Object.keys(this.capacities)
    for (let i = 0; i < capacitiesKs.length; i++) {
      const k = capacitiesKs[i]
      this.ne.setCapacityKey(k, this.capacities[k].capacity)
      this.nw.setCapacityKey(k, this.capacities[k].capacity)
      this.se.setCapacityKey(k, this.capacities[k].capacity)
      this.sw.setCapacityKey(k, this.capacities[k].capacity)
    }
  }

  add(pos, key, shouldBranch = true) {
    if (!this.boundary.contains(pos)) return false

    const cvs = this.capacities[key]
    if (!cvs) return false

    if (cvs.references.length < cvs.capacity) {
      cvs.references.push(pos)
      return true
    }

    if (!this.divided && shouldBranch) this.branchOut()

    if (this.divided) {
      if (this.ne.add(pos, key, shouldBranch)) return true
      if (this.nw.add(pos, key, shouldBranch)) return true
      if (this.se.add(pos, key, shouldBranch)) return true
      if (this.sw.add(pos, key, shouldBranch)) return true
    }

    return false
  }

  query(range, key, found = []) {
    if (!this.boundary.intersects(range)) return
    if (!(key in this.capacities)) return

    const { references } = this.capacities[key]
    for (let i = 0; i < references.length; i++) {
      const ref = references[i]
      if (range.contains(ref)) found.push(ref)
    }

    if (this.divided) {
      this.ne.query(range, key, found)
      this.nw.query(range, key, found)
      this.se.query(range, key, found)
      this.sw.query(range, key, found)
    }

    return found
  }
}
