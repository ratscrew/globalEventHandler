class gobalEventHandler{
	
	/** This is only a test **/
	constructor(public port:number, public host:String){
		var now = require("performance-now"), tA, tB, tId = [];
		var net = require('net'),
			JsonSocket = require('json-socket');
		//var port = 9838; //The same port that the server is listening on 
		//var host = '127.0.0.1';
		var socket = new JsonSocket(new net.Socket()); //Decorate a standard net.Socket with JsonSocket 
		socket.connect(port, host);
		socket.on('connect', function() { //Don't send until we're connected 
			console.log('connected');
			setInterval(()=>{
				console.log(tId.length)
			},1000)
			var add = ()=>{
				if(tId && tId.length < (Math.random()*50)){
					var t = Math.random().toString();
					tId.push(t);
					socket.sendMessage({type:'addEvent',eventId:'test1' + t, key:{}});
					socket.sendMessage({type:'addEvent',eventId:'test2' + t, key:{test:1}});
					socket.sendMessage({type:'addEvent',eventId:'test3' + t, key:{testing:{tester:1}}});
					socket.sendMessage({type:'addEvent',eventId:'test4' + t, key:{
						testing:{tester:1},
						test:1
						}
					});
				}
				
				setTimeout(add,Math.random()*500)
			}
			setTimeout(add,Math.random()*1000)
			
			var remove =()=>{
				if(tId[0] && tId.length > (Math.random()*50)){
					socket.sendMessage({type:'removeEvent',eventId:'test1' + tId[0]});
					socket.sendMessage({type:'removeEvent',eventId:'test2' + tId[0]});
					socket.sendMessage({type:'removeEvent',eventId:'test3' + tId[0]});
					socket.sendMessage({type:'removeEvent',eventId:'test4' + tId[0]});
					tId.splice(0,1);
				}
				setTimeout(remove,Math.random()*5000)
			}
			setTimeout(remove,Math.random()*2000)		
			
			var fire1 = ()=>{
				socket.sendMessage({type:'onEvent',key:{}, evPackage:{name:'testing0',tId:tId});
				setTimeout(fire1,Math.random()*100)
			}
			
			var fire2 = ()=>{
				socket.sendMessage({type:'onEvent',key:{}, evPackage:'testing1'});
				setTimeout(fire2,Math.random()*30)
			}

			var fire3 = ()=>{
				socket.sendMessage({type:'onEvent',key:{testing:{tester:1},test:1}, evPackage:'testing2'});
				setTimeout(fire3,Math.random()*300);
			}			

			var fire4 = ()=>{
				socket.sendMessage({type:'onEvent',key:{test:1}, evPackage:'testing3'});
				setTimeout(fire4,Math.random()*500);
			}
			
			setTimeout(()=>{
				fire1();
				fire2();
				fire3();
				fire4();
			},Math.random()*500)
			
			// setTimeout(()=>{
			// 	fire1();
			// 	fire2();
			// 	fire3();
			// 	fire4();
			// },Math.random()*5500)
			
			setTimeout(()=>{
				fire1();
				fire2();
				fire3();
				fire4();
			},Math.random()*10500)
			
			// setTimeout(()=>{
			// 	fire1();
			// 	fire2();
			// 	fire3();
			// 	fire4();
			// },Math.random()*20500)
			
			socket.on('message', function(message) {

			});
			
			socket.on('error', function (exc) {
				console.log("ignoring exception: " + exc);
			});
		});
	}
}

var gehTest = new gobalEventHandler(9838,'localhost') ;
