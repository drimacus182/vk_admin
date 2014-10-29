Parse.initialize("WKJKY5pMblD7RWgKWPJv3w571rynv5BLSw3RrLzv", "u0gGkM5KA2CJAyxGRWg6SVLxINKDPdkMUh7hCHMk");

var callback_progress = 0;
var repo_count = 0;
var group_id;
var group_screen_name;
var admins = {};
var owners = [];
var concatResult = [];
var index = 0;
var closureIndex = 0;


function beforeStart() {
    $('#result').empty();
    admins = {};
}

function doWork() {
    beforeStart();

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

function displayError() {
    $('#result').html('Error');
}

function getGroupId(group_input) {
    var script = document.createElement('SCRIPT');
    script.src = 'https://api.vk.com/method/groups.getById?group_id=' + group_input + '&v=5.26&callback=getGroupIdCallback';
    document.getElementsByTagName("head")[0].appendChild(script);
}

function getGroupIdCallback(result) {
    if ('error' in result) {
        displayError();
        return
    }

    group_id = -(result['response'][0]['id']);
    group_screen_name = result['response'][0]['screen_name'];

    getRePosts();
}

function getRePosts() {
    for (; index < 50; index++) {
        var script = document.createElement('SCRIPT');
        script.src = 'https://api.vk.com/method/wall.get?owner_id=' + group_id + '&offset=' + index * 100 + '&extended=1&v=5.26&count=100&callback=concatCallback';
        document.getElementsByTagName("head")[0].appendChild(script);
    }
}

function concatCallback(result) {
    concatResult = concatResult.concat(result.response.items);
    closureIndex++;
    if (closureIndex === 50) {
        result.response.items = concatResult;
        getRePostsCallback(result);
    }
}

function getRePostsCallback(result) {
    repo_progress = 0;
    callback_progress = 0;

    if ('error' in result) {
        $('#result').html('Error');
        return
    }

    var posts = result['response']['items'];

    var reposts = [];
    var arrayLength = posts.length;
    for (var i = 0; i < arrayLength; i++) {
        var p = posts[i];
        if (isRepost(p)) {
            reposts.push(getPostId(p));
        }
    }

    var repostsLength = reposts.length;

    if (repostsLength == 0) $('#result').append("No reposts found");

    repo_count = repostsLength;
    for (var i = 0; i < repostsLength; i++) {
        repo_progress++;
        getPostById(reposts[i]);
    }
}

function getPostById(post_id) {
    var script = document.createElement('SCRIPT');
    script.src = 'https://api.vk.com/method/wall.getById?posts=' + post_id + '&extended=1&v=5.25&copy_history_depth=1&callback=getPostByIdCallback';
    document.getElementsByTagName("head")[0].appendChild(script);
}

function getPostByIdCallback(result) {
    if ('error' in result) {
        $('#result').html('Error');
        callback_progress++;
        return;
    }

    var post = result['response']['items'][0];
    getOwners(post);

    $('#result').append("<a href='http://vk.com/wall" + getPostId(post) + "'>" + getPostId(post) + "</a><br/>");

    var profiles = result['response']['profiles'];
    var length = profiles.length;
    for (var i = 0; i < length; i++) {
        var pr = profiles[i];
        if (owners.indexOf(parseInt(pr['id'])) < 0) {
            $('#result').append("<a href='http://vk.com/id" + pr['id'] + "'>" + pr['first_name'] + " " + pr['last_name'] + "</a><br/>");
            admins[pr['id']] = {
                first: pr['first_name'],
                last: pr['last_name']
            };
        }
    }
    callback_progress++;
    if (callback_progress >= repo_count) {
        finishHim()
    }
}

function getPostId(p) {
    return p['owner_id'] + '_' + p['id'];
}

function getOwners(p) {
    owners = [];

    var reg = /\[id(\d+)\|/g;

    var p_text = p['text'];
    var copy_history_text = p['copy_history'][0]['text'];

    var result;
    while ((result = reg.exec(p_text))) {
        owners.push(parseInt(result[1]));
    }

    while ((result = reg.exec(copy_history_text))) {
        owners.push(parseInt(result[1]));
    }

    var copy_history = p['copy_history'][0];

    var from_id_1 = p['from_id'];
    var from_id_2 = copy_history['from_id'];
    var owner_id_2 = copy_history['owner_id'];
    if ('signer_id' in copy_history) {
        owners.push(copy_history['signer_id']);
    }

    if (copy_history['post_type'] == 'reply') {
        //todo additional check needs to be here
        var reply_id = copy_history['reply_post_id'];

        var post_where_reply_id = owner_id_2 + "_" + reply_id;
        getReplyById(post_where_reply_id);
    }

    owners.push(from_id_1);
    owners.push(from_id_2);
    owners.push(owner_id_2);
}

function getLocOwners(p) {
    var loc_owners = [];
    var reg = /\[id(\d+)\|/g;

    var p_text = p['text'];
    var copy_history_text = p['copy_history'][0]['text'];

    var result;
    while ((result = reg.exec(p_text))) {
        loc_owners.push(parseInt(result[1]));
    }

    while ((result = reg.exec(copy_history_text))) {
        loc_owners.push(parseInt(result[1]));
    }

    var copy_history = p['copy_history'][0];

    var from_id_1 = p['from_id'];
    var from_id_2 = copy_history['from_id'];
    var owner_id_2 = copy_history['owner_id'];
    if ('signer_id' in copy_history) {
        loc_owners.push(copy_history['signer_id']);
    }

    loc_owners.push(from_id_1);
    loc_owners.push(from_id_2);
    loc_owners.push(owner_id_2);

    return loc_owners;
}


function getReplyById(reply_id) {
    var script = document.createElement('SCRIPT');
    script.src = 'https://api.vk.com/method/wall.getById?posts=' + post_id + '&extended=1&v=5.25&copy_history_depth=1&callback=getReplyCallback';
    document.getElementsByTagName("head")[0].appendChild(script);
}

function getReplyCallback(result) {
    if ('error' in result) {
        $('#result').html('Error');
        return;
    }
    // append owners
    var post = result['response']['items'][0];
    var loc_owners = getLocOwners(post);

    var profiles = result['response']['profiles'];
    var length = profiles.length;
    for (var i = 0; i < length; i++) {
        var pr = profiles[i];
        if (owners.indexOf(parseInt(pr['id'])) < 0) {
            owners.push(parseInt(pr['id']));
        }
    }
}


function isRepost(item) {
    return 'copy_history' in item;
}

function finishHim() {
    var stat = new Parse.Object("Stat");
    var quoteQuoteText = $('#quote_quote_text');
    stat.set("group", group);
    stat.set("admins", admins);
    stat.save();
}