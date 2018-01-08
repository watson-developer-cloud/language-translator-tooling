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
/*eslint func-names: 0 */

var _ = require('lodash');

var httpstatus = require('http-status');
var passport = require('passport');
var log = require('../../config/log');
var s2s = require('../../components/s2s');
var uuid = require('node-uuid');

function prepareUserForResponse (req) {

  var serviceGuid = _.get(req, 'session.serviceGuid');
  return {
    username : req.user.username,
    tenants : [req.session.serviceGuid]
  }
}

function storeOnSession (req, attributes) {
  attributes.forEach(function copyAttrToSession (attr) {
    if (req.query && req.query[attr]) {
      log.debug({value : req.query[attr]}, 'Storing ' + attr);
      req.session[attr] = req.query[attr];
    }
  });
}

function getFromSession (req, attribute, fallback) {
  return _.get(req, 'session.' + attribute, fallback);
}

module.exports.bluemixOAuth2 = function bluemixOAuth2 (req, res, next) {
  storeOnSession(req, ['successRedirect', 'failureRedirect', 'serviceGuid']);
  return passport.authenticate('bluemix', {scope : 'openid'})(req, res, next);
};

function oauth2Callback (req, res, next) {

  var failureRedirect = getFromSession(req, 'failureRedirect', '/login');
  req.session.bindingState = uuid.v1();

  return passport.authenticate('bluemix', {
    successRedirect : s2s.getServiceAccessAuthEndpoint(req),
    failureRedirect : failureRedirect
  })(req,res,next);
}

function verifyState (req, res, failureRedirect) {
  var state = req.query.state;
  var expected = getFromSession(req, 'bindingState');
  return (state && expected && (decodeURIComponent(state) === expected));
}

function bindingCallback (req, res, next) {

  var successRedirect = getFromSession(req, 'successRedirect', '/');

  var failureRedirect = getFromSession(req, 'failureRedirect', '/login');

  if (!verifyState(req)) {
    return res.redirect(httpstatus.FORBIDDEN, failureRedirect);
  }

  return s2s.getServiceKeys(req, res, successRedirect, failureRedirect);
}


module.exports.bluemixCallback = function bluemixCallback (req,res,next) {
  if (req.query.service_code) {
    return bindingCallback(req, res, next);
  } else {
    return oauth2Callback(req, res, next);
  }
};

exports.check = function check (req, res) {
  if (req.user) {
    res.status(httpstatus.OK).json(prepareUserForResponse(req));
  }
  else {
    res.status(httpstatus.UNAUTHORIZED).end();
  }
};

exports.logout = function logout (req, res) {
  if (req.user) {
    req.logout();
    res.status(httpstatus.OK).end();
  } else {
    res.status(httpstatus.BAD_REQUEST, 'Not logged in').end();
  }
};

if (process.env.LT_AUTH_TYPE !== 'bluemix') {
  exports.credentialLogin = function credentialLogin (req, res, next) {
    //console.log('4 - inside auth controller call for passport !!!! ');
    passport.authenticate('local', function verify (err, user) {
      //console.log('1 - inside auth controller call for passport !!!! ' + user.serviceGUID);
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(httpstatus.BAD_REQUEST).end();
      }

      req.logIn(user, function prepareResponse (err) {
        if (err) {
          return next(err);
        }
        res.status(httpstatus.OK).json(prepareUserForResponse(req));
      });
    })(req, res, next);
  };
}
