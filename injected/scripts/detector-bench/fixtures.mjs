/**
 * Reusable DOM generators for detector benchmarks.
 *
 * Every generator runs inside the page via Playwright, so each must be
 * self-contained: no imports, no closure over module scope. All output is
 * deterministic - no randomness - so runs are comparable.
 *
 * Each takes an `append` parameter holding the payload markup (an adwall, a
 * script decoy, and so on). Keeping the payload separate from the filler means
 * a matching and a non-matching fixture can share an identical DOM shape, so a
 * timing difference between them reflects the match, not the page.
 *
 * IMPORTANT: filler text must never contain a detector pattern. Accidentally
 * seeding the filler with the pattern makes a gated variant look useless,
 * because the gate passes on every page and never short-circuits. The runner's
 * correctness pass catches this, but it is easier to avoid than to debug.
 */

/**
 * Article-like page: shallow, mixed inline elements, moderate text per node.
 * The default shape for "is this config fast enough on a real page".
 *
 * @param {{ rows?: number, scriptBlocks?: number, scriptRepeat?: number, append?: string }} params
 */
export function articlePage({ rows = 2000, scriptBlocks = 20, scriptRepeat = 20, append = '' }) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < rows; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML =
            '<section><article><p>Lorem ipsum dolor sit amet ' +
            i +
            ' <b>consectetur</b> adipiscing <i>elit</i> sed do eiusmod tempor</p></article></section>';
        frag.appendChild(row);
    }
    document.body.appendChild(frag);

    for (let i = 0; i < scriptBlocks; i++) {
        const script = document.createElement('script');
        script.textContent = 'var cfg = { tracking: false, region: "eu", retries: 3 }; // analytics bootstrap\n'.repeat(scriptRepeat);
        document.body.appendChild(script);
    }

    if (append) document.body.insertAdjacentHTML('beforeend', append);
}

/**
 * Deeply nested DOM. Ancestor-axis XPath predicates walk upward per text node,
 * so cost grows with depth in a way flat pages never reveal.
 *
 * @param {{ rows?: number, depth?: number, append?: string }} params
 */
export function deeplyNested({ rows = 500, depth = 30, append = '' }) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < rows; i++) {
        const root = document.createElement('div');
        let leaf = root;
        for (let d = 0; d < depth; d++) {
            const child = document.createElement('div');
            child.className = 'level-' + d;
            leaf.appendChild(child);
            leaf = child;
        }
        leaf.textContent = 'Nested content block ' + i + ' with some trailing prose';
        frag.appendChild(root);
    }
    document.body.appendChild(frag);
    if (append) document.body.insertAdjacentHTML('beforeend', append);
}

/**
 * Very many very small text nodes. Isolates per-node overhead - snapshot
 * allocation and concatenation - from raw character volume.
 *
 * @param {{ count?: number, append?: string }} params
 */
export function manyTinyTextNodes({ count = 40000, append = '' }) {
    const container = document.createElement('div');
    for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.textContent = String(i % 10);
        container.appendChild(span);
    }
    document.body.appendChild(container);
    if (append) document.body.insertAdjacentHTML('beforeend', append);
}

/**
 * Few nodes, huge character volume. The mirror of `manyTinyTextNodes`: isolates
 * character-proportional cost (regex scanning, string materialisation) from
 * per-node cost.
 *
 * @param {{ paragraphs?: number, charsPerParagraph?: number, append?: string }} params
 */
export function textHeavy({ paragraphs = 200, charsPerParagraph = 5000, append = '' }) {
    const sentence = 'The quick brown fox jumps over the lazy dog while the sun sets behind distant hills. ';
    const body = sentence.repeat(Math.ceil(charsPerParagraph / sentence.length)).slice(0, charsPerParagraph);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < paragraphs; i++) {
        const p = document.createElement('p');
        p.textContent = body;
        frag.appendChild(p);
    }
    document.body.appendChild(frag);
    if (append) document.body.insertAdjacentHTML('beforeend', append);
}

/**
 * The same character volume as `textHeavy`, with no word breaks at all.
 *
 * The counterpart to `textHeavy` for anything that scans for a word boundary: in prose
 * such a scan stops at the first space, typically within a few characters, so it costs
 * nothing and hides its own worst case. Here every scan runs to its ceiling, which is
 * both the most expensive case and the point at which a retained buffer grows.
 *
 * @param {{ blocks?: number, charsPerBlock?: number, append?: string }} params
 */
export function unbrokenWordRuns({ blocks = 200, charsPerBlock = 5000, append = '' }) {
    // Inlined rather than shared with `text-shapes.mjs`, because this runs in the page
    // and cannot close over module scope.
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let run = '';
    for (let i = 0; i < charsPerBlock; i++) run += alphabet[i % alphabet.length];

    const frag = document.createDocumentFragment();
    for (let i = 0; i < blocks; i++) {
        const p = document.createElement('p');
        p.textContent = run;
        frag.appendChild(p);
    }
    document.body.appendChild(frag);
    if (append) document.body.insertAdjacentHTML('beforeend', append);
}

/**
 * Large inline script bodies with little rendered text. Pathological for the
 * `not(ancestor::script)` style of predicate, and for any approach that reads
 * `textContent` on an ancestor without excluding script content.
 *
 * @param {{ scriptBlocks?: number, scriptRepeat?: number, rows?: number, append?: string }} params
 */
export function scriptHeavy({ scriptBlocks = 40, scriptRepeat = 400, rows = 100, append = '' }) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < rows; i++) {
        const p = document.createElement('p');
        p.textContent = 'Visible paragraph ' + i;
        frag.appendChild(p);
    }
    document.body.appendChild(frag);

    for (let i = 0; i < scriptBlocks; i++) {
        const script = document.createElement('script');
        script.textContent = 'function handler' + i + '(state) { return state.value + 1; } // bootstrap helper\n'.repeat(scriptRepeat);
        document.body.appendChild(script);
    }

    if (append) document.body.insertAdjacentHTML('beforeend', append);
}
