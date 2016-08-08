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

                    scope.actions.hideUI = function (origin) {
                        $log.debug('hideUI', origin);
                        element.removeClass('visible');
                        if (origin === 'calls') {
                            destroyTimer();
                        }
                    };

                    scope.actions.showUI = function (origin) {
                        $log.debug('showUI', origin);
                        element.addClass('visible');
                        if (origin === 'calls') {
                            startTimer();
                        }
                    };

                    function startTimer() {
                        timerInterval = $interval(function () {
                            callDuration += 1000;
                            durationToDisplay = $filter('formatDuration')(callDuration / 1000, 'hh:MM:SS', true);
                            angular.element(element[0].querySelector('.call-duration')).text(durationToDisplay);
                        }, 1000, 0, false);
                    }

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
        ["ActivePanelStatusEnum", "$log", function (ActivePanelStatusEnum, $log) {
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
                    case currentStatus.calls === ActivePanelStatusEnum.ACTIVE.enum && currentStatus.screenSharing === ActivePanelStatusEnum.ACTIVE.enum :

                    // if call is active and screen share is inactive, show box
                    case currentStatus.calls === ActivePanelStatusEnum.ACTIVE.enum && currentStatus.screenSharing === ActivePanelStatusEnum.INACTIVE.enum :

                    // if call is inactive and screen share is active, show box
                    case currentStatus.calls === ActivePanelStatusEnum.INACTIVE.enum && currentStatus.screenSharing === ActivePanelStatusEnum.ACTIVE.enum :
                        showActivePanelDrv();
                        break;

                    // if call is inactive and screen share is inactive, hide box
                    case currentStatus.calls === ActivePanelStatusEnum.INACTIVE.enum && currentStatus.screenSharing === ActivePanelStatusEnum.INACTIVE.enum :
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
        }]);
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
