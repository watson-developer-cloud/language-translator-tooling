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
  .directive('mtDropbox', function () {
    return {
      templateUrl: 'app/directives/mtDropbox/mtDropbox.html',
      restrict: 'E',
      replace: 'true',
      link: function (scope, element) {

        //============== DRAG & DROP =============
        // source for drag&drop: http://www.webappers.com/2011/09/28/drag-drop-file-upload-with-html5-javascript/
        var dropbox = element[0];

        // init event handlers
        function dragEnterLeave(evt) {
          evt.stopPropagation();
          evt.preventDefault();
        }

        dropbox.addEventListener('dragenter', dragEnterLeave, false);
        dropbox.addEventListener('dragleave', dragEnterLeave, false);

        dropbox.addEventListener('dragover', function(evt) {
          evt.stopPropagation();
          evt.preventDefault();
        }, false);

        dropbox.addEventListener('drop', function(evt) {
          console.log('drop evt:', JSON.parse(JSON.stringify(evt.dataTransfer)));
          evt.stopPropagation();
          evt.preventDefault();

          var files = evt.dataTransfer.files;
          if (files.length > 0) {
            scope.addFiles(files);
          }
        }, false);
        //============== DRAG & DROP =============

      }
    };
  });
