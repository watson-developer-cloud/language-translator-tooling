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

var log = require('../../config/log');
var lt = require('../../components/lt');
var promise = require('bluebird');

var customModels = require('../../components/modelStore');
var batchFile = require('./batchFileInternal');

var constants = require('./constants.js');
var statuses = constants.statuses;
var errorDetails = constants.errorDetails;
var HTTPStatus = require('http-status');
var LTError = require('../../components/common').LTError;
var LtDuplicateDetectedError = require('../../components/common').LtDuplicateDetectedError;
var ltErrors = require('../../components/ltErrors');
var common = require('../../components/common');
var s2s_getCredentialsFromSession = require('../../components/s2s').getCredentialsFromSession;


//Get credentials without exposing callback;
var getCredentialsFromSession = function(req) {
  return s2s_getCredentialsFromSession(req, function(err, credentials) {
    return credentials;
  })
};


//This function takes a custom_model and returns a Promise of an array containing custom_model object and an object containing the files for training
var getTrainingFilesForModel = function (customModel) {
  return promise.all([customModel, promise.method(batchFile.getFilesForBatch)(customModel.tenant_id, customModel.file_batch_id)]);
};

//This function takes a customModel object and object representing the training files
//It returns a Promise of an array containing the custom_Model and the newly trained model id
var trainModel = function (credentials, customModel, files) {
  log.info('Files :', files);
  return lt.trainModel(credentials, customModel.base_model_id, customModel.name, files)
    .then(function (trainingModelId) {
      customModel.trained_model_id = trainingModelId;
      customModel.status = statuses.TRAINING;
      customModel.status_date = Date.now();
      log.info('Updated model is : ', customModel);
      return customModel;
    })
};

//Function removes the properties from models which are not required by the UI
var prepareBaseModelsForResponse = function (models) {
  var result = [];
  models.forEach(function (row) {
    delete row.base_model_id;
    delete row.default;
    delete row.owner;
    delete row.status;
    delete row.customizable;
    result.push(row);
  });
  return result;
};

//Transform Ui's view of the custom_model into the internal view of the model
var transformRequestModel = function (customModel) {
  if (typeof customModel.metadata === 'undefined') {
    customModel.metadata = {};
  }
  customModel.metadata._project = customModel.project;
  delete customModel.project;
  return customModel;
};

/*
 Function takes a object representing a request to create a model
 It adds missing Properties with default values
 Returns the updated model.
 */
var addModelDefaults = function (requestedModel) {
  requestedModel.type = 'model';
  requestedModel.trained_model_id = constants.UNTRAINED_MODELID;
  requestedModel.status = statuses.CREATED;
  requestedModel.status_date = Date.now();
  return requestedModel;
};

//This function takes a custom model and prepares it for response to another service.
//It will remove Properties only intended for use within this service.
var prepareCustomModelForResponse = function (customModel) {
  customModel.custom_model_id = customModel._id;
  delete customModel.type;
  delete customModel._rev;
  delete customModel._id;
  delete customModel.tenant_id;
  if (typeof customModel.metadata !== 'undefined') {
    customModel.project = customModel.metadata._project;
    delete customModel.metadata._project;
  }
  return customModel;
};

//This function takes a custom model and prepares a message representing its status to another service.
//It will extract status and status_date
var prepareStatusForResponse = function (customModel) {
  var status = {
    status : customModel.status,
    status_date : customModel.status_date
  };
  if (typeof customModel.status_detail !== 'undefined') {
    status.status_detail = customModel.status_detail;
  }
  return status;
};

/** Given a trainingLog from a model in error, establish a reason why it failed
 @param {string} trainingLog - Log form training the model in error
 @returns {string} errorDetails - The details string for why the model failed to train
 */
var parseTrainingLogForErrorReason = function (trainingLog) {
  if ((trainingLog.indexOf('Bad TMX file') > -1) && (trainingLog.indexOf('Bad TMX format') > -1)) {
    return errorDetails.BADFILE;
  }
  if ((trainingLog.indexOf('A minimum of') > -1) && (trainingLog.indexOf('parallel segments is required for customization and you provided only') > -1)) {
    return errorDetails.INSUFFICIENTSEGMENTS;
  }
  return errorDetails.UNKNOWN;
};

/**
 Given a customModel, determines the status of that customModel
 If it is currently training it will check the Language Translator Service Instance.
 If status has changed it will update the custom model
 The status detail is only persisted if an error has occurred.
 @param {credentialsType} credentials - The credentials making the request
 @param {Object} customModel - The customModel Object to update Status for
 @returns {Object} - returns the custom Model object with updated status.
 @throws {LTError} - An exception may be thrown if there is a problem establishing status from the Language Translator Service
 or from trying to update the status of the custom Model
 */
var updateLatestStatus = function (credentials, customModel) {
  //Only If we are waiting for a model to finish training do we check the Language Translator Service Instance.
  if (customModel.status === statuses.TRAINING) {
    return lt.getModel(credentials, customModel.trained_model_id)
      .then(function (trainedModel) {
        customModel.status_date = Date.now();
        switch (trainedModel.status) {
          case 'starting':
          case 'uploading':
          case 'uploaded':
          case 'dispatching':
          case 'trained':
          case 'publishing':
            customModel.status_detail = trainedModel.status;
            break;
          case 'training':
            delete customModel.status_detail;
            break;
          case 'available':
            delete customModel.status_detail;
            customModel.status = statuses.TRAINED;
            log.info(customModel, 'Training completed, Custom model status will be updated ');
            return customModels.update(customModel);
          case 'error':
            lt.getTrainingLog(credentials, customModel.trained_model_id)
              .then(function (trainingLog) {
                delete customModel.status_detail;
                customModel.status = statuses.WARNING;
                customModel.status_detail = parseTrainingLogForErrorReason(trainingLog.trainingLog);
                log.info(customModel, 'Error occurred, Custom model status will be updated ');
                return customModels.update(customModel);
              });
            break;
          case 'deleted':
            customModel.status_detail = trainedModel.status;
            customModel.status = statuses.WARNING;
            log.info(customModel, 'Trained Model has been deleted, Custom model status will be updated ');
            return customModels.update(customModel);
          case 'unavailable':
            customModel.status_detail = trainedModel.status;
            customModel.status = statuses.WARNING;
            log.info(customModel, 'Trained Model is unavailable, Custom model status will be updated ');
            return customModels.update(customModel);
          default:
            if (trainedModel.status.substring(0, 6) === 'queued') {
              customModel.status_detail = trainedModel.status;
            }
            else {
              //Unexpected status so set model to WARNING
              customModel.status_detail = trainedModel.status;
              customModel.status = statuses.WARNING;
              log.error({
                customModel : customModel,
                trainedModel : trainedModel
              }, 'The status of the trained Model has not been recognised. Internal Error has occured ');
              return customModels.update(customModel);
            }
        }
        return customModel;
      });
  } else {
    return promise.resolve(customModel);
  }
};

/* This function takes an object representing the original customModel and an object representing cloneProperties
 It returns a new Object the clone
 */
var cloneCustomModelObject = function (origModel, cloneOptions) {
  log.info({
    customModel : origModel,
    cloneOptions : cloneOptions
  });
  var currentDate = Date.now();
  var newModel = {};
  newModel.description = origModel.description;
  if (typeof cloneOptions.description !== 'undefined') newModel.description = cloneOptions.description;
  newModel.name = cloneOptions.name;
  newModel.type = 'model';
  newModel.trained_model_id = constants.UNTRAINED_MODELID;
  //Set this to Created here once we find out about files we will reconsider the status - could be FILESLOADED`
  newModel.status = statuses.CREATED;
  newModel.status_date = currentDate;
  newModel.base_model_id = origModel.base_model_id;
  newModel.domain = origModel.domain;
  newModel.source = origModel.source;
  newModel.target = origModel.target;
  newModel.tenant_id = origModel.tenant_id;
  newModel.metadata = origModel.metadata;
  newModel.metadata._project = origModel.metadata._project;
  newModel.cloned_from = origModel._id;
  newModel.cloned_date = currentDate;
  log.info({
    clonedModel : newModel
  });
  return newModel;
};

exports.getBaseModels = function getBaseModels (req, res, next) {
  var tenantId = req.params.tenantId;
  log.info({
    tenantid : tenantId
  }, 'Received request to list all base models');
  var credentials = getCredentialsFromSession(req);

  var queryOptions = {
    default : 'true'
  };
  lt.getModels(credentials, queryOptions)
    .then(prepareBaseModelsForResponse)
    .then(function (result) {
      log.info('Response : ', result);
      res.status(HTTPStatus.OK).json(result);
    }).catch(function (e) {
    log.error('500: an error occured: ', e);
    return next(e);
  });
};

exports.getAllCustomModels = function getAllCustomModels (req, res, next) {
  var tenantId = req.params.tenantId;
  //Construct params - Could query based on tenantId or tenantId and project
  var params = {
    tenant_id : tenantId
  };

  if (typeof req.query.project !== 'undefined') {
    params.project = req.query.project;
  }
  log.info({
    params : params
  }, 'Received request to list all models');
  customModels.getAll(params)
    .then(function (models) {
      var filteredModels = models.filter(function (model) {
        return ((typeof model.marked_for_deletion === 'undefined') || (model.marked_for_deletion === false))
      });
      filteredModels.forEach(function (model) {
        prepareCustomModelForResponse(model);
      });
      return filteredModels;
    })
    .then(function (models) {
      log.debug({
        models : models
      });
      return res.status(HTTPStatus.OK).send(models);
    })
    .catch(function (err) {
      log.error({
        Error : err
      });
      return next(err);
    });
};

exports.createCustomModelInternal = function createCustomModelInternal (tenantId, customModel) {
  return customModels.create(customModel)
    .then(function (customModel) {
      customModel.file_batch_id = customModel._id + 'BatchId';
      var newBatch = {
        batch_id : customModel.file_batch_id
      };
      return promise.method(batchFile.createBatch)(tenantId, newBatch)
        .then(function (batchID) {
          return customModels.update(customModel);
        })
    })
};

exports.createCustomModel = function createCustomModel (req, res, next) {
  var tenantId = req.params.tenantId;
  log.info({
    tenant : tenantId,
    modelToCreate : req.body
  }, 'Received request to create a model ');

  //Push tenantid into custom model
  req.body.tenant_id = tenantId;
  //Transform from UI model to internal model
  var customModel = transformRequestModel(req.body);

  //Add any missing defaults
  addModelDefaults(customModel);

  exports.createCustomModelInternal(tenantId, customModel)
    .then(prepareCustomModelForResponse)
    .then(function (newModel) {
      log.debug({
        newModel : newModel
      }, 'New Model created');
      return res.status(HTTPStatus.CREATED).send(newModel);
    })
    .catch(function (err) {
      if (err.message === 'DuplicateDetected') {
        var error = new LtDuplicateDetectedError('A model with this name: ' + customModel.name + ' already exists ', ltErrors.duplicateModelName, {
          modelName : customModel.name
        }, HTTPStatus.CONFLICT);
        log.error(error);
        return next(error);
      } else if (typeof err.statusCode !== 'undefined') {
        log.error(err);
        return next(err);
      } else {
        log.error(err);
        return next(err);
      }
    });
};

function deleteCustomModelInternal (tenantId, customModelId, credentials) {
  log.info({
    custom_model_id : customModelId,
    tenant_id : tenantId
  }, 'Received request to delete model ');
  return customModels.getById(tenantId, customModelId)
    .then(function (customModel) {
      customModel.marked_for_deletion = true;
      return customModels.update(customModel)
    })
    .then(function (customModel) {
      return promise.all(
        [batchFile.deleteBatch(tenantId, customModel.file_batch_id),
          lt.deleteModel(credentials, customModel.trained_model_id)
        ]).return(customModel);
    })
    .then(function (customModel) {
      return customModels.deleteModel(customModel._id, customModel._rev);
    })
    .catch(function (err) {
      log.error('Error', err);
      throw (err);
    });
}
module.exports.deleteCustomModelInternal = deleteCustomModelInternal;

exports.deleteCustomModel = function deleteCustomModel (req, res, next) {
  var tenantId = req.params.tenantId;
  var credentials = getCredentialsFromSession(req);
  deleteCustomModelInternal(tenantId, req.params.customModelId, credentials)
    .then(function (customModel) {
      log.info('Deleted model ', customModel);
      return res.sendStatus(HTTPStatus.NO_CONTENT);
    })
    .catch(function (err) {
      return next(err);
    });
};


exports.trainCustomModel = function trainCustomModel (req, res, next) {
  var tenantId = req.params.tenantId;
  var credentials = getCredentialsFromSession(req);
  log.info('Received request to train model ', req.params.customModelId);
  customModels.getById(tenantId, req.params.customModelId)
    .then(getTrainingFilesForModel)
    .spread(trainModel.bind(this, credentials))
    .then(customModels.update)
    .then(prepareCustomModelForResponse)
    .then(function (updatedModel) {
      log.info('result ', updatedModel);
      return res.status(HTTPStatus.OK).send(updatedModel);
    })
    .catch(function (err) {
      log.error('Error', err);
      return next(err);
    });
};

exports.cloneCustomModel = function cloneCustomModel (req, res, next) {
  var tenantId = req.params.tenantId;
  log.info('Received request to clone a model ', req.params.customModelId, ' using options ', req.body);
  //Push tenantid into custom model
  req.body.tenant_id = tenantId;
  var origStatus;

  var origBatch = '';
  customModels.getById(tenantId, req.params.customModelId)
    .then(function (origModel) {
      origStatus = origModel.status;
      origBatch = origModel.file_batch_id;
      var customModel = cloneCustomModelObject(origModel, req.body);
      return customModels.create(customModel)
    })
    .then(function (customModel) {
      customModel.file_batch_id = customModel._id + 'BatchId';
      var cloneBatch = {
        batch_id : customModel.file_batch_id
      };
      return promise.method(batchFile.cloneBatch)(tenantId, origBatch, cloneBatch)
        .then(function (cloned_batch) {
          if (origStatus === statuses.CREATED) {
            customModel.status = statuses.CREATED;
          } else {
            customModel.status = statuses.FILESLOADED;
          }
          return customModels.update(customModel);
        })
    })
    .then(prepareCustomModelForResponse)
    .then(function (newModel) {
      log.info('result ', newModel);
      return res.status(HTTPStatus.CREATED).send(newModel);
    })
    .catch(function (err) {
      return next(err);
    });

};

/**
 Receives a request to establish the status of a Custom Model.
 If the custom Model is currently training this request is passed on to the Language Translator Service Instance.
 The custom Model status may be updated based on response from Language Translator Service
 @param {Object} req - The HTTP request
 @param {Object} res - The HTTP response
 @param {function} next - The next function to handle the request
 @returns {Object} - res Object with body set to a statu object containing properties for statpromise of the modelId assigned by service instance to this new customized model.
 @throws {LTError} - This exception will get passed to the next function
 */
exports.getCustomModelStatus = function getCustomModelStatus (req, res, next) {
  var logObject = {};
  var tenantId = req.params.tenantId;
  var credentials = getCredentialsFromSession(req);
  logObject.tenantId = tenantId;
  logObject.customModelId = req.params.customModelId;
  log.info(logObject, 'Received request to get status for model');
  customModels.getById(tenantId, req.params.customModelId)
    .then(updateLatestStatus.bind(this, credentials))
    .then(prepareStatusForResponse)
    .then(function (status) {
      log.info('status ', status);
      return res.status(HTTPStatus.OK).send(status);
    })
    .catch(function (err) {
      logObject.error = err;
      log.error(logObject, 'Error');
      return next(err);
    });
};

/**
 Receives a request for the Training Log for a Custom Model.
 @param {Object} req - The HTTP request
 @param {Object} req.params - The parameters lifted from the request
 @param {Object} req.params.tenantId - The tenancy identity the user wishes to use
 @param {Object} req.params.customModelId - The identity of the custom Model to retrieve the training logs for
 @param {Object} res - The HTTP response
 @param {function} next - The next function to handle the request
 @returns {Object} - res Object with status and body set
 @throws {Error} - A Custom Error
 @throws {Error.errorOrigin} - A Custom Error
 */
exports.getCustomModelTrainingLog = function getCustomModelTrainingLog (req, res, next) {
  var logObject = {};
  var tenantId = req.params.tenantId;
  var credentials = getCredentialsFromSession(req);
  logObject.tenantId = tenantId;
  logObject.customModelId = req.params.customModelId;
  log.info(logObject, 'Received request to get logs for model');
  customModels.getById(tenantId, req.params.customModelId)
    .then(function (customModel) {
      logObject.trainedModelId = customModel.trained_model_id;
      if (customModel.trained_model_id !== constants.UNTRAINED_MODELID) {
        return lt.getTrainingLog(credentials, customModel.trained_model_id);
      } else {
        log.info(logObject,
          'The custom model has not been trained, cannot retrieve the training log');
        var myerr = new Error(HTTPStatus.NOT_FOUND);
        myerr.statusCode = HTTPStatus.NOT_FOUND;
        throw myerr;
      }
    })
    .then(function (trainingLog) {
      logObject.trainingLog = trainingLog;
      log.debug(logObject, 'Successfully retrieved logs');
      return res.status(HTTPStatus.OK).send(trainingLog);
    })
    .catch(function (err) {
      logObject.error = err;
      log.error(logObject, 'Error');
      return next(err);
    });
};

exports.translate = function translate (req, res, next) {
  var tenantId = req.params.tenantId;
  var credentials = getCredentialsFromSession(req);
  log.info('Received translation request using model ', req.params.customModelId);
  var textToTranslate = req.body.text;
  customModels.getById(tenantId, req.params.customModelId)
    .then(function (custom_model) {
      log.info(custom_model);
      if (custom_model.trained_model_id === constants.UNTRAINED_MODELID) {
        log.info({
          model_id : custom_model.base_model_id
        }, 'Preparing to translate using a base model');
        return lt.translate(credentials, custom_model.base_model_id, textToTranslate);
      } else {
        log.info({
          model_id : custom_model.trained_model_id
        }, 'Preparing to translate using a trained model');
        return lt.translate(credentials, custom_model.trained_model_id, textToTranslate);
      }
    })
    .then(function (resultOfTranslation) {
      log.info('result of Translation ', resultOfTranslation);
      return res.status(HTTPStatus.OK).send(resultOfTranslation);
    })
    .catch(function (err) {
      log.error('Error', err);
      return next(err);
    });
};

exports.updateCustomModel = function updateCustomModel (req, res, next) {
  var tenantId = req.params.tenantId;

  log.info('Updating model ', req.params.customModelId, ' with ', req.body);
  customModels.getById(tenantId, req.params.customModelId)
    .then(function (customModel) {
      var updatedModel = customModel;
      if (typeof req.body.name !== 'undefined') updatedModel.name = req.body.name;
      if (typeof req.body.description !== 'undefined') updatedModel.description = req.body.description;
      if (typeof req.body.status !== 'undefined') updatedModel.status = req.body.status;
      if (typeof req.body.project !== 'undefined') updatedModel.metadata._project = req.body.project;
      if (typeof req.body.status_date !== 'undefined') updatedModel.status_date = req.body.status_date;
      log.info('updating to object ', updatedModel);
      return updatedModel;
    })
    .then(customModels.update)
    .then(prepareCustomModelForResponse)
    .then(function (updatedModel) {
      log.info('Updated Model ', updatedModel);
      return res.status(HTTPStatus.CREATED).send(updatedModel);
    })
    .catch(function (err) {
      log.error('Error', err);
      return next(err);
    });
};

var deleteIfTrainedModelExists = function (credentials, trainedModelId) {
  if (trainedModelId !== constants.UNTRAINED_MODELID) {
    return lt.deleteModel(credentials, trainedModelId)
  } else return;
};

exports.resetTraining = function resetTraining (req, res, next) {
  var tenantId = req.params.tenantId;
  var credentials = getCredentialsFromSession(req);
  var trainedModelId;
  log.info({
    tenantId : tenantId,
    customModelId : req.params.customModelId
  }, 'Received request to resetTraining ');
  customModels.getById(tenantId, req.params.customModelId)
    .then(function (customModel) {
      trainedModelId = customModel.trained_model_id;
      if (customModel.status === statuses.FILESLOADED || customModel.status === statuses.CREATED) {
        var err = new Error('No Trained Model to reset');
        err.statusCode = HTTPStatus.BAD_REQUEST;
        throw err;
      }
      //Reset Model info
      customModel.trained_model_id = constants.UNTRAINED_MODELID;
      customModel.status = statuses.FILESLOADED;
      customModel.status_date = Date.now();
      delete customModel.status_detail;
      return customModel;
    })
    .then(function (customModel) {
      return promise.all(
        [
          customModels.update(customModel),
          deleteIfTrainedModelExists(credentials, trainedModelId)
        ])
    })
    .then(function () {
      log.info(' model reset ');
      return res.sendStatus(HTTPStatus.NO_CONTENT);
    })
    .catch(function (err) {
      log.error('Error', err);
      return next(err);
    });
};

if (process.env.EXPORT_ALL_FOR_TESTING) {
  module.exports.updateLatestStatus = updateLatestStatus;
  module.exports.parseTrainingLogForErrorReason = parseTrainingLogForErrorReason;
  module.exports.transformRequestModel = transformRequestModel;
  module.exports.prepareCustomModelForResponse = prepareCustomModelForResponse;
  module.exports.prepareStatusForResponse = prepareStatusForResponse;
}
