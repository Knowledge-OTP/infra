(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').component('screenSharing', {
            templateUrl: 'components/screenSharing/directives/screenSharing/screenSharing.template.html',
            bindings: {
                userSharingState: '<',
                onClose: '&'
            }
        }
    );
})(angular);

