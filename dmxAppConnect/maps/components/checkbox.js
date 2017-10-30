dmx.Component('checkbox', {

    extends: 'form-element',

    initialData: {
        checked: false
    },

    tag: 'input',

    attributes: {
        checked: {
            type: Boolean,
            default: false
        }
    },

    methods: {
        select: function(check) {
            this.select(check);
        }
    },

    render: function(node) {
        dmx.Component('form-element').prototype.render.call(this, node);
        this.$node.addEventListener('click', this.updateData.bind(this));
        this.$node.type = 'checkbox';
        this.$node.checked = this.props.checked;
        this.set('checked', this.props.checked);
    },

    update: function(props) {
        dmx.Component('form-element').prototype.update.call(this, props);

        if (props.checked !== this.props.checked) {
            this.$node.checked = this.props.checked;
        }

        this.updateData();
    },

    updateData: function(event) {
        dmx.Component('form-element').prototype.updateData.call(this, event);
        this.set('checked', this.$node.checked);
    },

    select: function(check) {
        this.$node.checked = (check !== false);
    }

});
