/**
 * Use this to verify the result of updating some local state.
 *
 * @template TState
 * @template TEvent
 * @param {string} name
 * @param {TState} state
 * @param {TEvent} event
 * @param {(s: TState, e: TEvent) => TState} reducer
 */
export function log (name, state, event, reducer) {
    console.group(`[${name}]`)
    console.log('  [incoming]', state, event)
    const next = reducer(state, event)
    console.log('      [next]', next)
    console.groupEnd()
    return next
}
