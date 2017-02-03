'use strict'

var express = require('express'),
    polls = express.Router(),
    pollsRoutes = require('./pollsRouter.js');


var apiRouter = function (app) {
    app.use('/api/v1', polls);

    polls.get('/polls', pollsRoutes.list);
    polls.post('/polls', pollsRoutes.addServer);
    polls.get('/polls/status', pollsRoutes.status);
    polls.delete('/polls', pollsRoutes.remove);

}

module.exports = apiRouter;