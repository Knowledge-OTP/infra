/**
 * attrs:
 *      disableSwipe
 *      questions
 *      onQuestionAnswered
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionsCarousel', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseSlideDirectionEnum', '$timeout',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseSlideDirectionEnum, $timeout) {
            return {
                templateUrl: function(){
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'questionSwiperDesktop.template.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'questionSwiperMobile.template.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                require: 'ngModel',
                scope:{
                    questionsGetter: '&questions',
                    onQuestionAnswered: '&'

                },
                link: function (scope, element, attrs, ngModelCtrl) {
                    scope.vm = {};

                    ngModelCtrl.$render = function(){
                        scope.vm.currSlideIndex = ngModelCtrl.$viewValue;
                    };

                    scope.vm.SlideChanged = function(){
                        ngModelCtrl.$setViewValue(scope.vm.currSlideIndex);
                    };


                    attrs.$observe('slideDirection',function(newSlideDirection){
                        var slideDirection = +newSlideDirection;
                        if(!scope.vm.swiperActions || isNaN(slideDirection)){
                            return;
                        }

                        switch (slideDirection){
                            case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                scope.vm.swiperActions.lockSwipes();
                                break;
                            case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                scope.vm.swiperActions.unlockSwipeToPrev();
                                scope.vm.swiperActions.lockSwipeToNext();
                                break;
                            case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                scope.vm.swiperActions.lockSwipeToPrev();
                                scope.vm.swiperActions.unlockSwipeToNext();
                                break;
                            default:
                                scope.vm.swiperActions.unlockSwipes();
                        }
                    });

                    scope.$watchGroup(['questionsGetter()', 'questionsGetter().length'],function(newValArr, oldValArr){
                        var newQuestionsArr = newValArr[0];
                        scope.vm.questions = newQuestionsArr || [];

                        var newNum = newValArr[1];
                        var oldNum = oldValArr[1];
                        if(oldNum && newNum !== oldNum){
                            $timeout(function(){
                                scope.vm.swiperActions.updateFollowingSlideAddition();
                            });
                        }
                    });
                }
            };
        }
    ]);
})(angular);

