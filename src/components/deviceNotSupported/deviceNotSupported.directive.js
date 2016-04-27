/**
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.deviceNotSupported').directive('deviceNotSupported', [
        function () {
            return {
                templateUrl: 'components/deviceNotSupported/deviceNotSupported.template.html',
                restrict: 'E',
                scope: {
                    title: '@',
                    subTitle: '@',
                    breakAt: '@',
                    imageSrc: '@'
                },
                link: function (scope) {
                    scope.imageSrc = 'http://dev-act.zinkerz.com.s3-website-eu-west-1.amazonaws.com/assets/images/not-supported-browsers-img.png';
                    scope.styleObj = { 'background-image' : 'url(' + scope.imageSrc + ')' };
                    scope.title = 'this is our title';
                    scope.subTitle = 'this is our sub-title';
                    scope.breakAt = '768';
                }
            };
        }
    ]);
})(angular);
