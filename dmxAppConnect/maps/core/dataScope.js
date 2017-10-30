dmx.DataScope = function(data, parent) {
    return {
        parent: parent || dmx.app,
        data: data,
        seed: Math.random(),
        get: function(name) {
            if (this.data.hasOwnProperty(name)) {
                return this.data[name];
            }

            if (this.parent) {
                if (name == 'parent') {
                    return this.parent.data;
                }

                return this.parent.get(name);
            }

            return undefined;
        }
    };
};
