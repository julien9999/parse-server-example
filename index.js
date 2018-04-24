// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://heroku_9t94k0gw:hig4qu0e5oqbvdp8ufl3itn4pr@ds015774.mlab.com:15774/heroku_9t94k0gw',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || '35rQ21nN4QG8O38lz2H6OSexRC54rUQm',
  masterKey: process.env.MASTER_KEY || 'DHK96A82Li203306k67Ux98chBDfUH39', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'https://parse-server-ayoa.herokuapp.com',  // Don't forget to change to https if needed
  //verifyUserEmails: true,
  //facebookAppIds: ['1625175871089817'],
  oauth: { facebook: { appIds: ['1625175871089817'] }},
  publicServerURL: 'https://parse-server-ayoa.herokuapp.com/',
  appName: 'KITapp',
  emailAdapter: { 
      module: 'parse-server-simple-mailgun-adapter',
      options: { 
        fromAddress: 'contact@kit-app.com',
        domain: 'mailgun.kit-app.com', 
        apiKey: 'key-3f693df97b5bdaf3c747f77ac262913c', 
        passwordResetSubject: 'Renouvellement de mot de passe %appname%',
        passwordResetBody: 'Hi,\n\nYou requested a password reset for %appname%.\n\nClick here to reset it:\n%link%',
      }
   },  
  liveQuery: {
    classNames: ["chat","chat2"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
