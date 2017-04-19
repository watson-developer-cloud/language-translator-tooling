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
  .controller('TestCtrl', function ($scope, $timeout, $filter, $location, $stateParams, Profiles, statuses, access) {
    $scope.loading = true;
    $scope.statuses = statuses;

    $scope.viewModel = function() {
        Profiles.selectProject($scope.selectedModel.project);
        $location.url('models/' + $scope.selectedModel.name);
    };

    var loadModels = function() {
      $scope.loading = true;
      Profiles.loadProjects(access)
        .then(function(projects) {
          $scope.loading = false;
          $scope.projects = projects;
          selectFirstModel();
        });
    };

    var selectFirstModel = function() {
      var found = false;

      for (var project in $scope.projects) {
        if ($scope.projects.hasOwnProperty(project)) {
          if ($scope.projects[project].models.length > 0) {

            if ($stateParams.modelName) {

              for (var i = 0; i < $scope.projects[project].models.length; i++) {
                if ($stateParams.modelName === $scope.projects[project].models[i].name)
                  $scope.selectedModel = $scope.projects[project].models[i];
              }
            } else {
              $scope.selectedModel = $scope.projects[project].models[0];
            }

            $scope.selectedModelDetails = {
                domain: $filter('toDomain')($scope.selectedModel.domain),
                from: $filter('toCountry')($scope.selectedModel.source),
                to: $filter('toCountry')($scope.selectedModel.target)
            }
            found = true;
            break;
          }
        }
      }
    };

    loadModels();

    $scope.clearTranslation = function() {
      delete $scope.textToTranslate;
      delete $scope.translation;
    };

    $scope.resetTranslation = function() {
      delete $scope.translation;
    };

    $scope.filterProject = function(project) {
      if ($scope.filterText) {
        var lowercaseFilter = $scope.filterText.toLowerCase();
        if (project.name.toLowerCase().indexOf(lowercaseFilter) > -1 ||
            project.domain.toLowerCase().indexOf(lowercaseFilter) > -1 ||
            $filter('translate')("lang-" + project.source).toLowerCase().indexOf(lowercaseFilter) > -1 ||
            $filter('translate')("lang-" + project.target).toLowerCase().indexOf(lowercaseFilter) > -1) {
          return project;
        } else {
          for (var i = 0; i < project.models.length; ++i) {
            var m = project.models[i];

            if (m.name.toLowerCase().indexOf(lowercaseFilter) > -1 ||
                m.description.toLowerCase().indexOf(lowercaseFilter) > -1 ||
                m.status.toLowerCase().indexOf(lowercaseFilter) > -1) {
              return project;
            }
          }
        }
      } else {
        return project;
      }
    };

    $scope.filterSelectedProject = function(project) {
      if ($scope.selectedProject) {
        if (project.name === $scope.selectedProject) {
          return project;
        }
      } else {
        return project;
      }
    };

    $scope.selectProject = function(project) {
      if (project) {
        $scope.selectedProject = project.name;
      } else {
        delete $scope.selectedProject;
      }
    };

    $scope.filterModel = function(model) {
      if ($scope.filterText) {
        var lowercaseFilter = $scope.filterText.toLowerCase();
        if (model.name.toLowerCase().indexOf(lowercaseFilter) > -1 ||
            model.description.toLowerCase().indexOf(lowercaseFilter) > -1 ||
            model.domain.toLowerCase().indexOf(lowercaseFilter) > -1 ||
            model.project.toLowerCase().indexOf(lowercaseFilter) > -1 ||
            $filter('translate')("lang-" + model.source).toLowerCase().indexOf(lowercaseFilter) > -1 ||
            $filter('translate')("lang-" + model.target).toLowerCase().indexOf(lowercaseFilter) > -1 ||
            model.status.toLowerCase().indexOf(lowercaseFilter) > -1) {
          return model;
        }
      } else {
        return model;
      }
    };

    $scope.select = function(model) {
      $scope.selectedModel = model;
      $scope.selectedModelDetails = {
          domain: $filter('toDomain')($scope.selectedModel.domain),
          from: $filter('toCountry')($scope.selectedModel.source),
          to: $filter('toCountry')($scope.selectedModel.target)
      }
      $scope.showModelsList = false;
      $scope.resetTranslation();
    };

    $scope.toggleModels = function() {
      $scope.showModelsList = !$scope.showModelsList;
    };

    $scope.isSelected = function(model) {
      if(!model || !$scope.selectedModel) return false;
      return $scope.selectedModel.custom_model_id === model.custom_model_id;
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

    $scope.translate = function(model) {
      $scope.translating = true;
      Profiles.translate(model, $scope.textToTranslate, access)
        .then(
            function(body) {
                $scope.translating = false;
                if(body) {
                    $scope.textToTranslate = body.text;
                    $scope.translation = body.translation;
                }
            }
        );
    };
  });
