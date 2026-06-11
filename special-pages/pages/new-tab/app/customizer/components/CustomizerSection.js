import styles from './CustomizerDrawerInner.module.css';
import { Fragment, h } from 'preact';
import cn from 'classnames';
import { NewBadge } from '../../components/NewBadge.js';

/**
 * @param {object} props
 * @param {import("preact").ComponentChild | null} props.title
 * @param {boolean} [props.showNewBadge]
 * @param {import("preact").ComponentChild} props.children
 */
export function CustomizerSection({ title, showNewBadge, children }) {
    return (
        <div className={styles.section}>
            {title === null && children}
            {title !== null && (
                <Fragment>
                    <h3 className={styles.sectionTitle}>
                        <span>{title}</span>
                        {showNewBadge && <NewBadge />}
                    </h3>
                    <div className={styles.sectionBody}>{children}</div>
                </Fragment>
            )}
        </div>
    );
}

/**
 * @param {object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function BorderedSection({ children }) {
    return <div class={cn(styles.section, styles.borderedSection)}>{children}</div>;
}
