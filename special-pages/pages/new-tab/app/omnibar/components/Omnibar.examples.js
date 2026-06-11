import { h } from 'preact';
import { noop } from '../../utils.js';
import { suggestions } from '../mocks/omnibar.examples.data.js';
import { MockSearchFormProvider } from '../mocks/MockSearchFormProvider.js';
import { SearchForm } from './SearchForm.js';
import { SuggestionsList } from './SuggestionsList.js';
import styles from './Omnibar.module.css';

/**
 * @param {object} props
 * @param {import('preact').ComponentChildren} props.children
 */
function OmnibarShell({ children }) {
    return (
        <div style="width: 600px;">
            <div class={styles.popup}>
                <div class={styles.field}>{children}</div>
            </div>
        </div>
    );
}

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const omnibarExamples = {
    'omnibar.input-no-completion': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider term="pizza" suggestions={[]}>
                    <SearchForm
                        onOpenSuggestion={noop('onOpenSuggestion')}
                        onSubmit={noop('onSubmit')}
                        onSubmitChat={noop('onSubmitChat')}
                    />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.input-short-completion-short-suffix': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider
                    term="pizza"
                    suggestions={[suggestions.shortCompletionShortSuffix]}
                    selectedSuggestion={suggestions.shortCompletionShortSuffix}
                >
                    <SearchForm
                        onOpenSuggestion={noop('onOpenSuggestion')}
                        onSubmit={noop('onSubmit')}
                        onSubmitChat={noop('onSubmitChat')}
                    />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.input-short-completion-long-suffix': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider
                    term="pizza"
                    suggestions={[suggestions.shortCompletionLongSuffix]}
                    selectedSuggestion={suggestions.shortCompletionLongSuffix}
                >
                    <SearchForm
                        onOpenSuggestion={noop('onOpenSuggestion')}
                        onSubmit={noop('onSubmit')}
                        onSubmitChat={noop('onSubmitChat')}
                    />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.input-long-completion-short-suffix': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider
                    term="pizza"
                    suggestions={[suggestions.longCompletionShortSuffix]}
                    selectedSuggestion={suggestions.longCompletionShortSuffix}
                >
                    <SearchForm
                        onOpenSuggestion={noop('onOpenSuggestion')}
                        onSubmit={noop('onSubmit')}
                        onSubmitChat={noop('onSubmitChat')}
                    />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.input-long-completion-long-suffix': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider
                    term="pizza"
                    suggestions={[suggestions.longCompletionLongSuffix]}
                    selectedSuggestion={suggestions.longCompletionLongSuffix}
                >
                    <SearchForm
                        onOpenSuggestion={noop('onOpenSuggestion')}
                        onSubmit={noop('onSubmit')}
                        onSubmitChat={noop('onSubmitChat')}
                    />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.suggestions-all-types': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider term="pizza" suggestions={suggestions.allTypes}>
                    <SuggestionsList onOpenSuggestion={noop('onOpenSuggestion')} onSubmitChat={noop('onSubmitChat')} />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.suggestion-short-title-short-suffix': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider term="pizza" suggestions={[suggestions.shortTitleShortSuffix]}>
                    <SuggestionsList onOpenSuggestion={noop('onOpenSuggestion')} onSubmitChat={noop('onSubmitChat')} />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.suggestion-short-title-long-suffix': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider term="pizza" suggestions={[suggestions.shortTitleLongSuffix]}>
                    <SuggestionsList onOpenSuggestion={noop('onOpenSuggestion')} onSubmitChat={noop('onSubmitChat')} />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.suggestion-long-title-short-suffix': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider term="pizza" suggestions={[suggestions.longTitleShortSuffix]}>
                    <SuggestionsList onOpenSuggestion={noop('onOpenSuggestion')} onSubmitChat={noop('onSubmitChat')} />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
    'omnibar.suggestion-long-title-long-suffix': {
        factory: () => (
            <OmnibarShell>
                <MockSearchFormProvider term="pizza" suggestions={[suggestions.longTitleLongSuffix]}>
                    <SuggestionsList onOpenSuggestion={noop('onOpenSuggestion')} onSubmitChat={noop('onSubmitChat')} />
                </MockSearchFormProvider>
            </OmnibarShell>
        ),
    },
};
