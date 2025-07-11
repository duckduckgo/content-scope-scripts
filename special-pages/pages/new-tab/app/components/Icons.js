import { h } from 'preact';
import styles from './Icons.module.css';

export function Chevron() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12.0694 9.48822C11.7999 9.80271 11.3264 9.83913 11.0119 9.56956L7.99999 6.98793L4.98808 9.56956C4.67359 9.83913 4.20011 9.80271 3.93054 9.48822C3.66098 9.17372 3.6974 8.70025 4.01189 8.43068L7.51189 5.43068C7.79276 5.18994 8.20721 5.18994 8.48808 5.43068L11.9881 8.43068C12.3026 8.70025 12.339 9.17372 12.0694 9.48822Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function ChevronSmall() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M3.93057 6.51191C4.20014 6.19741 4.67361 6.16099 4.98811 6.43056L8.00001 9.01219L11.0119 6.43056C11.3264 6.16099 11.7999 6.19741 12.0695 6.51191C12.339 6.8264 12.3026 7.29988 11.9881 7.56944L8.48811 10.5694C8.20724 10.8102 7.79279 10.8102 7.51192 10.5694L4.01192 7.56944C3.69743 7.29988 3.661 6.8264 3.93057 6.51191Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function CustomizeIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class={styles.customize}>
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M4.5 1C2.567 1 1 2.567 1 4.5C1 6.433 2.567 8 4.5 8C6.17556 8 7.57612 6.82259 7.91946 5.25H14.375C14.7202 5.25 15 4.97018 15 4.625C15 4.27982 14.7202 4 14.375 4H7.96456C7.72194 2.30385 6.26324 1 4.5 1ZM2.25 4.5C2.25 3.25736 3.25736 2.25 4.5 2.25C5.74264 2.25 6.75 3.25736 6.75 4.5C6.75 5.74264 5.74264 6.75 4.5 6.75C3.25736 6.75 2.25 5.74264 2.25 4.5Z"
                fill="currentColor"
            />
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8.03544 12H1.625C1.27982 12 1 11.7202 1 11.375C1 11.0298 1.27982 10.75 1.625 10.75H8.08054C8.42388 9.17741 9.82444 8 11.5 8C13.433 8 15 9.567 15 11.5C15 13.433 13.433 15 11.5 15C9.73676 15 8.27806 13.6961 8.03544 12ZM9.25 11.5C9.25 10.2574 10.2574 9.25 11.5 9.25C12.7426 9.25 13.75 10.2574 13.75 11.5C13.75 12.7426 12.7426 13.75 11.5 13.75C10.2574 13.75 9.25 12.7426 9.25 11.5Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function DuckFoot() {
    return (
        <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
            <path
                clip-rule="evenodd"
                fill="currentColor"
                d="M6.483.612A2.13 2.13 0 0 1 7.998 0c.56.001 1.115.215 1.512.62.673.685 1.26 1.045 1.852 1.228.594.185 1.31.228 2.311.1a2.175 2.175 0 0 1 1.575.406c.452.34.746.862.75 1.445.033 3.782-.518 6.251-1.714 8.04-1.259 1.882-3.132 2.831-5.045 3.8l-.123.063-.003.001-.125.063a2.206 2.206 0 0 1-1.976 0l-.124-.063-.003-.001-.124-.063c-1.913-.969-3.786-1.918-5.045-3.8C.52 10.05-.031 7.58 0 3.798a1.83 1.83 0 0 1 .75-1.444 2.175 2.175 0 0 1 1.573-.407c1.007.127 1.725.076 2.32-.114.59-.189 1.172-.551 1.839-1.222Zm2.267 1.36v12.233c1.872-.952 3.311-1.741 4.287-3.2.949-1.42 1.493-3.529 1.462-7.194 0-.072-.037-.17-.152-.257a.677.677 0 0 0-.484-.118c-1.126.144-2.075.115-2.945-.155-.77-.239-1.47-.664-2.168-1.309Zm-1.5 12.233V1.955c-.69.635-1.383 1.063-2.15 1.308-.87.278-1.823.317-2.963.174a.677.677 0 0 0-.484.117c-.115.087-.151.186-.152.258-.03 3.664.513 5.774 1.462 7.192.976 1.46 2.415 2.249 4.287 3.201Z"
            ></path>
        </svg>
    );
}

export function Shield() {
    return (
        <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.341 1.367c.679-1.375 2.64-1.375 3.318 0l1.366 2.767a.35.35 0 0 0 .264.192l3.054.444c1.517.22 2.123 2.085 1.025 3.155l-2.21 2.155a.35.35 0 0 0-.1.31l.521 3.041c.26 1.512-1.327 2.664-2.684 1.95l-2.732-1.436a.35.35 0 0 0-.326 0l-2.732 1.437c-1.357.713-2.943-.44-2.684-1.95l.522-3.043a.35.35 0 0 0-.1-.31L.631 7.926C-.466 6.855.14 4.99 1.657 4.77l3.055-.444a.35.35 0 0 0 .263-.192l1.366-2.767Zm1.973.664a.35.35 0 0 0-.628 0L6.32 4.798A1.85 1.85 0 0 1 4.927 5.81l-3.054.444a.35.35 0 0 0-.194.597l2.21 2.154a1.85 1.85 0 0 1 .532 1.638L3.9 13.685a.35.35 0 0 0 .508.369l2.732-1.436a1.85 1.85 0 0 1 1.722 0l2.732 1.436a.35.35 0 0 0 .508-.369l-.522-3.042a1.85 1.85 0 0 1 .532-1.638l2.21-2.154a.35.35 0 0 0-.194-.597l-3.054-.444A1.85 1.85 0 0 1 9.68 4.798L8.314 2.031Z"
                fill="currentColor"
            ></path>
        </svg>
    );
}

export function Cross() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M11.4419 5.44194C11.686 5.19786 11.686 4.80214 11.4419 4.55806C11.1979 4.31398 10.8021 4.31398 10.5581 4.55806L8 7.11612L5.44194 4.55806C5.19786 4.31398 4.80214 4.31398 4.55806 4.55806C4.31398 4.80214 4.31398 5.19786 4.55806 5.44194L7.11612 8L4.55806 10.5581C4.31398 10.8021 4.31398 11.1979 4.55806 11.4419C4.80214 11.686 5.19786 11.686 5.44194 11.4419L8 8.88388L10.5581 11.4419C10.8021 11.686 11.1979 11.686 11.4419 11.4419C11.686 11.1979 11.686 10.8021 11.4419 10.5581L8.88388 8L11.4419 5.44194Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function CheckColor() {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4CBA3C" d="M15.5 8a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0" />
            <path
                fill="#fff"
                fill-rule="evenodd"
                d="M11.844 5.137a.5.5 0 0 1 .019.707l-4.5 4.75a.5.5 0 0 1-.733-.008l-2.5-2.75a.5.5 0 0 1 .74-.672l2.138 2.351 4.129-4.359a.5.5 0 0 1 .707-.019"
                clip-rule="evenodd"
            />
            <path
                fill="#288419"
                fill-rule="evenodd"
                d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8"
                clip-rule="evenodd"
            />
        </svg>
    );
}

export function CircleCheck() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_1635_18497)">
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12ZM17.5737 9.25013C17.9189 8.86427 17.886 8.27159 17.5001 7.92635C17.1143 7.5811 16.5216 7.61403 16.1764 7.99989L10.5319 14.3084L7.85061 11.0313C7.52274 10.6306 6.9321 10.5716 6.53137 10.8994C6.13064 11.2273 6.07157 11.8179 6.39944 12.2187L9.77444 16.3437C9.94792 16.5557 10.2054 16.6812 10.4793 16.6873C10.7532 16.6933 11.016 16.5793 11.1987 16.3751L17.5737 9.25013Z"
                    fill="currentColor"
                    fill-opacity="0.6"
                />
            </g>
            <defs>
                <clipPath id="clip0_1635_18497">
                    <rect width="24" height="24" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
}

export function Picker() {
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M20.5588 3.44118C19.3873 2.26961 17.4878 2.26961 16.3162 3.44118L16.1527 3.60466C16.1473 3.61004 16.1418 3.61544 16.1364 3.62087L12.5858 7.17141L11.7071 6.29268C11.3166 5.90216 10.6834 5.90216 10.2929 6.29268C9.90239 6.68321 9.90239 7.31637 10.2929 7.7069L11.1717 8.58568L3.44124 16.3161C2.26967 17.4877 2.26967 19.3872 3.44124 20.5588C4.61281 21.7304 6.51231 21.7304 7.68388 20.5588L15.4143 12.8283L16.2929 13.7069C16.6834 14.0974 17.3166 14.0974 17.7071 13.7069C18.0977 13.3164 18.0977 12.6832 17.7071 12.2927L16.8286 11.4141L20.5588 7.68382C21.7304 6.51225 21.7304 4.61275 20.5588 3.44118ZM12.5859 9.9999L4.85545 17.7304C4.46493 18.1209 4.46493 18.754 4.85545 19.1446C5.24598 19.5351 5.87914 19.5351 6.26967 19.1446L14.0001 11.4141L12.5859 9.9999Z"
                fill="currentColor"
                fill-opacity="0.84"
            />
        </svg>
    );
}

export function PlusIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8.25 0.5C8.66421 0.5 9 0.835786 9 1.25V7H14.75C15.1642 7 15.5 7.33579 15.5 7.75C15.5 8.16421 15.1642 8.5 14.75 8.5H9V14.25C9 14.6642 8.66421 15 8.25 15C7.83579 15 7.5 14.6642 7.5 14.25V8.5H1.75C1.33579 8.5 1 8.16421 1 7.75C1 7.33579 1.33579 7 1.75 7H7.5V1.25C7.5 0.835786 7.83579 0.5 8.25 0.5Z"
                fill="currentColor"
            />
        </svg>
    );
}

export function BackChevron() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M10.4419 3.18306C10.686 3.42714 10.686 3.82286 10.4419 4.06694L6.50888 8L10.4419 11.9331C10.686 12.1771 10.686 12.5729 10.4419 12.8169C10.1979 13.061 9.80214 13.061 9.55806 12.8169L5.18306 8.44194C4.93898 8.19786 4.93898 7.80214 5.18306 7.55806L9.55806 3.18306C9.80214 2.93898 10.1979 2.93898 10.4419 3.18306Z"
                fill="currentColor"
                fill-opacity="0.84"
            />
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Glyphs/16px/Find-Search-16.svg. Inline SVG so that can be styled with CSS.
 * @param {import('preact').JSX.SVGAttributes<SVGSVGElement>} props
 */
export function SearchIcon(props) {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
            <g clip-path="url(#Find-Search-16_svg__a)">
                <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M7 0a7 7 0 1 0 4.488 12.372l3.445 3.445a.625.625 0 1 0 .884-.884l-3.445-3.445A7 7 0 0 0 7 0M1.25 7a5.75 5.75 0 1 1 11.5 0 5.75 5.75 0 0 1-11.5 0"
                    clip-rule="evenodd"
                />
            </g>
            <defs>
                <clipPath id="Find-Search-16_svg__a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Color/16px/Search-Find-Color-16.svg. Inline SVG so that can be styled with CSS.
 */
export function SearchColorIcon() {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#Search-Find-Color-16_svg__a)">
                <path fill="#ADC2FC" d="M12 7A5 5 0 1 1 2 7a5 5 0 0 1 10 0Z" />
                <path fill="#fff" d="M7 2a4.98 4.98 0 0 1 3.403 1.338 5.5 5.5 0 0 0-7.065 7.065A5 5 0 0 1 7 2Z" opacity=".5" />
                <path
                    fill="#557FF3"
                    d="M7 0a7 7 0 0 1 5.372 11.488l3.445 3.445.043.047a.625.625 0 0 1-.88.88l-.047-.043-3.445-3.445A7 7 0 1 1 7 0Zm0 1a6 6 0 1 0 0 12A6 6 0 0 0 7 1Z"
                />
            </g>
            <defs>
                <clipPath id="Search-Find-Color-16_svg__a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Glyphs/16px/Ai-Chat-16.svg. Inline SVG so that can be styled with CSS.
 * @param {object} params
 * @param {string} [params.className]
 */
export function AiChatIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g fill="currentColor" clip-path="url(#Ai-Chat-16_svg__a)">
                <path
                    fill-rule="evenodd"
                    d="m10.54 12.57-.047.02c-.81.372-2.323.786-4.064 1.174a93 93 0 0 1-3.324.67l.297-.343c.781-.901.554-2.169-.215-2.85-1.22-1.08-1.937-2.539-1.937-4.116C1.25 4.013 4.132 1.25 8 1.25s6.75 2.763 6.75 5.875c0 2.372-1.644 4.514-4.161 5.427l-.049.017Zm.475 1.157c-1.891.868-6.545 1.75-9.2 2.206-.665.114-1.092-.66-.65-1.17l1.293-1.491c.28-.322.22-.813-.1-1.096C.902 10.886 0 9.1 0 7.125 0 3.19 3.582 0 8 0s8 3.19 8 7.125c0 2.985-2.061 5.541-4.985 6.602"
                    clip-rule="evenodd"
                />
                <path d="M7.62 3.271c.099-.396.661-.396.76 0l.22.878a3.27 3.27 0 0 0 2.376 2.376l.878.22c.396.099.396.661 0 .76l-.878.22A3.27 3.27 0 0 0 8.6 10.102l-.219.877c-.099.396-.661.396-.76 0l-.22-.877a3.27 3.27 0 0 0-2.377-2.377l-.877-.22c-.396-.099-.396-.661 0-.76l.877-.22A3.27 3.27 0 0 0 7.4 4.15l.22-.878Z" />
            </g>
            <defs>
                <clipPath id="Ai-Chat-16_svg__a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Color/16px/Ai-Chat-Gradient-Color-16.svg.
 */
export function AiChatColorIcon() {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#Ai-Chat-Gradient-Color-16_svg__a)">
                <path
                    fill="url(#Ai-Chat-Gradient-Color-16_svg__b)"
                    d="M1.164 14.763c-.441.51-.014 1.284.65 1.17 2.655-.457 7.306-1.338 9.199-2.206C13.938 12.667 16 10.111 16 7.125 16 3.19 12.418 0 8 0S0 3.19 0 7.125c0 1.974.902 3.76 2.358 5.051.32.283.38.773.1 1.095l-1.294 1.492Z"
                />
                <path
                    fill="url(#Ai-Chat-Gradient-Color-16_svg__c)"
                    d="M15 7.125c0 2.495-1.729 4.72-4.328 5.662l-.039.014-.037.017c-.838.384-2.376.803-4.114 1.19a98.74 98.74 0 0 1-4.03.797l.762-.878c.68-.785.487-1.898-.193-2.5-1.227-1.087-1.973-2.55-2.019-4.147L1 7.125C1 3.848 4.022 1 8 1V0l-.207.003C3.54.099.11 3.153.003 6.94L0 7.125c0 1.913.846 3.649 2.223 4.929l.135.122c.32.283.38.773.1 1.096l-1.293 1.491c-.442.51-.015 1.284.65 1.17 2.654-.456 7.305-1.338 9.198-2.206C13.938 12.667 16 10.111 16 7.125l-.002-.184C15.888 3.091 12.349.001 8 .001v1c3.916 0 6.905 2.759 6.998 5.97l.002.154Z"
                />
                <path
                    fill="#fff"
                    d="M7.632 2.787c.096-.383.64-.383.736 0l.438 1.753c.203.815.84 1.45 1.654 1.654l1.753.438c.383.096.383.64 0 .736l-1.753.438c-.815.203-1.45.84-1.654 1.654l-.438 1.753c-.096.383-.64.383-.736 0L7.194 9.46A2.273 2.273 0 0 0 5.54 7.806l-1.753-.438c-.383-.096-.383-.64 0-.736l1.753-.438A2.273 2.273 0 0 0 7.194 4.54l.438-1.753Z"
                />
                <path
                    fill="url(#Ai-Chat-Gradient-Color-16_svg__d)"
                    d="M6.662 2.544C7 1.195 8.867 1.154 9.3 2.418l.038.126.438 1.753c.114.457.47.813.927.927l1.753.438c1.392.348 1.392 2.328 0 2.676l-1.753.438c-.457.114-.813.47-.927.927l-.438 1.753c-.348 1.392-2.328 1.392-2.676 0l-.438-1.753a1.274 1.274 0 0 0-.927-.927l-1.753-.438c-1.392-.348-1.392-2.328 0-2.676l1.753-.438c.457-.114.813-.47.927-.927l.438-1.753ZM8 5.271A3.273 3.273 0 0 1 6.27 7 3.273 3.273 0 0 1 8 8.729 3.274 3.274 0 0 1 9.729 7 3.273 3.273 0 0 1 8 5.27Z"
                />
                <path
                    fill="#fff"
                    d="M7.632 2.787c.096-.383.64-.383.736 0l.438 1.753c.203.815.84 1.45 1.654 1.654l1.753.438c.383.096.383.64 0 .736l-1.753.438c-.815.203-1.45.84-1.654 1.654l-.438 1.753c-.096.383-.64.383-.736 0L7.194 9.46A2.273 2.273 0 0 0 5.54 7.806l-1.753-.438c-.383-.096-.383-.64 0-.736l1.753-.438A2.273 2.273 0 0 0 7.194 4.54l.438-1.753Z"
                />
            </g>
            <defs>
                <linearGradient id="Ai-Chat-Gradient-Color-16_svg__b" x1="8" x2="8" y1="0" y2="15.944" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#A7B7FD" />
                    <stop offset="1" stop-color="#5981F3" />
                </linearGradient>
                <linearGradient id="Ai-Chat-Gradient-Color-16_svg__c" x1="8" x2="8" y1="0" y2="15.944" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#7C99F7" />
                    <stop offset="1" stop-color="#4B74EE" />
                </linearGradient>
                <linearGradient id="Ai-Chat-Gradient-Color-16_svg__d" x1="8" x2="8" y1="2.5" y2="11.5" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#8EA6FA" />
                    <stop offset="1" stop-color="#6186F4" />
                </linearGradient>
                <clipPath id="Ai-Chat-Gradient-Color-16_svg__a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Glyphs/16px/Arrow-Right-16.svg. Inline SVG so that can be styled with CSS.
 * @param {object} params
 * @param {string} [params.className]
 */
export function ArrowRightIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M8.187 1.689a.625.625 0 0 1 .885-.884l5.31 5.316c.83.83.83 2.174 0 3.004l-5.31 5.315a.625.625 0 0 1-.885-.884l5.305-5.308H.625a.625.625 0 1 1 0-1.25h12.867z"
            />
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Glyphs/16px/Globe-16.svg.
 */
export function GlobeIcon() {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#Globe-16_svg__a)">
                <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M.017 7.482a8 8 0 0 1 15.967 0q.025.115.01.225a8 8 0 1 1-15.99 0 .6.6 0 0 1 .013-.225m1.247.951a6.75 6.75 0 0 0 4.197 5.823 7 7 0 0 1-.416-.781c-.555-1.213-.92-2.787-1.018-4.518a29 29 0 0 1-2.763-.524m2.739-.742a28 28 0 0 1-2.7-.535A6.76 6.76 0 0 1 5.46 1.744q-.229.372-.416.781c-.623 1.363-1.006 3.18-1.042 5.166Zm1.286 1.413c.109 1.516.436 2.852.893 3.85.59 1.292 1.28 1.796 1.818 1.796s1.228-.504 1.818-1.795c.457-1 .784-2.335.893-3.85-1.803.17-3.619.17-5.422 0Zm5.46-1.26a27.5 27.5 0 0 1-5.498 0c.018-1.904.38-3.596.93-4.799C6.774 1.755 7.462 1.25 8 1.25s1.228.504 1.818 1.795c.55 1.203.913 2.895.931 4.8Zm1.224 1.113c-.099 1.731-.463 3.305-1.018 4.518a7 7 0 0 1-.416.781 6.75 6.75 0 0 0 4.197-5.823q-1.372.33-2.763.524m2.725-1.801q-1.341.336-2.7.535c-.037-1.985-.42-3.803-1.043-5.166a7 7 0 0 0-.416-.781 6.76 6.76 0 0 1 4.159 5.412"
                    clip-rule="evenodd"
                />
            </g>
            <defs>
                <clipPath id="Globe-16_svg__a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Glyphs/16px/History-16.svg.
 */
export function HistoryIcon() {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g fill="currentColor" clip-path="url(#History-16_svg__a)">
                <path d="m2.072 4.918-.08-.004A6.753 6.753 0 1 1 1.246 8 .623.623 0 1 0 0 8a8 8 0 1 0 1.247-4.29V1.115a.623.623 0 0 0-1.247 0v2.977c0 1.145.928 2.072 2.072 2.072h2.486a.623.623 0 0 0 0-1.246z" />
                <path d="M8.625 3.625a.625.625 0 1 0-1.25 0V8c0 .166.066.325.183.442l2.375 2.375a.625.625 0 1 0 .884-.884L8.625 7.741z" />
            </g>
            <defs>
                <clipPath id="History-16_svg__a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Glyphs/16px/Favorite-16.svg.
 */
export function FavoriteIcon() {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#Favorite-16_svg__a)">
                <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M6.042 1.35c.73-1.732 3.186-1.732 3.916 0l1.033 2.452a.63.63 0 0 0 .489.376l2.686.38c1.774.252 2.46 2.45 1.144 3.666l-2.046 1.889a.63.63 0 0 0-.194.552l.434 2.88c.272 1.812-1.72 3.096-3.258 2.1L8.34 14.409a.63.63 0 0 0-.68 0l-1.906 1.236c-1.537.996-3.53-.288-3.258-2.1l.434-2.88a.63.63 0 0 0-.194-.552L.69 8.223C-.626 7.009.06 4.81 1.834 4.56l2.686-.381a.63.63 0 0 0 .489-.376zm2.764.486c-.3-.714-1.312-.714-1.612 0L6.16 4.287a1.88 1.88 0 0 1-1.465 1.128l-2.687.381a.875.875 0 0 0-.47 1.51l2.045 1.889c.457.421.675 1.042.582 1.656l-.433 2.88a.875.875 0 0 0 1.34.865L6.98 13.36a1.88 1.88 0 0 1 2.04 0l1.906 1.236a.875.875 0 0 0 1.341-.864l-.433-2.881a1.88 1.88 0 0 1 .582-1.656l2.046-1.89a.875.875 0 0 0-.471-1.509l-2.687-.38a1.88 1.88 0 0 1-1.464-1.13z"
                    clip-rule="evenodd"
                />
            </g>
            <defs>
                <clipPath id="Favorite-16_svg__a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Glyphs/16px/Bookmark-16.svg.
 */
export function BookmarkIcon() {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#Bookmark-16_svg__a)">
                <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M2 4a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v9.684c0 1.857-2.079 2.957-3.614 1.912l-1.788-1.218a1.06 1.06 0 0 0-1.196 0l-1.788 1.218C4.08 16.64 2 15.54 2 13.684zm4-2.75A2.75 2.75 0 0 0 3.25 4v9.684c0 .854.955 1.359 1.66.878l1.788-1.217a2.31 2.31 0 0 1 2.604 0l1.787 1.217a1.063 1.063 0 0 0 1.661-.878V4A2.75 2.75 0 0 0 10 1.25z"
                    clip-rule="evenodd"
                />
            </g>
            <defs>
                <clipPath id="Bookmark-16_svg__a">
                    <path fill="#fff" d="M0 0h16v16H0z" />
                </clipPath>
            </defs>
        </svg>
    );
}

/**
 * From https://dub.duckduckgo.com/duckduckgo/Icons/blob/Main/Glyphs/16px/Browser-16.svg.
 */
export function BrowserIcon() {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="#000"
                fill-rule="evenodd"
                d="M0 5a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1.792c0 .478-.681.721-1.053.422a.52.52 0 0 1-.197-.4v-.819H1.25V11A2.75 2.75 0 0 0 4 13.75h2.135a.57.57 0 0 1 .497.312c.21.398-.055.938-.506.938H4a4 4 0 0 1-4-4zm1.262-.255h13.476A2.75 2.75 0 0 0 12 2.25H4a2.75 2.75 0 0 0-2.738 2.495"
                clip-rule="evenodd"
            />
            <path
                fill="#000"
                fill-rule="evenodd"
                d="M11.5 7a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9m-1.972 7.084A3.25 3.25 0 0 1 8.288 12h.85a7.6 7.6 0 0 0 .39 2.084M8.337 10.75h.818a7.5 7.5 0 0 1 .373-1.834 3.25 3.25 0 0 0-1.191 1.834m2.495 3.233c-.226-.5-.392-1.19-.441-1.983h2.218c-.05.793-.215 1.482-.441 1.983-.299.66-.583.767-.668.767s-.37-.106-.668-.767m0-4.966c-.202.447-.356 1.045-.422 1.733h2.18c-.066-.688-.22-1.286-.422-1.733-.299-.66-.583-.767-.668-.767s-.37.106-.668.767m2.64 5.067c.213-.606.348-1.32.39-2.084h.85a3.25 3.25 0 0 1-1.24 2.084m.373-3.334h.818a3.25 3.25 0 0 0-1.19-1.834c.188.54.316 1.164.371 1.834Z"
                clip-rule="evenodd"
            />
        </svg>
    );
}
