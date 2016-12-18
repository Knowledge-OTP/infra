(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseReviewBtnSection', [
        'ZnkExerciseViewModeEnum', 'SessionSrv',
        function (ZnkExerciseViewModeEnum, SessionSrv) {
            return {
                restrict: 'E',
                scope: {
                    showBtn: '='
                        // prevQuestion: '&?',
                        // nextQuestion: '&?',
                        // onDone: '&',
                        // questionsGetter: '&questions',
                        // actions: '='
                },
                require: '^znkExercise',
                templateUrl: "components/znkExercise/core/template/znkExerciseReviewSectionBtnTemplate.html",
                link: {
                    pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                        SessionSrv.getLiveSessionGUID().then(function (res) {
                            function _isReviewMode() {
                                return viewMode === ZnkExerciseViewModeEnum.REVIEW.enum;
                            }
                            var viewMode = znkExerciseDrvCtrl.getViewMode();
                            scope.showBtn = !!(res.guid) || (_isReviewMode());
                            console.log(scope.showBtn);
                        });
                    }
                }
                // link: {
                //     pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                //         function _setCurrentQuestionIndex(index) {
                //             scope.vm.currentQuestionIndex = index || 0;
                //         }

                //         function _notReviewMode() {
                //             return viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                //         }

                //         function _isLastQuestion(index, questions) {
                //             return angular.isDefined(index) && index === (questions.length - 1);
                //         }

                //         function _determineDoneBtnDisplayStatus() {
                //             var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                //             var areAllQuestionsAnsweredProm = znkExerciseDrvCtrl.areAllQuestionsAnswered();
                //             $q.all([getQuestionsProm, areAllQuestionsAnsweredProm]).then(function (results) {
                //                 if (isDoneBtnDisplayForced) {
                //                     return;
                //                 }
                //                 var questions = results[0];
                //                 var areAllQuestionsAnswered = results[1];

                //                 var currIndex = znkExerciseDrvCtrl.getCurrentIndex();

                //                 if (_notReviewMode() && (_isLastQuestion(currIndex, questions) || areAllQuestionsAnswered)) {
                //                     _setDoneBtnStatus(true);
                //                 } else {
                //                     _setDoneBtnStatus(false);
                //                 }
                //             });
                //         }

                //         function _setDoneBtnStatus(showDoneBtn) {
                //             scope.vm.showDoneButton = !!showDoneBtn;

                //             var znkExerciseElement = znkExerciseDrvCtrl.getElement();
                //             if (showDoneBtn) {
                //                 znkExerciseElement.addClass('done-btn-show');
                //             } else {
                //                 znkExerciseElement.removeClass('done-btn-show');
                //             }
                //         }

                //         function init() {
                //             znkExerciseDrvCtrl.getQuestions().then(function (questions) {
                //                 scope.vm.maxQuestionIndex = questions.length - 1;
                //             });
                //             _setCurrentQuestionIndex(znkExerciseDrvCtrl.getCurrentIndex());
                //         }

                //         var viewMode = znkExerciseDrvCtrl.getViewMode();

                //         scope.vm = {};

                //         if (!scope.actions) {
                //             scope.actions = {};
                //         }

                //         var isDoneBtnDisplayForced;
                //         scope.actions.forceDoneBtnDisplay = function (display) {
                //             isDoneBtnDisplayForced = display === false || display === true;

                //             if (isDoneBtnDisplayForced) {
                //                 _setDoneBtnStatus(display);
                //             } else {
                //                 _determineDoneBtnDisplayStatus();
                //             }
                //         };

                //         init();

                //         scope.vm.prevQuestion = function () {
                //             scope.prevQuestion();
                //         };

                //         scope.vm.nextQuestion = function () {
                //             scope.nextQuestion();
                //         };

                //         znkExerciseDrvCtrl.notifyBtnSectionReady();

                //         scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                //             _setCurrentQuestionIndex(newIndex);
                //             _determineDoneBtnDisplayStatus(newIndex);
                //         });

                //         scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                //             var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                //             _determineDoneBtnDisplayStatus(currIndex);
                //         });

                //         scope.$on(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED, function (evt, newQuestionNum) {
                //             var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                //             scope.vm.maxQuestionIndex = newQuestionNum - 1;
                //             _determineDoneBtnDisplayStatus(currIndex);
                //         });

                //         scope.$on(ZnkExerciseEvents.SLIDE_DIRECTION_CHANGED, function (evt, newDirection) {
                //             var slideDirectionEnum = ZnkExerciseSlideDirectionEnum.getNameToEnumMap();
                //             switch (newDirection) {
                //                 case slideDirectionEnum.NONE:
                //                     scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = false;
                //                     break;
                //                 case slideDirectionEnum.LEFT:
                //                     scope.vm.slideLeftAllowed = true;
                //                     scope.vm.slideRightAllowed = false;
                //                     break;
                //                 case slideDirectionEnum.RIGHT:
                //                     scope.vm.slideLeftAllowed = false;
                //                     scope.vm.slideRightAllowed = true;
                //                     break;
                //                 default:
                //                     scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = true;
                //                     break;
                //             }
                //         });

                //         function keyboardClickCB(e) {
                //             var LEFT_ARROW_KEY = 37;
                //             var RIGHT_ARROW_KEY = 39;

                //             switch (e.keyCode) {
                //                 case LEFT_ARROW_KEY:
                //                     scope.vm.prevQuestion();
                //                     break;
                //                 case RIGHT_ARROW_KEY:
                //                     scope.vm.nextQuestion();
                //                     break;
                //             }
                //         }
                //         var body = document.body;
                //         body.addEventListener('keyup', keyboardClickCB);

                //         var currentQuestionAnsweredWatchFn;
                //         if (_notReviewMode()) {
                //             currentQuestionAnsweredWatchFn = function () {
                //                 return znkExerciseDrvCtrl.isCurrentQuestionAnswered();
                //             };
                //             scope.$watch(currentQuestionAnsweredWatchFn, function (isAnswered) {
                //                 scope.vm.isCurrentQuestionAnswered = !!isAnswered;
                //             });
                //         }

                //         scope.$on('$destroy', function () {
                //             body.removeEventListener('keyup', keyboardClickCB);
                //         });
                //     }
                // }
            };
        }
    ]);
})(angular);
