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

angular.module('mtTrainingApp')
  .factory('Auth',
    ['$http', '$q', 'session','endpoints',
      function init ($http, $q, session, endpoints) {

        function createSession (user) {
          // Store the current user and tenant for other services
          var tenant = _.isArray(user.tenants) ? user.tenants[0] : null;
          session.create(user.username, tenant);
        }

        function checkStatus () {
          return $http.get(endpoints.auth)
            .then(function handleResponse (response) {
              // Error response should be handled globally
              createSession(response.data);
              return response.data.tenants[0];
            }, function(reason) {
              console.log(reason);
            });
        }

        function getCurrentUser () {
          if (!session.tenant) {
            return checkStatus();
          } else {
            return $q.when(session.tenant);
          }
        }

        function isAuthenticated () {
          return !!session.username;
        }

        function login (username, password, blueGUID) {
          //console.log('3 - inside auth service login !!! ' + blueGUID);
          return $http
            .post(endpoints.auth, {
              username: username,
              password: password,
              blueGUID:  blueGUID
            })
            .then(function handleLoginResponse (res) {

              // Store the current user and tenant for other services
              var tenant = _.isArray(res.data.tenants) ? res.data.tenants[0] : null;

              session.create(res.data.username, tenant);

              return res.data;

            }, function handleLoginError (res) {
              if (res.status === 400 || res.status === 401) {
                throw new Error('Invalid username or password');
              }
              return res.data;
            });

        }

        function logout () {
          return $http.post(endpoints.auth + '/logout', null, {
            withCredentials: true
          }).then(function onLogout () {
            session.destroy();
          });
        }

        var auth = {
          checkStatus: checkStatus,
          isAuthenticated: isAuthenticated,
          getCurrentUser: getCurrentUser,
          login: login,
          logout: logout
        };

        return auth;
      }
    ]
  );
