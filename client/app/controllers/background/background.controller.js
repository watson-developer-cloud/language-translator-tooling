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
  .controller('BackgroundCtrl', function ($scope, $location) {
    $scope.background = function() {
      var url = $location.url();
      if (url.indexOf('login') > -1) {
        return {
          'background': 'url(assets/images/lt-login_background.svg) no-repeat center center fixed',
          '-webkit-background-size': 'cover',
          '-moz-background-size': 'cover',
          '-o-background-size': 'cover',
          'background-size': 'cover'
        };
      } else if (url.indexOf('project') > -1) {
        return {'background-color': '#ECF0F2'};
      } else {
        return {'background-color': '#fff'};
      }
    };
  });
