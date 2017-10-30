dmx.Attribute('class', 'mounted', function(node, attr) {
    var className = attr.argument;

    this.$addBinding(attr.value, function(value, oldValue) {
        node.classList[value ? 'add' : 'remove'](className);
    });
});
