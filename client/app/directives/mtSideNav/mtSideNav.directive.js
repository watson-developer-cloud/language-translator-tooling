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
  .directive('mtSideNav', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/directives/mtSideNav/mtSideNav.html',
      controller: function($scope, $location, Auth, forumURL) {
        $scope.showTenancyID = false;
        $scope.forumURL = forumURL;

        $scope.toggleMenu = function() {
            $scope.mtSideNavOpen = !$scope.mtSideNavOpen;
            angular.element(document.body).toggleClass("mt-side-nav-open");
        };

        $scope.logout = function() {
          $scope.toggleMenu();
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
      }
    };
  });
