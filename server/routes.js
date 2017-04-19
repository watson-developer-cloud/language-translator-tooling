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
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var path = require('path');
var log = require('./config/log');
var HTTPStatus = require('http-status');

var LTError = require('./components/common').LTError;

module.exports = function (app) {

  // Insert routes below
  app.use('/api/batches', require('./api/batches'));
  app.use('/api/authenticate', require('./api/authenticate'));
  app.use('/api/models', require('./api/models'));
  app.use('/api/reconcile', require('./api/reconcile'));

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[HTTPStatus.NOT_FOUND]);

  app.use('/modules/login.js', function getServerSideLogin (req, res) {
    res.render('login.js');
  });

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function (req, res) {
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });

  // error handling
  app.use(function returnError (err, req, res, next) { // eslint-disable-line no-unused-vars
    if (err && !LTError.prototype.isPrototypeOf(err)) {
      log.error({
        err : err
      }, 'Unhandled exception');
      if (err.message === 'DuplicateDetected') {
        log.error(err.message);
        res.status(HTTPStatus.CONFLICT).json({
          status : HTTPStatus.CONFLICT
        });
      } else if (typeof err.statusCode !== 'undefined') {
        res.status(err.statusCode).json({
          status : err.statusCode
        });
      } else {
        res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
          status : HTTPStatus.INTERNAL_SERVER_ERROR
        });
      }
    } else if (err && err.httpStatusCode) {
      if (err.inserts) {
        delete err.inserts.response;
        delete err.inserts.responseBody;
      }
      delete err.message;
      delete err.stack;

      res.status(err.httpStatusCode).json(err);
    }
    else {
      res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
        status : HTTPStatus.INTERNAL_SERVER_ERROR
      });
    }

    log.error({
      err : err
    }, 'Uncaught exception');
  });

 };
