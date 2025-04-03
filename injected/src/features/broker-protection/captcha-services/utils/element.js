export function isElementType(element, tag) {
    if (Array.isArray(tag)) {
        return tag.some((t) => isElementType(element, t));
    }

    return element.tagName.toLowerCase() === tag.toLowerCase();
}
