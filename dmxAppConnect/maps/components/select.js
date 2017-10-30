dmx.Component('select', {

    extends: 'form-element',

    initialData: {
        selectedIndex: -1
    },

    tag: 'select',

    attributes: {
        options: {
            type: Array,
            default: []
        },
        optionText: {
            type: String,
            default: '$value'
        },
        optionValue: {
            type: String,
            default: '$value'
        }
    },

    methods: {
        setSelectedIndex: function(index) {
            this.$node.selectedIndex = index;
            this.updateData();
        }
    },

    render: function(node) {
        this.options = [];
        if (!this.props.value) {
            this.props.value = this.$node.value;
        } else {
            this.updateValue = true;
        }
        dmx.BaseComponent.prototype.render.call(this, node);
        this.$node.disabled = this.props.disabled;
        this.$node.addEventListener('change', this.updateData.bind(this));
        this.$node.addEventListener('invalid', this.updateData.bind(this));
        this.renderOptions();
    },

    update: function(props) {
        if (JSON.stringify(props.options) !== JSON.stringify(this.props.options)) {
            this.renderOptions();
            this.updateValue = true;
        }

        if (JSON.stringify(props.value) !== JSON.stringify(this.props.value)) {
            this.updateValue = true;
        }

        if (props.disabled != this.props.disabled) {
            this.$node.disabled = this.props.disabled;
        }

        this.updateData();
    },

    updated: function() {
        if (this.updateValue) {
            this.updateValue = false;
            this.setValue(this.props.value, true);
            this.updateData();
        }
    },

    updateData: function(event) {
        dmx.Component('form-element').prototype.updateData.call(this, event);
        this.set('selectedIndex', this.$node.selectedIndex);
    },

    setValue: function(value, isDefault) {
        dmx.array(this.$node.options).forEach(function(option) {
            option.selected = (option.value === value);
            if (isDefault) option.defaultSelected = option.selected;
        });
    },

    renderOptions: function() {
        this.options.splice(0).forEach(function(node) {
            dmx.dom.remove(node);
        });

        if (Array.isArray(this.props.options)) {
            this.props.options.forEach(function(option) {
                if (typeof option != 'object') option = { $value: option };
                var node = document.createElement('option');
                node.value = dmx.parse(this.props.optionValue, dmx.DataScope(option));
                node.innerText = dmx.parse(this.props.optionText, dmx.DataScope(option));
                this.options.push(this.$node.appendChild(node));
            }, this);
        }
    }

});
