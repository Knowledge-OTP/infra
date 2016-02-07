if (!HTMLElement.prototype.click) {
    // Patch since PhantomJS does not implement click() on HTMLElement. In some
    // cases we need to execute the native click on an element.

    HTMLElement.prototype.click = function() {
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */, true /* cancelable */,
            window, null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );
        this.dispatchEvent(ev);
    };
}
