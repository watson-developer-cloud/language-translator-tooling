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
  .factory('Batch', function ($resource) {
    return $resource('/api/batches/:tenant_id/:batch_id', {batch_id: '@batch_id', tenant_id: '@tenant_id'});
  })
  .factory('CloneBatch', function ($resource) {
    return $resource('/api/batches/:tenant_id/:batch_id/clone', {batch_id: '@batch_id', tenant_id: '@tenant_id'});
  })
  .factory('File', function ($resource) {
    return $resource('/api/batches/:tenant_id/:batch_id/files/:file_id', {batch_id: '@batch_id', file_id: '@file_id', tenant_id: '@tenant_id'});
  });
