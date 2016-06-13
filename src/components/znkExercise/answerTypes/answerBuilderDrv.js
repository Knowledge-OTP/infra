/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    var typeToViewMap;
    angular.module('znk.infra.znkExercise').directive('answerBuilder', [
        '$compile', 'AnswerTypeEnum', 'ZnkExerciseUtilitySrv', 'ZnkExerciseViewModeEnum',
        function ($compile, AnswerTypeEnum, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum) {
            if(!typeToViewMap) {
                typeToViewMap = {};
                angular.forEach(AnswerTypeEnum, function (enumData, enumName) {
                    var directiveName = enumName.toLowerCase().replace('_', '-');
                    typeToViewMap[enumData.enum] = '<' + directiveName + '></' + directiveName + '>';
                });
            }

            return {
                require: ['answerBuilder','^questionBuilder', '^ngModel'],
                restrict: 'E',
                controller:[
                    function(){

                    }
                ],
                link: {
                    pre:function (scope, element, attrs, ctrls) {
                        var answerBuilderCtrl = ctrls[0];
                        var questionBuilderCtrl = ctrls[1];
                        var ngModelCtrl = ctrls[2];

                        var fnToBindFromQuestionBuilder = ['getViewMode', 'getCurrentIndex'];
                        ZnkExerciseUtilitySrv.bindFunctions(answerBuilderCtrl,questionBuilderCtrl,fnToBindFromQuestionBuilder);

                        answerBuilderCtrl.canUserAnswerBeChanged = function(){
                            var viewMode = questionBuilderCtrl.getViewMode();
                            var isntReviewMode = viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                            var notAnswered = angular.isDefined(ngModelCtrl.$viewValue);
                            var isAnswerWithResultViewMode = viewMode === ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                            return isntReviewMode && isAnswerWithResultViewMode && notAnswered;
                        };

                        answerBuilderCtrl.question = questionBuilderCtrl.question;

                        var answerType = questionBuilderCtrl.question.answerTypeId;
                        var answerHtml = typeToViewMap[answerType];
                        element.html(answerHtml);
                        $compile(element.contents())(scope);
                    }
                }
            };
        }
    ]);
})(angular);
