/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('answerBuilder', [
        '$compile', 'AnswerTypeEnum', 'ZnkExerciseUtilitySrv',
        function ($compile, AnswerTypeEnum, ZnkExerciseUtilitySrv) {
            var typeToViewMap = {};

            typeToViewMap[AnswerTypeEnum.SELECT_ANSWER.enum] = '<select-answer></select-answer>';
            typeToViewMap[AnswerTypeEnum.FREE_TEXT_ANSWER.enum] = '<select-answer></select-answer>';

            return {
                require: ['answerBuilder','^questionBuilder'],
                restrict: 'E',
                controller:[
                    function(){

                    }
                ],
                link: {
                    pre:function (scope, element, attrs, ctrls) {
                        var answerBuilderCtrl = ctrls[0];
                        var questionBuilderCtrl = ctrls[1];

                        var fnToBindFromQuestionBuilder = ['getViewMode'];
                        ZnkExerciseUtilitySrv.bindFunctions(answerBuilderCtrl,questionBuilderCtrl,fnToBindFromQuestionBuilder);

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
