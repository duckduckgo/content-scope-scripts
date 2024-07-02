/**
 * @group pixels
 */
export class OverlayPixel {
    /** @type {"overlay"} */
    name = 'overlay'
}

/**
 * An example of a pixel that
 * @group pixels
 */
export class PlayPixel {
    name = 'play.use'
    /** @type {{remember: "0" | "1"}} */
    params
    /**
     * @param {object} params
     * @param {"0" | "1"} params.remember
     */
    constructor (params) {
        this.params = params
    }
}

/**
 * @group pixels
 */
export class PlayDoNotUse {
    name = 'play.do_not_use'
    /** @type {{remember: "0" | "1"}} */
    params
    /**
     * @param {object} params
     * @param {"0" | "1"} params.remember
     */
    constructor (params) {
        this.params = params
    }
}

export class Pixel {
    /**
     * A list of known pixels
     * @param {OverlayPixel | PlayPixel | PlayDoNotUse} input
     */
    constructor (input) {
        /**
         * @internal
         */
        this.input = input
    }

    name () {
        return this.input.name
    }

    params () {
        if ('params' in this.input) {
            return this.input.params
        }
        return {}
    }
}
