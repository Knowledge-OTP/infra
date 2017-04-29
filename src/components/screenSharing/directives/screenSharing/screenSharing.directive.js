(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').component('screenSharing', {
            templateUrl: 'components/screenSharing/directives/screenSharing/screenSharing.template.html',
            bindings: {
                userSharingState: '<',
                onClose: '&'
            },
            controller: function (UserScreenSharingStateEnum, $log, ScreenSharingUiSrv) {
                'ngInject';

                var ctrl = this;

                function _addViewerExternalTemplate(){
                    ctrl.viewerTemplate = ScreenSharingUiSrv.__getScreenSharingViewerTemplate();

                }

                this.$onInit = function () {
                    switch(this.userSharingState){
                        case UserScreenSharingStateEnum.VIEWER.enum:
                            this.sharingStateCls = 'viewer-state';
                            _addViewerExternalTemplate();
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

