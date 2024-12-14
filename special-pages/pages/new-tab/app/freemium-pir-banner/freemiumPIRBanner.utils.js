/**
 * @type {(markdown: string) => string} convertMarkdownToHTMLForStrongTags
 */

export function convertMarkdownToHTMLForStrongTags(markdown) {
    // Use a regular expression to find all the words wrapped in **
    const regex = /\*\*(.*?)\*\*/g;

    // Replace the matched text with the HTML <strong> tags
    const result = markdown.replace(regex, '<strong>$1</strong>');
    return result;
}
