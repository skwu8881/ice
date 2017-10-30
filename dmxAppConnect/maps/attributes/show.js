dmx.Attribute('show', 'mounted', function(node, attr) {
    var orgDisplay = node.style.display;

    this.$addBinding(attr.value, function(value) {
        node.style.display = value ? orgDisplay : 'none';
    })
});
