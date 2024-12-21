import log from "./util.log";
export function createTickMarks() {
    log('createTickMarks');
    var xyPlane = document.getElementById('xy-plane');
    if (!xyPlane)
        return;
    for (var i = -5; i <= 5; i++) {
        // Create X axis tick
        var tick = document.createElement('div');
        var axisClass = i === 0 ? "zero" : (i < 0 ? "negative" : "positive");
        tick.className = "x-tick ".concat(axisClass);
        tick.style.left = (i + 5) * (100 / 11) + '%';
        xyPlane.appendChild(tick);
        // Create Y axis tick
        tick = document.createElement('div');
        tick.className = "y-tick ".concat(axisClass);
        tick.style.top = (i + 5) * (100 / 11) + '%';
        xyPlane.appendChild(tick);
    }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           