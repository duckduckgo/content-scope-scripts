import { h } from 'preact';
import styles from './ToggleButton.module.css';

const RadioButton = {
    Selected: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="11" r="10" className={styles.radioCircle} />
            <path
                d="M16.7748 8.21423C17.0707 8.50409 17.0756 8.97894 16.7858 9.27484L12.2916 13.8626C11.507 14.6635 10.2174 14.6635 9.43279 13.8626L7.21423 11.5978C6.92437 11.3019 6.92927 10.8271 7.22516 10.5372C7.52106 10.2473 7.99591 10.2522 8.28577 10.5481L10.5043 12.8129C10.7008 13.0134 11.0236 13.0134 11.2201 12.8129L15.7142 8.22516C16.0041 7.92927 16.479 7.92437 16.7748 8.21423Z"
                className={styles.radioCheckmark}
            />
        </svg>
    ),
    Unselected: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="11" r="9.25" strokeWidth="1.5" className={styles.radioCircleUnselected} />
        </svg>
    ),
};

export function ToggleButton({ label, selected, onClick }) {
    return (
        <button className={`${styles.button} ${selected ? styles.selected : ''}`} onClick={onClick}>
            <span className={styles.buttonText}>{label}</span>
            <span className={styles.radioButton}>{selected ? <RadioButton.Selected /> : <RadioButton.Unselected />}</span>
        </button>
    );
}
