/**
 * attrs:
 *  prev-question
 *  next-question
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseBtnSection', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum', '$q',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents, ZnkExerciseViewModeEnum, $q) {
            return {
                restrict: 'E',
                scope: {
                    prevQuestion: '&?',
                    nextQuestion: '&?',
                    onDone: '&',
                    questionsGetter: '&questions'
                },
                require: '^znkExercise',
                templateUrl: function () {
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'btnSectionDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'btnSectionMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                link: {
                    pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                        var viewMode = znkExerciseDrvCtrl.getViewMode();

                        scope.vm = {};

                        function _setCurrentQuestionIndex(index){
                            scope.vm.currentQuestionIndex = index || 0;
                        }

                        function _notReviewMode() {
                            return viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                        }

                        function _isLastQuestion(index, questions) {
                            return index && index === (questions.length - 1);
                        }

                        function _setDoneBtnDisplayStatus(currIndex) {
                            var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                            var areAllQuestionsAnsweredProm = znkExerciseDrvCtrl.areAllQuestionsAnswered();
                            $q.all([getQuestionsProm, areAllQuestionsAnsweredProm]).then(function (results) {
                                var questions = results[0];
                                var areAllQuestionsAnswered = results[1];
                                scope.vm.maxQuestionIndex = questions.length - 1;
                                if (_notReviewMode() && (_isLastQuestion(currIndex, questions) || areAllQuestionsAnswered)) {
                                    scope.vm.showDoneButton = true;
                                } else {
                                    scope.vm.showDoneButton = false;
                                }
                            });
                        }

                        function init(){
                            znkExerciseDrvCtrl.getQuestions().then(function (questions) {
                                scope.vm.maxQuestionIndex = questions.length - 1;
                            });
                            _setCurrentQuestionIndex(znkExerciseDrvCtrl.getCurrentIndex());
                        }

                        init();

                        scope.vm.prevQuestion = function () {
                            scope.prevQuestion();
                        };

                        scope.vm.nextQuestion = function () {
                            scope.nextQuestion();
                        };

                        scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                            _setCurrentQuestionIndex(newIndex);
                            _setDoneBtnDisplayStatus(newIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            _setDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED, function(){
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            _setDoneBtnDisplayStatus(currIndex);
                        });

                        function keyboardClickCB(e){
                            var LEFT_ARROW_KEY = 37;
                            var RIGHT_ARROW_KEY = 39;

                            switch(e.keyCode){
                                case LEFT_ARROW_KEY:
                                    scope.vm.prevQuestion();
                                    break;
                                case RIGHT_ARROW_KEY:
                                    scope.vm.nextQuestion();
                                    break;
                            }
                        }
                        var body = document.body;
                        body.addEventListener('keydown',keyboardClickCB);

                        scope.$on('$destroy',function(){
                            body.removeEventListener('keydown',keyboardClickCB);
                        });

                        var currentQuestionAnsweredWatchFn;
                        if(_notReviewMode()){
                            currentQuestionAnsweredWatchFn = function(){
                                return znkExerciseDrvCtrl.isCurrentQuestionAnswered();
                            };
                            scope.$watch(currentQuestionAnsweredWatchFn,function(isAnswered){
                                scope.vm.isCurrentQuestionAnswered = !!isAnswered;
                            });
                        }
                    }
                }
            };
        }
    ]);
})(angular);

