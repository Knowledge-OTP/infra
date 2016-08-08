(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        function (ActivePanelStatusEnum, $log) {
            'ngInject';

            var self = this;

            var actions = {};

            var currentStatus = {
                calls: ActivePanelStatusEnum.INACTIVE.enum,
                screenSharing: ActivePanelStatusEnum.INACTIVE.enum
            };

            this.updateStatus = function (component, status) {
                if (currentStatus.hasOwnProperty(component)) {
                    currentStatus[component] = status;
                } else {
                    $log.error('no such component in currentStatus');
                }

                self.onStatusChange();
            };

            this.onStatusChange = function () {
                switch (true) {
                    // if call is active and screen share is active, show box
                    case currentStatus.calls === ActivePanelStatusEnum.ACTIVE.enum
                    && currentStatus.screenSharing === ActivePanelStatusEnum.ACTIVE.enum :

                    // if call is active and screen share is inactive, show box
                    case currentStatus.calls === ActivePanelStatusEnum.ACTIVE.enum
                    && currentStatus.screenSharing === ActivePanelStatusEnum.INACTIVE.enum :

                    // if call is inactive and screen share is active, show box
                    case currentStatus.calls === ActivePanelStatusEnum.INACTIVE.enum
                    && currentStatus.screenSharing === ActivePanelStatusEnum.ACTIVE.enum :
                        showActivePanelDrv();
                        break;

                    // if call is inactive and screen share is inactive, hide box
                    case currentStatus.calls === ActivePanelStatusEnum.INACTIVE.enum
                    && currentStatus.screenSharing === ActivePanelStatusEnum.INACTIVE.enum :
                        hideActivePanelDrv();
                        break;

                    default:
                        $log.error('This shouldn\'t happen!');
                        break;
                }
            };

            this.getActions = function () {
                return actions;
            };

            function _base(name, origin) {
                var fn = actions[name];
                if (angular.isFunction(fn)) {
                    if (origin === 'calls') {
                        switch (name) {
                            case 'showUI' :
                                self.currentStatus.calls = ActivePanelStatusEnum.ACTIVE.enum;
                                break;
                            case 'hideUI' :
                                self.currentStatus.calls = ActivePanelStatusEnum.INACTIVE.enum;
                                break;
                        }
                    }
                    fn(origin);
                }
            }

            var showActivePanelDrv = _base.bind(null, 'showUI');

            var hideActivePanelDrv = _base.bind(null, 'hideUI');
        });
})(angular);
