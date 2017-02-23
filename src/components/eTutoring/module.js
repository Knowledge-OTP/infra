(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring',[])
        .config(function ($stateProvider) {
            'ngInject';
            $stateProvider
                .state('app.eTutoring', {
                    url: '/etutoring/?moduleId/?viewId',
                    templateUrl: 'components/eTutoring/templates/eTutoring.template.html',
                    controller: 'ETutoringController',
                    controllerAs: 'vm',
                    reloadOnSearch: false,
                    resolve: {
                        diagnosticData: function (WorkoutsDiagnosticFlow) {
                            return WorkoutsDiagnosticFlow.getDiagnostic().then(function (result) {
                                return (result.isComplete) ? result.isComplete : false;
                            });
                        }
                    }
                })
                .state('app.eTutoringWorkout', {
                    url: '/workout?exerciseId/?exerciseTypeId/?moduleId/?exerciseParentId/?assignContentType/?examId/?moduleResultGuid/?viewId',
                    templateUrl: 'components/eTutoring/templates/eTutoringWorkout.template.html',
                    controller: 'ETutoringWorkoutController',
                    controllerAs: 'vm',
                    resolve: {
                        exerciseData: function ($stateParams, ExerciseParentEnum, $state) {
                            'ngInject';  // jshint ignore:line

                            var exerciseId = angular.isDefined($stateParams.exerciseId) ? +$stateParams.exerciseId : 1;
                            var exerciseTypeId = angular.isDefined($stateParams.exerciseTypeId) ? +$stateParams.exerciseTypeId : 1;
                            var assignContentType = angular.isDefined($stateParams.assignContentType) ? +$stateParams.assignContentType : 1;
                            var moduleId = $stateParams.moduleId;
                            var moduleResultGuid = $stateParams.moduleResultGuid;
                            var viewId = $stateParams.viewId;
                            return {
                                exerciseId,
                                exerciseTypeId,
                                assignContentType,
                                exerciseParentId: moduleId,
                                moduleResultGuid: moduleResultGuid,
                                exerciseParentTypeId: ExerciseParentEnum.MODULE.enum,
                                examId: +$stateParams.examId,
                                exitAction: function () {
                                    $state.go('app.eTutoring', {moduleId: moduleId, viewId: viewId});
                                }
                            };
                        }
                    }
                });
        });
})(angular);
