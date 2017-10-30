dmx.Component('app', {

    initialData: {
        query: {}
    },

    attributes: {},

    methods: {},

    event: {
        ready: Event,
        load: Event
    },

    render: function(node) {
        this.parseQuery();
        this.$parse();
        window.addEventListener('load', this.onload.bind(this));
        dmx.nextTick(function() {
            this.dispatchEvent('ready');
        }, this);
    },

    update: function() {
        this.parseQuery();
    },

    onload: function() {
        this.dispatchEvent('load');
    },

    parseQuery: function() {
        var query = '';

        if (window.location.search) {
            query = window.location.search.substr(1);
        } else if (window.location.hash.indexOf('?')) {
            query = window.location.hash.substr(window.location.hash.indexOf('?') + 1);
            if (query.indexOf('#')) {
                query = query.substr(0, query.indexOf('#'));
            }
        }

        this.set('query', query.split('&').reduce(function(query, part) {
            var p = part.split('=');
            if (p[0]) {
                query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
            }
            return query;
        }, {}));
    }

});
