dmx.Attribute('lightbox', 'mounted', function(node, attr) {
    var name = attr.argument || 'dmxImage' + (++dmx.lightbox.count);

    dmx.lightbox.addToGallery(name, node);

    node.addEventListener('click', function(event) {
        event.preventDefault();
        dmx.lightbox.run(name, node);
    });
});
