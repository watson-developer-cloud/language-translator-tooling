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
  .filter('formatFileType', ['$filter', 'fileTypes', function ($filter, fileTypes) {
    return function (input) {
      var key;
      if(input == fileTypes.forcedGlossary) {
        key = "model-document-forced_glossary";
      } else if (input == fileTypes.parallelCorpus) {
        key = "model-document-parallel_corpus";
      } else if (input == fileTypes.monolingualCorpus) {
        key = "model-document-monolingual_corpus";
      } else {
        key = "model-document-unknown";
      }
      return $filter('translate')(key);
    };
  }]);
