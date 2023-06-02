/**
 * @typedef {object} Sizing
 * @property {number} height
 * @property {number} width
 */

/**
 * @param {Sizing[]} breakpoints
 * @param {Sizing} screenSize
 * @returns { Sizing | null}
 */
export function findClosestBreakpoint (breakpoints, screenSize) {
    let closestBreakpoint = null
    let closestDistance = Infinity

    for (let i = 0; i < breakpoints.length; i++) {
        const breakpoint = breakpoints[i]
        const distance = Math.sqrt(Math.pow(breakpoint.height - screenSize.height, 2) + Math.pow(breakpoint.width - screenSize.width, 2))

        if (distance < closestDistance) {
            closestBreakpoint = breakpoint
            closestDistance = distance
        }
    }

    return closestBreakpoint
}
