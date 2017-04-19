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

/**
 * Wrapper for the OpenStack Swift REST API.
 *
 * Taken from:
 * @module ibmwatson-qa-filestorage/openstack
 * @author Dale Lane
 */

// core dependencies
var fs = require('fs');
var stream = require('stream')
// external dependencies
var request = require('request');
var async = require('async');
var httpstatus = require('http-status');
// local dependencies
var log = require('../../config/log');
var service = require('../../config/storage');
// cache of object store credentials to let us reuse it
var credentials;

/**
 * Helper function to download an X-Auth-Token from the object
 * store. This is needed by all the other functions in this
 * module.
 *
 * After the first successful call, it will return the
 * previously cached credentials.
 *
 * @param callback {function} - called once complete
 *          callback(err, credentials)
 *              {error} err - error
 *              {object} credentials
 *              {number} credentials.total
 *              {number} credentials.start
 *              {array}  credentials.items
 */

function getObjectStoreCredentials (callback) {
  if (credentials) {
    return callback(null, credentials);
  }
  var url;
  var options;
  if (service) {
    if (service.auth_url) {
      url = service.auth_url + '/v3/auth/tokens';
      var payload = {
        auth : {
          identity : {
            methods : [
              'password'
            ],
            password : {
              user : {
                id : service.userId,
                password : service.password
              }
            }
          },
          scope : {
            project : {
              id : service.projectId
            }
          }
        }
      };

      options = {
        url : url,
        headers : {
          'Content-Type' : 'application/json'
        },
        json : true,
        body : payload
      };

      log.debug('Fetching OpenStack auth token');
      return request.post(options, function (err, httpresp, body) {

        if (err) {
          log.error({error : err}, 'Error getting auth token');
          return callback(err);
        }
        if (httpresp.statusCode !== httpstatus.OK && httpresp.statusCode !== httpstatus.CREATED) {
          log.error({status : httpresp.statusCode, headers : httpresp.headers}, 'Error getting auth token');
          return callback(new Error('Unexpected response : ' + httpstatus[httpresp.statusCode]));
        }
        credentials = {url : 'https://dal.objectstorage.open.softlayer.com/v1/AUTH_' + service.projectId};

        if (httpresp.headers['x-subject-token']) {
          credentials.auth = httpresp.headers['x-subject-token'];
          log.debug('Established credentials successfully');
          return callback(null, credentials);
        }

        return callback(new Error('Missing credentials in response'));
      });

    }
    else if (service.auth_uri) {

      url = service.auth_uri + '/' + service.username;
      options = {
        auth : {
          user : service.username,
          pass : service.password
        }
      };

      log.debug({url : url}, 'Fetching OpenStack auth token');

      return request.get(url, options, function (err, httpresp) {
        if (err) {
          log.error({error : err}, 'Error getting auth token');
          return callback(err);
        }
        if (httpresp.statusCode !== httpstatus.OK) {
          log.error({status : httpresp.statusCode, headers : httpresp.headers}, 'Error getting auth token');
          return callback(new Error('Unexpected response : ' + httpstatus[httpresp.statusCode]));
        }

        credentials = {user : service.username};

        if (httpresp.headers['x-storage-url']) {
          credentials.url = httpresp.headers['x-storage-url'];
        }
        if (httpresp.headers['x-auth-token']) {
          credentials.auth = httpresp.headers['x-auth-token'];
        }

        if (credentials.url && credentials.auth) {
          log.debug('Got object store credentials');
          return callback(null, credentials);
        }

        log.error({headers : httpresp.headers}, 'Missing credentials');
        return callback(new Error('Missing credentials in response'));
      });
    }
    else {
      return callback(new Error('No Object Storage configuration provided'));
    }
  }

}

function getContainers(callback){
    async.waterfall([
        // get an auth token to use to submit request to OpenStack
        getObjectStoreCredentials,
        // get the complete list of containers from OpenStack
        function (oscredentials, next){
            var options = {
                headers : {
                    'X-Auth-Token' : oscredentials.auth,
                    'Accept' : 'application/json'
                },
                json : true
            };

            log.trace({ options : options, credentials : oscredentials }, 'getting containers from openstack');

            request.get(oscredentials.url, options, function (err, httpresp, body){
                if (err){
                    return next(err);
                }
                if (httpresp.statusCode !== httpstatus.OK){
                    return next(new Error('Unexpected response : ' + httpstatus[httpresp.statusCode]));
                }

                return next(null, {
                    items : body,
                    start : 0,
                    total : body.length
                });
            });
        }
    ], callback);
}


/**
 * Creates a container in object storage where files can be stored.
 *
 * @param {string} container - name of the container to create
 * @param {function} callback - called once complete
 *                      callback(err)
 */
function createContainer(name, callback){
    async.waterfall([
        // get an auth token to use to submit request to OpenStack
        getObjectStoreCredentials,
        // submit the create request
        function (oscredentials, next){
            var url = oscredentials.url + '/' + name;
            var options = { headers : {
                'X-Auth-Token' : oscredentials.auth
            }};

            log.trace({ options : options, url : url }, 'creating container');

            request.put(url, options, function (err, httpresp){
                if (err){
                    return next(err);
                }
                if (httpresp.statusCode !== httpstatus.CREATED && httpresp.statusCode !== httpstatus.ACCEPTED){
                    log.error({ response : httpresp }, 'Failed to create container');
                    return next(new Error('Unexpected response : ' + httpstatus[httpresp.statusCode]));
                }
                return next();
            });
        }
    ], callback);
}


/**
 * Gets information about a container.
 *
 * @param {string} name - name of the container to download from
 */
function getContainer(name, callback){
    async.waterfall([
        // get an auth token to use to submit request to OpenStack
        getObjectStoreCredentials,
        // use credentials to get the container info
        function (oscredentials, next){
            var url = oscredentials.url + '/' + name;
            var options = {
                headers : {
                    'X-Auth-Token' : oscredentials.auth,
                    'Accept' : 'application/json'
                },
                json : true
            };

            log.trace({ options : options, url : url }, 'getting container info');

            request.get(url, options, function (err, httpresp, body){
                if (err){
                    return next(err);
                }
                if (httpresp.statusCode !== httpstatus.OK){
                    return next(new Error('Unexpected response : ' + httpstatus[httpresp.statusCode]));
                }

                return next(null, body);
            });
        }
    ], callback);
}

/**
 * Deletes a container. The container must be empty.
 *
 * @param {string} container - name of the container to delete
 * @param {function} callback - called once complete
 *                      callback(err)
 */
function deleteContainer(name, callback){
    async.waterfall([
        // get an auth token to use to submit request to OpenStack
        getObjectStoreCredentials,
        // submit the delete request
        function (oscredentials, next){
            var url = oscredentials.url + '/' + name;
            var options = { headers : {
                'X-Auth-Token' : oscredentials.auth
            }};

            log.trace({ options : options, url : url }, 'deleting container');

            request.del(url, options, function (err, httpresp){
                if (err){
                    return next(err);
                }
                if (httpresp.statusCode !== httpstatus.NO_CONTENT){
                    return next(new Error('Unexpected response : ' + httpstatus[httpresp.statusCode]));
                }
                return next();
            });
        }
    ], callback);
}


function examineContainer(name, callback){
    getContainer(name, function(err, body) {
        if (err) {
            log.trace({ name : name }, 'container not found, creating...');

            createContainer(name, function(err) {
                if (err) {
                    callback(err);
                } else {
                    log.trace({ name : name }, 'created container');
                    return callback();
                }
            })
        } else {
            log.trace({ name : name }, 'container found');
            return callback(null, body);
        }
    });
}

/**
 * Checks a container exists, if not creates it.
 *
 * @param {string} name - name of the container to check
 */
function confirmContainerExists(oscredentials, name, callback){
    getContainer(name, function(err, body) {
        if (err) {
            log.trace({ name : name }, 'container not found, creating...');

            createContainer(name, function(err) {
                if (err) {
                    callback(err);
                } else {
                    log.trace({ name : name }, 'created container');
                    return callback(null, oscredentials);
                }
            })
        } else {
            log.trace({ name : name }, 'container found');
            return callback(null, oscredentials);
        }
    });
}

/**
 * Stores the contents of a file in object storage.
 *
 * @param {string} container - name of the container to store in
 * @param {string} name - name of the file to store
 * @param {string} location - location of the file to store
 * @param {function} callback - called once complete
 *                      callback(err)
 */
function storeFile(container, name, location, callback){
    async.waterfall([
     // get an auth token to use to submit request to OpenStack
     getObjectStoreCredentials,

     function(oscredentials, callback) {
            confirmContainerExists(oscredentials, container, callback);
        },

        // stream the file to the OpenStack API
        function (oscredentials, next){
            var url = oscredentials.url + '/' + container + '/' + name;
            var options = { headers : { 'X-Auth-Token' : oscredentials.auth } };

            log.debug({ options : options, url : url, file : location }, 'Uploading');

            fs.createReadStream(location)
              .pipe(request.put(url, options, function(err, httpresp){
                if (err){
                    return next(err);
                }
                if (httpresp.statusCode !== httpstatus.CREATED){
                    log.error({ response : httpresp }, 'Upload failed');
                    return next(new Error('Unexpected response : ' + httpstatus[httpresp.statusCode]));
                }
                log.debug({ name : name, location : location }, 'File uploaded');
                return next();
            }));
        }
    ], callback);
}


/**
 * Deletes a file from storage.
 *
 * @param {string} container - name of the container to delete from
 * @param {string} name - name of the file to delete
 * @param {function} callback - called once complete
 *                      callback(err)
 */
function deleteFile(container, name, callback){
    async.waterfall([

        // get an auth token to use to submit request to OpenStack
        getObjectStoreCredentials,
        function(oscredentials, callback) {
            confirmContainerExists(oscredentials, container, callback);
        },
        // submit the delete request
        function (oscredentials, next){
            var url = oscredentials.url + '/' + container + '/' + name;
            var options = { headers : {
                'X-Auth-Token' : oscredentials.auth
            }};

            log.trace({ options : options, url : url }, 'deleting file');

            request.del(url, options, function (err, httpresp){
                if (err){
                    return next(err);
                }
                switch (httpresp.statusCode){
                    case httpstatus.NO_CONTENT:
                        // expected status
                        log.debug({ url : url }, 'File deleted');
                        return next();
                    case httpstatus.NOT_FOUND:
                        // accepted status
                        log.debug({ url : url }, 'Attempted to delete non-existent file');
                        return next();
                    default:
                        return next(new Error('Unexpected response : ' + httpstatus[httpresp.statusCode]));
                }
            });
        }
    ], callback);
}

/**
 * Gets a file stream from File Store and passes it into callback function.
 *
 * @param {string} container - name of the container to download from
 * @param {string} name - name of the file to download
 * @return {stream} filestream - passes this into callback stream containing the file bytes
 */
function getFileAsStream(container, name, callback) {
  async.waterfall([
    // get an auth token to use to submit request to OpenStack
    getObjectStoreCredentials,
    function (oscredentials, callback) {
      confirmContainerExists(oscredentials, container, callback);
    },
    // use credentials to download the file
    function (oscredentials, next) {
      var url = oscredentials.url + '/' + container + '/' + name;
      var options = {
        headers: {
          'X-Auth-Token': oscredentials.auth
        }
      };
      log.debug({
        options: options,
        url: url
      }, 'downloading file as stream');

      callback(null, request.get(url, options));
    }
  ], callback);
}
/**
 * Gets a file from storage.
 *
 * @param {string} container - name of the container to download from
 * @param {string} name - name of the file to download
 */
  function getFile(container, name, callback){
    async.waterfall([

        // get an auth token to use to submit request to OpenStack
        getObjectStoreCredentials,
        function(oscredentials, callback) {
            confirmContainerExists(oscredentials, container, callback);
        },
        // use credentials to download the file
        function (oscredentials, callback){
            var url = oscredentials.url + '/' + container + '/' + name;
            var options = { headers : {
                'X-Auth-Token' : oscredentials.auth
            }};

            log.debug({ options : options, url : url }, 'downloading file');
            request
                .get(url, options, function(err, response, body)
              {
                log.error({err:err, body:body}, 'found file');
                   callback(null, body);
              });
        }
    ], callback);
}

/**
 * Download a file from storage to the requested local location on disk.
 *
 * @param {string} container - name of the container to download from
 * @param {string} name - name of the file to download
 * @param {string} location - location to download to
 * @param {function} callback - called once complete
 *                      callback(err)
 */
function downloadFile(container, name, location, callback){
    var stream = fs.createWriteStream(location)
                    .on('finish', callback)
                    .on('error', callback);
    getFile(container, name, stream);
}

module.exports.getObjectStoreCredentials = getObjectStoreCredentials;
module.exports.getContainer = getContainer;
module.exports.getContainers = getContainers;
module.exports.createContainer = createContainer;
module.exports.deleteContainer = deleteContainer;
module.exports.storeFile = storeFile;
module.exports.getFile = getFile;
module.exports.getFileAsStream = getFileAsStream;
module.exports.downloadFile = downloadFile;
module.exports.deleteFile = deleteFile;
module.exports.confirmContainerExists = confirmContainerExists;
module.exports.examineContainer = examineContainer;
