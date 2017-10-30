dmx.Component('if', {

    attributes: {
        condition: {
            type: Boolean,
            default: false
        }
    },

    render: function(node) {
        this.nodes = [];
        this.template = document.createDocumentFragment();
        while (this.$node.firstChild) {
            this.template.appendChild(this.$node.firstChild);
        }
        this.update({});
    },

    update: function(props) {
        if (this.props.condition != props.condition) {
            if (this.props.condition) {
                this._render();
            } else {
                this._destroy();
            }
        }
    },

    _render: function() {
        var template = this.template.cloneNode(true);
        this.nodes = Array.prototype.slice.call(template.childNodes);
        this.$node.appendChild(template);
        this.$parse();
    },

    _destroy: function() {
        this.bindings = {};
        this.nodes.splice(0).forEach(function(node) {
            if (node.dispatchEvent(new Event('remove', { cancelable: true }))) {
                dmx.dom.remove(node);
            }
        });
        this.children.splice(0).forEach(function(child) {
            child.$destroy();
        });
    }

});
