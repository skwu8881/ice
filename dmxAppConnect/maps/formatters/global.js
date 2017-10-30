dmx.Formatters('global', {

    // json(obj:Any):String
    json: function(obj) {
        return JSON.stringify(obj);
    },

    // log(obj:Any):Any
    log: function(obj) {
        console.log(obj);
        return obj;
    }

});
