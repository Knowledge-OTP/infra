/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar').directive('znkProgressBar',
        function ($translatePartialLoader) {
        'ngInject';
            return {
                templateUrl: 'components/znkProgressBar/znkProgressBar.template.html',
                scope: {
                    progressWidth: '@',
                    progressValue: '@',
                    showProgressValue: '@',
                    showProgressBubble: '&'
                },
                link: function (scope, element, attrs) {
                    $translatePartialLoader.addPart('znkProgressBar');
                }
            };
        }
    );
})(angular);

