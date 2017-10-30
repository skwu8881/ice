dmx.Component('repeat', {

    initialData: {
        items: []
    },

    attributes: {
        repeat: {
            type: [Array, Object, Number],
            default: []
        },

        key: {
            type: String,
            default: ''
        }
    },

    events: {
        update: Event,
        updated: Event
    },

    render: function(node) {
        this.prevItems = [];
        this.childKeys = {};
        this.$template = document.createDocumentFragment();
        while (this.$node.hasChildNodes()) {
            this.$template.appendChild(this.$node.firstChild);
        }
        // call update for first inital data
        this.update({ repeat: [] });
    },

    update: function(props) {
        if (JSON.stringify(props.repeat) != JSON.stringify(this.props.repeat)) {
            this.dispatchEvent('update');

            if (props.key !== this.props.key) {
                this._clear();
            }

            var RepeatItem = dmx.Component('repeat-item');
            var repeat = this.props.repeat;
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

            if (items.length) {
                if (this.props.key && items[0].hasOwnProperty(this.props.key) && this.prevItems.length) {
                    // keyed repeater (https://github.com/localvoid/kivi/blob/master/lib/vnode.ts#L1320-L1513)
                    var key = this.props.key;
                    var a = this.prevItems;
                    var b = this._clone(items);
                    var aStart = 0;
                    var bStart = 0;
                    var aEnd = a.length - 1;
                    var bEnd = b.length - 1;
                    var i, j, nextPos;

                    outer: while (true) {
                        // remove same keys from start
                        while (a[aStart][key] === b[bStart][key]) {
                            this.childKeys[b[bStart][key]].set(b[bStart]);
                            aStart++;
                            bStart++;
                            if (aStart > aEnd || bStart > bEnd) {
                                break outer;
                            }
                        }

                        // remove same keys at end
                        while (a[aEnd][key] === b[bEnd][key]) {
                            this.childKeys[b[bEnd][key]].set(b[bEnd]);
                            aEnd--;
                            bEnd--;
                            if (aStart > aEnd || bStart > bEnd) {
                                break outer;
                            }
                        }

                        // move from right to left
                        if (a[aEnd][key] === b[bStart][key]) {
                            this.childKeys[b[bStart][key]].set(b[bStart]);
                            this._moveChild(b[bStart][key], a[aStart][key]);
                            aEnd--;
                            bStart++;
                            if (aStart > aEnd || bStart > bEnd) {
                                break;
                            }
                            continue;
                        }

                        // move from left to right
                        if (a[aStart][key] === b[bEnd][key]) {
                            nextPos = bEnd + 1;
                            this.childKeys[b[bEnd][key]].set(b[bEnd]);
                            this._moveChild(b[bEnd][key], b[nextPos] && b[nextPos][key]);
                            aStart++;
                            bEnd--;
                            if (aStart > aEnd || bStart > bEnd) {
                                break;
                            }
                            continue;
                        }

                        break;
                    }

                    if (aStart > aEnd) {
                        // insert rest from b
                        nextPos = bEnd + 1;
                        while (bStart <= bEnd) {
                            this._insertChild(b[bStart++], b[nextPos] && b[nextPos][key]);
                        }
                    } else if (bStart > bEnd) {
                        // remove rest from a
                        while (aStart <= aEnd) {
                            this._removeChild(a[aStart++][key]);
                        }
                    } else {
                        var aLength = aEnd - aStart + 1;
                        var bLength = bEnd - bStart + 1;
                        var aNullable = a;
                        var sources = new Array(bLength).fill(-1);

                        var moved = false;
                        var pos = 0;
                        var synced = 0;

                        if ((bLength <= 4) || ((aLength * bLength) <= 16)) {
                            for (i = aStart; i <= aEnd; i++) {
                                if (synced < bLength) {
                                    for (j = bStart; j <= bEnd; j++) {
                                        if (a[i][key] === b[j][key]) {
                                            sources[j - bStart] = i;

                                            if (pos > j) {
                                                moved = true;
                                            } else {
                                                pos = j;
                                            }

                                            this.childKeys[b[j][key]].set(b[j]);

                                            synced++;
                                            aNullable[i] = null;
                                            break;
                                        }
                                    }
                                }
                            }
                        } else {
                            var keyIndex = {};

                            for (i = bStart; i <= bEnd; i++) {
                                keyIndex[b[i][key]] = i;
                            }

                            for (i = aStart; i <= aEnd; i++) {
                                if (synced < bLength) {
                                    j = keyIndex[a[i][key]];

                                    if (j !== undefined) {
                                        sources[j - bStart] = i;

                                        if (pos > j) {
                                            moved = true;
                                        } else {
                                            pos = j;
                                        }

                                        this.childKeys[b[j][key]].set(b[j]);

                                        synced++;
                                        aNullable[i] = null;
                                    }
                                }
                            }
                        }

                        if (aLength === a.length && synced === 0) {
                            this._clear();
                            while (bStart < bLength) {
                                this._insertChild(b[bStart++], null);
                            }
                        } else {
                            i = aLength - synced;
                            while (i > 0) {
                                if (aNullable[aStart] !== null) {
                                    this._removeChild(a[aStart][key]);
                                    i--;
                                }
                                aStart++;
                            }

                            if (moved) {
                                var seq = this._lis(sources);
                                j = seq.length - 1;
                                for (i = bLength - 1; i >= 0; i--) {
                                    if (sources[i] === -1) {
                                        pos = i + bStart;
                                        nextPos = pos + 1;
                                        this._insertChild(b[pos], b[nextPos] && b[nextPos][key]);
                                    } else {
                                        if (j < 0 || i !== seq[j]) {
                                            pos = i + bStart;
                                            nextPos = pos + 1;
                                            this._moveChild(b[pos][key], b[nextPos] && b[nextPos][key]);
                                        } else {
                                            j--;
                                        }
                                    }
                                }
                            } else if (synced !== bLength) {
                                for (i = bLength - 1; i >= 0; i--) {
                                    if (sources[i] === -1) {
                                        pos = i + bStart;
                                        nextPos = pos + 1;
                                        this._insertChild(b[pos], b[nextPos] && b[nextPos][key]);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    if (this.children.length > items.length) {
                        // remove some children
                        this.children.splice(items.length).forEach(function(child) {
                            child.$destroy();
                        });
                    }

                    if (this.children.length) {
                        // update existing children
                        this.children.forEach(function(child, i) {
                            child.set(items[i]);
                        });
                    }

                    if (items.length > this.children.length) {
                        // add new children
                        var fragment = document.createDocumentFragment();

                        for (var i = this.children.length; i < items.length; i++) {
                            var child = new RepeatItem(this.$template.cloneNode(true), this, items[i]);
                            child.$nodes.forEach(function(node) {
                                fragment.appendChild(node);
                                child.$parse(node);
                            });
                            this.children.push(child);
                        }

                        this.$node.appendChild(fragment);
                    }
                }
            } else {
                this._clear();
            }

            if (this.props.key) {
                this.prevItems = this._clone(items);
                this.children.forEach(function(child) {
                    this.childKeys[child.data[this.props.key]] = child;
                }, this);
            }

            this.set('items', items);

            dmx.nextTick(function() {
                this.dispatchEvent('updated');
            }, this);
        }
    },

    _lis: function(a) {
        var p = a.slice(0);
        var result = [];
        result.push(0);
        var u, v;

        for (var i = 0, il = a.length; i < il; i++) {
            if (a[i] === -1) {
                continue;
            }

            var j = result[result.length - 1];
            if (a[j] < a[i]) {
                p[i] = j;
                result.push(i);
                continue;
            }

            u = 0;
            v = result.length - 1;

            while (u < v) {
                var c = ((u + v) / 2) | 0;
                if (a[result[c]] < a[i]) {
                    u = c + 1;
                } else {
                    v = c;
                }
            }

            if (a[i] < a[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }

        u = result.length;
        v = result[u - 1];

        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }

        return result;
    },

    _clear: function() {
        //this.$node.innerHTML = '';
        this.childKeys = {};
        this.children.splice(0).forEach(function(child) {
            child.$destroy();
        });
    },

    _insertChild: function(data, before) {
        var RepeatItem = dmx.Component('repeat-item');
        var child = new RepeatItem(this.$template.cloneNode(true), this, data);

        child.$nodes.forEach(function(node) {
            if (!before) {
                this.$node.appendChild(node);
            } else {
                if (this.childKeys[before]) {
                    this.$node.insertBefore(node, this.childKeys[before].$nodes[0]);
                } else {
                    console.warn('(insert) can not insert node before key ' + before + '!');
                }
            }

            child.$parse(node);
        }, this);

        this.childKeys[data[this.props.key]] = child;
        this.children.push(child);
    },

    _moveChild: function(key, before) {
        var child = this.childKeys[key];

        if (child) {
            if (this.childKeys[before]) {
                child.$nodes.forEach(function(node) {
                    this.$node.insertBefore(node, this.childKeys[before].$nodes[0]);
                }, this);
            } else {
                child.$nodes.forEach(function(node) {
                    this.$node.appendChild(node);
                }, this);
            }
        } else {
            console.warn('(move) child with key ' + key + ' not found!');
        }
    },

    _removeChild: function(key) {
        var child = this.childKeys[key];
        if (child) {
            child.$destroy();
            this.children.splice(this.children.indexOf(child), 1);
            delete this.childKeys[key];
        } else {
            console.warn('(remove) child with key ' + key + ' not found!');
        }
    },

    _clone: function(o) {
        return JSON.parse(JSON.stringify(o));
    }

});
