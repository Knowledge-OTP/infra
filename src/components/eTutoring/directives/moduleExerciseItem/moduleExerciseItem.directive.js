(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .directive('moduleExerciseItem', function($state, ExerciseStatusEnum, ExerciseTypeEnum, SubjectEnum, ETutoringService, ETutoringViewsConst) {
            'ngInject';
            return {
                scope: {
                    exercise: '=',
                    module: '=',
                    eTutoringView: '&',
                    assignContentType: '&',
                    activeViewObj: '='
                },
                restrict: 'E',
                templateUrl: 'components/eTutoring/components/moduleExerciseItem/moduleExerciseItem.template.html',
                link: function (scope) {
                    scope.exerciseStatusEnum = ExerciseStatusEnum;
                    scope.exerciseTypeEnum = ExerciseTypeEnum;
                    scope.subjectEnum = SubjectEnum;
                    scope.ETutoringViewsConst = ETutoringViewsConst;

                    if (scope.activeViewObj.view === ETutoringViewsConst.PRACTICE) {
                        scope.exerciseParentId = scope.module.guid;
                        ETutoringService.getSubjectDataByExercise(scope.exercise).then(function (subjectData) {
                            scope.subjectIcon = subjectData.iconName;
                            scope.svgWrapperClassName = subjectData.className;
                            scope.subjectId = subjectData.subjectId;
                        });
                    }

                    scope.exerciseTypeId = scope.exercise.exerciseTypeId;
                    scope.exerciseId = scope.exercise.exerciseId;
                    scope.itemsCount = scope.exercise.itemsCount;

                    scope.go = function (module) {
                        $state.go('app.eTutoringWorkout', {
                            exerciseId: scope.exercise.exerciseId,
                            exerciseTypeId: scope.exercise.exerciseTypeId,
                            moduleId: module.moduleId,
                            moduleResultGuid: module.guid,
                            exerciseParentId: scope.exercise.exerciseParentId,
                            assignContentType: scope.assignContentType(),
                            examId: scope.exercise.examId,
                            viewId: scope.activeViewObj.view
                        });
                    };
                }
            };
        });
})(angular);
