//import {globalEventHandlerServer} from './server';
import {globalEventHandlerClient, globalEvent, globalEventLissener} from './client'
import {Observable,Subject} from 'rxjs'

 export {globalEventHandlerClient, globalEvent, globalEventLissener} from './client';
 export class globalEventHandler implements globalEventHandlerOptions {
     private _port:number = 9838;
     public get port() : number {
         return this._port;
     }
     
     private _client:boolean = true;
     public get client() : boolean {
         return this._client;
     }
     
     private _server:boolean = true;
     public get server() : boolean {
         return this._server;
     }
     
     private _serverAddress:string = 'localhost';
     public get serverAddress() : string {
         return this._serverAddress;
     }
     
     private _globalEventHandlerClient:globalEventHandlerClient;
     public get globalEventHandlerClient() : globalEventHandlerClient {
         return this._globalEventHandlerClient
     }
     
     constructor(options:globalEventHandlerOptions = {}){
         for(var _o in options){
             this['_' + _o] = options[_o];
         }
         
         if(this._server){
             const cluster = require('cluster');
             if(cluster.isMaster){
                 this.loanchServer(require('child_process').fork(__dirname +  '\\server.js',[], {execArgv: ['--debug=5859']}));
             }
         }
         if(this._client){
             this._globalEventHandlerClient = new globalEventHandlerClient(this._port,this._serverAddress) ;
         }
     }
     
     private loanchServer(server){
        server.send({event:'connect',port:this._port});
        server.on('exit', (code, signal) => {
            if( signal ) {
                console.log(`globalEventServer was killed by signal: ${signal}`);
            } else if( code !== 0 ) {
                console.log(`globalEventServer exited with error code: ${code}`);
                this.loanchServer(require('child_process').fork('server.js',[], {execArgv: ['--debug=5859']}));
            } else {
                console.log('globalEventServer died!');
            }
        });
     }
 }
 
 export interface globalEventHandlerOptions{
     port?:number,
     client?:boolean,
     server?:boolean,
     serverAddress?:string,
 }
