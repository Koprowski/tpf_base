// src/navScroll.ts
var NavigationScroller = /** @class */ (function () {
    function NavigationScroller() {
        var _this = this;
        this.handleScroll = function () {
            if (!_this.nav || !_this.pageHeader)
                return;
            var scrollTop = window.scrollY;
            var headerRect = _this.pageHeader.getBoundingClientRect();
            var maxScroll = NavigationScroller.NAV_HEIGHT;
            if (scrollTop > 0) {
                // Move nav bar up
                var navTransform = Math.min(scrollTop, maxScroll);
                _this.nav.style.transform = "translateY(-".concat(navTransform, "px)");
                // Add sticky class when header reaches top
                if (headerRect.top <= 0) {
                    _this.pageHeader.classList.add('sticky');
                }
            }
            else {
                // Reset nav position and remove sticky class
                _this.nav.style.transform = 'translateY(0)';
                _this.pageHeader.classList.remove('sticky');
            }
            _this.state.lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        };
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
    NavigationScroller.prototype.initialize = function () {
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
    };
    NavigationScroller.prototype.attachEventListeners = function () {
        var _this = this;
        window.addEventListener('scroll', function () {
            if (!_this.state.ticking) {
                window.requestAnimationFrame(function () {
                    _this.handleScroll();
                    _this.state.ticking = false;
                });
                _this.state.ticking = true;
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
