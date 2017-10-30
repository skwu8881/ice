dmx.Attribute('text', 'mounted', function(node, attr) {
    this.$addBinding(attr.value, function(value) {
        if (value != null) {
            node.innerText = value;
        }
    });
});
