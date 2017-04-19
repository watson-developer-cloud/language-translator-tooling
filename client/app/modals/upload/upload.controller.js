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
  .controller('uploadCtrl', function ($scope, $filter, $modalInstance, model, fileOptions, fileTypes) {
    $scope.model = model;
    $scope.fileOptions = fileOptions;
    $scope.fileTypes = fileTypes;

    var getFileExtension = function(file) {
        var ext = file.name.split('.').pop();
        return ext.toLowerCase();
    };

    $scope.selectFileOption = function(file, option) {
      file.option = option;
    };

    for(var i=0; i<model.newFiles.length; i++) {
        var ext = getFileExtension(model.newFiles[i]);
        if(ext === 'txt') {
            $scope.selectFileOption(model.newFiles[i], fileTypes.monolingualCorpus);
        }
    }

    $scope.getFileOption = function(option) {
        var nlsKey = 'model-document-' + option;
        var localized = $filter('translate')(nlsKey);
        if(localized == nlsKey) {
            return option;
        }
        return localized;
    };

    $scope.fileTypesConfirmed = function() {
      if(!model.newFiles) return;

      var confirmed = true;

      for (var i = 0; i < model.newFiles.length; ++i) {
        var file = model.newFiles[i];

        if (file.option === $filter('translate')('model-document-upload-select-type')) {
          confirmed = false;
        }
      }
      return confirmed;
    };

    $scope.isApplicableType = function(file, option) {
      var ext = getFileExtension(file);

      if (ext === 'tmx') {
        return option === fileTypes.initialFileOption || option === fileTypes.forcedGlossary || option === fileTypes.parallelCorpus;
      } else if (ext === 'txt') {
        return option === fileTypes.initialFileOption || option === fileTypes.monolingualCorpus;
      } else {
        return false;
      }
    };

    $scope.upload = function() {
      $modalInstance.close(model);
    };

    $scope.cancel = function() {
      $modalInstance.dismiss();
    };
  });
