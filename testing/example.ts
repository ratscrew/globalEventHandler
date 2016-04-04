import {globalEventHandler,globalEventHandlerOptions, globalEvent,globalEventLissener,globalEventHandlerClient} from '../index';

let _globalEventHandler = new globalEventHandler()
var gehTestClient = _globalEventHandler.globalEventHandlerClient;

let _s0:globalEvent = gehTestClient.createEvent('testOne',{test:1});
let _s1:globalEvent = gehTestClient.createEvent('testTwo',{test:{'subKey':1}});

let _o:globalEventLissener = gehTestClient.createEventLissener('lissenToUpdate',{test:1});

_s0.next(':-)');

setInterval(()=> _s0.next('fire one'),1000);

setInterval(()=> _s1.next('fire two'),1000);

_o.observable.subscribe((x)=> console.log(x));

setTimeout(()=>{
    _s0.dispose();
},5000);

setTimeout(()=>{
    _s1.dispose();
    _o.dispose();
},10000)