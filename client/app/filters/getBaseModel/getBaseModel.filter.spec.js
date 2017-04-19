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

describe('Filter: getBaseModel', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));

  // initialize a new instance of the filter before each test
  var getBaseModel;
  beforeEach(inject(function ($filter) {
    getBaseModel = $filter('getBaseModel');
  }));

  it('should return the base model of the input news', function () {
    var text = 'com.ibm.mt.models.en-es-news';
    expect(getBaseModel(text)).toBe('news');
  });

  it('should return the base model of the input conversational', function () {
    var text = 'com.ibm.mt.models.en-pt-conversational';
    expect(getBaseModel(text)).toBe('conversational');
  });

  it('should return the base model of the input health', function () {
    var text = 'com.ibm.mt.models.en-fr-health';
    expect(getBaseModel(text)).toBe('health');
  });

  it('should return the base model of the input patents', function () {
    var text = 'com.ibm.mt.models.fr-es-patents';
    expect(getBaseModel(text)).toBe('patents');
  });

});
