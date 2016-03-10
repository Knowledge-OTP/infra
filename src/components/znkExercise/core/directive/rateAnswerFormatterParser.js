
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('rateAnswerFormatterParser', ['AnswerTypeEnum',
        function (AnswerTypeEnum) {
            return {
                require: ['ngModel','questionBuilder'],
                link: function(scope, elem, attrs, ctrls){
                    var ngModelCtrl = ctrls[0];
                    var questionBuilderCtrl = ctrls[1];
                    var answerTypeId = questionBuilderCtrl.question.answerTypeId;

                    if(answerTypeId === AnswerTypeEnum.RATE_ANSWER.enum){
                        var INDEX_OFFSET = 2;
                        ngModelCtrl.$formatters.push(function(answer){
                            return angular.isDefined(answer) ? answer - INDEX_OFFSET : undefined;
                        });
                        ngModelCtrl.$parsers.push(function(index){
                            return angular.isDefined(index) ? index + INDEX_OFFSET : undefined;
                        });

                    }
                }
            };
        }
    ]);
})(angular);

