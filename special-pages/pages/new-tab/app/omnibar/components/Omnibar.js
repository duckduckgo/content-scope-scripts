import { useState } from 'preact/hooks';
import { h, Fragment } from 'preact';
import cn from 'classnames';
import { useTypedTranslationWith } from '../../types.js';
import styles from './Omnibar.module.css';

/**
 * @typedef {import('../strings.json')} Strings
 * @typedef {import('../../../types/new-tab.js').OmnibarConfig} OmnibarConfig
 * @typedef {import('../../../types/new-tab.js').SuggestionsData} SuggestionsData
 * @typedef {import('../../../types/new-tab.js').Suggestion} Suggestion
 * @typedef {import('../../../types/new-tab.js').OpenTarget} OpenTarget
 */

/**
 * @param {object} props
 * @param {OmnibarConfig['mode']} props.mode
 * @param {(mode: OmnibarConfig['mode']) => void} props.setMode
 * @param {(term: string) => Promise<SuggestionsData>} props.getSuggestions
 * @param {(params: {suggestion: Suggestion, target: OpenTarget}) => void} props.openSuggestion
 * @param {(params: {term: string, target: OpenTarget}) => void} props.submitSearch
 * @param {(params: {chat: string, target: OpenTarget}) => void} props.submitChat
 */
export function Omnibar(props) {
    const { t } = useTypedTranslationWith(/** @type {Strings} */ ({}));

    return <div class={styles.root}>Omnibar goes here. Mode = {props.mode}</div>;
}
