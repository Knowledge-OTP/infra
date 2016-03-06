/**
 * attrs -
 *      ng-model
 *      play
 *      type:
 *          1: timer with displayed time.
 *          2: timer with round progress bar
 *      config:
 *          stopOnZero
 *          countDown
 *          format: defaulted to mm:ss
 *          only for type 2:
 *              stroke
 *              bgcolor
 *              color
 *              radius
 *              max
 *              clockwise
 */
'use strict';

(function (angular) {

    angular.module('znk.infra.general').directive('timer', [
        '$interval',
        function ($interval) {
            var timerTypes = {
                'REGULAR': 1,
                'ROUND_PROGRESSBAR': 2
            };

            return {
                scope: {
                    play: '&',
                    typeGetter: '&?type',
                    configGetter: '&?config'
                },
                require: '?ngModel',
                replace: true,
                templateUrl: 'components/general/templates/timerDrv.html',
                link: function link(scope, element, attrs, ngModelCtrl) {
                    var domElement = element[0];

                    scope.ngModelCtrl = ngModelCtrl;

                    function padNum(num){
                        if(('' + Math.abs(+num)).length < 2){
                            return (num < 0 ? '-' : '') + '0' + Math.abs(+num);
                        }else{
                            return num;
                        }
                    }

                    function getDisplayedTime(currentTime,format){
                        var totalSeconds = currentTime / 1000;
                        var seconds = Math.floor(totalSeconds % 60);
                        var minutes = Math.floor(Math.abs(totalSeconds) / 60) * (totalSeconds < 0 ? -1 : 1);
                        var paddedSeconds = padNum(seconds);
                        var paddedMinutes = padNum(minutes);

                        return format
                            .replace('tss',totalSeconds)
                            .replace('ss',paddedSeconds)
                            .replace('mm',paddedMinutes);

                    }

                    function updateTime(currentTime) {
                        var displayedTime = getDisplayedTime(currentTime,scope.config.format);
                        var timeDisplayDomElem;
                        switch(scope.type){
                            case 1:
                                timeDisplayDomElem = domElement.querySelector('.timer-view');
                                break;
                            case 2:
                                timeDisplayDomElem = domElement.querySelector('.timer-display');
                                break;
                        }
                        if(timeDisplayDomElem){
                            timeDisplayDomElem.innerText = displayedTime;
                        }
                    }

                    var intervalHandler;
                    var INTERVAL_TIME = 1000;

                    scope.type = scope.typeGetter() || 1;
                    scope.config = scope.configGetter() || {};
                    var configDefaults = {
                        format: 'mm:ss',
                        stopOnZero: true
                    };
                    scope.config = angular.extend(configDefaults, scope.config);

                    switch (scope.type) {
                        case timerTypes.ROUND_PROGRESSBAR:
                        {
                            var roundProgressBarConfigDefults = {
                                stroke: 3,
                                bgcolor: '#0a9bad',
                                color: '#e1e1e1'
                            };
                            scope.config = angular.extend(roundProgressBarConfigDefults, scope.config);
                            scope.config.radius = scope.config.radius || Math.floor(element[0].offsetHeight / 2) || 45;
                            break;
                        }
                    }

                    function tick() {
                        var currentTime = ngModelCtrl.$viewValue;

                        if (angular.isUndefined(currentTime)) {
                            return;
                        }

                        currentTime += scope.config.countDown ? -INTERVAL_TIME : INTERVAL_TIME;

                        if(scope.config.stopOnZero && currentTime === 0){
                            return;
                        }

                        updateTime(currentTime);
                        ngModelCtrl.$setViewValue(currentTime);
                    }

                    ngModelCtrl.$render = function () {
                        var currentTime = ngModelCtrl.$viewValue;
                        if (angular.isUndefined(currentTime)) {
                            return;
                        }
                        updateTime(currentTime);
                    };

                    scope.$watch('play()', function (play) {
                        if (intervalHandler) {
                            $interval.cancel(intervalHandler);
                        }

                        if (play) {
                            intervalHandler = $interval(tick, INTERVAL_TIME, 0, false);
                        }
                    });

                    scope.$on('$destroy', function () {
                        $interval.cancel(intervalHandler);
                    });
                }
            };
        }]);

})(angular);
