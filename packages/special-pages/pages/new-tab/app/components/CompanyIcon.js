/**
 * Try to load an SVG file dynamically. This will NOT THROW
 * if the file cannot be found, this is to allow the following usage
 *
 * ```js
 * const src = loadSvgAsSource("Company A") | loadSvgAsSource("Company B") | loadSvgAsSource("A")
 * ```
 *
 * @param {string} name
 * @returns {string | null}
 * @throws
 */
function loadSvgAsSource (name) {
    try {
        // eslint-disable-next-line no-undef
        return require(`../../../../shared/company-icons/${name}.svg`)
    } catch (e) {
        return null
    }
}

/**
 * @param {string} companyName
 * * @param {(name: string) => string|null} [loader]
 * @returns {string | null}
 */
export function companyNameToSVG (companyName, loader = loadSvgAsSource) {
    // do nothing with invalid input
    if (typeof companyName !== 'string' || companyName.length === 0) return null

    // only take upto the first `.`, this handles company names like `Amazon.com`
    const name = companyName.toLowerCase().split('.')[0]

    // try to match the name to a known icon in the set above
    let asFilename = name.replace(/ /g, '-')
    if (asFilename === 'other') asFilename = '~placeholder'

    try {
        return loader(asFilename) || loader(name[0])
    } catch (e) {
        console.error('An unknown error occured', e)
    }

    return null
}
