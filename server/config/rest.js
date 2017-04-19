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

'use strict';

var passport = require('passport');
var _ = require('lodash');
var HTTPStatus = require('http-status');
var log = require('./log');
var LTToolingError = require('../components/common').LTToolingError;
var ltErrors = require('../components/ltErrors');

function ensureAuthenticated (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    if (process.env.LT_AUTH_TYPE !== 'bluemix') {
      console.log("LOGIN ISSUES " + process.env.LT_AUTH_TYPE + process.env.NODE_ENV);
      next(new LTToolingError('User is not authorized', ltErrors.UserNotAuthorized, {user : req.user}, HTTPStatus.FORBIDDEN));
    }
    else {
      return passport.authenticate('bluemix', {
        scope : 'openid',
        session : false
      })(req, res, next);
    }
  }
}

function generateEnsureAuthorizedForTenant (tenantParameterName) {

  if (!tenantParameterName) {
    tenantParameterName = 'tenantId';
  }

  return function ensureAuthorizedForTenant (req, res, next) {

    // If there is no user, return unauthorised
    if (!req.user) {
      console.log("TENANT 403");
      return next(new LTToolingError('User is not authenticated', ltErrors.UserNotAuthenticated, {user : req.user}, HTTPStatus.UNAUTHORIZED));
    }

    var tenant = req.params[tenantParameterName];

    // If no tenant id is set, return 500 (misconfiguration)
    if (!req.params[tenantParameterName]) {
      log.error('No tenant parameter has been specified');
      return next(new LTToolingError('No tenant parameter has been specfied', ltErrors.NoTenantSpecified, {}, HTTPStatus.INTERNAL_SERVER_ERROR));
      //return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send({error : 'No tenant parameter has been specfied'});
    }

    if (_.get(req, 'session.serviceGuid') === tenant) {
      return next();
    }

    // Otherwise, return unauthorised
    log.warn({tenantId : tenant}, 'User is not authorised to access tenant');
    return next(new LTToolingError('User is not authorised to access tenant', ltErrors.UserNotAuthorized, {
      user : req.user,
      tenantId : tenant
    }, HTTPStatus.FORBIDDEN));
  };

}

module.exports = {
  ensureAuthenticated : ensureAuthenticated,
  ensureAuthorizedForTenant : generateEnsureAuthorizedForTenant
};
