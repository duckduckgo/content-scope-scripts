import ContentFeature from '../content-feature';
import { spinner, clock, assist, copy, arrowCircleRight } from './hover-summarization/svgs';
import { styles } from './hover-summarization/styles';

const linkSelector = 'a';

export default class HoverSummarization extends ContentFeature {
    load() {}

    init() {
        if (!this.messaging) {
            throw new Error('cannot operate link hover summarization without a messaging backend');
        }

        if (document.readyState === 'loading') {
            console.log('Injecting hover summarization on DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', this.injectHoverSummarization.bind(this), { once: true });
        } else {
            this.injectHoverSummarization();
        }
    }

    injectHoverSummarization() {
        // Inject Floating UI scripts if not already present
        const floatingUiCoreSrc = "https://cdn.jsdelivr.net/npm/@floating-ui/core@1.7.1";
        const floatingUiDomSrc = "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.1";

        const ensureScript = (src) => {
            if (!document.querySelector(`script[src="${src}"]`)) {
                const script = document.createElement('script');
                script.src = src;
                script.async = false;
                document.head.appendChild(script);
            }
        };

        ensureScript(floatingUiCoreSrc);
        ensureScript(floatingUiDomSrc);

        const linksList = document.querySelectorAll(linkSelector);
        if (linksList.length === 0) {
            return;
        }

        let currentHoveredLink = null;
        let currentHoverTimer = null;

        // Single keydown listener for all links
        const keydownHandler = async (/** @type {{ shiftKey: Boolean; }} */ event) => {
            if (event.shiftKey && currentHoverTimer && currentHoveredLink) {
                try {
                    const url = currentHoveredLink.getAttribute('href');
                    const parsedUrl = this.parseURL(url);
                    const urlToSend = parsedUrl.href;
                    const domain = parsedUrl.host;
                    const displayDomain = domain.replace(/^www\./, '');

                    // !!!!!!! Create Card
                    this.createCard(currentHoveredLink, displayDomain);

                    // !!!!!!! Get Basic Info & update base info section
                    // REAL
                    const { data } = await this.messaging.request('hover-baseinfo', {
                        url: urlToSend,
                    });
                    const { title, image, timeToRead } = data;
                    this.updateCardWithImageTitleReadingTime(image, title, timeToRead);

                    // MOCK
                    // const mockBasicInfo = {
                    //     title: 'The surprising way romance may affect your friendships',
                    //     image: 'https://platform.vox.com/wp-content/uploads/sites/2/2025/06/GettyImages-2196337297.jpg?quality=90&strip=all&crop=0%2C16.666666666667%2C100%2C66.666666666667&w=1440',
                    //     timeToRead: 2,
                    // };
                    // const { title, image, timeToRead } = mockBasicInfo;
                    // setTimeout(() => {
                    //     this.updateCardWithImageTitleReadingTime(image, title, timeToRead);
                    // }, 3000);

                    // !!!!!!! Get Summary & update summary section
                    // REAL
                    const summaryInfo = await this.messaging.request('hover-summarization', {
                        url: urlToSend,
                    });
                    const { summary } = summaryInfo.data;
                    console.log({ summary });
                    this.updateCardWithSummary(summary);

                    // MOCK
                    // const summary = ['This is a summary', 'This is another, much much much much longer summary', 'This is a third summary'];
                    // if (summary.length > 0) {
                    //     setTimeout(() => {
                    //         this.updateCardWithSummary(summary);
                    //     }, 8000);
                    // }
                    clearTimeout(currentHoverTimer);
                    // currentHoverTimer = null;
                    // currentHoveredLink = null;
                } catch (e) {
                    console.error('Error while processing hover summarization:', e);
                }
            }
        };

        document.addEventListener('keydown', keydownHandler);

        linksList.forEach((link) => {
            link.addEventListener('mouseenter', () => {
                currentHoveredLink = link;
                console.log('Link Hovered. Press Shift to activate summarization.');
                currentHoverTimer = setTimeout(() => {}, 500);
            });

            link.addEventListener('mouseleave', () => {
                clearTimeout(currentHoverTimer);
                currentHoverTimer = null;
                currentHoveredLink = null;
            });
        });
    }

    createCard(link, cleanDomain) {
        // Remove any existing cards first
        const existingFrames = document.querySelectorAll('.hover-summary-iframe');
        existingFrames.forEach((frame) => frame.remove());

        console.log('Creating a summary card...');
        const locationRect = link.getBoundingClientRect();

        // Create iframe container
        const iframe = document.createElement('iframe');
        iframe.className = 'hover-summary-iframe';
        iframe.style.position = 'absolute';
        iframe.style.border = 'none';
        iframe.style.zIndex = '9999';
        iframe.style.width = '440px';
        iframe.style.height = '600px';
        iframe.style.background = 'transparent';
        iframe.style.transition = 'left 0.2s ease, top 0.2s ease, height 0.2s ease';

        // This function will get called repeatedly
        function updatePosition() {
            window.FloatingUIDOM.computePosition(link, iframe, {
                middleware: [window.FloatingUIDOM.autoPlacement()],
            }).then(({x, y}) => {
                Object.assign(iframe.style, {
                    left: `${x}px`,
                    top: `${y}px`,
                });
            });
        }

        // Append iframe to body
        document.body.appendChild(iframe);

        // Start auto updates
        const cleanup = window.FloatingUIDOM.autoUpdate(
            link,
            iframe,
            updatePosition,
        );

        // Write initial HTML structure
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <style>${styles}</style>
            </head>
            <body style="margin: 8px; padding: 0; background: transparent;">
                <div class="hover-summary-card" style="position: relative; top: 0; left: 0;">
                    <div class="domain-container">
                        <p>${cleanDomain}</p>
                        <div class="domain-loading-icon">${spinner}</div>
                    </div>
                    <div class="base-info-container border-bottom"></div>
                    <div class="summary-container">
                        <div class="summary-title-row">
                            <div class="summary-title-left-container">
                                <div class="summary-title-icon">${assist}</div>
                                <h4 class="summary-title">Highlights</h4>
                            </div>
                            <div class="summary-loading">${spinner}</div>
                        </div>
                    </div>
                    <div class="visit-page-container">
                        <div class="visit-page-icon">${arrowCircleRight}</div>
                        <a href="${link.href}" target="_blank">Visit Page</a>
                    </div>
                </div>
            </body>
            </html>
        `);
        iframeDoc.close();

        // Function to handle clicking outside the card
        const handleClickOutside = (event) => {
            // Check if the clicked element is outside the iframe
            if (!iframe.contains(event.target)) {
                iframe.remove();
                document.removeEventListener('click', handleClickOutside);
                cleanup(); // Clean up Floating UI autoUpdate
            }
        };

        // Add click-outside listener after a short delay to prevent immediate closure
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);

        // Adjust iframe height based on content
        const adjustIframeHeight = () => {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            const contentHeight = iframeDoc.documentElement.scrollHeight;
            iframe.style.height = contentHeight + 40 + 'px';
        };

        // Store adjustment function on iframe for later use
        iframe.adjustHeight = adjustIframeHeight;
        
        // Initial adjustment
        setTimeout(adjustIframeHeight, 50);
    }

    updateCardWithImageTitleReadingTime(image, title, timeToRead) {
        const existingFrame = document.querySelector('.hover-summary-iframe');
        if (!existingFrame) {
            return;
        }

        const iframeDoc = existingFrame.contentDocument || existingFrame.contentWindow.document;
        const existingCard = iframeDoc.querySelector('.hover-summary-card');
        if (!existingCard) {
            return;
        }

        // remove domain loading icon
        const domainLoadingIcon = existingCard.querySelector('.domain-loading-icon');
        if (domainLoadingIcon) {
            domainLoadingIcon.remove();
        }

        // remove loading base info element
        const loadingBaseInfoElement = existingCard.querySelector('.loading-base-info');
        if (loadingBaseInfoElement) {
            loadingBaseInfoElement.remove();
        }

        const baseInfoContainer = existingCard.querySelector('.base-info-container');
        if (!baseInfoContainer) {
            return;
        }

        const imageElement = iframeDoc.createElement('img');
        imageElement.className = 'base-info-image';
        imageElement.src = image;
        baseInfoContainer.appendChild(imageElement);

        const titleElement = iframeDoc.createElement('p');
        titleElement.className = 'base-info-title';
        titleElement.textContent = title;
        baseInfoContainer.appendChild(titleElement);

        const readingTimeContainer = iframeDoc.createElement('div');
        readingTimeContainer.className = 'reading-time-container';
        baseInfoContainer.appendChild(readingTimeContainer);

        const readingTimeIcon = iframeDoc.createElement('div');
        readingTimeIcon.className = 'reading-time-icon';
        readingTimeIcon.innerHTML = clock;
        readingTimeContainer.appendChild(readingTimeIcon);

        const readingTimeElement = iframeDoc.createElement('p');
        readingTimeElement.textContent = `Estimated reading time: ${timeToRead} minutes`;
        readingTimeContainer.appendChild(readingTimeElement);

        // Adjust iframe height
        if (existingFrame.adjustHeight) {
            setTimeout(existingFrame.adjustHeight, 100);
        }
    }

    updateCardWithSummary(summaryArr) {
        const existingFrame = document.querySelector('.hover-summary-iframe');
        if (!existingFrame) {
            return;
        }

        const iframeDoc = existingFrame.contentDocument || existingFrame.contentWindow.document;
        const existingCard = iframeDoc.querySelector('.hover-summary-card');
        if (!existingCard) {
            return;
        }
        const summaryContainer = existingCard.querySelector('.summary-container');
        if (!summaryContainer) {
            return;
        }
        // remove loading element
        const summaryLoadingElement = existingCard.querySelector('.summary-loading');
        if (summaryLoadingElement) {
            summaryLoadingElement.remove();
        }
        // add summary list
        const summaryListElement = iframeDoc.createElement('ul');
        summaryListElement.className = 'summary-list';

        summaryArr.forEach((summaryItem) => {
            const summaryListItem = iframeDoc.createElement('li');
            summaryListItem.className = 'summary-list-item';

            const bulletPoint = iframeDoc.createElement('div');
            bulletPoint.className = 'bullet-point';
            summaryListItem.appendChild(bulletPoint);

            const summaryListItemText = iframeDoc.createElement('p');
            summaryListItemText.className = 'summary-list-item-text';
            summaryListItemText.textContent = summaryItem;
            summaryListItem.appendChild(summaryListItemText);

            summaryListElement.appendChild(summaryListItem);
        });

        summaryListElement.classList.add('border-bottom');

        const copyContainer = iframeDoc.createElement('button');
        copyContainer.className = 'copy-container';
        summaryListElement.appendChild(copyContainer);

        const copyIcon = iframeDoc.createElement('div');
        copyIcon.className = 'copy-icon';
        copyIcon.innerHTML = copy;
        copyContainer.appendChild(copyIcon);

        const copyText = iframeDoc.createElement('p');
        copyText.className = 'copy-text';
        copyText.textContent = 'Copy Highlights';
        copyContainer.appendChild(copyText);

        summaryContainer.appendChild(summaryListElement);
        summaryContainer.appendChild(copyContainer);

        const disclaimerText = iframeDoc.createElement('p');
        disclaimerText.className = 'disclaimer-text';
        disclaimerText.textContent = 'These key points were generated by AI and may contain errors.';
        existingCard.appendChild(disclaimerText);

        // Adjust iframe height
        if (existingFrame.adjustHeight) {
            setTimeout(existingFrame.adjustHeight, 100);
        }
    }

    parseURL(url) {
        // handling relative paths and no protocol
        if (!url.includes('http') || !url.includes('.')) {
            return new URL(url, window.location.origin);
        } else {
            return new URL(url);
        }
    }
}
