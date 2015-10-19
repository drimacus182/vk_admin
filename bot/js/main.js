(function () {

    $(document).ready(function() {
        $("#submit").on("click", doWork);
    });

    $("#uid").on("keyup", function(event){
        if(event.keyCode == 13){
            $("#submit").click();
        }
    });

    function doWork() {

        var user_input = uid_from_text();

        d3.select("#main").selectAll("*").remove();

        vk("users.get", {
            user_ids: user_input,
            name_case: "Nom"
        }, function (err, resp) {
            var user = resp[0];

            vk("friends.get", {
                user_id: user.uid,
                name_case: "Nom"
            }, function (err, resp) {
                var friends = resp;
                console.log(resp);

                var main = d3.select("#main");
                main.append("p").text("Количество друзей " + friends.length);
                var wait = main.append("p").text("Подождите... ");
                var count_p = main.append("span");
                var counter = 0;
                async.mapLimit(friends, 7, function (uid, cb) {
                    vk("friends.get", {user_id: uid, name_case: "Nom"}, function (err, resp) {
                        console.log("%d - %s", counter++, resp ? resp.length : err);
                        count_p.text(counter);
                        cb(null, resp);
                    });
                }, function (err, results) {
                    console.log("Map");
                    var lengths = results.map(function (d) {
                        return d ? d.length : -1
                    });
                    console.log(lengths);

                    lengths = lengths.filter(function (d) {return d>=0});

                    wait.remove();
                    count_p.remove();

                    main.append("p").text("Медиана количества друзей у друзей :)- " + median(lengths));
//                    drawChart(lengths.map(function(d) {return d > 1000 ? 1000 : d}));
                    drawChart(lengths);
                });
            });
        });

        function vk(method, options, callback) {
            var uri = "https://api.vk.com/method/" + method + "?callback=?";

            options.version = "5.37";
            $.getJSON(uri, options, function (result) {
                if ('error' in result) {
                    return callback(result.error);
                }

                callback(null, result.response);
            });
        }

        function median(arr) {
            arr = arr.sort(d3.ascending);
            var l = arr.length;
            if (l % 2 !== 0) return arr[Math.floor(l / 2)];

            return (arr[Math.floor(l / 2)] + arr[Math.floor(l / 2 - 1)]) / 2;
        }

        function uid_from_text() {
            var text = $('#uid').val().trim();
            var reg0 = /^.*vk\.com\/(\w+)\/?/;
            if (reg0.test(text)) {
                var arr = text.match(reg0);
                if (arr.length <= 1) return displayError();
                return arr[1];
            }
        }

        function displayError() {
            d3.select("#main").append("p").text("Ошибка");
        }

        function drawChart(arr) {
            var h_data = arr.map(function (o) {
                return ["", o];
            });

            h_data.unshift(['id', '']);
            var data = google.visualization.arrayToDataTable(h_data);

            var options = {
                title: '',
                legend: { position: 'none' }
            };

            var chart = new google.visualization.Histogram(document.getElementById('chart_div'));
            chart.draw(data, options);
        }
    }

})();

