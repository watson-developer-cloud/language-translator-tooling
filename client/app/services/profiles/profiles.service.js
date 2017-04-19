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
  .factory('Profiles', ['$http', '$q', '$interval', '$location', '$filter', 'File', 'endpoints', 'statuses', 'restUtil', 'Alerts', function($http, $q, $interval, $location, $filter, File, endpoints, statuses, restUtil, Alerts) {

    var endpoint = endpoints.custommodels;

    var projects,
        project,
        domains,
        unconfirmed,
        showNextSteps;

    var pollingModels = [];

    var profiles = {

      openNextSteps: function() {
        return showNextSteps;
      },

      closeNextSteps: function() {
        showNextSteps = false;
      },

      getPollingModels: function() {
        return pollingModels;
      },

      getBaseModels: function(access) {
        if (!domains) {
          return $http.get(endpoint + access + '/baseModels')
            .then(function(response) {
              var baseModels = response.data;

              // sort into domains
              for (var i = 0; i < baseModels.length; ++i) {
                var d = baseModels[i].domain;
                var s = baseModels[i].source;
                var t = baseModels[i].target;
                var id = baseModels[i].model_id;

                if (!domains) {
                  domains = {};
                }

                var found = false;

                for (var dom in domains) {
                  if (domains.hasOwnProperty(dom)) {
                    if (dom === d) {
                      found = true;
                    }
                  }
                }

                if (!found) {
                  domains[d] = {
                    domain: d,
                    sources: {}
                  };
                }

                if (!domains[d].sources[s]) {
                  domains[d].sources[s] = {
                    source: s,
                    targets: {}
                  };
                }

                if (!domains[d].sources[s].targets[t]) {
                  domains[d].sources[s].targets[t] = {
                    target: t,
                    model_id: id
                  };
                }
              }

              return domains;
            }, function(errorResponse) {
              if ($location.url() !== '/login') {
                var error = restUtil.getErrorMessage(errorResponse);
                if(error && error.message && error.message.statusText) error.message = error.message.statusText;
                Alerts.publish({scope: 'global', type: error.type, message: error.message});
              }
            });
        } else {
          return $q.when(domains);
        }
      },

      selectProject: function(selected) {
        project = selected;
      },

      getCurrentProject: function() {
        if (projects && projects[project]) {
          return $q.when(projects[project]);
        } else {
          return;
        }
      },

      loadProjects: function(access) {
        if (!projects) {
          return $http.get(endpoint + access + '/customModels')
            .then(function(response) {
              var customModels = response.data;
              // In order to prevent duplicated models being added to the projects object, we will always start with an emoty
              // projects object when we request the models for the system
              projects = {};

              for (var i = 0; i < customModels.length; ++i) {
                // check for training models
                if (customModels[i].status === statuses.training) {
                  profiles.poll(customModels[i], access);
                }

                var p = customModels[i].project;

                if (!p) {
                  p = 'Unknown Project';
                  customModels[i].project = p;
                }

                if (!projects[p]) {
                  projects[p] = {
                    name: p,
                    source: customModels[i].source,
                    target: customModels[i].target,
                    domain: customModels[i].domain,
                    model_id: customModels[i].base_model_id,
                    models: []
                  };
                }

                projects[p].models.push(customModels[i]);
              }

              return projects;
            }, function(errorResponse) {
              if ($location.url() !== '/login') {
                var error = restUtil.getErrorMessage(errorResponse);
                if(error && error.message && error.message.statusText) error.message = error.message.statusText;
                Alerts.publish({scope: 'global', type: error.type, message: error.message});
              }
            });
        } else {
          return $q.when(projects);
        }
      },

      addProject: function(newProject) {
        if (!projects[newProject.name]) {
          newProject.models = [{
            name: '',
            description: '',
            domain: newProject.domain,
            source: newProject.source,
            target: newProject.target,
            project: newProject.name,
            base_model_id: newProject.base_model_id,
            trained_model_id: 'UNTRAINED',
            status: statuses.created,
            newModel: true
          }];

          projects[newProject.name] = newProject;
          project = newProject.name;

          showNextSteps = true;
        } else {
            // err
        }
      },

      updateProject: function(project, access) {
        var deferred = $q.defer();
        var oldProjectName;

        var updateProjectName = function() {
          projects[project.newName] = projects[oldProjectName];
          projects[project.newName].name = project.newName;
          delete projects[oldProjectName];
          deferred.resolve();
        };

        var failedPromises = function(errorResponse) {
          var error = restUtil.getErrorMessage(errorResponse);
          if(error && error.message && error.message.statusText) error.message = error.message.statusText;
          Alerts.publish({scope: 'global', type: error.type, message: error.message});
          deferred.reject(errorResponse);
        };

        var promises = [];

        for (var i = 0; i < project.models.length; ++i) {
          var model = project.models[i];

          oldProjectName = model.project;
          model.project = project.newName;

          promises.push(this.update(model, null, access));
        }

        $q.all(promises).then(updateProjectName, failedPromises);

        return deferred.promise;
      },

      deleteProject: function(deleted, access) {
        var deferred = $q.defer();

        var resolvedPromises = function() {
          project = null;
          delete projects[deleted.name];
          deferred.resolve();
        };

        var failedPromises = function(errorResponse) {
          var error = restUtil.getErrorMessage(errorResponse);
          if(error && error.message && error.message.statusText) error.message = error.message.statusText;
          Alerts.publish({scope: 'global', type: error.type, message: error.message});
          deferred.reject(errorResponse);
        };

        if (projects[deleted.name]) {
          for (var domain in projects) {
            if (projects[domain].name === deleted.name) {
              var promises = [];

              for (var i = 0; i < projects[domain].models.length; ++i) {
                promises.push(this.deleteModel(projects[domain].models[i], access));
              }

              $q.all(promises).then(resolvedPromises, failedPromises);
            }
          }
        } else {
          // err
          failedPromises('Can not delete a non-existant project');
        }

        return deferred.promise;
      },

      createModel: function(model, access) {
        var m = angular.copy(model);
        delete m.newModel;

        return $http.post(endpoint + access + '/customModels', m)
          .then(function(response) {
            var newModel = response.data;

            newModel.status = statuses.created;
            newModel.status_date = Date.now();
            newModel.files = [];

            projects[project].models.push(newModel);
            return newModel;
          }, function(errorResponse) {
            console.log(errorResponse);
              var error = restUtil.getErrorMessage(errorResponse);
              if(error && error.message && error.message.statusText) error.message = error.message.statusText;
              Alerts.publish({scope: 'global', type: error.type, message: error.message});
          });
      },

      resetModel: function(model, access) {
          return $http.get(endpoint + access + '/customModels/' + model.custom_model_id + '/resetTraining')
            .then(function(response) {

            }, function(errorResponse) {
              var error = restUtil.getErrorMessage(errorResponse);
              if(error && error.message && error.message.statusText) error.message = error.message.statusText;
              Alerts.publish({scope: 'global', type: error.type, message: error.message});
            });
      },

      deleteModel: function(model, access) {
        if (model.custom_model_id) {
          return $http.delete(endpoint + access + '/customModels/' + model.custom_model_id)
            .then(function(response) {
              var found = false;
              if (project && projects[project]) {
                for (var i = 0; i < projects[project].models.length && !found; ++i) {
                  if (projects[project].models[i].custom_model_id === model.custom_model_id) {
                    projects[project].models.splice(i, 1);
                    found = true;
                  }
                }
              } else {
                return response;
              }

              if (found) {
                return response;
              } else {
                // err
                Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('project-error-model-not-found')});
              }
            }, function(errorResponse) {
              var error = restUtil.getErrorMessage(errorResponse);
              if(error && error.message && error.message.statusText) error.message = error.message.statusText;
              Alerts.publish({scope: 'global', type: error.type, message: error.message});
            });
        }
      },

      cloneModel: function(model) {

        var deferred = $q.defer();
        if (unconfirmed) {
          // err - It should not be possible to get into this state as we disable the clone option until we have
          // confirmed the existing model that we're cloning from. But we'll issue an alert anyway.
          deferred.reject($filter('translate')('project-unable-to-clone-partially-completed-model'));

        } else {
          var m = angular.copy(model);

          m.status_date = Date.now();
          m.status = statuses.created;
          m.unconfirmed = m.name;
          m.cloned_model_id = m.custom_model_id;
          delete m.custom_model_id;

          // Create unique name
          var num = 1;
          var found = false;
          while (true) {
            for (var i = 0; i < projects[project].models.length; ++i) {
              if (projects[project].models[i].name === (m.name + '_' + num)) {
                found = true;
                break;
              }
            }
            if(found) {
              num++;
              found = false;
            } else {
              break;
            }
          }
          m.name += '_' + num;

          unconfirmed = projects[project].models.length;
          projects[project].models.push(m);

          deferred.resolve(m);
        }

        return deferred.promise;
      },

      undoClone: function() {
        var deferred = $q.defer();
        if (unconfirmed) {
          unconfirmed = false;
          deferred.resolve();
        } else {
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('model-error-no-clone-to-undo')});
          deferred.reject();
        }
        return deferred.promise;
      },

      confirmClone: function(model, access) {
        var customModelId = model.cloned_model_id;
        delete model.cloned_model_id;

        if (unconfirmed) {
          var files = model.files;

          return $http.post(endpoint + access + '/customModels/' + customModelId + '/clone', model)
            .then(function(response) {
              var newModel = response.data;

              newModel.files = files;
              newModel.status_date = Date.now();

              projects[project].models.splice(unconfirmed, 1, newModel);
              unconfirmed = null;
              delete model.unconfirmed;
              return newModel;
            }, function(errorResponse) {
              var error = restUtil.getErrorMessage(errorResponse);
              if(error && error.message && error.message.statusText) error.message = error.message.statusText;
              Alerts.publish({scope: 'global', type: error.type, message: error.message});
            });
        } else {
            // err
            Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('model-error-clone-no-confirm')});
        }
      },

      // TODO: test this
      train: function(model, access) {
        return $http.get(endpoint + access + '/customModels/' + model.custom_model_id + '/train')
          .then(function(response) {
            var newModel = response.data;
            return newModel;
          }, function(errorResponse) {
            var error = restUtil.getErrorMessage(errorResponse);
            if(error && error.message && error.message.statusText) error.message = error.message.statusText;
            Alerts.publish({scope: 'global', type: error.type, message: error.message});
          });
      },

      cancelTraining: function(model, access) {
        return $http.get(endpoint + access + '/customModels/' + model.custom_model_id + '/resetTraining')
          .then(function() {},
            function(errorResponse) {
              var error = restUtil.getErrorMessage(errorResponse);
              if(error && error.message && error.message.statusText) error.message = error.message.statusText;
              Alerts.publish({scope: 'global', type: error.type, message: error.message});
            });
      },

      translate: function(model, text, access) {
        return $http.post(endpoint + access + '/customModels/' + model.custom_model_id + '/translate', {text: text})
          .then(function(response) {
            var body = response.data;
            return body;
          }, function(errorResponse) {
            var error = restUtil.getErrorMessage(errorResponse);
            if(error && error.message && error.message.statusText) error.message = error.message.statusText;
            Alerts.publish({scope: 'global', type: error.type, message: error.message});
          });
      },

      update: function(model, status, access) {
        var updates = {
          name: model.name,
          description: model.description,
          project: model.project,
          status_date: Date.now(),
        };

        if (status) {
          updates.status = status;
        }

        return $http.put(endpoint + access + '/customModels/' + model.custom_model_id, updates)
          .then(function(response) {
            var body = response.data;
            return body;
          }, function(errorResponse) {
            var error = restUtil.getErrorMessage(errorResponse);
            if(error && error.message && error.message.statusText) error.message = error.message.statusText;
            Alerts.publish({scope: 'global', type: error.type, message: error.message});
          });
      },

      poll: function(model, access) {
        var deferred = $q.defer();
        var interval;

        var pollStatus = function() {
          interval = $interval(function() {
            $http.get(endpoint + access + '/customModels/' + model.custom_model_id + '/status')
              .then(function(response) {
                var status = response.data;

                if (status.status !== statuses.training) {
                  $interval.cancel(interval);
                  model.status = status.status;
                  model.status_date = status.status_date;
                  deferred.resolve(status);
                }
              }, function (reason) {
                console.log('polling failed');

                if (reason.status === 401) {
                  $interval.cancel(interval);
                  deferred.reject();
                }
              });
          }, 1000 * 60); // 1 minute

          pollingModels.push({
            id: model.custom_model_id,
            interval: interval
          });
        };

        var isPolling = false;
        for (var i = 0; i < pollingModels.length; ++i) {
          if (pollingModels[i].id === model.custom_model_id) {
            isPolling = true;
          }
        }

        if (!isPolling) {
          pollStatus();
        }
        return deferred.promise;
      },

      stopPolling: function(model) {
        for (var i = 0; i < pollingModels.length; ++i) {
          if (pollingModels[i].id === model.custom_model_id) {
            $interval.cancel(pollingModels.inverval);
          }
        }
      }
    };

    return profiles;
  }]);
