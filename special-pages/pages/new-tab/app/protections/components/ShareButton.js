import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import styles from './ProtectionsReport.module.css';
import { ShareIcon } from '../../components/Icons.js';
import { CAPTURE_EXCLUDE, prepareShareImage, shareAsImage, whenSettled } from '../utils/share-image.js';
import { useReportTranslation } from './report-text.js';

/**
 * The shared picture shows a copy of the report rather than the report
 * itself: the copy speaks in the reader's voice ("me"), so it reads right
 * when they post it, and capturing it leaves the report on the page alone.
 * It's laid out off-screen at the report's width, only while it's needed:
 * from when a share looks likely (the pointer reaches the button) until it's
 * done.
 *
 * @param {import('preact').RefObject<HTMLElement>} liveRef - the report on the page
 */
export function useShareCopy(liveRef) {
    const [width, setWidth] = useState(/** @type {number | null} */ (null));
    const copyRef = useRef(/** @type {HTMLElement | null} */ (null));

    return {
        width,
        copyRef,
        /** Removes the copy; the next share lays it out again */
        release: () => setWidth(null),
        /**
         * The copy, once it's laid out and its images have loaded.
         *
         * @return {Promise<HTMLElement | null>}
         */
        ready: async () => {
            const live = liveRef.current;
            if (!live) return null;
            setWidth(live.offsetWidth);
            return await whenSettled(() => copyRef.current);
        },
    };
}

/**
 * @typedef {ReturnType<typeof useShareCopy>} ShareCopy
 */

/** Name of the downloaded picture */
const SHARE_FILENAME = 'duckduckgo-protections-report.png';

/**
 * Shares a picture of the report through the system share sheet, or
 * downloads it where sharing files isn't available.
 *
 * @param {object} props
 * @param {ShareCopy | null} props.copy - the copy of the report to capture; `null` in the copy itself
 */
export function ShareButton({ copy }) {
    const { t } = useReportTranslation();
    const [busy, setBusy] = useState(false);
    // read by handlers that can run before a re-render (eg: a second click)
    const busyRef = useRef(false);
    const engaged = useRef(false);
    const strings = () => ({
        title: t('protections_report_shareTitle'),
        body: t('protections_report_shareBody'),
        cta: t('protections_report_shareCta'),
    });
    // a click usually follows, so get the copy and the slow part of the picture ready now
    const prepare = async () => {
        engaged.current = true;
        if (!copy || busyRef.current) return;
        const node = await copy.ready();
        if (node) await prepareShareImage(node, strings());
    };
    const disengage = () => {
        engaged.current = false;
        if (!busyRef.current) copy?.release();
    };
    const share = async () => {
        if (!copy || busyRef.current) return;
        busyRef.current = true;
        setBusy(true);
        try {
            const node = await copy.ready();
            if (!node) throw new Error('the report has gone');
            await shareAsImage(node, SHARE_FILENAME, strings());
        } catch (e) {
            // eg: a resource the capture couldn't read; nothing useful to show the user
            console.warn('Could not save the Protections Report as an image', e);
        } finally {
            busyRef.current = false;
            setBusy(false);
            if (!engaged.current) copy.release();
        }
    };

    // the button can go without a pointerleave or blur (eg: switching to a
    // view that isn't offered for sharing), and the copy should go with it
    const disengageRef = useRef(disengage);
    disengageRef.current = disengage;
    useEffect(() => () => disengageRef.current(), []);

    return (
        <button
            type="button"
            class={styles.shareButton}
            aria-label={t('protections_report_shareLabel')}
            title={t('protections_report_shareLabel')}
            // not `disabled`: that would drop keyboard focus, and pointer
            // events, while the picture is made
            aria-disabled={busy}
            aria-busy={busy}
            onClick={copy ? share : undefined}
            onPointerEnter={copy ? prepare : undefined}
            onPointerLeave={copy ? disengage : undefined}
            onFocus={copy ? prepare : undefined}
            onBlur={copy ? disengage : undefined}
            data-testid={copy ? 'ProtectionsReportShare' : undefined}
            {...{ [CAPTURE_EXCLUDE]: '' }}
        >
            <ShareIcon aria-hidden="true" />
        </button>
    );
}
