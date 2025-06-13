export const styles = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    .hover-summary-card {
        position: fixed;
        z-index: 1000;
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0px 0px 0px 1px rgba(0, 0, 0, 0.08), 0px 8px 8px 0px rgba(0, 0, 0, 0.08), 0px 2px 4px 0px rgba(0, 0, 0, 0.08);
        padding: 0.25rem;
        width: 400px;
        max-width: 400px;
        color: #1f1f1f;
        backdrop-filter: blur(48px);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
        font-size: 14px;

        p,
        h4 {
            margin: 0;
        }

        svg {
            width: 16px;
            height: 16px;
            color: rgba(31, 31, 31, 0.72);
        }
    }

    .domain-container {
        padding: 4px 10px;
    }

    .domain-container p {
        color: rgba(31, 31, 31, 0.72);
    }

    .domain-container .domain-loading-icon {
        animation: spin 1s linear infinite;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
    }

    .base-info-container {
        position: relative;
        padding-bottom: 0 !important;

    }

    .base-info-image {
        width: 100%;
        max-height: 14.75rem;
        object-fit: cover;
        border-radius: 0.25rem;
    }

    .base-info-title {
        position: absolute;
        bottom: 42px;
        right: 0;
        width: 95%;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 1rem 18px;
        border-top-left-radius: 6px;
        border-bottom-left-radius: 6px;
    }

    .reading-time-container {
        padding: 4px 10px;
        height: 28px;
    }

    .reading-time-container p {
    }

    .summary-container {
        padding: 4px 10px;
        border-bottom: 1px solid rgba(31, 31, 31, 0.09);
    }
    .copy-container,
    .domain-container,
    .visit-page-container,
    .reading-time-container,
    .summary-title-row,
    .summary-title-left-container {
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: flex-start;
    }

    .domain-container,
    .summary-title-row {
        justify-content: space-between;
        height: 28px;
    }

    .summary-title {
    }

    .summary-loading {
        animation: spin 1s linear infinite;
    }

    .summary-list {
        list-style: none;
        padding-left: 10px;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin: 0.5rem -10px 0;

        .summary-list-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding-left: 3px;

            .bullet-point {
                width: 4px;
                height: 4px;
                background-color: rgba(31, 31, 31, 0.72);
                margin-right: 10px;
                border-radius: 50%;
            }
        }
    }

    .copy-container {
        appearance: none;
        width: 100%;
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 0;
        margin: 0;
        height: 28px;
        font-size: 14px;
        color: #1f1f1f;
    }

    .visit-page-container {
        padding: 4px 10px;
        height: 28px;

        a {
            color: #1f1f1f;
            text-decoration: none;
            font-size: 14px;
            line-height: 20px;
            letter-spacing: -0.01em;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    .disclaimer-text {
        height: 28px;
        text-align: center;
        padding: 4px 12px 4px 10px;
        font-size: 12px;
        color: rgba(31, 31, 31, 0.72);
        border-top: 1px solid rgba(31, 31, 31, 0.09);
    }

    .border-bottom {
        border-bottom: 1px solid rgba(31, 31, 31, 0.09);
        padding-bottom: 1rem;
    }
`;
