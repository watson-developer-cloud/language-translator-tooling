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
var BluemixStrategy = require('ibmwatson-passport-bluemix'),
  BasicStrategy = require('passport-http').BasicStrategy,
  LocalStrategy = require('passport-local').Strategy,
  request = require('request');

// local dependencies
var env = require('./environment');
var crypto = require('../components/crypto');
var log = require('./log');
var _ = require('lodash');

module.exports = function init (app) {

  function encryptUser (user) {
    var encrypted = {
      username : user.username
    };
    if (user.password) {
      encrypted.password = crypto.encrypt(user.password);
    }
    return encrypted;
  }

  function decryptUser (user) {
    var decrypted = {
      username : user.username
    };
    if (user.password) {
      decrypted.password = crypto.decrypt(user.password);
    }
    return decrypted;
  }

  // Serialize sessions
  passport.serializeUser(function serializeUser (user, callback) {
    if (!!user) {
      callback(null, encryptUser(user));
    } else {
      callback(new Error('User not found'));
    }
  });

  // Deserialize sessions
  passport.deserializeUser(function deserializeUser (user, callback) {

    if (!!user) {
      callback(null, decryptUser(user));
    } else {
      callback(new Error('Unrecognized user'));
    }
  });


  if (process.env.LT_AUTH_TYPE !== 'bluemix') {

    var authenticate = function authenticate (req, username, password, callback) {

      request({
        uri : env.endpoints.language_translator + '/v2/models',
        auth : {
          username : username,
          password : password,
          sendImmediately : true
        }
      }, function handler (error, response, body) {
        if (!error && response.statusCode === 200) {
          var userinfo = response.headers['x-watson-userinfo'];
          var serviceGUID = (userinfo.split('='))[1];

          // Need to set session variables as if the S2S
          // code had been executed
          req.session.serviceUrl = env.endpoints.language_translator;
          req.session.serviceUsername = crypto.encrypt(username);
          req.session.servicePassword = crypto.encrypt(password);
          req.session.serviceGuid = serviceGUID;

          return callback(null, {
            username : username,
            password : password,
            serviceGUID : serviceGUID
          });
        }
        return callback(null, false, {
          'message' : 'Username and password not recognised.'
        });
      });
    };

    // Use local strategy
    passport.use(new LocalStrategy({passReqToCallback : true}, authenticate));
    passport.use(new BasicStrategy({passReqToCallback : true}, authenticate));
  }

  passport.use(new BluemixStrategy({
    apiURL : env.endpoints.bluemix,
    clientID : env.clientid,
    clientSecret : env.secrets.client,
    callbackURL : env.endpoints.callback
  }, function authenticate (req, accessToken, refreshToken, profile, done) {

    log.debug({
      id : profile.id,
      username : profile.username,
      emails : profile.emails
    }, 'Authenticated User with Bluemix UAA');

    req.session.accessToken = accessToken;
    req.session.refreshToken = refreshToken;

    var tenant = _.get(req, 'session.serviceGuid');
    return done(null, profile);

  }));

  app.use(passport.initialize());
  app.use(passport.session());

};
