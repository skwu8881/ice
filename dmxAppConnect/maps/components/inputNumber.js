dmx.Component('input-number', {

    extends: 'input',

    render: function(node) {
        dmx.Component('form-element').prototype.render.call(this, node);
        this.set('value', +this.props.value);
    },

    updateData: function(event) {
        if (event) {
            dmx.validate(this.$node);
        }

        if (this.$node.value !== this.data.value) {
            dmx.nextTick(function() {
                this.dispatchEvent('updated');
            }, this);
        }
        this.set('value', this.$node.value ? +this.$node.value : null);
        this.set('disabled', this.$node.disabled);

        if (this.$node.dirty) {
            this.set('invalid', !this.$node.validity.valid);
            this.set('validationMessage', this.$node.validationMessage);
        }
    }

});
