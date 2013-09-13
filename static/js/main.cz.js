
// Copyright 2009 FriendFeed
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may
// not use this file except in compliance with the License. You may obtain
// a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.

$(document).ready(function() {
    if (!window.console) window.console = {};
    if (!window.console.log) window.console.log = function() {};

    var $mbox = $("#mbox"),
        $msg = $("#message");

    $mbox.on("click", function() {
        var data = $(this).formToDict();
        updater.newMessage(data);
        return false;
    });
    $mbox.on("keypress", function(e) {
        if (e.keyCode == 13) {
            var data = $(this).formToDict();
            updater.newMessage(data);
            return false;
        }
    });
    $msg.select();
    updater.start();
});


function newMessage(form) {
    var data = form.formToDict();
    if (data.msg) {
        updater.socket.send(JSON.stringify(data));
        form.find("input[type=text]").val("").select();
    }
}


jQuery.fn.formToDict = function() {
    var fields = this.serializeArray();
    var json = {}
    for (var i = 0; i < fields.length; i++) {
        json[fields[i].name] = fields[i].value;
    }
    if (json.next) delete json.next;
    return json;
};

var updater = {
    socket: null,

    start: function() {
        var url = "ws://" + location.host + "/websocket";
    	updater.socket = new WebSocket(url);
    	updater.socket.onmessage = function(event) {
            updater.showMessage(JSON.parse(event.data));
        }
    },

    showMessage: function(data) {
        var existing = $("#m" + data.id);
        if (existing.length > 0) return;
        data.html = '<p class="msg">' + data.msg + '</p>';
        var node = $(data.html);
        node.hide();
        $("#message").prepend(node);
        node.slideDown();
    }
};