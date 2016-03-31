///<referance path="typings/node/node.d.ts"/>

class EventKey{
	public keys:{ [id: string] : EventKey; } = {};
	public observers:Array<string> =[];
	
	private suicide;
	public keyId: string;
	
	constructor(keyId?: string, suicide?:Function){
		if(suicide) this.suicide = suicide;
		if(keyId) this.keyId = keyId;
		
	}
	
	removeEventFromObservers = (eventId) =>{
		var i = this.observers.indexOf(eventId);
		this.observers.splice(i,1)
		
		if(this.suicide && this.keyId && Object.keys(this.keys).length == 0 && this.observers.length == 0){
			this.suicide(this.keyId);
		}
	}
	
	killKey = (keyId) =>{
		if(this.keys[keyId]) delete this.keys[keyId];
		
		if(this.suicide && this.keyId && Object.keys(this.keys).length == 0 && this.observers.length == 0){
			this.suicide(this.keyId);
		}
	}
	
	cleanUp = () => {
		if(this.suicide && this.keyId && Object.keys(this.keys).length == 0 && this.observers.length == 0){
			this.suicide(this.keyId);
		}		
	}
}

class EventStream extends EventKey{
	eventIds:{ [id: string] : {key:Object,eventKeys:Array<EventKey>,clientId:Number}; } = {};
	private onEventDscrit:any = {};
	onEvent = (key:Object,evPackage:Object, eventKey?:EventKey) =>{
		if(!eventKey) eventKey =  this;
		if(eventKey === this){
			this.onEventDscrit = {};
		}
		
		eventKey.observers.forEach((o)=>{
			this.onEventDscrit[o] = 1;
		})
		
		for(var i in key){
			if(eventKey.keys[i]) this.onEvent(key[i],evPackage,eventKey.keys[i]);
		}
		
		if(eventKey === this){
			for(var i in this.onEventDscrit){
				this._onNext(i,evPackage);
			}
			this.onEventDscrit = {};
		}
	}
	
	private _onNext:Function;
	public onNext = (_onNext?: (eventId:string, evPackage:any)=>any) => {
		if(_onNext) this._onNext = _onNext;
	}
	
	addEvent = (clientId:Number, eventId:string,key?:Object) => {
		this.eventIds[eventId] = {clientId:clientId,key:key || {},eventKeys:[]};
		
		this.addKey(this,eventId,key);
	}
	
	addKey = (parent:EventKey, eventId:string,key?:Object) => {
		if(!key || Object.keys(key).length == 0){
			this.observers.push(eventId);
			this.eventIds[eventId].eventKeys.push(parent)
		}
		else
			for(var i in key){
				if(!parent.keys[i]) parent.keys[i] = new EventKey(i,parent.killKey);
				if(Object.keys(key[i]).length == 0){
					parent.keys[i].observers.push(eventId);
					this.eventIds[eventId].eventKeys.push(parent.keys[i]);
				}
				else{
					this.addKey(parent.keys[i],eventId,key[i]);
				}
			}
	}
	removeEvent = (eventId:string) => {
		if(this.eventIds[eventId]){
			this.eventIds[eventId].eventKeys.forEach(function(eventKey){
				eventKey.removeEventFromObservers(eventId)
			})
			delete this.eventIds[eventId];
		} 
	}
	
	removeClient = (clientId:Number) => {
		for(var i in this.eventIds){
			if(this.eventIds[i].clientId === clientId){
				this.removeEvent(i);
			}
		}
	}
	

}

var net = require('net'),
    JsonSocket = require('json-socket');
var now = require("performance-now")
var eventMan:EventStream = new EventStream('global');
var port = 9838;
var server = net.createServer();
server.listen(port);
var lastSocketId = 0;
var sockets = {};
var stats = {in:0,out:0, timeSpan:0}, statStartTime = now();
setInterval(function(){
	var timeSpan = (now()-statStartTime)/1000;
	stats.out = stats.out/timeSpan;
	stats.in = stats.in/timeSpan;
	stats.timeSpan = timeSpan;
	console.log(stats);
	stats = {in:0,out:0, timeSpan:0};
	
	statStartTime = now()
},10000)
eventMan.onNext(function(eventId,evPackage){
	stats.out++;
	var sId = eventId, dotIndex = sId.indexOf(".");
	sId = sId.slice(0, dotIndex);
	eventId = eventId.substr(dotIndex + 1);
	var socket = sockets[sId];
	socket.sendMessage({eventId: eventId, evPackage:evPackage});
})
server.on('connection', function(socket) { //This is a standard net.Socket
    console.log('connected');
	socket = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket test
	lastSocketId++;
    sockets[lastSocketId] = socket;
	socket.socketsId = lastSocketId;
	socket.on('message', function(message) {
		//console.log(message);
        switch (message.type)
		{
			case 'addEvent':
				eventMan.addEvent(socket.socketsId, socket.socketsId.toString() + '.' + message.eventId, message.key);	
				break;
			case 'onEvent':
				stats.in++;
				eventMan.onEvent(message.key,message.evPackage,eventMan);
				break;
			case 'removeEvent':
				eventMan.removeEvent(socket.socketsId.toString() + '.' + message.eventId);
				break;
		} 
    });
	socket.on('error', function (exc) {
    	console.log("ignoring exception: " + exc);
		if(exc = 'Error: read ECONNRESET'){
			eventMan.removeClient(socket.socketsId);
			delete sockets[socket.socketsId];
		}
	});
	socket.on('disconnect',function(){
		eventMan.removeClient(socket.socketsId);
		delete sockets[socket.socketsId];
	})
	
});
//test