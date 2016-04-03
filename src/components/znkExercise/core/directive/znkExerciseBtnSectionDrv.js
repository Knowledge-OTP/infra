/**
 * attrs:
 *  prev-question
 *  next-question
 *  onDone
 *  questionsGetter
 *  actions:
 *      forceDoneBtnDisplay:
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseBtnSection', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum', '$q', 'ZnkExerciseSlideDirectionEnum',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents, ZnkExerciseViewModeEnum, $q, ZnkExerciseSlideDirectionEnum) {
            return {
                restrict: 'E',
                scope: {
                    prevQuestion: '&?',
                    nextQuestion: '&?',
                    onDone: '&',
                    questionsGetter: '&questions',
                    actions: '='
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
                        function _setCurrentQuestionIndex(index){
                            scope.vm.currentQuestionIndex = index || 0;
                        }

                        function _notReviewMode() {
                            return viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                        }

                        function _isLastQuestion(index, questions) {
                            return index && index === (questions.length - 1);
                        }

                        function _getDoneBtnDisplayStatus() {
                            var doneBtnStatus = false;
                            var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                            var areAllQuestionsAnsweredProm = znkExerciseDrvCtrl.areAllQuestionsAnswered();
                            return $q.all([getQuestionsProm, areAllQuestionsAnsweredProm]).then(function (results) {
                                if(isDoneBtnDisplayForced){
                                    return doneBtnDisplayForcedValue;
                                }
                                var questions = results[0];
                                var areAllQuestionsAnswered = results[1];

                                var currIndex = znkExerciseDrvCtrl.getCurrentIndex();

                                if (_notReviewMode() && (_isLastQuestion(currIndex, questions) || areAllQuestionsAnswered)) {
                                    doneBtnStatus = true;
                                }

                                return doneBtnStatus;
                            });
                        }

                        function _determineDoneBtnDisplayStatus() {
                            _getDoneBtnDisplayStatus().then(function(doneBtnStatus) {
                                if (doneBtnStatus) {
                                    _setDoneBtnStatus(true);
                                } else {
                                    _setDoneBtnStatus(false);
                                }
                            });
                        }

                        function _clickedEnterDoneBtn() {
                            _getDoneBtnDisplayStatus().then(function(doneBtnStatus) {
                                if (doneBtnStatus) {
                                    scope.onDone();
                                }
                            });
                        }

                        function _setDoneBtnStatus(showDoneBtn){
                            scope.vm.showDoneButton = !!showDoneBtn;

                            var znkExerciseElement = znkExerciseDrvCtrl.getElement();
                            if(showDoneBtn){
                                znkExerciseElement.addClass('done-btn-show');
                            }else{
                                znkExerciseElement.removeClass('done-btn-show');
                            }
                        }

                        function init(){
                            znkExerciseDrvCtrl.getQuestions().then(function (questions) {
                                scope.vm.maxQuestionIndex = questions.length - 1;
                            });
                            _setCurrentQuestionIndex(znkExerciseDrvCtrl.getCurrentIndex());
                        }

                        var viewMode = znkExerciseDrvCtrl.getViewMode();

                        scope.vm = {};

                        if(!scope.actions){
                            scope.actions = {};
                        }

                        var isDoneBtnDisplayForced;
                        var doneBtnDisplayForcedValue;
                        scope.actions.forceDoneBtnDisplay = function(display){
                            isDoneBtnDisplayForced = display === false || display === true;

                            if(isDoneBtnDisplayForced){
                                doneBtnDisplayForcedValue = display;
                                _setDoneBtnStatus(display);
                            }else{
                                _determineDoneBtnDisplayStatus();
                            }
                        };

                        init();

                        scope.vm.prevQuestion = function () {
                            scope.prevQuestion();
                        };

                        scope.vm.nextQuestion = function () {
                            scope.nextQuestion();
                        };

                        znkExerciseDrvCtrl.notifyBtnSectionReady();

                        scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                            _setCurrentQuestionIndex(newIndex);
                            _determineDoneBtnDisplayStatus(newIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            _determineDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED, function(evt, newQuestionNum){
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            scope.vm.maxQuestionIndex = newQuestionNum - 1;
                            _determineDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.SLIDE_DIRECTION_CHANGED, function(evt, newDirection){
                            var slideDirectionEnum = ZnkExerciseSlideDirectionEnum.getNameToEnumMap();
                            switch(newDirection){
                                case slideDirectionEnum.NONE:
                                    scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = false;
                                    break;
                                case slideDirectionEnum.LEFT:
                                    scope.vm.slideLeftAllowed = true;
                                    scope.vm.slideRightAllowed = false;
                                    break;
                                case slideDirectionEnum.RIGHT:
                                    scope.vm.slideLeftAllowed = false;
                                    scope.vm.slideRightAllowed = true;
                                    break;
                                default:
                                    scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = true;
                                    break;
                            }
                        });

                        function keyboardClickCB(e){
                            var LEFT_ARROW_KEY = 37;
                            var RIGHT_ARROW_KEY = 39;
                            var ENTER_KEY = 13;

                            switch(e.keyCode){
                                case LEFT_ARROW_KEY:
                                    scope.vm.prevQuestion();
                                    break;
                                case RIGHT_ARROW_KEY:
                                    scope.vm.nextQuestion();
                                    break;
                                case ENTER_KEY:
                                    _clickedEnterDoneBtn();
                                    break;
                            }
                        }
                        var body = document.body;
                        body.addEventListener('keydown',keyboardClickCB);

                        var currentQuestionAnsweredWatchFn;
                        if(_notReviewMode()){
                            currentQuestionAnsweredWatchFn = function(){
                                return znkExerciseDrvCtrl.isCurrentQuestionAnswered();
                            };
                            scope.$watch(currentQuestionAnsweredWatchFn,function(isAnswered){
                                scope.vm.isCurrentQuestionAnswered = !!isAnswered;
                            });
                        }

                        scope.$on('$destroy',function(){
                            body.removeEventListener('keydown',keyboardClickCB);
                        });
                    }
                }
            };
        }
    ]);
})(angular);

