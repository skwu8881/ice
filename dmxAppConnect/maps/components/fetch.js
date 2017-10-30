dmx.Component('fetch', {

    constructor: function(node, parent) {
        this.fetch = dmx.debounce(this.fetch.bind(this));
        dmx.BaseComponent.call(this, node, parent);
    },

    initialData: {
        data: null,
        state: {
            executing: false,
            uploading: false,
            processing: false,
            downloading: false
        },
        uploadProgress: {
            position: 0,
            total: 0,
            percent: 0
        },
        downloadProgress: {
            position: 0,
            total: 0,
            percent: 0
        },
        lastError: {
            status: 0,
            message: '',
            response: null
        }
    },

    attributes: {
        timeout: {
            type: Number,
            default: 0 // timeout in seconds
        },

        url: {
            type: String,
            default: ''
        },

        params: {
            type: Object,
            default: {}
        },

        noload: {
            type: Boolean,
            default: false
        },

        cache: {
            type: String,
            default: ''
        },

        ttl: {
            type: Number,
            default: 86400 // cache ttl in seconds (default 1 day)
        }
    },

    methods: {
        abort: function() {
            this.abort();
        },

        load: function(params, reload) {
            var options = {};
            if (params) options.params = params;
            if (reload) options.ttl = 0;
            this.fetch(options);
        }
    },

    events: {
        start: Event, // when starting an ajax call
        done: Event, // when ajax call completed (success and error)
        error: Event, // server error or javascript error (json parse or network transport) or timeout error
        unauthorized: Event, // 401 status from server
        forbidden: Event, // 403 status from server
        abort: Event, // ajax call was aborted
        success: Event, // successful ajax call,
        upload: ProgressEvent, // on upload progress
        download: ProgressEvent // on download progress
    },

    $parseAttributes: function(node) {
        dmx.BaseComponent.prototype.$parseAttributes.call(this, node);
        dmx.dom.getAttributes(node).forEach(function(attr) {
            if (attr.name == 'param' && attr.argument) {
                this.$addBinding(attr.value, function(value) {
                    this.props.params[attr.argument] = value;
                });
            }
        }, this);
    },

    render: function(node) {
        this.xhr = new XMLHttpRequest();
        this.xhr.addEventListener('load', this.onload.bind(this));
        this.xhr.addEventListener('abort', this.onabort.bind(this));
        this.xhr.addEventListener('error', this.onerror.bind(this));
        this.xhr.addEventListener('timeout', this.ontimeout.bind(this));
        this.xhr.addEventListener('progress', this.onprogress('download').bind(this));
        if (this.xhr.upload) this.xhr.upload.addEventListener('progress', this.onprogress('upload').bind(this));

        dmx.BaseComponent.prototype.render.call(this, node);

        this.update({});
    },

    update: function(props) {
        // if auto load and url is set
        if (!this.props.noload && this.props.url) {
            // if url or params are changed
            if (props.url !== this.props.url || JSON.stringify(props.params) !== JSON.stringify(this.props.params)) {
                this.fetch();
            }
        }
    },

    abort: function() {
        this.xhr.abort();
    },

    fetch: function(options) {
        this.xhr.abort();

        options = dmx.extend(true, this.props, options || {});

        this._reset();
        this.dispatchEvent('start');

        var qs = (options.url.indexOf('?') > -1 ? '&' : '?') + Object.keys(options.params).filter(function(key) {
            return options.params[key] != null;
        }, this).map(function(key) {
            return encodeURIComponent(key) + '=' + encodeURIComponent(options.params[key]);
        }, this).join('&');

        this._url = options.url + qs;

        if (this.props.cache) {
            var cache = dmx.parse(this.props.cache + '.data["' + this._url + '"]', this);
            if (cache) {
                if (Date.now() - cache.created >= options.ttl * 1000) {
                    dmx.parse(this.props.cache + '.remove("' + this._url + '")', this);
                } else {
                    this.set('data', cache.data);
                    this.dispatchEvent('success');
                    this.dispatchEvent('done');
                    return;
                }
            }
        }

        this.set('state', {
            executing: true,
            uploading: false,
            processing: false,
            downloading: false
        });

        this.xhr.open('GET', this._url);
        this.xhr.timeout = options.timeout * 1000;
        try { this.xhr.send(); }
        catch (err) { this._done(err); }
    },

    _reset: function() {
        this.set({
            state: {
                executing: false,
                uploading: false,
                processing: false,
                downloading: false
            },
            uploadProgress: {
                position: 0,
                total: 0,
                percent: 0
            },
            downloadProgress: {
                position: 0,
                total: 0,
                percent: 0
            }
        });
    },

    _done: function(err) {
        this._reset();

        if (err) {
            this.set('lastError', {
                status: 0,
                message: err.message,
                response: null
            });

            this.dispatchEvent('error');
        } else {
            var response = this.xhr.responseText;

            try {
                response = JSON.parse(response);
            } catch(err) {
                this.set('lastError', {
                    status: 0,
                    message: 'Response was not valid JSON',
                    response: response
                });

                this.dispatchEvent('error');
                return;
            }

            if (this.xhr.status < 400) {
                this.set('data', response);
                this.dispatchEvent('success');

                if (this.props.cache) {
                    dmx.parse(this.props.cache + '.set("' + this._url + '", { data: data, created: ' + Date.now() + ' })', this);
                }
            } else if (this.xhr.status == 400) {
                // validation error
                this.dispatchEvent('invalid');
                // TODO: do something with the response?
            } else if (this.xhr.status == 401) {
                // unauthorized
                this.dispatchEvent('unauthorized');
            } else if (this.xhr.status == 403) {
                // forbidden for current user
                this.dispatchEvent('forbidden');
            } else {
                // some other server error
                this.set('lastError', {
                    status: this.xhr.status,
                    message: this.xhr.statusText,
                    response: response
                });

                this.dispatchEvent('error');
            }
        }

        this.dispatchEvent('done');
    },

    onload: function(event) {
        this._done();
    },

    onabort: function(event) {
        this._reset();
        this.dispatchEvent('abort');
        this.dispatchEvent('done');
    },

    onerror: function(event) {
        this._done({ message: 'Failed to execute' });
    },

    ontimeout: function(event) {
        this._done({ message: 'Execution timeout' });
    },

    onprogress: function(type) {
        return function(event) {
            event.loaded = event.loaded || event.position;

            var percent = event.lengthComputable ? Math.ceil(event.loaded / event.total * 100) : 0;

            this.set('state', {
                executing: true,
                uploading: type == 'upload' && percent < 100,
                processing: type == 'upload' && percent == 100,
                downloading: type == 'download'
            });

            this.set(type + 'Progress', {
                position: event.loaded,
                total: event.total,
                percent: percent
            });

            this.dispatchEvent(type, {
                lengthComputable: event.lengthComputable,
                loaded: event.loaded,
                total: event.total
            });
        };
    }

});
