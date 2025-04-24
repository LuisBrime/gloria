let debugCnv

function setupDbug() {
    debugCnv = createGraphics(W, H)
    debugCnv.pixelDensity(definition)
}

function drawDbugVect(v, cnv) {
    cnv.push()
    cnv.line(0, 0, v.x, v.y)
    cnv.rotate(v.heading())
    const arrowS = mapController.xRes * 0.086
    cnv.translate(v.mag() - arrowS, 0)
    cnv.triangle(0, arrowS / 2, 0, -arrowS / 2, arrowS, 0)
    cnv.pop()
}

function drawMap({ showNormal = false, showLightMap = false }) {
    debugCnv.push()
    debugCnv.stroke(palette.penColor)
    debugCnv.strokeWeight(mapController.xRes * 0.1)
    for (let i = 0; i < mapController.cols; i++) {
        const x = i * mapController.xRes
        for (let j = 0; j < mapController.rows; j++) {
            const y = j * mapController.yRes
            const t = mapController.hMapT(i, j)

            debugCnv.push()
            debugCnv.translate(x, y)
            debugCnv.rotate(t)
            drawDbugVect(createVector(mapController.xRes * 0.75, mapController.yRes * 0.75), debugCnv)

            if (showNormal) {
                debugCnv.stroke(palette.flowerPalette[0])
                const n = mapController.hMapN(i, j)
                drawDbugVect(
                    n.mult(mapController.xRes * 0.6),
                    debugCnv,
                )
            }

            if (showLightMap) {
                debugCnv.stroke(palette.flowerPalette[1])
                const v = createVector(x, y)
                const l = p5.Vector.sub(mainStar, v).normalize()
                drawDbugVect(
                    l.mult(mapController.xRes * 0.78),
                    debugCnv,
                )
            }

            debugCnv.pop()
        }
    }
    debugCnv.pop()
}

function drawLangDBug({ showWater = true, showLand = true }) {
    if (showWater) {
        debugCnv.push()
        debugCnv.stroke(palette.riverPalette[0])
        debugCnv.fill(palette.penColor)
        for (let i = 0; i < riverController.waterDots.length; i++) {
            const { x, y } = riverController.waterDots[i]
    
            debugCnv.push()
            debugCnv.translate(x, y)
            debugCnv.textSize(riverController.maxWaterSize * 0.45)
            debugCnv.text('awa', 0, 0)
            debugCnv.pop()
        }
        debugCnv.pop()
    }

    if (showLand) {
        debugCnv.push()
        debugCnv.fill(palette.penColor)
        debugCnv.stroke(palette.grassPalette[0])
        for (let i = 0; i < grassController.grassParams.length; i++) {
            const { x, y, t } = grassController.grassParams[i]
    
            debugCnv.push()
            debugCnv.translate(x, y)
            debugCnv.rotate(t)
            debugCnv.textSize(xRes * 2.25)
            debugCnv.text('pasto', 0, 0)
            debugCnv.pop()
        }
        debugCnv.pop()
    }
}

function drawDBugFlowers({ showFlowers = true }) {
    debugCnv.push()
    debugCnv.textAlign(CENTER, BOTTOM)
    if (showFlowers) {
        for (let i = 0; i < flowerController.flowers.length; i++) {
            const f = flowerController.flowers[i]

            debugCnv.push()
            debugCnv.translate(f.x, f.y)
            debugCnv.rotate(f.t)
            debugCnv.stroke(f.c)
            debugCnv.strokeWeight(f.r * 0.3)
            debugCnv.fill(palette.bg)
            debugCnv.textSize(xRes * 5)
            debugCnv.text(f.type[0].toUpperCase(), 0, 0)
            debugCnv.pop()
        }
    }
    debugCnv.pop()
}

function drawDebug() {
    drawMap({ showNormal: false, showLightMap: false })
    drawLangDBug({ showLand: false, showWater: false })
    drawDBugFlowers({})
    image(debugCnv, 0, 0)
    noLoop()
}
