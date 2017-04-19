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

describe('Filter: orderObjectBy', function () {

  var projects = [{
    name: 'a',
    date: new Date(1997, 11, 17, 3, 24, 0),
    models: [
      {status_date: new Date(1995, 11, 17, 3, 24, 0)},
      {status_date: new Date(1996, 11, 17, 3, 24, 0)},
      {status_date: new Date(1997, 11, 17, 3, 24, 0)}
    ],
    strings: [
      {s: 'A'},
      {s: 'B'},
      {s: 'C'}
    ]
  }, {
    name: 'c',
    date: new Date(1995, 11, 17, 3, 24, 0),
    models: [
      {status_date: new Date(1995, 11, 17, 3, 24, 0)},
      {status_date: new Date(1995, 11, 17, 3, 24, 0)},
      {status_date: new Date(1995, 11, 17, 3, 24, 0)}
    ],
    strings: [
      {s: 'g'},
      {s: 'h'},
      {s: 'i'}
    ]
  }, {
    name: 'B',
    date: new Date(1996, 11, 17, 3, 24, 0),
    models: [
      {status_date: new Date(1998, 11, 17, 3, 24, 0)},
      {status_date: new Date(1996, 11, 17, 3, 24, 0)},
      {status_date: new Date(1995, 11, 17, 3, 24, 0)}
    ],
    strings: [
      {s: 'D'},
      {s: 'e'},
      {s: 'F'}
    ]
  }];

  // load the filter's module
  beforeEach(module('mtTrainingApp'));

  // initialize a new instance of the filter before each test
  var orderObjectBy;
  beforeEach(inject(function ($filter) {
    orderObjectBy = $filter('orderObjectBy');
  }));

  it('should return an array ordered by name', function () {
    expect(orderObjectBy(projects, 'name')[0]).toBe(projects[0]);
    expect(orderObjectBy(projects, 'name')[1]).toBe(projects[2]);
    expect(orderObjectBy(projects, 'name')[2]).toBe(projects[1]);
  });

  it('should return an array ordered by name reversed', function () {
    expect(orderObjectBy(projects, 'name', null, true)[0]).toBe(projects[1]);
    expect(orderObjectBy(projects, 'name', null, true)[1]).toBe(projects[2]);
    expect(orderObjectBy(projects, 'name', null, true)[2]).toBe(projects[0]);
  });

  it('should return an array ordered by date', function () {
    expect(orderObjectBy(projects, 'date')[0]).toBe(projects[1]);
    expect(orderObjectBy(projects, 'date')[1]).toBe(projects[2]);
    expect(orderObjectBy(projects, 'date')[2]).toBe(projects[0]);
  });

  it('should return an array ordered by date reversed', function () {
    expect(orderObjectBy(projects, 'date', null, true)[0]).toBe(projects[0]);
    expect(orderObjectBy(projects, 'date', null, true)[1]).toBe(projects[2]);
    expect(orderObjectBy(projects, 'date', null, true)[2]).toBe(projects[1]);
  });

  it('should return an array ordered by most recently updated model', function () {
    expect(orderObjectBy(projects, 'models', 'status_date')[0]).toBe(projects[1]);
    expect(orderObjectBy(projects, 'models', 'status_date')[1]).toBe(projects[0]);
    expect(orderObjectBy(projects, 'models', 'status_date')[2]).toBe(projects[2]);
  });

  it('should return an array ordered by most recently updated model reversed', function () {
    expect(orderObjectBy(projects, 'models', 'status_date', true)[0]).toBe(projects[2]);
    expect(orderObjectBy(projects, 'models', 'status_date', true)[1]).toBe(projects[0]);
    expect(orderObjectBy(projects, 'models', 'status_date', true)[2]).toBe(projects[1]);
  });

  it('should return an array of strings ordered by most recently updated model', function () {
    expect(orderObjectBy(projects, 'strings', 's')[0]).toBe(projects[0]);
    expect(orderObjectBy(projects, 'strings', 's')[1]).toBe(projects[2]);
    expect(orderObjectBy(projects, 'strings', 's')[2]).toBe(projects[1]);
  });

  it('should return an array ordered by most recently updated model reversed', function () {
    expect(orderObjectBy(projects, 'strings', 's', true)[0]).toBe(projects[1]);
    expect(orderObjectBy(projects, 'strings', 's', true)[1]).toBe(projects[2]);
    expect(orderObjectBy(projects, 'strings', 's', true)[2]).toBe(projects[0]);
  });

});
