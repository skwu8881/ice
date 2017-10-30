dmx.Component('select-multiple', {

    extends: 'select',

    initialData: {
        value: []
    },

    methods: {
        setSelectedIndex: function(index) {
            this.$node.selectedIndex = index;
            this.updateData();
        }
    },

    update: function(props) {
        if (JSON.stringify(props.options) !== JSON.stringify(this.props.options)) {
            this.renderOptions();
            this.updateValue = true;
        }

        if (JSON.stringify(props.value) !== JSON.stringify(this.props.value)) {
            this.updateValue = true;
        }

        this.updateData();
    },

    updateData: function() {
        var value = Array.prototype.slice.call(this.$node.options).filter(function(option) {
            return option.selected;
        }).map(function(option) {
            return option.value;
        });

        if (JSON.stringify(value) !== JSON.stringify(this.data.value)) {
            dmx.nextTick(function() {
                this.dispatchEvent('updated');
            }, this);
        }

        this.set('value', value);
        this.set('disabled', this.$node.disabled);
        this.set('invalid', !this.$node.validity.valid);
        this.set('validationMessage', this.$node.validationMessage);
        this.set('selectedIndex', this.$node.selectedIndex);
    },

    setValue: function(value, isDefault) {
        if (!Array.isArray(value)) value = [value];
        dmx.array(this.$node.options).forEach(function(option) {
            option.selected = value.indexOf(option.value) > -1;
            if (isDefault) option.defaultSelected = option.selected;
        });
    }

});
