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
  .directive('mtHeader', function () {
    return {
      templateUrl: 'app/directives/mtHeader/mtHeader.html',
      restrict: 'E',
      controller: function($scope, $location, Auth, forumURL, Alerts) {
        $scope.showTenancyID = false;
        $scope.forumURL = forumURL;

        $scope.logout = function() {
          Auth.logout().then(function() {
            $location.url('/login');
          });
        };
        $scope.loggedIn = function() {
          return Auth.isAuthenticated();
        };
        $scope.showID = function() {
          if ($scope.tenancyID) {
            $scope.showTenancyID = !$scope.showTenancyID;
          } else {
            Auth.getCurrentUser().then(function(tenant) {
              $scope.tenancyID = tenant;
              $scope.showTenancyID = !$scope.showTenancyID;
            });
          }
        };
        $scope.location = function(string) {
          return $location.url().indexOf(string) > -1;
        };


        var alertHandler = function(alert) {
            $scope.alert = alert;
        };
        Alerts.subscribe(alertHandler);

        $scope.getAlertCount = function() {
            return Alerts.count();
        };

        $scope.getAlerts = function() {
            return Alerts.getAll();
        };
        $scope.removeAlert = function(alertScope, alert) {
            if(alertScope != "global") {
                Alerts.removeAlert(alert);
            } else {
                delete $scope.alert;
            }
        };
        $scope.clearAlerts = function() {
            Alerts.clear();
        };
      }
    };
  });
