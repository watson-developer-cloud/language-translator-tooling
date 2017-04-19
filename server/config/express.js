/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

/**
 * Express configuration
 */

'use strict';
var ejs = require('ejs');
var express = require('express');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');

module.exports = function(app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.engine('html', ejs.renderFile);
  app.engine('js', ejs.renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({
    extended: false
  }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser(config.secrets.cookie));

  //Configure Sessions
  app.set('trust proxy', true);

  var redisClient = require('./redis')({ return_buffers : true });

  if (!!redisClient) {
    // If Redis is available, use as session store
    var RedisStore = require('connect-redis')(session);
    app.use(session({
      secret: config.secrets.session,
      key: 'JSESSIONID',
      store: new RedisStore({
        client: redisClient,
        ttl: config.sessionTimeout
      })
    }));
  } else {
    // Otherwise, use local sessions
    app.use(session({
      secret: config.secrets.session,
      key: 'JSESSIONID',
      resave: true
    }));
  }

  if ('production' === env) {
    // Force HTTPS
    app.use(function requireHTTPS(req, res, next) {
      if (req.headers && req.headers['x-forwarded-proto'] === 'http') {
        return res.redirect('https://' + req.get('host') + req.url);
      }
      next();
    });
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', path.join(config.root, 'public'));
    app.use(morgan('dev'));
  }

  if ('development' === env || 'test' === env) {
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', path.join(config.root, 'client'));
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};
