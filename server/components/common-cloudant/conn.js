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
 * Creates a connection to a Cloudant database.
 *
 *  Uses connection details from a bound Bluemix service instance if available, or a
 *   user-provided service otherwise.
 *
 * @author Dale Lane
 * @module ibmwatson-qa-questionstore/lib/db/conn
 */

'use strict';

// external dependencies
var _ = require('lodash');
var cloudant = require('cloudant');
var async = require('async');
// local dependency
var log = require('../../config/log');
var dbinstance = require('./instance');

var dbcache = {};

module.exports = function connect (options, dbname, designs, callback) {

  if (_.isFunction(designs)) {
    callback = designs;
    designs = [];
  }

  if (dbcache[dbname]) {
    log.debug('start called on DB module that is already started');
    return callback(null, dbcache[dbname]);
  }

  if (options) {
    return async.waterfall([
      function connectToCloudant (next) {
        if (options.url) {
          cloudant.url = options.url;
        }
        cloudant(options, function checkCloudantConn (err, cloudantdb) {
          next(err, cloudantdb);
        });
      },
      function getDbHandle (driver, next) {
        dbinstance(driver, dbname, designs, next);
      }
    ], function onEnd (err, handle) {
      if (err) {
        return callback(err);
      }
      dbcache[dbname] = handle;
      callback(null, dbcache[dbname]);
    });

  }

  return callback(new Error('Missing required CF environment for Cloudant'));
};
