(function() {

    var $ = function(selector) {
        if (!(this instanceof $)) {
            return new $(selector);
        }
        if (selector instanceof $) {
            return selector;
        }
        if (!selector) return this;
        var len = selector.length;
        if (selector.nodeType) {
            this[0] = selector;
            this.length = 1;
        } else if (typeof selector == 'string') {
            return $(document.querySelectorAll(selector));
        } else if (len) {
            for (var i = 0; i < len; i++) {
                if (selector[i] && selector[i].nodeType) {
                    this[this.length] = selector[i];
                    this.length++;
                }
            }
        }
        return this;
    };

    $.prototype = {
        constructor: $,
        length: 0,

        addClass: function(className) {
            for (var i = 0; i < this.length; i++) {
                this[i].classList.add(className);
            }
            return this;
        },

        removeClass: function(className) {
            for (var i = 0; i < this.length; i++) {
                this[i].classList.remove(className);
            }
            return this;
        },

        toggleClass: function(className) {
            for (var i = 0; i < this.length; i++) {
                this[i].classList.toggle(className);
            }
            return this;
        },

        hasClass: function(className) {
            if (!this[0]) return false;
            return this[0].classList.contains(className);
        },

        attr: function(attrs, value) {
            if (arguments.length === 1 && typeof attrs === 'string') {
                return this[0] && this[0].getAttribute(attrs);
            } else {
                for (var i = 0; i < this.length; i++) {
                    if (arguments.length === 2) {
                        this[i].setAttribute(attrs, value);
                    } else {
                        for (var attr in attrs) {
                            this[i].setAttribute(attr, attrs[attr]);
                        }
                    }
                }
            }
            return this;
        },

        removeAttr: function(attr) {
            for (var i = 0; i < this.length; i++) {
                this[i].removeAttribute(attr);
            }
            return this;
        },

        prop: function(props, value) {
            if (arguments.length === 1 && typeof props === 'string') {
                return this[0] && this[0][props];
            } else {
                for (var i = 0; i < this.length; i++) {
                    if (arguments.length === 2) {
                        this[i][props] = value;
                    } else {
                        for (var prop in props) {
                            this[i][prop] = props[prop];
                        }
                    }
                }
            }
            return this;
        },

        css: function(props, value) {
            if (arguments.length === 1 && typeof props === 'string') {
                return this[0] && window.getComputedStyle(this[0], null).getPropertyValue(props);
            } else {
                for (var i = 0; i < this.length; i++) {
                    if (arguments.length === 2) {
                        this[i].style.setProperty(props, value);
                    } else {
                        for (var prop in props) {
                            this[i].style.setProperty(prop, props[prop]);
                        }
                    }
                }
            }
            return this;
        },

        each: function(callback, context) {
            if (!callback) return this;
            for (var i = 0; i < this.length; i++) {
                if (callback.call(context || this[i], i, this[i]) === false) {
                    return this;
                }
            }
            return this;
        },

        append: function() {
            for (var i = 0; i < arguments.length; i++) {
                var children = $(arguments[i]);

                for (var j = 0; j < children.length; j++) {
                    this[0].appendChild(children[j]);
                }
            }
            return this;
        },

        appendTo: function(parent) {
            $(parent).append(this);
            return this;
        },

        detach: function() {
            for (var i = 0; i < this.length; i++) {
                if (this[i].parentNode) {
                    this[i].parentNode.removeChild(this[i]);
                }
            }
            return this;
        },

        empty: function() {
            for (var i = 0; i < this.length; i++) {
                this[i].innerHTML = '';
            }
            return this;
        }
    };

    dmx.dom = {

        get: function(id) {
            return $(document.getElementById(id));
        },

        select: function(query) {
            return $(query);
        },

        create: function(tagName) {
            var elem = document.createElement(tagName);
            return $(elem);
        },

        contains: function(node) {
            return document.documentElement.contains(node);
        },

        walk: function(node, fn, context) {
            if (node) {
                if (fn.call(context, node) === false) {
                    // stop going deeper when callback returns false
                    return;
                } else if (node.hasChildNodes()) {
                    Array.prototype.slice.call(node.childNodes, 0).forEach(function(node) {
                        dmx.dom.walk(node, fn, context);
                    });
                }
            }
        },

        getAttributes: function(node) {
            var attributes = [];

            if (node.nodeType == 1) {
                for (var i = 0; i < node.attributes.length; i++) {
                    var attribute = node.attributes[i];

                    if (attribute && attribute.specified && dmx.rePrefixed.test(attribute.name)) {
                        var name = attribute.name.substr(4);
                        var argument = null;
                        var modifiers = {};

                        name.split('.').forEach(function(part, i) {
                            if (i === 0) {
                                name = part;
                            } else {
                                var pos = part.indexOf(':');
                                if (pos > 0) {
                                    modifiers[part.substr(0, pos)] = part.substr(pos + 1);
                                } else {
                                    modifiers[part] = true;
                                }
                            }
                        });

                        var pos = name.indexOf(':');
                        if (pos > 0) {
                            argument = name.substr(pos + 1);
                            name = name.substr(0, pos);
                        }

                        attributes.push({
                            name: name,
                            fullName: attribute.name,
                            value: attribute.value,
                            argument: argument,
                            modifiers: modifiers
                        });
                    }
                }
            }

            return attributes;
        },

        remove: function(node) {
            if (Array.isArray(node)) {
                node.forEach(function(node) {
                    dmx.dom.remove(node);
                });
            } else {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            }
        },

        replace: function(oldNode, newNode) {
            if (oldNode.parentNode) {
                oldNode.parentNode.replaceChild(newNode, oldNode);
            }
        }

    };

})();
