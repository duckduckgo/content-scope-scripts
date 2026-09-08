import { h } from 'preact';
import styles from './Icons.module.css';

/**
 * BounceIn animates the given children by applying bounce-in animation effect using CSS.
 *
 * @param {Object} props - The props object containing children.
 * @param {import("preact").ComponentChild} props.children - The children nodes to apply bounce-in animation effect.
 * @param {'none' | 'normal' | 'double'} [props.delay="none"] - The children nodes to apply bounce-in animation effect.
 */
export function BounceIn({ children, delay = 'none' }) {
    return (
        <div className={styles.bounceIn} data-delay={delay}>
            {children}
        </div>
    );
}

/**
 * A simple fade-in wrapper
 *
 * @param {Object} props - The props object containing children.
 * @param {import("preact").ComponentChild} props.children - The children nodes to apply bounce-in animation effect.
 * @param {'none' | 'normal' | 'double'} [props.delay="none"] - The children nodes to apply bounce-in animation effect.
 */
export function FadeIn({ children, delay = 'none' }) {
    return (
        <div className={styles.fadeIn} data-delay={delay}>
            {children}
        </div>
    );
}

/**
 * SlideIn animates the given children by applying bounce-in animation effect using CSS.
 *
 * @param {Object} props - The props object containing children.
 * @param {import("preact").ComponentChild} props.children - The children nodes to apply bounce-in animation effect.
 * @param {'none' | 'normal' | 'double'} [props.delay="none"] - The children nodes to apply bounce-in animation effect.
 */
export function SlideIn({ children, delay = 'none' }) {
    return (
        <div className={styles.slideIn} data-delay={delay}>
            {children}
        </div>
    );
}

/**
 * SlideIn animates the given children by applying bounce-in animation effect using CSS.
 *
 * @param {Object} props - The props object containing children.
 * @param {import("preact").ComponentChild} props.children - The children nodes to apply bounce-in animation effect.
 * @param {'none' | 'normal' | 'double'} [props.delay="none"] - The children nodes to apply bounce-in animation effect.
 */
export function SlideUp({ children, delay = 'none' }) {
    return (
        <div className={styles.slideUp} data-delay={delay}>
            {children}
        </div>
    );
}

export function Play() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M1 10.2768V1.72318C1 0.955357 1.82948 0.47399 2.49614 0.854937L9.98057 5.13176C10.6524 5.51565 10.6524 6.48435 9.98057 6.86824L2.49614 11.1451C1.82948 11.526 1 11.0446 1 10.2768Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function Launch() {
    return (
        <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_3098_23365)">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12.0465 7.31875C11.269 8.09623 10.0085 8.09623 9.23102 7.31875C8.45354 6.54128 8.45354 5.28074 9.23102 4.50327C10.0085 3.7258 11.269 3.7258 12.0465 4.50327C12.824 5.28074 12.824 6.54128 12.0465 7.31875ZM11.1626 6.43487C10.8733 6.72419 10.4042 6.72419 10.1149 6.43487C9.82558 6.14555 9.82558 5.67647 10.1149 5.38715C10.4042 5.09783 10.8733 5.09783 11.1626 5.38715C11.4519 5.67647 11.4519 6.14555 11.1626 6.43487Z"
                    fill="currentColor"
                    fill-opacity="0.84"
                />
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M15.0163 0.357982C10.4268 0.792444 7.29295 2.76331 5.19328 5.43188C5.03761 5.41854 4.88167 5.40999 4.72564 5.40608C3.54981 5.37661 2.36922 5.61098 1.26629 6.0488C0.653083 6.29222 0.543501 7.07682 1.01002 7.54334L2.92009 9.45341C2.86071 9.6032 2.80326 9.75371 2.74768 9.90485C2.61756 10.2587 2.71271 10.6538 2.97932 10.9204L5.62864 13.5698C5.89525 13.8364 6.29037 13.9315 6.64424 13.8014C6.79555 13.7458 6.94624 13.6882 7.0962 13.6288L9.0054 15.538C9.47191 16.0045 10.2565 15.8949 10.4999 15.2817C10.9378 14.1788 11.1721 12.9982 11.1427 11.8224C11.1388 11.6668 11.1302 11.5112 11.117 11.356C13.7857 9.25633 15.7566 6.1224 16.1911 1.53282C16.2296 1.12649 16.256 0.708745 16.2698 0.279297C15.8403 0.293094 15.4226 0.319516 15.0163 0.357982ZM3.9867 10.1601L6.38903 12.5624C8.6807 11.6928 10.7461 10.3775 12.2764 8.46444C13.2183 7.28687 13.9808 5.85389 14.4628 4.10497L12.4441 2.08628C10.6952 2.56825 9.26222 3.33082 8.08465 4.27272C6.17156 5.80296 4.85624 7.86839 3.9867 10.1601ZM2.25561 7.02117C2.84462 6.83216 3.44604 6.71284 4.04467 6.67074L3.29585 8.06141L2.25561 7.02117ZM9.52757 14.2924C9.71658 13.7034 9.8359 13.102 9.878 12.5033L8.48733 13.2522L9.52757 14.2924ZM14.7828 2.65724L13.8919 1.76626C14.2259 1.7093 14.5703 1.6616 14.9253 1.62375C14.8875 1.97878 14.8398 2.32317 14.7828 2.65724Z"
                    fill="currentColor"
                    fill-opacity="0.84"
                />
                <path
                    d="M4.98318 13.664C5.19417 13.9372 5.14374 14.3297 4.87055 14.5407C3.96675 15.2387 2.81266 15.6173 1.50788 15.7098L0.78927 15.7608L0.840231 15.0422C0.932761 13.7374 1.31133 12.5833 2.00934 11.6795C2.22032 11.4063 2.61283 11.3559 2.88602 11.5669C3.15921 11.7779 3.20963 12.1704 2.99865 12.4436C2.60779 12.9497 2.32977 13.5927 2.18426 14.3658C2.95736 14.2203 3.60041 13.9423 4.1065 13.5514C4.37969 13.3404 4.77219 13.3909 4.98318 13.664Z"
                    fill="currentColor"
                    fill-opacity="0.84"
                />
            </g>
            <defs>
                <clipPath id="clip0_3098_23365">
                    <rect width="16" height="16" fill="white" transform="translate(0.5)" />
                </clipPath>
            </defs>
        </svg>
    );
}
