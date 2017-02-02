require('epipebomb')();
var SockJS = require('sockjs-client');
var Worker = require('webworker-threads').Worker;
var cluster = require('cluster');
var numCPUs = 2; //number of conversations, don't change
var hub = require('clusterhub');
var fs = require("fs");
var exit = require('exit');


/////// CONFIG /////////
var portId = 7002;
var location = 0;

/////// END ////////////

//conversation class for in-code usage, holds metadata
var conversation = function(ckey){
  this.ckey = ckey;
  this.idn = 0; //conversation reply count
  this.cid = 0;
};

//conversation class for storage
var storedConversation = function(name){
  this.timestamp = Date.now();
  this.conversationName = name;
  this.strangerIds = ['Obcy 1: ', 'Obcy 2: ', 'Data: ', 'Unknown: '];
  this.pushMessage = function(id, data){
    console.log("----------WRITING TO FILE : " + data);
    fs.appendFile(this.timestamp+'.txt', ''+this.strangerIds[id]+data+'\r\n',  function(err) {
      if(err){
        console.log("----------ERROR OPENING FILE ----------------");
        fs.mkdir(path, function(){
          fs.appendFile(path+'conversationName.txt', ''+this.strangerIds[id]+data+'\r\n');
        })}}
    );
  };

  this.pushMessage(2, this.timestamp);
};

//main class
var szObcyClient = function(port, hub){
  /////current thread
  this.hub = hub;
  this.timeout = null;
  this.sockjs_url = "http://server.6obcy.pl:"+ port +"/echoup";
  this.protocols = ['websocket', 'xhr - streaming', 'iframe - eventsource', 'iframe - htmlfile', 'xhr - polling', 'iframe - xhr - polling', 'xdr - streaming', 'xdr - polling'];
  this.conversation = null;
  var conn_id=0;
  //changing at new conversation
  var ckey=0;
  //connection reply count I believe
  var ceid=1;
  //conversation ID? received from stranger
  var cid=0;
  //connection hash
  var hash='';

  var sockjs = new SockJS(this.sockjs_url, null, {
    protocols_whitelist: this.protocols,
    transports: this.protocols
  });

  ///////helper functions///////
  var createCkey = function(id) { //actually not important - ckey is received from server
    var chars = "0123456789abcdef";//ghijklmnopqrstuvwxyz";
    var template = "xxxxx_xxxxx_xxxx+xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; //lol
    var result = "";
    for(var i=0; i<template.length; i++)
    {
      if(template.charAt(i)=='x') result += chars.charAt(Math.floor(Math.random() * chars.length));
      else result += template.charAt(i);
    }
    return result;
  };

  var startConnection = function() {
    ///?
  };

  var startConversation = function() {
    this.conversation = new conversation(createCkey(this.ckey));
    this.conversation.idn=0;
    emitMessage('_sas');
  };

  var endConversation = function() {
    emitMessage('_distalk');
    this.conversation = new conversation(0);
  };

  ///////server event handling/////////
  var handleEvent = function(e) {

    switch(e.ev_name) {
      case 'cn_acc': //connected
        conn_id=e.ev_data.conn_id; //TODO :: Globals - ugly but works
        hash=e.ev_data.hash;
        emitMessage('_cinfo');
        emitMessage('_owack');
        startConversation();
        break;

      case 'count': //people online
        break;

      case 'piwo':  //ping
        emitMessage('_gdzie'); //pong
        break;

      case 'talk_s': //convo start
        hub.emit('event', {'conn_id': conn_id, 'ev_data': e});
        this.conversation.ckey = e.ev_data.ckey;
        this.conversation.cid = e.ev_data.cid;
        //check if banned
        if(this.conversation.ckey.indexOf('+')>-1){
          console.log("BANNED");
          hub.emit('event', {'conn_id': 1, 'ev_data': {'ev_name': 'kickme'}});
        }

        emitMessage('_begacked');
        hub.emit('event', {'conn_id': conn_id, ev_data: { ev_name: 'ev_start', ev_data: this.conversation}});
        break;
      case 'styp': //stranger typing
        hub.emit('event', {'conn_id': conn_id, 'ev_data': e});
        break;
      case 'rmsg': //incoming message
        if(e.ev_data.cid == this.conversation.cid){
          hub.emit('event', {'conn_id': conn_id, 'ev_data': e});
        }
        break;
      case 'sdis': //stranger disconnected
        if(e.ev_data == this.conversation.cid){
          hub.emit('event', {'conn_id': conn_id, 'ev_data': e});
        }
        break;
      case 'convended': //end of conversation
        break;
    };
  };

  this.handleThreadEvent = function(e) {
    if(e.conn_id != conn_id && e.conn_id != 0){ //don't handle own events
    switch(e.ev_data.ev_name) {
      case 'styp': //stranger typing
        emitMessage('_mtyp', e.ev_data.ev_data);
        break;
      case 'rmsg': //incoming message
        emitMessage('_pmsg', e.ev_data.ev_data.msg);
        break;
      case 'sdis': //stranger disconnected
        if(e.conn_id == 1)
        {
          endConversation();
          startConversation();
        }
        break;
      case 'kickme': //kickme :v
        console.log("kickme received, exiting");
        process.abort();
        break;
    };
    }
  };
  //////send server events//////
  var emitMessage = function(name, data) {
    var e;
    switch(name) {
      case '_gdzie': //pong
        e = '{ "ev_name": "_gdzie" }';
        break;

      case '_mtyp': //me typing
        if(this.conversation.ckey == null){
          e = '{"ev_name":"_mtyp","ev_data":{"ckey":'+ 0  +', "val": '+ data +'}}';
        } else {
          e = '{"ev_name":"_mtyp","ev_data":{"ckey":"'+ this.conversation.ckey +'", "val":'+ data +'}}';
        }
        break;

      case '_sas': // introduce myself
        e = '{"ev_name":"_sas","ev_data":{"channel":"main","myself":{"sex":0,"loc":'+location+'},"preferences":{"sex":0,"loc":'+location+'}},"ceid":'+ ceid +'}';
        ceid = ceid +1;
        break;

      case '_begacked': // begin conversation
        e = '{"ev_name":"_begacked","ev_data":{"ckey":"'+ this.conversation.ckey +'"},"ceid":'+ ceid +'}';
        ceid = ceid +1;
        break;

      case '_distalk': //disconnect
        e = '{"ev_name":"_distalk","ev_data":{"ckey":"'+ this.conversation.ckey +'"},"ceid":'+ ceid +'}';
        ceid = ceid +1;
        break;

      case '_pmsg': //post message
        child_process.execSync("usleep 250");
        if(this.conversation.idn == null){
          e = '{"ev_name":"_pmsg","ev_data":{"ckey":"'+ this.conversation.ckey +'", "msg":"'+data.toLowerCase()+'", "idn":0},"ceid":'+ ceid +'}';
          this.conversation.idn = 0;
        }
        else{
          e = '{"ev_name":"_pmsg","ev_data":{"ckey":"'+ this.conversation.ckey +'", "msg":"'+data.toLowerCase()+'", "idn":'+ this.conversation.idn +'},"ceid":'+ ceid +'}';
        }
        ceid = ceid +1;
        break;

      case '_cinfo': //connection info
        e = '{"ev_name":"_cinfo","ev_data":{"mobile":true,"cver":"v2.5","adf":"ajaxPHP","hash":"'+hash+'","testdata":{"ckey":0,"recevsent":false}}}';
        break;

      case '_owack': //connection accepted
        e = '{"ev_name":"_owack"}';
        break;
    };
    sockjs.send(JSON.stringify(JSON.parse(e)));
  };

  //////sockjs config////////
  sockjs.onopen = function()  {
    //Connect
    startConnection();
  };
  sockjs.onmessage = function(e) {
    var data = JSON.parse(e.data);
    handleEvent(data);
  };
  sockjs.onerror = function(e) {
    console.log(e.data);
    hub.emit('event', {'conn_id': 1, 'ev_data': {'ev_name': 'kickme'}}); //just to be sure
  };
  sockjs.onclose = function()  {
    console.log('Closing Connection.  at ' + conn_id);
    hub.emit('event', {'conn_id': 1, 'ev_data': {'ev_name': 'kickme'}});
  };
};

////////////////////////////////////////////////////////////////////////////////

var master = function(hub){
  /////master thread
  this.hub = hub;
  this.conversations = [];
  this.storedConversation;

  this.resetConversations = function(){
    delete this.storedConversation;
    this.conversations = new Array();
    console.log("RESET!!!!!!!!!!!!!!!!!!!!!!!!!");
    hub.emit('event', {'conn_id': 1, 'ev_data': {'ev_name': 'sdis'}});
  };

  //thread event handling
  this.handleThreadEvent = function(e) {
    switch (e.ev_data.ev_name) {
      case 'talk_s': //conversation started
        if(this.conversations.length < numCPUs) {
          this.conversations.push(e.ev_data);
          if(!this.storedConversation) {
            console.log("----------CREATING A FILE----------------");
            this.storedConversation = new storedConversation(this.conversations[0].ev_data.ckey);
          }
          console.log("MASTER: TALK_S");
        }
        else {
          this.resetConversations();
          console.log("MASTER: TALK_S RESETTING");
        }
        //make sure we aren't talking to ourselves
        if(this.conversations.length >= numCPUs && this.conversations[0].ev_data.cid === this.conversations[1].ev_data.cid){
          this.resetConversations();
          console.log("MASTER: SAME CONVERSATION, RESETTING");
        }
        break;

      case 'rmsg': //received message
      //safeguards
      if(this.conversations && this.storedConversation){
        if(this.conversations[0] && this.conversations[0].ev_data.cid == e.ev_data.ev_data.cid)
          this.storedConversation.pushMessage(0, e.ev_data.ev_data.msg);
        else if(this.conversations[1] && this.conversations[1].ev_data.cid == e.ev_data.ev_data.cid)
          this.storedConversation.pushMessage(1, e.ev_data.ev_data.msg);
        else
          this.storedConversation.pushMessage(3, e.ev_data.ev_data.msg);
        }
        break;

      case 'sdis':
        if(e.conn_id != 1){

          this.resetConversations();
          console.log("MASTER: SDIS RESETTING");

        }
        break;
      case 'kickme':
        console.log("MASTER: EMITING KICKME");
        hub.emit('event', {'conn_id': 1, 'ev_data': {'ev_name': 'kickme'}});
        //exit(0);
        process.abort();
        break;
    }
  }

};

///////////////////////////////threading////////////////////////////////////////
process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  var me = new master(hub);
  //synchronize threads at master
  hub.on('event', function(e) {
    me.handleThreadEvent(e);
  });

} else {
  var client = new szObcyClient(portId, hub);
  hub.on('event', function(e) {
    if(client.timeout) clearTimeout(client.timeout);
    client.timeout = setTimeout(function(){
      console.log("TIMEOUT");
      hub.emit('event', {'conn_id': 1, 'ev_data': {'ev_name': 'kickme'}});

    }, 20000);
    client.handleThreadEvent(e);

  });
}
