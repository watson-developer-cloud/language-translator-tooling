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
var util = require('util');
var log = require('../../config/log');
var batches = require('../batches/batches');
var customModels = require('../../components/modelStore');
var lt = require('../../components/lt');
var fileStore = require('../../components/fileStore');
var promise = require('bluebird');
var HTTPStatus = require('http-status');
var constants = require('../models/constants');
var batchFile = require('../models/batchFileInternal');
var modelsController = require('../models/models.controller');
var batchStore = require('../../components/batchStore');
var common = require('../../components/common');
var s2s_getCredentialsFromSession = require('../../components/s2s').getCredentialsFromSession;


//Get credentials without exposing callback;
var getCredentialsFromSession = function(req) {
  return s2s_getCredentialsFromSession(req, function(err, credentials) {
    return credentials;
  })
};

//This function takes a custom model and prepares it for response to another service.
//It will remove Properties only intended for use within this service.
var prepareCustomModelForResponse = function (customModel) {
  customModel.custom_model_id = customModel._id;
  if (typeof customModel.metadata !== 'undefined') {
    customModel.project = customModel.metadata._project;
  }
  return customModel;
};

module.exports.getReconcilliationStatus = function getReconcilliationStatus(credentials, tenantId) {
  var reconciled = [];
  var unreconciled = {};
  var unreconciledModels = [];
  var response;
  var queryOptions = {
    default: 'false'
  };

  return promise.all(
    [customModels.getAll({
      tenant_id: tenantId
    }),
      promise.promisify(batches.getAllBatches)(tenantId),
      lt.getModels(credentials, queryOptions),
      promise.promisify(fileStore.examineContainer)(tenantId)
    ])
    .then(function (serviceStatuses) {
      //Prepare batches, batch_id should be unique
      var batches = {};
      var usedBatches = {};
      serviceStatuses[1].forEach(function (batch) {
        batches[batch.batch_id] = batch.batch;
      });
      //Prepare files, file name for object storage should be unique
      var files = {};
      var usedFiles = {};
      serviceStatuses[3].forEach(function (file) {
        files[file.name] = file;
      });
      //Prepare trained models, moel_id for trainedmodels should be unique
      var trainedModels = {};
      var usedTrainedModels = {};
      serviceStatuses[2].forEach(function (trainedModel) {
        //Remove trained models whose base_model_id isn't valid
        if (trainedModel.base_model_id !== '') {
          trainedModels[trainedModel.model_id] = trainedModel;
        }
      });

      var models = serviceStatuses[0];
      models.forEach(function (model) {
        var validModel = true;
        prepareCustomModelForResponse(model);
        //Add batch details
        //does the batch exist?
        model.file_batch_details = batches[model.file_batch_id];

        var tempModel = {};
        tempModel.file_batch_details = usedBatches[model.file_batch_id];

        if ((typeof model.file_batch_details === 'undefined') && (typeof tempModel.file_batch_details === 'undefined')) {
          validModel = false;
          model.reconcileProblem = 'MISSING BATCH';
        } else {
          //check this isn't used by a model with a closer association (i.e. related custom model id and batch id)
          var modelIsProperBatchOwner = false;
          if (model.file_batch_id === (model.custom_model_id + 'BatchId')) {
            //this is the true owner of the batch
            modelIsProperBatchOwner = true;
          } else {

            //has the batch already been used?
            var modelAlreadyUsed = false;
            if (typeof tempModel.file_batch_details !== 'undefined') {
              modelAlreadyUsed = true;
            }

            var betterCustomModelFound = false;
            if (!modelAlreadyUsed) {
              //is there a custom model in existence with this id and linked to this batch?
              for (var i in models) {
                if (((models[i].custom_model_id + 'BatchId') === model.file_batch_id) && (models[i].file_batch_id === model.file_batch_id)) {
                  // a better custom model for this batch exists
                  betterCustomModelFound = true;
                  break;
                }
              }
            }

            //the batch tied to this model is better used elsewhere
            if (modelAlreadyUsed || betterCustomModelFound) {
              validModel = false;
              model.reconcileProblem = 'BATCH USED ELSEWHERE';
            } else {
              modelIsProperBatchOwner = true;
            }
          }

          if (modelIsProperBatchOwner) {
            usedBatches[model.file_batch_id] = batches[model.file_batch_id];
            delete batches[model.file_batch_id];

            if (model.file_batch_details.length > 0) {
              model.filesMissing = [];
              model.file_batch_details.forEach(function (file) {
                file.file_details = files[file.uuid];
                if (typeof file.file_details === 'undefined') {
                  var tempFile = {};
                  tempFile.file_details = usedFiles[file.uuid];
                  if (typeof tempFile.file_details === 'undefined') {
                    validModel = false;
                    model.reconcileProblem = 'MISSING FILE';
                    model.filesMissing.push(file.uuid);
                  }
                } else {
                  usedFiles[file.uuid] = files[file.uuid];
                  delete files[file.uuid];
                }
              });
              if (model.filesMissing.length === 0) {
                delete model.filesMissing
              }
            }
          }
        }

        //Find trained model details
        if (model.trained_model_id !== constants.UNTRAINED_MODELID) {
          model.trained_model_details = trainedModels[model.trained_model_id];
          if (typeof model.trained_model_details === 'undefined') {
            validModel = false;
            tempModel = {};
            tempModel.trained_model_details = usedTrainedModels[model.trained_model_id];
            if (typeof tempModel.trained_model_details === 'undefined') {
              model.reconcileProblem = 'MISSING TRAINED MODEL';
            } else {
              model.reconcileProblem = 'TRAINED MODEL USED ELSEWHERE';
            }
          } else {
            usedTrainedModels[model.trained_model_id] = trainedModels[model.trained_model_id];
            delete trainedModels[model.trained_model_id];
          }
        }

//find models with incorrect status
        if ( (validModel) &&
          (model.status === constants.statuses.FILESLOADED) &&
          ((model.file_batch_details === false) ||
          ((model.file_batch_details !== false) &&
          (model.file_batch_details.length === 0)))) {
          model.reconcileProblem = 'INCORRECT STATUS';
          validModel = false;
        }

//store model
        if (validModel) {
          reconciled.push(model);
        } else {
          unreconciledModels.push(model);
        }

      });
      //Add any unreconciled Models
      if (unreconciledModels.length > 0) {
        unreconciled.customModels = unreconciledModels;
      }

      //Add unprocessed batches to unreconciled list
      if (Object.keys(batches).length > 0) {
        unreconciled.batches = {};
        for (var batchKey in batches) {
          unreconciled.batches[batchKey] = batches[batchKey];
        }
      }
      //Add unprocessed files to unreconciled list
      if (Object.keys(files).length > 0) {
        unreconciled.files = {};
        for (var fileKey in files) {
          unreconciled.files[fileKey] = files[fileKey];
        }
      }
      //Add unprocessed trainedModels to unreconciled list
      if (Object.keys(trainedModels).length > 0) {
        unreconciled.trainedModels = {};
        for (var trainedModelKey in trainedModels) {
          unreconciled.trainedModels[trainedModelKey] = trainedModels[trainedModelKey];
        }
      }
      return models;
    }).then(function (models) {
      log.debug({
        models: models
      });
      response = {
        reconciled: reconciled,
        unreconciled: unreconciled
      };
      return response;
    })
    .catch(function (err) {
      log.error('Error', err);
    });
}

exports.status = function status(req, res, next) {
  var tenantId = req.params.tenantId;
  log.info({
    tenantid: tenantId
  }, 'Received request to show reconile status for a tenant');
  var credentials = getCredentialsFromSession(req);
  var reconcilliationStatusPromise = exports.getReconcilliationStatus(credentials, tenantId);
  reconcilliationStatusPromise
    .then(function (result) {
      res.status(HTTPStatus.OK).send(result);
    })
    .catch(function (err) {
      log.error('Error', err);
      return next(err);
    });
};

function deleteFiles(tenant_id, arrayofOrphanFiles) {
  var arrayofPromises = [];
  arrayofOrphanFiles.forEach(function (fileToDelete) {
    arrayofPromises.push(promise.promisify(batches.deleteFileByUUID)(tenant_id, fileToDelete, false));
  });
  return promise.settle(arrayofPromises);
}

function deleteBatches(tenant_id, arrayofOrphanBatches) {
  var arrayofPromises = [];
  arrayofOrphanBatches.forEach(function (batchToDelete) {
    arrayofPromises.push(promise.promisify(batches.deleteBatch)(tenant_id, batchToDelete));
  });
  return promise.settle(arrayofPromises);
}

function repairIncompleteBatchesInCustomModels(tenant_id, customModelsWithBatchesUsingMissingFiles) {

  var arrayofPromises = [];
  customModelsWithBatchesUsingMissingFiles.forEach(function (customModel) {
    var batchIDToRepair = customModel.file_batch_id;

    customModel.filesMissing.forEach(function (file) {
      //remove missing file from batch
      var fileNameToRemove = customModel.file_batch_details.filter(function (batch) {
        return batch.uuid === file;
      })[0].file_name;
      arrayofPromises.push(promise.promisify(batches.deleteFile)(tenant_id, batchIDToRepair, fileNameToRemove));
    });
  });
  return promise.settle(arrayofPromises);
}

function repairMissingBatchesInCustomModels(tenant_id, customModelArray) {
  var arrayofPromises = [];
  customModelArray.forEach(function (customModel) {

    //add a batch if no batch exists
    var newBatch = {
      batch_id: customModel.file_batch_id
    };

    var newBatchPromise = promise.promisify(batchStore.addBatch)(tenant_id, newBatch, customModel.custom_model_id + 'BatchId');
    var getModelByIdPromise = customModels.getById(tenant_id, customModel.custom_model_id);
    var updateModelPromise = promise.join(newBatchPromise, getModelByIdPromise, function (newBatch, rawCustomModel) {
      rawCustomModel.file_batch_id = newBatch.id;
      return customModels.update(rawCustomModel);
    });

    arrayofPromises.push(updateModelPromise);
  });
  return promise.settle(arrayofPromises);
}

function repairDuplicateBatchesInCustomModels(tenant_id, customModelArray) {
  var arrayofPromises = [];
  customModelArray.forEach(function (customModel) {

    //if the batchID is already based in the custome model id, skip it
    var originalBatchID = customModel.file_batch_id;
    customModel.file_batch_id = customModel.custom_model_id + 'BatchId';

    var newBatchPromise = promise.promisify(batches.cloneBatch)(tenant_id, originalBatchID, customModel.file_batch_id);
    var getModelByIdPromise = customModels.getById(tenant_id, customModel.custom_model_id);
    var updateModelPromise = promise.join(newBatchPromise, getModelByIdPromise, function (newBatch, rawCustomModel) {
      rawCustomModel.file_batch_id = newBatch.id;
      return customModels.update(rawCustomModel);
    });

    arrayofPromises.push(updateModelPromise);
  });
  return promise.settle(arrayofPromises);
}

function removeMissingTrainedModelsFromCustomModels(tenant_id, customModelArray) {
  var arrayofPromises = [];
  if (customModelArray) {
    customModelArray.forEach(function (customModel) {

      var getByIdPromise = customModels.getById(tenant_id, customModel.custom_model_id)
        .then(function (rawCustomModel) {
          rawCustomModel.trained_model_id = constants.UNTRAINED_MODELID;
          if ((customModel.file_batch_details) && (customModel.file_batch_details.length > 0)) {
            rawCustomModel.status = constants.statuses.FILESLOADED;
          } else {
            rawCustomModel.status = constants.statuses.CREATED;
          }
          //save the updated custom model
          return customModels.update(rawCustomModel);
        });

      arrayofPromises.push(getByIdPromise);
    });
  }
  return promise.settle(arrayofPromises);
}

function createCustomModelsForOrphanTrainedModels(tenant_id, orphanTrainedModels) {
  var arrayofPromises = [];
  if (orphanTrainedModels) {
    var orphanTrainedModelKeys = Object.keys(orphanTrainedModels);

    var counter = 0;
    orphanTrainedModelKeys.forEach(function (trainedModelKey) {
      counter++;
      //create a Custom Model
      var trainedModel = orphanTrainedModels[trainedModelKey];
      var newModel = {
        //make unique
        'name' : 'Orphan' + Date.now() + 'n' + counter,
        'description' : 'Created from the orphan Trained Model called: ' + trainedModel.name,
        'domain' : trainedModel.domain,
        'source' : trainedModel.source,
        'target' : trainedModel.target,
        'base_model_id' : trainedModel.base_model_id,
        'status' : constants.statuses.TRAINED,
        'editname' : true,
        'tenant_id' : tenant_id,
        'metadata' : {
          '_project' : 'Orphaned Training Models: ' + trainedModel.source + '-' + trainedModel.target
        },
        'type' : 'model',
        'trained_model_id' : trainedModel.model_id,
        'status_date' : Date.now()
      };
      arrayofPromises.push(modelsController.createCustomModelInternal(tenant_id, newModel));
    });
  }
  return promise.settle(arrayofPromises);
}

function fixCustomModelStatus(tenant_id, customModelArray) {
  var arrayofPromises = [];
  if (customModelArray) {
    customModelArray.forEach(function (customModel) {
      var newStatus = null;
      //change status to Created if there are no files in batch
      if ((customModel.status === constants.statuses.FILESLOADED) &&
        ((customModel.file_batch_details === false) ||
        ((customModel.file_batch_details !== false) &&
        (customModel.file_batch_details.length === 0)))) {
        newStatus = constants.statuses.CREATED;
      }

      if (newStatus) {
        //get raw custom model
        var getByIdPromise = customModels.getById(tenant_id, customModel.custom_model_id)
          .then(function (rawCustomModel) {
            rawCustomModel.status = newStatus;
            //save the updated custom model
            return customModels.update(rawCustomModel);
          });
        arrayofPromises.push(getByIdPromise);
      }
    });
  }
  return promise.settle(arrayofPromises);
}

exports.reconcile = function reconcile(req, res, next) {
  var tenantId = req.params.tenantId;
  log.info({
    tenantid: tenantId
  }, 'Received request to reconile status for a tenant');
  var credentials = getCredentialsFromSession(req);

  var reconcilliationProgress = {};
  var reconcilliationStatus = null;

  //get the reconcilliation state

  exports.getReconcilliationStatus(credentials, tenantId)
    .then(function (reconcilliationStatusResult) {
      reconcilliationStatus = reconcilliationStatusResult;
      reconcilliationProgress.preState = JSON.parse(JSON.stringify(reconcilliationStatusResult));

      //delete orphan files
      var orphanFiles = [];
      if (typeof reconcilliationStatus.unreconciled.files !== 'undefined') {
        orphanFiles = Object.keys(reconcilliationStatus.unreconciled.files);
      }
      return deleteFiles(tenantId, orphanFiles);

    }).then(function (deleteOrphanFileResults) {
      // reconcilliationProgress.deleteOrphanFileResults = deleteOrphanFileResults;

      //delete orphan batches
      var orphanBatches = [];
      if (typeof reconcilliationStatus.unreconciled.batches !== 'undefined') {
        orphanBatches = Object.keys(reconcilliationStatus.unreconciled.batches);
      }
      return deleteBatches(tenantId, orphanBatches);

    }).then(function (deleteOrphanBatchResults) {
      // reconcilliationProgress.deleteOrphanBatchResults = deleteOrphanBatchResults;

      //batches with missing files - no duplicates exist
      //remove reference to file from batch
      //iterate through unreconciled customModels and add any with "reconcileProblem": "MISSING FILE"
      var customModelsWithBatchesUsingMissingFiles = [];
      if (reconcilliationStatus.unreconciled.customModels) {
        reconcilliationStatus.unreconciled.customModels.forEach(function (model) {
          if (typeof model.filesMissing !== 'undefined') {
            if (model.filesMissing.length > 0) {
              customModelsWithBatchesUsingMissingFiles.push(model);
            }
          }
        });
      }
      return repairIncompleteBatchesInCustomModels(tenantId, customModelsWithBatchesUsingMissingFiles);

    }).then(function (repairIncompleteBatchesInCustomModelsResults) {
      // reconcilliationProgress.repairIncompleteBatchesInCustomModelsResults = repairIncompleteBatchesInCustomModelsResults;

      //Models with MISSING BATCH
      //Create a new empty batch
      //iterate through unreconciled customModels and add any with "reconcileProblem": "MISSING BATCH"
      var customModelsWithMissingBatches = [];
      if (reconcilliationStatus.unreconciled.customModels) {
        reconcilliationStatus.unreconciled.customModels.forEach(function (element) {
          if (element.reconcileProblem === 'MISSING BATCH') {
            customModelsWithMissingBatches.push(element);
          }
        });
      }
      return repairMissingBatchesInCustomModels(tenantId, customModelsWithMissingBatches);

    }).then(function (repairMissingBatchesInCustomModelsResults) {
      // reconcilliationProgress.repairMissingBatchesInCustomModelsResults = repairMissingBatchesInCustomModelsResults;

      //Models with Duplicate BATCH
      //Clone the batch
      //iterate through unreconciled customModels and add any with "reconcileProblem": "BATCH USED ELSEWHERE"
      var customModelsWithDuplicateBatches = [];
      if (reconcilliationStatus.unreconciled.customModels) {
        reconcilliationStatus.unreconciled.customModels.forEach(function (element) {
          if (element.reconcileProblem === 'BATCH USED ELSEWHERE') {
            customModelsWithDuplicateBatches.push(element);
          }
        });
      }
      return repairDuplicateBatchesInCustomModels(tenantId, customModelsWithDuplicateBatches);

    }).then(function (repairDuplicateBatchesInCustomModelsResults) {
      // reconcilliationProgress.repairDuplicateBatchesInCustomModelsResults = repairDuplicateBatchesInCustomModelsResults;

      //Models with a training model assigned but triaing model does not exist
      //iterate through unreconciled customModels and add any with "reconcileProblem": "MISSING TRAINED MODEL"
      var customModelsWithMissingTrainedModels = [];
      if (reconcilliationStatus.unreconciled.customModels) {
        reconcilliationStatus.unreconciled.customModels.forEach(function (element) {
          if (element.reconcileProblem === 'MISSING TRAINED MODEL') {
            customModelsWithMissingTrainedModels.push(element);
          }
        });
      }
      return removeMissingTrainedModelsFromCustomModels(tenantId, customModelsWithMissingTrainedModels);

    }).then(function (removeMissingTrainedModelsFromCustomModelsResults) {
      // reconcilliationProgress.removeMissingTrainedModelsFromCustomModelsrmove = removeMissingTrainedModelsFromCustomModelsResults;

      //create custom models for orphan training models
      return createCustomModelsForOrphanTrainedModels(tenantId, reconcilliationStatus.unreconciled.trainedModels);

    }).then(function (createCustomModelsForOrphanTrainedModelsResults) {
      // reconcilliationProgress.createCustomModelsForOrphanTrainedModelsResults = createCustomModelsForOrphanTrainedModelsResults;

      //get the interim reconcilliation state
      return exports.getReconcilliationStatus(credentials, tenantId);
    }).then(function (interimReconcilliationStatusResult) {

      //correct the status on custom models.
      var customModelsWithIncorrectStatus = [];
      if (interimReconcilliationStatusResult.unreconciled.customModels) {
        interimReconcilliationStatusResult.unreconciled.customModels.forEach(function (model) {
          if (model.reconcileProblem === 'INCORRECT STATUS') {
            customModelsWithIncorrectStatus.push(model);
          }
        });
      }
      return fixCustomModelStatus(tenantId, customModelsWithIncorrectStatus);

    }).then(function (fixCustomModelStatusResults) {
      //.fixCustomModelStatusResults = fixCustomModelStatusResults;

      //recheck the reconcilliation state and return
      return exports.getReconcilliationStatus(credentials, tenantId);
    }).then(function (postReconcilliationStatusResult) {
      reconcilliationProgress.postState = postReconcilliationStatusResult;

      res.status(HTTPStatus.OK).send(reconcilliationProgress);

    }).catch(function (err) {
      log.error('Error', err);
      return next(err);
    });
};


module.exports.getCompleteModel = function getCompleteModel (credentials, tenantId, customModelID) {
  var completeModel =
  {
    customModelDetails : null,
    fileBatchDetails : null,
    batchFiles : null,
    trainedModelDetails : null,
    duplicateModels : null
  };
  return customModels.getById(tenantId, customModelID)
    .then(function (rawCustomModel) {
      completeModel.customModelDetails = rawCustomModel;

      if (completeModel.customModelDetails !== null) {
        return promise.promisify(batchStore.getBatch)(tenantId, customModelID + 'BatchId');
      } else {
        return completeModel;
      }

      //identify/get the batch
    })
      .catch(common.BatchNotFoundError, function (e) {
      //OK not to find a batch as it may not exist. Other errors are real errors and should be handled as such
        return null;
    })
    .then(function (rawFileBatch) {
      if (rawFileBatch) {
        completeModel.fileBatchDetails = rawFileBatch;
      }

      //get files from the file store
      if (completeModel.fileBatchDetails !== null) {
        return promise.promisify(fileStore.examineContainer)(tenantId);
      } else {
        return null;
      }
    })
    .then(function (batchFiles) {
      completeModel.batchFiles = batchFiles;

      //get the trained model
      var queryOptions = {
        default : 'false'
      };
      return lt.getModels(credentials, queryOptions);
    })
    .then(function (trainedModels) {
      if (trainedModels) {
        trainedModels.forEach(function (aTrainedModel) {
          if (aTrainedModel.name === completeModel.customModelDetails.name) {
            completeModel.trainedModelDetails = aTrainedModel;
          }
        })
      }
      //find any duplicates by name
      return customModels.getAll({
        tenant_id : completeModel.customModelDetails.tenant_id,
        name : completeModel.customModelDetails.name
      });
    })
    .then(function (duplicateModels) {
      completeModel.duplicateModels = duplicateModels;
      return completeModel;
    })
    .catch(function (err) {
      throw err;
    });
}

function doReconcileCustomModel (credentials, tenantId, customModelID) {
  var completeModel = null;

  //get everything for the custom model(s)
  return exports.getCompleteModel(credentials, tenantId, customModelID)
    .then(function (aCompleteModel) {
      completeModel = aCompleteModel;
      //return completeModel;


      //now enough information to make decisions

      //delete if marked for deletion
      if (completeModel.customModelDetails.marked_for_deletion) {
        //this deletion will fail if called internally without credentials
        return modelsController.deleteCustomModelInternal(tenantId, completeModel.customModelDetails._id, credentials);


        //test for duplicates
      } else if (completeModel.duplicateModels.length > 1) {
        //determine duplicate to remove
        //models with creation_date are newer than models without
        //determine the oldest and delete the other
        var youngestModel = null;
        completeModel.duplicateModels.forEach(function (duplicateModel) {
          if (duplicateModel.creation_date) {
            if (youngestModel === null) {
              youngestModel = duplicateModel;
            } else if (duplicateModel.creation_date > youngestModel.creation_date) {
              youngestModel = duplicateModel;
            }
          }
        });

        if (youngestModel) {
          //this deletion will fail if called internally without credentials
          return modelsController.deleteCustomModelInternal(tenantId, youngestModel._id, credentials)
        } else {
          return completeModel;
        }


        //test for missing file batch
      } else if (completeModel.fileBatchDetails === null) {
        if (completeModel.customModelDetails.cloned_from) {
          //if a cloning problem and the batch hasn't been created delete the custom model.
          //this deletion will fail if called internally without credentials
          return modelsController.deleteCustomModelInternal(tenantId, completeModel.customModelDetails._id, credentials)
        } else {
          //create the batch as required and join
          completeModel.customModelDetails.file_batch_id = completeModel.customModelDetails._id + 'BatchId';
          var newBatch = {
            batch_id : completeModel.customModelDetails.file_batch_id
          };
          return promise.promisify(batchStore.addBatch)(tenantId, newBatch, completeModel.customModelDetails.file_batch_id)
            .then(function (createdBatch) {
              completeModel.customModelDetails.file_batch_id = createdBatch.id;
              completeModel.fileBatchDetails=createdBatch;
              return customModels.update(completeModel.customModelDetails);
            })
            .then(function (customModel) {
              completeModel.customModelDetails = customModel;
              return completeModel;
            })
            .catch(function (err) {
              throw err;
            })
        }


        //test for disconnected file batch
      } else if ((completeModel.fileBatchDetails !== null) && ((!completeModel.customModelDetails.file_batch_id) || (completeModel.customModelDetails.file_batch_id === null))) {
        //join the batch to the custom model
        completeModel.customModelDetails.file_batch_id = completeModel.fileBatchDetails.batch_id;
        return customModels.update(completeModel.customModelDetails)
          .then(function (customModel) {
            completeModel.customModelDetails = customModel;
            return completeModel;
          })
          .catch(function (err) {
            throw err;
          });


        //test for disconnected training model
      } else if ((completeModel.trainedModelDetails) && (completeModel.customModelDetails.trained_model_id !== completeModel.trainedModelDetails.model_id)) {
        //join the training model to the custom model
        completeModel.customModelDetails.trained_model_id = completeModel.trainedModelDetails.model_id;
        completeModel.customModelDetails.status = constants.statuses.TRAINED;
        return customModels.update(completeModel.customModelDetails)
          .then(function (customModel) {
            completeModel.customModelDetails = customModel;
            return completeModel;
          })
          .catch(function (err) {
            throw err;
          });


        //test for a missing training model, possibly the result of a reset training model call that removed the TM but failed to update the database
        //remembering that in reconcillation the TM name is used as the key - they should be unique within the tenancy
      } else if ((completeModel.trainedModelDetails===null) && (completeModel.customModelDetails.trained_model_id !== constants.UNTRAINED_MODELID)) {
        //remove the training model from the custom model
        completeModel.customModelDetails.trained_model_id = constants.UNTRAINED_MODELID;
        if ((completeModel.file_batch_details) && (completeModel.file_batch_details.length > 0)) {
          completeModel.customModelDetails.status = constants.statuses.FILESLOADED;
        } else {
          completeModel.customModelDetails.status = constants.statuses.CREATED;
        }
        return customModels.update(completeModel.customModelDetails)
          .then(function (customModel) {
            completeModel.customModelDetails = customModel;
            return completeModel;
          })
          .catch(function (err) {
            throw err;
          });


        //test for batch containing non-existent file
      } else if ((completeModel.batchFiles !== null) && (completeModel.batchFiles.length > 0) && (completeModel.fileBatchDetails !== null) && (completeModel.fileBatchDetails.batch !== null) && (completeModel.fileBatchDetails.batch.length > 0)) {
        //check the files in the batch exist in the file store
        var arrayofPromises = [];
        completeModel.fileBatchDetails.batch.forEach(function (fileFromBatch) {
          if (completeModel.batchFiles.map(function (e) {
              return e.name
            }).indexOf(fileFromBatch.uuid) < 0) {
            arrayofPromises.push(promise.promisify(batches.deleteFile)(tenantId, completeModel.fileBatchDetails.batch_id, fileFromBatch.file_name));
          }
        });
        if (arrayofPromises.length > 0) {
          return promise.settle(arrayofPromises)
            .then(function () {
              return promise.promisify(batchStore.getBatch)(tenantId, customModelID + 'BatchId');
            })
            .then(function (rawFileBatch) {
              completeModel.fileBatchDetails = rawFileBatch;

              if ((completeModel.customModelDetails.status = constants.statuses.FILESLOADED) && (completeModel.fileBatchDetails.batch.length === 0)) {
                completeModel.customModelDetails.status = constants.statuses.CREATED;
                return customModels.update(completeModel.customModelDetails)
                  .then(function (customModel) {
                    completeModel.customModelDetails = customModel;
                    return completeModel;
                  })
                  .catch(function (err) {
                    throw err;
                  })
              } else {
                return completeModel;
              }
            })
            .catch(function (err) {
              throw err;
            })
        } else {
          return completeModel;
        }
      } else {
        return completeModel;
      }
    })
    .catch(function (err) {
      throw err;
    });
}

exports.reconcileCustomModel = function reconcileCustomModel (req, res, next) {
  var tenantId = req.params.tenantId;
  log.info({
    tenantid : tenantId,
    customModelID : req.params.customModelID
  }, 'Received request to reconile a model for a tenant');
  var credentials = getCredentialsFromSession(req);

  doReconcileCustomModel(credentials, tenantId, req.params.customModelID)
    .then(function (aResult) {
      res.status(HTTPStatus.OK).send(aResult);
    })
    .catch(function (err) {
      log.info({
        tenantid : tenantId,
        customModelID : req.params.customModelID,
        err : err
      }, 'Error reconciling a model for a tenant');
      return next(err);
    });
};

if (process.env.EXPORT_ALL_FOR_TESTING) {
  module.exports.deleteFiles = deleteFiles;
  module.exports.deleteBatches = deleteBatches;
  module.exports.repairIncompleteBatchesInCustomModels = repairIncompleteBatchesInCustomModels;
  module.exports.repairMissingBatchesInCustomModels = repairMissingBatchesInCustomModels;
  module.exports.repairDuplicateBatchesInCustomModels = repairDuplicateBatchesInCustomModels;
  module.exports.removeMissingTrainedModelsFromCustomModels = removeMissingTrainedModelsFromCustomModels;
  module.exports.createCustomModelsForOrphanTrainedModels = createCustomModelsForOrphanTrainedModels;
  module.exports.fixCustomModelStatus = fixCustomModelStatus;
  module.exports.doReconcileCustomModel = doReconcileCustomModel;
}
