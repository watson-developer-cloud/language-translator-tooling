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
  .directive('copyToClipboard', function ($filter) {
    return {
      restrict: 'A',
      link: function (scope, element, attributes) {
          var additionalClass = '';
          if(attributes["copyToClipboard"] == "icon") {
              additionalClass = ' class="icon"';
          }
          var subDiv = angular.element('<pre' + additionalClass + '></pre>');
          subDiv.append(element.contents()[0]);
          element.append(subDiv);

          var label = "<span>" + $filter('translate')('copy-text') + "</span>";
          if(attributes["copyToClipboard"] == "icon") {
              label = '<span aria-hidden="true" class="ibm ibm-icon--copy"></span>';
          }
          var copyButton = angular.element('<button type="button"' + additionalClass + ' role="button" aria-label="' + $filter('translate')('copy-text') + '" title="' + $filter('translate')('copy-text') + '">' + label + '</button>');
          element.append(copyButton);

          copyButton.bind('click', function() {
              // Create text area to put text in so we can copy it
              var textarea = document.createElement('textarea');
              textarea.value = subDiv.contents()[0].nodeValue;
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
              copyButton.focus();
          });
      }
    };
  });
