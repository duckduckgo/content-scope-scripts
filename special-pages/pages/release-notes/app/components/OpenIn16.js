import { h } from 'preact';

/**
 * @param {object} props
 * @param {string} props.className
 **/

export default function OpenIn16({ className }) {
    return (
        <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path
                fill="currentColor"
                d="M7.361 1.013a.626.626 0 0 1 0 1.224l-.126.013H5A2.75 2.75 0 0 0 2.25 5v6A2.75 2.75 0 0 0 5 13.75h6A2.75 2.75 0 0 0 13.75 11V8.765a.625.625 0 0 1 1.25 0V11a4 4 0 0 1-4 4H5a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4h2.235l.126.013Z"
            />
            <path
                fill="currentColor"
                d="M12.875 1C14.049 1 15 1.951 15 3.125v2.25a.625.625 0 1 1-1.25 0v-2.24L9.067 7.817a.626.626 0 0 1-.884-.884l4.682-4.683h-2.24a.625.625 0 1 1 0-1.25h2.25Z"
            />
        </svg>
    );
}
