"use strict";
var rxjs_1 = require('rxjs');
var now = require("performance-now");
var globalEventHandlerClient = (function () {
    function globalEventHandlerClient(port, host) {
        var _this = this;
        this.port = port;
        this.host = host;
        this.eventListeners = {};
        this.events = [];
        this.createEvent = function (_eventName, key) {
            var newEvent = new globalEvent(_eventName, key, _this._socket, _this.disposeEvent);
            _this.events.push(newEvent);
            return newEvent;
        };
        this.disposeEvent = function (_eventId) {
            var c = _this.events.length;
            for (var index = 0; index < c; index++) {
                if (_this.events[index].eventId == _eventId) {
                    _this.events.slice(index, 1);
                }
            }
        };
        this.createEventLissener = function (_eventName, key) {
            var newEventLissener = new globalEventLissener(_eventName, key, _this._socket, _this.disposeEventLissener);
            _this.eventListeners[newEventLissener.eventId] = newEventLissener;
            return newEventLissener;
        };
        this.disposeEventLissener = function (_eventId) {
            delete _this.eventListeners[_eventId];
        };
        var tA, tB, tId = [];
        var net = require('net'), JsonSocket = require('json-socket');
        //var port = 9838; //The same port that the server is listening on 
        //var host = '127.0.0.1';
        this._socket = new JsonSocket(new net.Socket()); //Decorate a standard net.Socket with JsonSocket 
        this._socket.connect(port, host);
        var localSubjects = [];
        var vm = this;
        this._socket.on('connect', function () {
            console.log('connected');
            vm.events.forEach(function (n) {
                n.connectToSocket(vm._socket);
            });
            for (var n in vm.eventListeners) {
                vm.eventListeners[n].connectToSocket(vm._socket);
            }
            vm._socket.on('message', function (message) {
                if (vm.eventListeners[message.eventId])
                    vm.eventListeners[message.eventId].subject.next(message.evPackage);
            });
            vm._socket.on('error', function (exc) {
                console.log("ignoring exception: " + exc);
            });
        });
    }
    return globalEventHandlerClient;
}());
exports.globalEventHandlerClient = globalEventHandlerClient;
var globalEvent = (function () {
    function globalEvent(eventName, key, socket, _dispose) {
        var _this = this;
        this.eventName = eventName;
        this.key = key;
        this.socket = socket;
        this._dispose = _dispose;
        this.eventId = Math.random().toString() + now().toString();
        this.connectToSocket = function (_socket) {
            _this.socket = _socket;
        };
        this.next = function (_msg) {
            _this.socket.sendMessage({ type: 'onEvent', key: _this.key, evPackage: { name: _this.eventName, tId: _this.eventId, msg: _msg } });
        };
        this.dispose = function () {
            _this._dispose(_this.eventId);
        };
        this.connectToSocket(socket);
    }
    return globalEvent;
}());
exports.globalEvent = globalEvent;
var globalEventLissener = (function () {
    function globalEventLissener(eventName, key, _socket, _dispose) {
        var _this = this;
        this.eventName = eventName;
        this.key = key;
        this._socket = _socket;
        this._dispose = _dispose;
        this.eventId = Math.random().toString() + now().toString();
        this.connectToSocket = function (_socket) {
            _this._socket = _socket;
            _this._socket.sendMessage({ type: 'addEvent', eventId: _this.eventId, key: _this.key });
        };
        this.dispose = function () {
            _this._socket.sendMessage({ type: 'removeEvent', eventId: _this.eventId });
            _this.subject.complete();
            _this._dispose(_this.eventId);
        };
        var vm = this;
        this.observable = rxjs_1.Observable.create(function (_subject) {
            vm.subject = _subject;
            vm.connectToSocket(vm._socket);
            return vm.dispose;
        });
    }
    return globalEventLissener;
}());
exports.globalEventLissener = globalEventLissener;
//# sourceMappingURL=client.js.map