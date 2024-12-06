// src/navScroll.ts
var NavigationScroller = /** @class */ (function () {
    function NavigationScroller() {
        var _this = this;
        this.handleScroll = function () {
            var _a = _this.elements, nav = _a.nav, body = _a.body, pageHeader = _a.pageHeader;
            if (!nav || !pageHeader)
                return;
            var currentScroll = window.scrollY;
            var scrollingDown = currentScroll > _this.state.lastScrollTop;
            var pastNavHeight = currentScroll > NavigationScroller.NAV_HEIGHT;
            if (scrollingDown && pastNavHeight) {
                // Scrolling down - hide nav
                nav.style.transform = "translateY(-".concat(NavigationScroller.NAV_HEIGHT, "px)");
                pageHeader.style.transform = "translateY(-".concat(NavigationScroller.NAV_HEIGHT, "px)");
                pageHeader.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            }
            else {
                // Scrolling up - show nav
                nav.style.transform = 'translateY(0)';
                pageHeader.style.transform = 'translateY(0)';
                pageHeader.style.boxShadow = 'none';
            }
            // Update last scroll position
            _this.state.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        };
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
    NavigationScroller.prototype.initialize = function () {
        if (!this.validateElements()) {
            console.warn('Required elements not found for navigation scroll behavior');
            return;
        }
        this.setupInitialStyles();
        this.attachEventListeners();
    };
    NavigationScroller.prototype.validateElements = function () {
        return !!(this.elements.nav && this.elements.pageHeader);
    };
    NavigationScroller.prototype.setupInitialStyles = function () {
        var _a = this.elements, nav = _a.nav, pageHeader = _a.pageHeader;
        if (!nav || !pageHeader)
            return;
        // Set initial transition states for smooth movement
        nav.style.transition = 'transform 0.2s ease-out';
        pageHeader.style.transition = 'transform 0.2s ease-out, box-shadow 0.2s ease-out';
        // Initialize page header position
        pageHeader.style.position = 'sticky';
        pageHeader.style.top = "".concat(NavigationScroller.NAV_HEIGHT, "px");
        pageHeader.style.backgroundColor = 'white';
        pageHeader.style.zIndex = '40';
    };
    NavigationScroller.prototype.attachEventListeners = function () {
        var _this = this;
        // Throttled scroll handler
        window.addEventListener('scroll', function () {
            if (!_this.state.ticking) {
                window.requestAnimationFrame(function () {
                    _this.handleScroll();
                    _this.state.ticking = false;
                });
                _this.state.ticking = true;
            }
        });
        // Reset positions on page load/refresh
        window.addEventListener('pageshow', function () {
            if (window.scrollY === 0) {
                var _a = _this.elements, nav = _a.nav, pageHeader = _a.pageHeader;
                if (nav && pageHeader) {
                    nav.style.transform = 'translateY(0)';
                    pageHeader.style.transform = 'translateY(0)';
                    pageHeader.style.boxShadow = 'none';
                }
            }
        });
    };
    NavigationScroller.NAV_HEIGHT = 64;
    return NavigationScroller;
}());
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    new NavigationScroller();
});
export default NavigationScroller;
