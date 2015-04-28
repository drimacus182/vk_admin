(function () {

    function beforeStart() {
        $('#result').empty();
    }

    function doWork() {
        beforeStart();
        $('#loading_img').removeClass('nodisplay');

        var group_input = $('#group_id').val().trim();
        var reg0 = /^.*vk\.com\/(\w+)\/?/;
        if (reg0.test(group_input)) {
            var arr = group_input.match(reg0);
            if (arr.length <= 1) {
                displayError();
                return;
            }
            group_input = arr[1];
        }

        // One more transformation

        var reg = /^public\d+$/;

        if (reg.test(group_input)) {
            group_input = group_input.replace("public", "club");
        }

        getGroupId(group_input)
    }

    function displayError(err) {
        var error_msg = err ? err.error_msg : "";
        $('#result').html('Error: ' + error_msg);
    }

    function getGroupId(group_input) {
        $.getJSON("https://api.vk.com/method/groups.getById?callback=?",
            {
                group_id: group_input,
                v: "5.26"
            }, function (result) {
                if ('error' in result) {
                    displayError(result.error);
                    return;
                }
                var group_id = -(result['response'][0]['id']);
                getRePosts(group_id);
            });
    }

    function getRePosts(group_id) {
        $.getJSON('https://api.vk.com/method/wall.get?callback=?',
            {
                owner_id: group_id,
                extended: 1,
                count: 100,
                v: "5.26"
            }, function (result) {
                if ('error' in result) {
                    displayError(result.error);
                    return;
                }
                var reposts = result['response']['items']
                    .filter(isRepost);

                if (reposts.length == 0) {
                    $('#result').append("No reposts found");
                    $('#loading_img').addClass('nodisplay');
                }
                async.eachLimit(reposts, 5, wallGetThisRepost, finishHim);
            });
    }

    function finishHim(err) {
        $('#result').append("Done");
        $('#loading_img').addClass('nodisplay');
    }

//async.until() //todo further use closure for communication between functions

    function wallGetThisRepost(repost, callback) {
        var orig = repost.copy_history[0];
        wallGetReposts(orig.from_id, orig.id, 0, 20, function (json) {
            var i = 0;
            var rep_objects = json.response.items
                .map(function (r) {
                    return {r: r, pos: i++};
                })
                .filter(function (o) {
                    return o.r.from_id == repost.from_id && o.r.id == repost.id;
                });
            if (rep_objects.length == 0) {
//                console.log("Nothing found in first 20");
                callback();
                return; //todo do with async until or whilst
            }

            var r = rep_objects[0].r;
            var position = rep_objects[0].pos;

            wallGetReposts(orig.from_id, orig.id, position, 1, function (json) {
                var post = json.response.items[0];

                $('#result').append("<p>");
                $('#result').append("<a href='" + genPostUrl(post) + "'>" + genPostUrl(post) + "</a><br/>");
                var owners = getOwners(post);
                if (post.comments.list) post.comments.list.map(function (c) {
                    owners.push(+c.from_id)
                }); //add ids from comments

                json.response.profiles
                    .filter(function (pr) {
                        return !~owners.indexOf(+(pr.id))
                    })
                    .map(function (pr) {
                        $('#result').append("<a href='http://vk.com/id" + pr.id + "'>" + pr.first_name + " " + pr.last_name + "</a><br/>");
                    });
                $('#result').append("</p>");
                callback();
            });
        });
    }

    function wallGetReposts(owner_id, post_id, offset, count, callback) {
        $.getJSON('https://api.vk.com/method/wall.getReposts?callback=?',
            {
                owner_id: owner_id,
                post_id: post_id,
                offset: offset,
                count: count,
                v: "5.30"
            }, callback);
    }

    function genPostUrl(p) {
        return 'http://vk.com/wall' + p.from_id + '_' + p.id;
    }

    function getOwners(p) {
        var owners = [];
        var reg = /\[id(\d+)\|/g;
        var full_text = JSON.stringify(p);

        var result;
        while ((result = reg.exec(full_text))) {
            owners.push(parseInt(result[1]));
        }

        var copy_history = p['copy_history'][0];

        var from_id_1 = p['from_id'];
        var from_id_2 = copy_history['from_id'];
        var owner_id_2 = copy_history['owner_id'];
        if ('signer_id' in copy_history) {
            owners.push(copy_history['signer_id']);
        }
        owners.push(from_id_1);
        owners.push(from_id_2);
        owners.push(owner_id_2);
        return owners;
    }

    function isRepost(item) {
        return 'copy_history' in item && item.copy_history[0].post_type == 'post';
    }

    window.doWork = doWork;
})();
