import ContentFeature from '../content-feature';

const linkSelector = 'a[href],a';

export default class HoverSummarization extends ContentFeature {
    load() {
        this.injectHoverSummarization();
    }

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
        const keydownHandler = (/** @type {{ shiftKey: Boolean; }} */ event) => {
            if (event.shiftKey && currentHoverTimer && currentHoveredLink) {
                try {
                    this.messaging.request('hover-summarization', {
                        url: currentHoveredLink.getAttribute('href'),
                    });
                    this.createCard(currentHoveredLink);
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
            console.log('Adding mouseenter listener to link', link);
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

    createCard(link) {
        // Remove any existing cards first
        const existingCards = document.querySelectorAll('.hover-summary-card');
        existingCards.forEach((card) => card.remove());

        console.log('Creating a summary card...');
        const locationRect = link.getBoundingClientRect();

        const summaryCard = document.createElement('div');

        summaryCard.className = 'hover-summary-card'; // Add a class for easy removal
        summaryCard.textContent = 'Hello, this will be a summary card!';
        summaryCard.style.position = 'fixed';
        summaryCard.style.top = `${locationRect.bottom}px`;
        summaryCard.style.left = `${locationRect.left}px`;
        summaryCard.style.zIndex = '1000';
        summaryCard.style.backgroundColor = 'white';
        summaryCard.style.border = '1px solid #ccc'; // Add border for visibility
        summaryCard.style.borderRadius = '0.5rem';
        summaryCard.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        summaryCard.style.padding = '10px';
        summaryCard.style.maxWidth = '300px';

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
}
