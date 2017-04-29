/**
 * attrs:
 *  mobile-temp=
 *  desktop-temp=
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('templateByPlatform', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log',
        function (ZnkExerciseSrv, PlatformEnum, $log) {
            return {
                templateUrl: function(element, attrs){
                    var templateUrl;
                    var prefix = attrs.prefix || '';
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform){
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl = attrs.desktopTemp;
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl = attrs.mobileTemp;
                            break;
                    }
                    if(!templateUrl){
                        $log.error('templateByPlatform directive: template was not defined for platform');
                    }
                    return prefix + '/' + templateUrl;
                },
                restrict: 'E'
            };
        }
    ]);
})(angular);

