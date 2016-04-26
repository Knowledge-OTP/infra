/**
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.deviceNotSupported').directive('deviceNotSupported', [
        '$log',
        function ($log) {
            return {
                templateUrl: 'components/deviceNotSupported/deviceNotSupported.template.html',
                restrict: 'E',
                scope: {
                    title: '@',
                    subTitle: '@',
                    breakAt: '@',
                    imageSrc: '@'
                },
                link: function (scope, element) {
                    scope.title = 'this is our title';
                    scope.subTitle = 'this is our sub-title';
                    scope.breakAt = '768';
                    scope.imageSrc = 'http://dev-act.zinkerz.com.s3-website-eu-west-1.amazonaws.com/assets/images/not-supported-browsers-img.png';
                }
            };
        }
    ]);
})(angular);
