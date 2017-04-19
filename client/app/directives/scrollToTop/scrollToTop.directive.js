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
  .directive('scrollToTop', function ($window, $filter) {
    return {
      restrict: 'A',
      link: function (scope, element, attributes) {
          var container = angular.element('<div class="ng-hide stt-container" aria-hidden="true"></div>');
          var button = angular.element('<button type="button" role="button" title="' + $filter('translate')('scroll-to-top') + '" aria-label="' + $filter('translate')('scroll-to-top') + '"><span aria-hidden="true" class="fa fa-arrow-up"></span></button>');
          container.append(button);
          element.append(container);

          angular.element($window).bind("scroll", function() {
              if (this.pageYOffset >= 100) {
                  container.removeClass("ng-hide");
              } else {
                  container.addClass("ng-hide");
              }
              scope.$apply();
          });
          button.bind('click', function() {
              $window.scrollTo(0, 0);
          });
      }
    };
  });
