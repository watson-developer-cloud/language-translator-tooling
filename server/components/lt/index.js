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

var promise = require('bluebird');
var request = promise.promisifyAll(require('request'));
var log = require('../../config/log');
var env = require('../../config/environment');
var constants = require('../../api/models/constants.js');
var queryString = require('querystring');
var HTTPStatus = require('http-status');
var MultipartStream = require('./duplicateStreamNameMultipartStream');
var LTServiceError = require('../common').LTServiceError;

var ltErrors = require('../ltErrors');

var url = env.endpoints.language_translator + '/v2';
var index = url.indexOf('://');
var prefix = url.substring(0, index + 3);
var suffix = url.substring(index + 3, url.length);

/**
 We need to throw an error, but what type?
 @param {Object} e - The error object
 @param {Object} errorInserts - The username of the user
 @param {string} originatingFunction - Function raising the error
 @throws {LTError} - A Custom Error
 */
var handleException = function (e, errorInserts, originatingFunction) {
  if (LTServiceError.prototype.isPrototypeOf(e)) {
    //Already handled this error to just rethrow
    throw e;
  }
  if (typeof e.code !== 'undefined') {
    if (e.code === 'ENOTFOUND') {
      throw new LTServiceError(originatingFunction + ' request immediately failed with error -> ' + JSON.stringify(e), ltErrors.hostNotFound, errorInserts, HTTPStatus.INTERNAL_SERVER_ERROR);
    } else if (e.code === 'ECONNRESET') {
      throw new LTServiceError(originatingFunction + ' request immediately failed with error -> ' + JSON.stringify(e), ltErrors.connectionReset, errorInserts, HTTPStatus.INTERNAL_SERVER_ERROR);
    }
  }
  throw new LTServiceError(originatingFunction + ' request immediately failed with error -> ' + JSON.stringify(e), ltErrors.unKnownLTError, errorInserts, HTTPStatus.INTERNAL_SERVER_ERROR);
};

/**
 We need to throw an error, but what type?
 @param {Object} response - The service response
 @param {Object} errorInserts - The username of the user
 @param {string} originatingFunction - Function raising the error
 @throws {LTError} - A Custom Error
 */
var handleProblemResponse = function (response, errorInserts, originatingFunction) {
  //Examine statusCode first
  if (typeof response.statusCode !== 'undefined') {
    //if the response is OK but the plan does not support training
    if (response.statusCode === HTTPStatus.OK && response.headers['x-watson-user-customize-allowed']==='false') {
      throw new LTServiceError(originatingFunction + ' request failed with error -> ' + JSON.stringify(response), ltErrors.wrongLTPlan, errorInserts, HTTPStatus.PAYMENT_REQUIRED);
    }
    if (response.statusCode === 401) {
      throw new LTServiceError(originatingFunction + ' request failed with error -> ' + JSON.stringify(response), ltErrors.connectionUnauthorized, errorInserts, HTTPStatus.UNAUTHORIZED);
    }
    else if (response.statusCode === 404) {
      throw new LTServiceError(originatingFunction + ' request failed with error -> ' + JSON.stringify(response), ltErrors.trainedModelNotFound, errorInserts, HTTPStatus.NOT_FOUND);
    }
  }
  throw new LTServiceError(originatingFunction + ' request failed with error -> ' + JSON.stringify(response), ltErrors.badLTResponse, errorInserts, HTTPStatus.INTERNAL_SERVER_ERROR);
};

/**
 * Parse the response into JSON.
 * @param {Object} response - The response
 * @param {string} body - The body of the response
 * @param {string} generalUrl - The general url of the request
 * @param {string} originatingFunction - Originating function
 * @returns {Object} - JSON object of body
 * @throws {LTError} - A Custom Error
 */
var parseBody = function (response, body, generalUrl, originatingFunction) {
  var bodyObject;
  try {
    bodyObject = JSON.parse(body);
  } catch (e) {
    log.debug({
      body : body
    }, 'Couldn\'t parse the body of the response from the getModels call')
  }
  if (typeof bodyObject !== 'undefined') {
    return bodyObject;
  } else {
    var errorInserts = {
      response : response,
      responseBody : body,
      url : generalUrl
    };
    throw new LTServiceError(originatingFunction + ' request failed with error -> ' + JSON.stringify(response), ltErrors.badLTResponse, errorInserts, HTTPStatus.INTERNAL_SERVER_ERROR);
  }
};

/**
 @typedef {Object] credentialsType
 @property {string} credentialsType.username - The username of the user
 @property {string} credentialsType.password - The password for the user to access the Language Translator Service Instance
 */

/**
 Calls the Language Translator Service instance to list models.
 @param {credentialsType} credentials - The credentials requesting the training
 @param {string} queryOptions - The query parameters to send specifiying the models to list
 @returns {Promise<string|Error>} - A promise of a JSON Array of the models satisfying the queryOptions
 @throws {LTError} - A Custom Error
 */
module.exports.getModels = function getModels (credentials, queryOptions) {
  log.debug({
    username : credentials.username,
    queryOptions : queryOptions
  }, 'Request to list models');
  var urlBase = prefix + credentials.username + ':' + credentials.password + '@' + suffix;
  var generalUrl = url + '/models';
  var options = {
    url : urlBase + '/models'
  };
  if (queryOptions !== null) {
    options.url = options.url + '?' + queryString.stringify(queryOptions);
    generalUrl = url + '/models?' + queryString.stringify(queryOptions);
  }
  return request.getAsync(options).spread(function (response, body) {
    if (response.statusCode === HTTPStatus.OK && response.headers['x-watson-user-customize-allowed']==='true') {
      var bodyObject = parseBody(response, body, generalUrl, 'getModels');
      if (typeof bodyObject.models !== 'undefined') {
        return bodyObject.models;
      }
    }
    var errorInserts = {
      response : response,
      responseBody : body,
      url : generalUrl
    };
    handleProblemResponse(response, errorInserts, 'getModels');
  }).catch(function (e) {
    var errorInserts = {
      response : e,
      url : generalUrl
    };
    handleException(e, errorInserts, 'getModels');
  });
};

/**
 Calls the Language Translator Service instance to delete a model.
 @param {credentialsType} credentials - The credentials requesting the deletion
 @param {string} modelId - The Identity of the Base model for deletion
 @returns {Promise<string|Error>} - A promise of null if successful or if the modelId passed in is the UNTRAINED_MODELID constant.
 @throws {LTError} - A Custom Error
 */
module.exports.deleteModel = function deleteModel (credentials, modelId) {
  log.debug({
    username : credentials.username,
    deletedModelId : modelId
  }, 'Request to delete a model');
  var urlBase = prefix + credentials.username + ':' + credentials.password + '@' + suffix;
  var generalUrl = url + '/models/' + modelId;
  var options = {
    url : urlBase + '/models/' + modelId
  };
  if (modelId !== constants.UNTRAINED_MODELID) {
    return request.delAsync(options).spread(function (response, body) {
      if (response.statusCode === HTTPStatus.OK) {
        var bodyObject = parseBody(response, body, generalUrl, 'deleteModel');
        log.info({deletedModelId : modelId}, 'deleted model ');
        return null;
      }
      var errorInserts = {
        response : response,
        responseBody : body,
        trainedModelId : modelId,
        url : generalUrl
      };
      handleProblemResponse(response, errorInserts, 'deleteModel');
    }).catch(function (e) {
      var errorInserts = {
        response : e,
        trainedModelId : modelId,
        url : generalUrl
      };
      handleException(e, errorInserts, 'deleteModel');
    });
  }
  return null;
};

/**
 @typedef {Object} FileType
 @property {string} [FileType.training_file_option=forced_glossary] - The type of training the file should be used for (forced_glossary, parallel_corpus or monolingual_corpus)
 @property {string} FileType.file_name - The name of the training file
 @property {Object} FileType.stream - A Stream of the file contents
 */

/**
 Calls the Language Translator Service instance to train a new model.
 This is a multipart/form-data post involving the streaming of the file contents to the service instance
 @param {credentialsType} credentials - The credentials requesting the training
 @param {string} baseModelId - The Identity of the Base model for customization
 @param {string} name - The name for the new customized model. (Must conform to service api restrictions for name)
 @param {FileType[]} files - The array of files to be used for training
 @returns {Promise<string|Error>} - A promise of the modelId assigned by service instance to this new customized model.
 @throws {LTError} - A Custom Error
 */
module.exports.trainModel = function trainModel (credentials, baseModelId, name, files) {
  log.debug({
    username : credentials.username,
    baseModelId : baseModelId,
    modelName : name
  }, 'Request to train a model');
  var urlBase = prefix + credentials.username + ':' + credentials.password + '@' + suffix;

  //Establish our multipart stream
  var stream = new MultipartStream({
    boundary : '---######'
  });
  stream.addField('base_model_id', baseModelId);
  stream.addField('name', name);

  //Add each file to the stream
  files.forEach(function (file) {
    if (typeof file.training_file_option === 'undefined') {
      file.training_file_option = 'forced_glossary';
    }
    var fileType = 'text/xml';
    if (file.training_file_option === 'monolingual_corpus') {
      fileType = 'text/plain';
    }
    log.debug({
      fileName : file.file_name,
      fileType : fileType,
      trainingPurpose : file.training_file_option
    }, 'Adding training file to training request');
    stream.addStream(file.training_file_option, file.file_name, fileType, file.stream);
  });

  //Construct our request
  var options = {
    method : 'POST',
    url : urlBase + '/models',
    headers : {
      'Content-Type' : 'multipart/form-data; boundary=' + stream.getBoundary()
    }
  };

  //Internal function to pipe the stream through the post request and handle response.
  var myfunction = function (callback) {
    var error = {};
    var errorCode;
    var errorHttpStatusCode = HTTPStatus.INTERNAL_SERVER_ERROR;
    var errorInserts = {};
    stream.pipe(request.post(options, function (requestError, response, body) {
      if (!requestError) {
        var bodyObject;
        try {
          bodyObject = JSON.parse(body);
        } catch (e) {
          log.debug({
            body : body
          }, 'Couldn\'t parse the body of the response from the train call')
        }
        if ((typeof bodyObject !== 'undefined') && (typeof bodyObject.model_id !== 'undefined')) {
          callback(null, bodyObject.model_id);
        } else {
          //Handle Errors
          errorCode = ltErrors.badLTResponse;
          errorInserts = {
            response : response,
            responseBody : body,
            baseModelId : baseModelId,
            modelName : name,
            url : url + '/models'
          };
          //Examine statusCode first
          if (typeof response.statusCode !== 'undefined') {
            if (response.statusCode === 401) {
              errorCode = ltErrors.connectionUnauthorized;
              errorHttpStatusCode = HTTPStatus.UNAUTHORIZED;
            }
          }
          //Now Examine the body errorMessage, this is more specific and will override a status code
          if ((typeof bodyObject !== 'undefined') && (typeof bodyObject.error_message !== 'undefined')) {
            errorInserts.error_message = bodyObject.error_message;
            errorInserts.error_code = bodyObject.error_code;
            errorCode = ltErrors.unknownTrainingErrorMessage;
            if (bodyObject.error_message.indexOf('is only enabled for glossary customization') > -1) {
              errorCode = ltErrors.glossaryCustomizationUnavailable;
            } else if (bodyObject.error_message.indexOf('unacceptable URL pattern') > -1) {
              errorCode = ltErrors.badUrl;
            } else if (bodyObject.error_message.indexOf('at least one of forced_glossary,advisory_glossary,parallel_corpus') > -1) {
              errorCode = ltErrors.badTrainingFileType;
            } else if (bodyObject.error_message.indexOf('name value has to be alphanumeric') > -1) {
              errorCode = ltErrors.badModelName;
            } else if (bodyObject.error_message.indexOf('base_model_id value is not configured') > -1) {
              errorCode = ltErrors.badBaseModelId;
            } else if ((bodyObject.error_message.indexOf('number of allowed profiles per service') > -1) && (bodyObject.error_message.indexOf('exceeded') > -1)) {
              errorCode = ltErrors.maxModelCustomizationsReached;
            }
          }
          error = new LTServiceError('Training request immediately failed with error -> ' + JSON.stringify(response), errorCode, errorInserts, errorHttpStatusCode);
          callback(error);
        }
      } else {
        errorInserts = {
          response : requestError,
          baseModelId : baseModelId,
          modelName : name,
          url : url + '/models'
        };
        handleException(requestError, errorInserts, 'trainModel');
      }
    }))
  };
  log.debug('Posting train request to Language Service Translation Instance');
  return promise.promisify(myfunction)();
};

/**
 Calls the Language Translator Service instance to get the details of a model.
 @param {credentialsType} credentials - The credentials requesting the training
 @param {string} modelId - The Identity of the Base model
 @returns {Promise<string|Error>} - A promise of the custom Model object returned from a the service instance.
 @throws {LTError} - A Custom Error
 */
module.exports.getModel = function status (credentials, modelId) {
  log.debug({
    username : credentials.username,
    modelId : modelId
  }, 'Request to get model details');
  var urlBase = prefix + credentials.username + ':' + credentials.password + '@' + suffix;
  var generalUrl = url + '/models/' + modelId;
  var options = {
    url : urlBase + '/models/' + modelId
  };
  return request.getAsync(options).spread(function (response, body) {
    if (response.statusCode === HTTPStatus.OK) {
      var bodyObject = parseBody(response, body, generalUrl, 'getModel');
      log.trace({modelDetails : bodyObject}, 'Retrieved model details');
      return bodyObject;
    }
    var errorInserts = {
      response : response,
      responseBody : body,
      trainedModelId : modelId,
      url : generalUrl
    };
    handleProblemResponse(response, errorInserts, 'getModel');
  }).catch(function (e) {
    var errorInserts = {
      response : e,
      trainedModelId : modelId,
      url : generalUrl
    };
    handleException(e, errorInserts, 'getModel');
  });
};

/**
 Calls the Language Translator Service instance to return the training log.
 This actually request verbose info about a model and then lifts out the train_log property for return
 @param {Object} credentials - The credentials requesting the training
 @param {string} credentials.username - The username of the user
 @param {string} credentials.password - The password for the user to access the Language Translator Service Instance
 @param {string} modelId - The Identity of the trained model to retrieve the Log for
 @returns {Promise<Object|Error>} - A promise of an Object with the property trainingLog set to the training Log retrieved from the service instance.
 @throws {LTError} - A Custom Error
 */
module.exports.getTrainingLog = function getTrainingLog (credentials, modelId) {
  log.debug({
    username : credentials.username,
    trainedModelId : modelId
  }, 'Request to retrieve training logs');
  var urlBase = prefix + credentials.username + ':' + credentials.password + '@' + suffix;
  var generalUrl = url + '/models/' + modelId + '?verbose=true';
  var options = {
    url : urlBase + '/models/' + modelId + '?' + queryString.stringify({
      verbose : 'true'
    })
  };
  return request.getAsync(options).spread(function (response, body) {
    if (response.statusCode === HTTPStatus.OK) {
      var bodyObject = parseBody(response, body, generalUrl, 'getTrainingLog');
      if (typeof bodyObject.model_id !== 'undefined') {
        return {
          trainingLog : bodyObject.train_log
        };
      }
    }
    var errorInserts = {
      response : response,
      responseBody : body,
      trainedModelId : modelId,
      url : generalUrl
    };
    handleProblemResponse(response, errorInserts, 'getTrainingLog');
  }).catch(function (e) {
    var errorInserts = {
      response : e,
      trainedModelId : modelId,
      url : generalUrl
    };
    handleException(e, errorInserts, 'getTrainingLog');
  });
};

/**
 Calls the Language Translator Service instance to translate some text.
 @param {Object} credentials - The credentials requesting the training
 @param {string} credentials.username - The username of the user
 @param {string} credentials.password - The password for the user to access the Language Translator Service Instance
 @param {string} modelId - The Identity of the trained model to retrieve the Log for
 @param {string} textToTranslate - The text to translate
 @returns {Promise<Object|Error>} - A promise of an Object with property text containing the original text and property translation containing the the translated text.
 @throws {LTError} - A Custom Error
 */
module.exports.translate = function translate (credentials, modelId, textToTranslate) {
  log.debug({
    username : credentials.username,
    modelId : modelId,
    textToTranslate : textToTranslate
  }, 'Request to translate some text');
  var urlBase = prefix + credentials.username + ':' + credentials.password + '@' + suffix;
  var queryOptions = {
    model_id : modelId,
    text : textToTranslate
  };
  var generalUrl = url + '/translate' + '?' + queryString.stringify(queryOptions);
  var options = {
    url : urlBase + '/translate' + '?' + queryString.stringify(queryOptions),
    headers : {
      'accept' : 'application/json'
    }
  };

  return request.getAsync(options).spread(function (response, body) {
    if (response.statusCode === HTTPStatus.OK) {
      var bodyObject = parseBody(response, body, generalUrl, 'translate');
      if ((typeof bodyObject.translations !== 'undefined') && (typeof bodyObject.translations[0].translation !== 'undefined')) {
        return {
          text : textToTranslate,
          translation : bodyObject.translations[0].translation
        };
      }
    }
    var errorInserts = {
      response : response,
      responseBody : body,
      trainedModelId : modelId,
      url : generalUrl
    };
    handleProblemResponse(response, errorInserts, 'translate');
  }).catch(function (e) {
    var errorInserts = {
      response : e,
      trainedModelId : modelId,
      url : generalUrl
    };
    handleException(e, errorInserts, 'translate');
  });
};

if (process.env.EXPORT_ALL_FOR_TESTING || process.env.NODE_ENV === 'test') {
  module.exports.handleException = handleException;
  module.exports.handleProblemResponse = handleProblemResponse;
}
