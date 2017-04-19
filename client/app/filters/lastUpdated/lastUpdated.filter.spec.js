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

describe('Filter: lastUpdated', function () {

  // load the filter's module
  beforeEach(module('mtTrainingApp'));


  // initialize a new instance of the filter before each test
  var lastUpdated;
  var moment;
  beforeEach(inject(function ($filter, _moment_) {
    lastUpdated = $filter('lastUpdated');
    moment = _moment_;
  }));

  it('should return Never with an empty array', function () {
    var models = [];
    expect(lastUpdated(models)).toBe('Never');
  });

  it('should return the last updated model from an array of one', function () {
    var date = new Date(1482667200000);
    var models = [{status_date: date}];
    expect(lastUpdated(models)).toBe('December 25, 2016 12:00 PM');
  });

  it('should return the last updated model from an array of many', function () {
    var d1 = new Date(1425211200000);
    var d2 = new Date(1425214800000);
    var d3 = new Date(1425218400000);
    var models = [{status_date: d1}, {status_date: d2}, {status_date: d3}];
    // bug in moment here - it should be February 29!
    expect(lastUpdated(models)).toBe('March 1, 2015 2:00 PM');
  });

  it('should return the localized variation of the last modified date', function() {
    var date = new Date(1482667200000);
    var models = [{status_date: date}];

    moment.locale('fr');
    expect(lastUpdated(models)).toBe('25 décembre 2016 12:00');

    moment.locale('en');
    expect(lastUpdated(models)).toBe('December 25, 2016 12:00 PM');
  });

});
