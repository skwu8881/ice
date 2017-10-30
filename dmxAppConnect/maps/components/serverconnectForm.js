dmx.Component('serverconnect-form', {

    extends: 'form',

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

        autosubmit: {
            type: Boolean,
            default: false
        }
    },

    methods: {
        abort: function() {
            this.abort();
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

    render: function(node) {
        this.xhr = new XMLHttpRequest();
        this.xhr.addEventListener('load', this.onload.bind(this));
        this.xhr.addEventListener('abort', this.onabort.bind(this));
        this.xhr.addEventListener('error', this.onerror.bind(this));
        this.xhr.addEventListener('timeout', this.ontimeout.bind(this));
        this.xhr.addEventListener('progress', this.onprogress('download').bind(this));
        if (this.xhr.upload) this.xhr.upload.addEventListener('progress', this.onprogress('upload').bind(this));

        node.dmxExtraData = {};

        dmx.Component('form').prototype.render.call(this, node);

        if (this.props.autosubmit) {
            dmx.nextTick(function() {
                this.submit();
            }, this);
        }
    },

    abort: function() {
        this.xhr.abort();
    },

    _submit: function(extra) {
        this.xhr.abort();

        var method = this.$node.method.toUpperCase();
        var action = this.$node.action;
        var data = null, qs = '';

        if (method == 'GET') {
            qs = (action.indexOf('?') > -1 ? '&' : '?');
            qs += dmx.array(this.$node.elements).filter(function(element) {
                return (!(extra && extra[element.name])) && !element.disabled && ((element.type !== 'RADIO' && element.type !== 'CHECKBOX') || element.checked);
            }).map(function(element) {
                return escape(element.name) + '=' + escape(element.value);
            }).join('&');
            if (extra) {
                Object.keys(extra).forEach(function(key) {
                    if (Array.isArray(extra[key])) {
                        extra[key].forEach(function(value) {
                            qs += '&' + escape(key) + '=' + value;
                        });
                    } else {
                        qs += '&' + escape(key) + '=' + extra[key];
                    }
                });
            }
        } else {
            data = new FormData(this.$node);
            if (extra) {
                Object.keys(extra).forEach(function(key) {
                    data.set(key, extra[key]);
                }, this);
            }
            if (this.$node.dmxExtraData) {
                Object.keys(this.$node.dmxExtraData).forEach(function(key) {
                    var value = this.$node.dmxExtraData[key];

                    if (Array.isArray(value)) {
                        if (!/\[\]$/.test(key)) {
                            key += '[]';
                        }
                        value.forEach(function(val) {
                            data.append(key, val);
                        }, this);
                    } else {
                        data.set(key, value);
                    }
                }, this);
            }
        }

        this._reset();
        this.dispatchEvent('start');

        this.xhr.open(method, action + qs);
        this.xhr.timeout = this.props.timeout * 1000;
        try { this.xhr.send(data); }
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
            } else if (this.xhr.status == 400) {
                // validation error
                this.dispatchEvent('invalid');

                if (this.$node.action.indexOf('dmxConnect/') > -1 && response.form) {
                    for (var name in response.form) {
                        var element = document.querySelector('[name="' + name + '"]');
                        if (element) {
                            element.setCustomValidity(response.form[name]);
                            dmx.requestUpdate();
                            if (dmx.bootstrap3forms) {
                                dmx.validate.setBootstrapMessage(element, response.form[name]);
                            } else {
                                dmx.validate.setErrorMessage(element, response.form[name]);
                            }
                        }
                    }
                } else {
                    console.warn('400 error, no form errors in response.', response);
                }
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
