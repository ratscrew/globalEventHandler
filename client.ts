import {Observable,Subject} from 'rxjs'

var now = require("performance-now")

export class globalEventHandlerClient{
	
    _socket;
	eventListeners:{ [id:string]: globalEventLissener} = {};
    events:globalEvent[] = [];
    
	constructor(public port:number, public host:String){
		var tA, tB, tId = [];
		var net = require('net'),
			JsonSocket = require('json-socket');
		//var port = 9838; //The same port that the server is listening on 
		//var host = '127.0.0.1';
		this._socket = new JsonSocket(new net.Socket()); //Decorate a standard net.Socket with JsonSocket 
		this._socket.connect(port, host);
        
        let localSubjects = [];
        let vm = this;
        
		this._socket.on('connect', function() { //Don't send until we're connected 
			console.log('connected');

			vm.events.forEach((n)=>{
                n.connectToSocket(vm._socket);
            })	
			
			for(var n in vm.eventListeners){
                vm.eventListeners[n].connectToSocket(vm._socket);
            }
			
			vm._socket.on('message', function(message) {
                    if(vm.eventListeners[message.eventId]) vm.eventListeners[message.eventId].subject.next(message.evPackage)
			});

			vm._socket.on('error', function (exc) {
				console.log("ignoring exception: " + exc);
			});
		});
	}
    
    createEvent = (_eventName, key)=>{
        let newEvent = new globalEvent(_eventName,key,this._socket,this.disposeEvent);
        this.events.push(newEvent);
        return newEvent;
    }
    
    disposeEvent = (_eventId) =>{
        let c = this.events.length;
        for (var index = 0; index < c; index++) {
            if(this.events[index].eventId == _eventId){
                this.events.slice(index,1);  
            }
        }
    }
    
    
    createEventLissener = (_eventName, key) =>{
        let newEventLissener = new globalEventLissener(_eventName,key,this._socket, this.disposeEventLissener);
        this.eventListeners[newEventLissener.eventId] = newEventLissener;
        return newEventLissener;
    }
    
    disposeEventLissener = (_eventId) =>{
        delete this.eventListeners[_eventId];
    }
    
}

export class globalEvent{
    eventId:string = Math.random().toString() + now().toString();
    constructor(public eventName, public key ,private socket, private _dispose){
        this.connectToSocket(socket);
    }
    
    connectToSocket = (_socket)=>{
        this.socket = _socket;
    }
    
    next = (_msg)=>{
        this.socket.sendMessage({type:'onEvent',key:this.key, evPackage:{name:this.eventName,tId:this.eventId,msg:_msg}});
    }
    
    dispose = ()=>{
        this._dispose(this.eventId)
    }
}

export class globalEventLissener{
    eventId:string = Math.random().toString() + now().toString();
    subject:Subject<any>;
    observable:Observable<any>;
    constructor(public eventName,public key, private _socket, private _dispose){
        let vm = this;
        this.observable = Observable.create((_subject)=>{
            vm.subject = _subject;
            vm.connectToSocket(vm._socket);
            return vm.dispose;
        })
    }
    
    connectToSocket = (_socket)=>{
        this._socket = _socket;
        this._socket.sendMessage({type:'addEvent',eventId:this.eventId, key:this.key});
    }
    
    dispose = ()=>{
        this._socket.sendMessage({type:'removeEvent',eventId:this.eventId});
        this.subject.complete();
        this._dispose(this.eventId);
    }
}


