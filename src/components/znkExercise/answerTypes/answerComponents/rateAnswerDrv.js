
/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('rateAnswer', ['ZnkExerciseViewModeEnum',
        '$timeout', 'ZnkExerciseViewModeEnum',
        function (ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/rateAnswerDrv.html',
                require: ['^answerBuilder', '^ngModel'],
                scope: {},
                link: function link(scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    scope.d = {};

                    scope.d.answers = answerBuilder.question.answers;
                    scope.d.startIndex = answerBuilder.question.answers[0].id; // @todo is this the right start index ?


                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;

                    // ******************  mock *************////////

                    var correctAnswers = [{id: 4}, {id: 5}, {id: 6}];
                    var selectedIndex = 0;      // need to sync with ng-model
                    var viewMode = MODE_ANSWER_WITH_QUESTION;

                    // ******************  mock *************////////

                    var domItemsArray;

                    var destroyWatcher = scope.$watch(
                        function () {
                            return element[0].querySelectorAll('.item-repeater');
                        },
                        function (val) {
                            if (val) {
                                destroyWatcher();
                                domItemsArray = val;

                                if (viewMode === MODE_REVIEW) {
                                    scope.clickHandler = angular.noop;
                                    updateItemsByCorrectAnswers(correctAnswers);
                                } else {
                                    scope.clickHandler = clickHandler;
                                }
                            }
                        }
                    );

                    function clickHandler(answer, index) {
                        if (scope.d.selectedItem) {
                            scope.d.selectedItem.removeClass('selected');
                        }

                        scope.d.selectedItem = angular.element(domItemsArray[index]);
                        scope.d.selectedItem.addClass('selected');
                        ngModelCtrl.$setViewValue(answer.id);

                        if (viewMode === MODE_ANSWER_WITH_QUESTION) {
                            updateItemsByCorrectAnswers(correctAnswers);
                            scope.clickHandler = angular.noop;
                        }
                    }

                    function updateItemsByCorrectAnswers(correctAnswersArr) {
                        var selectedAnswerId = ngModelCtrl.$viewValue;

                        var lastElemIndex = correctAnswersArr.length - 1;

                        for (var i = 0; i < lastElemIndex; i++) {
                            angular.element(domItemsArray[correctAnswersArr[i]]).addClass('correct');
                        }
                        angular.element(domItemsArray[correctAnswersArr[lastElemIndex]]).addClass('correct-edge');

                        if (selectedAnswerId) {
                            if (selectedAnswerId >= correctAnswersArr[0].id && selectedAnswerId <= correctAnswersArr[lastElemIndex].id) {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-correct');
                            } else {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-wrong');
                            }
                        }
                    }
                }
            }
        }
    ]);
})(angular);


