
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
        $msg = $("input[name=msg]"),
        $mode = $("input[name=mode]"),
        $start = $("button[name=connect]"),
        $stop = $("button[name=disconnect]");

    $mbox.on("click", function() {
        var data = $(this).formToDict();
        updater.sendMessage(data);
        return false;
    });
    $mbox.on("keypress", function(e) {
        if (e.keyCode == 13) {
            var data = $(this).formToDict();
            updater.sendMessage(data);
            return false;
        }
    });

    $mode.change(function() {
        if($(this).val()=='ws' && !window.WebSocket){
            console.error("Your browser don't support WebSocket, please use LongPolling mode");
        }else if($(this).val()=='lp' && !window.LongPolling){
            console.error("Your browser don't support LongPolling now");
        }else{
            updater.mode = $(this).val();
            updater.start();
        } 
    });

    $start.on('click', function(){
        updater.start();
    });
    $stop.on('click', function(){
        updater.stop();
    });

    if(window.WebSocket) {
        $mode.first().attr('checked', true);
        updater.mode = 'ws';
    }else if(window.LongPolling){
        $mode.last().attr('checked', true);
        updater.mode = 'lp';
    }else{
        console.debug("Your broswer don't support WebSocket and LongPolling");
    }

    $msg.select();
    updater.start();
});

var tips = function(msg){
    var $tips = $('#tips');
    $mbox.text(msg);
};


jQuery.fn.formToDict = function() {
    var fields = this.serializeArray();
    var json = {}
    for (var i = 0; i < fields.length; i++) {
        json[fields[i].name] = fields[i].value;
    }
    if (json.next) delete json.next;
    return json;
};


/*
var Session = function(url) {
    var s = new Object();
    s.url = url;
    s.socket = null;
    s.connect = function(){};
    s.disconnect = function(){};
    s.send = function(msg){};
    s.onconnect = function(event){};
    s.ondisconnect = function(event){};
    s.onmessage = function(event){};
    s.onerror = function(event){};
    s.getstatus = function(){};
    return s;
};
*/

var state = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
};

// WebSecket Session
var WSSession = function(url){
    var s = new Object();
    s.url = url;
    s.socket = null;
    s.connect = function(){
        s.socket = new WebSocket(url);
        s.socket.onopen = s.onconnect;
        s.socket.onmessage = s.onmessage;
        s.socket.onclose = s.ondisconnect;
        s.socket.onerror = s.onerror;
    };
    s.disconnect = function(){
        s.socket.close();
    };
    s.send = function(msg){
        var stat = s.getstatus();
        switch(stat){
            case state.CONNECTING:
                setTimeout(function(){
                    s.socket.send(msg);
                }, 300);
                break;
            case state.OPEN:
                s.socket.send(msg);
                break;
            case state.CLOSING:
            case state.CLOSED:
                s.connect();
                setTimeout(function(){
                    s.socket.send(msg);
                }, 600);
                break;
            default: console.error('unknow status');
                break;
        }
    };
    s.onconnect = function(event){
        console.debug('connected to ' + s.url);
        console.debug(event);
    };
    s.ondisconnect = function(event){
        console.debug('disconnected to ' + s.url);
        console.debug(event);
    };
    s.onmessage = function(event){
        updater.showMessage(JSON.parse(event.data));
        console.debug(event);
    };
    s.onerror = function(event){
        console.error('connection error');
        console.error(event);
    };
    s.getstatus = function(){
        return s.socket.readyState;
    };
    return s;
};

// Long Polling Session
var LPSession = function(){
    window.LongPolling = null;
};


var updater = {
    $msg: $("#message"),
    $field: $("input[name=msg]").first(),
    session: null,
    Session: null,
    mode: null,
    url: null,

    init: function(){
        updater.stop();
        if (updater.mode == 'ws'){
            updater.Session = WSSession;
            updater.url = "ws://" + location.host + "/ws";
            console.debug('WebSocket mode');
        }else if(updater.mode == 'lp'){
            updater.Session = LPSession;
            updater.url = "http://" + location.host + "/lp";
            console.debug('LongPolling mode');
        }else{
            console.error('unknow mode');
        }
    },

    start: function() {
        updater.init();
        if(updater.mode && updater.Session){
            updater.session = new updater.Session(updater.url);
            updater.session.connect();
        }
    },

    stop: function() {
        if(updater.session && updater.session.getstatus != state.CLOSED && updater.session.disconnect){
            updater.session.disconnect();
        }
    },

    sendMessage: function(data) {
        if (data.msg && updater.mode) {
            updater.session.send(JSON.stringify(data));
            updater.$field.val("").select();
        }
    },

    showMessage: function(data) {
        var existing = $("#m" + data.id);
        if (existing.length > 0) return;
        data.html = '<p class="msg">' + data.msg + '</p>';
        var node = $(data.html);
        node.hide();
        updater.$msg.prepend(node);
        node.slideDown();
    }

};