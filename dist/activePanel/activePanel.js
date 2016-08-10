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
                    // scope.actions = scope.actions || {};
                    if (!angular.isObject(scope.actions)) {
                        scope.actions = {};
                    }

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
                        $log.debug('screenShareMode');
                        if (bool) {
                            element.addClass('screen-share-mode');
                        } else {
                            element.removeClass('screen-share-mode');
                        }
                    };

                    scope.actions.callBtnMode = function () {
                        $log.debug('callBtnMode');
                    };

                    scope.actions.screenShareBtnsMode = function () {
                        $log.debug('screenShareBtnsMode');
                    };

                    function destroyTimer() {
                        $interval.cancel(timerInterval);
                        callDuration = 0;
                        durationToDisplay = 0;
                    }

                    element.on('$destroy', function() {
                        destroyTimer();
                    });

                    // scope.iama = 'student';
                    scope.iama = 'teacher';
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
                        //callBtnMode('hangup');
                        break;

                    case component === ActivePanelComponentEnum.CALLS.enum && status === ActivePanelStatusEnum.INACTIVE.enum :
                        // component = call, status = inactive (hangup, disc')
                        // stopTimer
                        // call btn is in call mode
                        // if screenShare is inactive, hide drv
                        currentStatus.calls = ActivePanelStatusEnum.INACTIVE.enum;
                        stopTimer();
                        //callBtnMode('call');
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
                        //screenShareMode(true);
                        //screenShareBtnsMode('disabled');
                        break;

                    case component === ActivePanelComponentEnum.SCREEN_SHARE.enum && status === ActivePanelStatusEnum.INACTIVE.enum :
                        // component = screenShare, status = inactive
                        // check if call is active, if not hide drv
                        // return shareScreen btns to enabled state
                        currentStatus.screenSharing = ActivePanelStatusEnum.INACTIVE.enum;
                        if (!isCallActive()) {
                            hideActivePanelDrv();
                        }
                        //screenShareMode(false);
                        //screenShareBtnsMode('enabled');
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

            // var callBtnMode = _base.bind(null, 'callBtnMode');
            //
            // var screenShareMode = _base.bind(null, 'screenShareMode');
            //
            // var screenShareBtnsMode = _base.bind(null, 'screenShareBtnsMode');
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
                'call-mute-icon': 'components/calls/svg/call-mute-icon.svg',
                'share-screen-icon': 'components/activePanel/svg/share-screen-icon.svg',
                'track-teacher-icon': 'components/activePanel/svg/track-teacher-icon.svg',
                'track-student-icon': 'components/activePanel/svg/track-student-icon.svg'
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
    "            <!--<svg-icon name=\"call-mute-icon\"></svg-icon>-->\n" +
    "            <!--<div class=\"share-my-screen\"></div>-->\n" +
    "            <svg-icon ng-hide=\"true\" name=\"share-screen-icon\"></svg-icon>\n" +
    "            <ng-switch ng-hide=\"true\" on=\"iama\" class=\"show-other-screen\">\n" +
    "                <svg-icon ng-switch-when=\"teacher\" name=\"track-student-icon\"></svg-icon>\n" +
    "                <svg-icon ng-switch-when=\"student\" name=\"track-teacher-icon\"></svg-icon>\n" +
    "            </ng-switch>\n" +
    "            <call-btn></call-btn>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/activePanel/svg/share-screen-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Layer_7\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 138 141.3\" style=\"enable-background:new 0 0 138 141.3;\" xml:space=\"preserve\">\n" +
    "<path d=\"M113.2,0H24.8C11.2,0,0,11.2,0,24.8v55.4C0,93.8,11.2,105,24.8,105h88.4c13.6,0,24.8-11.2,24.8-24.8V24.8\n" +
    "	C138,11.2,126.8,0,113.2,0z M71.1,82V63.4c0,0-28.8-4-42.7,15.3c0,0-5.1-34.6,42.9-40.4l-0.3-20L114.3,50L71.1,82z\"/>\n" +
    "<path d=\"M57.4,118.6h22.7c1,0,1.9,0.4,2.4,1.1c2.2,3.1,8.8,11.9,15.3,17.3c1.8,1.5,0.6,4.2-1.9,4.2H42.2c-2.5,0-3.8-2.7-1.9-4.2\n" +
    "	c4.9-4,11.6-10.4,14.5-16.9C55.2,119.2,56.2,118.6,57.4,118.6z\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/activePanel/svg/track-student-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Isolation_Mode\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\"\n" +
    "	 y=\"0px\" viewBox=\"0 0 138 141.3\" style=\"enable-background:new 0 0 138 141.3;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.st0{fill:none;stroke:#000000;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path d=\"M57.4,118.6h22.7c1,0,1.9,0.4,2.4,1.1c2.2,3.1,8.8,11.9,15.3,17.3c1.8,1.5,0.6,4.2-1.9,4.2H42.2c-2.5,0-3.8-2.7-1.9-4.2\n" +
    "	c4.9-4,11.6-10.4,14.5-16.9C55.2,119.2,56.2,118.6,57.4,118.6z\"/>\n" +
    "<path class=\"st0\" d=\"M110.2,28.8\"/>\n" +
    "<path d=\"M113.2,0H24.8C11.2,0,0,11.2,0,24.8v55.4C0,93.8,11.2,105,24.8,105h88.4c13.6,0,24.8-11.2,24.8-24.8V24.8\n" +
    "	C138,11.2,126.8,0,113.2,0z M44.4,20.6c8-3.8,16-7.4,24-11.1c0.7-0.3,1.5-0.6,2.2-0.8C71.3,9,72,9.2,72.7,9.5c8,3.7,16,7.3,24,11.1\n" +
    "	c1,0.5,1.7,1.6,2.5,2.4c-0.8,0.7-1.5,1.7-2.5,2.1c-7.9,3.7-15.8,7.4-23.8,10.9c-1.3,0.6-3.2,0.6-4.5,0c-8.1-3.5-16.1-7.3-24-11\n" +
    "	c-0.9-0.4-1.6-1.5-2.4-2.2C42.8,22.1,43.5,21,44.4,20.6z M92.5,52.8c-2.1,0-2.2-1.2-2.2-2.8c0-3.5-0.2-6.9,0.1-10.4\n" +
    "	c0.2-2.8,0.8-5.5,1.3-8.2c0.1-0.4,0.8-0.7,1.9-1.6c0.4,7.3,0.7,13.8,1,20.3C94.7,51.5,94.7,52.8,92.5,52.8z M80.6,52.6\n" +
    "	c-6.1,4.7-14.5,5-20.7,0.6c-6.4-4.5-8.9-12.4-6.1-20.3c3,1.4,6.3,2.5,9,4.3c5.3,3.4,10.4,3.3,15.7,0c2.3-1.5,5-2.4,7.7-3.6\n" +
    "	C88.7,40.1,86.4,48.1,80.6,52.6z M99.3,88.5c-3.7,2.8-8,4-12.4,4.8c-5.6,1-11.3,1.6-14.6,2c-10.5-0.3-18.5-1.2-26.1-4\n" +
    "	c-8.2-3-9.5-5.8-6.6-13.9c3-8.2,8.3-14.2,16.4-17.5c1.6-0.6,3.8-0.8,5.4-0.2c5.9,2.1,11.5,2.1,17.4,0c1.5-0.6,3.7-0.4,5.2,0.3\n" +
    "	c10,4.2,15.5,12.1,17.8,22.6C102.3,85.1,101.3,87,99.3,88.5z\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/activePanel/svg/track-teacher-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<!-- Generator: Adobe Illustrator 19.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->\n" +
    "<svg version=\"1.1\" id=\"Isolation_Mode\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\"\n" +
    "	 y=\"0px\" viewBox=\"-326 51.7 138 141.3\" style=\"enable-background:new -326 51.7 138 141.3;\" xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.st0{fill:none;stroke:#000000;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path d=\"M-268.6,170.3h22.7c1,0,1.9,0.4,2.4,1.1c2.2,3.1,8.8,11.9,15.3,17.3c1.8,1.5,0.6,4.2-1.9,4.2h-53.7c-2.5,0-3.8-2.7-1.9-4.2\n" +
    "	c4.9-4,11.6-10.4,14.5-16.9C-270.8,170.9-269.8,170.3-268.6,170.3z\"/>\n" +
    "<path class=\"st0\" d=\"M-215.8,80.5\"/>\n" +
    "<path d=\"M-212.8,51.7h-88.4c-13.6,0-24.8,11.2-24.8,24.8v55.4c0,13.6,11.2,24.8,24.8,24.8h88.4c13.6,0,24.8-11.2,24.8-24.8V76.5\n" +
    "	C-188,62.9-199.2,51.7-212.8,51.7z M-306.4,69.9c0-2.7,2.2-5,5-5h73.9c2.7,0,5,2.2,5,5v22.7c0,1.8-1.5,3.3-3.3,3.3s-3.3-1.5-3.3-3.3\n" +
    "	v-21h-70.7v53h22.6c1.8,0,3.3,1.5,3.3,3.3c0,1.8-1.5,3.3-3.3,3.3h-24.2c-2.7,0-5-2.2-5-5V69.9z M-272.8,91c-0.9,0-1.7-0.7-1.7-1.7\n" +
    "	c0-0.9,0.7-1.7,1.7-1.7h33.6c0.9,0,1.7,0.7,1.7,1.7c0,0.9-0.7,1.7-1.7,1.7H-272.8z M-245.8,100.5c0,0.9-0.7,1.7-1.7,1.7h-25.3\n" +
    "	c-0.9,0-1.7-0.7-1.7-1.7s0.7-1.7,1.7-1.7h25.4C-246.5,98.8-245.8,99.6-245.8,100.5z M-239.2,79.9h-33.6c-0.9,0-1.7-0.7-1.7-1.7\n" +
    "	s0.7-1.7,1.7-1.7h33.6c0.9,0,1.7,0.7,1.7,1.7S-238.2,79.9-239.2,79.9z M-264.5,140.5h-44.1c-0.9,0-1.7-0.7-1.7-1.7s0.7-1.7,1.7-1.7\n" +
    "	h44.1c0.9,0,1.7,0.7,1.7,1.7S-263.6,140.5-264.5,140.5z M-251.3,145.2l1.8-5.7l-5.1,1.6c-0.6,0.2-1.2,0.2-1.8,0.1\n" +
    "	c-1.3-0.3-3.6-1.3-5.9-4.7c-2.9-4.1-7.6-11.4-9.6-14.4c-0.5-0.7-0.9-1.9-0.9-2.8c0-0.8,0.2-1.6,0.5-2.3c-0.1-0.1-0.3-0.2-0.4-0.4\n" +
    "	l-14.8-20.4c-0.5-0.7-0.4-1.8,0.4-2.3c0.7-0.5,1.8-0.4,2.3,0.4l14.8,20.5c0.1,0.2,0.2,0.3,0.2,0.5c0.7-0.1,1.4-0.1,2.3,0.2\n" +
    "	c1,0.3,2.2,1.3,2.7,2.1l7.8,13.6c0.5,1,1.7,1.3,2.7,0.8l18.3-9.9h0.5c-3-2.4-4.8-6.1-4.8-10.3c0-7.4,6-13.3,13.3-13.3\n" +
    "	c0.3,0,0.7,0,1,0c6.9,0.5,12.3,6.3,12.3,13.3c0,4.9-2.6,9.1-6.5,11.4h0.4c0,0,16.6,5.8,16.2,21.9L-251.3,145.2L-251.3,145.2z\"/>\n" +
    "</svg>\n" +
    "");
}]);
