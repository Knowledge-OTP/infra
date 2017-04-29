(function (angular) {
    'use strict';

    angular.module('demo')
        .config(function (exerciseTypeConst, ZnkExerciseSrvProvider) {
            var allowedTimeForQuestionByExercise = {};
            allowedTimeForQuestionByExercise[exerciseTypeConst.TUTORIAL] = 1.5 * 60 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.DRILL] = 40 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.PRACTICE] = 40 * 1000;
            ZnkExerciseSrvProvider.setAllowedTimeForQuestionMap(allowedTimeForQuestionByExercise);
        })
        .config(function (QuestionTypesSrvProvider) {
            var map = {
                1: '<div>question Type 1</div><span>{{$parent.questionGetter().id}}</span>' +
                '<div compile="$parent.questionGetter().content"></div>' +
                '<div ng-if="$parent.questionGetter().exerciseTypeId===13">' +
                '<img ng-src="{{$parent.$parent.questionGetter().fileUrl}}" style="max-width: 100%;height: auto;">' +
                '</div>' +
                '<answer-builder></answer-builder>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);

            function questionTypeGetter() {
                return '1';
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);
        })
        .component('selectAnswer', {
            template: '<div>{{$ctrl.ngModel.$viewValue || "empty"}}</div><div ng-click="$ctrl.ngModel.$setViewValue(1)">Set</div>',
            require: {
                ngModel: '^ngModel'
            }
        });
})(angular);
