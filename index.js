///<referance path="typings/node/node.d.ts"/>
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var EventKey = (function () {
    function EventKey(keyId, suicide) {
        var _this = this;
        this.keys = {};
        this.observers = [];
        this.removeEventFromObservers = function (eventId) {
            var i = _this.observers.indexOf(eventId);
            _this.observers.splice(i, 1);
            if (_this.suicide && _this.keyId && Object.keys(_this.keys).length == 0 && _this.observers.length == 0) {
                _this.suicide(_this.keyId);
            }
        };
        this.killKey = function (keyId) {
            if (_this.keys[keyId])
                delete _this.keys[keyId];
            if (_this.suicide && _this.keyId && Object.keys(_this.keys).length == 0 && _this.observers.length == 0) {
                _this.suicide(_this.keyId);
            }
        };
        this.cleanUp = function () {
            if (_this.suicide && _this.keyId && Object.keys(_this.keys).length == 0 && _this.observers.length == 0) {
                _this.suicide(_this.keyId);
            }
        };
        if (suicide)
            this.suicide = suicide;
        if (keyId)
            this.keyId = keyId;
    }
    return EventKey;
})();
var EventStream = (function (_super) {
    __extends(EventStream, _super);
    function EventStream() {
        var _this = this;
        _super.apply(this, arguments);
        this.eventIds = {};
        this.onEventDscrit = {};
        this.onEvent = function (key, evPackage, eventKey) {
            if (!eventKey)
                eventKey = _this;
            if (eventKey === _this) {
                _this.onEventDscrit = {};
            }
            eventKey.observers.forEach(function (o) {
                _this.onEventDscrit[o] = 1;
            });
            for (var i in key) {
                if (eventKey.keys[i])
                    _this.onEvent(key[i], evPackage, eventKey.keys[i]);
            }
            if (eventKey === _this) {
                for (var i in _this.onEventDscrit) {
                    _this._onNext(i, evPackage);
                }
                _this.onEventDscrit = {};
            }
        };
        this.onNext = function (_onNext) {
            if (_onNext)
                _this._onNext = _onNext;
        };
        this.addEvent = function (clientId, eventId, key) {
            _this.eventIds[eventId] = { clientId: clientId, key: key || {}, eventKeys: [] };
            _this.addKey(_this, eventId, key);
        };
        this.addKey = function (parent, eventId, key) {
            if (!key || Object.keys(key).length == 0) {
                _this.observers.push(eventId);
                _this.eventIds[eventId].eventKeys.push(parent);
            }
            else
                for (var i in key) {
                    if (!parent.keys[i])
                        parent.keys[i] = new EventKey(i, parent.killKey);
                    if (Object.keys(key[i]).length == 0) {
                        parent.keys[i].observers.push(eventId);
                        _this.eventIds[eventId].eventKeys.push(parent.keys[i]);
                    }
                    else {
                        _this.addKey(parent.keys[i], eventId, key[i]);
                    }
                }
        };
        this.removeEvent = function (eventId) {
            if (_this.eventIds[eventId]) {
                _this.eventIds[eventId].eventKeys.forEach(function (eventKey) {
                    eventKey.removeEventFromObservers(eventId);
                });
                delete _this.eventIds[eventId];
            }
        };
        this.removeClient = function (clientId) {
            for (var i in _this.eventIds) {
                if (_this.eventIds[i].clientId === clientId) {
                    _this.removeEvent(i);
                }
            }
        };
    }
    return EventStream;
})(EventKey);
var net = require('net'), JsonSocket = require('json-socket');
var now = require("performance-now");
var eventMan = new EventStream('global');
var port = 9838;
var server = net.createServer();
server.listen(port);
var lastSocketId = 0;
var sockets = {};
var stats = { in: 0, out: 0, timeSpan: 0 }, statStartTime = now();
setInterval(function () {
    var timeSpan = (now() - statStartTime) / 1000;
    stats.out = stats.out / timeSpan;
    stats.in = stats.in / timeSpan;
    stats.timeSpan = timeSpan;
    console.log(stats);
    stats = { in: 0, out: 0, timeSpan: 0 };
    statStartTime = now();
}, 10000);
eventMan.onNext(function (eventId, evPackage) {
    stats.out++;
    var sId = eventId, dotIndex = sId.indexOf(".");
    sId = sId.slice(0, dotIndex);
    eventId = eventId.substr(dotIndex + 1);
    var socket = sockets[sId];
    socket.sendMessage({ eventId: eventId, evPackage: evPackage });
});
server.on('connection', function (socket) {
    console.log('connected');
    socket = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket
    lastSocketId++;
    sockets[lastSocketId] = socket;
    socket.socketsId = lastSocketId;
    socket.on('message', function (message) {
        //console.log(message);
        switch (message.type) {
            case 'addEvent':
                eventMan.addEvent(socket.socketsId, socket.socketsId.toString() + '.' + message.eventId, message.key);
                break;
            case 'onEvent':
                stats.in++;
                eventMan.onEvent(message.key, message.evPackage, eventMan);
                break;
            case 'removeEvent':
                eventMan.removeEvent(socket.socketsId.toString() + '.' + message.eventId);
                break;
        }
    });
    socket.on('error', function (exc) {
        console.log("ignoring exception: " + exc);
        if (exc = 'Error: read ECONNRESET') {
            eventMan.removeClient(socket.socketsId);
            delete sockets[socket.socketsId];
        }
    });
    socket.on('disconnect', function () {
        eventMan.removeClient(socket.socketsId);
        delete sockets[socket.socketsId];
    });
});
//# sourceMappingURL=index.js.map