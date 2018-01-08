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
  .controller('LoginCtrl', function ($scope, $rootScope, $state, $location, $window, $filter, endpoints, Auth, Alerts) {

    if (!$scope.serviceGuid) {
      if ($state.params.serviceGuid) {
        $rootScope.serviceGuid = $state.params.serviceGuid;
      } else {
        var searchObj = $location.search();
        if (searchObj.serviceGuid) {
          $rootScope.serviceGuid = searchObj.serviceGuid;
        }
      }
    }

    var successRedirect = $state.href('projects', { serviceGuid : $rootScope.serviceGuid }, {absolute : true}),
        failureRedirect = $state.href('login', { serviceGuid : $rootScope.serviceGuid }, {absolute : true});

    $scope.authEndpoint = endpoints.auth + '/bluemix' +
      '?successRedirect=' + encodeURIComponent(successRedirect) +
      '&failureRedirect=' + encodeURIComponent(failureRedirect) +
      '&serviceGuid=' + encodeURIComponent($scope.serviceGuid);

    $scope.bluemixLogin = function bluemixLogin () {
      $window.location.href = $scope.authEndpoint;
    };

    <% if (process.env.LT_AUTH_TYPE !== 'bluemix') { %> // jshint ignore:line

      $scope.user = {
        name: '',
        password: '',
        blueGUID: ''
      };

    $scope.credentialLogin = function() {
      Auth
        .login($scope.user.name, $scope.user.password, $scope.user.blueGUID)
        .then(function() {
          Alerts.clear();
          var path = '/projects';
          if(typeof(localStorage) !== 'undefined') {
            var storedPath = localStorage.getItem('ibm-watson-lt-url');
            if(storedPath) {path = storedPath;}
            localStorage.removeItem('ibm-watson-lt-url');
          }
          $location.path(path);
        }, function() {
          Alerts.clear();
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('login-error')});
        });
    };
    <% }%> // jshint ignore:line
  })
.run(['$templateCache', function populate ($templateCache) {

  var bluemix = '<div class="ibm-wrapper-log_in">\n' +
    '  <div class="row">\n' +
    '    <div class="log-in_panel log-in_top-border">\n' +
    '      <h1 class="log-in_title">IBM Watson Language Translator Tool Beta</h1>\n' +
    '      <a ng-click="bluemixLogin()" class="btn btn-block btn-social btn-bluemix">\n' +
    '      <div class="bluemix-logo"/>{{\'login-bluemix-signin-description\' | translate}}</div>\n' +
    '    </a>\n' +
    '      <div class="row">\n' +
    '        <p><a href="https://console.ng.bluemix.net/registration" class="ibm-link">{{\'login-no-bluemix-credentials\' | translate}}</a></p>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div>\n' +
    '</div>\n';

  var rendered = bluemix;

  <% if (process.env.LT_AUTH_TYPE !== 'bluemix') { %> // jshint ignore:line

    var nonBluemix = '<div class="ibm-wrapper-log_in">\n' +
      '  <div class="row">\n' +
      '    <div class="log-in_panel log-in_top-border">\n' +
      '      <h1 class="log-in_title">IBM Watson Language Translator Tool Beta</h1>\n' +
      '      <p style="margin-top:2em;" translate>\n' +
      '        login-signin-description\n' +
      '      </p>\n' +
      '      <form novalidate class="login-box" ng-submit="credentialLogin()">\n' +
      '        <div class="form-group ibm-form__group log-in_form">\n' +
      '          <input type="text" class="form-control ibm-form__input" name="username" id="username" ng-model="user.name" aria-label="{{\'login-username\' | translate}}" placeholder="{{\'login-username\' | translate}}">\n' +
      '          <br>\n' +
      '          <input type="text" class="form-control ibm-form__input" name="blueGUID" id="blueGUID" ng-model="user.blueGUID" aria-label="{{\'login-blueGUID\' | translate}}" placeholder="{{\'login-blueGUID\' | translate}}">\n' +
      '          <br>\n' +
      '          <input type="password" class="form-control ibm-form__input" name="password" id="password" ng-model="user.password" aria-label="{{\'login-password\' | translate}}" placeholder="{{\'login-password\' | translate}}">\n' +
      '        </div>\n' +
      '        <div class="row log-in_form">\n' +
      '          <button role="button" type="submit" class="log-in_button btn btn-primary ibm-btn ibm-btn--primary full-width">{{\'login\' | translate}}</button>\n' +
      '        </div>\n' +
      '      </form>\n' +
      '      <div class="row">\n' +
      '        <p><a href="http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/doc/getting_started/gs-credentials.shtml" class="ibm-link">{{\'login-no-credentials\' | translate}}</a></p>\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '</div>\n';

    rendered = nonBluemix;
  <% }%>    // jshint ignore:line

  $templateCache.put('app/routes/login/login.html', rendered);
}]);
