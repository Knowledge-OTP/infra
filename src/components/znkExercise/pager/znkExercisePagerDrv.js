/**
 * attrs:
 *  questions
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercisePager', [
        '$timeout', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum', 'QuestionTypesSrv',
        function ($timeout, ZnkExerciseEvents, ZnkExerciseViewModeEnum, QuestionTypesSrv) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExercisePagerDrv.html',
                restrict: 'E',
                require: ['ngModel', '^znkExercise'],
                scope: {
                    questions: '<'
                },
                link: {
                    pre: function (scope, element, attrs, ctrls) {
                        var ngModelCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var currViewMode = znkExerciseCtrl.getViewMode();

                        var domElement = element[0];

                        scope.d = {};

                        scope.d.tap = function (newIndex) {
                            znkExerciseCtrl.setCurrentIndex(newIndex);
                        };

                        function getPagerItemByIndex(index) {
                            return angular.element(domElement.querySelectorAll('.pager-item')[index]);
                        }

                        function setPagerItemBookmarkStatus(index, status) {
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
                            if (status) {
                                pagerItemElement.addClass('bookmark');
                            } else {
                                pagerItemElement.removeClass('bookmark');
                            }
                        }

                        function setPagerItemAnswerClassValidAnswerWrapper(question, index) {
                            var userAnswer = question.__questionStatus.userAnswer;
                            var answerTypeId = question.answerTypeId;
                            var currIndex = index || question.__questionStatus.index;
                            
                            QuestionTypesSrv.checkAnswerAgainstFormatValidtors(userAnswer, answerTypeId, function() {               
                                setPagerItemAnswerClass(currIndex, question); 
                            }, function() {
                                 var pagerItemElement = getPagerItemByIndex(currIndex);
                                 pagerItemElement.removeClass('neutral correct wrong');  
                            }, question);
                        }

                        function setPagerItemAnswerClass(index, question) {
                            var pagerItemElement = getPagerItemByIndex(index);

                            if (angular.isUndefined(question.__questionStatus.userAnswer)) {
                                pagerItemElement.removeClass('neutral correct wrong');
                                return;
                            }

                            if (currViewMode === ZnkExerciseViewModeEnum.ONLY_ANSWER.enum || question.manualEvaluation) {
                                pagerItemElement.addClass('neutral');
                                return;
                            }

                            if (question.__questionStatus.isAnsweredCorrectly) {
                                pagerItemElement.addClass('correct');
                            } else {
                                pagerItemElement.addClass('wrong');
                            }
                        }

                        ngModelCtrl.$render = function () {
                            var currentSlide = +ngModelCtrl.$viewValue;
                            if (isNaN(currentSlide)) {
                                return;
                            }
                            //added in order to prevent the swipe lag
                            $timeout(function () {
                                var i;
                                var $pagerItemWithCurrentClass = angular.element(domElement.querySelectorAll('.pager-item.current'));
                                for (i in $pagerItemWithCurrentClass) {
                                    $pagerItemWithCurrentClass.eq(i).removeClass('current');
                                }
                                var pagerItemsDomElement = domElement.querySelectorAll('.pager-item');
                                var currentSlideDom = angular.element(pagerItemsDomElement[currentSlide]);
                                currentSlideDom.addClass('current');

                                for (i in scope.questions) {
                                    var question = scope.questions[i];
                                    setPagerItemBookmarkStatus(i, question.__questionStatus.bookmark);
                                    setPagerItemAnswerClassValidAnswerWrapper(question, i);
                                }

                                var parentDomElementWidth = domElement.parentElement.offsetWidth;
                                var activeItem = domElement.querySelectorAll('.current')[0];
                                var centerAlignment = activeItem.offsetWidth / 2;
                                var scrollActiveItem = activeItem.offsetLeft + centerAlignment;
                                var offset = parentDomElementWidth - 210 - scrollActiveItem;
                                scope.scrollActions.animate(offset, 100, 'ease-in-out');
                            });
                        };

                        scope.$on(ZnkExerciseEvents.BOOKMARK, function (evt, question) {
                            setPagerItemBookmarkStatus(question.__questionStatus.index, question.__questionStatus.bookmark);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function (evt, question) {
                            setPagerItemAnswerClassValidAnswerWrapper(question);
                        });

                        function init() {
                            //wait for the pager items to be rendered
                            $timeout(function () {
                                ngModelCtrl.$render();
                            }, false);
                        }

                        scope.$watch(function () {
                            var questions = scope.questions;

                            if (!questions) {
                                questions = [];
                            }

                            var watchExpr = '';
                            questions.forEach(function (question) {
                                watchExpr += +(!!(question.__questionStatus && question.__questionStatus.userAnswer));
                            });
                            return watchExpr;
                        }, function (newVal, oldVal) {
                            if (!angular.equals(newVal, oldVal)) {
                                init();
                            }
                        });
                    }
                }
            };
        }
    ]);
})(angular);

