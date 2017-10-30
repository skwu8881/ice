dmx.Component('checkbox-group', {

    initialData: {
        value: []
    },

    tag: 'div',

    attributes: {
        value: {
            type: Array,
            default: []
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

        if (JSON.stringify(props.value) != JSON.stringify(this.props.value)) {
            this.updateValue = true;
        }
    },

    updated: function() {
        if (this.updateValue) {
            this.updateValue = false;
            this.setValue(this.props.value);
        }

        var value = Array.prototype.slice.call(this.$node.querySelectorAll('input[type=checkbox]')).filter(function(checkbox) {
            return !checkbox.disabled && checkbox.checked;
        }).map(function(checkbox) {
            return checkbox.value || 1;
        });

        this.set('value', value);
    },

    setValue: function(value, isDefault) {
        if (!Array.isArray(value)) value = [value];
        Array.prototype.slice.call(this.$node.querySelectorAll('input[type=checkbox]')).forEach(function(checkbox) {
            checkbox.checked = value.indexOf(checkbox.value) > -1;
            if (isDefault) checkbox.defaultChecked = checkbox.checked;
        });
    }

});
