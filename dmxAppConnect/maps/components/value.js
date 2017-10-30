dmx.Component('value', {

    initialData: {
        value: null
    },

    attributes: {
        value: {
            default: null
        }
    },

    methods: {
        setValue: function(value) {
            this.set('value', value);
        }
    },

    render: function() {
        this.set('value', this.props.value);
    },

    update: function(props) {
        if (props.value !== this.props.value) {
            this.set('value', this.props.value);
        }
    }

});
