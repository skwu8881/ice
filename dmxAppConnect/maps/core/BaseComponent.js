dmx.BaseComponent = dmx.createClass({

    constructor: function(node, parent) {
        this.$node = node;
        this.parent = parent;
        this.bindings = {};
        this.propBindings = {};
        this.children = [];
        this.listeners = {};
        this.props = {};
        this.data = {};
        this.seed = Math.random();

        this.name = node.getAttribute('id') || node.getAttribute('name') || this.type.toLowerCase().replace(/^dmx-/, '');
        this.name = this.name.replace(/[^\w]/, '');

        this.$parseAttributes(node);
        this.$initialData();
        this.render(node);
        if (this.beforeMount(node) !== false) {
            this.$mount(node);
            if (this.$node) {
                //this.$customAttributes('mount', this.$node);
                this.$customAttributes('mounted', this.$node);
            }
            this.dispatchEvent('mount');
            this.mounted();
        }
    },

    tag: null,
    initialData: {},
    attributes: {},
    methods: {},
    events: {
        mount: Event,
        destroy: Event
    },

    render: function(node) {
        if (this.tag) {
            if (this.tag.toUpperCase() !== this.$node.tagName) {
                this.$node = document.createElement(this.tag);
                // copy attributes
                for (var i = 0; i < node.attributes.length; i++) {
                    var attr = node.attributes[i];

                    if (attr.specified) {
                        this.$node.setAttribute(attr.name, attr.value);
                    }
                }
                this.$node.innerHTML = node.innerHTML;
            }
        } else {
            this.$node = null;
        }

        this.$placeholder = document.createComment(' ' + this.type + '[' + this.name + '] ');
        dmx.dom.replace(node, this.$placeholder);

        if (this.$node) {
            this.$node.dmxComponent = this;
            this.$parse();
        }
    },

    beforeMount: dmx.noop,
    mounted: dmx.noop,

    beforeUpdate: dmx.noop,
    update: dmx.noop,
    updated: dmx.noop,

    beforeDestroy: dmx.noop,
    destroyed: dmx.noop,

    addEventListener: function(type, callback) {
        if (!(type in this.listeners)) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(callback)
    },

    removeEventListener: function(type, callback) {
        if (!(type in this.listeners)) return;

        var stack = this.listeners[type];
        for (var i = 0; i < stack.length; i++) {
            if (stack[i] === callback) {
                stack.splice(i, 1);
                return this.removeEventListener(type, callback);
            }
        }
    },

    dispatchEvent: function(event, props) {
        if (typeof event == 'string') {
            try {
                var ComponentEvent = this.events[event];
                event = new ComponentEvent(event, props);
            } catch (err) {
                var eventType = event;
                event = document.createEvent('Event');
                event.initEvent(eventType, props && props.bubbles, props && props.cancelable);
                if (!(event instanceof Event)) {
                    console.warn('Unknown event ' + event, this.events);
                    return false;
                }
            }
        }

        if (!(event.type in this.listeners)) return true;

        var stack = this.listeners[event.type];
        event.target = this;
        for (var i = 0; i < stack.length; i++) {
            if (stack[i].call(this, event) === false) {
                event.preventDefault();
            }
        }

        return !event.defaultPrevented;
    },

    $addChild: function(name, node) {
        var Component = dmx.__components[name];
        var component = new Component(node, this);
        this.children.push(component);
        if (component.name) {
            this.add(component.name, component.data);
        }
    },

    $customAttributes: function(hook, node) {
        dmx.dom.getAttributes(node).forEach(function(attr) {
            if (dmx.__attributes[hook][attr.name]) {
                node.removeAttribute(attr.fullName);
                dmx.__attributes[hook][attr.name].call(this, node, attr);
            }
        }, this);
    },

    $parse: function(node) {
        node = node || this.$node;

        if (!node) return;

        if (node.nodeType === 3) {
            if (dmx.reExpression.test(node.nodeValue)) {
                this.$addBinding(node.nodeValue, function(value, oldValue) {
                    node.nodeValue = value;
                });
            }
        }

        if (node.nodeType !== 1) return;

        if (dmx.config.mapping) {
            Object.keys(dmx.config.mapping).forEach(function(map) {
                dmx.array(node.querySelectorAll(map)).forEach(function(node) {
                    if (!node.hasAttribute('is')) {
                        node.setAttribute('is', 'dmx-' + dmx.config.mapping[map]);
                    }
                });
            });
        }

        dmx.dom.walk(node, function(node) {
            if (node == this.$node) {
                // skip current node
                return;
            }

            // Element Node
            if (node.nodeType === 1) {
                var tagName = node.tagName.toLowerCase();
                var attributes = dmx.dom.getAttributes(node);

                if (dmx.reIgnoreElement.test(tagName)) {
                    // ignore element
                    return false;
                }

                this.$customAttributes('before', node);
                var idx = attributes.findIndex(function(attr) { return attr.name === 'repeat'; });
                if (idx !== -1) return false;

                if (node.hasAttribute('is')) {
                    tagName = node.getAttribute('is');
                }

                if (dmx.rePrefixed.test(tagName)) {
                    tagName = tagName.replace(/^dmx-/i, '');

                    if (tagName in dmx.__components) {
                        node.isComponent = true;
                        this.$addChild(tagName, node);
                        return false;
                    } else {
                        console.warn('Unknown component found! ' + tagName);
                        return;
                    }
                }

                //this.$customAttributes('mount', node);
                this.$customAttributes('mounted', node);
            }

            // Text Node
            if (node.nodeType === 3) {
                if (dmx.reExpression.test(node.nodeValue)) {
                    this.$addBinding(node.nodeValue, function(value, oldValue) {
                        node.nodeValue = value;
                    });
                }
            }
        }, this);
    },

    $update: function() {
        if (this.beforeUpdate() !== false) {
            var props = dmx.clone(this.props); //Object.assign({}, this.props);

            this.$updateBindings(this.propBindings);
            this.$updateBindings(this.bindings);

            this.update(props);

            this.children.forEach(function(child) {
                child.$update();
            });

            this.updated();
        }
    },

    $updateBindings: function(bindings) {
        Object.keys(bindings).forEach(function(expression) {
            var binding = bindings[expression];
            var value = dmx.parse(expression, this);

            if (JSON.stringify(value) !== JSON.stringify(binding.value)) {
                binding.callbacks.forEach(function(cb) {
                    cb.call(this, value, binding.value);
                }, this);
                binding.value = dmx.clone(value);
            }
        }, this);
    },

    $parseAttributes: function(node) {
        var self = this;

        if (this.attributes) {
            Object.keys(this.attributes).forEach(function(prop) {
                var options = self.attributes[prop];
                var value = options.default;

                if (node.hasAttribute(prop)) {
                    if (options.type == Boolean) {
                        value = true;
                    } else {
                        value = node.getAttribute(prop);

                        if (options.type == Number) {
                            value = Number(value);
                        }

                        if (options.type == String) {
                            value = String(value);
                        }

                        if (options.validate && !options.validate(value)) {
                            value = options.default;
                        }
                    }

                    node.removeAttribute(prop);
                }

                if (node.hasAttribute('dmx-bind:' + prop)) {
                    //self.$addBinding(node.getAttribute('dmx-bind:' + prop), self.$propBinding(prop).bind(self));
                    var expression = node.getAttribute('dmx-bind:' + prop);
                    var cb = self.$propBinding(prop).bind(self);
                    self.propBindings[expression] = self.propBindings[expression] || { value: null, callbacks: [] };
                    self.propBindings[expression].callbacks.push(cb);
                    cb.call(self, self.propBindings[expression].value);
                    node.removeAttribute('dmx-bind:' + prop);
                }

                self.props[prop] = dmx.clone(value);
            });
        }

        if (this.events) {
            Object.keys(this.events).forEach(function(event) {
                if (node.hasAttribute('on' + event)) {
                    self.addEventListener(event, Function('event', node.getAttribute('on' + event)));
                    node.removeAttribute('on' + event);
                }
            });
        }

        dmx.dom.getAttributes(node).forEach(function(attr) {
            if (attr.name == 'on' && this.events[attr.argument]) {
                dmx.eventListener(self, attr.argument, function(event) {
                    var returnValue = dmx.parse(attr.value, dmx.DataScope({
                        $event: event
                    }, self));

                    if (typeof returnValue == 'string') {
                        try {
                            returnValue = (new Function('event', returnValue)).call(this, event);
                        } catch(e) {
                            console.warn('Error executing "' + returnValue + '"', e);
                        }
                    }

                    return returnValue;
                }, attr.modifiers);

                node.removeAttribute(attr.fullName);
            }
        }, this);
    },

    $propBinding: function(prop) {
        var options = this.attributes[prop];
        var self = this;

        return function(value) {
            if (value === undefined) {
                value = options.default;
            }

            if (options.type == Boolean) {
                value = !!value;
            }

            if (options.type == Number) {
                value = Number(value);
            }

            if (options.type == String) {
                value = String(value);
            }

            if (options.validate && !options.validate(value)) {
                value = options.default;
            }

            self.props[prop] = dmx.clone(value);
        };
    },

    $initialData: function() {
        Object.assign(
            this.data,
            { $type: this.type },
            typeof this.initialData == 'function' ? this.initialData() : this.initialData
        );

        Object.keys(this.methods).forEach(function(method) {
            var self = this;
            this.data['__' + method] = function() {
                return self.methods[method].apply(self, Array.prototype.slice.call(arguments, 1));
            };
        }, this);
    },

    $mount: function(node) {
        if (this.$placeholder && this.$node) {
            dmx.dom.replace(this.$placeholder, this.$node);
        }
    },

    $addBinding: function(expression, cb) {
        this.bindings[expression] = this.bindings[expression] || { value: null, callbacks: [] };
        this.bindings[expression].callbacks.push(cb);
        cb.call(this, this.bindings[expression].value);
    },

    $destroy: function() {
        this.dispatchEvent('destroy');
        this.beforeDestroy();
        this.$destroyChildren();
        if (this.parent) {
            this.parent.del(this.name);
        }
        if (this.$node) {
            dmx.dom.remove(this.$node);
        }
        this.destroyed();
    },

    $destroyChildren: function() {
        this.children.forEach(function(child) {
            child.$destroy();
        });

        this.children = [];
    },

    get: function(name, ignoreParents) {
        if (this.data.hasOwnProperty(name)) {
            return this.data[name];
        }

        if (this.parent && ignoreParents !== true) {
            if (name == 'parent') {
                return this.parent.data;
            }

            return this.parent.get(name);
        }

        return null;
    },

    add: function(name, value) {
        if (this.data[name]) {
            if (Array.isArray(this.data[name])) {
                this.data[name].push(value);
            } else {
                this.data[name] = [this.data[name], value];
            }
        } else {
            this.set(name, value);
        }
        dmx.requestUpdate();
    },

    set: function(name, value) {
        if (typeof name == 'object') {
            for (var prop in name) {
                this.set(prop, name[prop]);
            }
            return;
        }

        if (JSON.stringify(this.data[name]) !== JSON.stringify(value)) {
            this.data[name] = value;
            dmx.requestUpdate();
        }
    },

    del: function(name) {
        delete this.data[name];
        dmx.requestUpdate();
    }
});
