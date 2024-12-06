// src/navScroll.ts

interface ScrollState {
    lastScrollTop: number;
    ticking: boolean;
}

interface DOMElements {
    nav: HTMLElement | null;
    body: HTMLElement;
    pageHeader: HTMLElement | null;
}

class NavigationScroller {
    private static readonly NAV_HEIGHT: number = 64;
    private state: ScrollState;
    private elements: DOMElements;

    constructor() {
        this.state = {
            lastScrollTop: 0,
            ticking: false
        };

        this.elements = {
            nav: document.querySelector('.fixed-nav'),
            body: document.body,
            pageHeader: document.querySelector('.page-header-container')
        };

        this.initialize();
    }

    private initialize(): void {
        if (!this.validateElements()) {
            console.warn('Required elements not found for navigation scroll behavior');
            return;
        }

        this.setupInitialStyles();
        this.attachEventListeners();
    }

    private validateElements(): boolean {
        return !!(this.elements.nav && this.elements.pageHeader);
    }

    private setupInitialStyles(): void {
        const { nav, pageHeader } = this.elements;
        if (!nav || !pageHeader) return;

        // Set initial transition states for smooth movement
        nav.style.transition = 'transform 0.2s ease-out';
        pageHeader.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s ease-out';

        // Initialize page header position
        pageHeader.style.position = 'sticky';
        pageHeader.style.top = `${NavigationScroller.NAV_HEIGHT}px`;
        pageHeader.style.backgroundColor = 'white';
        pageHeader.style.zIndex = '40';
    }

    private handleScroll = (): void => {
        const { nav, body, pageHeader } = this.elements;
        if (!nav || !pageHeader) return;

        const currentScroll = window.scrollY;
        const scrollingDown = currentScroll > this.state.lastScrollTop;
        const pastNavHeight = currentScroll > NavigationScroller.NAV_HEIGHT;

        if (scrollingDown && pastNavHeight) {
            // Scrolling down - hide nav
            nav.style.transform = `translateY(-${NavigationScroller.NAV_HEIGHT}px)`;
            pageHeader.style.transform = `translateY(-${NavigationScroller.NAV_HEIGHT}px)`;
            pageHeader.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        } else {
            // Scrolling up - show nav
            nav.style.transform = 'translateY(0)';
            pageHeader.style.transform = 'translateY(0)';
            pageHeader.style.boxShadow = 'none';
        }

        // Update last scroll position
        this.state.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    };

    private attachEventListeners(): void {
        // Throttled scroll handler
        window.addEventListener('scroll', () => {
            if (!this.state.ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    this.state.ticking = false;
                });
                this.state.ticking = true;
            }
        });

        // Reset positions on page load/refresh
        window.addEventListener('pageshow', () => {
            if (window.scrollY === 0) {
                const { nav, pageHeader } = this.elements;
                if (nav && pageHeader) {
                    nav.style.transform = 'translateY(0)';
                    pageHeader.style.transform = 'translateY(0)';
                    pageHeader.style.boxShadow = 'none';
                }
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NavigationScroller();
});

export default NavigationScroller;