dmx.Component('form-element', {

    constructor: function(node, parent) {
        this.updateData = dmx.debounce(this.updateData.bind(this));
        dmx.BaseComponent.call(this, node, parent);
    },

    initialData: {
        value: '',
        disabled: false,
        validationMessage: '',
        invalid: false
    },

    attributes: {
        value: {
            type: String,
            default: ''
        },

        disabled: {
            type: Boolean,
            default: false
        }
    },

    methods: {
        setValue: function(value) {
            this.setValue(value);
        },

        focus: function() {
            this.focus();
        },

        disable: function(disable) {
            this.disable(disable);
        },

        validate: function() {
            this.validate();
        }
    },

    events: {
        updated: Event
    },

    render: function(node) {
        dmx.BaseComponent.prototype.render.call(this, node);
        this.$node.value = this.props.value;
        this.$node.disabled = this.props.disabled;
        this.$node.defaultValue = this.props.value;
        this.$node.addEventListener('input', this.updateData.bind(this));
        this.$node.addEventListener('change', this.updateData.bind(this));
        this.$node.addEventListener('invalid', this.updateData.bind(this));
        this.set('value', this.props.value);
        this.set('disabled', this.props.disabled);
    },

    update: function(props) {
        if (JSON.stringify(props.value) !== JSON.stringify(this.props.value)) {
            this.$node.defaultValue = this.props.value;
            this.setValue(this.props.value);
        }

        if (props.disabled != this.props.disabled) {
            this.$node.disabled = this.props.disabled;
        }

        this.updateData();
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

        this.set('value', this.$node.value);
        this.set('disabled', this.$node.disabled);

        if (this.$node.dirty) {
            this.set('invalid', !this.$node.validity.valid);
            this.set('validationMessage', this.$node.validationMessage);
        }
    },

    setValue: function(value) {
        this.$node.value = value;
        this.updateData();
    },

    focus: function() {
        this.$node.focus();
    },

    disable: function(disable) {
        this.$node.disabled = (disable === true);
        this.updateData();
    },

    validate: function() {
        dmx.validate(this.$node);
        this.updateData();
    }

});
