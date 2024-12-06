import { tpf } from "./data";
import log from "./util.log";
import { dotsSave } from "./dotsSave";

function adjustHoverBox(dotContainer: HTMLElement) {
    const labelElement = dotContainer.querySelector('.user-dot-label') as HTMLElement;
    const coordsElement = dotContainer.querySelector('.dot-coordinates') as HTMLElement;
    
    if (!labelElement || !coordsElement) return;
    
    const labelRect = labelElement.getBoundingClientRect();
    const coordsRect = coordsElement.getBoundingClientRect();
    
    dotContainer.style.setProperty('--hover-top', '-13px');
    dotContainer.style.setProperty('--hover-width', `${Math.max(labelRect.width, coordsRect.width) + 20}px`);
    dotContainer.style.setProperty('--hover-height', `${coordsRect.bottom - labelRect.top + 7}px`);
}

export function handleEdit(dotContainer: HTMLElement) {
    log('handleEdit');
    
    const labelElement = dotContainer.querySelector('.user-dot-label') as HTMLElement;
    if (!labelElement) return;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'label-input';
    input.value = labelElement.innerText === 'null' ? '' : labelElement.innerText;
    
    const labelRect = labelElement.getBoundingClientRect();
    const containerRect = dotContainer.getBoundingClientRect();
    
    input.style.top = (labelRect.top - containerRect.top) + 'px';
    input.style.left = (labelRect.left - containerRect.left) + 'px';
    
    let isFinishing = false;
    let isEscPressed = false;

    labelElement.style.visibility = 'hidden';
    
    function finishEdit() {
        if (isFinishing || isEscPressed) return;
        isFinishing = true;

        try {
            const newLabel = input.value || 'null';
            labelElement.innerText = newLabel;
            labelElement.style.visibility = 'visible';

            if (input.parentNode === dotContainer) {
                dotContainer.removeChild(input);
            }

            if (tpf.selectedDot && tpf.selectedDot !== dotContainer) {
                tpf.selectedDot.classList.remove('selected');
                updateCoordinatePrecision(tpf.selectedDot, false);
            }
            
            tpf.selectedDot = dotContainer as HTMLDivElement;
            dotContainer.classList.add('selected');
            updateCoordinatePrecision(dotContainer, true);
            
            // Only save if we're not on homepage
            const urlParts = window.location.pathname.split('/');
            if (urlParts.length > 2 && urlParts[1] !== '') {
                requestAnimationFrame(() => {
                    saveDots();
                });
            }

        } catch (error) {
            console.error('Error in finishEdit:', error);
            labelElement.style.visibility = 'visible';
        } finally {
            isFinishing = false;
        }
    }

    input.addEventListener('blur', () => {
        if (!isEscPressed) {
            requestAnimationFrame(() => {
                finishEdit();
            });
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!isFinishing) {
                finishEdit();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            isEscPressed = true;
            
            if (input.parentNode === dotContainer) {
                dotContainer.removeChild(input);
            }
            labelElement.style.visibility = 'visible';
        }
    });

    dotContainer.appendChild(input);
    input.focus();
    input.select();
}

export function editDeleteMenu(dot: HTMLElement) {
    const menu = document.createElement('div');
    menu.className = 'edit-menu';
    menu.style.position = 'absolute';
    
    const rect = dot.getBoundingClientRect();
    menu.style.left = rect.right + 5 + 'px';
    menu.style.top = rect.top + 'px';
    
    const deleteOption = document.createElement('div');
    deleteOption.textContent = 'Delete';
    deleteOption.onclick = async () => {
        menu.remove();
        dot.remove();
        tpf.selectedDot = null;
        
        const deleteEvent = new CustomEvent('dotDeleted', { bubbles: true });
        document.dispatchEvent(deleteEvent);
    };
    
    menu.appendChild(deleteOption);
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    const closeMenu = (e: MouseEvent) => {
        if (!menu.contains(e.target as Node)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);
}

function updateCoordinatePrecision(dot: HTMLElement, highPrecision: boolean) {
    const coordsElement = dot.querySelector('.dot-coordinates');
    if (!coordsElement) return;
    const coords = coordsElement.textContent?.match(/-?\d+\.?\d*/g)?.map(Number) || [0, 0];
    coordsElement.textContent = `(${coords[0].toFixed(highPrecision ? 2 : 1)}, ${coords[1].toFixed(highPrecision ? 2 : 1)})`;
}

function findDotContainer(element: HTMLElement): HTMLElement | null {
    if (element.classList.contains('dot-container')) {
        return element;
    }
    if (element.parentElement) {
        return findDotContainer(element.parentElement);
    }
    return null;
}

function saveDots() {
    log('saveDots');
    const dots = Array.from(document.getElementsByClassName('dot-container')).map(dot => {
        const labelElement = dot.querySelector('.user-dot-label');
        const coordsElement = dot.querySelector('.dot-coordinates');
        const style = (dot as HTMLElement).style;

        return {
            x: style.left,
            y: style.top,
            coordinates: coordsElement?.textContent || '',
            label: labelElement?.textContent || 'null'
        };
    });
    dotsSave(dots);
}

export { updateCoordinatePrecision, findDotContainer };