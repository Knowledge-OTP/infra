(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        function (ActivePanelStatusEnum, ActivePanelComponentEnum, $log) {
            'ngInject';

            var actions = {};

            var currentStatus = {
                calls: ActivePanelStatusEnum.INACTIVE.enum,
                screenSharing: ActivePanelStatusEnum.INACTIVE.enum
            };

            this.updateStatus = function (component, status) {
                // if (currentStatus.hasOwnProperty(component)) {
                //     currentStatus[component] = status;
                // } else {
                //     $log.error('no such component in currentStatus');
                // }

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

                // default for show drv = false
                switch (true) {
                    case component === ActivePanelComponentEnum.CALLS.enum && status === ActivePanelStatusEnum.ACTIVE.enum :
                        // component = call, status = active
                        // show true
                        // start timer
                        // call btn in hangup mode
                        currentStatus.calls = ActivePanelStatusEnum.ACTIVE.enum;
                        showActivePanelDrv();
                        startTimer();
                        callBtnMode('hangup');
                        break;

                    case component === ActivePanelComponentEnum.CALLS.enum && status === ActivePanelStatusEnum.INACTIVE.enum :
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

                    case component === ActivePanelComponentEnum.SCREEN_SHARE.enum && status === ActivePanelStatusEnum.ACTIVE.enum :
                        // component = screenShare, status = active
                        // show drv
                        // screenShare buttons are disabled
                        currentStatus.screenSharing = ActivePanelStatusEnum.ACTIVE.enum;
                        showActivePanelDrv();
                        screenShareMode(true);
                        screenShareBtnsMode('disabled');
                        break;

                    case component === ActivePanelComponentEnum.SCREEN_SHARE.enum && status === ActivePanelStatusEnum.INACTIVE.enum :
                        // component = screenShare, status = inactive
                        // check if call is active, if not hide drv
                        // return shareScreen btns to enabled state
                        currentStatus.screenSharing = ActivePanelStatusEnum.INACTIVE.enum;
                        if (!isCallActive()) {
                            hideActivePanelDrv();
                        }
                        screenShareMode(false);
                        screenShareBtnsMode('enabled');
                        break;

                    default:
                        hideActivePanelDrv();
                        break;
                }
            };

            this.getActions = function () {
                return actions;
            };

            function _base(name, param1) {
                var fn = actions[name];
                if (angular.isFunction(fn)) {
                    fn(param1);
                }
            }

            var showActivePanelDrv = _base.bind(null, 'showUI');

            var hideActivePanelDrv = _base.bind(null, 'hideUI');

            var startTimer = _base.bind(null, 'startTimer');

            var stopTimer = _base.bind(null, 'stopTimer');

            var callBtnMode = _base.bind(null, 'callBtnMode');

            var screenShareMode = _base.bind(null, 'screenShareMode');

            var screenShareBtnsMode = _base.bind(null, 'screenShareBtnsMode');
        });
})(angular);
