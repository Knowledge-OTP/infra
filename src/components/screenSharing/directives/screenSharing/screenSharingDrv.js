(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').component('screenSharing', {
            templateUrl: 'components/screenSharing/directives/screenSharing/screenSharing.template.html',
            bindings: {
                userSharingState: '<',
                onClose: '&'
            },
            controller: function (UserScreenSharingStateEnum, $log) {
                'ngInject';

                this.$onInit = function () {
                    switch(this.userSharingState){
                        case UserScreenSharingStateEnum.VIEWER.enum:
                            this.sharingStateCls = 'viewer-state';
                            break;
                        case UserScreenSharingStateEnum.SHARER.enum:
                            this.sharingStateCls = 'sharer-state';
                            break;
                        default:
                            $log.error('screenSharingComponent: invalid state was provided');
                    }
                };
            }
        }
    );
})(angular);

