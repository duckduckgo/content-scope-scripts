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
        const existingCards = document.querySelectorAll('.hover-summary-card');
        existingCards.forEach((card) => card.remove());

        console.log('Creating a summary card...');
        const locationRect = link.getBoundingClientRect();

        const style = document.createElement('style');
        style.textContent = styles;
        document.head.appendChild(style);

        const summaryCard = document.createElement('div');

        summaryCard.className = 'hover-summary-card';
        summaryCard.style.top = `${locationRect.bottom}px`;
        summaryCard.style.left = `${locationRect.left}px`;

        const domainContainer = document.createElement('div');
        domainContainer.className = 'domain-container';
        summaryCard.appendChild(domainContainer);

        const domainTextElement = document.createElement('p');
        domainTextElement.textContent = cleanDomain;
        domainContainer.appendChild(domainTextElement);

        const domainLoadingIcon = document.createElement('div');
        domainLoadingIcon.className = 'domain-loading-icon';
        domainLoadingIcon.innerHTML = spinner;
        domainContainer.appendChild(domainLoadingIcon);

        const baseInfoContainer = document.createElement('div');
        baseInfoContainer.className = 'base-info-container';
        baseInfoContainer.classList.add('border-bottom');
        summaryCard.appendChild(baseInfoContainer);

        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'summary-container';
        summaryCard.appendChild(summaryContainer);

        const summaryTitleRow = document.createElement('div');
        summaryTitleRow.className = 'summary-title-row';
        summaryContainer.appendChild(summaryTitleRow);

        const summaryTitleIconContainer = document.createElement('div');
        summaryTitleIconContainer.className = 'summary-title-left-container';
        summaryTitleRow.appendChild(summaryTitleIconContainer);

        const summaryTitleIcon = document.createElement('div');
        summaryTitleIcon.className = 'summary-title-icon';
        summaryTitleIcon.innerHTML = assist;
        summaryTitleIconContainer.appendChild(summaryTitleIcon);

        const summaryTitle = document.createElement('h4');
        summaryTitle.className = 'summary-title';
        summaryTitle.textContent = 'Highlights';
        summaryTitleIconContainer.appendChild(summaryTitle);

        const summaryLoadingElement = document.createElement('div');
        summaryLoadingElement.className = 'summary-loading';
        summaryLoadingElement.innerHTML = spinner;
        summaryTitleRow.appendChild(summaryLoadingElement);

        // add visit page element
        const visitPageContainer = document.createElement('div');
        visitPageContainer.className = 'visit-page-container';
        summaryCard.appendChild(visitPageContainer);

        const visitPageIcon = document.createElement('div');
        visitPageIcon.className = 'visit-page-icon';
        visitPageIcon.innerHTML = arrowCircleRight;
        visitPageContainer.appendChild(visitPageIcon);

        const visitPageElement = document.createElement('a');
        visitPageElement.textContent = 'Visit Page';
        visitPageElement.href = link.href;
        visitPageElement.target = '_blank';
        visitPageContainer.appendChild(visitPageElement);

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

        const imageElement = document.createElement('img');
        imageElement.className = 'base-info-image';
        imageElement.src = image;
        baseInfoContainer.appendChild(imageElement);

        const titleElement = document.createElement('p');
        titleElement.className = 'base-info-title';
        titleElement.textContent = title;
        baseInfoContainer.appendChild(titleElement);

        const readingTimeContainer = document.createElement('div');
        readingTimeContainer.className = 'reading-time-container';
        baseInfoContainer.appendChild(readingTimeContainer);

        const readingTimeIcon = document.createElement('div');
        readingTimeIcon.className = 'reading-time-icon';
        readingTimeIcon.innerHTML = clock;
        readingTimeContainer.appendChild(readingTimeIcon);

        const readingTimeElement = document.createElement('p');
        readingTimeElement.textContent = `Estimated reading time: ${timeToRead} minutes`;
        readingTimeContainer.appendChild(readingTimeElement);
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
            summaryListItem.className = 'summary-list-item';

            const bulletPoint = document.createElement('div');
            bulletPoint.className = 'bullet-point';
            summaryListItem.appendChild(bulletPoint);

            const summaryListItemText = document.createElement('p');
            summaryListItemText.className = 'summary-list-item-text';
            summaryListItemText.textContent = summaryItem;
            summaryListItem.appendChild(summaryListItemText);

            summaryListElement.appendChild(summaryListItem);
        });

        summaryListElement.classList.add('border-bottom');

        const copyContainer = document.createElement('button');
        copyContainer.className = 'copy-container';
        summaryListElement.appendChild(copyContainer);

        const copyIcon = document.createElement('div');
        copyIcon.className = 'copy-icon';
        copyIcon.innerHTML = copy;
        copyContainer.appendChild(copyIcon);

        const copyText = document.createElement('p');
        copyText.className = 'copy-text';
        copyText.textContent = 'Copy Highlights';
        copyContainer.appendChild(copyText);

        summaryContainer.appendChild(summaryListElement);
        summaryContainer.appendChild(copyContainer);
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
