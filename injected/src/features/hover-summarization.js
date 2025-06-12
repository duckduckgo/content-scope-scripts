import ContentFeature from '../content-feature';

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
                    // }, 1000);

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
                    //     }, 3000);
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
        const existingCards = document.querySelectorAll('.hover-summary-card');
        existingCards.forEach((card) => card.remove());

        console.log('Creating a summary card...');
        const locationRect = link.getBoundingClientRect();

        const summaryCard = document.createElement('div');

        summaryCard.className = 'hover-summary-card'; // Add a class for easy removal
        summaryCard.style.top = `${locationRect.bottom}px`;
        summaryCard.style.left = `${locationRect.left}px`;
        summaryCard.style.position = 'fixed';
        summaryCard.style.zIndex = '1000';
        summaryCard.style.backgroundColor = 'white';
        summaryCard.style.borderRadius = '0.5rem';
        summaryCard.style.boxShadow =
            '0px 0px 0px 1px  rgba(0, 0, 0, 0.08), 0px 8px 8px 0px  rgba(0, 0, 0, 0.08), 0px 2px 4px 0px  rgba(0, 0, 0, 0.08)';
        summaryCard.style.padding = '10px';
        summaryCard.style.maxWidth = '300px';

        const domainElement = document.createElement('p');
        domainElement.textContent = cleanDomain;
        summaryCard.appendChild(domainElement);

        const baseInfoContainer = document.createElement('div');
        baseInfoContainer.className = 'base-info-container';
        summaryCard.appendChild(baseInfoContainer);

        const loadingBaseInfoElement = document.createElement('p');
        loadingBaseInfoElement.className = 'loading-base-info';
        loadingBaseInfoElement.textContent = 'Loading base info...';
        baseInfoContainer.appendChild(loadingBaseInfoElement);

        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-container';
        summaryCard.appendChild(summaryContainer);

        const summaryLoadingElement = document.createElement('p');
        summaryLoadingElement.className = 'summary-loading';
        summaryLoadingElement.textContent = 'Loading summary...';
        summaryContainer.appendChild(summaryLoadingElement);

        // add visit page element
        const visitPageElement = document.createElement('a');
        visitPageElement.textContent = 'Visit Page';
        visitPageElement.href = link.href;
        visitPageElement.target = '_blank';
        summaryCard.appendChild(visitPageElement);

        // Function to handle clicking outside the card
        const handleClickOutside = (event) => {
            // Check if the clicked element is outside the summary card
            if (!summaryCard.contains(event.target)) {
                summaryCard.remove();
                document.removeEventListener('click', handleClickOutside);
            }
        };

        // Add click-outside listener after a short delay to prevent immediate closure
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 100);

        // Step 3: Append the new element to the DOM
        document.body.appendChild(summaryCard);
    }

    updateCardWithImageTitleReadingTime(image, title, timeToRead) {
        const existingCard = document.querySelector('.hover-summary-card');
        if (!existingCard) {
            return;
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

        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        baseInfoContainer.appendChild(titleElement);

        const imageElement = document.createElement('img');
        imageElement.src = image;
        imageElement.style.width = '100%';
        imageElement.style.height = 'auto';
        imageElement.style.borderRadius = '0.25rem';
        baseInfoContainer.appendChild(imageElement);

        const readingTimeElement = document.createElement('p');
        readingTimeElement.textContent = `Estimated reading time: ${timeToRead} minutes`;
        baseInfoContainer.appendChild(readingTimeElement);
    }

    updateCardWithSummary(summaryArr) {
        const existingCard = document.querySelector('.hover-summary-card');
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
        const summaryListElement = document.createElement('ul');
        summaryListElement.className = 'summary-list';
        summaryArr.forEach((summaryItem) => {
            const summaryListItem = document.createElement('li');
            summaryListItem.textContent = summaryItem;
            summaryListElement.appendChild(summaryListItem);
        });
        summaryContainer.appendChild(summaryListElement);
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
