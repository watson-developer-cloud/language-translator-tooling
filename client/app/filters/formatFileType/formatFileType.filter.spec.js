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

describe('Filter: formatFileType', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));


  // initialize a new instance of the filter before each test
  var formatFileType;
  var fileTypes;
  beforeEach(inject(function ($filter, _fileTypes_) {
    formatFileType = $filter('formatFileType');
    fileTypes = _fileTypes_;
  }));


  it('should return the correct formatted file type', function () {
    expect(formatFileType(fileTypes.forcedGlossary)).toBe('Forced glossary');
    expect(formatFileType(fileTypes.parallelCorpus)).toBe('Parallel corpus');
    expect(formatFileType(fileTypes.monolingualCorpus)).toBe('Monolingual corpus');
    expect(formatFileType('')).toBe('Unknown');
  });

});

