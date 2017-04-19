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
  .controller('ProjectsCtrl', function ($scope, $location, $q, $modal, $filter, Profiles, access, Alerts) {
    $scope.loading = true;
    $scope.projects = {};
    $scope.newProject = {};
    $scope.baseModels = {};
    $scope.addProjectCollapsed = true;

    $scope.initialProjectVals = {
      domain: $filter('translate')('projects-select-domain'),
      source: $filter('translate')('projects-select-source-language'),
      target: $filter('translate')('projects-select-target-language')
    };

    $scope.newProjectPanel = {
      domain: $scope.initialProjectVals.domain,
      source: $scope.initialProjectVals.source,
      target: $scope.initialProjectVals.target
    };

    var loadModels = function() {
      $scope.loading = true;
      Profiles.loadProjects(access)
        .then(function(projects) {
            $scope.projects = projects;
            $scope.loading = false;
        });

      Profiles.getBaseModels(access)
        .then(function(baseModels) {
          $scope.baseModels = baseModels;

          for (var domain in baseModels) {
            var d = baseModels[domain];
            $scope.newProject.domain = domain;

            if ($scope.newProjectPanel.domain === $scope.initialProjectVals.domain) {
              $scope.newProjectPanel.domain = domain;
            }

            for (var source in d.sources) {
              var s = d.sources[source];
              $scope.newProject.source = source;

              for (var target in s.targets) {
                var t = s.targets[target];
                $scope.newProject.target = target;
                $scope.newProject.base_model_id = t.model_id;
                break;
              }
              break;
            }
            break;
          }
        });
    };

    loadModels();

    $scope.toggleAddProjectPanel = function() {
      $scope.addProjectCollapsed = !$scope.addProjectCollapsed;
    };

    $scope.sortOpts = [
      {name:$filter('translate')('sort-date-newest-to-oldest'), field: 'models', child: 'status_date', reverse: true},
      {name:$filter('translate')('sort-date-oldest-to-newest'), field: 'models', child: 'status_date'},
      {name:$filter('translate')('sort-name-a-to-z'), field: 'name'},
      {name:$filter('translate')('sort-name-z-to-a'), field: 'name', reverse: true}
    ];
    $scope.sortOption = $scope.sortOpts[0];

    $scope.sortBy = function(option) {
      $scope.sortOption = option;
    };

    $scope.isProjectsEmpty = function() {
      return angular.equals({}, $scope.projects);
    };

    $scope.setUpNewProject = function(prop, val) {
      $scope.newProjectPanel[prop] = val;
      $scope.newProject[prop] = val;

      if (prop === 'domain') {
        $scope.newProjectPanel.source = $scope.initialProjectVals.source;
        $scope.newProject.source = $scope.initialProjectVals.source;
      }

      if (prop === 'domain' || prop === 'source') {
        $scope.newProjectPanel.target = $scope.initialProjectVals.target;
        $scope.newProject.target = $scope.initialProjectVals.target;

        if($scope.newProject.source && $scope.baseModels[$scope.newProject.domain].sources[$scope.newProject.source]) {
            var targets = $scope.baseModels[$scope.newProject.domain].sources[$scope.newProject.source].targets;
            var targetKeys = Object.keys(targets);
            if(targetKeys.length == 1) {
                $scope.newProjectPanel.target = targets[targetKeys[0]].target;
                $scope.newProject.target = targets[targetKeys[0]].target;
            }
        }
      }

      var input = document.getElementById('base-model-option-' + prop);
      if(input) input.focus();
    };

    $scope.selectProject = function(project) {
      Profiles.selectProject(project.name);
      $location.url('models');
    };

    $scope.isNewProjectDefined = function() {
      var d = $scope.newProjectPanel.domain;
      var s = $scope.newProjectPanel.source;
      var t = $scope.newProjectPanel.target;

      if (d !== $scope.initialProjectVals.domain && s !== $scope.initialProjectVals.source && t !== $scope.initialProjectVals.target) {
        d = $scope.newProject.domain;
        s = $scope.newProject.source;
        t = $scope.newProject.target;

        return $scope.newProject.name && d && s && t && $scope.newProject.base_model_id;
      } else {
        return false;
      }
    };

    $scope.addProject = function() {
      var d = $scope.newProjectPanel.domain;
      var s = $scope.newProjectPanel.source;
      var t = $scope.newProjectPanel.target;

      if ($scope.isNewProjectDefined()) {
        // set base_model_id for project
        $scope.newProject.base_model_id = $scope.baseModels[d].sources[s].targets[t].model_id;

        // Check for duplicate project names
        var found = false;

        for (var project in $scope.projects) {
          if (project === $scope.newProject.name) {
            found = true;
            break;
          }
        }

        if (found) {
          // err
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('project-error-name-found')});
        } else {
          Profiles.addProject($scope.newProject);
          $location.url('models');
        }
      } else {
        // err
        Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('project-error-create')});
      }
    };

    $scope.deleteProject = function(project) {
      // open 'are you sure?' modal
      $scope.modalInstance = $modal.open({
        animation: true,
        templateUrl: 'app/modals/delete/delete.html',
		windowTemplateUrl: 'app/modals/main-template.html',
        controller: 'deleteCtrl',
        // size: 'sm',
        resolve: {
          deleted: function() {
            return project;
          },
          objectType: function() {
            return 'PROJECT';
          }
        }
      });

      // delete project
      $scope.modalInstance.result.then(function (project) {
        project.deleting = true;
        Profiles.deleteProject(project, access);
      }, function () {
        // cancelled delete project
        console.log('Cancelled delete');
        delete $scope.modalInstance;
      });
    };

    $scope.startEdit = function(project) {
      project.editing = true;
      project.newName = project.name;
    };

    $scope.endEdit = function(project) {
      project.name = project.newName ? project.newName : project.name;
      delete project.editing;
    };

    $scope.applyChanges = function(project) {
      if (project.newName === project.name || project.newName === undefined) {
        // name not changed or undefined
        $scope.endEdit(project);
      } else {
        var found = false;

        for (var p in $scope.projects) {
          if (project.newName === p) {
            found = true;
            break;
          }
        }

        if (!found) {
          Profiles.updateProject(project, access)
            .then($scope.endEdit(project));
        } else {
          // err
          console.log('Project not updated: Duplicate name found');
          Alerts.publish({scope: 'global', type: 'error', message: $filter('translate')('project-error-duplicate-name')});
        }
      }
    };

  });

angular.module('mtTrainingApp').controller('ProjectCtrl', function ($scope, $filter) {
    $scope.modelDetails = {
        domain: $filter('toDomain')($scope.project.domain),
        from: $filter('toCountry')($scope.project.source),
        to: $filter('toCountry')($scope.project.target)
    }
});
