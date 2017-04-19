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
/* eslint func-names: 0, no-undef: 0, block-scoped-var: 0, max-statements: 0, complexity: 0, max-depth: 0 */
/* jshint node:true */
/* globals emit*/

var filesViews = {
   views: {
    countFileUse: {
     version : 1,
      map: function(doc) { if (doc.batch.length > 0)  { doc.batch.forEach(function(file) { emit([doc.tenant_id,file.uuid],1) }) } },
      reduce: '_count'
    }
  }
}

var batchesViews = {
  views: {
    all: {
     version : 1,
      map: function(doc) { if (doc.batch_id) { emit(doc.batch_id, doc) } }
    },
    byTenant: {
      version : 1,
      map: function(doc) { if (doc.batch_id)  emit([doc.tenant_id], doc) }
    },
    byTenantId: {
     version: 1,
      map: function(doc) { if (doc.batch_id)  emit([doc.tenant_id, doc.batch_id], doc) }
    },
    batchSize : {
      version : 1,
      map : function (doc) {
        if (doc.tenant_id && doc.batch_id) {
          var totalSize = 0;
          if (doc.batch) {
            if (doc.batch.length > 0) {
              for (var i in doc.batch) {
                if (doc.batch[i].file_size) {
                  totalSize += doc.batch[i].file_size;
                }
              }
            }
          }
          emit([doc.tenant_id, doc.batch_id], totalSize);
        }
      }
    }
  }
};

var batchesConfig = {
    name : 'batches',
    ddocs : [batchesViews]
};

var filesConfig = {
    name : 'files',
    ddocs : [filesViews]
};

module.exports = [batchesConfig, filesConfig];
