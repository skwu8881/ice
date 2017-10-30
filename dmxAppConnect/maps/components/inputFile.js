dmx.Component('input-file', {

    extends: 'input',

    initialData:{
        file: null
    },

    render: function(node) {
        dmx.Component('form-element').prototype.render.call(this, node);
        this.$node.addEventListener('change', this.onchange.bind(this));
    },

    onchange: function() {
        var data = null;

        if (this.$node.files.length) {
            var file = this.$node.files[0];

            data = {
                date: (file.lastModified ? new Date(file.lastModified) : file.lastModifiedDate).toISOString(),
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: null
            };

            if (file.type.indexOf('image/') !== -1 && !file.reader) {
                file.reader = new FileReader();

                file.reader.onload = function(event) {
                    data.dataUrl = event.target.result;
                    dmx.requestUpdate();
                };

                file.reader.readAsDataURL(file);
            }
        }

        this.set('file', data);
    },

    setValue: function() {
        console.warn('Can not set value of a file input!');
    }

});
