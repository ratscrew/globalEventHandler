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
     private _debug = false;
     private _pm2 = false;
     pm2:any
     constructor(options:globalEventHandlerOptions = {}){
         let me = this;
         for(var _o in options){
             this['_' + _o] = options[_o];
         }
         if(this._pm2) this.pm2 = require('pm2');
         if(this._server){
             const cluster = require('cluster');
             if(cluster.isMaster){
                 let args = [];
                 if(this._debug) args.push('--debug=5859')
                 if(!this._pm2) this.loanchServer(require('child_process').fork(__dirname +  '/server.js',[], {execArgv: args}));
                 else{
                      this.pm2.connect(function(err){
                        console.log({err:err})
                        
                        me.pm2.list(function(err,pList){
                            //console.log(pList)
                            var pi = pList.find(function(pp){
                                console.log(pp.pm2_env.status)
                                return pp.name == 'server' && pp.pm2_env.status != 'stopped'
                            })
                            if(pi) console.log(pi.pm2_env.pm_id)
                            if(pi) me.pm2.sendDataToProcessId(pi.pm2_env.pm_id,{topic:'process:msg',data:{ event: 'connect', port: me._port }},function(err){
                                    console.log({err:err})
                                })
                            else{
                                var c = me.pm2.start({script:__dirname + '/server.js',function (error,apps) {
                                    console.log({error:error})
                                    console.log({apps:apps})
                                }})
                                var pi = pList.find(function(pp){
                                    //console.log(pp.name)
                                    return pp.name == 'server' && pp.pm2_env.status != 'stopped'
                                })
                                if(pi) me.pm2.sendDataToProcessId({type:'process:msg',data:{ event: 'connect', port: me.port },id:pi.pm2_env.pm_id},function(err){
                                    console.log({err:err})
                                })
                            }
                        })
                    })

                 }
             }
         }
         if(this._client){
             this._globalEventHandlerClient = new globalEventHandlerClient(this._port,this._serverAddress) ;
         }
     }
     
     private loanchServer(server){
         let me = this;
        server.send({event:'connect',port:this._port});
        server.on('exit', (code, signal) => {
            if( signal ) {
                if(me._debug) console.log(`globalEventServer was killed by signal: ${signal}`);
            } else if( code !== 0 ) {
                if(me._debug) console.log(`globalEventServer exited with error code: ${code}`);
                let args = [];
                if(me._debug) args.push('--debug=5859');
                me.loanchServer(require('child_process').fork(__dirname + '/server.js',[], {execArgv: args}));
            } else {
                if(me._debug) console.log('globalEventServer died!');
            }
        });
        let ON_DEATH = require('death')({uncaughtException: true})
        ON_DEATH(function(signal, err) {
            server.kill('SIGINT');
        })
     }


 }
 
 export interface globalEventHandlerOptions{
     port?:number,
     client?:boolean,
     server?:boolean,
     serverAddress?:string,
     debug?:boolean,
     pm2?:boolean
 }
