/**
 * This code will automatically load the .env file in the root of your project
 * and initialize the values. 
 * It will skip any variables that already have been set. 
 * You should not use .env files in your production environment though
 * and rather set the values directly on the respective host
 */
if (process.env.NODE_ENV !== 'production') {
    // copies .env file content to process.env
    require('dotenv').load();    
}

var express = require('express'),
mongoose = require('mongoose'),
config = require('./server/configure'),
app = express();

mongoose.connect('mongodb://localhost/ploadr');
mongoose.connection.on("open",function(){
    console.log(`Connected to mongoose successfully`);
})

app.set('port', process.env.PORT || 3000);

app = config(app);

app.listen(app.get('port'), function() {
    console.log('Server up: http://localhost:' + app.get('port'));
});