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

var commonCloudant = require('../common-cloudant');
var log = require('../../config/log');
var promise = require('bluebird');
var HTTPStatus = require('http-status');
var modelStoreDB;
var db_name = 'mt_custom_models';
var dbdesigns = require('./db/designs');


function setupDB(callback) {

  promise.promisify(commonCloudant)(db_name, dbdesigns)
  .then(function(dbHandle) {
   modelStoreDB = promise.promisifyAll(dbHandle);
   callback(null, dbHandle);
  })
}
module.exports.setupDB = setupDB;


/**
 Count existing custom_models with same tenant and name
 If we have more than one remove the one we have been given
 and fail.
 otherwise retrun one we have been given all is well..
 */
function ensureUniqueness(customModel) {
  return modelStoreDB.viewAsync('models', 'countTenantName', {
      key: [customModel.tenant_id, customModel.name],
      group: true
    })
    .spread(function(body, headers) {
      if (headers.statusCode === HTTPStatus.OK) {
        var count = 0;
        if (typeof body.rows[0] !== 'undefined') {
          count = body.rows[0].value;
        }
        log.trace({
          count: count
        }, 'Counted them ');
        if (count === 0) {
          log.error('Failed to find the customModel provided ');
          throw Error('customModel with name doesn\'t exist');
        } else if (count > 1) {
          //Delete it and fail
          return deleteModel(customModel._id, customModel._rev).then(function(body) {
            log.error('Custom_model already exists ');
            throw new Error(
              'DuplicateDetected'
            );
          })
        } else {
          return customModel;
        }
      } else {
        log.error({
          statusCode: headers.statusCode
        }, 'Custom_model db response code is not ' + HTTPStatus.OK);
        throw Error('customModel query failed', body)
      }
    });
}

module.exports.ensureUniqueness = ensureUniqueness;


/*
Creates a Custom Model using the Object passed in.
Returns the model with id and rev added
Plan for success, cater for faliure assume some sensible checking for uniquness already down in UI.
*/
module.exports.create = function createModel (newModel) {
  log.debug({
    newModel : newModel
  }, 'create new model');
  if (newModel.creation_date === 'undefined') {
    newModel.creation_date = Date.now();
  }
  return modelStoreDB.insertAsync(newModel)
    .spread(function (body, headers) {
      if (headers.statusCode === HTTPStatus.CREATED) {
        newModel._rev = body.rev;
        newModel._id = body.id;
        log.debug({
          newModel : newModel
        }, 'Created new model :');
        return newModel;
      } else {
        log.error({
          statusCode : headers.statusCode
        }, 'Custom_model db response code is not ' + HTTPStatus.CREATED);
        throw Error('customModel create failed', body)
      }
    })
    .then(ensureUniqueness)
    .then(function (newModel) {
      return newModel;
    })
};

/**
 Deletes the custom Model

*/
function deleteModel(id, rev) {
  return modelStoreDB.destroyAsync(id, rev).spread(function(body, headers) {
    if (headers.statusCode === HTTPStatus.OK) {
      log.info('Deleted model :', body);
      return body;
    } else {
      log.error('Custom_model db response code is not ' + HTTPStatus.OK + ', it is ', headers.statusCode);
      throw Error('customModel delete failed', body)
    }
  });
}

module.exports.deleteModel = deleteModel;

/**
Updates a Custom Model using the Object passed in.
Returns the updated Model
Object passed in must have an _id and _rev property..
*/
module.exports.update = function updateModel(updatedModel) {
  log.debug('Updated model details :', updatedModel);
  return modelStoreDB.insertAsync(updatedModel)
    .spread(function(body, headers) {
      if (headers.statusCode === HTTPStatus.CREATED || headers.statusCode === HTTPStatus.ACCEPTED) {
        updatedModel._rev = body.rev;
        log.debug({
          updatedModel: updatedModel
        }, 'Updated model details');
        return updatedModel;
      } else {
        log.error({
          statusCode: headers.statusCode
        }, 'Custom_model db response code is not ' + HTTPStatus.CREATED + ' or ' + HTTPStatus.ACCEPTED);
        throw Error('customModel update failed', body)
      }
    });
};

/**
 Returns an array containing all custom models
 */
module.exports.getAll = function getAll (queryParams) {

  if (typeof queryParams.project !== 'undefined') {
    return modelStoreDB.viewAsync('models', 'byTenantProject', {
      key : [queryParams.tenant_id, queryParams.project]
    }).spread(function (body, headers) {
      if (headers.statusCode === HTTPStatus.OK) {
        var result = [];
        log.debug({
          model : body
        }, 'Found models');
        body.rows.forEach(function (row) {
          result.push(row.value);
        });
        log.debug({
          result : result
        }, 'Result ');
        return result;
      } else {
        log.error({
          statusCode : headers.statusCode
        }, 'Custom_model db response code is not ' + HTTPStatus.OK + ', it is ');
        throw Error('customModel query failed', body)
      }
    });

  } else if (typeof queryParams.name !== 'undefined') {
    return modelStoreDB.viewAsync('models', 'byCustomModelName', {
      key : [queryParams.tenant_id, queryParams.name]
    }).spread(function (body, headers) {
      if (headers.statusCode === HTTPStatus.OK) {
        var result = [];
        log.debug({
          model : body
        }, 'Found models');
        body.rows.forEach(function (row) {
          result.push(row.value);
        });
        log.debug({
          result : result
        }, 'Result ');
        return result;
      } else {
        log.error({
          statusCode : headers.statusCode
        }, 'Custom_model db response code is not ' + HTTPStatus.OK + ', it is ');
        throw Error('customModel query failed', body)
      }
    });
  } else {

    return modelStoreDB.viewAsync('models', 'byTenant', {
      key : [queryParams.tenant_id]
    }).spread(function (body, headers) {
      if (headers.statusCode === HTTPStatus.OK) {
        var result = [];
        log.info('Found models ', body);
        body.rows.forEach(function (row) {
          result.push(row.value);
        });
        log.info('Result ', result);
        return result;
      } else {
        log.error('Custom_model db response code is not ' + HTTPStatus.OK + ', it is ', headers.statusCode);
        throw Error('customModel query failed', body)
      }
    });
  }

};

/**
 Returns the custom Model by Id

*/
module.exports.getById = function getById (tenant_id, id) {
  log.info({
    tenant_id : tenant_id,
    id : id
  }, 'Get model for tenant_id by ID');

  return modelStoreDB.viewAsync('models', 'byTenantId', {
    key : [tenant_id, id]
  })
    .spread(function (body, headers) {
      if (headers.statusCode === HTTPStatus.OK) {
        if (body.rows.length !== 1) {
          // count = body.rows[0].value;
          log.error({modelid : id}, 'Custom_model not found ');
          var err = new Error('ModelNotFound');
          err.statusCode = HTTPStatus.NOT_FOUND;
          throw err;
        }
        log.info('Found model details :', body);
        return body.rows[0].value;
      } else {
        log.error('Custom_model db response code is not ' + HTTPStatus.OK + ', it is ', headers.statusCode);
        throw Error('customModel query failed', body)
      }
    });
};
