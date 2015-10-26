var request = require("request");
var async = require("async");
var fs = require("fs");

var group_id = "kpi_live";

var step = 1000;
var offset = 0;

vk("groups.getMembers", {group_id: group_id, offset: 0, count: 0}, function (err, response) {
    if (err) throw err;
    var total = response.count;

    var arr = [];
    for (var i = 0; i < Math.floor(total / step); i++) arr.push(i);
//    for (var i = 0; i < 5; i++) arr.push(i);

    async.mapLimit(arr, 1, function (i, cb) {
            console.log("doing %d", i);
            vk("groups.getMembers", {
                group_id: group_id,
                offset: i * step,
                count: step
            }, cb);
        },
        function (err, results) {
            if (err) throw err;
            var res = results.reduce(function(o,v,i){
                Array.prototype.push.apply(o, v.users);
                return o;
            }, []);

            fs.writeFileSync("out.json", JSON.stringify(res, null, 4));

        });

});

function vk(method, options, callback) {
    var uri = "https://api.vk.com/method/" + method;

    if (!options.version) options.version = "5.37";

    request({
        uri: uri,
        qs: options
    }, function (err, response, body) {
        if (err || !response || response.statusCode !== 200) {
            console.log('-----> Request error.');
            return callback("request error");
        }

        var json = JSON.parse(body);
        if ('error' in json) {
            return callback(json.error);
        }
        return callback(null, json.response);
    });

}

