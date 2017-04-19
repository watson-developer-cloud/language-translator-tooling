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

var modelsViews = {
  views: {
    byTenant: {
      version : 1,
      map: function(doc) { if (doc.type === 'model')  emit([doc.tenant_id], doc) }
    },
    byTenantId: {
     version: 1,
      map: function(doc) { if (doc.type === 'model')  emit([doc.tenant_id, doc._id], doc) }
    },
    byTenantProject: {
     version : 1,
      map: function(doc) { if (doc.type === 'model')  emit([doc.tenant_id,doc.metadata._project], doc) }
    },
    countTenantName: {
     version : 1,
      map: function(doc) { if (doc.type === 'model')  emit([doc.tenant_id,doc.name],1) },
      reduce: '_count'
    },
    byCustomModelName: {
      version : 1,
      map: function (doc) { if (doc.type === 'model')  emit([doc.tenant_id,doc.name], doc) }
    }
  }
}

var modelsConfig = {
    name : 'models',
    ddocs : [modelsViews]
};

module.exports = [modelsConfig];
