import { h } from 'preact';
import { useEffect, useId, useRef } from 'preact/hooks';
import { EYE_PATHS } from './eye-paths.js';
import styles from './ProtectionsReport.module.css';

/** Outline of the iris disc, used to clip the reflection */
const IRIS_SHAPE = EYE_PATHS.find((p) => p.irisShape)?.d;

/**
 * The eye white, in the artwork's 144x144 units. `margin` keeps a sliver of
 * white around the iris at full stretch; `falloff` is the pointer distance
 * (in CSS px) at which the iris reaches ~76% of its travel. `upward` scales
 * travel above centre, which otherwise looks too high. `upwardSensitivity`
 * exaggerates pointer distance above the eye: it sits near the top of the
 * card, so there's little room above it to look up into. `reflection` is how
 * far the white highlight moves relative to the iris: a little parallax reads
 * as a glint on a curved surface, rather than a sticker on the iris. Much
 * below ~0.75 the highlight lags far enough to slide off the iris at full
 * stretch (it's ~10 units from the iris centre with ~16 units of room).
 */
const EYE = {
    cx: 72.07,
    cy: 71.95,
    r: 47.3,
    margin: 2,
    falloff: 160,
    upward: 0.7,
    upwardSensitivity: 2.5,
    reflection: 0.75,
};

/**
 * Decorative eye illustration. While the pointer is inside `zoneRef`, the iris
 * looks towards it; when it leaves, the iris eases back to rest.
 *
 * The artwork is mirrored so it peeks in from the right edge of the card,
 * which is why the horizontal pointer offset is inverted below.
 *
 * @param {object} props
 * @param {import('preact').RefObject<HTMLElement>} props.zoneRef - element whose pointer movement the eye follows
 * @param {boolean} props.tracking - false disables following (eg: reduced motion, collapsed widget)
 */
export function PryingEye({ zoneRef, tracking }) {
    const clipId = useId();
    const irisClipId = useId();
    const svgRef = useRef(/** @type {SVGSVGElement|null} */ (null));
    const irisRef = useRef(/** @type {SVGGElement|null} */ (null));
    // the reflection is clipped to the iris, so this moves with it
    const irisClipRef = useRef(/** @type {SVGPathElement|null} */ (null));
    const reflectionRef = useRef(/** @type {SVGGElement|null} */ (null));
    /** Where the pointer last was inside the zone, kept even while not tracking */
    const lastPointer = useRef(/** @type {{x: number, y: number} | null} */ (null));

    useEffect(() => {
        const zone = zoneRef.current;
        if (!zone) return;
        /** @param {PointerEvent} e */
        const remember = (e) => {
            lastPointer.current = { x: e.clientX, y: e.clientY };
        };
        const forget = () => {
            lastPointer.current = null;
        };
        zone.addEventListener('pointermove', remember, { passive: true });
        zone.addEventListener('pointerdown', remember, { passive: true });
        zone.addEventListener('pointerleave', forget);
        return () => {
            zone.removeEventListener('pointermove', remember);
            zone.removeEventListener('pointerdown', remember);
            zone.removeEventListener('pointerleave', forget);
        };
    }, [zoneRef]);

    useEffect(() => {
        const zone = zoneRef.current;
        const iris = irisRef.current;
        if (!zone || !iris || !tracking) return;

        let frame = 0;
        // start from wherever the pointer already is (eg: it just clicked
        // expand), so the eye looks over straight away instead of waiting
        // for the next movement
        let pointer = lastPointer.current;

        /**
         * @param {number} x - iris offset from rest, in artwork units
         * @param {number} y
         * @param {string} transition
         */
        const move = (x, y, transition) => {
            const reflection = reflectionRef.current;
            const targets = /** @type {[Element | null, number][]} */ ([
                [iris, 1],
                [irisClipRef.current, 1],
                [reflection, EYE.reflection],
            ]);
            for (const [el, scale] of targets) {
                if (!(el instanceof SVGElement)) continue;
                el.style.transition = transition;
                el.style.transform = `translate(${(x * scale).toFixed(1)}px, ${(y * scale).toFixed(1)}px)`;
            }
        };

        const rest = () => {
            move(0, 0, 'transform 700ms cubic-bezier(.4,0,.2,1)');
        };

        // The iris is drawn off-centre, looking down and to the side. Measure it
        // (untransformed) so we know where it rests and how far it can travel
        // before it would leave the eye white.
        const box = iris.getBBox();
        const restX = box.x + box.width / 2;
        const restY = box.y + box.height / 2;
        const reach = Math.max(0, EYE.r - Math.max(box.width, box.height) / 2 - EYE.margin);

        const aim = () => {
            frame = 0;
            const svg = svgRef.current;
            if (!pointer || !svg) return;
            const r = svg.getBoundingClientRect();
            if (!r.width) return;
            // the artwork is mirrored, so screen-right is artwork-left
            const dx = -(pointer.x - (r.left + r.width / 2));
            const rawDy = pointer.y - (r.top + r.height / 2);
            const dy = rawDy < 0 ? rawDy * EYE.upwardSensitivity : rawDy;
            const dist = Math.hypot(dx, dy);
            // ease towards the edge as the pointer gets further away
            const travel = reach * Math.tanh(dist / EYE.falloff);
            const targetX = EYE.cx + (dist ? (dx / dist) * travel : 0);
            const targetY = EYE.cy + (dist ? (dy / dist) * travel * (dy < 0 ? EYE.upward : 1) : 0);
            move(targetX - restX, targetY - restY, 'transform 240ms ease-out');
        };

        /** @param {PointerEvent} e */
        const onMove = (e) => {
            pointer = { x: e.clientX, y: e.clientY };
            if (!frame) frame = requestAnimationFrame(aim);
        };
        const onLeave = () => {
            pointer = null;
            cancelAnimationFrame(frame);
            frame = 0;
            rest();
        };

        zone.addEventListener('pointermove', onMove, { passive: true });
        zone.addEventListener('pointerleave', onLeave);
        if (pointer) frame = requestAnimationFrame(aim);
        return () => {
            zone.removeEventListener('pointermove', onMove);
            zone.removeEventListener('pointerleave', onLeave);
            cancelAnimationFrame(frame);
            rest();
        };
    }, [zoneRef, tracking]);

    /** @param {(typeof EYE_PATHS)[number]} p */
    const path = (p) => <path key={p.d} d={p.d} fill={p.fill} stroke={p.stroke} stroke-width={p.strokeWidth} />;

    return (
        <svg ref={svgRef} class={styles.eye} viewBox="0 0 144 144" fill="none" aria-hidden="true" data-testid="PryingEye">
            <defs>
                <clipPath id={clipId}>
                    <circle cx={EYE.cx} cy={EYE.cy} r={EYE.r} />
                </clipPath>
                <clipPath id={irisClipId}>
                    <path ref={irisClipRef} d={IRIS_SHAPE} />
                </clipPath>
            </defs>
            {EYE_PATHS.filter((p) => !p.iris && !p.reflection).map(path)}
            <g clip-path={`url(#${clipId})`}>
                <g ref={irisRef}>{EYE_PATHS.filter((p) => p.iris).map(path)}</g>
                {/* moves less than the iris (see EYE.reflection), and is clipped to
                    it so it never floats on the white */}
                <g clip-path={`url(#${irisClipId})`}>
                    <g ref={reflectionRef}>{EYE_PATHS.filter((p) => p.reflection).map(path)}</g>
                </g>
            </g>
        </svg>
    );
}
