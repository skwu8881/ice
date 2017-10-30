dmx.Component('button', {

    extends: 'form-element',

    tag: 'button',

    attributes: {
        type: {
            type: String,
            default: 'button', // button, reset, submit
            validate: function(val) {
                return /^(button|submit|reset)$/i.test(val);
            }
        }
    },

    render: function(node) {
        dmx.Component('form-element').prototype.render.call(this, node);
        this.$node.type = this.props.type;
        if (node.tagName === 'INPUT') {
            this.$node.innerText = this.props.value;
        }
    }

});
