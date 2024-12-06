import log from "./util.log";
export function removeAnyExistingElementsWithClassName(className) {
    log('removeAnyExistingElementsWithClassName');
    var elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].remove();
    }
}
