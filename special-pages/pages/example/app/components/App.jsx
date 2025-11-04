import { h } from 'preact';
import styles from './App.module.css';
import { useTypedTranslation } from '../types.js';

export function App() {
    const { t } = useTypedTranslation();
    return <main class={styles.main}>
        <h1>Hi There! This is a sample change!</h1>
        <p>{t('helloWorld')}</p>
        </main>;
}
