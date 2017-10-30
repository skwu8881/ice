dmx.Attribute('html', 'mounted', function(node, attr) {
    this.$addBinding(attr.value, function(value) {
        if (value != null) {
            node.innerHTML = value;
        }
    });
});
