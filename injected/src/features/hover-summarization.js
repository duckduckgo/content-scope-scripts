import ContentFeature from '../content-feature';

const linkSelector = 'a';

export default class HoverSummarization extends ContentFeature {
    load() {}

    init(args) {
        console.log({ args });
        if (!this.messaging) {
            throw new Error('cannot operate link hover summarization without a messaging backend');
        }

        if (document.readyState === 'loading') {
            console.log('Injecting hover summarization on DOMContentLoaded');
            document.addEventListener('DOMContentLoaded', this.injectHoverSummarization.bind(this), { once: true });
        } else {
            console.log('Injecting hover summarization immediately');
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
                    let parsedUrl;
                    // handling relative paths and no protocol
                    if (!url.includes('http') || !url.includes('.')) {
                        parsedUrl = new URL(url, window.location.origin);
                    } else {
                        parsedUrl = new URL(url);
                    }
                    const urlToSend = parsedUrl.href;

                    const domain = parsedUrl.host;
                    const cleanDomain = domain.replace(/^www\./, '');
                    console.log('url being sent', urlToSend);
                    console.log('display domain', cleanDomain);
                    const { data } = await this.messaging.request('hover-baseinfo', {
                        url: urlToSend,
                    });

                    const { title, image, timeToRead } = data;
                    console.log({ title, image, timeToRead });
                    this.createCard(currentHoveredLink, cleanDomain, title, image, timeToRead);
                    // this.createCard(
                    //     currentHoveredLink,
                    //     'vox.com',
                    //     'The surprising way romance may affect your friendships',
                    //     'https://platform.vox.com/wp-content/uploads/sites/2/2025/06/GettyImages-2196337297.jpg?quality=90&strip=all&crop=0%2C16.666666666667%2C100%2C66.666666666667&w=1440',
                    //     2,
                    // );

                    const summaryInfo = await this.messaging.request('hover-summarization', {
                        url: urlToSend,
                    });
                    const { summary } = summaryInfo.data;
                    console.log({ summary });
                    if (summary.length > 0) {
                        this.updateCard(summary);
                    }
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

    createCard(link, cleanDomain, title, image, timeToRead) {
        // Remove any existing cards first
        const existingCards = document.querySelectorAll('.hover-summary-card');
        existingCards.forEach((card) => card.remove());

        console.log('Creating a summary card...');
        const locationRect = link.getBoundingClientRect();

        const summaryCard = document.createElement('div');

        summaryCard.className = 'hover-summary-card'; // Add a class for easy removal
        summaryCard.style.position = 'fixed';
        summaryCard.style.top = `${locationRect.bottom}px`;
        summaryCard.style.left = `${locationRect.left}px`;
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

        const titleElement = document.createElement('h3');
        titleElement.textContent = title;
        summaryCard.appendChild(titleElement);

        const imageElement = document.createElement('img');
        imageElement.src = image;
        imageElement.style.width = '100%';
        imageElement.style.height = 'auto';
        imageElement.style.borderRadius = '0.5rem';
        summaryCard.appendChild(imageElement);

        const readingTimeElement = document.createElement('p');
        readingTimeElement.textContent = `Estimated reading time: ${timeToRead} minutes`;
        summaryCard.appendChild(readingTimeElement);

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

    updateCard(summaryArr) {
        const existingCard = document.querySelector('.hover-summary-card');
        if (!existingCard) {
            return;
        }
        const summaryListElement = document.createElement('ul');
        summaryListElement.className = 'summary-list';
        summaryArr.forEach((summaryItem) => {
            const summaryListItem = document.createElement('li');
            summaryListItem.textContent = summaryItem;
            summaryListElement.appendChild(summaryListItem);
        });
        existingCard.appendChild(summaryListElement);
    }
}
