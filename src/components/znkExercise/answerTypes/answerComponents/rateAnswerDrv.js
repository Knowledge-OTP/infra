
/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('rateAnswer', ['ZnkExerciseViewModeEnum',
        function (ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/rateAnswerDrv.html',
                require: ['^answerBuilder', '^ngModel'],
                scope: {},
                link: function link(scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var viewMode = answerBuilder.getViewMode();
                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum;

                    scope.d = {};
                    scope.d.itemsArray = new Array(11);
                    scope.d.answers = answerBuilder.question.correctAnswerText;

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
                                    updateItemsByCorrectAnswers(scope.d.answers);
                                } else {
                                    scope.clickHandler = clickHandler;
                                }
                            }
                        }
                    );

                    function clickHandler(index) {
                        if (scope.d.selectedItem) {
                            scope.d.selectedItem.removeClass('selected');
                        }

                        scope.d.selectedItem = angular.element(domItemsArray[index]);
                        scope.d.selectedItem.addClass('selected');
                        ngModelCtrl.$setViewValue(index);

                        if (viewMode === MODE_ANSWER_WITH_QUESTION) {
                            updateItemsByCorrectAnswers(scope.d.answers);
                            scope.clickHandler = angular.noop;
                        }
                    }

                    function updateItemsByCorrectAnswers(correctAnswersArr) {
                        var selectedAnswerId = ngModelCtrl.$viewValue;

                        var lastElemIndex = correctAnswersArr.length - 1;

                        for (var i = 0; i < lastElemIndex; i++) {
                            angular.element(domItemsArray[correctAnswersArr[i].id]).addClass('correct');
                        }
                        angular.element(domItemsArray[correctAnswersArr[lastElemIndex].id]).addClass('correct-edge');

                        if (angular.isNumber(selectedAnswerId)) {
                            if (selectedAnswerId >= correctAnswersArr[0].id && selectedAnswerId <= correctAnswersArr[lastElemIndex].id) {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-correct');
                            } else {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-wrong');
                            }
                        }
                    }
                }
            };
        }
    ]);
})(angular);


