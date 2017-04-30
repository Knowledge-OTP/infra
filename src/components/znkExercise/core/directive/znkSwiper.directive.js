/**
 * attrs:
 *
 *  actions:
 *      updateContainerSize
 *      lockSwipes
 *      lockSwipeToPrev
 *      lockSwipeToNext
 *      unlockSwipes
 *      unlockSwipeToPrev
 *      unlockSwipeToNext
 *      enableKeyboardControl
 *      disableKeyboardControl
 *      noSwiping
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkSwiper', [
        '$timeout', '$q',
        function ($timeout, $q) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkSwiper.template.html',
                replace: true,
                restrict: 'E',
                require: 'ngModel',
                scope:{},
                transclude: true,
                compile:function(){
                    var defer, swiperInstanceProm, swiperInstance;

                    function preLink(scope,element,attrs,ngModelCtrl){
                        defer = $q.defer();
                        swiperInstanceProm = defer.promise;

                        if(attrs.actions){
                            if(!scope.$parent.$eval(attrs.actions)){
                                scope.$parent.$eval(attrs.actions + '={}');
                            }
                            var actions = scope.$parent.$eval(attrs.actions);

                            var fnToBindFromSwiper = [
                                'lockSwipes', 'lockSwipeToPrev', 'lockSwipeToNext', 'unlockSwipes',
                                'unlockSwipeToPrev', 'unlockSwipeToNext', 'noSwiping'
                            ];
                            fnToBindFromSwiper.forEach(function(fnName){
                                actions[fnName] = function(){
                                    var fnArgs = arguments;
                                    swiperInstanceProm.then(function(){
                                        swiperInstance[fnName].apply(swiperInstance,fnArgs);
                                    });
                                };
                            });

                            actions.updateFollowingSlideAddition = function(){
                                return swiperInstanceProm.then(function(){
                                    swiperInstance.updateContainerSize();
                                    swiperInstance.updateSlidesSize();
                                });
                            };
                        }

                        ngModelCtrl.$render = function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            if(angular.isNumber(currSlideIndex)){
                                swiperInstanceProm.then(function(){
                                    swiperInstance.slideTo(currSlideIndex);
                                });
                            }
                        };

                        swiperInstanceProm.then(function(){
                            swiperInstance.on('onSlideChangeEnd',function(){
                                ngModelCtrl.$setViewValue(swiperInstance.activeIndex);
                            });
                        });

                        scope.$on('$destroy',function(){
                            if(swiperInstance){
                                swiperInstance.off('onSlideChangeEnd');
                                swiperInstance.destroy(true, true);
                                swiperInstance = null;
                            }
                        });
                    }

                    function postLink(scope,element,attrs,ngModelCtrl){
                        $timeout(function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;

                            currSlideIndex = Math.max(currSlideIndex, 0);

                            swiperInstance = new Swiper(element[0], {
                                initialSlide: currSlideIndex || 0,
                                onlyExternal: true
                            });
                            defer.resolve();
                        });
                    }

                    return {
                        pre: preLink,
                        post: postLink
                    };
                }
            };
        }
    ]);
})(angular);

