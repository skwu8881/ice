dmx.Component('input-file-multiple', {

    extends: 'input',

    initialData: {
        files: []
    },

    render: function(node) {
        dmx.Component('form-element').prototype.render.call(this, node);
        this.$node.addEventListener('change', this.onchange.bind(this));
    },

    onchange: function() {
        var self = this;
        var files = Array.prototype.slice.call(this.$node.files).map(function(file) {
            var data = {
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

            return data;
        });

        this.set('files', files);
    },

    setValue: function() {
        console.warn('Can not set value of a file input!');
    }

});
