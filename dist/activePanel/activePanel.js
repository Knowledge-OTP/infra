(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel', [
        'znk.infra.svgIcon',
        'znk.infra.calls',
        'znk.infra.filters',
        'pascalprecht.translate',
        'znk.infra.screenSharing',
        'znk.infra.presence',
        'znk.infra.liveSession'
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel')
        .directive('activePanel',
            ["$window", "$q", "$interval", "$filter", "$log", "CallsUiSrv", "ScreenSharingSrv", "PresenceService", "StudentContextSrv", "TeacherContextSrv", "ENV", "$translate", "toggleAutoCallEnum", "LiveSessionSrv", "LiveSessionStatusEnum", "UserScreenSharingStateEnum", function ($window, $q, $interval, $filter, $log, CallsUiSrv, ScreenSharingSrv,
                         PresenceService, StudentContextSrv, TeacherContextSrv, ENV,
                         $translate, toggleAutoCallEnum, LiveSessionSrv, LiveSessionStatusEnum,
                        UserScreenSharingStateEnum) {
                'ngInject';
                return {
                templateUrl: 'components/activePanel/activePanel.template.html',
                scope: {},
                link: function(scope, element) {
                    var receiverId,
                        isOffline,
                        durationToDisplay,
                        timerInterval,
                        liveSessionData,
                        liveSessionStatus = 0,
                        liveSessionDuration = 0,
                        timerSecondInterval = 1000,
                        activePanelVisibleClassName = 'activePanel-visible',
                        isStudent = ENV.appContext.toLowerCase() === 'student',
                        isTeacher = ENV.appContext.toLowerCase() === 'dashboard';

                    var bodyDomElem = angular.element($window.document.body);

                    var translateNamespace = 'ACTIVE_PANEL';

                    $translate([
                        translateNamespace + '.' + 'SHOW_STUDENT_SCREEN',
                        translateNamespace + '.' + 'SHOW_TEACHER_SCREEN',
                        translateNamespace + '.' + 'SHARE_MY_SCREEN'
                    ]).then(function (translation) {
                        scope.d.translatedStrings = {
                            SHOW_STUDENT_SCREEN: translation[translateNamespace + '.' + 'SHOW_STUDENT_SCREEN'],
                            SHOW_TEACHER_SCREEN: translation[translateNamespace + '.' + 'SHOW_TEACHER_SCREEN'],
                            SHARE_MY_SCREEN: translation[translateNamespace + '.' + 'SHARE_MY_SCREEN'],
                            END_SCREEN_SHARING: translation[translateNamespace + '.' + 'END_SCREEN_SHARING']
                        };
                    }).catch(function (err) {
                        $log.debug('Could not fetch translation', err);
                    });

                    function endLiveSession() {
                        if (liveSessionData) {
                            LiveSessionSrv.endLiveSession(liveSessionData.guid);
                        } else {
                            LiveSessionSrv.getActiveLiveSessionData().then(function (liveSessionData) {
                                if (liveSessionData) {
                                    LiveSessionSrv.endLiveSession(liveSessionData.guid);
                                }
                            });
                        }
                    }

                    function startTimer() {
                        $log.debug('call timer started');
                        timerInterval = $interval(function () {
                            liveSessionDuration += timerSecondInterval;
                            durationToDisplay = $filter('formatDuration')(liveSessionDuration / 1000, 'hh:MM:SS', true);
                            angular.element(element[0].querySelector('.live-session-duration')).text(durationToDisplay);
                        }, 1000, 0, false);
                    }

                    function destroyTimer() {
                        $interval.cancel(timerInterval);
                        liveSessionDuration = 0;
                        durationToDisplay = 0;
                    }

                    function endScreenSharing(){
                        if (scope.d.screenShareStatus !== UserScreenSharingStateEnum.NONE.enum) {
                            ScreenSharingSrv.getActiveScreenSharingData().then(function (screenSharingData) {
                                if (screenSharingData) {
                                    ScreenSharingSrv.endSharing(screenSharingData.guid);
                                }
                            });
                        }
                    }

                    function updateStatus() {
                        scope.d.currStatus = liveSessionStatus;
                        $log.debug('ActivePanel d.currStatus: ', scope.d.currStatus);

                        switch (scope.d.currStatus) {
                            case scope.d.states.NONE :
                                $log.debug('ActivePanel State: NONE');
                                bodyDomElem.removeClass(activePanelVisibleClassName);
                                scope.d.shareScreenBtnsEnable = true;
                                destroyTimer();
                                if (scope.d.callBtnModel) {
                                    scope.d.callBtnModel.toggleAutoCall = toggleAutoCallEnum.DISABLE.enum;
                                    scope.d.callBtnModel = angular.copy(scope.d.callBtnModel);
                                }
                                endScreenSharing();
                                LiveSessionSrv.unregisterFromActiveLiveSessionDataChanges(listenToLiveSessionStatus);
                                break;
                            case scope.d.states.LIVE_SESSION :
                                $log.debug('ActivePanel State: LIVE_SESSION');
                                bodyDomElem.addClass(activePanelVisibleClassName);
                                startTimer();
                                if (scope.d.callBtnModel) {
                                    scope.d.callBtnModel.toggleAutoCall = toggleAutoCallEnum.ACTIVATE.enum;
                                    scope.d.callBtnModel = angular.copy(scope.d.callBtnModel);
                                }
                                break;
                            default :
                                $log.error('currStatus is in an unknown state', scope.d.currStatus);
                        }
                    }

                    function getRoundTime() {
                        return Math.floor(Date.now() / 1000) * 1000;
                    }

                    function listenToLiveSessionStatus(newLiveSessionData) {
                        if (!liveSessionData || !angular.equals(liveSessionData, newLiveSessionData)) {
                            liveSessionData = newLiveSessionData;
                        }
                        var isEnded = liveSessionData.status === LiveSessionStatusEnum.ENDED.enum;
                        var isConfirmed = liveSessionData.status === LiveSessionStatusEnum.CONFIRMED.enum;

                        if (isEnded || isConfirmed) {
                            if (isConfirmed) {
                                liveSessionStatus = scope.d.states.LIVE_SESSION;
                                liveSessionDuration = getRoundTime() - liveSessionData.startTime;
                            } else {
                                liveSessionStatus = scope.d.states.NONE;
                            }
                            updateStatus();
                        }
                    }

                    // Listen to status changes in ScreenSharing
                    function listenToScreenShareStatus(screenSharingStatus) {
                        if (screenSharingStatus) {
                            if (screenSharingStatus !== UserScreenSharingStateEnum.NONE.enum) {
                                scope.d.screenShareStatus = screenSharingStatus;
                                scope.d.shareScreenBtnsEnable = false;
                                scope.d.shareScreenViewer = (screenSharingStatus === UserScreenSharingStateEnum.VIEWER.enum);
                            } else {
                                scope.d.screenShareStatus = UserScreenSharingStateEnum.NONE.enum;
                                scope.d.shareScreenBtnsEnable = true;
                            }
                        }
                    }

                    function listenToStudentOrTeacherContextChange(prevUid, uid) {
                        receiverId = uid;
                        var currentUserStatus = PresenceService.getCurrentUserStatus(receiverId);
                        var CalleeName = CallsUiSrv.getCalleeName(receiverId);
                        var promsArr = [
                            currentUserStatus,
                            CalleeName
                        ];
                        $q.all(promsArr).then(function (res) {
                            scope.d.currentUserPresenceStatus = res[0];
                            isOffline = scope.d.currentUserPresenceStatus === PresenceService.userStatus.OFFLINE;
                            scope.d.calleeName = (res[1]) ? (res[1]) : '';
                            scope.d.callBtnModel = {
                                isOffline: isOffline,
                                receiverId: uid,
                                toggleAutoCall: toggleAutoCallEnum.DISABLE.enum
                            };
                        }).catch(function (err) {
                            $log.debug('error caught at listenToStudentOrTeacherContextChange', err);
                        });
                        $log.debug('student or teacher context changed: ', receiverId);
                    }

                    function viewOtherUserScreen() {
                        var userData = {
                            isTeacher: !scope.d.isTeacher,
                            uid: receiverId
                        };
                        $log.debug('viewOtherUserScreen: ', userData);
                        ScreenSharingSrv.viewOtherUserScreen(userData);
                    }

                    function shareMyScreen() {
                        var userData = {
                            isTeacher: !scope.d.isTeacher,
                            uid: receiverId
                        };
                        $log.debug('shareMyScreen: ', userData);
                        ScreenSharingSrv.shareMyScreen(userData);
                    }


                    if (isTeacher) {
                        StudentContextSrv.registerToStudentContextChange(listenToStudentOrTeacherContextChange);
                    } else if (isStudent) {
                        TeacherContextSrv.registerToTeacherContextChange(listenToStudentOrTeacherContextChange);
                    } else {
                        $log.error('appContext is not compatible with this component: ', ENV.appContext);
                    }

                    scope.d = {
                        states: {
                            NONE: 0,
                            LIVE_SESSION: 1
                        },
                        toggleAutoCall: {},
                        shareScreenBtnsEnable: true,
                        isTeacher: isTeacher,
                        presenceStatusMap: PresenceService.userStatus,
                        endScreenSharing: endScreenSharing,
                        endSession: endLiveSession,
                        viewOtherUserScreen: viewOtherUserScreen,
                        shareMyScreen: shareMyScreen
                    };

                    element.on('$destroy', function() {
                        destroyTimer();
                    });

                    ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(listenToScreenShareStatus);

                    LiveSessionSrv.registerToActiveLiveSessionDataChanges(listenToLiveSessionStatus);
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel').service('ActivePanelSrv',
        ["$document", "$compile", "$rootScope", function ($document, $compile, $rootScope) {
            'ngInject';

            var self = this;

            this.loadActivePanel = function () {
                var body = angular.element($document).find('body');

                var canvasContainerElement = angular.element(
                    '<active-panel></active-panel>'
                );

                if (!angular.element(body[0].querySelector('active-panel')).length) {
                    self.scope = $rootScope.$new(true);
                    body.append(canvasContainerElement);
                    $compile(canvasContainerElement.contents())(self.scope);
                }
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'active-panel-call-mute-icon': 'components/calls/svg/call-mute-icon.svg',
                'active-panel-stop-sharing-icon': 'components/activePanel/svg/stop-sharing-icon.svg',
                'active-panel-share-screen-icon': 'components/activePanel/svg/share-screen-icon.svg',
                'active-panel-track-teacher-icon': 'components/activePanel/svg/track-teacher-icon.svg',
                'active-panel-track-student-icon': 'components/activePanel/svg/track-student-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

angular.module('znk.infra.activePanel').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/activePanel/activePanel.template.html",
    "<div class=\"active-panel ng-hide\"\n" +
    "     ng-show=\"d.currStatus === d.states.LIVE_SESSION\"\n" +
    "     translate-namespace=\"ACTIVE_PANEL\">\n" +
    "    <div class=\"flex-container\">\n" +
    "        <div class=\"callee-status flex-col\">\n" +
    "            <div class=\"online-indicator\"\n" +
    "                 ng-class=\"{\n" +
    "                    'offline': d.currentUserPresenceStatus === d.presenceStatusMap.OFFLINE,\n" +
    "                    'online': d.currentUserPresenceStatus === d.presenceStatusMap.ONLINE,\n" +
    "                    'idle': d.currentUserPresenceStatus === d.presenceStatusMap.IDLE\n" +
    "                 }\">\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"callee-name flex-col\">\n" +
    "            {{d.calleeName ? d.calleeName : d.isTeacher ? 'Educator' : 'Student'}}\n" +
    "            <div class=\"live-session-duration\">&nbsp;</div>\n" +
    "        </div>\n" +
    "        <div class=\"call-controls flex-col\">\n" +
    "            <ng-switch class=\"share-screen-icon-wrap\" on=\"d.shareScreenBtnsEnable\">\n" +
    "                <div class=\"active-share-screen\" ng-switch-default>\n" +
    "                    <div ng-click=\"d.viewOtherUserScreen()\"\n" +
    "                         class=\"show-other-screen\"\n" +
    "                         disable-click-drv=\"d.shareScreenBtnsEnable\"\n" +
    "                         ng-class=\"{disabled: !d.shareScreenBtnsEnable}\">\n" +
    "                        <ng-switch on=\"d.isTeacher\">\n" +
    "                            <svg-icon ng-switch-when=\"true\"\n" +
    "                                      name=\"active-panel-track-student-icon\"\n" +
    "                                      title=\"{{d.translatedStrings.SHOW_STUDENT_SCREEN}}\">\n" +
    "                            </svg-icon>\n" +
    "                            <svg-icon ng-switch-default\n" +
    "                                      name=\"active-panel-track-teacher-icon\"\n" +
    "                                      title=\"{{d.translatedStrings.SHOW_TEACHER_SCREEN}}\">\n" +
    "                            </svg-icon>\n" +
    "                        </ng-switch>\n" +
    "                    </div>\n" +
    "\n" +
    "                    <svg-icon disable-click-drv=\"d.shareScreenBtnsEnable\"\n" +
    "                              ng-class=\"{disabled: !d.shareScreenBtnsEnable}\"\n" +
    "                              ng-click=\"d.shareMyScreen()\"\n" +
    "                              name=\"active-panel-share-screen-icon\"\n" +
    "                              class=\"share-my-screen\"\n" +
    "                              title=\"{{d.translatedStrings.SHARE_MY_SCREEN}}\">\n" +
    "                    </svg-icon>\n" +
    "                </div>\n" +
    "\n" +
    "                <svg-icon ng-switch-when=\"false\"\n" +
    "                          class=\"end-share-screen\"\n" +
    "                          ng-class=\"{ 'isViewer' : d.shareScreenViewer }\"\n" +
    "                          ng-click=\"d.endScreenSharing()\"\n" +
    "                          name=\"active-panel-stop-sharing-icon\"\n" +
    "                          title=\"{{d.translatedStrings.END_SCREEN_SHARING}}\">\n" +
    "                </svg-icon>\n" +
    "            </ng-switch>\n" +
    "\n" +
    "            <call-btn ng-model=\"d.callBtnModel\"></call-btn>\n" +
    "\n" +
    "            <div class=\"end-session-wrap\" ng-if=\"d.isTeacher\">\n" +
    "                <div class=\"seperator\"></div>\n" +
    "                <md-button class=\"end-session-btn\"\n" +
    "                            aria-label=\"{{'ACTIVE_PANEL.END_SESSION' | translate}}\"\n" +
    "                            ng-click=\"d.endSession()\">\n" +
    "                <span>{{'ACTIVE_PANEL.END_SESSION' | translate}}</span>\n" +
    "                </md-button>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/activePanel/svg/share-screen-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     class=\"active-panel-share-screen-icon\"\n" +
    "	 viewBox=\"0 0 138 141.3\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<path d=\"M113.2,0H24.8C11.2,0,0,11.2,0,24.8v55.4C0,93.8,11.2,105,24.8,105h88.4c13.6,0,24.8-11.2,24.8-24.8V24.8\n" +
    "	C138,11.2,126.8,0,113.2,0z M71.1,82V63.4c0,0-28.8-4-42.7,15.3c0,0-5.1-34.6,42.9-40.4l-0.3-20L114.3,50L71.1,82z\"/>\n" +
    "<path d=\"M57.4,118.6h22.7c1,0,1.9,0.4,2.4,1.1c2.2,3.1,8.8,11.9,15.3,17.3c1.8,1.5,0.6,4.2-1.9,4.2H42.2c-2.5,0-3.8-2.7-1.9-4.2\n" +
    "	c4.9-4,11.6-10.4,14.5-16.9C55.2,119.2,56.2,118.6,57.4,118.6z\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/activePanel/svg/stop-sharing-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 208.9 208.9\" xml:space=\"preserve\" class=\"stop-sharing-icon-svg\">\n" +
    "<style type=\"text/css\">\n" +
    "    	.stop-sharing-icon-svg {width: 100%; height: auto;}\n" +
    "	    .stop-sharing-icon-svg .st0{fill:#FFFFFF; enable-background:new;}\n" +
    "	    .stop-sharing-icon-svg .st1{fill:#231F20;}\n" +
    "</style>\n" +
    "<g>\n" +
    "	<circle class=\"st0\" cx=\"104.4\" cy=\"104.4\" r=\"101.9\"/>\n" +
    "	<path class=\"st1\" d=\"M104.4,208.9C46.8,208.9,0,162,0,104.4C0,46.8,46.8,0,104.4,0s104.4,46.8,104.4,104.4\n" +
    "		C208.9,162,162,208.9,104.4,208.9z M104.4,5C49.6,5,5,49.6,5,104.4s44.6,99.4,99.4,99.4s99.4-44.6,99.4-99.4S159.3,5,104.4,5z\"/>\n" +
    "</g>\n" +
    "<g id=\"RKT7w7.tif_1_\">\n" +
    "	<g>\n" +
    "		<path class=\"st1\" d=\"M199.6,104.6c-10.1,10.2-21.1,18.6-33.1,25.8c-21.1,12.7-43.5,20.5-68.6,19c-13.8-0.9-26.8-4.7-39.3-10.4\n" +
    "			c-17.4-8-32.9-18.8-46.8-31.9c-0.8-0.8-1.5-1.7-2.5-2.8c10-10.1,21.1-18.6,33.1-25.8c21.2-12.8,43.9-20.7,69.1-19\n" +
    "			c13.8,0.9,26.8,4.8,39.2,10.6c16.8,7.7,31.7,18.1,45.3,30.7C197.1,101.9,198.2,103.1,199.6,104.6z M104.4,72\n" +
    "			C86.2,72,71.9,86.4,72,104.7c0.1,17.9,14.4,32.1,32.5,32.1c17.9,0,32.4-14.4,32.6-32.2C137.2,86.7,122.5,72,104.4,72z\"/>\n" +
    "		<path class=\"st1\" d=\"M110.5,82.8c-2.2,4.7-2.4,9,1.6,12.5c4.2,3.6,8.5,2.9,12.6-0.4c5,8.6,2.7,20.1-5.5,27.1c-8.5,7.3-21,7.3-29.7,0\n" +
    "			c-8.4-7-10.4-19.4-5-29C89.5,84.2,101.7,79,110.5,82.8z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "<rect x=\"3.6\" y=\"102.1\" transform=\"matrix(0.7454 0.6666 -0.6666 0.7454 96.4389 -43.3856)\" class=\"st1\" width=\"202.8\" height=\"5\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/activePanel/svg/track-student-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "	 y=\"0px\"\n" +
    "     class=\"active-panel-track-student-icon\"\n" +
    "     viewBox=\"0 0 138 141.3\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	svg.active-panel-track-student-icon .st0{fill:none;stroke:#000000;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
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
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "	 y=\"0px\"\n" +
    "     class=\"active-panel-track-teacher-icon\"\n" +
    "     viewBox=\"-326 51.7 138 141.3\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	svg.active-panel-track-teacher-icon .st0{fill:none;stroke:#000000;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
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
