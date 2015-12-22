/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    var typeToViewMap = {
        0: '<div select-answer-drv></div>',
        1: '<div free-text-answer-drv></div>'
    };
    angular.module('znk.infra.znkExercise').directive('answersBuilderDrv', [
        '$compile',
        function ($compile) {
            return {
                require: '^simpleQuestion',
                link: function (scope, element, attrs, questionCtrl) {
                    var answerType = questionCtrl.question.answerTypeId;
                    var answerHtml = typeToViewMap[answerType];
                    element.html(answerHtml);
                    $compile(element.contents())(scope);
                }
            };
        }
    ]);
})(angular);
