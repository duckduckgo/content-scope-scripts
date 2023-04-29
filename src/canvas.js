import { getDataKeySync } from './crypto.js'
import Seedrandom from 'seedrandom'
import { postDebugMessage } from './utils.js'

/**
 * Copies the contents of a 2D canvas to a WebGL texture
 * @param {CanvasRenderingContext2D} ctx2d
 * @param {WebGLRenderingContext | WebGL2RenderingContext} ctx3d
 */
export function copy2dContextToWebGLContext (ctx2d, ctx3d) {
    const canvas2d = ctx2d.canvas
    const imageData = ctx2d.getImageData(0, 0, canvas2d.width, canvas2d.height)
    const pixelData = new Uint8Array(imageData.data.buffer)

    const texture = ctx3d.createTexture()
    ctx3d.bindTexture(ctx3d.TEXTURE_2D, texture)
    ctx3d.texImage2D(ctx3d.TEXTURE_2D, 0, ctx3d.RGBA, canvas2d.width, canvas2d.height, 0, ctx3d.RGBA, ctx3d.UNSIGNED_BYTE, pixelData)
    ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_WRAP_S, ctx3d.CLAMP_TO_EDGE)
    ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_WRAP_T, ctx3d.CLAMP_TO_EDGE)
    ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_MIN_FILTER, ctx3d.LINEAR)
    ctx3d.texParameteri(ctx3d.TEXTURE_2D, ctx3d.TEXTURE_MAG_FILTER, ctx3d.LINEAR)

    const vertexShaderSource = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;

    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
    }`
    const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_texCoord;

    void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
    }`

    const vertexShader = createShader(ctx3d, ctx3d.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(ctx3d, ctx3d.FRAGMENT_SHADER, fragmentShaderSource)

    const program = ctx3d.createProgram()
    // Shouldn't happen but bail happy if it does
    if (!program || !vertexShader || !fragmentShader) {
        postDebugMessage('Unable to initialize the shader program')
        return
    }
    ctx3d.attachShader(program, vertexShader)
    ctx3d.attachShader(program, fragmentShader)
    ctx3d.linkProgram(program)

    if (!ctx3d.getProgramParameter(program, ctx3d.LINK_STATUS)) {
        // Shouldn't happen but bail happy if it does
        postDebugMessage('Unable to initialize the shader program: ' + ctx3d.getProgramInfoLog(program))
    }
    const positionAttributeLocation = ctx3d.getAttribLocation(program, 'a_position')
    const positionBuffer = ctx3d.createBuffer()
    ctx3d.bindBuffer(ctx3d.ARRAY_BUFFER, positionBuffer)
    const positions = [
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        1.0, 1.0
    ]
    ctx3d.bufferData(ctx3d.ARRAY_BUFFER, new Float32Array(positions), ctx3d.STATIC_DRAW)

    ctx3d.useProgram(program)
    ctx3d.enableVertexAttribArray(positionAttributeLocation)
    ctx3d.vertexAttribPointer(positionAttributeLocation, 2, ctx3d.FLOAT, false, 0, 0)

    const textureUniformLocation = ctx3d.getUniformLocation(program, 'u_texture')
    ctx3d.activeTexture(ctx3d.TEXTURE0)
    ctx3d.bindTexture(ctx3d.TEXTURE_2D, texture)
    ctx3d.uniform1i(textureUniformLocation, 0)
    ctx3d.drawArrays(ctx3d.TRIANGLE_STRIP, 0, 4)
}

/**
 * @param {WebGLRenderingContext | WebGL2RenderingContext} gl
 * @param {number} type
 * @param {string} source
 * @returns {WebGLShader | null}
 */
function createShader (gl, type, source) {
    const shader = gl.createShader(type)
    if (!shader) {
        return null
    }
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        postDebugMessage('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader))
        return null
    }
    return shader
}

/**
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {string} domainKey
 * @param {string} sessionKey
 * @param {any} getImageDataProxy
 * @param {CanvasRenderingContext2D | WebGL2RenderingContext | WebGLRenderingContext} ctx?
 */
export function computeOffScreenCanvas (canvas, domainKey, sessionKey, getImageDataProxy, ctx) {
    if (!ctx) {
        // @ts-expect-error - Type 'null' is not assignable to type 'CanvasRenderingContext2D | WebGL2RenderingContext | WebGLRenderingContext'.
        ctx = canvas.getContext('2d')
    }

    // Make a off-screen canvas and put the data there
    const offScreenCanvas = document.createElement('canvas')
    offScreenCanvas.width = canvas.width
    offScreenCanvas.height = canvas.height
    const offScreenCtx = offScreenCanvas.getContext('2d')
    // Should not happen, but just in case
    if (!offScreenCtx) {
        return null
    }

    let rasterizedCtx = ctx
    // If we're not a 2d canvas we need to rasterise first into 2d
    const rasterizeToCanvas = !(ctx instanceof CanvasRenderingContext2D)
    if (rasterizeToCanvas) {
        rasterizedCtx = offScreenCtx
        offScreenCtx.drawImage(canvas, 0, 0)
    }

    // We *always* compute the random pixels on the complete pixel set, then pass back the subset later
    let imageData = getImageDataProxy._native.apply(rasterizedCtx, [0, 0, canvas.width, canvas.height])
    imageData = modifyPixelData(imageData, sessionKey, domainKey, canvas.width)

    if (rasterizeToCanvas) {
        clearCanvas(offScreenCtx)
    }

    offScreenCtx.putImageData(imageData, 0, 0)

    return { offScreenCanvas, offScreenCtx }
}

/**
 * Clears the pixels from the canvas context
 *
 * @param {CanvasRenderingContext2D} canvasContext
 */
function clearCanvas (canvasContext) {
    // Save state and clean the pixels from the canvas
    canvasContext.save()
    canvasContext.globalCompositeOperation = 'destination-out'
    canvasContext.fillStyle = 'rgb(255,255,255)'
    canvasContext.fillRect(0, 0, canvasContext.canvas.width, canvasContext.canvas.height)
    canvasContext.restore()
}

/**
 * @param {ImageData} imageData
 * @param {string} sessionKey
 * @param {string} domainKey
 * @param {number} width
 */
export function modifyPixelData (imageData, domainKey, sessionKey, width) {
    const d = imageData.data
    const length = d.length / 4
    let checkSum = 0
    const mappingArray = []
    for (let i = 0; i < length; i += 4) {
        if (!shouldIgnorePixel(d, i) && !adjacentSame(d, i, width)) {
            mappingArray.push(i)
            checkSum += d[i] + d[i + 1] + d[i + 2] + d[i + 3]
        }
    }

    const windowHash = getDataKeySync(sessionKey, domainKey, checkSum)
    const rng = new Seedrandom(windowHash)
    for (let i = 0; i < mappingArray.length; i++) {
        const rand = rng()
        const byte = Math.floor(rand * 10)
        const channel = byte % 3
        const pixelCanvasIndex = mappingArray[i] + channel

        d[pixelCanvasIndex] = d[pixelCanvasIndex] ^ (byte & 0x1)
    }

    return imageData
}

/**
 * Ignore pixels that have neighbours that are the same
 *
 * @param {Uint8ClampedArray} imageData
 * @param {number} index
 * @param {number} width
 */
function adjacentSame (imageData, index, width) {
    const widthPixel = width * 4
    const x = index % widthPixel
    const maxLength = imageData.length

    // Pixels not on the right border of the canvas
    if (x < widthPixel) {
        const right = index + 4
        if (!pixelsSame(imageData, index, right)) {
            return false
        }
        const diagonalRightUp = right - widthPixel
        if (diagonalRightUp > 0 && !pixelsSame(imageData, index, diagonalRightUp)) {
            return false
        }
        const diagonalRightDown = right + widthPixel
        if (diagonalRightDown < maxLength && !pixelsSame(imageData, index, diagonalRightDown)) {
            return false
        }
    }

    // Pixels not on the left border of the canvas
    if (x > 0) {
        const left = index - 4
        if (!pixelsSame(imageData, index, left)) {
            return false
        }
        const diagonalLeftUp = left - widthPixel
        if (diagonalLeftUp > 0 && !pixelsSame(imageData, index, diagonalLeftUp)) {
            return false
        }
        const diagonalLeftDown = left + widthPixel
        if (diagonalLeftDown < maxLength && !pixelsSame(imageData, index, diagonalLeftDown)) {
            return false
        }
    }

    const up = index - widthPixel
    if (up > 0 && !pixelsSame(imageData, index, up)) {
        return false
    }

    const down = index + widthPixel
    if (down < maxLength && !pixelsSame(imageData, index, down)) {
        return false
    }

    return true
}

/**
 * Check that a pixel at index and index2 match all channels
 * @param {Uint8ClampedArray} imageData
 * @param {number} index
 * @param {number} index2
 */
function pixelsSame (imageData, index, index2) {
    return imageData[index] === imageData[index2] &&
           imageData[index + 1] === imageData[index2 + 1] &&
           imageData[index + 2] === imageData[index2 + 2] &&
           imageData[index + 3] === imageData[index2 + 3]
}

/**
 * Returns true if pixel should be ignored
 * @param {Uint8ClampedArray} imageData
 * @param {number} index
 * @returns {boolean}
 */
function shouldIgnorePixel (imageData, index) {
    // Transparent pixels
    if (imageData[index + 3] === 0) {
        return true
    }
    return false
}
