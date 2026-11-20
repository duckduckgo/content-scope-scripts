// Like the real widget, this writes the token onto its own iframe and into the parent form's textarea.
const params = new URLSearchParams(window.top?.location.search ?? location.search);
const mode = params.get('hcaptcha') ?? 'manual';
const delayMs = Number(params.get('delayMs') ?? 1500);
const statusSlot = document.getElementById('status');

function verifying() {
    statusSlot.innerHTML = '<div class="spinner"></div>';
}

function solved() {
    statusSlot.innerHTML = '<div class="tick">&#10003;</div>';
    document.getElementById('label').textContent = 'Verified';
    const token = 'P1_fake-hcaptcha-' + Date.now();
    const frame = window.frameElement;
    frame.setAttribute('data-hcaptcha-response', token);
    frame.parentElement.querySelector("textarea[name='h-captcha-response']").value = token;
}

if (mode === 'auto') {
    verifying();
    setTimeout(solved, delayMs);
} else {
    document.getElementById('hc-box').addEventListener('click', () => {
        verifying();
        setTimeout(solved, 800);
    });
}
