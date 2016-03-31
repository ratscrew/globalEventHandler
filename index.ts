import {globalEventHandlerServer} from './server';
import {gobalEventHandlerClient, globalEvent, globalEventLissener} from './client'
import {Observable,Subject} from 'rxjs'

var gehTestServer = new globalEventHandlerServer(9838) ;

var gehTestClient = new gobalEventHandlerClient(9838,'localhost') ;


let _s:globalEvent = gehTestClient.createEvent('testOne',{test:1});

let _o:globalEventLissener = gehTestClient.createEventLissener('lissenToUpdate',{test:1});

_s.next(':-)');

setInterval(()=> _s.next('fire'),1000)

_o.observable.subscribe((x)=> console.log(x));

var child = require('child_process').fork('child.js');
