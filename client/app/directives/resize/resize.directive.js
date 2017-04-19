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
  .directive('resize', function ($window) {
    return function (scope) {
      var w = angular.element($window);
      scope.getWindowDimensions = function () {
        return {
          'h': w.height(),
          'w': w.width()
        };
      };
      scope.$watch(scope.getWindowDimensions, function (newValue) {
        scope.col2Style = function () {
          var offset = 250;

          if (newValue.w <= 950) {
            return {};
          } else {
            return {
              'height': (newValue.h - offset) + 'px'
            };
          }
        };
        scope.sideBarStyle = function (offset) {
          offset = offset ? offset : 0;

          if (newValue.w <= 770) {
            return {};
          } else {
            return {
              'height': (newValue.h - offset) + 'px'
            };
          }
        };
        scope.listStyle = function () {
          if (newValue.w <= 770) {          // collapsed sidebar
            return {};
          } else if (newValue.w <= 900) {   // min-width: 770px
            return {
              'width': (newValue.w / 3) + 'px'
            };
          } else if (newValue.w <= 1200) {  // min-width: 900px
            return {
              'width': (newValue.w / 4) + 'px'
            };
          } else {                          // min-width: 1220px
            return {
              'width': (newValue.w / 5) + 'px'
            };
          }
        };
      }, true);

      w.bind('resize', function () {
        scope.$apply();
      });
    };
  });
