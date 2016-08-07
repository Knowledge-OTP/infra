(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar').controller('znkProgressBar', [
        function () {
            return {
                templateUrl: 'src/components/znkProgressBar/znkProgressBar.template.html',
                scope: {
                    progressWidth: '@',
                    progressValue: '@',
                    showProgressValue: '@',
                    showProgressBubble: '&'
                }
            }
        }
    ]);
})(angular);
