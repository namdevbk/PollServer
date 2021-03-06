'use strict';

var W = require('winston'),
   Promise = require('bluebird'),
   _ = require('lodash'),
   request = require('request'),
   serversDB = require('../config/servers.js').servers;
   W.level = 'debug';


var pollsRoutes = (function(){
    var routes = {};
   
    routes.list = function(req, res){
   	    res.status(200).send(serversDB);
    }
     
    function get(server) {
        return new Promise(function(resolve, reject) {
            var options = {
                url: server.url,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };
            W.debug("options : ", options);
            request(options, function(error, response, body) {
            	if (!error && response.statusCode == 200) {
            		var serverStatus = {"name": server.name, "status": "available"}
                    resolve(serverStatus);
            	} else {
            		var serverStatus = {"name": server.name, "status": "unavailable"}
                    resolve(serverStatus);
            	}
            }); 
        });
    };

    routes.status = function(req, res){
        return Promise.map(serversDB, function (server) {
            W.debug("Calling URL", server.url);

            return get(server)
            .then(function(result) {
		        var statusObj = result;
                W.debug("Got second response", result, statusObj);
                return statusObj;
            });
        })
        .then(function (serverStatus) {
            W.debug("Got all URLS", serverStatus);
            //return serverStatus;
            res.status(200).send(serverStatus);
        }).catch(function(err) {
            W.error(err);
            res.status(400).send(err);
        });
    }

    routes.addServer = function(req, res){
        W.debug("body params", req.body);
    	let server = req.body;
        req.checkBody('name', 'Name is required').notEmpty();
        req.checkBody('url', 'Url is required').notEmpty();
        req.checkBody('url', 'Url is not valid. Please enter valid url (http://www.example.com)').matches('^(ftp|http|https):\/\/[^ "]+$');

        let errors = req.validationErrors();

        if (!errors) {
        	var serverExist = _.find(serversDB, _.matchesProperty('name', server.name));
            if(serverExist){
            	var errorMessage = [
				    {
				      "msg": "server with name "+server.name+" already exists." 
				    }
			    ]
		   	    res.status(422).json({errors:errorMessage});
	        } else {
	        	var newServer = {
	        		"name" : server.name,
	        		"url" :  server.url
	        	}
	        	serversDB.push(newServer)
	            res.status(200).json(newServer);
	        }

        } else {
            res.status(400).json({errors: errors});
        }
    }


    routes.remove = function(req, res){
        W.debug("query params", req.query);
        var name = req.query.name;
        req.checkQuery('name', 'Name query param is required').notEmpty();
        let errors = req.validationErrors();
        
        if (!errors) {
            var server = _.find(serversDB, _.matchesProperty('name', name));
            W.debug("server obj", server);
           
            if(server){
                _.pull(serversDB, server);
                res.status(200).json({success:true});
            }else {
            var errorMessage = [
                    {
                      "param": "name",
                      "msg": "server with name "+name+" is not exists"
                    }
                ]
              res.status(422).json({errors: errorMessage});
            }
        } else {
            res.status(400).json({errors: errors});
        }
    }

   return routes;
})();

module.exports = pollsRoutes;
