///**
// * attrs:
// *  questions
// */
//
//(function (angular) {
//    'use strict';
//
//    angular.module('znk.infra.znkExercise').directive('znkExercisePager', [
//        '$timeout', 'SubjectEnum', 'QuestionUtilsSrv', 'ZnkExerciseDrvSrv', 'ZnkExerciseEvents', '$ionicScrollDelegate',
//        function ($timeout, SubjectEnum, QuestionUtilsSrv, ZnkExerciseDrvSrv, ZnkExerciseEvents, $ionicScrollDelegate) {
//            return {
//                templateUrl: 'scripts/exercise/templates/znkExercisePagerDrv.html',
//                restrict: 'E',
//                require: ['ngModel', '^znkExercise'],
//                scope: {},
//                link: {
//                    pre: function (scope, element, attrs, ctrls) {
//                        var ngModelCtrl = ctrls[0];
//                        var znkExerciseCtrl = ctrls[1];
//
//                        var currViewMode = znkExerciseCtrl.getViewMode();
//
//                        var domElement = element[0];
//
//                        scope.d = {};
//
//                        scope.d.tap = function (index) {
//                            znkExerciseCtrl.__changeQuestionResolver().then(function(){
//                                ngModelCtrl.$setViewValue(index);
//                                ngModelCtrl.$render();
//                            });
//                        };
//
//                        function setPagerItemBookmarkStatus(index,status){
//                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
//                            if(status){
//                                pagerItemElement.addClass('bookmark');
//                            }else{
//                                pagerItemElement.removeClass('bookmark');
//                            }
//                        }
//
//                        function setPagerItemAnswerClass(index,question){
//                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
//
//                            if(angular.isUndefined(question.__questionStatus.userAnswer)){
//                                pagerItemElement.removeClass('neutral correct wrong');
//                                return;
//                            }
//
//                            if(question.subjectId === SubjectEnum.SPEAKING.enum || question.subjectId === SubjectEnum.WRITING.enum || ZnkExerciseDrvSrv.viewModeEnum.answerOnly.enum === currViewMode){
//                                pagerItemElement.addClass('neutral');
//                                return;
//                            }
//
//                            if(QuestionUtilsSrv.isAnswerCorrect(question,question.__questionStatus)){
//                                pagerItemElement.addClass('correct');
//                            }else{
//                                pagerItemElement.addClass('wrong');
//                            }
//                        }
//
//                        function setScroll(currentSlideDom) {
//                            var delegate = $ionicScrollDelegate.$getByHandle('znk-pager');
//                            var domElement = currentSlideDom[0];
//                            var parent = domElement.offsetParent;
//                            var res = (domElement.offsetLeft + domElement.scrollWidth) - (parent) ? parent.clientWidth : 0;
//                            if (res > 0) {
//                                delegate.scrollTo(res + domElement.scrollWidth, 0, true);
//                            } else {
//                                delegate.scrollTo(0, 0, true);
//                            }
//                        }
//
//                        scope.$on(ZnkExerciseEvents.BOOKMARK,function(evt,question){
//                            setPagerItemBookmarkStatus(question.__questionStatus.index,question.__questionStatus.bookmark);
//                        });
//
//                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED,function(evt,question){
//                            setPagerItemAnswerClass(question.__questionStatus.index,question);
//                        });
//
//                        var watchDestroyer = scope.$parent.$watch(attrs.questions, function pagerQuestionsArrWatcher(questionsArr) {
//                            if (questionsArr) {
//                                watchDestroyer();
//                                scope.questions = questionsArr;
//
//                                //wait for the pager items to be rendered
//                                $timeout(function () {
//                                    ngModelCtrl.$render = function () {
//                                        var currentSlide = +ngModelCtrl.$viewValue;
//                                        if (isNaN(currentSlide)) {
//                                            return;
//                                        }
//                                        //added in order to prevent the swipe lag
//                                        $timeout(function () {
//                                            var i;
//                                            var $pagerItemWithCurrentClass = angular.element(domElement.querySelectorAll('.pager-item.current'));
//                                            for (i in $pagerItemWithCurrentClass) {
//                                                $pagerItemWithCurrentClass.eq(i).removeClass('current');
//                                            }
//                                            var pagerItemsDomElement = domElement.querySelectorAll('.pager-item');
//                                            var currentSlideDom = angular.element(pagerItemsDomElement[currentSlide]);
//                                            currentSlideDom.addClass('current');
//
//                                            for(i in scope.questions){
//                                                var question = scope.questions[i];
//                                                setPagerItemBookmarkStatus(i,question .__questionStatus.bookmark);
//                                                setPagerItemAnswerClass(i,question);
//                                            }
//
//                                            setScroll(currentSlideDom);
//                                        });
//                                    };
//                                    //render is not invoked for the first time
//                                    ngModelCtrl.$render();
//                                },false);
//                            }
//                        });
//                    }
//                }
//            };
//        }
//    ]);
//})(angular);
//
