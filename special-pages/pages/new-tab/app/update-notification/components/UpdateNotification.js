import { h } from 'preact';
import cn from 'classnames';
import styles from './UpdateNotification.module.css';
import { useContext, useId, useRef } from 'preact/hooks';
import { UpdateNotificationContext } from '../UpdateNotificationProvider.js';
import { useTypedTranslationWith } from '../../types.js';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { DismissButton } from '../../components/DismissButton';

/**
 * @param {object} props
 * @param {string[]} props.notes
 * @param {string} props.version
 * @param {() => void} [props.dismiss]
 */

export function UpdateNotification({ notes, dismiss, version }) {
    return (
        <div class={styles.root} data-reset-layout="true">
            <div class={cn('layout-centered', styles.body)}>
                {notes.length > 0 ? <WithNotes notes={notes} version={version} /> : <WithoutNotes version={version} />}
            </div>
            <DismissButton onClick={dismiss} className={styles.dismiss} />
        </div>
    );
}

export function WithNotes({ notes, version }) {
    const id = useId();
    const ref = useRef(/** @type {HTMLDetailsElement|null} */ (null));
    const { t } = useTypedTranslationWith(/** @type {import("../strings.json")} */ ({}));
    const inlineLink = (
        <Trans
            str={t('updateNotification_whats_new')}
            values={{
                a: {
                    href: `#${id}`,
                    class: styles.inlineLink,
                    click: (e) => {
                        e.preventDefault();
                        if (!ref.current) return;
                        ref.current.open = !ref.current.open;
                    },
                },
            }}
        />
    );
    return (
        <details ref={ref}>
            <summary tabIndex={-1} className={styles.summary}>
                {t('updateNotification_updated_version', { version })} {inlineLink}
            </summary>
            <div id={id} class={styles.detailsContent}>
                <ul class={styles.list}>
                    {notes.map((note, index) => {
                        return <li key={note + index}>{note}</li>;
                    })}
                </ul>
            </div>
        </details>
    );
}

export function WithoutNotes({ version }) {
    const { t } = useTypedTranslationWith(/** @type {import("../strings.json")} */ ({}));
    return <p>{t('updateNotification_updated_version', { version })}</p>;
}

export function UpdateNotificationConsumer() {
    const { state, dismiss } = useContext(UpdateNotificationContext);

    // `state.data.content` can be empty - meaning there's no message to display!
    if (state.status === 'ready' && state.data.content) {
        return <UpdateNotification notes={state.data.content.notes} version={state.data.content.version} dismiss={dismiss} />;
    }
    return null;
}
