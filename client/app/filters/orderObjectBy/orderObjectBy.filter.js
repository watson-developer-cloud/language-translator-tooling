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
  .filter('orderObjectBy', function() {
    return function(items, field, child, reverse) {
      var filtered = [];

      if (child) {
        angular.forEach(items, function(item) {
          for (var i = 0; i < item[field].length; ++i) {
            if (!item[child]) {
              item[child] = item[field][i][child];
            } else {
              if (item[field][i][child] > item[child]) {
                item[child] = item[field][i][child];
              }
            }
          }
          filtered.push(item);
        });
        filtered.sort(function (a, b) {
          if(typeof a[child] === 'string' && typeof b[child] === 'string') {
            return (a[child].toLowerCase() > b[child].toLowerCase() ? 1 : -1);
          } else {
            return (a[child] > b[child] ? 1 : -1);
          }
        });
      } else {
        angular.forEach(items, function(item) {
          filtered.push(item);
        });
        filtered.sort(function (a, b) {
          if(typeof a[field] === 'string' && typeof b[field] === 'string') {
            return (a[field].toLowerCase() > b[field].toLowerCase() ? 1 : -1);
          } else {
            return (a[field] > b[field] ? 1 : -1);
          }
        });
      }
      if (reverse) {
        filtered.reverse();
      }
      return filtered;
    };
  });
