dmx.Attribute('style', 'mounted', function(node, attr) {
    var property = attr.argument;
    var important = attr.modifiers.important ? 'important' : '';

    this.$addBinding(attr.value, function(value) {
        if (value != null) {
            node.style.setProperty(property, value, important);
        }
    });
});
