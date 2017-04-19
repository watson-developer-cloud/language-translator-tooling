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
 * CSRF Sync Token implementation
 *
 * Order of middleware registration matters!  This should
 * be registered after any cookie/session configuration but
 * prior to the routes it is intended to protect.
 *
 */

'use strict';

var csrf = require('csurf');

module.exports = function configure (app) {

  var env = app.get('env');

  if (env === 'production') {
    app.use(csrf());

    app.use(function generateSyncToken (req, res, next) {
      res.cookie('XSRF-TOKEN', req.csrfToken(), {secure : true});
      return next();
    });
  }

};
