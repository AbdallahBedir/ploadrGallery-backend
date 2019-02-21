var path = require('path'),
routes = require('./routes'),
express = require('express'),
bodyParser = require('body-parser'),
morgan = require('morgan'),
errorHandler = require('errorhandler');
passport = require('passport');

module.exports = function(app) {
    // Allow CORS
    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,Authorization");        
        res.header("Access-Control-Allow-Methods", "POST, PUT, GET, OPTIONS,DELETE");        
        
        next();
    });

    // app.use(passport)
    app.use(morgan('dev')); // HTTP request logger middleware
    app.use(bodyParser.urlencoded({'extended':false}));
    app.use(bodyParser.json());

    require("../config/passport")(passport);
    
    app.use(express.static(path.join(__dirname,'../')));
    if ('development' === app.get('env')) {
        app.use(errorHandler());
    }

    routes(app);//moving the routes to routes folder.
    
    return app;
};