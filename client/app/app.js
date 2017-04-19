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

angular.module('mtTrainingApp', [
  'pascalprecht.translate',
  'localization',
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngAnimate',
  'ngFileUpload',
  'ui.router',
  'ui.bootstrap',
  'config',
  'ibmwatson-common-ui-components',
  'ibmwatson-mt-ui-training.restUtil'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
    $urlRouterProvider
      .otherwise('/projects');

    $locationProvider.html5Mode(true);

    // set up a http interceptor to listen out for 401 (Unauthorizes) responses
    $httpProvider.interceptors.push(['$q', '$location', function($q, $location) {
      return {
        // If response is 401 (Unauthorized), go to the login URL
        'responseError': function(response) {
          if (response.status === 401) {
            console.log('intercept and reroute');
            if(typeof(localStorage) !== "undefined") {
                localStorage.setItem("ibm-watson-lt-url", $location.url());
            }
            $location.path('/login');
          }
          return $q.reject(response);
        }
      };
    }]);

  })
  .constant('moment', moment);
