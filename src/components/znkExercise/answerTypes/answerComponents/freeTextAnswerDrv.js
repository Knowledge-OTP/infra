/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswer', ['ZnkExerciseViewModeEnum', '$timeout',

        function (ZnkExerciseViewModeEnum, $timeout) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/freeTextAnswerDrv.html',
                require: ['^ngModel', '^answerBuilder'],
                scope:{},
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0];
                    var answerBuilderCtrl = ctrls[1];

                    scope.d = {};

                    var MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;

                    var regex = /(?: |^)\d*\.?\d+(?: |$)|(?: |^)\d*\/?\d+(?: |$)/;
                    scope.clickHandler = function(userAnswer){
                        if ((!regex.test(userAnswer))) {
                            return;
                        }
                        if(regex.test(userAnswer)){
                            ngModelCtrl.$setViewValue(userAnswer);
                            updateViewByCorrectAnswers(userAnswer);
                        } else {
                            // todo: user answer invalid
                        }
                    };

                    function updateViewByCorrectAnswers(userAnswer) {
                        var correctAnswers = answerBuilderCtrl.question.correctAnswerText;
                        var viewMode = answerBuilderCtrl.getViewMode();
                        scope.correctAnswer = correctAnswers[0].content;

                        if (viewMode === MODE_ANSWER_ONLY || viewMode === MODE_MUST_ANSWER) {
                            scope.d.userAnswer = angular.isDefined(userAnswer) ? userAnswer : '';
                            scope.showCorrectAnswer = false;
                        } else {

                            if (angular.isUndefined(userAnswer)) {
                                // unanswered question
                                    scope.userAnswerStatus = 'neutral';
                                    scope.showCorrectAnswer = viewMode === MODE_REVIEW;
                            } else {
                                if (_isAnswerdCorrectly(userAnswer, correctAnswers)) {
                                    scope.userAnswerStatus = 'correct';
                                } else {
                                    scope.userAnswerStatus = 'wrong';
                                }
                                scope.showCorrectAnswer = true;
                                scope.d.userAnswer = userAnswer;
                            }
                        }
                    }

                    function _isAnswerdCorrectly(userAnswer,correctAnswers) {
                        for (var i = 0; i < correctAnswers.length; i++) {
                            if (userAnswer === correctAnswers[i].content) {
                                return true;
                            }
                        }
                        return false;
                    }

                    ngModelCtrl.$render = function () {
                        //skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function(){
                            updateViewByCorrectAnswers(ngModelCtrl.$viewValue);
                        });
                    };

                    ngModelCtrl.$render();
                }
            };
        }
    ]);
})(angular);

