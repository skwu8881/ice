dmx.Component('radio-group', {

    initialData: {
        value: ''
    },

    tag: 'div',

    attributes: {
        value: {
            type: String,
            default: ''
        }
    },

    methods: {
        setValue: function(value) {
            this.setValue(value);
        }
    },

    render: function(node) {
        dmx.BaseComponent.prototype.render.call(this, node);
        this.setValue(this.props.value);
    },

    update: function(props) {
        dmx.BaseComponent.prototype.update.call(this, props);

        if (props.value != this.props.value) {
            this.updateValue = true;
        }
    },

    updated: function() {
        if (this.updateValue) {
            this.updateValue = false;
            this.setValue(this.props.value, true);
        }

        var values = Array.prototype.slice.call(this.$node.querySelectorAll('input[type=radio]')).filter(function(radio) {
            return !radio.disabled && radio.checked;
        }).map(function(radio) {
            return radio.value || 1;
        });

        this.set('value', values[0]);
    },

    setValue: function(value, isDefault) {
        Array.prototype.slice.call(this.$node.querySelectorAll('input[type=radio]')).forEach(function(radio) {
            radio.checked = radio.value == value;
            if (isDefault) radio.defaultChecked = radio.checked;
        });
    }

});
