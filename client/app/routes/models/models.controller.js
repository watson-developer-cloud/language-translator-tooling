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
  .controller('ModelsCtrl', function ($scope, $modal, $q, $location, $sce, $timeout, $filter, $stateParams, Profiles, Upload, File, project, statuses, statusMessages, restUtil, Alerts, access, fileTypes) {
    $scope.tabs = ['info', 'test'];
    $scope.tab = $scope.tabs[0];
    $scope.isCollapsed = true;
    $scope.showBin = false;
    $scope.uploadingFiles = false;
    $scope.showActionTooltip = false;
    $scope.showStatusTooltip = false;
    $scope.showModelsList = false;
    $scope.errors = {};
    $scope.editProperties = {
      name: 'Name',
      desc: 'Desc'
    };
    $scope.statuses = statuses;
    $scope.actionTooltips = {
      created: $sce.trustAsHtml($filter('translate')('model-action-tooltip-created')),
      training: $sce.trustAsHtml($filter('translate')('model-action-tooltip-training')),
      trained: $sce.trustAsHtml($filter('translate')('model-action-tooltip-trained')),
      warning: $sce.trustAsHtml($filter('translate')('model-action-tooltip-warning'))
    };
    $scope.statusTooltips = {
      created: $sce.trustAsHtml($filter('translate')('model-status-tooltip-created')),
      filesloaded: $sce.trustAsHtml($filter('translate')('model-status-tooltip-files-loaded')),
      training: $sce.trustAsHtml($filter('translate')('model-status-tooltip-training')),
      trained: $sce.trustAsHtml($filter('translate')('model-status-tooltip-trained')),
      warning: $sce.trustAsHtml($filter('translate')('model-status-tooltip-warning'))
    };
    $scope.getStatusDescription = function(status) {
        if(!status) return null;
        else if(status == statuses.created) return $scope.statusTooltips.created;
        else if(status == statuses.filesLoaded) return $scope.statusTooltips.filesloaded;
        else if(status == statuses.training) return $scope.statusTooltips.training;
        else if(status == statuses.trained) return $scope.statusTooltips.trained;
        else if(status == statuses.warning) return $scope.statusTooltips.warning;
    };
    $scope.fileOptions = [
      fileTypes.forcedGlossary,
      fileTypes.parallelCorpus,
      fileTypes.monolingualCorpus
    ];
    var initialFileOption = $filter('translate')('model-document-upload-select-type');
    var editHelperTexts = {
      saving: $filter('translate')('saving'),
      duplicateError: $filter('translate')('model-duplicate-name'),
      lengthError: $filter('translate')('model-name-too-long'),
      spaceError: $filter('translate')('model-name-no-spaces-allowed'),
      alphanumericError: $filter('translate')('model-name-invalid-characters'),
    };
    var maxNameLength = 32;

    Profiles.loadProjects(access).then(
        function(projects) {
            $scope.projects = projects;
        }
    );

    $scope.resetTranslation = function() {
      delete $scope.textToTranslate;
      delete $scope.translation;
    };

    $scope.selectModel = function(model) {
        $scope.selectedModel = model;
        if(model.status && model.status.toUpperCase() == "WARNING" && model['status_detail']) {
            $scope.trainingError = model['status_detail'].toLowerCase();
        }
        $scope.selectedModelDetails = {
            domain: $filter('toDomain')($scope.selectedModel.domain),
            from: $filter('toCountry')($scope.selectedModel.source),
            to: $filter('toCountry')($scope.selectedModel.target)
        };
    };

    $scope.select = function(model) {
      $scope.showActionTooltip = false;
      $scope.showStatusTooltip = false;
      $scope.showModelsList = false;
      $scope.uploadingFiles = false;
      $scope.editing = false;
      $scope.tab = 'info';
      $scope.selectModel(model);
      $scope.resetTranslation();
      $location.url('models/' + model.name);
    };

    var selectFirstModel = function() {
      if ($scope.models.length === 0) {
        $scope.newModel();
        $scope.select($scope.models[0]);
        setupNewModel();
      } else if($scope.models.length === 1 && !$scope.models[0].name) {
          $scope.selectModel($scope.models[0]);
          setupNewModel();
      } else {
        $scope.select($scope.models[0]);
        for (var i = 0; i < $scope.models.length; ++i) {
          if ($scope.models[i].status_date > $scope.selectedModel.status_date) {
            $scope.select($scope.models[i]);
          }
        }
      }
      if($scope.selectedModel) $location.url('models/' + $scope.selectedModel.name);
    };

    $scope.edit = function(prop) {
      $scope.selectedModel['edit' + prop] = true;
      $scope.editing = {};
      $scope.editing[prop.toLowerCase()] = true;

      if (prop === $scope.editProperties.name) {
        $scope.checkName();
      } else if (prop === $scope.editProperties.desc) {
        delete $scope.editHelperText;
      }
    };

    var checkDuplicateNames = function(model) {
      // Check for duplicate names
      for(var projectName in $scope.projects) {
          var prj = $scope.projects[projectName];
          for(var j=0; j<prj.models.length; j++) {
              if (model.custom_model_id !== prj.models[j].custom_model_id && model.name === prj.models[j].name) {
                return true;
              }
          }
      }
      return false;
    };

    // Update edit name helper text
    $scope.checkName = function() {
      var valid = false;
      if (checkDuplicateNames($scope.selectedModel)) {
        $scope.editHelperText = editHelperTexts.duplicateError;
      } else if ($scope.selectedModel.name.length > maxNameLength) {
        $scope.editHelperText = editHelperTexts.lengthError;
    } else if (/[^A-Za-z0-9_-\s]/g.test($scope.selectedModel.name)) {
        $scope.editHelperText = editHelperTexts.alphanumericError;
      } else {
        $scope.editHelperText = $filter('translate')('characters-remaining', {length: (maxNameLength - $scope.selectedModel.name.length)});
        valid = true;
      }
      return valid;
    };

    var setupNewModel = function() {
      $scope.edit($scope.editProperties.name);
      $scope.checkName();
    };

    var setupModel = function() {
      $scope.models = project.models;
      if($scope.models && $stateParams.name) {
          for(var i=0; i<$scope.models.length; i++) {
              if($scope.models[i].name == $stateParams.name) {
                  $scope.selectModel($scope.models[i]);
                  break;
              }
          }
      } else {
          selectFirstModel();
      }

      var getFiles = function(model) {
        $scope.loadingDocuments = true;
        File
          .query({
            batch_id: model.file_batch_id,
            tenant_id: access
          }).$promise
          .then(function(files) {
            $scope.loadingDocuments = false;
            model.files = [];

            for (var i = 0; i < files.length; ++i) {
              model.files.push({
                name: files[i].file_name,
                lastModified: files[i].last_modified,
                option: files[i].training_file_option || fileTypes.forcedGlossary
              });
            }
          }, function(errorResponse) {
            $scope.loadingDocuments = false;
            var error = restUtil.getErrorMessage(errorResponse);
            Alerts.publish({scope: 'global', type: error.type, message: error.message});
          });
      };

      // get files for models
      for(var i = 0; i < $scope.models.length; ++i) {
        if ($scope.models[i].file_batch_id) {
          getFiles($scope.models[i]);
        }
      }
    };

    if (!project) {
      $scope.loading = true;
      Profiles.loadProjects(access).then(
          function(projects) {
              $scope.loading = false;
              if(!angular.equals({}, projects)) {
                  var selectedProject;
                  var foundModel = false;
                  for(var projectName in projects) {
                      if(!selectedProject) selectedProject = projects[projectName];
                      for(var i=0; i<projects[projectName].models.length; i++) {
                          if(projects[projectName].models[i].name == $stateParams.name) {
                              selectedProject = projects[projectName];
                              foundModel = true;
                              break;
                          }
                      }
                      if(foundModel) break;
                  }
                  Profiles.selectProject(selectedProject.name);
                  project = selectedProject;
                  setupModel();
              } else {
                  $location.url('projects');
              }
          }
      );
    } else {
        setupModel();
    }

    $scope.disableButton = function(button) {
      if (!$scope.selectedModel) {
        return true;
      }

      if (button === 'train') {
        return $scope.selectedModel.status !== statuses.filesLoaded;
      } else if (button === 'clone') {
        return $scope.selectedModel.unconfirmed !== undefined || $scope.selectedModel.name.trim() === "" || $scope.selectedModel.status === statuses.unknown;
      } else if (button === 'delete') {
        return $scope.selectedModel.unconfirmed !== undefined || $scope.selectedModel.name.trim() === "" || $scope.selectedModel.status === statuses.training;
      }
    };

    $scope.hasNameError = function() {
      return $scope.editHelperText === editHelperTexts.duplicateError || $scope.editHelperText === editHelperTexts.lengthError || $scope.editHelperText === editHelperTexts.spaceError || $scope.editHelperText === editHelperTexts.alphanumericError;
    };

    $scope.statusClass = function(status, sidebar) {
      var statClass = sidebar ? 'no-stroke-status' : '';

      if (status === statuses.filesLoaded || status === statuses.created) {
        return 'status-ready';
      } else if (status === statuses.training) {
        statClass += ' status-training';
        return statClass;
      } else if (status === statuses.trained) {
        statClass += ' status-trained';
        return statClass;
      } else if (status === statuses.warning) {
        statClass += ' status-warning';
        return statClass;
      }
    };

    $scope.isSelected = function(model) {
      if(!$scope.selectedModel || !model) return false;
      return $scope.selectedModel && ($scope.selectedModel.custom_model_id === model.custom_model_id);
    };

    $scope.toggleModels = function() {
      $scope.showModelsList = !$scope.showModelsList;
    };

    $scope.addFiles = function(element) {
      var model = $scope.selectedModel;

      $scope.$apply(function() {

        // Upload file to File Storage Service
        var addFile = function(file, model) {
          var fileObj = {
            name: file.name,
            lastModified: Date.now(),
            progress: 0,
            option: initialFileOption,
            file: file
          };

          model.newFiles.push(fileObj);
        };

        var uploadFile = function(file, model) {
          return function() {
            var deferred = $q.defer();

            // Use ng-file-upload to support uploading files
            Upload.upload({
              url: '/api/batches/' +  access + '/' + model.file_batch_id + '/files',
              file: file.file,
              data: {option: file.option}
            }).progress(function (evt) {
              var progressPercentage = parseInt(95.0 * evt.loaded / evt.total, 10);
              file.progress = progressPercentage;
              console.log('Progress: ' + progressPercentage + '% ' + evt.config.file.name);
            }).success(function (data, status, headers, config) {
              file.progress = 100;
              console.log('File ' + config.file.name + ' uploaded. Response: ' + data);
              deferred.resolve();
            }).error(function (data, status) {
              var error = restUtil.getErrorMessage(errorResponse);
              Alerts.publish({scope: 'global', type: error.type, message: error.message});
              console.log('error status: ' + status);
              failFileUpload(model);
              deferred.reject(status);
            });

            return deferred.promise.then(function() {
              delete file.progress;
              delete file.file;
              console.log('Resolved ' + file.name);
            });
          };
        };

        // After uploading files update last modified and status
        var completeFileUpload = function(model) {
          console.log('Finished uploading files');
          $scope.updateModel(model, statuses.filesLoaded);
          $scope.uploadingFiles = false;
          delete model.newFiles;
        };

        // After uploading files update last modified and status
        var failFileUpload = function(model) {
          console.log('Failed uploading files');
          $scope.uploadingFiles = false;
          delete model.newFiles;
        };

        if (!model) {
          // err
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('model-document-upload-error-no-model')});
        } else if (model.unconfirmed) {
          // err
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('model-document-upload-error-no-name')});
        } else if (!model.file_batch_id) {
          // err
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('model-document-upload-error-no-id')});
        } else if (model.status === statuses.trained || model.status === statuses.training) {
          // err
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('model-document-upload-error-training')});
        } else {
          if (!model.files) {
            model.files = [];
          }

          var files = element.files ? element.files : element;

          // Check for duplicate upload
          var duplicate = false;
          var validated = true;
          var fileNames = [];

          for (var i = 0; i < files.length && !duplicate; ++i) {
            // Check file extensions
            var ext = files[i].name.split('.').pop();
            if (ext.toLowerCase() !== 'tmx' && ext.toLowerCase() !== 'txt') {
              validated = false;
            }

            // Check files to be uploaded don't have the same name
            if (fileNames.indexOf(files[i].name) > -1) {
              duplicate = true;
            } else {
              // Check for duplicate in previously uploaded files
              for (var j = 0; j < model.files.length; j++) {
                if (model.files[j].name === files[i].name) {
                  duplicate = true;
                }
              }

              if (!duplicate) {
                fileNames.push(files[i].name);
              }
            }
          }

          if (!validated) {
            // err
            $scope.alert = {scope: 'upload', type: 'error', message: $filter('translate')('model-document-upload-error-invalid-extension')};
            failFileUpload(model);
          } else if (duplicate) {
            // err
            $scope.alert = {scope: 'upload', type: 'error', message: $filter('translate')('model-document-upload-error-duplicate-files')}
            failFileUpload(model);
          } else {
            model.newFiles = [];

            angular.forEach(files, function(file) {
              addFile(file, model);
            });

            $scope.modalInstance = $modal.open({
              animation: true,
      		  windowTemplateUrl: 'app/modals/main-template.html',
              templateUrl: 'app/modals/upload/upload.html',
              controller: 'uploadCtrl',
              // size: 'sm',
              resolve: {
                model: function() {
                  return model;
                },
                fileOptions: function() {
                  return $scope.fileOptions;
                }
              }
            });

            // upload files
            $scope.modalInstance.result.then(function (model) {
              $scope.uploadingFiles = true;

              var chain = $q.when();

              model.newFiles.forEach(function (file) {
                model.files.push(file);
                chain = chain.then(uploadFile(file, model));
              });

              chain.then(function() {
                completeFileUpload(model);
              });
            }, function () {
              // cancelled uploading files
              console.log('Cancelled uploading files');
              failFileUpload(model);
              element.value = "";
              delete $scope.modalInstance;
            });
          }
        }
      });
    };

    $scope.removeAlert = function() {
        $scope.alert = null;
    }

    $scope.deleteFile = function(file, model) {

      var removeFile = function(file, model) {
        var index = -1;

        for (var i = 0; i < model.files.length; ++i) {
          if (model.files[i].name === file.name) {
            index = i;
          }
        }

        if (index > -1) {
          model.files.splice(index, 1);
        }
      };

      if (file.option === initialFileOption) {
        console.log('remove file before upload');
        removeFile(file, model);
      } else {
        console.log('remove uploaded file');

        // open 'are you sure?' modal
        $scope.modalInstance = $modal.open({
          animation: true,
  		  windowTemplateUrl: 'app/modals/main-template.html',
          templateUrl: 'app/modals/delete/delete.html',
          controller: 'deleteCtrl',
        //   size: 'sm',
          resolve: {
            deleted: function() {
              return {name: file.name};
            },
            objectType: function() {
              return 'DOCUMENT';
            }
          }
        });

        // delete file
        $scope.modalInstance.result.then(function (file) {
          File
          .delete({
            batch_id: model.file_batch_id,
            file_id: file.name,
            tenant_id: access
          })
          .$promise
          .then(function() {
            removeFile(file, model);

            var status = model.files.length === 0 ? statuses.created : statuses.filesLoaded;

            $scope.updateModel(model, status);
          }, function(errorResponse) {
            var error = restUtil.getErrorMessage(errorResponse);
            Alerts.publish({scope: 'global', type: error.type, message: error.message});
          });
        }, function () {
          // cancelled delete file
          console.log('Cancelled delete');
          delete $scope.modalInstance;
        });
      }
    };

    $scope.newModel = function() {
      // Add new empty model to models list
      var emptyModel = {
        name: '',
        description: '',
        trained_model_id: 'UNTRAINED',
        base_model_id: project.base_model_id,
        domain: project.domain,
        source: project.source,
        target: project.target,
        project: project.name,
        status: statuses.created,
        status_date: Date.now(),
        newModel: true
      };
      $scope.models.push(emptyModel);
      $scope.selectModel(emptyModel);
      setupNewModel();
    };

    $scope.clone = function(model) {
      Profiles.cloneModel(model)
        .then(function(newModel) {
          $scope.selectedModel = newModel;
          $scope.selectedModelDetails = {
              domain: $filter('toDomain')($scope.selectedModel.domain),
              from: $filter('toCountry')($scope.selectedModel.source),
              to: $filter('toCountry')($scope.selectedModel.target)
          };
          $scope.checkName();
          $location.url('models/' + $scope.selectedModel.name);
        }, function(errorMsg) {
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')(errorMsg)});
        });
    };

    $scope.confirmModel = function(updateUrl) {
      var model = $scope.selectedModel;

      var finishConfirm = function() {
        $scope.editing = false;
        delete model.editName;
        delete model.editDesc;
        if(updateUrl) $location.url('models/' + $scope.selectedModel.name);
      };

      if ($scope.checkName()) {
        if (model.name) {
          model.name = model.name.trim();
          // Confirm clone
          if (model.unconfirmed) {
            $scope.editHelperText = editHelperTexts.saving;
            Profiles.confirmClone(model, access)
              .then(function(model) {
                $scope.selectedModel = model;
                finishConfirm();
              });

          // Confirm new model name
          } else if (model.newModel) {
            $scope.editHelperText = editHelperTexts.saving;
            // We need to remove the editName field here otherwise we'll store the
            // model saying the name needs to be edited everytime we load if from
            // the DB.
            delete model.editName;

            Profiles.createModel(model, access)
            .then(function(newModel) {
              if ($scope.selectedModel === model) {
                $scope.selectedModel = newModel;
              }

              for (var i = 0; i < $scope.models.length; ++i) {
                if ($scope.models[i].newModel) {
                  $scope.models.splice(i, 1);
                  finishConfirm();
                }
              }
            });
          // Confirm name or description update
          } else if (model.editName || model.editDesc) {
            // Update existing model
            $scope.editHelperText = editHelperTexts.saving;
            $scope.updateModel(model)
              .then(function() {
                finishConfirm();
              });
          }
        } else {
          // err
          console.log('Model not created: No name provided');
        }
      } else {
        // err
        console.log('Model not created: Invalid model name');
      }
    };

    $scope.resetModel = function() {
        $scope.selectedModel.trained_model_id = 'UNTRAINED';
        $scope.selectedModel.status = statuses.filesLoaded;

        Profiles.resetModel($scope.selectedModel, access);
    };

    $scope.trainModel = function(model) {
      if (model && model.file_batch_id) {
        // open 'train' modal
        $scope.modalInstance = $modal.open({
          animation: true,
  		  windowTemplateUrl: 'app/modals/main-template.html',
          templateUrl: 'app/modals/train/train.html',
          controller: 'TrainCtrl',
          // size: 'sm',
          resolve: {
            model: function() {
              return model;
            }
          }
        });

        // start training
        $scope.modalInstance.result.then(function () {
          console.log('start training');

          var oldStatus = model.status;
          model.status = statuses.training;

          Profiles.train(model, access)
            .then(function(m) {
              if (m) {
                model.status = m.status;
                model.status_date = m.status_date;
                model.trained_model_id = m.trained_model_id;

                console.log('start polling');
                // Poll for status
                Profiles.poll(model, access)
                  .then(function(result) {
                    console.log('finished polling');
                    if(result && result.status && result.status.toUpperCase() == "WARNING") {
                        $scope.trainingError = result['status_detail'].toLowerCase();
                        Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('train-error-for-model', model)});
                    }
                  });
              } else {
                model.status = oldStatus;
              }
            });
        }, function () {
          // cancelled training
          console.log('Cancelled training');
          delete $scope.modalInstance;
        });
      }
    };

    $scope.cancelTraining = function(model) {
      if (model.status === statuses.training && model.trained_model_id !== 'UNTRAINED') {
        // open 'cancel training' modal
        $scope.modalInstance = $modal.open({
          animation: true,
  		  windowTemplateUrl: 'app/modals/main-template.html',
          templateUrl: 'app/modals/cancelTraining/cancelTraining.html',
          controller: 'CancelTrainingCtrl'
        });

        // cancel training
        $scope.modalInstance.result.then(function () {
          console.log('cancel training');

          model.status = statuses.filesLoaded;

          Profiles.cancelTraining(model, access)
            .then(function() {
              model.trained_model_id = 'UNTRAINED';
              Profiles.stopPolling(model);
            });
        }, function () {
          // continued training
          delete $scope.modalInstance;
        });
      }
    };

    $scope.updateModel = function(model, status) {
      var deferred = $q.defer();
      var files = model.files;

      Profiles.update(model, status, access)
        .then(function(m) {
          if (m) {
            model.status = m.status;
            model.status_date = m.status_date;
          }
          model.files = files;
          deferred.resolve();
        });

      return deferred.promise;
    };

    $scope.deleteModel = function(model) {
      if (model.newModel || model.unconfirmed) {
        if (model.unconfirmed) {
          $scope.editing = false;
          Profiles.undoClone();
        }

        for (var i = 0; i < $scope.models.length; ++i) {
          if ($scope.models[i] === model) {
            $scope.models.splice(i, 1);
            selectFirstModel();
          }
        }
      } else {
        // open 'are you sure?' modal
        $scope.modalInstance = $modal.open({
          animation: true,
  		  windowTemplateUrl: 'app/modals/main-template.html',
          templateUrl: 'app/modals/delete/delete.html',
          controller: 'deleteCtrl',
        //   size: 'sm',
          resolve: {
            deleted: function() {
              return model;
            },
            objectType: function() {
              return 'MODEL';
            }
          }
        });

        // delete model
        $scope.modalInstance.result.then(function (model) {
          $scope.loading = true;
          Profiles.deleteModel(model, access)
            .then(function() {
              $scope.loading = false;
              selectFirstModel();
            });
        }, function () {
          // cancelled delete model
          console.log('Cancelled delete');
          $scope.loading = false;
          delete $scope.modalInstance;
        });
      }
    };

    $scope.translate = function(model) {
      Profiles.translate(model, $scope.textToTranslate, access)
        .then(function(body) {
          $scope.textToTranslate = body.text;
          $scope.translation = body.translation;
        });
    };
  });
