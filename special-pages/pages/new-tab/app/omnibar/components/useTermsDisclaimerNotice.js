import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { Trans } from '../../../../../shared/components/TranslationsProvider.js';
import { useTypedTranslationWith } from '../../types';
import { useActiveTools } from './chat-tools/useActiveTools';
import { OmnibarContext } from './OmnibarProvider';
import styles from './NoticeDrawer.module.css';

/** @typedef {typeof import('../strings.json')} Strings */

export const TERMS_DISCLAIMER_ID = 'omnibar-terms-disclaimer';

/**
 * The Duck.ai terms disclaimer, shown until the user accepts the terms by submitting a chat.
 *
 * @returns {import('./NoticeDrawer.js').NoticePresentation | null}
 */
export function useTermsDisclaimerNotice() {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));
    const { state, openPrivacyTerms } = useContext(OmnibarContext);
    const { imageGenerationActive } = useActiveTools();

    if (state.config?.requiresAiTermsAcceptance !== true) return null;

    /** @param {MouseEvent} event */
    const onLinkClick = (event) => {
        event.preventDefault();
        openPrivacyTerms();
    };

    return {
        type: 'required',
        message: (
            <Trans
                str={imageGenerationActive ? t('omnibar_termsDisclaimerCreate') : t('omnibar_termsDisclaimerAsk')}
                values={{ a: { href: '#', class: styles.link, click: onLinkClick, auxclick: onLinkClick } }}
            />
        ),
        messageId: TERMS_DISCLAIMER_ID,
        secondaryText: '',
        icon: /** @type {const} */ ('shield'),
        muted: true,
    };
}
