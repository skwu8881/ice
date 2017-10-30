dmx.Component('datetime', {

    initialData: function() {
        return {
            datetime: this.datetime()
        };
    },

    attributes: {
        interval: {
            type: String,
            default: 'seconds' // seconds, minutes, hours, days
        },

        utc: {
            type: Boolean,
            default: false
        }
    },

    render: function() {
        this.timer();
    },

    timer: function() {
        this.set('datetime', this.datetime());
        requestAnimationFrame(this.timer.bind(this));
    },

    datetime: function() {
        var date = new Date(), year, month, day, hours, minutes, seconds;
        var pad = function(n, d) { return ('0000' + n).substr(-d); };

        if (this.props.utc) {
            year = date.getUTCFullYear();
            month = date.getUTCMonth() + 1;
            day = date.getUTCDate();
            hours = date.getUTCHours();
            minutes = date.getUTCMinutes();
            seconds = date.getUTCSeconds();
        } else {
            year = date.getFullYear();
            month = date.getMonth() + 1;
            day = date.getDate();
            hours = date.getHours();
            minutes = date.getMinutes();
            seconds = date.getSeconds();
        }

        var dateString = pad(year, 4) + '-' + pad(month, 2) + '-' + pad(day, 2);
        var tz = this.props.utc ? 'Z' : '';

        switch (this.props.interval) {
            case 'days': return dateString + 'T00:00:00' + tz;
            case 'hours': return dateString + 'T' + pad(hours, 2) + ':00:00' + tz;
            case 'minutes': return dateString + 'T' + pad(hours, 2) + ':' + pad(minutes, 2) + ':00' + tz;
        }

        return dateString + 'T' + pad(hours, 2) + ':' + pad(minutes, 2) + ':' + pad(seconds, 2) + tz;
    }

});
