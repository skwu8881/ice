dmx.Component('repeat-item', {

    constructor: function(fragment, parent, data, name) {
        this.parent = parent;
        this.bindings = {};
        this.propBindings = {};
        this.children = [];
        this.listeners = [];
        this.props = {};
        this.data = data || {};
        this.seed = parent.seed;
        this.name = name || 'repeat';
        this.$nodes = [];
        for (var i = 0; i < fragment.childNodes.length; i++) {
            this.$nodes.push(fragment.childNodes[i]);
        }
    },

    $destroy: function() {
        this.dispatchEvent('destroy');
        for (var i = 0; i < this.$nodes.length; i++) {
            var event = document.createEvent('Event');
            event.initEvent('remove', false, true);
            if (this.$nodes[i].dispatchEvent(event)) {
                dmx.dom.remove(this.$nodes[i]);
            }
        }
    }

});
