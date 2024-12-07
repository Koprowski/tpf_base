// src/navScroll.ts

interface ScrollState {
    lastScrollTop: number;
    ticking: boolean;
}

class NavigationScroller {
    private static readonly NAV_HEIGHT: number = 64;
    private state: ScrollState;
    private nav: HTMLElement | null;
    private pageHeader: HTMLElement | null;

    constructor() {
        this.state = {
            lastScrollTop: 0,
            ticking: false
        };

        this.nav = document.querySelector('.fixed-nav');
        this.pageHeader = document.querySelector('.page-header-container');

        if (this.nav && this.pageHeader) {
            this.initialize();
        }
    }

    private initialize(): void {
        // Set up nav bar
        if (this.nav) {
            this.nav.style.position = 'fixed';
            this.nav.style.top = '0';
            this.nav.style.left = '0';
            this.nav.style.right = '0';
            this.nav.style.zIndex = '999';
            this.nav.style.transition = 'transform 0.2s ease-out';
        }

        // Set up page header
        if (this.pageHeader) {
            this.pageHeader.style.position = 'sticky';
            this.pageHeader.style.top = '0';
            this.pageHeader.style.zIndex = '1000';
            this.pageHeader.style.background = 'white';
            this.pageHeader.style.transition = 'height 0.2s ease-out';
        }

        this.attachEventListeners();
    }

    private handleScroll = (): void => {
        if (!this.nav || !this.pageHeader) return;

        const scrollTop = window.scrollY;
        const headerRect = this.pageHeader.getBoundingClientRect();
        const maxScroll = NavigationScroller.NAV_HEIGHT;

        if (scrollTop > 0) {
            // Move nav bar up
            const navTransform = Math.min(scrollTop, maxScroll);
            this.nav.style.transform = `translateY(-${navTransform}px)`;

            // Add sticky class when header reaches top
            if (headerRect.top <= 0) {
                this.pageHeader.classList.add('sticky');
            }
        } else {
            // Reset nav position and remove sticky class
            this.nav.style.transform = 'translateY(0)';
            this.pageHeader.classList.remove('sticky');
        }

        this.state.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    private attachEventListeners(): void {
        window.addEventListener('scroll', () => {
            if (!this.state.ticking) {
                window.requestAnimationFrame(() => {
                    this.handleScroll();
                    this.state.ticking = false;
                });
                this.state.ticking = true;
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NavigationScroller();
});

export default NavigationScroller;