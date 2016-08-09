(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        function (ActivePanelStatusEnum, activePanelComponentEnum, $log) {
            'ngInject';

            var actions = {};

            // TODO: add enum for component name
            var currentStatus = {
                calls: ActivePanelStatusEnum.INACTIVE.enum,
                screenSharing: ActivePanelStatusEnum.INACTIVE.enum
            };

            this.updateStatus = function (component, status) {
                if (!component) {
                    $log.error('must pass the component arg to function');
                    return;
                } else if (!status) {
                    $log.error('must pass the status arg to function');
                    return;
                }

                function isScreenSharingActive() {
                    return (currentStatus.screenSharing === ActivePanelStatusEnum.ACTIVE.enum);
                }

                function isCallActive() {
                    return (currentStatus.calls === ActivePanelStatusEnum.ACTIVE.enum);
                }

                // if (currentStatus.hasOwnProperty(component)) {
                //     currentStatus[component] = status;
                // } else {
                //     $log.error('no such component in currentStatus');
                // }

                // default for show drv = false
                switch (true) {
                    case component === 'calls' && status === ActivePanelStatusEnum.ACTIVE.enum :
                        // component = call, status = active
                        // show true
                        // start timer
                        // call btn in hangup mode
                        currentStatus.calls = ActivePanelStatusEnum.ACTIVE.enum;
                        showActivePanelDrv();
                        startTimer();
                        callBtnMode('hangup');
                        break;

                    case component === 'calls' && status === ActivePanelStatusEnum.INACTIVE.enum :
                        // component = call, status = inactive (hangup, disc')
                        // stopTimer
                        // call btn is in call mode
                        // if screenShare is inactive, hide drv
                        currentStatus.calls = ActivePanelStatusEnum.INACTIVE.enum;
                        stopTimer();
                        callBtnMode('call');
                        if (!isScreenSharingActive()) {
                            hideActivePanelDrv();
                        }
                        break;

                    case component === 'screenShare' && status === ActivePanelStatusEnum.ACTIVE.enum :
                        // component = screenShare, status = active
                        // show drv
                        // screenShare buttons are disabled
                        currentStatus.screenSharing = ActivePanelStatusEnum.ACTIVE.enum;
                        showActivePanelDrv();
                        screenShareBtnsMode('disabled');
                        break;

                    case component === 'screenShare' && status === ActivePanelStatusEnum.INACTIVE.enum :
                        // component = screenShare, status = inactive
                        // check if call is active, if not hide drv
                        // return shareScreen btns to enabled state
                        currentStatus.screenSharing = ActivePanelStatusEnum.INACTIVE.enum;
                        if (!isCallActive()) {
                            hideActivePanelDrv();
                        }
                        screenShareBtnsMode('enabled');
                        break;

                    default:
                        $log.error('This should not happen!', component, status, currentStatus);
                        break;
                }
            };

            this.getActions = function () {
                return actions;
            };

            function _base(name) {
                var fn = actions[name];
                if (angular.isFunction(fn)) {
                    fn();
                }
            }

            var showActivePanelDrv = _base.bind(null, 'showUI');

            var hideActivePanelDrv = _base.bind(null, 'hideUI');

            var startTimer = _base.bind(null, 'startTimer');

            var stopTimer = _base.bind(null, 'stopTimer');

            var callBtnMode = _base.bind(null, 'callBtnMode');

            var screenShareBtnsMode = _base.bind(null, 'screenShareBtnsMode');
        });
})(angular);
