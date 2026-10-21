/**
 * Check if an element is visible.
 *
 * NOTE: this forces synchronous layout via getComputedStyle() and
 * getBoundingClientRect(). Running it repeatedly early in the page lifecycle
 * appears to perturb some anti-bot behavioral scoring (eg Cloudflare), so
 * prefer the layout-free `hasContent` check where a content-presence proxy is
 * sufficient. See `visibility: 'content'`.
 *
 * @param {Element} element
 * @returns {boolean}
 */
export function isVisible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return (
        rect.width > 0.5 &&
        rect.height > 0.5 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        parseFloat(style.opacity) > 0.05
    );
}

/** @type {DOMParser | undefined} Lazily constructed so importing this module never requires a DOM. */
let contentDomParser;

/** Metadata elements that never count as visible content. */
const CONTENT_METADATA_SELECTORS = 'base,link,meta,script,style,template,title,desc';

/**
 * Elements whose mere presence counts as meaningful (non-empty) content.
 * Note: any `img`/`svg` counts regardless of rendered size (this is layout-free,
 * so unlike element-hiding's `isDomNodeEmpty` there is no >20px check). A tracking
 * pixel inside a matched subtree would register - acceptable for the narrow,
 * captcha-specific selectors this mode is intended for (see `hasContent`).
 */
const CONTENT_MEDIA_SELECTORS = 'video,canvas,embed,object,audio,map,form,input,textarea,select,button,img,svg';

/**
 * Upper bound (in characters of raw text) above which `hasContent` skips the
 * serialize+parse step. Captcha widgets carry very little text; only an overly
 * broad selector would match a subtree larger than this, and re-serializing it
 * on every poll tick would be a real perf cost. Such a subtree clearly holds
 * content, so we treat it as present rather than pay to confirm.
 */
const CONTENT_TEXT_PARSE_LIMIT = 50000;

/**
 * Layout-free content-presence check, modeled on element-hiding's
 * `isDomNodeEmpty`. Determines whether an element contains meaningful content
 * WITHOUT forcing layout on the live page: the element's markup is serialized
 * and re-parsed into a detached document, and all inspection happens on that
 * copy.
 *
 * This is a proxy for "is there something rendered here", NOT true visual
 * visibility. Unlike `isVisible` it will treat a content-filled but
 * display:none element as present. It intentionally avoids
 * getComputedStyle()/getBoundingClientRect() on live nodes (including the
 * image-size heuristic element-hiding uses), so it never triggers a forced
 * layout.
 *
 * The check runs on a detached copy (via DOMParser) so `<script>`/`<style>`
 * text can be stripped before deciding. The only guard in front of it is a
 * size cap: an overly broad selector could match a huge subtree, and
 * serializing that on every poll tick would be a real cost, so such a subtree
 * (which clearly holds content) is reported present without parsing.
 *
 * Constraint for detector authors: `visibility: 'content'` is designed for
 * narrow, widget-specific selectors (captcha containers/iframes). With a broad
 * selector (eg `body`) two things degrade: a large text-heavy subtree trips the
 * size cap and reports present without validating structure, and the per-tick
 * serialize+parse becomes costly. Prefer targeted selectors when using this mode.
 *
 * @param {Element} element
 * @returns {boolean}
 */
export function hasContent(element) {
    // Only guard: never serialize+parse a pathologically large subtree on every
    // poll tick (reachable only via an overly broad selector). textContent is a
    // cheap, layout-free proxy for the serialized size; such a subtree clearly
    // holds content.
    if ((element.textContent || '').length > CONTENT_TEXT_PARSE_LIMIT) {
        return true;
    }

    // Authoritative check on a detached copy - same approach as element-hiding's
    // `isDomNodeEmpty` - so no live-page layout is forced. Re-parsing outerHTML
    // re-roots `element` under <body>, so the queries below also count the
    // element itself (eg an `iframe[src*=...]` selector match).
    if (!contentDomParser) {
        contentDomParser = new DOMParser();
    }
    const parsed = contentDomParser.parseFromString(element.outerHTML, 'text/html').documentElement;
    parsed.querySelectorAll(CONTENT_METADATA_SELECTORS).forEach((el) => el.remove());

    // Text content (read on the detached copy, so no live-page layout).
    if ((parsed.innerText || parsed.textContent || '').trim() !== '') {
        return true;
    }
    // Embedded media / form controls count as content.
    if (parsed.querySelector(CONTENT_MEDIA_SELECTORS) !== null) {
        return true;
    }
    // A real (eg cross-origin Turnstile) iframe counts; about:blank does not.
    return [...parsed.querySelectorAll('iframe')].some((frame) => {
        return !frame.hidden && frame.src !== '' && frame.src !== 'about:blank';
    });
}
