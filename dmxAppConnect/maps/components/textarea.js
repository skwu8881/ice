dmx.Component('textarea', {

    extends: 'form-element',

    tag: 'textarea',

    render: function(node) {
        if (!this.props.value) {
            var value = this.$node.value;
            if (value.indexOf('{{') !== -1) {
                this.props.value = dmx.parse(value, this);
            } else {
                this.props.value = value;
            }
        }
        dmx.Component('form-element').prototype.render.call(this, node);
    }

});
