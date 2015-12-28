/**
 * attrs:
 *  actions:
 *      updateContainerSize
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkSwiper', [
        '$timeout', '$q',
        function ($timeout, $q) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkSwiperTemplate.html',
                replace: true,
                require: 'ngModel',
                scope:{},
                transclude: true,
                compile:function(){
                    var defer = $q.defer();
                    var swiperInstanceProm = defer.promise;

                    function preLink(scope,element,attrs,ngModelCtrl){
                        if(attrs.actions){
                            if(!scope.$parent.$eval(attrs.actions)){
                                scope.$parent.$eval(attrs.actions + '={}');
                            }
                            var actions = scope.$parent.$eval(attrs.actions);

                            actions.updateFollowingSlideAddition = function(){
                                return swiperInstanceProm.then(function(swiperInstance){
                                    swiperInstance.updateContainerSize();
                                    swiperInstance.updateSlidesSize();
                                });
                            };
                        }

                        ngModelCtrl.$render = function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            if(angular.isNumber(currSlideIndex)){
                                swiperInstanceProm.then(function(swiperInstance){
                                    swiperInstance.slideTo(currSlideIndex);
                                });
                            }
                        };

                        swiperInstanceProm.then(function(swiperInstance){
                            swiperInstance.on('onSlideChangeEnd',function(_swipeInstance){
                                ngModelCtrl.$setViewValue(_swipeInstance.activeIndex);
                            });
                        });

                        scope.$on('$destroy',function(){
                            swiperInstanceProm.then(function(swiperInstance){
                                swiperInstance.destroy();
                            });
                        });
                    }

                    function postLink(scope,element){
                        $timeout(function(){
                            defer.resolve(new Swiper(element[0]));
                        },0,false);
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

