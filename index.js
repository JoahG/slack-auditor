require('dotenv').config();

var express = require('express'),
    exphbs  = require('express-handlebars'),
    app = express(),
    bodyParser = require("body-parser"),
    csv = require('express-csv');

var pollBooth = require('./utils/pollBooth.js');

var Routes = require('./routes/index.js');

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/', Routes['/']);
app.get('/auth', Routes['/auth']);
app.get('/callback', Routes['/callback']);
app.get('/config/:id', Routes['/config/:id']);
app.post('/config', Routes['/config']);
app.get('/export/:id', Routes['/export/:id']);

app.listen(process.env.PORT || 3000)