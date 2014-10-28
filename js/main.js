Parse.initialize("WKJKY5pMblD7RWgKWPJv3w571rynv5BLSw3RrLzv", "u0gGkM5KA2CJAyxGRWg6SVLxINKDPdkMUh7hCHMk");

var callback_progress = 0;
var repo_count = 0;
var group;
var admins = {};

function getPostsCallback(result) {
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
    repo_count = repostsLength;
    for (var i=0; i<repostsLength; i++) {
        if (i==repostsLength-1) {
            isAboutFinish = true;
        }
        repo_progress++;
        getPostById(reposts[i]);
    }
}

function getPostIdCallback(result) {
    if ('error' in result) {
        $('#result').html('Error');
        callback_progress++;
        return;
    }

    var post = result['response']['items'][0];
    var owners = getOwners(post);

    $('#result').append("<a href='http://vk.com/kpi_live?w=wall" + getPostId(post) +"'>" + getPostId(post) +"</a><br/>");

    var profiles = result['response']['profiles'];
    var length = profiles.length;
    for (var i = 0; i<length; i++) {
        var pr = profiles[i];
        if (owners.indexOf(pr['id']) < 0) {
            $('#result').append("<a href='http://vk.com/id" + pr['id'] + "'>" + pr['first_name'] + " " + pr['last_name'] +"</a><br/>");
            admins[pr['id']] = {first:pr['first_name'], last:pr['last_name']};
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
    var owners = [];
    var reg = /\[id(\d+)\|/g;

    var p_text = p['text'];
    var copy_history_text = p['copy_history'][0]['text'];

    var result;
    while ( (result = reg.exec(p_text)) ) {
        owners.push(parseInt(result[1]));
    }

    while ( (result = reg.exec(copy_history_text)) ) {
        owners.push(parseInt(result[1]));
    }

    var from_id_1 = p['from_id'];
    var from_id_2 = p['copy_history'][0]['from_id'];
    if ('signer_id' in p['copy_history'][0]) {
        owners.push(p['copy_history'][0]['signer_id'])
    }

    owners.push(from_id_1);
    owners.push(from_id_2);
    return owners;
}

function getPosts() {
    $('#result').empty();
    admins = {};
    group = $('#group_id').val().trim();

    var script = document.createElement('SCRIPT');
    script.src = 'https://api.vk.com/method/wall.get?domain=' + group + '&extended=1&v=5.25&count=30&callback=getPostsCallback';
    document.getElementsByTagName("head")[0].appendChild(script);
}

function getPostById(post_id) {
    var script = document.createElement('SCRIPT');
    script.src = 'https://api.vk.com/method/wall.getById?posts=' + post_id + '&extended=1&v=5.25&copy_history_depth=1&callback=getPostIdCallback';
    document.getElementsByTagName("head")[0].appendChild(script);
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

