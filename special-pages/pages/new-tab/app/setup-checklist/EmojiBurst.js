import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useRef } from 'preact/hooks';
import styles from './EmojiBurst.module.css';

const FRAMES = 16;

/**
 * @typedef {object} BurstPiece
 * @property {number} x - start position, px from the viewport's left edge
 * @property {number} y - start position, px from the viewport's top edge
 * @property {number} vx - px/s
 * @property {number} vy - px/s (negative is up)
 * @property {number} size - font size in px
 * @property {number} delay - ms
 */

/**
 * Full screen: confetti fired from both bottom corners, arcing across the whole page.
 *
 * @returns {BurstPiece[]}
 */
function screenPieces() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return Array.from({ length: 44 }, (_, i) => {
        const fromLeft = i % 2 === 0;
        return {
            x: fromLeft ? width * 0.04 : width * 0.96,
            y: height + 20,
            vx: (fromLeft ? 1 : -1) * (180 + Math.random() * 520),
            vy: -(height * 1.15 + Math.random() * height * 0.75),
            size: 24 + Math.random() * 22,
            delay: Math.random() * 350,
        };
    });
}

/**
 * Ring: a small fountain fanning upwards out of the progress ring.
 *
 * @param {Element} origin
 * @returns {BurstPiece[]}
 */
function ringPieces(origin) {
    const rect = origin.getBoundingClientRect();
    return Array.from({ length: 22 }, () => {
        // Fan between 20° and 160° above the horizon
        const angle = ((200 + Math.random() * 140) * Math.PI) / 180;
        const speed = 380 + Math.random() * 340;
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 18 + Math.random() * 12,
            delay: Math.random() * 120,
        };
    });
}

const VARIANTS = {
    screen: { duration: 2400, gravity: 1700 },
    ring: { duration: 1500, gravity: 1300 },
};

/**
 * Eruption of claps and ducks for finishing the checklist. Renders once on mount and cleans up after itself.
 *
 * @param {object} props
 * @param {'screen'|'ring'} props.variant
 * @param {import('preact').RefObject<Element>} [props.originRef] - where the ring variant erupts from
 */
export function EmojiBurst({ variant, originRef }) {
    const ref = useRef(/** @type {HTMLDivElement|null} */ (null));

    useEffect(() => {
        const root = ref.current;
        if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const origin = originRef?.current;
        const pieces = variant === 'ring' && origin ? ringPieces(origin) : screenPieces();
        const { duration, gravity } = VARIANTS[variant];
        const seconds = duration / 1000;

        const animations = pieces.map((p) => {
            const piece = document.createElement('span');
            piece.className = styles.piece;
            piece.textContent = Math.random() < 0.55 ? '👏' : '🦆';
            piece.style.fontSize = `${p.size}px`;
            piece.style.left = `${p.x}px`;
            piece.style.top = `${p.y}px`;
            root.appendChild(piece);

            const spin = (Math.random() - 0.5) * 900;
            const keyframes = Array.from({ length: FRAMES + 1 }, (_, f) => {
                const progress = f / FRAMES;
                const t = progress * seconds;
                const x = p.vx * t;
                const y = p.vy * t + 0.5 * gravity * t * t;
                return {
                    transform: `translate(${x}px, ${y}px) rotate(${spin * progress}deg) scale(${variant === 'ring' ? Math.min(1, 0.4 + progress * 4) : 1})`,
                    opacity: progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3,
                };
            });

            return piece.animate(keyframes, { duration, delay: p.delay, easing: 'linear', fill: 'both' });
        });

        return () => {
            animations.forEach((animation) => animation.cancel());
            root.replaceChildren();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- fires once per celebration
    }, []);

    return createPortal(<div ref={ref} class={styles.overlay} aria-hidden="true" />, document.body);
}
