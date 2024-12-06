import log from "./util.log";

export function removeAnyExistingElementsWithClassName(className: string) {
    log('removeAnyExistingElementsWithClassName');
    const elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].remove();
    }
}
