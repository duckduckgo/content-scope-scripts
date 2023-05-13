/* exported applyFpExampleDataToCanvas */

function createCanvas (width, height) {
    const canvasElement = document.createElement('canvas')
    canvasElement.width = width
    canvasElement.height = height
    canvasElement.style.display = 'none'
    return canvasElement
}

// Writes code input into the pixel data on a canvas, returned is a data URL of the image data for the canvas.
function generateDataURLWithCode (codeInput, alpha = 255) {
    const encodedCode = btoa(codeInput)
    const canvasElement = createCanvas(16, 16)
    const canvasContext = canvasElement.getContext('2d')
    const imageData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height)
    let index = 0
    for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] = encodedCode.charCodeAt(index) || 255
        // The browser optimises away transparent pixels so set alpha to fully opaque
        // If there's alpha it'll not be consistent even in non fp protected browsers too
        imageData.data[i + 3] = alpha
        ++index
    }
    canvasContext.putImageData(imageData, 0, 0)
    return canvasElement.toDataURL()
}

function calculateDifferencesOnRandomCanvas (width, height) {
    // Make a unique int per pixel for the channels
    function checkPixel (d, i) {
        return d[i] + (d[i + 1] * 10 ** 3) + (d[i + 2] * 10 ** 6) + (d[i + 3] * 10 ** 9)
    }
    const size = width * height
    const pixelAlterations = []
    let randData
    // eslint-disable-next-line new-cap
    const rng = new Math.seedrandom('something')
    // Compare 10 canvases and ensure per pixel there is more than one result
    for (let i = 0; i < 10; i++) {
        const canvasElement = createCanvas(width, height)
        const canvasContext = canvasElement.getContext('2d')

        // Generate rand data for all canvases to use
        if (i === 0) {
            const canvasDataBlank = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height)
            for (let i = 0; i < size * 4; i += 4) {
                canvasDataBlank.data[i] = Math.floor(rng() * 256)
                canvasDataBlank.data[i + 1] = Math.floor(rng() * 256)
                canvasDataBlank.data[i + 2] = Math.floor(rng() * 256)
                canvasDataBlank.data[i + 3] = 255
            }
            randData = canvasDataBlank
        }
        canvasContext.putImageData(randData, 0, 0)

        // Draw a unique pixel in top left corner
        const ctx = canvasElement.getContext('2d')
        ctx.fillStyle = `#f6${i}`
        ctx.fillRect(0, 0, 1, 1)

        // Put pixel data in set if doesn't match reference data
        const canvasData = canvasContext.getImageData(0, 0, canvasElement.width, canvasElement.height)
        // Start at pixel 1 as pixel 0 was used for making the canvas random
        for (let j = 1; j < size; j++) {
            const pixelChecksum = checkPixel(canvasData.data, j * 4)
            if (pixelChecksum !== checkPixel(randData.data, j * 4)) {
                if (!(pixelAlterations[j])) {
                    pixelAlterations[j] = new Set()
                }
                pixelAlterations[j].add(pixelChecksum)
            }
        }
    }

    // Calculates the number of unique pixel counts
    // EG: If pixel at index 2 has 5 unique values accross the 10 canvas slices we would increment pixelChangeCounts[5] += 1
    const pixelChangeCounts = [0]
    for (let i = 1; i < size; i++) {
        // If pixel doesn't exist then it's the same as the reference data
        if (!(i in pixelAlterations)) {
            pixelChangeCounts[0] += 1
            continue
        }
        // The number of unique differences to the reference data across the slices
        const uniquePixelCount = pixelAlterations[i].size
        if (!(uniquePixelCount in pixelChangeCounts)) {
            pixelChangeCounts[uniquePixelCount] = 0
        }
        pixelChangeCounts[uniquePixelCount] += 1
    }
    return pixelChangeCounts
}

function applyFpExampleDataToCanvas (canvas) {
    // Very simple now, need to make it more complex (geo shapes etc)
    const ctx = canvas.getContext('2d')
    // detect browser support of canvas winding
    // http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/
    // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/canvas/winding.js
    ctx.rect(0, 0, 10, 10)
    ctx.rect(2, 2, 6, 6)

    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = '#f60'
    ctx.fillRect(125, 1, 62, 20)
    ctx.fillStyle = '#069'
    // https://github.com/Valve/fingerprintjs2/issues/66
    // if (this.options.dontUseFakeFontInCanvas) {
    // ctx.font = '11pt Arial'
    // } else {
    ctx.font = '11pt no-real-font-123'
    // }
    ctx.fillText('Cwm fjordbank glyphs vext quiz, \ud83d\ude03', 2, 15)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.2)'
    ctx.font = '18pt Arial'
    ctx.fillText('Cwm fjordbank glyphs vext quiz, \ud83d\ude03', 4, 45)

    // canvas blending
    // http://blogs.adobe.com/webplatform/2013/01/28/blending-features-in-canvas/
    // http://jsfiddle.net/NDYV8/16/
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = 'rgb(255,0,255)'
    ctx.beginPath()
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgb(0,255,255)'
    ctx.beginPath()
    ctx.arc(100, 50, 50, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgb(255,255,0)'
    ctx.beginPath()
    ctx.arc(75, 100, 50, 0, Math.PI * 2, true)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgb(255,0,255)'
    // canvas winding
    // http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/
    // http://jsfiddle.net/NDYV8/19/
    ctx.arc(75, 75, 75, 0, Math.PI * 2, true)
    ctx.arc(75, 75, 25, 0, Math.PI * 2, true)
    ctx.fill('evenodd')
}
