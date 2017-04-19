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

/**
 * Exposes namespaces to provide common functionality for reading requests and
 * writing responses.
 *
 * @author Andy Stoneberg
 * @module server/components/s2s
 */

var _ = require('lodash');
var async = require('async');
var httpstatus = require('http-status');
var request = require('request');

var crypto = require('../crypto');
var config = require('../../config/environment');
var log = require('../../config/log');

module.exports.getServiceAccessAuthEndpoint = function getServiceAccessEndpoint (req) {

  var serviceAccessAuthUrl = config.endpoints.serviceprovider +
      '/authorize' +
      '?client_id=' + encodeURIComponent(config.clientid) +
      '&redirect_uri=' + encodeURIComponent(config.endpoints.callback) +
      '&state=' + encodeURIComponent(req.session.bindingState) +
      '&response_type=code' +
      '&resource_service_instance_ids=' + encodeURIComponent(req.session.serviceGuid);

  return serviceAccessAuthUrl;
};

function getTokenFromAccessCode (req, callback) {
  var serviceCode = req.query.service_code;
  var opts = {
    url : config.endpoints.serviceprovider + '/token',
    qs : {code : serviceCode},
    method : 'GET',
    auth : {
      user : config.clientid,
      pass : config.secrets.client,
      sendImmediately : true
    },
    json : true
  };

  request(opts, function handleResponse (err, response, body) {
    if (err) {
      log.error({err : err}, 'Unable to convert service code to token.');
      return callback({code : httpstatus.INTERNAL_SERVER_ERROR});
    }

    if (response.statusCode !== httpstatus.OK) {
      log.error({statusCode : response.statusCode, error : body.message}, 'Error occurred while converting service code to token.');
      return callback({code : response.statusCode});
    }

    if (!body.service_instances || !body.service_instances[0]) {
      log.error({error : body.message}, 'No service instance information found.');
      return callback({code : httpstatus.NOT_FOUND});
    }

    req.session.s2sAccessToken = body.access_token;
    req.session.s2sRefreshToken = body.refresh_token;


    callback(null, req, body.service_instances[0], body.access_token, body.refresh_token);

  });

}

function retrieveServiceKeys (req, serviceInstance, accessToken, refreshToken, callback) {
  var opts = {
    url : config.endpoints.serviceprovider + '/service_keys/' + serviceInstance.service_key_guid,
    method : 'GET',
    auth : {
      user : config.clientid,
      pass : config.secrets.client,
      sendImmediately : true
    },
    headers : {
      'X-Bluemix-Service-Token' : accessToken
    },
    json : true
  };

  request(opts, function handleResponse (err, response, body) {
    if (err) {
      log.error({err : err}, 'Unable to retrieve service keys.');
      return callback({code : httpstatus.INTERNAL_SERVER_ERROR});
    }

    if (response.statusCode !== httpstatus.OK) {
      log.error({statusCode : response.statusCode, error : body.message}, 'Error occurred while retrieving service keys.');
      return callback({code : response.statusCode});
    }

    callback(null, body);
  });
}

function verifyServiceGuid (req, res, keys, successRedirect, failureRedirect) {
  var credentials = keys.entity.credentials;

  if (!req.session.serviceGuid || keys.entity.service_instance_guid !== req.session.serviceGuid ) {
    return res.redirect(httpstatus.FORBIDDEN, failureRedirect);
  }

  req.session.serviceUrl = credentials.url;
  req.session.serviceUsername = crypto.encrypt(credentials.username);
  req.session.servicePassword = crypto.encrypt(credentials.password);

  return res.redirect(successRedirect);
}

module.exports.getServiceKeys = function getServiceKeys (req, res, successRedirect, failureRedirect) {
  async.waterfall([
    function convertAccessCode (next) {
      getTokenFromAccessCode(req, next);
    },
    retrieveServiceKeys
  ], function handleResult (err, keys) {
    if (err) {
      return res.redirect(err.code || httpstatus.INTERNAL_SERVER_ERROR, failureRedirect);
    }

    verifyServiceGuid(req, res, keys, successRedirect, failureRedirect);
  });
};

module.exports.getCredentialsFromSession = function getCredentialsFromSession (req, callback) {
  var credentials = {};

  var session = _.get(req, 'session', {});

  if (!session.serviceUrl || !session.serviceUsername || !session.servicePassword) {
    return callback({error : 'Required session info not found.'});
  }

  credentials.url = session.serviceUrl;
  credentials.username = crypto.decrypt(session.serviceUsername);
  credentials.password = crypto.decrypt(session.servicePassword);
  credentials.version = process.env.LT_VERSION || 'v2';

  return callback(null, credentials);
};

