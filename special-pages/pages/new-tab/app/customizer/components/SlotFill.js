import { h, Fragment } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';

export const SLOT_UPDATE_EVENT = 'ntp-slot-update';
export const SLOT_OPEN_EVENT = 'ntp-slot-open';
export const SLOT_READY_EVENT = 'ntp-slot-ready';

/**
 * @typedef {{
 *     children: import("preact").ComponentChild,
 *     index: number,
 *     name: string,
 *     id: string,
 * }} SlotItem
 */

/**
 * @param {object} props
 * @param {string} props.name
 */
export function Slot({ name }) {
    const [rows, setRows] = useState(/** @type {SlotItem[]} */ ([]));
    useLayoutEffect(() => {
        function handler() {
            setRows(getSlotCandidates(name));
        }
        handler();
        window.addEventListener(SLOT_UPDATE_EVENT + name, handler);
        return () => {
            window.removeEventListener(SLOT_UPDATE_EVENT + name, handler);
        };
    }, [name]);
    return (
        <Fragment>
            {rows.map((row) => {
                return <SlotTarget key={row.index + row.name} index={row.index} name={row.name} />;
            })}
        </Fragment>
    );
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 * @param {number} props.index - sort order
 * @param {string} props.name - name of the slot
 * @param {string} props.id -
 */
export function Fill({ children, index, name, id }) {
    const [ready, go] = useState(false);
    const portalRef = useRef(null);
    useEffect(() => {
        /**
         * register interest, send the `index` for sorting
         */
        const registrationHandler = (/** @type {CustomEvent<any>} */ e) => {
            e.detail.register({ index, name, id });
        };
        /**
         * When the portal target is ready
         */
        const readyHandler = (/** @type {CustomEvent<any>} */ e) => {
            if (e.detail.index === index && e.detail.name === name) {
                portalRef.current = e.detail.ref.current;
                go(true);
            }
        };

        window.addEventListener(SLOT_OPEN_EVENT + name, registrationHandler);
        window.addEventListener(SLOT_READY_EVENT + name, readyHandler);

        // trigger entry
        window.dispatchEvent(new Event(SLOT_UPDATE_EVENT + name));

        return () => {
            window.removeEventListener(SLOT_OPEN_EVENT + name, registrationHandler);
            window.removeEventListener(SLOT_READY_EVENT + name, readyHandler);

            // trigger exit
            window.dispatchEvent(new Event(SLOT_UPDATE_EVENT + name));
        };
    }, [index, name, id]);

    return portalRef.current && ready && createPortal(children, portalRef.current);
}

function SlotTarget({ name, index }) {
    const ref = useRef(null);
    useLayoutEffect(() => {
        window.dispatchEvent(new CustomEvent(SLOT_READY_EVENT + name, { detail: { ref, name, index } }));
    }, [name, index]);
    return <div ref={ref}></div>;
}

/**
 * @param {string} name
 * @returns {SlotItem[]}
 */
export function getSlotCandidates(name) {
    /** @type {SlotItem[]} */
    const next = [];
    const detail = {
        register: (/** @type {SlotItem} */ incoming) => {
            next.push(incoming);
        },
    };
    const event = new CustomEvent(SLOT_OPEN_EVENT + name, { detail });
    window.dispatchEvent(event);
    next.sort((a, b) => a.index - b.index);
    return next;
}
