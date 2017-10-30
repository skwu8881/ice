dmx.Attribute('on', 'mounted', function(node, attr) {
    var self = this;

    dmx.eventListener(node, attr.argument, function(event) {
        var returnValue = dmx.parse(attr.value, dmx.DataScope({
            $event: event
        }, self));

        if (typeof returnValue == 'string') {
            try {
                returnValue = (new Function('event', returnValue)).call(this, event);
            } catch(e) {
                console.warn('Error executing "' + returnValue + '"', e);
            }
        }

        return returnValue;
    }, attr.modifiers);
});
