import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useEffect, useRef } from 'preact/hooks';
import styles from './EmojiBurst.module.css';

const PIECES = 100;
export const DURATION_MS = 2400;
/** px/s² — strong enough that pieces arc back down within the duration */
const GRAVITY = 1700;
const FRAMES = 16;
/** Launches are staggered over this window so the eruption keeps going (total ≈ LAUNCH_WINDOW_MS + DURATION_MS) */
export const LAUNCH_WINDOW_MS = 1700;

/**
 * Full-screen confetti-style eruption of claps and ducks, fired from both bottom corners.
 * Renders once on mount and cleans up after itself.
 */
export function EmojiBurst() {
    const ref = useRef(/** @type {HTMLDivElement|null} */ (null));

    useEffect(() => {
        const root = ref.current;
        if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const width = window.innerWidth;
        const height = window.innerHeight;
        /** @type {Animation[]} */
        const animations = [];

        for (let i = 0; i < PIECES; i++) {
            const fromLeft = i % 2 === 0;
            const piece = document.createElement('span');
            piece.className = styles.piece;
            piece.textContent = Math.random() < 0.55 ? '👏' : '🦆';
            piece.style.fontSize = `${24 + Math.random() * 22}px`;
            piece.style.left = `${fromLeft ? width * 0.04 : width * 0.96}px`;
            piece.style.top = `${height + 20}px`;
            root.appendChild(piece);

            // Aim up and in towards the middle of the page
            const vx = (fromLeft ? 1 : -1) * (180 + Math.random() * 520);
            const vy = -(height * 1.15 + Math.random() * height * 0.75);
            const spin = (Math.random() - 0.5) * 900;
            const seconds = DURATION_MS / 1000;

            const keyframes = Array.from({ length: FRAMES + 1 }, (_, f) => {
                const progress = f / FRAMES;
                const t = progress * seconds;
                const x = vx * t;
                const y = vy * t + 0.5 * GRAVITY * t * t;
                return {
                    transform: `translate(${x}px, ${y}px) rotate(${spin * progress}deg)`,
                    opacity: progress < 0.75 ? 1 : 1 - (progress - 0.75) / 0.25,
                };
            });

            animations.push(
                piece.animate(keyframes, {
                    duration: DURATION_MS,
                    delay: Math.random() * LAUNCH_WINDOW_MS,
                    easing: 'linear',
                    fill: 'both',
                }),
            );
        }

        return () => {
            animations.forEach((animation) => animation.cancel());
            root.replaceChildren();
        };
    }, []);

    return createPortal(<div ref={ref} class={styles.overlay} aria-hidden="true" />, document.body);
}
