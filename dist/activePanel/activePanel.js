(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel', [
        'znk.infra.enum'
    ]);
})(angular);

'use strict';

(function (angular) {

    angular.module('znk.infra.activePanel').directive('activePanel',
        ["$interval", "$filter", "$log", function ($interval, $filter, $log) {
            return {
                templateUrl: 'components/activePanel/activePanel.template.html',
                scope: {
                    calleeName: '@',
                    actions: '='
                },
                link:function(scope, element, attrs) {

                    scope.actions = scope.actions || {};

                    var callDuration = 0,
                        durationToDisplay,
                        timerInterval;

                    scope.calleeName = attrs.calleeName;

                    scope.actions.hideUI = function () {
                        $log.debug('hideUI');
                        element.removeClass('visible');
                    };

                    scope.actions.showUI = function () {
                        $log.debug('showUI');
                        element.addClass('visible');
                    };

                    scope.actions.startTimer = function () {
                        $log.debug('call timer started');
                        timerInterval = $interval(function () {
                            callDuration += 1000;
                            durationToDisplay = $filter('formatDuration')(callDuration / 1000, 'hh:MM:SS', true);
                            angular.element(element[0].querySelector('.call-duration')).text(durationToDisplay);
                        }, 1000, 0, false);
                    };

                    scope.actions.stopTimer = function () {
                        $interval.cancel(timerInterval);
                    };

                    scope.actions.screenShareMode = function (bool) {
                        if (bool) {
                            element.addClass('screen-share-mode');
                        } else {
                            element.removeClass('screen-share-mode');
                        }
                    };

                    function destroyTimer() {
                        $interval.cancel(timerInterval);
                        callDuration = 0;
                        durationToDisplay = 0;
                    }

                    element.on('$destroy', function() {
                        destroyTimer();
                    });
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        ["ActivePanelStatusEnum", "ActivePanelComponentEnum", "$log", function (ActivePanelStatusEnum, ActivePanelComponentEnum, $log) {
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
                if (angular.isUndefined(actions) || angular.equals(actions, {})) {
                    return $log.error('actions is undefined');
                }
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
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').factory('ActivePanelComponentEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['CALLS', 1, 'calls'],
                ['SCREEN_SHARE', 2, 'screenShare']
            ]);
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').factory('ActivePanelStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['ACTIVE', 1, 'active'],
                ['INACTIVE', 2, 'inactive']
            ]);
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'call-mute-icon': 'components/calls/svg/call-mute-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

angular.module('znk.infra.activePanel').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/activePanel/activePanel.template.html",
    "<div class=\"active-panel\">\n" +
    "    <div class=\"flex-container\">\n" +
    "        <div class=\"callee-status flex-col\">\n" +
    "            <div class=\"online-indicator\"></div>\n" +
    "        </div>\n" +
    "        <div class=\"callee-name flex-col\" title=\"{}\">\n" +
    "            {{calleeName}}\n" +
    "            <div class=\"call-duration\">&nbsp;</div>\n" +
    "        </div>\n" +
    "        <div class=\"call-controls flex-col\">\n" +
    "            <svg-icon name=\"call-mute-icon\"></svg-icon>\n" +
    "            <call-btn></call-btn>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);
