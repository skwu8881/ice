dmx.Component('lightbox', {

    attributes: {
        fullscreen: {
            type: Boolean,
            default: false
        },

        noscrollbars: {
            type: Boolean,
            default: false
        },

        autoplay: {
            type: Boolean,
            default: false
        },

        loopvideo: {
            type: Boolean,
            default: false
        },

        buttons: {
            type: String,
            default: 'auto' // auto, show, hide (auto is hidden on touch enabled devices and galleries with single image)
        },

        animation: {
            type: String,
            default: 'slide' // slide, fade, none
        },

        spinner: {
            type: String,
            default: 'Spinner1' // Spinner1, Spinner2, Spinner3, Spinner4, Spinner5, Spinner6, Spinner7, Spinner8
        }
    },

    events: {
        show: Event,
        hide: Event
    },

    render: function(node) {
        dmx.lightbox.register(this);
        dmx.BaseComponent.prototype.render.call(this, node);
    },

    update: function(props) {
        dmx.lightbox.setOptions(this.props);
    }

});
