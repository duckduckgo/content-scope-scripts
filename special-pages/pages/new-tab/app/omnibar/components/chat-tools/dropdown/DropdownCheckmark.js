import { h } from 'preact';
import { usePlatformName } from '../../../../settings.provider.js';
import styles from './Dropdown.module.css';

/** Leading gutter of a {@link DropdownItem}; shows the platform's check when the row is selected. */
export function DropdownCheckmark() {
    const platformName = usePlatformName();
    return (
        <span class={styles.checkmark} aria-hidden="true">
            {platformName === 'windows' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M15.0303 2.96967C15.3232 3.26256 15.3232 3.73744 15.0303 4.03033L6.03033 13.0303C5.73744 13.3232 5.26256 13.3232 4.96967 13.0303L0.96967 9.03033C0.676777 8.73744 0.676777 8.26256 0.96967 7.96967C1.26256 7.67678 1.73744 7.67678 2.03033 7.96967L5.5 11.4393L13.9697 2.96967C14.2626 2.67678 14.7374 2.67678 15.0303 2.96967Z"
                        fill="currentColor"
                    />
                </svg>
            ) : (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M10.0615 1.17262C10.5185 1.48273 10.6376 2.1046 10.3275 2.5616L5.57748 9.5616C5.40579 9.81462 5.12778 9.97518 4.82282 9.99745C4.51786 10.0197 4.21947 9.90122 4.01285 9.67582L1.26285 6.67582C0.889659 6.2687 0.917162 5.63614 1.32428 5.26294C1.7314 4.88975 2.36397 4.91726 2.73716 5.32437L4.63262 7.39215L8.67253 1.4386C8.98264 0.981595 9.60451 0.862514 10.0615 1.17262Z"
                        fill="currentColor"
                    />
                </svg>
            )}
        </span>
    );
}
