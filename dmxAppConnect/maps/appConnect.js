window.dmx = window.dmx || {};

dmx.__components = {};
dmx.__attributes = {
    before: {},
    mount: {},
    mounted: {}
};
dmx.__formatters = {
    boolean: {},
    global: {},
    string: {},
    number: {},
    object: {},
    array: {}
};
dmx.__adapters = {};
dmx.__actions = {};

// default options
dmx.config = {
    mapping: {
        'form': 'form',
        'button, input[type=button], input[type=submit], input[type=reset]': 'button',
        'input[type=radio]': 'radio',
        'input[type=checkbox]': 'checkbox',
        'input[type=file][multiple]': 'input-file-multiple',
        'input[type=file]': 'input-file',
        'input[type=number]': 'input-number',
        'input': 'input',
        'textarea': 'textarea',
        'select[multiple]': 'select-multiple',
        'select': 'select',
        '.checkbox-group': 'checkbox-group',
        '.radio-group': 'radio-group'
    }
};

dmx.reIgnoreElement = /^(script|style)$/i;
dmx.rePrefixed = /^dmx-/i;
dmx.reExpression = /\{\{(.+?)\}\}/;
dmx.reExpressionReplace = /\{\{(.+?)\}\}/g;
dmx.reToggleAttribute = /^(checked|selected|disabled|required|hidden|async|autofocus|autoplay|default|defer|multiple|muted|novalidate|open|readonly|reversed|scoped)$/i;
dmx.reDashAlpha = /-([a-z])/g;
dmx.reUppercase = /[A-Z]/g;

dmx.appConnect = function(node, cb) {
    if (dmx.app) {
        return alert('App already running!');
    }

    node = node || document.documentElement;

    window.onpopstate = function() {
        dmx.requestUpdate();
    };

    window.onhashchange = function() {
        dmx.requestUpdate();
    };

    var App = dmx.Component('app');

    dmx.app = new App(node); //BaseComponent(node);
    dmx.app.$update();
    if (cb) cb();
};

document.addEventListener('DOMContentLoaded', function() {
    var appNode = document.querySelector(':root[dmx-app], [dmx-app], :root[is="dmx-app"], [is="dmx-app"]');
    if (appNode) {
        dmx.appConnect(appNode, function() {
            appNode.removeAttribute('dmx-app');
        });
    }
});

dmx.useHistory = window.history && window.history.pushState;

dmx.extend = function () {
    // Variables
    var extended = {};
    var deep = false;
    var i = 0;
    var length = arguments.length;

    // Check if a deep merge
    if ( Object.prototype.toString.call( arguments[0] ) === '[object Boolean]' ) {
        deep = arguments[0];
        i++;
    }

    // Merge the object into the extended object
    var merge = function (obj) {
        for ( var prop in obj ) {
            if ( Object.prototype.hasOwnProperty.call( obj, prop ) ) {
                // If deep merge and property is an object, merge properties
                if ( deep && Object.prototype.toString.call(obj[prop]) === '[object Object]' ) {
                    extended[prop] = dmx.extend( true, extended[prop], obj[prop] );
                } else {
                    if (obj[prop] != null) {
                        extended[prop] = obj[prop];
                    }
                }
            }
        }
    };

    // Loop through each object and conduct a merge
    for ( ; i < length; i++ ) {
        var obj = arguments[i];
        merge(obj);
    }

    return extended;
};

dmx.noop = function() {};

dmx.isset = function(val) {
    return v !== undefined;
};

dmx.clone = function(o) {
    return o && JSON.parse(JSON.stringify(o));
};

dmx.array = function(arr) {
    if (arr == null) return [];
    return Array.prototype.slice.call(arr);
};

dmx.hashCode = function(o) {
    if (o == null) return 0;
    var str = JSON.stringify(o);
    var i, hash = 0;
    for (i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
};

dmx.randomizer = function(seed) {
    seed = +seed || 0;
    return function() {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
};

dmx.escapeRegExp = function(val) {
    // https://github.com/benjamingr/RegExp.escape
    return val.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
};

dmx.validate = function(node) {
    return node.checkValidity();
};

if (window.setImmediate) {
    dmx.nextTick = function(fn, context) {
        return window.setImmediate(fn.bind(context));
    };
} else if (window.postMessage) {
    (function() {
        var queue = [];

        window.addEventListener('message', function(event) {
            if (event.source === window && event.data === 'dmxNextTick' && queue.length) {
                var task = queue.shift();
                task.fn.call(task.context);
            }
        });

        dmx.nextTick = function(fn, context) {
            queue.push({ fn: fn, context: context });
            window.postMessage('dmxNextTick', '*');
        };
    })();
} else {
    dmx.nextTick = function(fn, context) {
        window.setTimeout(fn.bind(context), 0);
    };
}

dmx.requestUpdate = function() {
    var updateRequested = false;

    return function() {
        if (!updateRequested) {
            updateRequested = true;

            dmx.nextTick(function() {
                updateRequested = false;
                if (dmx.app) {
                    dmx.app.$update();
                }
            });
        }
    };
}();

dmx.debounce = function(fn, delay) {
    var timeout;

    return function() {
        var args = Array.prototype.slice.call(arguments);
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            fn.apply(null, args);
        }, delay || 0);
    };
};

dmx.keyCodes = {
    bs: 8,
    tab: 9,
    enter: 13,
    esc: 27,
    space: 32,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    'delete': 46
};

dmx.eventListener = function(target, eventType, handler, modifiers) {
    var timeout;

    modifiers = modifiers || {};

    target.addEventListener(eventType, function(event) {
        if (modifiers.self && event.target !== event.currentTarget) return;
        if (modifiers.ctrl && !event.ctrlKey) return;
        if (modifiers.alt && !event.altKey) return;
        if (modifiers.shift && !event.shiftKey) return;
        if (modifiers.meta && !event.metaKey) return;

        if (modifiers.stop) event.stopPropagation();
        if (modifiers.prevent) event.preventDefault();

        if (event instanceof KeyboardEvent) {
            var keys = [];

            Object.keys(modifiers).forEach(function(key) {
                var keyVal = parseInt(key, 10);

                if (keyVal) {
                    keys.push(keyVal);
                } else if (dmx.keyCodes[key]) {
                    keys.push(dmx.keyCodes[key]);
                }
            });

            for (var i = 0; i < keys.length; i++) {
                if (event.which !== keys[i]) return;
            }
        }

        if (modifiers.debounce) {
            clearTimeout(timeout);
            timeout = setTimeout(handler.bind(this, event), parseInt(modifiers.debounce, 10) || 0);
        } else {
            return handler.call(this, event);
        }
    }, !!modifiers.capture);
};

dmx.createClass = function(proto, parentClass) {
    var Cls = function() {
        if (proto.constructor) {
            proto.constructor.apply(this, arguments);
        }
    };

    if (parentClass && parentClass.prototype) {
        Cls.prototype = Object.create(parentClass.prototype);
    }

    Object.assign(Cls.prototype, proto);

    Cls.prototype.constructor = Cls;

    return Cls;
};

dmx.Config = function(config) {
    Object.assign(dmx.config, config);
};

dmx.Component = function(tag, proto) {
    if (proto) {
        var parentClass = dmx.Component(proto.extends) || dmx.BaseComponent; //dmx.__components[proto.extends ? proto.extends : 'base'];

        //if (proto.extends !== tag) {
            //parentClass = dmx.Components(extends);

            proto.initialData = Object.assign({}, parentClass.prototype.initialData, proto.initialData);
            proto.attributes = Object.assign({}, parentClass.prototype.attributes, proto.attributes);
            proto.methods = Object.assign({}, parentClass.prototype.methods, proto.methods);
            proto.events = Object.assign({}, parentClass.prototype.events, proto.events);

            if (!proto.hasOwnProperty('constructor')) {
                proto.constructor = function(node, parent) {
                    parentClass.call(this, node, parent);
                };
            }
        //}

        proto.type = tag;

        var Component = dmx.createClass(proto, parentClass);
        Component.extends = proto.extends;

        dmx.__components[tag] = Component;
    }

    return dmx.__components[tag];
};

dmx.Attribute = function(name, hook, fn) {
    if (!dmx.__attributes[hook]) {
        dmx.__attributes[hook] = {};
    }
    dmx.__attributes[hook][name] = fn;
};

dmx.Formatters = function(type, o) {
    if (!dmx.__formatters[type]) {
        dmx.__formatters[type] = {};
    }
    for (var name in o) {
        dmx.__formatters[type][name] = o[name];
    }
};

dmx.Formatter = function(type, name, fn) {
    if (!dmx.__formatters[type]) {
        dmx.__formatters[type] = {};
    }
    dmx.__formatters[type][name] = fn;
};

dmx.Adapter = function(type, name, fn) {
    if (!dmx.__adapters[type]) {
        dmx.__adapters[type] = {};
    }

    if (fn) {
        dmx.__adapters[type][name] = fn;
    }

    return dmx.__adapters[type][name];
};

dmx.Action = function(name, action) {
    dmx.__actions[name] = action;
};
