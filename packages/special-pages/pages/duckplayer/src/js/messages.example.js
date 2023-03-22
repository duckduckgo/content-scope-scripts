/**
 *
 * @satisfies {import("./messages").UserValues}
 */
const enabled = {
    privatePlayerMode: { enabled: {} },
    overlayInteracted: false
}

console.log(enabled)

/**
 * @satisfies {import("./messages").UserValues}
 */
const disabled = {
    privatePlayerMode: { disabled: {} },
    overlayInteracted: false
}

console.log(disabled)
