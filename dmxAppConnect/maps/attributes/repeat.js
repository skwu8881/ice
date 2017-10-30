dmx.Attribute('repeat', 'before', function(node, attr) {
    if (this.node != node) {
        var component = this;
        var prevCount = 0;
        var children = [];
        var template = document.createDocumentFragment();
        var placeholder = document.createComment('Repeat ' + attr.value);
        var RepeatItem = dmx.Component('repeat-item');

        node.parentNode.replaceChild(placeholder, node);
        node.removeAttribute('dmx-repeat');

        template.appendChild(node);

        this.add(attr.argument || 'repeat', []);

        this.$addBinding(attr.value, function(repeat) {
            var RepeatItem = dmx.Component('repeat-item');
            var items = [];

            if (repeat) {
                if (Array.isArray(repeat)) {
                    items = repeat.map(function(item) {
                        return (typeof item == 'object') ? dmx.clone(item) : { $value: item };
                    });
                } else {
                    switch (typeof repeat) {
                        case 'number':
                            for (var n = 0; n < repeat; n++) {
                                items.push({ $value: n + 1 });
                            }
                            break;

                        case 'object':
                            Object.keys(repeat).forEach(function(key) {
                                items.push({ $key: key, $value: repeat[key] });
                            });
                            break;
                    }
                }

                items = items.map(function(item, index) {
                    item.$index = index;
                    return item;
                });
            }

            if (children.length > items.length) {
                // remove some children
                children.splice(items.length).forEach(function(child) {
                    component.children.splice(component.children.indexOf(child), 1);
                    child.$destroy();
                });
            }

            if (children.length) {
                // update existing children
                children.forEach(function(child, i) {
                    child.set(items[i]);
                });
            }

            if (items.length > children.length) {
                // add new children
                var fragment = document.createDocumentFragment();

                for (var i = children.length; i < items.length; i++) {
                    var child = new RepeatItem(template.cloneNode(true), component, items[i]);
                    child.$nodes.forEach(function(node) {
                        fragment.appendChild(node);
                        child.$parse(node);
                    });
                    children.push(child);
                    component.children.push(child);
                }

                placeholder.parentNode.insertBefore(fragment, placeholder);
            }
        });
    }
});
