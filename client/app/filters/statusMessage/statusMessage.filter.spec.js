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

describe('Filter: statusMessage', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));

  // initialize a new instance of the filter before each test
  var statusMessage,
      statuses,
      statusMessages;

  beforeEach(inject(function ($filter, _statuses_, _statusMessages_) {
    statusMessage = $filter('statusMessage');
    statuses = _statuses_;
    statusMessages = _statusMessages_;
  }));

  it('should return Unknown', function() {
    expect(statusMessage(statuses.unknown)).toEqual(statusMessages.UNKNOWN);
  });

  it('should return Ready for files', function() {
    expect(statusMessage(statuses.created)).toEqual(statusMessages.CREATED);
  });

  it('should return Ready for training', function() {
    expect(statusMessage(statuses.filesLoaded)).toEqual(statusMessages.FILESLOADED);
  });

  it('should return Training', function() {
    expect(statusMessage(statuses.training)).toEqual(statusMessages.TRAINING);
  });

  it('should return Trained', function() {
    expect(statusMessage(statuses.trained)).toEqual(statusMessages.TRAINED);
  });

  it('should return Warning', function() {
    expect(statusMessage(statuses.warning)).toEqual(statusMessages.WARNING);
  });

});
