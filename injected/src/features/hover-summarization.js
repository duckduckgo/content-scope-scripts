import ContentFeature from '../content-feature';

const linkSelector = 'a[href],a';

export default class HoverSummarization extends ContentFeature {
    load() {
        this.injectHoverSummarization();
    }

    init(args) {
        console.log({ args });
        if (!this.messaging) {
            throw new Error('cannot operate duck player without a messaging backend');
        }
        this.injectHoverSummarization();
    }

    update() {}

    injectHoverSummarization() {
        const linksList = document.querySelectorAll(linkSelector);
        if (linksList.length === 0) {
            return;
        }

        linksList.forEach((link) => {
            let hoverTimer;

            link.addEventListener('mouseenter', () => {
                // Start a timer when the mouse enters the link
                hoverTimer = setTimeout(() => {
                    // This function will be called after half second of hovering
                    console.log('Link Hovered. Press Shift to activate summarization.');
                }, 500);
            });

            link.addEventListener('mouseleave', () => {
                // Clear the timer if the mouse leaves the link
                clearTimeout(hoverTimer);
            });

            // Listen for keydown events
            document.addEventListener('keydown', async (event) => {
                // Check if Shift is pressed & hover timer has completed, add summary card
                if (event.shiftKey && hoverTimer) {
                    try {
                        await this.messaging.request('hover-summarization', { url: link.getAttribute('href') });
                        const locationRect = link.getBoundingClientRect();
                        // Step 1: Create a new element
                        const summaryCard = document.createElement('div');

                        // Step 2: Set attributes or content
                        summaryCard.textContent = 'Hello, this will be a summary card!';
                        summaryCard.style.position = 'fixed'; // Optional: Make it fixed position
                        summaryCard.style.top = `${locationRect.bottom + window.scrollY}px`; // Position below the link
                        summaryCard.style.left = `${locationRect.left + window.scrollX}px`; // Align with the left edge of the link
                        summaryCard.style.zIndex = '1000'; // Optional: Ensure it appears above other content
                        summaryCard.style.backgroundColor = 'white';
                        summaryCard.style.padding = '10px'; // Optional: Add some padding
                        summaryCard.style.margin = '10px'; // Optional: Add some margin

                        // Step 3: Append the new element to the DOM
                        document.body.appendChild(summaryCard);
                        // Your custom logic here
                        clearTimeout(hoverTimer); // Clear the timer to prevent multiple triggers
                    } catch (e) {
                        console.error('Error while processing hover summarization:', e);
                    }
                }
            });
        });
    }
}
