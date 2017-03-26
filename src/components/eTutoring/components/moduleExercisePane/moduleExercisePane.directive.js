(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .directive('moduleExercisePane', function(SubjectEnum, ExerciseTypeEnum, AssignContentEnum, ETutoringViewsConst, $log,
                                           LiveSessionSubjectEnum, DueDateSrv, ExerciseStatusEnum) {
            'ngInject';
            return {
                scope: {
                    showLoading: '=',
                    module: '=',
                    activeViewObj: '='
                },
                restrict: 'E',
                template: '<div ng-include="templateName" class="ng-include-module-exercise-pane"> </div>',
                link: function (scope) {
                    var templatesPath = 'components/eTutoring/components/moduleExercisePane/';
                    scope.subjectEnumMap = SubjectEnum.getEnumMap();
                    scope.subjectEnum = SubjectEnum;
                    scope.exerciseTypeEnum = ExerciseTypeEnum;
                    scope.exerciseStatusEnum = ExerciseStatusEnum;
                    scope.assignContentEnum = AssignContentEnum;
                    scope.eTutoringViewsConst = ETutoringViewsConst;
                    scope.LiveSessionSubjectEnum = LiveSessionSubjectEnum;
                    scope.dueDateUtility = DueDateSrv;
                    scope.hasModule = false;

                    if (scope.activeViewObj.view) {
                        _setTemplateNameByView(scope.activeViewObj.view);
                    }

                    function _setTemplateNameByView(view) {
                        var templateName;
                        switch (view) {
                            case AssignContentEnum.LESSON.enum:
                                templateName = 'lessonsPane.template.html';
                                scope.svgIcon = angular.isDefined(scope.module) ? SubjectEnum.getValByEnum(scope.module.subjectId) + '-icon' : '';
                                break;
                            case AssignContentEnum.PRACTICE.enum:
                                templateName = 'homeworkPane.template.html';
                                scope.svgIcon = angular.isDefined(scope.module) ? LiveSessionSubjectEnum.getValByEnum(scope.module.topicId) + '-topic-icon' : '';
                                break;
                            default:
                                break;
                        }
                        scope.hasModule = angular.isDefined(scope.module) && (!angular.equals(scope.module, {}));
                        scope.templateName = templatesPath + templateName;
                    }

                    scope.$watch('activeViewObj.view', function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            _setTemplateNameByView(newVal);
                        }
                    });

                    scope.$watch('module', function (newVal, oldVal) {
                        $log.debug('moduleExercisePaneDirective', newVal);
                        if (newVal !== oldVal) {
                            _setTemplateNameByView(scope.activeViewObj.view);
                        }
                    });
                }
            };
        });
})(angular);
