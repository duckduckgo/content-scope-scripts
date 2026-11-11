// Fake Turnstile and form checks for the fake people search site.
// Read from the top window so the preview harness can set them for every page in its frame.
const params = new URLSearchParams(window.top?.location.search ?? location.search);
const config = {
    turnstile: params.get('turnstile') ?? 'auto',
    delayMs: Number(params.get('delayMs') ?? 1500),
};

for (const widget of document.querySelectorAll('.cf-turnstile')) {
    const status = widget.querySelector('.status');
    const label = widget.querySelector('.label');
    const token = widget.querySelector("input[name='cf-turnstile-response']");
    const verifying = () => {
        status.innerHTML = '<div class="spinner"></div>';
        label.textContent = 'Verifying...';
    };
    const solved = () => {
        status.innerHTML = '<div class="tick">&#10003;</div>';
        label.textContent = 'Success!';
        token.setAttribute('value', '0.fake-turnstile-' + Date.now());
    };
    if (config.turnstile === 'auto') {
        verifying();
        setTimeout(solved, config.delayMs);
    } else {
        status.innerHTML = '<div class="box" role="checkbox" aria-label="Verify you are human"></div>';
        label.textContent = 'Verify you are human';
        status.querySelector('.box').addEventListener('click', () => {
            verifying();
            setTimeout(solved, 600);
        });
    }
}

for (const form of document.querySelectorAll('form[data-requires]')) {
    form.addEventListener('submit', (event) => {
        const missing = form.dataset.requires.split(' ').find((selector) => {
            const field = form.querySelector(selector);
            return field.type === 'checkbox' ? !field.checked : !field.value;
        });
        if (missing) {
            event.preventDefault();
            form.querySelector('.error').textContent = 'Please complete the security check.';
        }
    });
}
