dmx.Component('form', {

    tag: 'form',

    attributes: {
        novalidate: {
            type: Boolean,
            default: false
        }
    },

    methods: {
        submit: function() {
            this.submit();
        },

        reset: function() {
            this.reset();
        },

        validate: function() {
            this.validate();
        }
    },

    events: {
        invalid: Event, // when form validation failed
        submit: Event // on form submit (can cancel submit)
    },

    render: function(node) {
        dmx.BaseComponent.prototype.render.call(this, node);
        this.$node.noValidate = true;
        this.$node.addEventListener('submit', this.onsubmit.bind(this));
        this.$node.addEventListener('reset', dmx.requestUpdate);
    },

    submit: function(data) {
        if (this.props.novalidate || this.validate()) {
            if (this.dispatchEvent('submit', { cancelable: true })) {
                this._submit();
            }
        } else {
            dmx.requestUpdate();
            this.dispatchEvent('invalid');
        }
    },

    _submit: function() {
        this.$node.submit();
    },

    reset: function() {
        this.$node.reset();
    },

    validate: function() {
        return dmx.validate(this.$node);
    },

    onsubmit: function(event) {
        event.preventDefault();
        this.submit();
    }

});
