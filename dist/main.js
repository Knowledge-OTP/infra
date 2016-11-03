(function (angular) {
    'use strict';

    angular.module('znk.infra', [
        //all modules will be injected here
        "znk.infra.activePanel",
"znk.infra.analytics",
"znk.infra.assignModule",
"znk.infra.auth",
"znk.infra.autofocus",
"znk.infra.calls",
"znk.infra.config",
"znk.infra.content",
"znk.infra.contentAvail",
"znk.infra.contentGetters",
"znk.infra.deviceNotSupported",
"znk.infra.enum",
"znk.infra.estimatedScore",
"znk.infra.evaluator",
"znk.infra.eventManager",
"znk.infra.exams",
"znk.infra.exerciseResult",
"znk.infra.exerciseUtility",
"znk.infra.filters",
"znk.infra.general",
"znk.infra.hint",
"znk.infra.mailSender",
"znk.infra.personalization",
"znk.infra.pngSequence",
"znk.infra.popUp",
"znk.infra.presence",
"znk.infra.scoring",
"znk.infra.screenSharing",
"znk.infra.scroll",
"znk.infra.sharedScss",
"znk.infra.stats",
"znk.infra.storage",
"znk.infra.support",
"znk.infra.svgIcon",
"znk.infra.teachers",
"znk.infra.user",
"znk.infra.userContext",
"znk.infra.utility",
"znk.infra.webcall",
"znk.infra.workouts",
"znk.infra.znkAudioPlayer",
"znk.infra.znkChat",
"znk.infra.znkExercise",
"znk.infra.znkMedia",
"znk.infra.znkModule",
"znk.infra.znkProgressBar",
"znk.infra.znkQuestionReport",
"znk.infra.znkTimeline"
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.activePanel', [
        'znk.infra.svgIcon',
        'znk.infra.calls',
        'pascalprecht.translate',
        'znk.infra.screenSharing',
        'znk.infra.presence'
    ]);
})(angular);

'use strict';

(function (angular) {

    angular.module('znk.infra.activePanel')
        .directive('activePanel', ["$q", "$interval", "$filter", "$log", "CallsUiSrv", "CallsEventsSrv", "CallsStatusEnum", "ScreenSharingSrv", "UserScreenSharingStateEnum", "UserProfileService", "PresenceService", "StudentContextSrv", "TeacherContextSrv", "ENV", "$document", "$translate", function ($q, $interval, $filter, $log, CallsUiSrv, CallsEventsSrv, CallsStatusEnum, ScreenSharingSrv, UserScreenSharingStateEnum, UserProfileService, PresenceService, StudentContextSrv, TeacherContextSrv, ENV, $document, $translate) {
            return {
                templateUrl: 'components/activePanel/activePanel.template.html',
                scope: {},
                link: function(scope, element) {
                    var receiverId,
                        isOffline,
                        isTeacher,
                        callDuration = 0,
                        durationToDisplay,
                        timerInterval,
                        screenShareStatus = 0,
                        callStatus = 0,
                        screenShareIsViewer,
                        timerSecondInterval = 1000,
                        activePanelVisibleClassName = 'activePanel-visible';

                    var bodyDomElem = angular.element($document).find('body');

                    var translateNamespace = 'ACTIVE_PANEL';
                    $translate([
                        translateNamespace + '.' + 'SHOW_STUDENT_SCREEN',
                        translateNamespace + '.' + 'SHOW_TEACHER_SCREEN',
                        translateNamespace + '.' + 'SHARE_MY_SCREEN'
                    ]).then(function (translation) {
                        scope.d.translatedStrings = {
                            SHOW_STUDENT_SCREEN: translation[translateNamespace + '.' + 'SHOW_STUDENT_SCREEN'],
                            SHOW_TEACHER_SCREEN: translation[translateNamespace + '.' + 'SHOW_TEACHER_SCREEN'],
                            SHARE_MY_SCREEN: translation[translateNamespace + '.' + 'SHARE_MY_SCREEN']
                        };
                    }).catch(function (err) {
                        $log.debug('Could not fetch translation', err);
                    });

                    var listenToStudentOrTeacherContextChange = function (prevUid, uid) {
                        receiverId = uid;
                        var promsArr = [
                            PresenceService.getCurrentUserStatus(receiverId),
                            CallsUiSrv.getCalleeName(uid)
                        ];
                        $q.all(promsArr).then(function (res) {
                            scope.d.currentUserPresenceStatus = res[0];
                            isOffline = scope.d.currentUserPresenceStatus === PresenceService.userStatus.OFFLINE;
                            scope.d.calleeName = (res[1]) ? (res[1]) : '';
                            scope.d.callBtnModel = {
                                isOffline: isOffline,
                                receiverId: uid
                            };
                        }).catch(function (err) {
                            $log.debug('error caught at listenToStudentOrTeacherContextChange', err);
                        });
                        $log.debug('student or teacher context changed: ', receiverId);
                    };


                    var initialUid = StudentContextSrv.getCurrUid();
                    if (initialUid) {
                        listenToStudentOrTeacherContextChange(null, initialUid);
                    }

                    if (ENV.appContext.toLowerCase() === 'dashboard') {
                        isTeacher = true;
                        StudentContextSrv.registerToStudentContextChange(listenToStudentOrTeacherContextChange);
                    } else if (ENV.appContext.toLowerCase() === 'student') {
                        isTeacher = false;
                        TeacherContextSrv.registerToTeacherContextChange(listenToStudentOrTeacherContextChange);
                    } else {
                        $log.error('appContext is not compatible with this component: ', ENV.appContext);
                    }

                    scope.d = {
                        states: {
                            NONE: 0,
                            CALL_ACTIVE: 1,
                            SCREEN_SHARE_ACTIVE: 10,
                            BOTH_ACTIVE: 11
                        },
                        shareScreenBtnsEnable: true,
                        isTeacher: isTeacher,
                        presenceStatusMap: PresenceService.userStatus,
                        viewOtherUserScreen: function () {
                            var userData = {
                                isTeacher: !scope.d.isTeacher,
                                uid: receiverId
                            };
                            $log.debug('viewOtherUserScreen: ', userData);
                            ScreenSharingSrv.viewOtherUserScreen(userData);
                        },
                        shareMyScreen: function () {
                            var userData = {
                                isTeacher: !scope.d.isTeacher,
                                uid: receiverId
                            };
                            $log.debug('shareMyScreen: ', userData);
                            ScreenSharingSrv.shareMyScreen(userData);
                        }
                    };

                    var actions = {
                        startTimer: function () {
                            $log.debug('call timer started');
                            if (callDuration !== 0) {
                                return;
                            }
                            timerInterval = $interval(function () {
                                callDuration += timerSecondInterval;
                                durationToDisplay = $filter('formatDuration')(callDuration / 1000, 'hh:MM:SS', true);
                                angular.element(element[0].querySelector('.call-duration')).text(durationToDisplay);
                            }, 1000, 0, false);
                        },
                        stopTimer: function () {
                            destroyTimer();
                        },
                        screenShareMode: function (isScreenShareMode) {
                            if (isScreenShareMode && screenShareIsViewer) {
                                element.addClass('screen-share-mode');
                                $log.debug('screenShareMode activate');
                            } else {
                                element.removeClass('screen-share-mode');
                                $log.debug('screenShareMode remove');
                            }
                        }
                    };

                    function updateStatus() {
                        scope.d.currStatus = screenShareStatus + callStatus;
                        $log.debug('ActivePanel d.currStatus: ', scope.d.currStatus);

                        switch (scope.d.currStatus) {
                            case scope.d.states.NONE :
                                $log.debug('ActivePanel State: NONE');
                                bodyDomElem.removeClass(activePanelVisibleClassName);
                                actions.stopTimer();
                                actions.screenShareMode(false);
                                scope.d.shareScreenBtnsEnable = true;
                                break;
                            case scope.d.states.CALL_ACTIVE :
                                bodyDomElem.addClass(activePanelVisibleClassName);
                                actions.startTimer();
                                scope.d.shareScreenBtnsEnable = true;
                                actions.screenShareMode(false);
                                $log.debug('ActivePanel State: CALL_ACTIVE');
                                break;
                            case scope.d.states.SCREEN_SHARE_ACTIVE :
                                bodyDomElem.addClass(activePanelVisibleClassName);
                                actions.stopTimer();
                                actions.screenShareMode(true);
                                scope.d.shareScreenBtnsEnable = false;
                                $log.debug('ActivePanel State: SCREEN_SHARE_ACTIVE');
                                break;
                            case scope.d.states.BOTH_ACTIVE :
                                bodyDomElem.addClass(activePanelVisibleClassName);
                                $log.debug('ActivePanel State: BOTH_ACTIVE');
                                actions.startTimer();
                                scope.d.shareScreenBtnsEnable = false;
                                actions.screenShareMode(true);
                                break;

                            default :
                                $log.error('currStatus is in an unknown state', scope.d.currStatus);
                        }
                    }

                    function destroyTimer() {
                        $interval.cancel(timerInterval);
                        callDuration = 0;
                        durationToDisplay = 0;
                    }

                    element.on('$destroy', function() {
                        destroyTimer();
                    });

                    // Listen to status changes in Calls
                    var listenToCallsStatus = function (callsData) {
                        if (callsData) {
                            if (callsData.status === CallsStatusEnum.ACTIVE_CALL.enum) {
                                callStatus = scope.d.states.CALL_ACTIVE;
                            } else {
                                callStatus = 0;
                            }
                            updateStatus();
                        }
                    };

                    // Listen to status changes in ScreenSharing
                    var listenToScreenShareStatus = function (screenSharingStatus) {
                        if (screenSharingStatus) {
                            if (screenSharingStatus !== UserScreenSharingStateEnum.NONE.enum) {
                                screenShareStatus = scope.d.states.SCREEN_SHARE_ACTIVE;
                                screenShareIsViewer = (screenSharingStatus === UserScreenSharingStateEnum.VIEWER.enum);
                            } else {
                                screenShareStatus = 0;
                            }
                            updateStatus();
                        }
                    };

                    ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(listenToScreenShareStatus);

                    CallsEventsSrv.registerToCurrUserCallStateChanges(listenToCallsStatus);

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
                    $compile(canvasContainerElement)(self.scope);
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
    "     ng-show=\"d.currStatus !== d.states.NONE\"\n" +
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
    "            {{d.calleeName}}\n" +
    "            <div class=\"call-duration\">&nbsp;</div>\n" +
    "        </div>\n" +
    "        <div class=\"call-controls flex-col\">\n" +
    "            <div ng-click=\"d.viewOtherUserScreen()\"\n" +
    "                 class=\"show-other-screen\"\n" +
    "                 disable-click-drv=\"d.shareScreenBtnsEnable\"\n" +
    "                 ng-class=\"{disabled: !d.shareScreenBtnsEnable}\">\n" +
    "                <ng-switch on=\"d.isTeacher\">\n" +
    "                    <svg-icon ng-switch-when=\"true\"\n" +
    "                              name=\"active-panel-track-student-icon\"\n" +
    "                              title=\"{{d.translatedStrings.SHOW_STUDENT_SCREEN}}\">\n" +
    "                    </svg-icon>\n" +
    "                    <svg-icon ng-switch-default\n" +
    "                              name=\"active-panel-track-teacher-icon\"\n" +
    "                              title=\"{{d.translatedStrings.SHOW_TEACHER_SCREEN}}\">\n" +
    "                    </svg-icon>\n" +
    "                </ng-switch>\n" +
    "            </div>\n" +
    "\n" +
    "            <svg-icon disable-click-drv=\"d.shareScreenBtnsEnable\"\n" +
    "                      ng-class=\"{disabled: !d.shareScreenBtnsEnable}\"\n" +
    "                      ng-click=\"d.shareMyScreen()\"\n" +
    "                      name=\"active-panel-share-screen-icon\"\n" +
    "                      class=\"share-my-screen\"\n" +
    "                      title=\"{{d.translatedStrings.SHARE_MY_SCREEN}}\">\n" +
    "            </svg-icon>\n" +
    "\n" +
    "            <call-btn ng-model=\"d.callBtnModel\"></call-btn>\n" +
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

(function (angular) {
    'use strict';

    angular.module('znk.infra.analytics', []);
})(angular);

/**
 * znkAnalyticsSrv
 *
 *   api:
 *      getEventsConst
 *      getDebugMode
 *      { handlers you register in config phase }
 */
(function (angular) {
    'use strict';

    var _eventsConst = {
        appOpen: 'App Open',
        appClose: 'App Close',
        signUp: 'Sign Up',
        login: 'Login',
        getStartedClicked: 'Get Started Clicked',
        diagnosticStart: 'Diagnostic Start',
        diagnosticEnd: 'Diagnostic End',
        diagnosticSectionStarted: 'Diagnostic Section Started',
        diagnosticSectionCompleted: 'Diagnostic Section Completed',
        diagnosticsSkipAudioClicked: 'Diagnostics Skip Audio Clicked',
        workoutStarted: 'Workout Started',
        workoutCompleted: 'Workout Completed',
        tutorialViewed: 'Tutorial Viewed',
        tutorialClosed: 'Tutorial Closed',
        flashcardStackViewed: 'Flashcard Stack Viewed',
        flashcardStackCompleted: 'Flashcard stack Completed',
        performanceBannerClicked: 'Performance Banner Clicked',
        performanceClosed: 'Performance Closed',
        tipsAndTricksBannerClicked: 'Tips & Tricks Banner Clicked',
        flashcardsBannerClicked: 'Flashcards Banner Clicked',
        fullTestsBannerClicked: 'Full tests Banner Clicked',
        miniTestsBannerClicked: 'Mini Tests Banner Clicked',
        writtenSolutionClicked: 'Written Solution Clicked',
        writtenSolutionClosed: 'Written Solution Closed',
        sectionStarted: 'Section Started',
        sectionCompleted: 'Section Completed',
        testCompleted: 'Test Completed',
        exception: 'Exception',
        upgradeAppVersion: 'Upgrade App Version',
        firstTimeAppOpen: 'First Time App Open',
        appRatePopupOpened: 'App Rate Popup Opened',
        rateButtonClicked: 'Rate Button Clicked',
        cancelRateButtonClicked: 'Cancel Rate Button Clicked',
        laterRateButtonClicked: 'Later Rate Button Clicked',
        purchaseModalOpened: 'Purchase Modal opened',
        purchaseOrderStarted: 'Order Started',
        purchaseOrderPending: 'Order Pending',
        purchaseOrderCompleted: 'Order Completed',
        purchaseOrderCancelled: 'Order Cancelled'
    };

    angular.module('znk.infra.analytics').provider('znkAnalyticsSrv', function () {

        var debug = false;
        var eventsHandler;

        this.setDebugMode = function(mode) {
            debug = mode;
        };

        this.extendEventsConst = function(moreEvents) {
            angular.extend(_eventsConst, moreEvents);
        };

        this.setEventsHandler = function(_eventsHandler) {
            eventsHandler = _eventsHandler;
        };

        this.$get = ['$log', '$injector', 'znkAnalyticsUtilSrv', function($log, $injector, znkAnalyticsUtilSrv) {

            var api = {
                getEventsConst: function() {
                    if(!_eventsConst) {
                        $log.error('znkAnalyticsSrv getEventsConst:  _eventsConst is missing!');
                    }
                    return _eventsConst;
                },
                getDebugMode: function() {
                    return debug;
                }
            };

            if(!eventsHandler) {
                $log.error('znkAnalyticsSrv eventsHandler is missing!');
                return api;
            }

            var eventsFn = $injector.invoke(eventsHandler);
            znkAnalyticsUtilSrv.events.const = _eventsConst;

            angular.forEach(eventsFn, function(value, key) {
                var fn = znkAnalyticsUtilSrv.events.list[key];
                if(fn) {
                    api[key] = fn.bind(null, eventsFn[key]);
                } else {
                    $log.error('znkAnalyticsSrv key is missing in infra or incorrect! key:', key);
                }
            });

            return api;
        }];

    }).run(['znkAnalyticsSrv', '$window', function(znkAnalyticsSrv, $window) {
        var isDebugMode = znkAnalyticsSrv.getDebugMode();
        if(isDebugMode) {
            $window.znkAnalyticsEvents = znkAnalyticsSrv.getEventsConst();
        }
    }]);
})(angular);

(function (angular) {
    'use strict';

    function _getTimeInDay() {
        var date = new Date();
        var hours = date.getHours();
        var timeStr;

        if(hours >= 6 && hours < 12) {
            timeStr = 'Morning';
        } else if(hours >= 12 && hours < 18) {
            timeStr = 'Afternoon';
        } else if(hours >= 18 && hours < 24) {
            timeStr = 'Evening';
        } else if(hours >= 24 && hours < 6) {
            timeStr = 'Night';
        } else {
            timeStr = date.toString();
        }

        return timeStr;
    }

    function _getQuestionsStats(arr) {
        return arr.reduce(function(previousValue, currentValue) {
            if(currentValue.userAnswer) {
                if(currentValue.isAnsweredCorrectly) {
                    previousValue.correct++;
                } else {
                    previousValue.wrong++;
                }
            } else {
                previousValue.skip++;
            }
            return previousValue;
        },{ correct: 0, wrong: 0, skip: 0 });
    }

    angular.module('znk.infra.analytics').service('znkAnalyticsUtilSrv', ['$log', function ($log) {

        var self = this;

        function _extendProps(eventObj) {
            eventObj.props = eventObj.props || {};
            if(eventObj.dayTime) {
                eventObj.props.dayTime = _getTimeInDay();
            }
            if(eventObj.questionsArr) {
                eventObj.props = angular.extend({}, eventObj.props, _getQuestionsStats(eventObj.questionsArr));
            }
            return eventObj.props;
        }

        function _getNewEvent(eventObj) {
            var events = self.events.const;
            if(!events) {
                $log.error('znkAnalyticsUtilSrv events const not defined!', self.events);
                return;
            }
            var newEventObj = {};
            if(eventObj.eventName) {
                if(events[eventObj.eventName]) {
                    newEventObj.eventName = events[eventObj.eventName];
                } else if(eventObj.nameOnTheFly) {
                    newEventObj.eventName = eventObj.eventName;
                } else {
                    $log.error('znkAnalyticsUtilSrv eventName not matching any eky in events const key:', eventObj.eventName);
                }
            }
            newEventObj.props = _extendProps(eventObj);
            return newEventObj;
        }

        function _eventFn(fn, eventObj) {
            var newEventObj = _getNewEvent(eventObj);
            return fn(newEventObj);
        }

        this.events = {};

        this.events.list = {
            eventTrack: _eventFn,
            timeTrack: _eventFn,
            pageTrack: _eventFn,
            setUsername: _eventFn,
            setUserProperties: _eventFn
        };
    }]);
})(angular);

angular.module('znk.infra.analytics').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule', ['znk.infra.znkModule', 'znk.infra.exerciseResult', 'znk.infra.userContext']);
})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.assignModule').service('UserAssignModuleService', [
        'ZnkModuleService', '$q', 'SubjectEnum', 'ExerciseResultSrv', 'ExerciseStatusEnum', 'ExerciseTypeEnum', 'EnumSrv', '$log', 'InfraConfigSrv', 'StudentContextSrv',
        function (ZnkModuleService, $q, SubjectEnum, ExerciseResultSrv, ExerciseStatusEnum, ExerciseTypeEnum, EnumSrv, $log, InfraConfigSrv, StudentContextSrv) {
            var userAssignModuleService = {};
            var registerEvents = {};
            userAssignModuleService.assignModules = {};

            userAssignModuleService.assignModuleStatus = new EnumSrv.BaseEnum([
                ['UNLOCKED', ExerciseStatusEnum.NEW.enum, 'unlocked'],
                ['IN-PROGRESS', ExerciseStatusEnum.ACTIVE.enum, 'in progress'],
                ['COMPLETED', ExerciseStatusEnum.COMPLETED.enum, 'completed']
            ]);

            userAssignModuleService.offExternalOnValue = function (userId, valueCB, changeCB) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    studentStorage.offEvent('value', 'users/' + userId + '/moduleResults', onValueEventCB);
                    angular.forEach(registerEvents[userId].valueCB, function (cb, index) {
                        if (cb === valueCB) {
                            registerEvents[userId].valueCB.splice(index, 1);
                        }
                    });

                    if (registerEvents[userId].changeCB) {
                        angular.forEach(registerEvents[userId].changeCB, function (cbData, index) {
                            if (cbData.cb === changeCB) {
                                angular.forEach(cbData.guids, function (resultGuid) {
                                    studentStorage.offEvent('child_changed', 'moduleResults/' + resultGuid, onModuleResultChangedCB);
                                });
                                registerEvents[userId].changeCB.splice(index, 1);
                            }
                        });
                    }
                });
            };

            userAssignModuleService.registerExternalOnValueCB = function (userId, valueCB, changeCB) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    if (!registerEvents[userId]) {
                        registerEvents[userId] = {};
                    }

                    if (!registerEvents[userId].valueCB) {
                        registerEvents[userId].valueCB = [];
                    }
                    registerEvents[userId].valueCB.push(valueCB);

                    if (!registerEvents[userId].changeCB) {
                        registerEvents[userId].changeCB = [];
                    }
                    registerEvents[userId].changeCB.push({
                        cb: changeCB,
                        guids: []
                    });


                    studentStorage.onEvent('value', 'users/' + userId + '/moduleResults', onValueEventCB);
                });
            };

            userAssignModuleService.setUserAssignModules = function (moduleIds, userId, tutorId) {
                if (!angular.isArray(moduleIds)) {
                    var errMSg = 'UserAssignModuleService: 1st argument should be array of module ids';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                var moduleResults = {};
                var getProm = $q.when();
                angular.forEach(moduleIds, function (moduleId) {
                    getProm = getProm.then(function () {
                        return ExerciseResultSrv.getModuleResult(userId, moduleId, false, false).then(function (moduleResult) {
                            moduleResults[moduleId] = moduleResult;
                            return moduleResults;
                        });
                    });

                });
                return getProm.then(function () {
                    var saveProm = $q.when();
                    angular.forEach(moduleIds, function (moduleId) {
                        saveProm = saveProm.then(function () {
                            return ZnkModuleService.getModuleById(moduleId).then(function (moduleObj) {
                                if (!moduleResults[moduleId]) {
                                    moduleResults[moduleId] = ExerciseResultSrv.getDefaultModuleResult(moduleId, userId);
                                    moduleResults[moduleId].assignedTutorId = tutorId;
                                    // copy fields from module object to results object for future using
                                    moduleResults[moduleId].name = moduleObj.name;
                                    moduleResults[moduleId].desc = moduleObj.desc;
                                    moduleResults[moduleId].subjectId = moduleObj.subjectId;
                                    moduleResults[moduleId].order = moduleObj.order;
                                    moduleResults[moduleId].exercises = moduleObj.exercises;
                                    moduleResults[moduleId].assignDate = Date.now();
                                }
                                moduleResults[moduleId].assign = true;
                                return ExerciseResultSrv.setModuleResult(moduleResults[moduleId], moduleId);
                            });
                        });
                    });

                    return saveProm.then(function () {
                        return moduleResults;
                    });
                });
            };

            userAssignModuleService.setAssignContent = function (userId, moduleId) {
                return ExerciseResultSrv.getModuleResult(userId, moduleId).then(function (moduleResult) {
                    moduleResult.contentAssign = true;
                    return ExerciseResultSrv.setModuleResult(moduleResult, moduleId);
                });
            };

            function onValueEventCB(moduleResultsGuids) {
                if (angular.isUndefined(moduleResultsGuids) || !moduleResultsGuids) {
                    var userId = StudentContextSrv.getCurrUid();
                    userAssignModuleService.assignModules = {};
                    applyCB(registerEvents[userId].valueCB);
                    return;
                }
                buildResultsFromGuids(moduleResultsGuids);
            }

            function buildResultsFromGuids(moduleResultsGuids) {
                InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    var moduleResults = {};
                    var getProm = $q.when();
                    var getPromArr = [];
                    var userId = StudentContextSrv.getCurrUid();

                    angular.forEach(moduleResultsGuids, function (resultGuid, moduleId) {
                        getProm = getResultsByModuleId(userId, moduleId).then(function (moduleResult) {
                            moduleResults[moduleResult.moduleId] = moduleResult;

                            angular.forEach(registerEvents[userId].changeCB, function (cbData) {
                                if (cbData.guids.indexOf(moduleResult.guid) === -1) {
                                    cbData.guids.push(moduleResult.guid);
                                    studentStorage.onEvent('child_changed', 'moduleResults/' + moduleResult.guid, onModuleResultChangedCB);
                                }
                            });
                        });
                        getPromArr.push(getProm);
                    });

                    $q.all(getPromArr).then(function () {
                        userAssignModuleService.assignModules = moduleResults;
                        applyCB(registerEvents[userId].valueCB);
                    });
                });
            }

            function getResultsByModuleId(userId, moduleId) {
                return ExerciseResultSrv.getModuleResult(userId, moduleId, false, true).then(function (moduleResult) {
                    if (moduleResult && !angular.equals(moduleResult, {})) {
                        moduleResult.moduleSummary = getModuleSummary(moduleResult);

                        InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                            angular.forEach(moduleResult.exerciseResults, function (exerciseTypeId) {
                                angular.forEach(exerciseTypeId, function (exercise) {
                                    var exerciseResultsPath = 'exerciseResults/' + exercise.guid;
                                    studentStorage.getAndBindToServer(exerciseResultsPath);
                                });
                            });
                        });
                    }
                    return moduleResult;
                });
            }

            function onModuleResultChangedCB() {
                var userId = StudentContextSrv.getCurrUid();
                ExerciseResultSrv.getUserModuleResultsGuids(userId).then(function (moduleResultsGuids) {
                    buildResultsFromGuids(moduleResultsGuids);
                });
            }

            function applyCB(cbArr) {
                angular.forEach(cbArr, function (valueCB) {
                    if (angular.isFunction(valueCB)) {
                        valueCB(userAssignModuleService.assignModules);
                    }
                });
            }

            function getModuleSummary(assignModule) {
                var moduleSummary = {};
                var _exerciseResults = assignModule.exerciseResults;

                function newSummary() {
                    return {
                        status: ExerciseStatusEnum.NEW.enum,
                        correctAnswersNum: 0,
                        wrongAnswersNum: 0,
                        skippedAnswersNum: 0,
                        totalAnswered: 0,
                        duration: 0
                    };
                }
                function newOverAll() {
                    return {
                        status: ExerciseStatusEnum.NEW.enum,
                        totalCorrectAnswers: 0,
                        totalWrongAnswers: 0,
                        totalSkippedAnswers: 0
                    };
                }

                if (assignModule.exercises) {

                    var exercises = assignModule.exercises.filter(function (exercise) {
                        return exercise.exerciseTypeId !== ExerciseTypeEnum.LECTURE.enum;
                    });

                    if (exercises && exercises.length) {
                        exercises.forEach(function (exercise) {

                            if (!moduleSummary[exercise.exerciseTypeId]){
                                moduleSummary[exercise.exerciseTypeId] = {};
                            }

                            if (!moduleSummary[exercise.exerciseTypeId][exercise.exerciseId]){
                                moduleSummary[exercise.exerciseTypeId][exercise.exerciseId] = newSummary();
                            }

                            var _summary = moduleSummary[exercise.exerciseTypeId][exercise.exerciseId];
                            if (_exerciseResults && _exerciseResults[exercise.exerciseTypeId]) {
                                if (_exerciseResults[exercise.exerciseTypeId][exercise.exerciseId]){
                                    _summary.status =  _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].isComplete ? ExerciseStatusEnum.COMPLETED.enum : ExerciseStatusEnum.ACTIVE.enum;
                                } else {
                                    _summary.status = _summary.status ? _summary.status : ExerciseStatusEnum.NEW.enum;
                                }

                                _summary.correctAnswersNum = _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].correctAnswersNum || 0;
                                _summary.wrongAnswersNum = _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].wrongAnswersNum || 0;
                                _summary.skippedAnswersNum = _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].skippedAnswersNum || 0;
                                _summary.duration = _exerciseResults[exercise.exerciseTypeId][exercise.exerciseId].duration || 0;
                                _summary.totalAnswered = _summary.correctAnswersNum + _summary.wrongAnswersNum;
                            }
                            
                            if (!moduleSummary.overAll) {
                                moduleSummary.overAll = newOverAll();
                            }
                            var _overAll = moduleSummary.overAll;
                            _overAll.status =  _overAll.status < _summary.status ? _summary.status : _overAll.status;
                            _overAll.totalCorrectAnswers += _summary.correctAnswersNum;
                            _overAll.totalWrongAnswers += _summary.wrongAnswersNum;
                            _overAll.totalSkippedAnswers += _summary.skippedAnswersNum;

                        });
                    }
                }
                return moduleSummary;
            }

            return userAssignModuleService;
        }
    ]);
})(angular);


angular.module('znk.infra.assignModule').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth', [
        'pascalprecht.translate',
        'znk.infra.config'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        ["ENV", "$q", "$timeout", "$log", "StorageFirebaseAdapter", "StorageSrv", "$http", "$rootScope", function (ENV, $q, $timeout, $log, StorageFirebaseAdapter, StorageSrv, $http, $rootScope) {
            'ngInject';

            var refAuthDB = new Firebase(ENV.fbGlobalEndPoint, ENV.firebaseAppScopeName);
            var rootRef = new Firebase(ENV.fbDataEndPoint, ENV.firebaseAppScopeName);

            var authService = {};

            authService.saveRegistration = function (registration, login) {
                var registerInProgress = true;
                var dfd = $q.defer();
                authService.logout(true);

                var timeoutPromise = $timeout(function () {
                    if (registerInProgress) {
                        dfd.reject('timeout');
                    }
                }, ENV.promiseTimeOut);

                registration.profile = {};

                refAuthDB.createUser(registration).then(function () {
                    registerInProgress = false;
                    $timeout.cancel(timeoutPromise);

                    if (login) {
                        authService.login({
                            email: registration.email,
                            password: registration.password
                        }).then(function (loginData) {
                            authService.registerFirstLogin();
                            dfd.resolve(loginData);
                        }, function (err) {
                            dfd.reject(err);
                        });
                    } else {
                        dfd.resolve();
                    }
                }, function (error) {
                    $timeout.cancel(timeoutPromise);
                    dfd.reject(error);
                });
                return dfd.promise;
            };

            authService.login = function (loginData) {
                var deferred = $q.defer();

                refAuthDB.unauth();

                refAuthDB.authWithPassword(loginData).then(function (authData) {
                    $log.debug('authSrv::login(): uid=' + authData.uid);
                    _onAuth(authData).then(function () {
                        deferred.resolve(authData);
                    });
                }).catch(function (err) {
                    authService.logout();
                    deferred.reject(err);
                });

                return deferred.promise;
            };

            authService.logout = function () {
                refAuthDB.unauth();
                rootRef.unauth();
            };

            authService.forgotPassword = function (forgotPasswordData) {
                return refAuthDB.resetPassword(forgotPasswordData);
            };

            authService.getAuth = function() {
                var authData = rootRef.getAuth();
                if (!authData) {
                    return null;
                }

                if (!authData.auth) {
                    authData.auth = {};
                }

                if (!authData.password) {
                    authData.password = {};
                }

                var userEmail = authData.auth.email || authData.password.email;
                authData.auth.email = authData.password.email = userEmail;
                return authData;
            };

            authService.changePassword = function (changePasswordData) {
                var refAuthData = refAuthDB.getAuth();
                changePasswordData.email = (refAuthData.password && refAuthData.password.email) ? refAuthData.password.email : '';
                return refAuthDB.changePassword(changePasswordData);
            };

            authService.createAuthWithCustomToken = function (refDB, token) {
                var deferred = $q.defer();
                refDB.authWithCustomToken(token, function (error, userData) {
                    if (error) {
                        deferred.reject(error);
                    }
                    $log.debug('createAuthWithCustomToken: uid=' + userData.uid);
                    deferred.resolve(userData);
                });
                return deferred.promise;
            };

            authService.userDataForAuthAndDataFb = function (data) {
                var proms = [
                    authService.createAuthWithCustomToken(refAuthDB, data.authToken),
                    authService.createAuthWithCustomToken(rootRef, data.dataToken)
                ];
                return $q.all(proms);
            };

            authService.registerFirstLogin = function () {
                var storageSrv = storageObj();
                var firstLoginPath = 'firstLogin/' + authService.getAuth().uid;
                return storageSrv.get(firstLoginPath).then(function (userFirstLoginTime) {
                    if (angular.equals(userFirstLoginTime, {})) {
                        storageSrv.set(firstLoginPath, Date.now());
                    }
                });
            };

            function storageObj (){
                var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint + '/' + ENV.firebaseAppScopeName);
                var config = {
                    variables: {
                        uid: function () {
                            return authService.getAuth().uid;
                        }
                    }
                };
                return new StorageSrv(fbAdapter, config);
            }

            function _dataLogin() {
                var postUrl = ENV.backendEndpoint + 'firebase/token';
                var authData = refAuthDB.getAuth();
                var postData = {
                    email: authData.password ? authData.password.email : '',
                    uid: authData.uid,
                    fbDataEndPoint: ENV.fbDataEndPoint,
                    fbEndpoint: ENV.fbGlobalEndPoint,
                    auth: ENV.dataAuthSecret,
                    token: authData.token
                };

                return $http.post(postUrl, postData).then(function (token) {
                    var defer = $q.defer();
                    rootRef.authWithCustomToken(token.data, function (error, userAuthData) {
                        if (error) {
                            defer.reject(error);
                        }
                        $log.debug('authSrv::login(): uid=' + userAuthData.uid);
                        defer.resolve(userAuthData);
                    });
                    return defer.promise;
                });
            }

            function _onAuth(data) {
                var _loginAuthData = data;

                if (_loginAuthData) {
                    return _dataLogin(_loginAuthData).then(function () {
                        $rootScope.$broadcast('auth:login', _loginAuthData);
                    });
                }
                $rootScope.$broadcast('auth:logout');
                return $q.when();
            }

            return authService;
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth')
        .service('AuthHelperService', ["$filter", "ENV", function ($filter, ENV) {
            'ngInject';

            var translateFilter = $filter('translate');
            var excludeDomains = ['mailinator.com'];

            this.errorMessages = {
                DEFAULT_ERROR: translateFilter('AUTH_HELPER.DEFAULT_ERROR_MESSAGE'),
                FB_ERROR: translateFilter('AUTH_HELPER.FACEBOOK_ERROR'),
                EMAIL_EXIST: translateFilter('AUTH_HELPER.EMAIL_EXIST'),
                INVALID_EMAIL: translateFilter('AUTH_HELPER.INVALID_EMAIL'),
                NO_INTERNET_CONNECTION_ERR: translateFilter('AUTH_HELPER.NO_INTERNET_CONNECTION_ERR'),
                EMAIL_NOT_EXIST: translateFilter('AUTH_HELPER.EMAIL_NOT_EXIST'),
                INCORRECT_EMAIL_AND_PASSWORD_COMBINATION: translateFilter('AUTH_HELPER.INCORRECT_EMAIL_AND_PASSWORD_COMBINATION')
            };

            this.isDomainExclude = function (userEmail) {
                var userDomain = userEmail.substr(userEmail.indexOf('@') + 1);
                if (userDomain.toLowerCase() !== 'zinkerz.com' && ENV.enforceZinkerzDomainSignup) {
                    return true;
                }

                var domains = excludeDomains.filter(function (excludeDomain) {
                    return excludeDomain === userDomain;
                });
                return domains.length > 0;
            };
        }]);
})(angular);

angular.module('znk.infra.auth').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.autofocus', ['znk.infra.enum', 'znk.infra.svgIcon']);
})(angular);

/**
 * the HTML5 autofocus property can be finicky when it comes to dynamically loaded
 * templates and such with AngularJS. Use this simple directive to
 * tame this beast once and for all.
 *
 * Usage:
 * <input type="text" autofocus>
 *
 * License: MIT
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.autofocus')
        .directive('ngAutofocus', ['$timeout', function($timeout) {
            return {
                restrict: 'A',
                link : function(scope, element, attrs) {
                    if(scope.$eval(attrs.ngAutofocus)){
                        $timeout(function() {
                            element[0].focus();
                        }, 0, false);
                    }
                }
            };
        }]);
})(angular);


angular.module('znk.infra.autofocus').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls', [
        'znk.infra.webcall',
        'znk.infra.config',
        'znk.infra.user',
        'znk.infra.enum',
        'ngMaterial',
        'znk.infra.svgIcon',
        'znk.infra.callsModals'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'incoming-call-icon': 'components/calls/svg/incoming-call-icon.svg',
                'outgoing-call-icon': 'components/calls/svg/outgoing-call-icon.svg',
                'call-error-exclamation-mark-icon': 'components/calls/svg/call-error-exclamation-mark-icon.svg',
                'calls-etutoring-phone-icon': 'components/calls/svg/etutoring-phone-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(["WebcallSrvProvider", "ENV", function (WebcallSrvProvider, ENV) {
            'ngInject';
            WebcallSrvProvider.setCallCred({
                username: ENV.plivoUsername,
                password: ENV.plivoPassword
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').component('callBtn', {
            templateUrl: 'components/calls/directives/callBtn/callBtn.template.html',
            require: {
                parent: '?^ngModel'
            },
            controllerAs: 'vm',
            controller: ["CallsSrv", "CallsBtnSrv", "CallsErrorSrv", "CallsBtnStatusEnum", "$log", "$scope", "CALL_UPDATE", function (CallsSrv, CallsBtnSrv, CallsErrorSrv, CallsBtnStatusEnum, $log, $scope, CALL_UPDATE) {
                var vm = this;
                var receiverId;

                var isPendingClick = false;

                vm.callBtnEnum = CallsBtnStatusEnum;

                function _changeBtnState(state) {
                    vm.callBtnState = state;
                }

                function _isStateNotOffline() {
                    return vm.callBtnState !== CallsBtnStatusEnum.OFFLINE_BTN.enum;
                }

                function _isNoPendingClick() {
                    return !isPendingClick;
                }

                function _clickStatusSetter(clickStatus) {
                    isPendingClick = clickStatus;
                }

                function _initializeBtnStatus(receiverId) {
                    CallsBtnSrv.initializeBtnStatus(receiverId).then(function (status) {
                        if (status) {
                            _changeBtnState(status);
                        }
                    });
                }

                $scope.$on(CALL_UPDATE, function (e, callsData) {
                    if (callsData.status) {
                        CallsBtnSrv.updateBtnStatus(receiverId, callsData).then(function (status) {
                            if (status) {
                                _changeBtnState(status);
                            }
                        });
                    }
                });

                // default btn state offline
                _changeBtnState(CallsBtnStatusEnum.OFFLINE_BTN.enum);

                vm.$onInit = function() {
                    var ngModelCtrl = vm.parent;
                    if (ngModelCtrl) {
                        ngModelCtrl.$render = function() {
                            var modelValue = ngModelCtrl.$modelValue;
                            if (modelValue && angular.isDefined(modelValue.isOffline) && modelValue.receiverId) {
                                var curBtnStatus = modelValue.isOffline ? CallsBtnStatusEnum.OFFLINE_BTN.enum : CallsBtnStatusEnum.CALL_BTN.enum;
                                receiverId = modelValue.receiverId;
                                _changeBtnState(curBtnStatus);
                                _initializeBtnStatus(receiverId);
                            }
                        };
                    }
                };

                vm.clickBtn = function() {
                    if (_isStateNotOffline() && _isNoPendingClick()) {
                        _clickStatusSetter(true);

                        CallsSrv.callsStateChanged(receiverId).then(function (data) {
                            _clickStatusSetter(false);
                            $log.debug('callBtn: success in callsStateChanged, data: ', data);
                        }).catch(function (err) {
                            _clickStatusSetter(false);
                            $log.error('callBtn: error in callsStateChanged, err: ' + err);
                            CallsErrorSrv.showErrorModal(err);
                        });
                    }
                };
            }]
        }
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallsActionStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['DISCONNECT_ACTION', 1, 'disconnect'],
                ['CONNECT_ACTION', 2, 'connect'],
                ['DISCONNECT_AND_CONNECT_ACTION', 3, 'disconnect and connect']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallsBtnStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['OFFLINE_BTN', 1, 'offline btn'],
                ['CALL_BTN', 2, 'call btn'],
                ['CALLED_BTN', 3, 'called btn']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallsStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['PENDING_CALL', 1, 'pending call'],
                ['DECLINE_CALL', 2, 'decline call'],
                ['ACTIVE_CALL', 3, 'active call'],
                ['ENDED_CALL', 4, 'ended call']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('ErrorModalCtrl',
        ["$scope", "CallsUiSrv", function ($scope, CallsUiSrv) {
            'ngInject';
            $scope.errorMessage = this.modalData.errorMessage;
            $scope.errorValues = this.modalData.errorValues;
            $scope.closeModal = CallsUiSrv.closeModal;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl',
        ["$scope", "CallsSrv", "CallsUiSrv", "CallsStatusEnum", "$log", "CallsErrorSrv", "$timeout", "$window", "ENV", function ($scope, CallsSrv, CallsUiSrv, CallsStatusEnum, $log, CallsErrorSrv, $timeout, $window, ENV) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            var mySound;

            var soundSrc = ENV.mediaEndpoint + '/general/incomingCall.mp3';

            CallsUiSrv.getCalleeName(callsData.callerId).then(function(res){
                $scope.callerName = res;
            });

            var otherUserDecline = false;

            $scope.$watch('callsData', function(newVal) {
                if (angular.isDefined(newVal) && newVal.status) {
                    switch(newVal.status) {
                        case CallsStatusEnum.DECLINE_CALL.enum:
                            otherUserDecline = true;
                            stopAudio();
                            break;
                    }
                    callsData = newVal;
                }
            });

            var isPendingClick = false;

            $scope.declineByOther = true;

            function _isNoPendingClick() {
                return !isPendingClick;
            }

            function _clickStatusSetter(clickStatus) {
                isPendingClick = clickStatus;
            }

            function _fillLoader(bool, methodName) {
                if (methodName === 'acceptCall') {
                    if (bool === true) {
                        $timeout(function() {
                            self.fillLoader = bool;
                        }, 2500);
                    } else {
                        self.fillLoader = bool;
                    }
                }
            }

            function _startLoader(bool, methodName) {
                if (methodName === 'acceptCall') {
                    self.startLoader = bool;
                }
            }

            function _updateBtnStatus(bool, methodName) {
                _clickStatusSetter(bool);
                _startLoader(bool, methodName);
                _fillLoader(bool, methodName);
            }

            function playAudio() {
                if ($window.Audio) {
                    try {
                        mySound = new $window.Audio(soundSrc);
                        mySound.addEventListener('ended', function() {
                            this.currentTime = 0;
                            this.play();
                        }, false);
                        mySound.play();
                    } catch(e) {
                        $log.error('IncomingCallModalCtrl: playAudio failed!' +' err: ' + e);
                    }
                } else {
                    $log.error('IncomingCallModalCtrl: audio is not supported!');
                }
            }

            function stopAudio() {
                if ($window.Audio && angular.isDefined(mySound)) {
                    mySound.pause();
                    mySound.currentTime = 0;
                    mySound = new $window.Audio('');
                }
            }

            $scope.$on('$destroy', function() {
                stopAudio();
            });

            playAudio();

            function _baseCall(callFn, methodName) {
                 callsData = self.scope.callsData;
                if (_isNoPendingClick()) {
                    if (methodName === 'declineCall') {
                        $scope.declineByOther = false;
                    }
                    _updateBtnStatus(true, methodName);
                    callFn(callsData).then(function () {
                        stopAudio();
                        _updateBtnStatus(false, methodName);
                        CallsUiSrv.closeModal();
                        if (methodName === 'acceptCall' && otherUserDecline) {
                            CallsSrv.declineCall(callsData);
                            otherUserDecline = false;
                        }
                    }).catch(function (err) {
                        _updateBtnStatus(false, methodName);
                        $log.error('IncomingCallModalCtrl '+ methodName +': err: ' + err);
                        stopAudio();
                        CallsErrorSrv.showErrorModal(err);
                        CallsSrv.declineCall(callsData);
                    });
                }
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall');

            this.acceptCall = _baseCall.bind(null, CallsSrv.acceptCall, 'acceptCall');

            this.closeModal = CallsUiSrv.closeModal;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('OutgoingCallModalCtrl',
        ["CallsSrv", "CallsUiSrv", "$log", "CallsStatusEnum", "$scope", "$timeout", "CallsErrorSrv", function (CallsSrv, CallsUiSrv, $log, CallsStatusEnum, $scope, $timeout, CallsErrorSrv) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            var isPendingClick = false;

            function _isNoPendingClick() {
                return !isPendingClick;
            }

            function _clickStatusSetter(clickStatus) {
                isPendingClick = clickStatus;
            }

            CallsUiSrv.getCalleeName(callsData.receiverId).then(function(res){
                $scope.calleeName = res;
            });

            $scope.declineByOther = true;

            $scope.$watch('callsData', function(newVal) {
                if (angular.isDefined(newVal) && newVal.status) {
                     switch(newVal.status) {
                         case CallsStatusEnum.ACTIVE_CALL.enum:
                             $timeout(function() {
                                 CallsUiSrv.closeModal();
                             }, 2000);
                             break;
                     }
                    callsData = newVal;
                }
            });

            function _baseCall(callFn, methodName) {
                callsData = self.scope.callsData;
                if (_isNoPendingClick()) {
                    if (methodName === 'declineCall') {
                        $scope.declineByOther = false;
                    }
                    _clickStatusSetter(true);
                    callFn(callsData).then(function () {
                        _clickStatusSetter(false);
                        CallsUiSrv.closeModal();
                    }).catch(function (err) {
                        _clickStatusSetter(false);
                        $log.error('OutgoingCallModalCtrl '+ methodName +': err: ' + err);
                        CallsErrorSrv.showErrorModal(err);
                    });
                }
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall');

            this.closeModalAndDisconnect = _baseCall.bind(null, CallsSrv.disconnectCall, 'disconnectCall');
        }]
    );
})(angular);

(function(){
    'use strict';

    angular.module('znk.infra.calls').run(
        ["CallsEventsSrv", function(CallsEventsSrv){
            'ngInject';

            CallsEventsSrv.activate();
        }]
    );
})();

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsBtnSrv',
        ["CallsStatusEnum", "CallsBtnStatusEnum", "UserProfileService", "$log", "CallsDataGetterSrv", function (CallsStatusEnum, CallsBtnStatusEnum, UserProfileService, $log, CallsDataGetterSrv) {
            'ngInject';

            var self = this;

             this.getBtnStatus = function _getBtnStatus(callStatus) {
                var status;
                switch(callStatus) {
                    case CallsStatusEnum.PENDING_CALL.enum:
                        status = CallsBtnStatusEnum.CALLED_BTN.enum;
                        break;
                    case CallsStatusEnum.DECLINE_CALL.enum:
                        status = CallsBtnStatusEnum.CALL_BTN.enum;
                        break;
                    case CallsStatusEnum.ACTIVE_CALL.enum:
                        status = CallsBtnStatusEnum.CALLED_BTN.enum;
                        break;
                    case CallsStatusEnum.ENDED_CALL.enum:
                        status = CallsBtnStatusEnum.CALL_BTN.enum;
                }
                return status;
            };

            this.initializeBtnStatus = function(receiverId) {
                return CallsDataGetterSrv.getCallStatus(receiverId).then(function(status) {
                    return self.getBtnStatus(status);
                });
            };

            this.updateBtnStatus = function(receiverId, callsData) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    var status = false;
                    if (CallsDataGetterSrv.isCallDataHasReceiverIdOrCallerId(callsData, receiverId, callerId)) {
                         status = self.getBtnStatus(callsData.status);
                    }
                    return status;
                }).catch(function(err){
                    $log.error('Error in CallsBtnSrv updateBtnStatus in UserProfileService.getCurrUserId(): err: ' + err);
                });
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsDataGetterSrv',
        ["InfraConfigSrv", "$q", "ENV", "UserProfileService", "$log", "CallsActionStatusEnum", function (InfraConfigSrv, $q, ENV, UserProfileService, $log, CallsActionStatusEnum) {
            'ngInject';

            var self = this;

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            function _isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId) {
                return callsData.callerId === callerId && callsData.receiverId === receiverId;
            }

            function _isNewReceiverIdMatchActiveCallerId(callsData, callerId, receiverId) {
                return callsData.receiverId === callerId && callsData.callerId === receiverId;
            }

            function _isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId) {
                return callsData.callerId === callerId && callsData.receiverId !== receiverId;
            }

            function _isNewReceiverIdNotMatchActiveCallerId(callsData, callerId, receiverId) {
                return callsData.receiverId === callerId && callsData.callerId !== receiverId;
            }

            function _isCallDataHasReceiverIdOrCallerId(callsData, receiverId, callerId) {
                return (callsData.receiverId === receiverId &&
                    callsData.callerId === callerId) ||
                    (callsData.receiverId === callerId &&
                    callsData.callerId === receiverId);
            }

            function _getCallsRequests(uid, path) {
                return _getStorage().then(function(storage){
                    var currUserCallsDataPath = path ? path : ENV.firebaseAppScopeName + '/users/' + uid + '/calls';
                    return storage.get(currUserCallsDataPath);
                }).catch(function(err){
                    $log.error('Error in _getStorage', err);
                    return $q.reject(err);
                });
            }

            function _getCallsDataMap(callsRequests) {
                var callsDataPromMap = {};
                angular.forEach(callsRequests, function(isActive, guid){
                    if(isActive) {
                        callsDataPromMap[guid] = self.getCallsData(guid);
                    }
                });
                return $q.all(callsDataPromMap);
            }

            this.getCallsDataPath = function (guid) {
                var SCREEN_SHARING_ROOT_PATH = 'calls';
                return SCREEN_SHARING_ROOT_PATH + '/' + guid;
            };

            this.getCallsRequestsPath  = function (uid, isTeacher) {
                var appName = isTeacher ? ENV.dashboardAppName : ENV.studentAppName;
                var USER_DATA_PATH = appName  + '/users/' + uid;
                return USER_DATA_PATH + '/calls';
            };

            this.getCallsData = function (callsGuid) {
                var callsDataPath = self.getCallsDataPath(callsGuid);
                return _getStorage().then(function (storage) {
                    return storage.get(callsDataPath);
                }).catch(function(err){
                    $log.error('Error in _getStorage', err);
                    return $q.reject(err);
                });
            };

            this.getCurrUserCallsRequests = function(){
                return UserProfileService.getCurrUserId().then(function(currUid){
                    return _getCallsRequests(currUid);
                }).catch(function(err){
                    $log.error('Error in UserProfileService.getCurrUserId', err);
                    return $q.reject(err);
                });
            };

            this.getCurrUserCallsData = function () {
                return self.getCurrUserCallsRequests().then(function(currUserCallsRequests){
                      return _getCallsDataMap(currUserCallsRequests);
                });
            };

            this.getReceiverCallsData = function (receiverId, isTeacherApp) {
                var receiverPath = self.getCallsRequestsPath(receiverId, !isTeacherApp);
                return _getCallsRequests(receiverId, receiverPath).then(function(receiverCallsRequests){
                    return _getCallsDataMap(receiverCallsRequests);
                });
            };

            this.getUserCallActionStatus = function(callerId, receiverId) {
                return self.getCurrUserCallsData().then(function (callsDataMap) {
                    var userCallData = false;
                    var callsDataMapKeys = Object.keys(callsDataMap);
                    for (var i in callsDataMapKeys) {
                        if (callsDataMapKeys.hasOwnProperty(i)) {
                            var callsDataKey = callsDataMapKeys[i];
                            var callsData = callsDataMap[callsDataKey];

                            switch(true) {
                                /* if user that calls active, and new call init has same receiverId then disconnect */
                                case _isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_ACTION.enum,
                                        callerId: callerId,
                                        newReceiverId: receiverId,
                                        newCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that receive call active, and new call init has same callerId then disconnect */
                                case _isNewReceiverIdMatchActiveCallerId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_ACTION.enum,
                                        callerId: receiverId,
                                        newReceiverId: callerId,
                                        newCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that calls is active with receiverId and new call init with other
                                 receiverId then disconnect from current receiverId and connect with new receiverId */
                                case _isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum,
                                        callerId: callerId,
                                        newReceiverId: receiverId,
                                        oldReceiverId: callsData.receiverId,
                                        oldCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that receive calls is active with callerIdId and new call init with other
                                 receiverId then disconnect from current callerId and connect with new receiverId */
                                case _isNewReceiverIdNotMatchActiveCallerId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum,
                                        callerId: receiverId,
                                        newReceiverId: callerId,
                                        oldReceiverId: callsData.callerId,
                                        oldCallGuid: callsData.guid
                                    };
                                    break;

                            }
                            if (userCallData) {
                                break;
                            }
                        }
                    }
                    if (!userCallData) {
                        /* if user not active, and call init then active user */
                        userCallData = {
                            action: CallsActionStatusEnum.CONNECT_ACTION.enum,
                            callerId: callerId,
                            newReceiverId: receiverId
                        };
                    }
                    return userCallData;
                });
            };

            this.getCallStatus = function(receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    return self.getCurrUserCallsData().then(function (callsDataMap) {
                        var status = false;
                        for (var idKey in callsDataMap) {
                            if (callsDataMap.hasOwnProperty(idKey)) {
                                var currCallsData = callsDataMap[idKey];
                                if (_isCallDataHasReceiverIdOrCallerId(currCallsData, receiverId, callerId)) {
                                    status = currCallsData.status;
                                    break;
                                }
                            }
                        }
                        return status;
                    }).catch(function(err){
                        $log.error('Error in CallsDataGetterSrv getCallStatus, err: ' + err);
                    });
                }).catch(function(err){
                    $log.error('Error in CallsDataGetterSrv getCallStatus, err: ' + err);
                });
            };

            this.getDataPromMap = function(guid) {
                var getDataPromMap = {};
                getDataPromMap.currUserCallsRequests = self.getCurrUserCallsRequests();
                getDataPromMap.currCallData = self.getCallsData(guid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();
                return getDataPromMap;
            };

            this.isCallDataHasReceiverIdOrCallerId = _isCallDataHasReceiverIdOrCallerId;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsDataSetterSrv',
        ["InfraConfigSrv", "$q", "ENV", "CallsStatusEnum", "CallsDataGetterSrv", function (InfraConfigSrv, $q, ENV, CallsStatusEnum, CallsDataGetterSrv) {
            'ngInject';

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            this.setNewConnect = function(data, userCallData, guid, isTeacherApp) {
                var dataToSave = {};
                var isCallerTeacher = userCallData.callerId === data.currUid && isTeacherApp;
                var receiverPath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.newReceiverId, !isCallerTeacher);
                var callerPath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.callerId, isCallerTeacher);
                var newCallData = {
                    guid: guid,
                    callerId: userCallData.callerId,
                    receiverId: userCallData.newReceiverId,
                    status: CallsStatusEnum.PENDING_CALL.enum,
                    callerPath: callerPath,
                    receiverPath: receiverPath,
                    startedTime: Date.now()
                };
                // update root call
                angular.extend(data.currCallData, newCallData);
                dataToSave[data.currCallData.$$path] = data.currCallData;
                //current user call requests object update
                data.currUserCallsRequests[guid] = true;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.newReceiverId === data.currUid ? callerPath : receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = true;
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setDisconnectCall = function(data, userCallData, guid) {
                var dataToSave = {};
                // update root
                data.currCallData.status = CallsStatusEnum.ENDED_CALL.enum;
                data.currCallData.endedTime = Date.now();
                dataToSave[data.currCallData.$$path] = angular.copy(data.currCallData);
                //current user call requests object update
                data.currUserCallsRequests[guid] = null;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.receiverId === data.currUid ? data.currCallData.callerPath : data.currCallData.receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = null;
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setDeclineCall = function(data, userCallData, guid) {
                var dataToSave = {};
                // update root
                data.currCallData.status = CallsStatusEnum.DECLINE_CALL.enum;
                data.currCallData.endedTime = Date.now();
                dataToSave[data.currCallData.$$path] = angular.copy(data.currCallData);
                //current user call requests object update
                data.currUserCallsRequests[guid] = null;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.receiverId === data.currUid ? data.currCallData.callerPath : data.currCallData.receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = null;

                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setAcceptCall = function(currCallData) {
                var dataToSave = {};
                // update root
                currCallData.status = CallsStatusEnum.ACTIVE_CALL.enum;
                dataToSave[currCallData.$$path] = angular.copy(currCallData);
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsErrorSrv',
        ["CallsUiSrv", "$q", function (CallsUiSrv, $q) {
            'ngInject';

            var errorCodesList = {
                1: 'microphone', // this is define in webcall module, if it's changed here, it should changed there also.
                2: 'general',
                3: 'alreadyActive'
            };

            var CALLS_ERROR_TEXT = {
                microphone: '.CALL_FAILED_DESC_MICROPHONE',
                general: '.CALL_FAILED_DESC_GENERAL',
                alreadyActive: '.CALL_FAILED_DESC_ALREADY_ACTIVE'
            };

            function _showErrorModal(err) {
                var errorCode = err && err.errorCode ? errorCodesList[err.errorCode] : errorCodesList[2];
                var modalData = {};
                var errorProm = $q.when(false);

                switch (errorCode) {
                    case 'microphone':
                        modalData.errorMessage = CALLS_ERROR_TEXT.microphone;
                        break;
                    case 'general':
                        modalData.errorMessage = CALLS_ERROR_TEXT.general;
                        break;
                    case 'alreadyActive':
                        modalData.errorMessage = CALLS_ERROR_TEXT.alreadyActive;
                        errorProm = CallsUiSrv.getCalleeName(err.receiverId).then(function (name) {
                            modalData.errorValues = {
                                calleeName: name
                            };
                            return modalData;
                        });
                        break;
                    default:
                        modalData.errorMessage = CALLS_ERROR_TEXT.general;
                        break;
                }

                return errorProm.then(function () {
                    return CallsUiSrv.showErrorModal(CallsUiSrv.modals.ERROR, modalData);
                });
            }

            this.showErrorModal = function(err) {
                return _showErrorModal(err);
            };

        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .constant('CALL_UPDATE', 'CallsEventsSrv: call updated')
        .provider('CallsEventsSrv', function () {

            var isEnabled = true;

            this.enabled = function (_isEnabled) {
                isEnabled = _isEnabled;
            };

            this.$get = ["UserProfileService", "InfraConfigSrv", "StorageSrv", "ENV", "CallsStatusEnum", "CallsUiSrv", "$log", "$rootScope", "$injector", "$q", "CALL_UPDATE", function (UserProfileService, InfraConfigSrv, StorageSrv, ENV, CallsStatusEnum, CallsUiSrv, $log, $rootScope, $injector, $q, CALL_UPDATE) {
                'ngInject';
                var registeredCbToCurrUserCallStateChange = [];
                var currUserCallState;

                var CallsEventsSrv = {};

                var scopesObj = {};

                var isInitialize = false;

                var callsSrv;

                function updateScopeData(callsData) {
                    angular.forEach(scopesObj, function(scope) {
                        scope.callsData = callsData;
                    });
                }

                function openOutGoingCall(callsData) {
                    scopesObj.caller = $rootScope.$new();
                    scopesObj.caller.callsData = callsData;
                    CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, scopesObj.caller);
                }

                function getCallsSrv() {
                    if (!callsSrv) {
                        callsSrv = $injector.get('CallsSrv');
                    }
                    return callsSrv;
                }

                function _listenToCallsData(guid) {
                    var callsStatusPath = 'calls/' + guid;

                    function _cb(callsData) {

                        if (!callsData) {
                            currUserCallState = callsData;
                            return;
                        }

                        updateScopeData(callsData);

                        $rootScope.$broadcast(CALL_UPDATE, callsData);

                        UserProfileService.getCurrUserId().then(function (currUid) {
                            switch(callsData.status) {
                                case CallsStatusEnum.PENDING_CALL.enum:
                                    $log.debug('call pending');
                                    if (!isCurrentUserInitiatedCall(currUid)) {
                                        // show incoming call modal with the ACCEPT & DECLINE buttons
                                        scopesObj.reciver = $rootScope.$new();
                                        scopesObj.reciver.callsData = callsData;
                                        CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, scopesObj.reciver);
                                    }
                                    break;
                                case CallsStatusEnum.DECLINE_CALL.enum:
                                    $log.debug('call declined');
                                    getCallsSrv().disconnectCall();
                                    break;
                                case CallsStatusEnum.ACTIVE_CALL.enum:
                                    $log.debug('call active');
                                    if (!isCurrentUserInitiatedCall(currUid)) {
                                        CallsUiSrv.closeModal();
                                        // show outgoing call modal WITH the ANSWERED TEXT, wait 2 seconds and close the modal, show the ActiveCallDRV
                                    } else {
                                        // close the modal, show the ActiveCallDRV
                                        // CallsUiSrv.closeModal();
                                    }
                                    break;
                                case CallsStatusEnum.ENDED_CALL.enum:
                                    $log.debug('call ended');
                                    // disconnect other user from call
                                    getCallsSrv().disconnectCall();
                                    break;
                            }
                            _invokeCbs(registeredCbToCurrUserCallStateChange, [callsData]);
                        });

                        function isCurrentUserInitiatedCall(currUid) {
                            return (currUid === callsData.callerId);
                        }
                    }

                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                        globalStorage.onEvent(StorageSrv.EVENTS.VALUE, callsStatusPath, _cb);
                    });
                }

                function _startListening() {
                    UserProfileService.getCurrUserId().then(function (currUid) {
                        InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                            var appName = ENV.firebaseAppScopeName;
                            var userCallsPath = appName + '/users/' + currUid + '/calls';
                            globalStorage.onEvent(StorageSrv.EVENTS.VALUE, userCallsPath, function (userCallsData) {
                                var prom = $q.when(false);
                                if (!isInitialize && userCallsData) {
                                    prom = getCallsSrv().disconnectAllCalls(userCallsData);
                                }
                                prom.then(function (result) {
                                    isInitialize = true;
                                    if (!result) {
                                        if (userCallsData) {
                                            angular.forEach(userCallsData, function (isActive, guid) {
                                                _listenToCallsData(guid);
                                            });
                                        }
                                    }
                                });
                            });
                        });
                    });
                }

                function _invokeCbs(cbArr, args){
                    cbArr.forEach(function(cb){
                        cb.apply(null, args);
                    });
                }

                CallsEventsSrv.activate = function () {
                    if (isEnabled) {
                        _startListening();
                    }
                };

                CallsEventsSrv.openOutGoingCall = openOutGoingCall;

                CallsEventsSrv.updateScopeData = updateScopeData;

                CallsEventsSrv.registerToCurrUserCallStateChanges = function (cb) {
                    if (angular.isFunction(cb)) {
                        registeredCbToCurrUserCallStateChange.push(cb);
                    }
                };

                return CallsEventsSrv;
            }];
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.callsModals', []);
})(angular);

(function (angular) {
    'use strict';

    function CallsModalService() {

        var baseTemplateUrl;

        this.setBaseTemplatePath = function(templateUrl) {
            baseTemplateUrl = templateUrl;
        };

        this.$get = ["$mdDialog", "$rootScope", function($mdDialog, $rootScope) {
            'ngInject';
            var CallsModalService = {};

            CallsModalService.showBaseModal = function (popupData) {
                $mdDialog.show({
                    locals: {
                        svgIcon: popupData.svgIcon,
                        innerTemplateUrl: popupData.innerTemplateUrl,
                        overrideCssClass: popupData.overrideCssClass,
                        modalData: popupData.modalData,
                        modalName: popupData.modalName,
                        closeModal: function closeModal (){
                            $mdDialog.hide();
                        }
                    },
                    scope: popupData.scope || $rootScope.$new(),
                    bindToController: true,
                    controller: popupData.controller,
                    controllerAs: 'vm',
                    templateUrl: baseTemplateUrl || popupData.baseTemplateUrl,
                    clickOutsideToClose: angular.isDefined(popupData.clickOutsideToClose) ? popupData.clickOutsideToClose : true,
                    escapeToClose: angular.isDefined(popupData.escapeToClose) ? popupData.escapeToClose : true
                });
            };

            return CallsModalService;
        }];
    }

    angular.module('znk.infra.callsModals').provider('CallsModalService', CallsModalService);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsSrv',
        ["UserProfileService", "$q", "UtilitySrv", "ENV", "$log", "CallsDataGetterSrv", "CallsDataSetterSrv", "WebcallSrv", "CallsEventsSrv", "CallsStatusEnum", "CallsActionStatusEnum", function (UserProfileService, $q, UtilitySrv, ENV, $log, CallsDataGetterSrv, CallsDataSetterSrv, WebcallSrv, CallsEventsSrv, CallsStatusEnum, CallsActionStatusEnum) {
            'ngInject';

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _handleCallerIdOrReceiverIdUndefined(callsData, methodName) {
                if (angular.isUndefined(callsData.callerId) || angular.isUndefined(callsData.receiverId)) {
                    var errMSg = 'CallsSrv '+ methodName +': callerId or receiverId are missing!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return $q.when(true);
            }

            function _webCallConnect(callId) {
                return WebcallSrv.connect(callId).catch(function(err) {
                    $log.error('Error in _webCallConnect', err);
                    return $q.reject(err);
                });
            }

            function _webCallHang() {
                return WebcallSrv.hang().catch(function(err) {
                    $log.debug('_webCallHang catch', err);
                    return $q.reject(err);
                });
            }

            function _connectCall(userCallData) {
                var newCallGuid = UtilitySrv.general.createGuid();
                $log.debug('new call guid: ' + newCallGuid);
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(newCallGuid);
                // initial popup pending without cancel option until return from firebase
                var callsData = {
                    status: CallsStatusEnum.PENDING_CALL.enum,
                    callerId: userCallData.callerId,
                    receiverId: userCallData.newReceiverId
                };
                CallsEventsSrv.openOutGoingCall(callsData);
                return _webCallConnect(newCallGuid).then(function () {
                    return $q.all(getDataPromMap).then(function (data) {
                        return CallsDataSetterSrv.setNewConnect(data, userCallData, newCallGuid, isTeacherApp).then(function (callsMap) {
                            var callsData = angular.copy(callsMap['calls/' + newCallGuid]);
                            callsData.isInitialized = true;
                            CallsEventsSrv.updateScopeData(callsData);
                            return callsMap;
                        });
                    });
                });
            }

            function _disconnectCall(userCallData) {
                var receiverId = userCallData.oldReceiverId ? userCallData.oldReceiverId : userCallData.newReceiverId;
                var guid = userCallData.oldCallGuid ? userCallData.oldCallGuid : userCallData.newCallGuid;
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(guid);
                _webCallHang();
                return $q.all(getDataPromMap).then(function (data) {
                    return CallsDataSetterSrv.setDisconnectCall(data, {
                        receiverId: receiverId
                    }, guid);
                });
            }

            function _acceptCall(callsData) {
                return _webCallConnect(callsData.guid).then(function() {
                    return CallsDataGetterSrv.getCallsData(callsData.guid).then(function (currCallData) {
                        return CallsDataSetterSrv.setAcceptCall(currCallData);
                    });
                });
            }

            function _declineCall(callsData) {
                _webCallHang();
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(callsData.guid);
                return $q.all(getDataPromMap).then(function (data) {
                    return CallsDataSetterSrv.setDeclineCall(data, callsData, callsData.guid);
                });
            }

            function _initiateCall(callerId, receiverId) {
                var errMSg;
                if (angular.isUndefined(callerId) || angular.isUndefined(receiverId)) {
                    errMSg = 'CallsSrv: callerId or receiverId are missing!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                if (callerId === receiverId) {
                    errMSg = 'CallsSrv: callerId and receiverId are the same!! can\'t call yourself!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return _isReceiverIsInActiveCall(receiverId, callerId).then(function () {
                    return CallsDataGetterSrv.getUserCallActionStatus(callerId, receiverId).then(function (userCallData) {
                        var callActionProm;

                        switch (userCallData.action) {
                            case CallsActionStatusEnum.DISCONNECT_ACTION.enum:
                                callActionProm = _disconnectCall(userCallData);
                                break;
                            case CallsActionStatusEnum.CONNECT_ACTION.enum:
                                callActionProm = _connectCall(userCallData);
                                break;
                            case CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum:
                                callActionProm = _disconnectCall(userCallData).then(function () {
                                    return _connectCall(userCallData);
                                });
                                break;
                        }

                        return callActionProm;
                    });
                });
            }

            function _isReceiverIsInActiveCall(receiverId, callerId) {
                return CallsDataGetterSrv.getReceiverCallsData(receiverId, isTeacherApp).then(function(callsDataMap) {
                    var callsDataArr = [];
                    var isInActiveCall = false;
                    angular.forEach(callsDataMap, function(callData) {
                        if(callData.status && (callData.status === CallsStatusEnum.PENDING_CALL.enum ||
                            callData.status === CallsStatusEnum.ACTIVE_CALL.enum) &&
                            !CallsDataGetterSrv.isCallDataHasReceiverIdOrCallerId(callData, receiverId, callerId)) {
                            callsDataArr.push(callData);
                        }
                    });
                    if (callsDataArr.length > 0) {
                        var err = {
                            receiverId: receiverId,
                            errorCode: 3
                        };
                        $log.error('Error in _isReceiverIsInActiveCall', err);
                        isInActiveCall = $q.reject(err);
                    }
                    return isInActiveCall;
                });
            }

            function _isUserInActiveCall() {
                return CallsDataGetterSrv.getCurrUserCallsData().then(function(callsDataMap){
                    var activeCallsDataArr = [];
                    var isInActiveCall = false;
                    angular.forEach(callsDataMap, function(callData) {
                        if(callData.status && (callData.status === CallsStatusEnum.PENDING_CALL.enum ||
                            callData.status === CallsStatusEnum.ACTIVE_CALL.enum)) {
                            activeCallsDataArr.push(callData);
                        }
                    });
                    if (activeCallsDataArr.length > 0) {
                        isInActiveCall = true;
                    }
                    return isInActiveCall;
                });
            }

            // api
            this.acceptCall = function(callsData) {
                return _handleCallerIdOrReceiverIdUndefined(callsData, 'acceptCall').then(function () {
                    return _acceptCall(callsData);
                }).catch(function(err){
                    $log.error('Error in acceptCall', err);
                    return $q.reject(err);
                });
            };

            this.declineCall = function(callsData) {
                return _handleCallerIdOrReceiverIdUndefined(callsData, 'declineCall').then(function () {
                    return _declineCall(callsData);
                }).catch(function(err){
                    $log.error('Error in declineCall', err);
                    return $q.reject(err);
                });
            };

            this.disconnectCall = function(callsData, useWebCallHangProm) {
                var prom = $q.when();
                if (useWebCallHangProm) {
                    prom = _webCallHang();
                } else {
                    _webCallHang();
                }
                return prom;
            };

            this.disconnectAllCalls = function(userCallsDataMap) {
                var callsMapProm = [];
                angular.forEach(userCallsDataMap, function(isActive, guidKey) {
                    var callProm = CallsDataGetterSrv.getCallsData(guidKey).then(function (callsData) {
                        return _declineCall(callsData, false);
                    });
                    callsMapProm.push(callProm);
                });
                return $q.all(callsMapProm);
            };

            this.callsStateChanged = function (receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    return _initiateCall(callerId, receiverId);
                }).catch(function(err){
                    $log.error('Error in callsStateChanged', err);
                    return $q.reject(err);
                });
            };

            this.isUserInActiveCall = _isUserInActiveCall;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').provider('CallsUiSrv',
        function () {
            'ngInject';

            var calleeNameFn = {};
            this.setCalleeNameFnGetter = function (func) {
                calleeNameFn = func;
            };

            this.$get = ["$mdDialog", "CallsModalService", "$injector", function ($mdDialog, CallsModalService, $injector) {

                var CallsUiSrv = {};

                CallsUiSrv.showModal = function (modal, scope) {
                    modal.scope = scope;
                    CallsModalService.showBaseModal(modal);
                };

                CallsUiSrv.showErrorModal = function (modal, modalData) {
                    modal.modalData = modalData;
                    CallsModalService.showBaseModal(modal);
                };

                CallsUiSrv.closeModal = function () {
                    $mdDialog.hide();
                };

                CallsUiSrv.modals = {
                    'INCOMING_CALL': {
                        svgIcon: 'incoming-call-icon',
                        baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                        innerTemplateUrl: 'components/calls/modals/templates/incomingCall.template.html',
                        controller: 'IncomingCallModalCtrl',
                        overrideCssClass: 'incoming-call-modal',
                        clickOutsideToClose: false,
                        escapeToClose: false
                    },
                    'OUTGOING_CALL': {
                        svgIcon: 'outgoing-call-icon',
                        baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                        innerTemplateUrl: 'components/calls/modals/templates/outgoingCall.template.html',
                        controller: 'OutgoingCallModalCtrl',
                        overrideCssClass: 'outgoing-call-modal',
                        clickOutsideToClose: false,
                        escapeToClose: false
                    },
                    'ERROR': {
                        svgIcon: 'call-error-exclamation-mark-icon',
                        baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                        innerTemplateUrl: 'components/calls/modals/templates/errorModal.template.html',
                        controller: 'ErrorModalCtrl',
                        overrideCssClass: 'call-error-modal',
                        clickOutsideToClose: false,
                        escapeToClose: false
                    }
                };

                CallsUiSrv.getCalleeName = function(uid) {
                    var namePromOrFnGetter = $injector.invoke(calleeNameFn);
                    var nameProm = namePromOrFnGetter(uid);
                    return nameProm.then(function(res){
                        return res;
                    });
                };

                return CallsUiSrv;
            }];
        }
    );
})(angular);

angular.module('znk.infra.calls').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/calls/directives/callBtn/callBtn.template.html",
    "<button\n" +
    "    ng-click=\"vm.clickBtn()\"\n" +
    "    class=\"call-btn\"\n" +
    "     ng-class=\"{\n" +
    "          'offline': vm.callBtnState === vm.callBtnEnum.OFFLINE_BTN.enum,\n" +
    "          'call': vm.callBtnState === vm.callBtnEnum.CALL_BTN.enum,\n" +
    "          'called': vm.callBtnState === vm.callBtnEnum.CALLED_BTN.enum\n" +
    "     }\">\n" +
    "    <svg-icon\n" +
    "        class=\"etutoring-phone-icon\"\n" +
    "        name=\"calls-etutoring-phone-icon\">\n" +
    "    </svg-icon>\n" +
    "</button>\n" +
    "");
  $templateCache.put("components/calls/modals/templates/baseCallsModal.template.html",
    "<md-dialog aria-label=\"{{'SHARED_MD_DIALOG.BASE_MODAL.MODAL_NAME' | translate: {modalName: vm.modalName} }}\"\n" +
    "           class=\"baseCallsModal\" ng-cloak ng-class=\"vm.overrideCssClass\">\n" +
    "    <md-toolbar></md-toolbar>\n" +
    "    <md-dialog-content>\n" +
    "        <ng-include src=\"vm.innerTemplateUrl\"></ng-include>\n" +
    "    </md-dialog-content>\n" +
    "    <div class=\"top-icon-wrap\">\n" +
    "        <div class=\"top-icon\">\n" +
    "            <div class=\"round-icon-wrap\">\n" +
    "                <svg-icon class=\"icon\" name=\"{{vm.svgIcon}}\"></svg-icon>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</md-dialog>\n" +
    "");
  $templateCache.put("components/calls/modals/templates/errorModal.template.html",
    "<div translate-namespace=\"AUDIO_CALLS\">\n" +
    "    <div class=\"modal-main-title\"\n" +
    "         translate=\".CALL_FAILED_HEADER\">\n" +
    "    </div>\n" +
    "    <div class=\"modal-sub-title\"\n" +
    "         translate=\"{{errorMessage}}\"\n" +
    "         translate-values=\"{{errorValues}}\">\n" +
    "    </div>\n" +
    "    <div class=\"btn-container\">\n" +
    "        <div class=\"btn-ok\">\n" +
    "            <button\n" +
    "                ng-click=\"vm.closeModal()\"\n" +
    "                translate=\".OK\">\n" +
    "            </button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/calls/modals/templates/incomingCall.template.html",
    "<div translate-namespace=\"AUDIO_CALLS\">\n" +
    "    <div class=\"modal-main-title\" translate=\".INCOMING_CALL\"></div>\n" +
    "\n" +
    "    <ng-switch on=\"callsData.status\">\n" +
    "        <!-- Call Pending -->\n" +
    "        <div ng-switch-when=\"1\" class=\"flex-column\">\n" +
    "            <span\n" +
    "                class=\"modal-sub-title call-status\"\n" +
    "                translate=\".NAME_IS_CALLING\"\n" +
    "                translate-values=\"{callerName: callerName}\"></span>\n" +
    "            <div class=\"btn-container\">\n" +
    "                <div class=\"btn-decline\">\n" +
    "                    <button\n" +
    "                        ng-click=\"vm.declineCall()\"\n" +
    "                        translate=\".DECLINE\">\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "                <div class=\"btn-accept\">\n" +
    "                    <button\n" +
    "                        ng-click=\"vm.acceptCall()\"\n" +
    "                        class=\"primary\"\n" +
    "                        element-loader\n" +
    "                        fill-loader=\"vm.fillLoader\"\n" +
    "                        show-loader=\"vm.startLoader\"\n" +
    "                        bg-loader=\"'#07434A'\"\n" +
    "                        precentage=\"50\"\n" +
    "                        font-color=\"'#FFFFFF'\"\n" +
    "                        bg=\"'#0a9bad'\">\n" +
    "                        <span translate=\".ACCEPT\"></span>\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <!-- Call Declined -->\n" +
    "        <div ng-switch-when=\"2\" class=\"flex-column\" ng-if=\"declineByOther\">\n" +
    "            <span\n" +
    "                translate=\".CALLING_CANCELED\"\n" +
    "                class=\"modal-sub-title call-status\">\n" +
    "            </span>\n" +
    "            <div class=\"btn-container\">\n" +
    "                <div class=\"btn-ok\">\n" +
    "                    <button\n" +
    "                        ng-click=\"vm.closeModal()\"\n" +
    "                        translate=\".OK\">\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </ng-switch>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/calls/modals/templates/outgoingCall.template.html",
    "<div translate-namespace=\"AUDIO_CALLS\">\n" +
    "    <div class=\"modal-main-title\"\n" +
    "         translate=\".OUTGOING_CALL\">\n" +
    "    </div>\n" +
    "    <div class=\"switch-container\"\n" +
    "         ng-switch=\"callsData.status\">\n" +
    "        <div ng-switch-when=\"1\">\n" +
    "            <div class=\"modal-sub-title\"\n" +
    "                 translate=\".CALLING_NAME\"\n" +
    "                 translate-values=\"{calleeName: calleeName}\">\n" +
    "            </div>\n" +
    "            <div class=\"btn-container\">\n" +
    "                <div class=\"btn-accept\">\n" +
    "                    <button\n" +
    "                        class=\"animate-if\"\n" +
    "                        ng-if=\"callsData.isInitialized\"\n" +
    "                        ng-click=\"vm.declineCall()\"\n" +
    "                        translate=\".CANCEL\">\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-switch-when=\"2\" ng-if=\"declineByOther\">\n" +
    "            <div class=\"modal-sub-title\"\n" +
    "                 translate=\".CALLING_DECLINE\">\n" +
    "            </div>\n" +
    "            <div class=\"btn-container\">\n" +
    "                <div class=\"btn-accept\">\n" +
    "                    <button\n" +
    "                        ng-click=\"vm.closeModalAndDisconnect()\"\n" +
    "                        translate=\".OK\">\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-switch-when=\"3\">\n" +
    "            <div class=\"modal-sub-title\"\n" +
    "                 translate=\".CALLING_ANSWERED\">\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/calls/svg/call-error-exclamation-mark-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"call-error-exclamation-mark-icon\"\n" +
    "     id=\"Layer_1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"-556.8 363.3 50.8 197.2\"\n" +
    "     style=\"enable-background:new -556.8 363.3 50.8 197.2;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	svg.call-error-exclamation-mark-icon .st0 {\n" +
    "        fill: none;\n" +
    "        enable-background: new;\n" +
    "    }\n" +
    "    svg.call-error-exclamation-mark-icon {\n" +
    "       width: 100%;\n" +
    "        height: auto;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path d=\"M-505.9,401.6c-0.4,19.5-5.2,38.2-8.7,57.1c-2.8,15.5-4.7,31.2-6.7,46.8c-0.3,2.6-1.1,4-3.7,4.3c-1.5,0.2-2.9,0.6-4.4,0.7\n" +
    "		c-9.2,0.7-9.6,0.4-10.7-8.7c-3.4-29.6-8-58.9-14.6-87.9c-2.3-10.1-3.2-20.4-0.5-30.7c3.7-14.1,17.2-22.3,31.5-19.3\n" +
    "		c9.2,1.9,14.7,8.8,16.2,20.9C-506.7,390.3-506.4,396-505.9,401.6z\"/>\n" +
    "	<path d=\"M-528.9,525.7c10.9,0,16.8,5.3,16.9,15.2c0.1,11-9.3,19.7-21.4,19.6c-8.8,0-14.7-7-14.7-17.7\n" +
    "		C-548.2,530.9-542.4,525.7-528.9,525.7z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/calls/svg/call-mute-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<svg version=\"1.1\"\n" +
    "     id=\"Layer_9\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 109.3 175.4\"\n" +
    "     style=\"enable-background:new 0 0 109.3 175.4;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<g>\n" +
    "	<path d=\"M79.4,104c-1.6-2.4-2.5-3.6-3.3-4.9C60,71.6,44,44.1,27.7,16.6c-2-3.3-1.5-5.2,1.1-7.6C38,0.4,48.7-2.4,60.5,2.2\n" +
    "		c12.7,4.9,19.8,15,20.2,28.3c0.7,21.6,0.2,43.3,0.1,64.9C80.8,97.8,80.1,100.2,79.4,104z\"/>\n" +
    "	<path d=\"M46.7,168.1c0-8.6,0-16.2,0-24.2c-12.1-1.6-22.9-5.8-31.6-14.5C5.2,119.6,0,107.8,0,93.8c0-10.1,0-20.3,0-30.7\n" +
    "		c2.6,0,4.8,0,7.6,0c0,10.2,0.1,20.3,0,30.4C7.5,106,12,116.6,21.3,125c12.7,11.4,27.4,14.3,43.6,8.9c1.2-0.4,2.5-0.9,4.3-1.5\n" +
    "		c1.1,2,2.3,3.9,3.9,6.7c-6.3,1.8-12.1,3.5-18.4,5.3c0,7.3,0,15,0,23.4c8.7,0,17.2,0,26.2,0c0,2.7,0,4.7,0,7.2\n" +
    "		c-20.7,0-41.4,0-62.4,0c0-2.2,0-4.2,0-6.9C27.8,168.1,37.1,168.1,46.7,168.1z\"/>\n" +
    "	<path d=\"M63.4,122.3c-17.2,9.1-38.3-1.1-43.2-20.3c-0.5-2.1-0.8-4.2-1.1-6.4c-0.2-1.5-0.1-3-0.1-4.5c0-14,0-28,1-42.4\n" +
    "		C34.4,73.1,48.8,97.6,63.4,122.3z\"/>\n" +
    "	<path d=\"M3.2,3.4c2-1.2,3.5-2.1,5.5-3.3c33.6,57.4,67,114.4,100.6,171.8c-1.7,1.1-3.2,2.1-5.4,3.5C70.3,118,36.9,60.9,3.2,3.4z\"/>\n" +
    "	<path d=\"M90.7,122.9c-3.3-3.3-3.9-6.1-2-10.7c2.5-5.8,3.8-12.4,4.2-18.7c0.7-10.1,0.2-20.2,0.2-30.5c2.5,0,4.4,0,7,0\n" +
    "		C98.5,83.3,104.6,104.5,90.7,122.9z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/calls/svg/etutoring-phone-icon.svg",
    "<svg x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     class=\"calls-phone-icon\"\n" +
    "     viewBox=\"0 0 124.5 124.8\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\">\n" +
    "    <g>\n" +
    "        <path d=\"M0.1,28.1c-0.6-6.5,1.8-11.6,6.6-16c3.1-2.8,5.8-5.9,8.9-8.8c4.7-4.4,9.5-4.6,14.2-0.3\n" +
    "		c6,5.6,11.7,11.4,17.3,17.3c4.1,4.4,4,8.9,0,13.4c-2.7,3.1-5.7,6.1-8.9,8.8c-2.5,2.2-3.1,4.2-1.4,7.2c9.4,16.2,22.2,29,38.7,37.8\n" +
    "		c1.2,0.7,3.9,0.2,5-0.8c3.2-2.6,5.9-5.8,8.9-8.7c5.3-5,10.1-5.1,15.3-0.1c5.5,5.3,10.9,10.7,16.2,16.3c4.6,4.8,4.6,9.7,0.1,14.6\n" +
    "		c-3.5,3.8-7.2,7.4-10.9,11c-6.4,6-14.1,5.5-21.6,3.6c-22.5-5.6-40.8-18.3-56.7-34.7C17.3,73.6,5.8,56.4,0.9,35.6\n" +
    "		c-0.2-0.8-0.5-1.6-0.5-2.4C0.2,31.5,0.2,29.8,0.1,28.1z\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/calls/svg/incoming-call-icon.svg",
    "<svg x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     class=\"calls-incomming-call\"\n" +
    "	 viewBox=\"0 0 80 80\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\">\n" +
    "<g>\n" +
    "	<path d=\"M28.8,80c-3.6-1.9-7.3-3.8-10.9-5.7c-0.6-0.3-1.1-0.9-1.8-1.6C21.9,68,27.5,63.5,33,58.9\n" +
    "		c0.2,0.1,0.4,0.1,0.5,0.1c3.7,2.5,4.1,2.5,7.7-0.3c6.5-5.1,12.4-10.9,17.5-17.5c2.9-3.7,3-4,0.2-8.2c4.5-5.6,9.1-11.2,13.8-17\n" +
    "		c3.6,3.6,5.6,8.1,7.4,12.6c0,0.7,0,1.3,0,2c-0.2,0.3-0.5,0.6-0.6,0.9c-9.7,22-25.6,37.9-47.6,47.6c-0.3,0.1-0.6,0.4-0.9,0.6\n" +
    "		C30.1,80,29.5,80,28.8,80z\"/>\n" +
    "	<path d=\"M10.8,0C15.4,4.3,20,8.7,25,13.5c0.7-0.8,1.8-2.3,3-3.5c0.5-0.5,1.4-0.8,2.1-0.6c0.4,0.1,0.7,1.2,0.7,1.8\n" +
    "		c-0.1,5.7-0.3,11.5-0.4,17.2c0,1.4-0.6,2-2,2c-5.7,0.1-11.5,0.3-17.2,0.4c-0.6,0-1.8-0.3-1.8-0.7c-0.1-0.6,0.2-1.6,0.6-2.1\n" +
    "		c1.1-1.3,2.5-2.4,3.3-3.3C8.8,20,4.4,15.4,0,10.8c0-0.5,0-1.1,0-1.6C3.1,6.1,6.1,3.1,9.2,0C9.7,0,10.3,0,10.8,0z\"/>\n" +
    "	<path d=\"M56.7,30.7c-0.2-0.1-0.3-0.1-0.3-0.1c-4-3.4-4-3.5-0.7-7.5c2.6-3.2,5.2-6.4,7.8-9.6c2.2-2.7,3.1-2.8,5.8-0.5\n" +
    "		c0.3,0.3,0.6,0.5,1,0.9C65.8,19.6,61.3,25.2,56.7,30.7z\"/>\n" +
    "	<path d=\"M13.9,70.4c-0.7-0.9-1.3-1.5-1.8-2.2c-1.1-1.4-1-2.8,0.4-3.9c4.2-3.5,8.4-6.9,12.7-10.3c1.2-1,2.4-1,3.5,0.3\n" +
    "		c0.7,0.7,1.5,1.3,2.4,2.2C25.2,61.2,19.7,65.8,13.9,70.4z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/calls/svg/outgoing-call-icon.svg",
    "<svg  x=\"0px\"\n" +
    "      y=\"0px\"\n" +
    "      class=\"calls-outcomming-call\"\n" +
    "	  viewBox=\"0 0 80 80\"\n" +
    "      xmlns=\"http://www.w3.org/2000/svg\">\n" +
    "<g>\n" +
    "	<path d=\"M28.8,80c-3.6-1.9-7.3-3.8-10.9-5.7c-0.6-0.3-1.1-0.9-1.8-1.6C21.9,68,27.5,63.5,33,58.9\n" +
    "		c0.2,0.1,0.4,0.1,0.5,0.1c3.7,2.5,4.1,2.5,7.7-0.3c6.5-5.1,12.4-10.9,17.5-17.5c2.9-3.7,3-4,0.2-8.2c4.5-5.6,9.1-11.2,13.8-17\n" +
    "		c3.6,3.6,5.6,8.1,7.4,12.6c0,0.7,0,1.3,0,2c-0.2,0.3-0.5,0.6-0.6,0.9c-9.7,22-25.6,37.9-47.6,47.6c-0.3,0.1-0.6,0.4-0.9,0.6\n" +
    "		C30.1,80,29.5,80,28.8,80z\"/>\n" +
    "	<path d=\"M21,31.8c-4.6-4.3-9.2-8.7-14.2-13.5c-0.7,0.8-1.8,2.3-3,3.5c-0.5,0.5-1.4,0.8-2.1,0.6\n" +
    "		C1.3,22.4,1,21.3,1,20.6C1.1,14.9,1.3,9.2,1.4,3.4c0-1.4,0.6-2,2-2C9.2,1.3,14.9,1.1,20.6,1c0.6,0,1.8,0.3,1.8,0.7\n" +
    "		c0.1,0.6-0.2,1.6-0.6,2.1C20.7,5,19.4,6.2,18.5,7c4.5,4.8,8.9,9.4,13.3,14c0,0.5,0,1.1,0,1.6c-3.1,3.1-6.1,6.1-9.2,9.2\n" +
    "		C22.1,31.8,21.6,31.8,21,31.8z\"/>\n" +
    "	<path d=\"M56.7,30.7c-0.2-0.1-0.3-0.1-0.3-0.1c-4-3.4-4-3.5-0.7-7.5c2.6-3.2,5.2-6.4,7.8-9.6\n" +
    "		c2.2-2.7,3.1-2.8,5.8-0.5c0.3,0.3,0.6,0.5,1,0.9C65.8,19.6,61.3,25.2,56.7,30.7z\"/>\n" +
    "	<path d=\"M13.9,70.4c-0.7-0.9-1.3-1.5-1.8-2.2c-1.1-1.4-1-2.8,0.4-3.9c4.2-3.5,8.4-6.9,12.7-10.3\n" +
    "		c1.2-1,2.4-1,3.5,0.3c0.7,0.7,1.5,1.3,2.4,2.2C25.2,61.2,19.7,65.8,13.9,70.4z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.config', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.config').provider('InfraConfigSrv', [
        function () {
            var userDataFn,
                storages = {};

            this.setStorages = function(_globalStorageGetter, _studentStorageGetter, _teacherStorageGetter){
                storages.globalGetter = _globalStorageGetter;
                storages.studentGetter = _studentStorageGetter;
                storages.teacherGetter = _teacherStorageGetter;
            };

            this.setUserDataFn = function(_userDataFn) {
                userDataFn = _userDataFn;
            };

            this.$get = [
                '$injector', '$log', '$q',
                function ($injector, $log, $q) {
                    var InfraConfigSrv = {};

                    function _baseStorageGetter(name){
                        var storageGetterKey = name + 'Getter';
                        var storageGetter = storages[storageGetterKey];
                        if(!storageGetter ){
                            var errMsg = 'InfraConfigSrv: ' + name + ' Storage name was not defined';
                            $log.error(errMsg);
                            return $q.reject(errMsg);
                        }
                        return $q.when($injector.invoke(storageGetter));
                    }

                    InfraConfigSrv.getGlobalStorage = _baseStorageGetter.bind(InfraConfigSrv, 'global');

                    InfraConfigSrv.getStudentStorage = _baseStorageGetter.bind(InfraConfigSrv, 'student');

                    InfraConfigSrv.getTeacherStorage = _baseStorageGetter.bind(InfraConfigSrv, 'teacher');

                    InfraConfigSrv.getUserData = function(){
                        var userDataInjected;
                        if(!userDataFn){
                            $log.error('InfraConfigSrv: get user data function was not defined');
                            return;
                        }
                        userDataInjected = $injector.invoke(userDataFn);
                        return $q.when(userDataInjected);
                    };

                    return InfraConfigSrv;
                }
            ];
        }
    ]);
})(angular);

angular.module('znk.infra.config').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.content', []);
})(angular);
'use strict';

(function (angular) {

    function ContentSrv() {

        var setContentFuncRef;

        this.setContent = function(func) {
            setContentFuncRef = func;
        };

        this.$get = ['$q', '$log', '$injector', function($q, $log, $injector) {

            function _getContentData() {
                var contentData;
                return function() {
                    return {
                        get: function() {
                            if(!contentData) {
                                return _getContentFunc().then(function(dataObj) {
                                    contentData = dataObj;
                                    if (angular.isFunction(contentData.updatePublication)) {
                                        contentData.updatePublication(function(updatePublication) {
                                            if(updatePublication.key() !== contentData.key) {
                                                contentData.latestRevisions = updatePublication.val();
                                                contentData.key = updatePublication.key();
                                            }
                                        });
                                    }
                                    return dataObj;
                                });
                            }
                            return $q.when(contentData);
                        },
                        set: function(practiceName, newData) {
                            contentData.revisionManifest[practiceName] = newData;
                            return $q.when({ rev: newData.rev, status: 'update'});
                        }
                    };
                };
            }

            var contentFunc;

            var contentDataFunc = _getContentData();

            var ContentSrv = {};

            var REV_STATUES = {
                NEW: 'new',
                OLD: 'old',
                SAME: 'same'
            };

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            ContentSrv.getRev = function(practiceName, dataObj) {
                var getRevisionProm = $q.when(false);

                if (angular.isFunction(dataObj.revisionManifestGetter)) {
                    getRevisionProm = dataObj.revisionManifestGetter().then(function (result) {
                        dataObj.revisionManifest = result;
                        return result;
                    });
                }

                return getRevisionProm.then(function () {
                    if (!dataObj || !dataObj.revisionManifest || !dataObj.latestRevisions) {
                        return $q.when({error: 'No Data Found! ', data: dataObj});
                    }

                    var userManifest = dataObj.revisionManifest[practiceName];
                    var publicationManifest = dataObj.latestRevisions[practiceName];
                    var newRev;

                    if (angular.isUndefined(publicationManifest)) {
                        return $q.when({error: 'Not Found', data: dataObj});
                    }

                    function _getRevStatusObj(rev, status) {
                        return { rev: rev, status: status };
                    }

                    function _isUserHasOldRev() {
                       return userManifest.rev < publicationManifest.rev;
                    }

                    function _isUserHasSameRev() {
                        return userManifest.rev === publicationManifest.rev;
                    }

                    if (!userManifest) { // if user has no rev yet, set the latest

                        newRev = _getRevStatusObj(publicationManifest.rev, REV_STATUES.NEW);

                    } else if(publicationManifest.takeLatest) { // if on manifest has takeLatest, then take latest and set if it's not the same on user

                        newRev = _getRevStatusObj(publicationManifest.rev, _isUserHasSameRev() ? REV_STATUES.SAME : REV_STATUES.NEW );

                    } else if (_isUserHasOldRev()) {

                        newRev = _getRevStatusObj(userManifest.rev, REV_STATUES.OLD);

                    } else if (_isUserHasSameRev()) {

                        newRev = _getRevStatusObj(publicationManifest.rev, REV_STATUES.SAME);

                    } else {

                        $log.error('ContentSrv: getContent: user revision is weird! for practice: '+ practiceName +' rev: ' + userManifest.rev);
                        newRev = _getRevStatusObj(publicationManifest.rev, REV_STATUES.NEW);

                    }

                    return newRev;
                });
            };

            ContentSrv.setRev = function(practiceName, newRev) {
                return contentDataFunc().set(practiceName, { rev: newRev });
            };

            // { exerciseId: 10, exerciseType: 'drill' }
            ContentSrv.getContent = function(pathObj) {

                if(!pathObj || !pathObj.exerciseType) {
                    return $q.reject({ error: 'Error: getContent require exerciseType!' });
                }

                var path = (pathObj.exerciseId) ? pathObj.exerciseType+pathObj.exerciseId : pathObj.exerciseType;

                return contentDataFunc().get().then(function(dataObj) {

                    return ContentSrv.getRev(path, dataObj).then(function(result) {

                        if(result.error) {
                            return $q.when(result);
                        }

                        if(!dataObj.contentRoot) {
                            return $q.when({ error: 'Error: getContent require contentRoot to be defined in config phase!' });
                        }

                        if(!dataObj.userRoot) {
                            return $q.when({ error: 'Error: getContent require userRoot to be defined in config phase!' });
                        }

                        if(result.status === 'new') {
                            ContentSrv.setRev(path, result.rev).then(function() {
                                var userPath = dataObj.userRoot+'/revisionManifest/'+path;
                                var setUserRevision = dataObj.create(userPath);
                                setUserRevision.set({ rev : result.rev });
                            });
                        }

                        var contentPath = dataObj.contentRoot+path+'-rev-'+result.rev;

                        var content =  dataObj.create(contentPath);

                        return content.get();
                    });
                });
            };

            ContentSrv.getAllContentIdsByKey = function(key) {
                var arrayOfKeys = [];
                return contentDataFunc().get().then(function(dataObj) {
                    for(var objKey in dataObj.latestRevisions) {
                        if(dataObj.latestRevisions.hasOwnProperty(objKey) && objKey.indexOf(key) !== -1) {
                            arrayOfKeys.push(objKey);
                        }
                    }
                    return arrayOfKeys;
                });
            };

            return ContentSrv;
        }];
    }

    angular.module('znk.infra.content').provider('ContentSrv', ContentSrv);

})(angular);

(function (angular) {
    'use strict';

    /**
     *  StorageRevSrv:
     *      wrapper for ContentSrv, use for error handling and parsing data.
     *      getContent(data={ exerciseType: 'type', exerciseId: '20' });
     *      getAllContentByKey('type');
     */
    angular.module('znk.infra.content').service('StorageRevSrv', [
        'ContentSrv', '$log', '$q',
        function (ContentSrv, $log, $q) {
            'ngInject';

            var self = this;

            this.getContent = function (data) {
                return ContentSrv.getContent(data).then(function (result) {
                    return angular.fromJson(result);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            this.getAllContentByKey = function (key) {
                var resultsProm = [];
                return ContentSrv.getAllContentIdsByKey(key).then(function (results) {
                    angular.forEach(results, function (keyValue) {
                        resultsProm.push(self.getContent({ exerciseType: keyValue }));
                    });
                    return $q.all(resultsProm);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };
        }
    ]);
})(angular);

angular.module('znk.infra.content').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail', ['znk.infra.config', 'znk.infra.exerciseUtility']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail').provider('ContentAvailSrv', [
        function () {

            var _specials;

            this.setSpecials = function (specialsObj) {
                _specials = specialsObj;
            };

            this.$get = ["$q", "$parse", "$injector", "InfraConfigSrv", "StorageSrv", function ($q, $parse, $injector, InfraConfigSrv, StorageSrv) {
                'ngInject';

                var PURCHASED_ALL = 'all';

                var ContentAvailSrvObj = {};

                function getUserPurchaseData(){
                    return InfraConfigSrv.getStudentStorage().then(function(studentStorageSrv){
                        var purchaseDataPath = StorageSrv.variables.appUserSpacePath + '/purchase';
                        var defValues = {
                            daily: 0,
                            exam: {},
                            tutorial: {},
                            section: {},
                            subscription: {}
                        };
                        return studentStorageSrv.get(purchaseDataPath,defValues);
                    });
                }

                function getFreeContentData(){
                    return InfraConfigSrv.getStudentStorage().then(function(studentStorageSrv){
                        var freeContentPath = 'freeContent';
                        var defValues = {
                            daily: 0,
                            exam: {},
                            tutorial: {},
                            section: {},
                            specials: {}
                        };
                        return studentStorageSrv.get(freeContentPath,defValues);
                    });
                }

                function getUserSpecialsData() {
                    var specialsProm = false;
                    if (_specials) {
                        specialsProm = $injector.invoke(_specials);
                    }
                    return $q.when(specialsProm);
                }

                function idToKeyInStorage(id) {
                    return 'id_' + id;
                }

                function _hasSubscription(subscriptionObj) {
                    return subscriptionObj && subscriptionObj.expiryDate && subscriptionObj.expiryDate > Date.now();
                }

                function _baseIsEntityAvail() {
                    return $q.all([getUserPurchaseData(), getFreeContentData(), getUserSpecialsData()]).then(function (res) {
                        var purchaseData = res[0];
                        var hasSubscription = _hasSubscription(purchaseData.subscription);
                        var earnedSpecialsObj = {
                            daily: 0,
                            exam: {},
                            section: {},
                            tutorial: {}
                        };
                        if (hasSubscription) {
                            return true;
                        } else {
                            var specials = res[1].specials;
                            var specialsRes = res[2];
                            if (specialsRes) {
                                angular.forEach(specialsRes, function (specialVal, specialKey) {
                                    if (specials[specialKey] && specialVal === true) {
                                        angular.forEach(specials[specialKey], function (val, key) {
                                            if (val === PURCHASED_ALL) {
                                                earnedSpecialsObj[key] = val;
                                            } else {
                                                switch (key) {
                                                    case 'daily':
                                                        if (angular.isNumber(val)) {
                                                            earnedSpecialsObj.daily += val;
                                                        }
                                                        break;
                                                    case 'exam':
                                                        if (angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.exam = angular.extend(earnedSpecialsObj.exam, val);
                                                        }
                                                        break;
                                                    case 'section':
                                                        if (angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.section = angular.extend(earnedSpecialsObj.section, val);
                                                        }
                                                        break;
                                                    case 'tutorial':
                                                        if (angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.tutorial = angular.extend(earnedSpecialsObj.tutorial, val);
                                                        }
                                                        break;
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            res.push(earnedSpecialsObj);
                            return res;
                        }
                    });
                }

                function _isContentOwned(contentData, pathArr) {
                    var prefixPathArr = pathArr.slice(0, pathArr.length - 1);
                    var prefixPath = prefixPathArr.join('.');
                    var isAllOwned = $parse(prefixPath)(contentData) === PURCHASED_ALL;
                    if (isAllOwned) {
                        return true;
                    }

                    var fullPath = pathArr.join('.');
                    return $parse(fullPath)(contentData);
                }

                ContentAvailSrvObj.hasSubscription = function hasSubscription() {
                    return getUserPurchaseData().then(function (purchaseData) {
                        return _hasSubscription(purchaseData.subscription);
                    });
                };

                ContentAvailSrvObj.isDailyAvail = function isDailyAvail(dailyOrder) {
                    if (!angular.isNumber(dailyOrder) || isNaN(dailyOrder)) {
                        return $q.reject('daily order should be a number');
                    }
                    return _baseIsEntityAvail().then(function (res) {
                        if (res === true) {
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var isAllOwned = purchaseData.daily === PURCHASED_ALL || freeContent.daily === PURCHASED_ALL || earnedSpecials.daily === PURCHASED_ALL;
                        if (isAllOwned) {
                            return true;
                        }

                        var maxAvailDailyOrder = (purchaseData.daily || 0) + (freeContent.daily || 0) + (earnedSpecials.daily || 0);
                        return dailyOrder <= maxAvailDailyOrder;
                    });
                };

                ContentAvailSrvObj.isExamAvail = function isExamAvail(examId) {
                    return _baseIsEntityAvail().then(function (res) {
                        if (res === true) {
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var examPathArr = ['exam', idToKeyInStorage(examId)];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent, examPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials, examPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData, examPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;
                    });
                };

                ContentAvailSrvObj.isSectionAvail = function isSectionAvail(examId, sectionId) {
                    return _baseIsEntityAvail().then(function (res) {
                        if (res === true) {
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var examKeyProp = idToKeyInStorage(examId);
                        var examPathArr = ['exam', examKeyProp];
                        var isExamPurchased = _isContentOwned(purchaseData, examPathArr);
                        if (isExamPurchased) {
                            return true;
                        }

                        var sectionKeyProp = idToKeyInStorage(sectionId);

                        var sectionPathArr = ['section', sectionKeyProp];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent, sectionPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials, sectionPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData, sectionPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;
                    });
                };

                ContentAvailSrvObj.isTutorialAvail = function isTutorialAvail(tutorialId) {
                    return _baseIsEntityAvail().then(function (res) {
                        if (res === true) {
                            return true;
                        }

                        var tutorialKeyInStorage = idToKeyInStorage(tutorialId);

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];
                        var tutorialPathArr = ['tutorial', tutorialKeyInStorage];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent, tutorialPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials, tutorialPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData, tutorialPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;

                    });
                };

                ContentAvailSrvObj.getFreeContentDailyNum = function getFreeContentDailyNum() {
                    return getFreeContentData().then(function (freeContentData) {
                        return freeContentData.daily;
                    });
                };
                // api
                return ContentAvailSrvObj;
            }];
        }
    ]);
})(angular);

angular.module('znk.infra.contentAvail').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentGetters', [
        'znk.infra.config',
        'znk.infra.content',
        'znk.infra.exerciseUtility',
        'znk.infra.enum'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentGetters').factory('BaseExerciseGetterSrv',
        ["ContentSrv", "$log", "$q", "ExerciseTypeEnum", function (ContentSrv, $log, $q, ExerciseTypeEnum) {
            'ngInject';

            function BaseExerciseGetterSrv(exerciseTypeName) {
                this.typeName = exerciseTypeName;
            }

            BaseExerciseGetterSrv.getExerciseByNameAndId = function (exerciseTypeName, exerciseId) {
                var context = {
                    typeName: exerciseTypeName
                };
                return BaseExerciseGetterSrvPrototype.get.call(context, exerciseId);
            };

            BaseExerciseGetterSrv.getExerciseByTypeAndId = function (exerciseTypeId, exerciseId) {
                var exerciseTypeName = ExerciseTypeEnum.getValByEnum(exerciseTypeId).toLowerCase();
                return BaseExerciseGetterSrv.getExerciseByNameAndId(exerciseTypeName, exerciseId);
            };

            var BaseExerciseGetterSrvPrototype = {};

            BaseExerciseGetterSrvPrototype.get = function (exerciseId) {
                var contentData = {
                    exerciseId: exerciseId,
                    exerciseType: this.typeName
                };

                return ContentSrv.getContent(contentData).then(function (result) {
                    return angular.fromJson(result);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            BaseExerciseGetterSrvPrototype.getAll = function () {
                var self = this;
                var resultsProm = [];
                return ContentSrv.getAllContentIdsByKey(self.typeName).then(function (results) {
                    angular.forEach(results, function (keyValue) {
                        resultsProm.push(self.getContent({
                            exerciseType: keyValue
                        }));
                    });
                    return $q.all(resultsProm);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            BaseExerciseGetterSrv.prototype = BaseExerciseGetterSrvPrototype;

            return BaseExerciseGetterSrv;
        }]
    );
})(angular);

'use strict';

angular.module('znk.infra.contentGetters').service('CategoryService',
    ["StorageRevSrv", "$q", "categoryEnum", "$log", function (StorageRevSrv, $q, categoryEnum, $log) {
        'ngInject';

        var categoryMapObj;
        var self = this;

        self.get = function () {
            return StorageRevSrv.getContent({
                exerciseType: 'category'
            });
        };

        self.getCategoryMap = function () {
            if (categoryMapObj) {
                return $q.when(categoryMapObj);
            }
            return self.get().then(function (categories) {
                var categoryMap = {};
                angular.forEach(categories, function (item) {
                    categoryMap[item.id] = item;
                });
                categoryMapObj = categoryMap;
                return categoryMapObj;
            });
        };

        self.getCategoryData = function (categoryId) {
            return self.getCategoryMap().then(function (categoryMap) {
                return categoryMap[categoryId];
            });
        };

        self.categoryName = function (categoryId) {
            return self.getCategoryMap().then(function (categoryMap) {
                return categoryMap[categoryId];
            });
        };

        self.getParentCategory = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var parentId;
                if (categories[categoryId]) {
                    parentId = categories[categoryId].parentId;
                } else {
                    $log.error('category id was not found in the categories');
                    return null;
                }
                return categories[parentId];
            });
        };

        self.getCategoryLevel1Parent = function (category) {
            if (category.typeId === categoryEnum.SUBJECT.enum) {
                return $q.when(category.id);
            }
            return self.getParentCategory(category.id).then(function (parentCategory) {
                return self.getCategoryLevel1Parent(parentCategory);
            });
        };

        self.getCategoryLevel2Parent = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var category = categories[categoryId];
                if (categoryEnum.TEST_SCORE.enum === category.typeId) {
                    return category;
                }
                return self.getCategoryLevel2Parent(category.parentId);
            });
        };

        self.getAllLevelCategories = function (level) {
            return self.getCategoryMap().then(function (categories) {
                var levelCategories = {};
                angular.forEach(categories, function (category) {
                    var numLevel = 1;
                    var catgoryDup = angular.copy(category);
                    while (catgoryDup.parentId !== null) {
                        catgoryDup = categories[catgoryDup.parentId];
                        numLevel++;
                    }
                    if (numLevel === level) {
                        levelCategories[category.id] = category;
                    }
                });
                return levelCategories;
            });
        };

        self.getAllLevel3Categories = (function () {
            var getAllLevel3CategoriesProm;
            return function () {
                if (!getAllLevel3CategoriesProm) {
                    getAllLevel3CategoriesProm = self.getCategoryMap().then(function (categories) {
                        var generalCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.GENERAL.enum) {
                                generalCategories[category.id] = category;
                            }
                        });
                        return generalCategories;
                    });
                }
                return getAllLevel3CategoriesProm;
            };
        })();

        self.getAllLevel3CategoriesGroupedByLevel1 = (function () {
            var getAllLevel3CategoriesGroupedByLevel1Prom;
            return function (subjectId) {
                if (!getAllLevel3CategoriesGroupedByLevel1Prom) {
                    getAllLevel3CategoriesGroupedByLevel1Prom = self.getAllLevel3Categories().then(function (categories) {
                        var generalCategories = {};
                        var promArray = [];
                        angular.forEach(categories, function (generalCategory) {
                            var prom = self.getCategoryLevel1Parent(generalCategory).then(function (currentCategorySubjectId) {
                                if (currentCategorySubjectId === subjectId) {
                                    generalCategories[generalCategory.id] = generalCategory;
                                }
                            });
                            promArray.push(prom);
                        });
                        return $q.all(promArray).then(function () {
                            return generalCategories;
                        });
                    });
                }
                return getAllLevel3CategoriesGroupedByLevel1Prom;
            };
        })();

        self.getAllLevel4Categories = (function () {
            var getAllLevel4CategoriessProm;
            return function () {
                if (!getAllLevel4CategoriessProm) {
                    getAllLevel4CategoriessProm = self.getCategoryMap().then(function (categories) {
                        var specificCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.SPECIFIC.enum) {
                                specificCategories[category.id] = category;
                            }
                        });
                        return specificCategories;
                    });
                }
                return getAllLevel4CategoriessProm;
            };
        })();
    }]);

angular.module('znk.infra.contentGetters').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.deviceNotSupported', []);
})(angular);

/**
 * Device Not Supported
 * This directive hides all content on the page and shows a message and an image
 * Parameters:
 * title
 * subtitle
 * image src to display
 * by default the message will show when the screen width is 1024px or below, this can be overridden by css at the application level
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.deviceNotSupported').directive('deviceNotSupported', ['ENV',
        function (ENV) {
            return {
                templateUrl: 'components/deviceNotSupported/deviceNotSupported.template.html',
                restrict: 'E',
                scope: {
                    title: '@',
                    subTitle: '@',
                    imageSrc: '@'
                },
                link: function (scope, element, attrs) {
                    if (ENV.debug) {
                        angular.element(element[0]).addClass('disabled');
                    } else {
                        scope.title = attrs.title;
                        scope.subTitle = attrs.subTitle;
                        scope.imageSrc = attrs.imageSrc;

                        scope.styleObj = {
                            'background-image' : 'url(' + scope.imageSrc + ')'
                        };
                    }
                }
            };
        }
    ]);
})(angular);

angular.module('znk.infra.deviceNotSupported').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/deviceNotSupported/deviceNotSupported.template.html",
    "<div class=\"device-not-supported-inner\">\n" +
    "    <h1>{{title}}</h1>\n" +
    "    <h2>{{subTitle}}</h2>\n" +
    "    <div class=\"image-container\"\n" +
    "         ng-style=\"styleObj\">\n" +
    "        <img ng-src=\"{{imageSrc}}\" alt=\"hidden\">\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.enum', []);
})(angular);
'use strict';
(function (angular) {
    angular.module('znk.infra.enum').factory('EnumSrv', [
        function () {
            var EnumSrv = {};

            function BaseEnum(enumsArr) {
                var NAME_INDEX = 0;
                var ENUM_INDEX = 1;
                var VALUE_INDEX = 2;
                var self = this;
                enumsArr.forEach(function (item) {
                    self[item[NAME_INDEX]] = {
                        enum: item[ENUM_INDEX],
                        val: item[VALUE_INDEX]
                    };
                });
            }

            EnumSrv.BaseEnum = BaseEnum;

            BaseEnum.prototype.getEnumMap = function getEnumMap() {
                var enumsObj = this;
                var enumMap = {};
                var enumsPropKeys = Object.keys(enumsObj);
                for (var i in enumsPropKeys) {
                    var prop = enumsPropKeys[i];
                    var enumObj = enumsObj[prop];
                    enumMap[enumObj.enum] = enumObj.val;
                }
                return enumMap;
            };

            BaseEnum.prototype.getEnumArr = function getEnumArr() {
                var enumsObj = this;
                var enumArr = [];
                for (var prop in enumsObj) {
                    var enumObj = enumsObj[prop];
                    if (angular.isObject(enumObj)) {
                        enumArr.push(enumObj);
                    }
                }
                return enumArr;
            };

            BaseEnum.prototype.getValByEnum = function getValByEnum(id) {
                var enumsObj = this;
                var val;
                for (var prop in enumsObj) {
                  if (enumsObj.hasOwnProperty(prop)) {
                      var enumObj = enumsObj[prop];
                      if (enumObj.enum === id) {
                          val = enumObj.val;
                          break;
                      }
                  }
                }
                return val;
            };

            BaseEnum.prototype.getNameToEnumMap = function getValByEnum() {
                var enumsObj = this;
                var nameToEnumMap = {};

                var keys = Object.keys(enumsObj);
                keys.forEach(function(enumName){
                    var enumObj = enumsObj[enumName];
                    nameToEnumMap[enumName] = enumObj.enum;
                });

                return nameToEnumMap ;
            };

            EnumSrv.flashcardStatus = new BaseEnum([
                ['keep', 0, 'Keep'],
                ['remove', 1, 'Remove']
            ]);

            return EnumSrv;
        }
    ]);
})(angular);

angular.module('znk.infra.enum').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore', [
            'znk.infra.config',
            'znk.infra.znkExercise',
            'znk.infra.utility'
        ])
        .run([
            'EstimatedScoreEventsHandlerSrv',
            function (EstimatedScoreEventsHandlerSrv) {
                EstimatedScoreEventsHandlerSrv.init();
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreEventsHandlerSrv', function EstimatedScoreEventsHandler() {
        function pointsMap(correctWithinAllowedTimeFrame, correctAfterAllowedTimeFrame, wrongWithinAllowedTimeFrame, wrongAfterAllowedTimeFrame, correctTooFast, wrongTooFast) {
            var ret = {};

            if (angular.isDefined(correctWithinAllowedTimeFrame)) {
                ret.correctWithin = correctWithinAllowedTimeFrame;
            }

            if (angular.isDefined(correctAfterAllowedTimeFrame)) {
                ret.correctAfter = correctAfterAllowedTimeFrame;
            }

            if (angular.isDefined(wrongWithinAllowedTimeFrame)) {
                ret.wrongWithin = wrongWithinAllowedTimeFrame;
            }

            if (angular.isDefined(wrongAfterAllowedTimeFrame)) {
                ret.wrongAfter = wrongAfterAllowedTimeFrame;
            }

            if (angular.isDefined(correctTooFast)) {
                ret.correctTooFast = correctTooFast;
            }

            if (angular.isDefined(wrongTooFast)) {
                ret.wrongTooFast = wrongTooFast;
            }

            ret.unanswered = 0;

            return ret;
        }

        var diagnosticScoring = {};
        this.setDiagnosticScoring = function (diagnosticScoringData) {
            var keys = Object.keys(diagnosticScoringData);
            keys.forEach(function (questionDifficulty) {
                var scoringDataArr = diagnosticScoringData[questionDifficulty];
                diagnosticScoring[questionDifficulty] = pointsMap.apply(this, scoringDataArr);
            });
        };

        var exercisesRawScoring = {};
        this.setExerciseRawPoints = function (exerciseType, scoringData) {
            exercisesRawScoring[exerciseType] = pointsMap.apply(this, scoringData);
        };

        var eventProcessControl;
        this.setEventProcessControl = function (_eventProcessControl) {
            eventProcessControl = _eventProcessControl;
        };

        var getAnswerTimeSpentType = function () { // default function
            return 'Within';
        };

        this.setAnswerTimeSpentTypeFn = function(fn){
            getAnswerTimeSpentType = fn;
        };


        this.$get = [
            '$rootScope', 'ExamTypeEnum', 'EstimatedScoreSrv', 'SubjectEnum', 'ExerciseTypeEnum', 'ExerciseAnswerStatusEnum', 'exerciseEventsConst', '$log', 'UtilitySrv', '$injector', '$q',
            function ($rootScope, ExamTypeEnum, EstimatedScoreSrv, SubjectEnum, ExerciseTypeEnum, ExerciseAnswerStatusEnum, exerciseEventsConst, $log, UtilitySrv, $injector, $q) {
                if (angular.equals({}, diagnosticScoring)) {
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                if (angular.equals({}, exercisesRawScoring)) {
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                var EstimatedScoreEventsHandlerSrv = {};

                var childScope = $rootScope.$new(true);

                function _basePointsGetter(pointsMap, answerStatus, answerTimeType) {
                    var key;
                    if (answerStatus === ExerciseAnswerStatusEnum.unanswered.enum) {
                        key = 'unanswered';
                    } else {
                        key = answerStatus === ExerciseAnswerStatusEnum.correct.enum ? 'correct' : 'wrong';
                        key += answerTimeType;
                    }
                    return pointsMap[key];
                }

                function _getDiagnosticQuestionPoints(question, result) {
                    var pointsMap = diagnosticScoring[question.difficulty];
                    var answerStatus = result.isAnsweredCorrectly ? ExerciseAnswerStatusEnum.correct.enum : ExerciseAnswerStatusEnum.wrong.enum;
                    var answerTimeType = getAnswerTimeSpentType(result);
                    return _basePointsGetter(pointsMap, answerStatus, answerTimeType);
                }

                function _diagnosticSectionCompleteHandler(section, sectionResult) {
                    var score = 0;

                    var questions = section.questions;
                    var questionsMap = UtilitySrv.array.convertToMap(questions);

                    sectionResult.questionResults.forEach(function (result, i) {
                        var question = questionsMap[result.questionId];
                        if (angular.isUndefined(question)) {
                            $log.error('EstimatedScoreEventsHandler: question for result is missing',
                                'section id: ', section.id,
                                'result index: ', i
                            );
                        } else {
                            score += _getDiagnosticQuestionPoints(question, result);
                        }
                    });
                    EstimatedScoreSrv.setDiagnosticSectionScore(score, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id);
                }

                function _getQuestionRawPoints(exerciseType, result) {
                    var answerTimeType = !result.afterAllowedTime ? 'Within' : 'After';

                    var answerStatus = ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum(result.isAnsweredCorrectly);

                    var rawPointsMap = exercisesRawScoring[exerciseType];
                    return _basePointsGetter(rawPointsMap, answerStatus, answerTimeType);
                }

                function _calculateRawScore(exerciseType, exerciseResult) {
                    if (!exercisesRawScoring[exerciseType]) {
                        $log.error('EstimatedScoreEventsHandlerSrv: raw scoring not exits for the following exercise type: ' + exerciseType);
                    }

                    var questionResults = exerciseResult.questionResults;

                    var rawPoints = {
                        total: questionResults.length * exercisesRawScoring[exerciseType].correctWithin,
                        earned: 0
                    };

                    questionResults.forEach(function (result) {
                        rawPoints.earned += _getQuestionRawPoints(exerciseType, result);
                    });
                    return rawPoints;
                }

                function _shouldEventBeProcessed(exerciseType, exercise, exerciseResult) {
                    if (!eventProcessControl) {
                        return $q.when(true);
                    }

                    var shouldEventBeProcessed = $injector.invoke(eventProcessControl);
                    if (angular.isFunction(shouldEventBeProcessed)) {
                        shouldEventBeProcessed = shouldEventBeProcessed(exerciseType, exercise, exerciseResult);
                    }
                    return $q.when(shouldEventBeProcessed);
                }

                childScope.$on(exerciseEventsConst.section.FINISH, function (evt, section, sectionResult, exam) {
                    _shouldEventBeProcessed(exerciseEventsConst.section.FINISH, section, sectionResult)
                        .then(function (shouldBeProcessed) {
                            if (shouldBeProcessed) {
                                var isDiagnostic = exam.typeId === ExamTypeEnum.DIAGNOSTIC.enum;
                                if (isDiagnostic) {
                                    _diagnosticSectionCompleteHandler(section, sectionResult);
                                }
                                var rawScore = _calculateRawScore(ExerciseTypeEnum.SECTION.enum, sectionResult);
                                EstimatedScoreSrv.addRawScore(rawScore, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id, isDiagnostic);
                            }
                        });
                });

                function _baseExerciseFinishHandler(exerciseType, evt, exercise, exerciseResult) {
                    _shouldEventBeProcessed(exerciseType, exercise, exerciseResult).then(function (shouldBeProcessed) {
                        if (shouldBeProcessed) {
                            var rawScore = _calculateRawScore(exerciseType, exerciseResult);
                            EstimatedScoreSrv.addRawScore(rawScore, exerciseType, exercise.subjectId, exercise.id);
                        }
                    });
                }

                angular.forEach(ExerciseTypeEnum, function (enumObj, enumName) {
                    if (enumName !== 'SECTION' && enumName !== 'LECTURE') {
                        var enumLowercaseName = enumName.toLowerCase();
                        var evtName = exerciseEventsConst[enumLowercaseName].FINISH;
                        childScope.$on(evtName, _baseExerciseFinishHandler.bind(EstimatedScoreEventsHandlerSrv, enumObj.enum));
                    }
                });

                EstimatedScoreEventsHandlerSrv.init = angular.noop;

                return EstimatedScoreEventsHandlerSrv;
            }
        ];

    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').service('EstimatedScoreHelperSrv',
        ["SubjectEnum", "InfraConfigSrv", "StorageSrv", function (SubjectEnum, InfraConfigSrv, StorageSrv) {
            'ngInject';

            var EstimatedScoreHelperSrv = this;

            var ESTIMATE_SCORE_PATH = StorageSrv.variables.appUserSpacePath + '/estimatedScore';

            function _SetSubjectInitialVal(obj, initValue) {
                var subjectKeys = Object.keys(SubjectEnum);
                for (var i in subjectKeys) {
                    var subjectEnum = SubjectEnum[subjectKeys[i]];
                    obj[subjectEnum.enum] = angular.copy(initValue);
                }
            }

            EstimatedScoreHelperSrv.getEstimatedScoreData = function(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(ESTIMATE_SCORE_PATH).then(function(estimatedScore){
                        var defaultValues = {
                            estimatedScores: {},
                            sectionsRawScores:{},
                            exercisesRawScores: {},
                            processedExercises: []
                        };

                        _SetSubjectInitialVal(defaultValues.estimatedScores,[]);
                        _SetSubjectInitialVal(defaultValues.sectionsRawScores,[]);
                        var rawScoreInitialObject = {
                            total: 0,
                            earned: 0
                        };
                        _SetSubjectInitialVal(defaultValues.exercisesRawScores,rawScoreInitialObject);

                        angular.forEach(defaultValues, function(defaultVal, defaultValKey){
                            if(angular.isUndefined(estimatedScore[defaultValKey])){
                                estimatedScore[defaultValKey] = defaultVal ;
                            }

                            if(estimatedScore[defaultValKey] !== defaultVal && angular.isObject(defaultVal)){
                                var currVal = estimatedScore[defaultValKey];
                                angular.forEach(defaultVal, function(innerDefaultVal, innerDefaultValueKey){
                                    if(angular.isUndefined(currVal[innerDefaultValueKey])){
                                        currVal[innerDefaultValueKey] = innerDefaultVal;
                                    }
                                });
                            }
                        });

                        return estimatedScore;
                    });
                });
            };

            EstimatedScoreHelperSrv.setEstimateScoreData = function (newEstimateScoreData){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.set(ESTIMATE_SCORE_PATH,newEstimateScoreData);
                });
            };
        }]
    );
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreSrv',function(){

        var subjectsRawScoreEdges;
        this.setSubjectsRawScoreEdges = function(_subjectsRawScoreEdges){
            subjectsRawScoreEdges = _subjectsRawScoreEdges;
        };

        var rawScoreToScoreFnGetter;
        this.setRawScoreToRealScoreFn = function(_rawScoreToScoreFnGetter){
            rawScoreToScoreFnGetter = _rawScoreToScoreFnGetter;
        };

        var minDiagnosticScore;
        var maxDiagnosticScore;
        this.setMinMaxDiagnosticScore = function(minScore, maxScore){
            minDiagnosticScore = minScore;
            maxDiagnosticScore = maxScore;
        };

        this.$get = [
            'EstimatedScoreHelperSrv', 'ExerciseTypeEnum', '$injector', '$q', 'SubjectEnum', '$log',
            function (EstimatedScoreHelperSrv, ExerciseTypeEnum, $injector, $q, SubjectEnum, $log) {
                if(!subjectsRawScoreEdges){
                    $log.error('EstimatedScoreSrv: subjectsRawScoreEdges was not set');
                }

                if(!rawScoreToScoreFnGetter){
                    $log.error('EstimatedScoreSrv: rawScoreToScoreFnGetter was not set !!!');
                }

                var processingData = $q.when();

                var EstimatedScoreSrv = {};

                function _baseGetter(key, subjectId) {
                    return processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScore) {
                            if (angular.isUndefined(subjectId)) {
                                return estimatedScore[key];
                            }
                            return estimatedScore[key][subjectId];
                        });
                    });
                }

                function _calculateNormalizedRawScore(sectionSubjectRawScores, exerciseSubjectRawScore, subjectId) {
                    var sectionsWithWeightTotalPoints = 0;
                    var sectionsWithWeightEarnedPoints = 0;
                    var sectionsTotalPoints = 0;
                    sectionSubjectRawScores.forEach(function (sectionRawScore, index) {
                        sectionsTotalPoints += sectionRawScore.total;
                        var multiBy = +index + 1;
                        sectionsWithWeightTotalPoints += sectionRawScore.total * multiBy;
                        sectionsWithWeightEarnedPoints += sectionRawScore.earned * multiBy;
                    });
                    var combinedSectionRawScore = {
                        total: sectionsTotalPoints,
                        earned: sectionsTotalPoints * sectionsWithWeightEarnedPoints / sectionsWithWeightTotalPoints
                    };
                    if(isNaN(combinedSectionRawScore.earned)){
                        combinedSectionRawScore.earned = 0;
                    }

                    var rawScore = (2 / 3) * combinedSectionRawScore.earned + (1 / 3) * exerciseSubjectRawScore.earned;
                    var maxRawScore = (2 / 3) * combinedSectionRawScore.total + (1 / 3) * exerciseSubjectRawScore.total;
                    var subjectRawScoreEdges = subjectsRawScoreEdges[subjectId];
                    if(angular.isUndefined(subjectRawScoreEdges)){
                        $log.error('EstimatedScoreSrv: subjectRawScoreEdges was not defined for the following subject: ' + subjectId);
                    }
                    var normalizedScore = subjectRawScoreEdges.max * rawScore / maxRawScore;
                    return Math.max(normalizedScore, subjectRawScoreEdges.min);//verify result is higher than min
                }

                function _calculateNewEstimatedScore(subjectId, normalizedRawScore, currEstimatedScore, addLimitToNewEstimatedScore) {
                    return _getScoreByRawScore(subjectId, normalizedRawScore).then(function (newEstimatedScore) {
                        if (!currEstimatedScore) {
                            return newEstimatedScore;
                        }

                        if (addLimitToNewEstimatedScore && Math.abs(newEstimatedScore - currEstimatedScore) > (newEstimatedScore * 0.05)) {
                            return currEstimatedScore + (newEstimatedScore - currEstimatedScore > 0 ? 1 : -1) * newEstimatedScore * 0.05;
                        }
                        return +newEstimatedScore.toFixed(2);
                    });
                }

                function _isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId) {
                    var exerciseKey = exerciseType + '_' + exerciseId;
                    if (estimatedScoreData.processedExercises.indexOf(exerciseKey) !== -1) {
                        return true;
                    }
                    estimatedScoreData.processedExercises.push(exerciseKey);
                }

                var _getScoreByRawScore = (function (){
                    var rawScoreToScoreFn = $injector.invoke(rawScoreToScoreFnGetter);
                    return function(subjectId, normalizedRawScore){
                        return $q.when(rawScoreToScoreFn(subjectId,normalizedRawScore));
                    };
                })();

                EstimatedScoreSrv.getEstimatedScores = _baseGetter.bind(this, 'estimatedScores');

                EstimatedScoreSrv.getSectionsRawScores = _baseGetter.bind(this, 'sectionsRawScores');

                EstimatedScoreSrv.getExercisesRawScore = _baseGetter.bind(this, 'exercisesRawScores');

                EstimatedScoreSrv.getLatestEstimatedScore = function(subjectId){
                    return _baseGetter('estimatedScores',subjectId).then(function(allScoresOrScoreForSubject){
                        if(angular.isDefined(subjectId)){
                            if(!allScoresOrScoreForSubject.length){
                                return {};
                            }
                            return allScoresOrScoreForSubject[allScoresOrScoreForSubject.length - 1];
                        }
                        var latestScoresPerSubject = {};
                        angular.forEach(allScoresOrScoreForSubject,function(scoresForSubject,subjectId){
                            latestScoresPerSubject[subjectId] = scoresForSubject.length ? scoresForSubject[scoresForSubject.length -1] : {};
                        });
                        return latestScoresPerSubject;
                    });
                };

                EstimatedScoreSrv.setDiagnosticSectionScore = function (score, exerciseType, subjectId, exerciseId) {
                    processingData = processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                            //score was already set
                            if (estimatedScoreData.estimatedScores[subjectId].length) {
                                var errMsg = 'Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId;
                                $log.info(errMsg);
                                return $q.reject(errMsg);
                            }

                            score = Math.max(minDiagnosticScore, Math.min(maxDiagnosticScore, score));
                            estimatedScoreData.estimatedScores[subjectId].push({
                                exerciseType: exerciseType,
                                exerciseId: exerciseId,
                                score: score,
                                time: Date.now()
                            });
                            return EstimatedScoreHelperSrv.setEstimateScoreData(estimatedScoreData).then(function () {
                                return estimatedScoreData.estimatedScores[subjectId][estimatedScoreData.estimatedScores[subjectId].length - 1];
                            });
                        }).catch(function(errMsg){
                            $log.info(errMsg);
                        });
                    });
                    return processingData;
                };

                EstimatedScoreSrv.addRawScore = function (rawScore, exerciseType, subjectId, exerciseId, isDiagnostic) {
                    processingData = processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                            if (_isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId)) {
                                var errMsg = 'Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId;
                                return $q.reject(errMsg);
                            }
                            if (exerciseType === ExerciseTypeEnum.SECTION.enum) {
                                var sectionSubjectRowScores = estimatedScoreData.sectionsRawScores[subjectId];
                                var newSectionSubjectRawScore = {
                                    exerciseType: exerciseType,
                                    exerciseId: exerciseId,
                                    time: Date.now()
                                };
                                angular.extend(newSectionSubjectRawScore, rawScore);
                                sectionSubjectRowScores.push(newSectionSubjectRawScore);
                            } else {
                                var exerciseSubjectRawScore = estimatedScoreData.exercisesRawScores[subjectId];
                                exerciseSubjectRawScore.exerciseType = exerciseType;
                                exerciseSubjectRawScore.exerciseId = exerciseId;
                                exerciseSubjectRawScore.time = Date.now();
                                exerciseSubjectRawScore.total += rawScore.total;
                                exerciseSubjectRawScore.earned += rawScore.earned;
                            }

                            if (!isDiagnostic) {
                                var normalizedRawScore = _calculateNormalizedRawScore(estimatedScoreData.sectionsRawScores[subjectId], estimatedScoreData.exercisesRawScores[subjectId], subjectId);
                                var estimatedScoresForSpecificSubject = estimatedScoreData.estimatedScores[subjectId];
                                var currEstimatedScore = estimatedScoresForSpecificSubject[estimatedScoresForSpecificSubject.length - 1] || {};
                                return _calculateNewEstimatedScore(subjectId, normalizedRawScore, currEstimatedScore.score, exerciseType !== ExerciseTypeEnum.SECTION.enum).then(function (newEstimatedScore) {
                                    estimatedScoreData.estimatedScores[subjectId].push({
                                        exerciseType: exerciseType,
                                        exerciseId: exerciseId,
                                        score: newEstimatedScore,
                                        time: Date.now()
                                    });
                                    return estimatedScoreData;
                                });
                            }
                            return estimatedScoreData;
                        }).then(function (estimatedScoreData) {
                            return EstimatedScoreHelperSrv.setEstimateScoreData(estimatedScoreData);
                        }).catch(function(errMsg){
                            $log.info(errMsg);
                        });
                    });
                    return processingData;
                };

                return EstimatedScoreSrv;
            }];
    });
})(angular);

angular.module('znk.infra.estimatedScore').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.evaluator', []);
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.evaluator').provider('ZnkEvaluatorSrv', function () {
        var self = this;

        var evaluateFnMap = {};

        var evaluateFnArr = [
            'shouldEvaluateQuestionFn',
            'isEvaluateQuestionTypeFn',
            'isEvaluateExerciseTypeFn',
            'getEvaluateStatusFn'
        ];

        angular.forEach(evaluateFnArr, function(fnName) {
            self[fnName + 'Getter'] = function(fn) {
                evaluateFnMap[fnName] = fn;
            };
        });

        this.$get = ["$q", "$injector", "$log", function ($q, $injector, $log) {
            'ngInject';

            var znkEvaluatorSrvApi = {};

            function handleErrors(evaluateFnName) {
                var errMsg = 'ZnkEvaluatorSrv: '+ evaluateFnName +' was not set';
                $log.error(errMsg);
                return $q.reject(errMsg);
            }

            function invokeEvaluateFn(evaluateFn, evaluateFnName) {
                if(!evaluateFn) {
                    return handleErrors(evaluateFnName);
                }

                try {
                    return $injector.invoke(evaluateFn);
                } catch (e) {
                    return handleErrors(evaluateFnName +' e: ' + e);
                }
            }

            angular.forEach(evaluateFnArr, function(fnName) {
                znkEvaluatorSrvApi[fnName] = invokeEvaluateFn.bind(null, evaluateFnMap[fnName], fnName);
            });

            znkEvaluatorSrvApi.evaluateQuestion = function () {
                //@todo(oded) implement saving data to firebase
            };

            return znkEvaluatorSrvApi;
        }];
    });
})(angular);

angular.module('znk.infra.evaluator').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eventManager', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.eventManager').service('EventManagerSrv',
        ["$log", function ($log) {
            'ngInject';

            function EventManagerSrv() {
                this.cbArr = [];
                this.currVal = null;
            }

            EventManagerSrv.prototype.registerCb = function (cb) {
                if(this.cbArr.indexOf(cb) !== -1){
                    $log.error('cb already registered');
                    return;
                }
                this.cbArr.push(cb);
                this.invokeCb(cb, this.currVal);
            };

            EventManagerSrv.prototype.unregisterCb = function (cb) {
                if (!cb) {
                    this.cbArr = [];
                    return;
                }

                var cbIndex = this.cbArr.indexOf(cb);
                if(cbIndex !== -1){
                    this.cbArr.splice(cbIndex, 1);
                }
            };

            EventManagerSrv.prototype.invokeCb = function (cb, oldVal) {
                cb(this.currVal, oldVal);
            };

            EventManagerSrv.prototype.invokeAllCbs = function (oldVal) {
                var self = this;
                this.cbArr.forEach(function (cb) {
                    self.invokeCb(cb, oldVal);
                });
            };

            EventManagerSrv.prototype.updateValue = function (newVal) {
                var oldVal = this.currVal;
                this.currVal = newVal;
                this.invokeAllCbs(oldVal);
            };

            return EventManagerSrv;
        }]
    );
})(angular);

angular.module('znk.infra.eventManager').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exams', []);
})(angular);

"use strict";
angular.module('znk.infra.exams').service('ExamSrv', ["StorageRevSrv", "$q", "ContentAvailSrv", "$log", function(StorageRevSrv, $q, ContentAvailSrv, $log) {
        'ngInject';

        var self = this;

        function _getExamOrder() {
            return StorageRevSrv.getContent({
                exerciseType: 'personalization'
            }).then(function (personalizationData) {
                var errorMsg = 'ExamSrv getExamOrder: personalization.examOrder is not array or empty!';
                if (!angular.isArray(personalizationData.examOrder) || personalizationData.examOrder.length === 0) {
                    $log.error(errorMsg);
                    return $q.reject(errorMsg);
                }
                return personalizationData.examOrder;
            });
        }

        function _getContentFromStorage(data) {
            return StorageRevSrv.getContent(data);
        }

        this.getExam = function (examId, setIsAvail) {
            return _getContentFromStorage({
                exerciseId: examId, exerciseType: 'exam'
            }).then(function (exam) {
                if (!setIsAvail) {
                    return exam;
                }

                var getIsAvailPromArr = [];
                var sections = exam.sections;
                angular.forEach(sections, function (section) {
                    var isSectionAvailProm = ContentAvailSrv.isSectionAvail(examId, section.id).then(function (isAvail) {
                        section.isAvail = !!isAvail;
                    });
                    getIsAvailPromArr.push(isSectionAvailProm);
                });

                return $q.all(getIsAvailPromArr).then(function () {
                    return exam;
                });
            });
        };

        this.getExamSection = function (sectionId) {
            return _getContentFromStorage({
                exerciseId: sectionId, exerciseType: 'section'
            });
        };

        this.getAllExams = function (setIsAvail) {
            return _getExamOrder().then(function (examOrder) {
                var examsProms = [];
                var examsByOrder = examOrder.sort(function (a, b) {
                    return a.order > b.order;
                });
                angular.forEach(examsByOrder, function (exam) {
                    examsProms.push(self.getExam(exam.examId, setIsAvail));
                });
                return $q.all(examsProms);
            });
        };
}]);

angular.module('znk.infra.exams').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult', [
        'znk.infra.config','znk.infra.utility',
        'znk.infra.exerciseUtility'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv', 'ExerciseTypeEnum', 'StorageSrv', 'ExerciseStatusEnum',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseTypeEnum, StorageSrv, ExerciseStatusEnum) {
            var ExerciseResultSrv = this;

            var EXERCISE_RESULTS_PATH = 'exerciseResults';
            var EXAM_RESULTS_PATH = 'examResults';
            var MODULE_RESULTS_PATH = 'moduleResults';
            var USER_EXERCISE_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/exerciseResults';
            var USER_EXAM_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/examResults';
            var USER_EXERCISES_STATUS_PATH = StorageSrv.variables.appUserSpacePath + '/exercisesStatus';
            var USER_MODULE_RESULTS_PATH = StorageSrv.variables.appUserSpacePath + '/moduleResults';

            function _getExerciseResultPath(guid) {
                return EXERCISE_RESULTS_PATH + '/' + guid;
            }

            function _getModuleResultPath(guid) {
                return MODULE_RESULTS_PATH + '/' + guid;
            }

            function _getInitExerciseResult(exerciseTypeId, exerciseId, guid) {

                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function (user) {
                    return {
                        exerciseId: exerciseId,
                        exerciseTypeId: exerciseTypeId,
                        startedTime: Date.now(),
                        uid: user.uid,
                        questionResults: [],
                        guid: guid
                    };
                });
            }

            function _getExerciseResultByGuid(guid) {
                var exerciseResultPath = _getExerciseResultPath(guid);
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(exerciseResultPath);
                });
            }

            function _getExerciseResultsGuids() {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(USER_EXERCISE_RESULTS_PATH);
                });
            }

            function _getExamResultPath(guid) {
                return EXAM_RESULTS_PATH + '/' + guid;
            }

            function _getExamResultByGuid(guid, examId) {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    var path = _getExamResultPath(guid);
                    return StudentStorageSrv.get(path).then(function (examResult) {
                        var initResultProm = _getInitExamResult(examId, guid);
                        return initResultProm.then(function (initResult) {
                            if (examResult.guid !== guid) {
                                angular.extend(examResult, initResult);
                            } else {
                                UtilitySrv.object.extendWithoutOverride(examResult, initResult);
                            }
                            return examResult;
                        });
                    });
                });
            }

            function _getInitExamResult(examId, guid) {
                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function (user) {
                    return {
                        isComplete: false,
                        startedTime: Date.now(),
                        examId: examId,
                        guid: guid,
                        uid: user.uid,
                        sectionResults: {}
                    };
                });
            }

            function _getExamResultsGuids() {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(USER_EXAM_RESULTS_PATH);
                });
            }

            function _calcExerciseResultFields(exerciseResultObj) {

                function _getAvgTime(totalNum, totalTime) {
                    return Math.round(totalNum ? totalTime / totalNum : 0);
                }

                var countCorrect = 0,
                    countWrong = 0,
                    countSkipped = 0,
                    correctTotalTime = 0,
                    wrongTotalTime = 0,
                    skippedTotalTime = 0,
                    dataToSaveObj = {};

                if (exerciseResultObj.questionResults) {
                    var totalTimeSpentOnQuestions = exerciseResultObj.questionResults.reduce(function (previousValue, currResult) {
                        var timeSpentOnQuestion = angular.isDefined(currResult.timeSpent) && !isNaN(currResult.timeSpent) ? currResult.timeSpent : 0;
                        if (currResult.isAnsweredCorrectly) {
                            countCorrect++;
                            correctTotalTime += timeSpentOnQuestion;
                        } else if (angular.isDefined(currResult.userAnswer)) {
                            countWrong++;
                            wrongTotalTime += timeSpentOnQuestion;
                        } else {
                            countSkipped++;
                            skippedTotalTime += timeSpentOnQuestion;
                        }

                        return previousValue + (currResult.timeSpent || 0);
                    }, 0);
                    var questionsNum = exerciseResultObj.questionResults.length;

                    exerciseResultObj.totalQuestionNum = questionsNum;
                    exerciseResultObj.totalAnsweredNum = countWrong + countCorrect;
                    exerciseResultObj.correctAnswersNum = countCorrect;
                    exerciseResultObj.wrongAnswersNum = countWrong;
                    exerciseResultObj.skippedAnswersNum = countSkipped;
                    exerciseResultObj.duration = totalTimeSpentOnQuestions;
                    exerciseResultObj.correctAvgTime = _getAvgTime(countCorrect, correctTotalTime);
                    exerciseResultObj.wrongAvgTime = _getAvgTime(countWrong, wrongTotalTime);
                    exerciseResultObj.skippedAvgTime = _getAvgTime(countSkipped, skippedTotalTime);
                    exerciseResultObj.avgTimePerQuestion = questionsNum ? Math.round(totalTimeSpentOnQuestions / questionsNum) : 0;
                }

                if (exerciseResultObj.isComplete && angular.isUndefined(exerciseResultObj.endedTime)) {
                    exerciseResultObj.endedTime = Date.now();
                }

                var exerciseResultPath = _getExerciseResultPath(exerciseResultObj.guid);
                dataToSaveObj[exerciseResultPath] = exerciseResultObj;

                return _getExercisesStatusData().then(function (exercisesStatusData) {
                    if (!exercisesStatusData[exerciseResultObj.exerciseTypeId]) {
                        exercisesStatusData[exerciseResultObj.exerciseTypeId] = {};
                    }

                    var exerciseNewStatus = exerciseResultObj.isComplete ? ExerciseStatusEnum.COMPLETED.enum : ExerciseStatusEnum.ACTIVE.enum;
                    exercisesStatusData[exerciseResultObj.exerciseTypeId][exerciseResultObj.exerciseId] = new ExerciseStatus(exerciseNewStatus, totalTimeSpentOnQuestions);
                    dataToSaveObj[USER_EXERCISES_STATUS_PATH] = exercisesStatusData;
                    return {
                        exerciseResult: exerciseResultObj,
                        exercisesStatus: exercisesStatusData,
                        dataToSave: dataToSaveObj
                    };
                });
            }

            function exerciseSaveFn() {
                /* jshint validthis: true */
                return _calcExerciseResultFields(this).then(function (response) {
                    var exerciseResult = response.exerciseResult;
                    var dataToSave = response.dataToSave;
                    var exercisesStatusData = response.exercisesStatus;

                    var getSectionAggregatedDataProm = $q.when();
                    if (exerciseResult.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                        getSectionAggregatedDataProm = ExerciseResultSrv.getExamResult(exerciseResult.examId).then(function (examResult) {
                            var sectionsAggregatedData = _getExamAggregatedSectionsData(examResult, exercisesStatusData);

                            examResult.duration = sectionsAggregatedData.sectionsDuration;

                            if (sectionsAggregatedData.allSectionsCompleted) {
                                examResult.isComplete = true;
                                examResult.endedTime = Date.now();
                                var examResultPath = _getExamResultPath(examResult.guid);
                                dataToSave[examResultPath] = examResult;
                            }
                        });
                    }

                    return getSectionAggregatedDataProm.then(function () {
                        return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                            StudentStorageSrv.update(dataToSave);
                            return exerciseResult;
                        });
                    });
                });
            }

            function _getExamAggregatedSectionsData(examResult, exercisesStatusData) {
                var aggregatedData = {
                    sectionsDuration: 0
                };

                var sectionExercisesStatus = exercisesStatusData[ExerciseTypeEnum.SECTION.enum];
                var sectionResultsToArr = Object.keys(examResult.sectionResults);

                var areAllExamSectionsHasResults = sectionResultsToArr.length === +examResult.examSectionsNum;
                aggregatedData.allSectionsCompleted = areAllExamSectionsHasResults;

                for (var i = 0, ii = sectionResultsToArr.length; i < ii; i++) {
                    var sectionId = sectionResultsToArr[i];
                    var sectionStatus = sectionExercisesStatus[sectionId] || {};

                    var isSectionComplete = sectionStatus.status === ExerciseStatusEnum.COMPLETED.enum;
                    if (!isSectionComplete) {
                        aggregatedData.allSectionsCompleted = false;
                    }

                    aggregatedData.sectionsDuration += sectionStatus.duration || 0;
                }

                return aggregatedData;
            }

            function _getExercisesStatusData() {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(USER_EXERCISES_STATUS_PATH);
                });
            }

            function ExerciseStatus(status, duration) {
                this.status = status;
                this.duration = duration;
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId, examSectionsNum, dontInitialize) {

                if (!UtilitySrv.fn.isValidNumber(exerciseTypeId) || !UtilitySrv.fn.isValidNumber(exerciseId)) {
                    var errMSg = 'ExerciseResultSrv: exercise type id, exercise id should be number !!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                exerciseTypeId = +exerciseTypeId;
                exerciseId = +exerciseId;

                if (exerciseTypeId === ExerciseTypeEnum.SECTION.enum && !UtilitySrv.fn.isValidNumber(examId)) {
                    var examErrMSg = 'ExerciseResultSrv: exam id should be provided when asking for section result and should' +
                        ' be a number!!!';
                    $log.error(examErrMSg);
                    return $q.reject(examErrMSg);
                }
                examId = +examId;

                var getExamResultProm;
                if (exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                    getExamResultProm = ExerciseResultSrv.getExamResult(examId, dontInitialize);
                }
                return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                    var resultGuid = exerciseResultsGuids[exerciseTypeId] && exerciseResultsGuids[exerciseTypeId][exerciseId];
                    if (!resultGuid) {
                        if (dontInitialize) {
                            return null;
                        }

                        if (!exerciseResultsGuids[exerciseTypeId]) {
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                            var newGuid = UtilitySrv.general.createGuid();

                            var dataToSave = {};

                            exerciseResultsGuids[exerciseTypeId][exerciseId] = newGuid;
                            dataToSave[USER_EXERCISE_RESULTS_PATH] = exerciseResultsGuids;

                            var exerciseResultPath = _getExerciseResultPath(newGuid);
                            var initResultProm = _getInitExerciseResult(exerciseTypeId, exerciseId, newGuid);
                            return initResultProm.then(function (initResult) {
                                dataToSave[exerciseResultPath] = initResult;

                                var setProm;
                                if (getExamResultProm) {
                                    initResult.examId = examId;
                                    setProm = getExamResultProm.then(function (examResult) {
                                        if (examSectionsNum && !examResult.examSectionsNum) {
                                            examResult.examSectionsNum = examSectionsNum;
                                        }

                                        if (!examResult.sectionResults) {
                                            examResult.sectionResults = {};
                                        }
                                        examResult.sectionResults[exerciseId] = newGuid;

                                        var examResultPath = _getExamResultPath(examResult.guid);
                                        dataToSave[examResultPath] = examResult;
                                    });
                                }

                                return $q.when(setProm).then(function () {
                                    return StudentStorageSrv.update(dataToSave);
                                }).then(function (res) {
                                    return res[exerciseResultPath];
                                });
                            });
                        });
                    }

                    return _getExerciseResultByGuid(resultGuid).then(function (result) {
                        var initResultProm = _getInitExerciseResult(exerciseTypeId, exerciseId, resultGuid);
                        return initResultProm.then(function (initResult) {
                            if (result.guid !== resultGuid) {
                                angular.extend(result, initResult);
                            } else {
                                UtilitySrv.object.extendWithoutOverride(result, initResult);
                            }
                            return result;
                        });
                    });
                }).then(function (exerciseResult) {
                    if (angular.isObject(exerciseResult)) {
                        exerciseResult.$save = exerciseSaveFn;
                    }
                    return exerciseResult;
                });
            };

            this.getExamResult = function (examId, dontInitialize) {
                if (!UtilitySrv.fn.isValidNumber(examId)) {
                    var errMsg = 'Exam id is not a number !!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }
                examId = +examId;

                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return _getExamResultsGuids().then(function (examResultsGuids) {
                        var examResultGuid = examResultsGuids[examId];
                        if (!examResultGuid) {
                            if (dontInitialize) {
                                return null;
                            }

                            var dataToSave = {};
                            var newExamResultGuid = UtilitySrv.general.createGuid();
                            examResultsGuids[examId] = newExamResultGuid;
                            dataToSave[USER_EXAM_RESULTS_PATH] = examResultsGuids;

                            var examResultPath = _getExamResultPath(newExamResultGuid);
                            var initExamResultProm = _getInitExamResult(examId, newExamResultGuid);
                            return initExamResultProm.then(function (initExamResult) {
                                dataToSave[examResultPath] = initExamResult;

                                return StudentStorageSrv.update(dataToSave).then(function (res) {
                                    return res[examResultPath];
                                });
                            });
                        }

                        return _getExamResultByGuid(examResultGuid, examId);
                    });
                });
            };

            this.getExerciseStatus = function (exerciseType, exerciseId) {
                return _getExercisesStatusData().then(function (exercisesStatusData) {
                    if (!exercisesStatusData[exerciseType] || !exercisesStatusData[exerciseType][exerciseId]) {
                        return new ExerciseStatus(ExerciseStatusEnum.NEW.enum);
                    }
                    return exercisesStatusData[exerciseType][exerciseId];
                });
            };

            this.getExercisesStatusMap = function () {
                return _getExercisesStatusData();
            };

            /* Module Results Functions */
            this.getModuleExerciseResult = function (userId, moduleId, exerciseTypeId, exerciseId) {

                return $q.all([
                    this.getExerciseResult(exerciseTypeId, exerciseId, null, null, true),
                    _getInitExerciseResult(exerciseTypeId, exerciseId, UtilitySrv.general.createGuid())
                ]).then(function (results) {
                    var exerciseResult = results[0];
                    var initResults = results[1];

                    if (!exerciseResult) {
                        exerciseResult = initResults;
                        exerciseResult.$$path = EXERCISE_RESULTS_PATH + '/' + exerciseResult.guid;
                    }
                    exerciseResult.moduleId = moduleId;
                    exerciseResult.$save = moduleExerciseSaveFn;
                    return exerciseResult;
                });
            };

            this.getModuleResult = function (userId, moduleId, withDefaultResult, withExerciseResults) {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    var userResultsPath = USER_MODULE_RESULTS_PATH.replace('$$uid', userId);
                    return StudentStorageSrv.get(userResultsPath).then(function (moduleResultsGuids) {
                        var defaultResult = {};
                        var moduleResultGuid = moduleResultsGuids[moduleId];

                        if (!moduleResultGuid) {
                            if (!withDefaultResult) {
                                return null;
                            } else {
                                defaultResult = ExerciseResultSrv.getDefaultModuleResult(moduleId, userId);
                                moduleResultGuid = defaultResult.guid;
                            }
                        }

                        var resultPath = MODULE_RESULTS_PATH + '/' + moduleResultGuid;
                        return StudentStorageSrv.get(resultPath).then(function (moduleResult) {

                            var getExerciseResultsProm = $q.when();

                            if (moduleResult.exerciseResults && withExerciseResults) {
                                angular.forEach(moduleResult.exerciseResults, function (exerciseResult, exerciseTypeId) {
                                    angular.forEach(exerciseResult, function (exerciseResultGuid, exerciseId) {
                                        getExerciseResultsProm = getExerciseResultsProm.then(function () {
                                            return ExerciseResultSrv.getModuleExerciseResult(userId, moduleId, exerciseTypeId, exerciseId).then(function (exerciseResults) {
                                                if (exerciseResults) {
                                                    moduleResult.exerciseResults[exerciseTypeId][exerciseId] = exerciseResults;
                                                }
                                            });
                                        });
                                    });
                                });
                            }
                            return getExerciseResultsProm.then(function () {
                                return moduleResult;
                            });
                        });
                    });
                });
            };

            this.getUserModuleResultsGuids = function (userId) {
                var userResultsPath = USER_MODULE_RESULTS_PATH.replace('$$uid', userId);
                return InfraConfigSrv.getStudentStorage().then(function (storage) {
                    return storage.get(userResultsPath);
                });
            };

            this.getDefaultModuleResult = function (moduleId, userId) {
                return {
                    moduleId: moduleId,
                    uid: userId,
                    assignedTutorId: null,
                    assign: false,
                    contentAssign: false,
                    exerciseResults: [],
                    guid: UtilitySrv.general.createGuid()
                };
            };

            this.setModuleResult = function (newResult, moduleId) {
                return this.getUserModuleResultsGuids(newResult.uid).then(function (userGuidLists) {
                    var moduleResultPath = MODULE_RESULTS_PATH + '/' + newResult.guid;
                    if (userGuidLists[moduleId]) {
                        return ExerciseResultSrv.getModuleResult(newResult.uid, newResult.moduleId).then(function (moduleResult) {
                            angular.extend(moduleResult, newResult);
                            return InfraConfigSrv.getStudentStorage().then(function (storage) {
                                return storage.set(moduleResultPath, moduleResult);
                            });
                        });
                    }

                    userGuidLists[newResult.moduleId] = newResult.guid;
                    var dataToSave = {};
                    dataToSave[USER_MODULE_RESULTS_PATH] = userGuidLists;
                    dataToSave[moduleResultPath] = newResult;
                    return InfraConfigSrv.getStudentStorage().then(function (storage) {
                        return storage.update(dataToSave).then(function (newResults) {
                            return newResults[moduleResultPath];
                        });
                    });
                });
            };

            this.getExerciseResultByGuid = function (guid) {
                return _getExerciseResultByGuid(guid).then(function (exerciseResult) {
                    exerciseResult.$save = exerciseSaveFn;
                    return exerciseResult;
                });
            };

            function moduleExerciseSaveFn() {

                /* jshint validthis: true */
                return _calcExerciseResultFields(this).then(function (response) {
                    var exerciseResult = response.exerciseResult;
                    var dataToSave = response.dataToSave;
                    var exerciseStatuses = response.exercisesStatus || {};

                    return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                        var exerciseTypeId = exerciseResult.exerciseTypeId;
                        var exerciseId = exerciseResult.exerciseId;

                        if (!exerciseResultsGuids[exerciseTypeId]) {
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        exerciseResultsGuids[exerciseTypeId][exerciseId] = exerciseResult.guid;
                        dataToSave[USER_EXERCISE_RESULTS_PATH] = exerciseResultsGuids;

                        return ExerciseResultSrv.getModuleResult(exerciseResult.uid, exerciseResult.moduleId).then(function (moduleResult) {
                            if (!moduleResult.exerciseResults) {
                                moduleResult.exerciseResults = {};
                            }
                            if (!moduleResult.exerciseResults[exerciseTypeId]) {
                                moduleResult.exerciseResults[exerciseTypeId] = {};
                            }

                            moduleResult.exerciseResults[exerciseTypeId][exerciseId] = exerciseResult.guid;

                            if (exerciseStatuses[exerciseTypeId] && exerciseStatuses[exerciseTypeId][exerciseId]) {
                                var exerciseResultsPath = _getExerciseResultPath(exerciseResult.guid);
                                dataToSave[exerciseResultsPath].status = exerciseStatuses[exerciseTypeId][exerciseId].status;
                            }

                            moduleResult.lastUpdate = Date.now();
                            var modulePath = _getModuleResultPath(moduleResult.guid);
                            dataToSave[modulePath] = moduleResult;

                            return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                                return StudentStorageSrv.update(dataToSave);
                            });
                        });
                    });
                });
            }
        }
    ]);
})(angular);

angular.module('znk.infra.exerciseResult').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility', [
        'znk.infra.config',
        'znk.infra.enum',
        'znk.infra.storage',
        'znk.infra.exerciseResult',
        'znk.infra.contentAvail',
        'znk.infra.content'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('AnswerTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['SELECT_ANSWER',0 ,'select answer'],
                ['FREE_TEXT_ANSWER',1 ,'free text answer'],
                ['RATE_ANSWER',3 ,'rate answer']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('categoryEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['TUTORIAL', 1, 'tutorial'],
                ['EXERCISE', 2, 'exercise'],
                ['MINI_CHALLENGE', 3, 'miniChallenge'],
                ['SECTION', 4, 'section'],
                ['DRILL', 5, 'drill'],
                ['GENERAL', 6, 'general'],
                ['SPECIFIC', 7, 'specific'],
                ['STRATEGY', 8, 'strategy'],
                ['SUBJECT', 9, 'subject'],
                ['SUB_SCORE', 10, 'subScore'],
                ['TEST_SCORE', 11, 'testScore']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExamTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['FULL_TEST', 0, 'test'],
                ['MINI_TEST', 1, 'miniTest'],
                ['DIAGNOSTIC', 2, 'diagnostic']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExerciseParentEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['WORKOUT', 1, 'workout'],
                ['TUTORIAL', 2, 'tutorial'],
                ['EXAM', 3, 'exam'],
                ['MODULE', 4, 'module']
            ]);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var exerciseStatusEnum = {
        NEW: 0,
        ACTIVE: 1,
        COMPLETED: 2,
        COMING_SOON: 3
    };

    angular.module('znk.infra.exerciseUtility').constant('exerciseStatusConst', exerciseStatusEnum);

    angular.module('znk.infra.exerciseUtility').factory('ExerciseStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NEW', exerciseStatusEnum.NEW, 'new'],
                ['ACTIVE', exerciseStatusEnum.ACTIVE, 'active'],
                ['COMPLETED', exerciseStatusEnum.COMPLETED, 'completed'],
                ['COMING_SOON', exerciseStatusEnum.COMING_SOON, 'coming soon']
            ]);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var exerciseTypeConst = {
        TUTORIAL: 1,
        PRACTICE: 2,
        GAME: 3,
        SECTION: 4,
        DRILL: 5,
        LECTURE: 13
    };

    angular.module('znk.infra.exerciseUtility')
        .constant('exerciseTypeConst', exerciseTypeConst)
        .factory('ExerciseTypeEnum', [
            'EnumSrv',
            function (EnumSrv) {
                return new EnumSrv.BaseEnum([
                    ['TUTORIAL', 1, 'Tutorial'],
                    ['PRACTICE', 2, 'Practice'],
                    ['GAME', 3, 'Game'],
                    ['SECTION', 4, 'Section'],
                    ['DRILL', 5, 'Drill'],
                    ['LECTURE', 13, 'Lecture']
                ]);
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('QuestionFormatEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var QuestionFormatEnum = new EnumSrv.BaseEnum([
                ['TEXT',1,'text'],
                ['AUDIO',2, 'audio'],
                ['TEXT_AUDIO', 3, 'text audio'],
                ['PROSE_SUMMARY', 4, 'prose Summary'],
                ['FILL_IN_TABLE', 5, 'fill in a table'],
                ['CONNECTING_CONTENT', 6, 'connecting content'],
                ['INDEPENDENT', 7, 'independent'],
                ['STANDARD', 8, 'standard']
            ]);

            return QuestionFormatEnum;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        READING: 1,
        WRITING: 2,
        LISTENING: 3,
        SPEAKING: 4,
        ENGLISH: 5,
        SCIENCE: 6,
        VERBAL: 7,
        ESSAY: 8
    };

    angular.module('znk.infra.exerciseUtility').constant('SubjectEnumConst', subjectEnum);

    angular.module('znk.infra.exerciseUtility').factory('SubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var SubjectEnum = new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['READING', subjectEnum.READING, 'reading'],
                ['WRITING', subjectEnum.WRITING, 'writing'],
                ['LISTENING', subjectEnum.LISTENING, 'listening'],
                ['SPEAKING', subjectEnum.SPEAKING, 'speaking'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english'],
                ['SCIENCE', subjectEnum.SCIENCE, 'science'],
                ['VERBAL', subjectEnum.VERBAL, 'verbal'],
                ['ESSAY', subjectEnum.ESSAY, 'essay']
            ]);

            return SubjectEnum;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExerciseUtilitySrv',
        function () {
            'ngInject';
            
            var ExerciseUtilitySrv = {};

            return ExerciseUtilitySrv;
        }
    );
})(angular);

angular.module('znk.infra.exerciseUtility').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.filters', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.filters').filter('capitalize', [
        function () {
            return function (str) {
                if(!angular.isString(str) || !str.length){
                    return '';
                }
                
                return str[0].toUpperCase() + str.substr(1);
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';
    /**
     * @param time (in seconds)
     * @param exp (expression to display time)
     *      'ss' - seconds in hour (1-59)
     *      'SS' - padded seconds in hour (01-59)
     *      'mm' - minutes in hour (1)
     *      'MM' - padded minutes in hour (01-59)
     *      'hh' - hours (1, 2, 3 etc')
     *      'HH' - padded hours - (01, 02, 03 etc')
     * @returns formatted time string
     */
    angular.module('znk.infra.filters').filter('formatDuration', ['$log', function ($log) {
        return function (time, exp) {
            if (!angular.isNumber(time) || isNaN(time)) {
                $log.error('time is not a number:', time);
                return '';
            }
            var t = Math.round(parseInt(time));
            var hours = parseInt(t / 3600, 10);
            var paddedHours = (hours < 10) ? '0' + hours : hours;
            t = t - (hours * 3600);
            var minutes = parseInt(t / 60, 10);
            var paddedMinutes = (minutes < 10) ? '0' + minutes : minutes;
            var seconds = time % 60;
            var paddedSeconds = (seconds < 10) ? '0' + seconds : seconds;
            var defaultFormat = 'mm:ss';

            if (!exp) {
                exp = defaultFormat;
            }

            return exp.replace(/hh/g, (hours) ? hours : '')
                .replace(/HH/g, (paddedHours) ? paddedHours : '')
                .replace(':', (parseInt(paddedHours) || parseInt(hours)) ? ':' : '') // omit the first : if hours === 0 or 00
                .replace(/mm/g, minutes)
                .replace(/MM/g, paddedMinutes)
                .replace(/ss/g, seconds)
                .replace(/SS/g, paddedSeconds);
        };
    }]);
})(angular);

(function (angular) {
    'use strict';
    /**
     * params:
     *  time - in milliseconds
     *  expr -
     *      hh - total hours in duration
     *      mm - total minutes in duration
     *      ss - total seconds in duration
     *      rss - seconds modulo
     */
    angular.module('znk.infra.filters').filter('formatTimeDuration', ['$log', function ($log) {
        return function (time, exp) {
            if (!angular.isNumber(time) || isNaN(time)) {
                $log.error('time is not a number:', time);
                return '';
            }

            time = Math.round(parseInt(time), 10);

            var hours = parseInt(time / 3600000, 10);
            var minutes = parseInt(time / 60000, 10);
            var seconds = parseInt(time / 1000, 10);

            var rss = seconds - (minutes * 60);

            var defaultFormat = 'mm';

            if (!exp) {
                exp = defaultFormat;
            }

            return exp
                .replace(/rss/g, rss)
                .replace(/hh/g, hours)
                .replace(/mm/g, minutes)
                .replace(/ss/g, seconds);
        };
    }]);
})(angular);

angular.module('znk.infra.filters').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.general',
        [
            'znk.infra.enum',
            'znk.infra.svgIcon',
            'pascalprecht.translate',
            'angular-svg-round-progressbar'
        ])
        .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'general-clock-icon': 'components/general/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);

})(angular);

/**
 * evaluates content , then it appended it to the DOM , and finally it compiles it with scope which was created out of the directive scope.
 * attrs-
 *  compile-drv: expression which be evaluated and then appended to the dom.
 *  bind-once: angular expression which evaluated by the scope , if it true then the watcher will be killed after the first time content was added to the dom
 */

'use strict';

(function (angular) {
    angular.module('znk.infra.general').directive('compile', [
        '$compile','$animate',
        function($compile,$animate) {
            return {
            link: function(scope,element,attrs){
                var _childScope;

                var watchDestroyer = scope.$watch(attrs.compile,function(newVal){
                    if(_childScope){
                        _childScope.$destroy();
                        _childScope = null;
                        $animate.leave(element.children());
                        element.empty();
                    }


                    if(typeof newVal === 'undefined'){
                        return;
                    }

                    if(scope.$eval(attrs.bindOnce)){
                        watchDestroyer();
                    }

                    if(typeof newVal !== 'string'){
                        if(newVal === null){
                            newVal = '';
                        }
                        newVal = '' + newVal;
                    }

                    var _htmlStrRegex = /^<(.*)>.*<\/\1>$/;
                    /**
                     * check if html string , if true create jq lite element of it and append with animation otherwise just append to the dom
                     */
                    if(_htmlStrRegex.test(newVal)){
                        _childScope = scope.$new();
                        var $content = angular.element(newVal);
                        $animate.enter($content,element);
                        $compile(element.children())(_childScope);
                    }else{
                        element.append(newVal);
                    }
                });
            }
        };
    }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.general').filter('cutString', function cutStringFilter() {
        return function (str, length, onlyFullWords) {
            length = +length;
            if (!str || length <= 0) {
                return '';
            }
            if (isNaN(length) || str.length < length) {
                return str;
            }
            var words = str.split(' ');
            var newStr = '';
            if (onlyFullWords) {
                for (var i = 0; i < words.length; i++) {
                    if (newStr.length + words[i].length <= length) {
                        newStr = newStr + words[i] + ' ';
                    } else {
                        break;
                    }
                }
            } else {
                newStr = str.substr(0, length);
            }

            return newStr + '...';
        };
    });
})(angular);


'use strict';

(function (angular) {
    angular.module('znk.infra.general').directive('disableClickDrv', [
        function () {
            return {
                priority: 200,
                link: {
                    pre: function (scope, element, attrs) {
                        function clickHandler(evt){
                            if(attrs.disabled){
                                evt.stopImmediatePropagation();
                                evt.preventDefault();
                                return false;
                            }
                        }
                        var eventName = 'click';
                        element[0].addEventListener (eventName, clickHandler);
                        scope.$on('$destroy',function(){
                            element[0].removeEventListener (eventName, clickHandler);
                        });
                    }
                }
            };
        }
    ]);
})(angular);

/**
 * attrs -
 *
 *  bg
 *  bgLoader
 *  fontColor
 *  precentage
 *  showLoader
 *  fillLoader
 */
'use strict';

(function (angular) {

    angular.module('znk.infra.general').directive('elementLoader', function () {
        var directive = {
            restrict: 'EA',
            scope: {
                bg: '=',
                bgLoader: '=',
                fontColor: '=',
                precentage: '=',
                showLoader: '=',
                fillLoader: '='
            },
            link: function (scope, elem) {
                var defaultView = function () {
                    elem[0].className = elem[0].className + ' elem-loader';
                    elem[0].style.backgroundImage = 'linear-gradient(to right, ' + scope.bg + ' 10%,rgba(255, 255, 255, 0) 0,' + scope.bg + ' 0)';
                    elem[0].style.backgroundSize = '100%';
                    elem[0].style.webkitTransition = 'background-size 20000ms cubic-bezier(0.000, 0.915, 0.000, 0.970)';
                };

                scope.$watch('showLoader', function (newValue) {
                    if (newValue) {
                        elem[0].style.color = scope.fontColor;
                        elem[0].style.backgroundImage = 'linear-gradient(to right, ' + scope.bgLoader + ' 10%,rgba(255, 255, 255, 0) 0,' + scope.bg + ' 0)';
                        elem[0].style.backgroundSize = '900%';
                    }
                }, true);

                scope.$watch('fillLoader', function (newValue) {
                    if (!!newValue) {
                        elem[0].style.webkitTransition = 'background-size 100ms ';
                        elem[0].style.backgroundSize = '1100%';
                    } else {
                        if (typeof newValue === 'undefined') {
                            return;
                        }
                        defaultView();
                    }
                }, true);

                defaultView();
            }
        };

        return directive;
    });

})(angular);

/**
 *  @directive subjectIdToAttrDrv
 *  This directive is an evolution of 'subjectIdToClassDrv'
 *  @context-attr a comma separated string of attribute names
 *  @prefix a comma separated string of prefixes to the attribute values
 *  @suffix a comma separated string of suffixes to the attribute values
 *
 *  In case only one prefix/suffix is provided, it will be used in all attributes
 *  In case no @context-attr is provided, it will set the class attribute by default
 *  No need to pass dashes ('-') to prefix or suffix, they are already appended
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToAttrDrv', [
        'SubjectEnum', '$interpolate',
        function (SubjectEnum, $interpolate) {
            return {
                link: {
                    pre: function (scope, element, attrs) {
                        var addedClassesArr = [];

                        scope.$watch(attrs.subjectIdToAttrDrv, function (subjectId) {
                            var contextAttr = attrs.contextAttr ? $interpolate(attrs.contextAttr)(scope) : undefined;
                            var prefix = attrs.prefix ? $interpolate(attrs.prefix)(scope) : undefined;
                            var suffix = attrs.suffix ? $interpolate(attrs.suffix)(scope) : undefined;

                            if (angular.isUndefined(subjectId)) {
                                return;
                            }

                            var attrsArray;
                            if (contextAttr) {
                                attrsArray = contextAttr.split(',');
                            } else {
                                attrsArray = [];
                                attrsArray.push('class');
                            }

                            var attrPrefixes = (prefix) ? prefix.split(',') : [];
                            var attrSuffixes = (suffix) ? suffix.split(',') : [];

                            var subjectEnumMap = SubjectEnum.getEnumMap();
                            var subjectNameToAdd = subjectEnumMap[subjectId];

                            angular.forEach(attrsArray, function (value, key) {
                                var attrVal = subjectNameToAdd;

                                if (attrPrefixes.length) {
                                    var prefix = attrPrefixes[key] || attrPrefixes[0];
                                    if(prefix !== ''){
                                        attrVal = prefix + '-' + attrVal;
                                    }
                                }

                                if (attrSuffixes.length) {
                                    var suffix = attrSuffixes[key] || attrSuffixes[0];
                                    if(suffix !== ''){
                                        attrVal += '-' + suffix;
                                    }
                                }

                                attrVal = attrVal.replace(/\s+/g, '');   // regex to clear spaces
                                value = value.replace(/\s+/g, '');   // regex to clear spaces

                                if (value === 'class') {
                                    if (!element.hasClass(attrVal)) {
                                        addedClassesArr.forEach(function (clsToRemove) {
                                            if(clsToRemove.indexOf(subjectNameToAdd) === -1){
                                                element.removeClass(clsToRemove);
                                            }
                                        });
                                        addedClassesArr.push(attrVal);
                                        element.addClass(attrVal);
                                    }
                                    } else {
                                        element.attr(value, attrVal);
                                    }
                                }
                                );

                        });
                    }
                }
            };
        }
    ]);
})(angular);

/**
 * attrs:
 *  subject-id-to-class-drv: expression from which subject id will be taken from.
 *  class-suffix: suffix of the added class
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToClassDrv', [
        'SubjectEnum',
        function (SubjectEnum) {
            return {
                priority: 1000,
                link: {
                    pre: function (scope, element, attrs) {
                        var watchDestroyer = scope.$watch(attrs.subjectIdToClassDrv,function(subjectId){
                            if(angular.isUndefined(subjectId)){
                                return;
                            }

                            watchDestroyer();
                            var classToAdd;

                            for(var prop in SubjectEnum){
                                if(SubjectEnum[prop].enum === subjectId){
                                    classToAdd = SubjectEnum[prop].val;
                                    if(attrs.classSuffix){
                                        classToAdd += attrs.classSuffix;
                                    }
                                    break;
                                }
                            }

                            element.addClass(classToAdd);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs -
 *      ng-model
 *      play
 *      type:
 *          1: timer with displayed time.
 *          2: timer with round progress bar
 *      config:
 *          stopOnZero
 *          countDown
 *          format: defaulted to mm:ss
 *          only for type 2:
 *              stroke
 *              bgcolor
 *              color
 *              radius
 *              max
 *              clockwise
 */
'use strict';

(function (angular) {

    angular.module('znk.infra.general').directive('timer', [
        '$interval', '$timeout',
        function ($interval, $timeout) {
            var timerTypes = {
                'REGULAR': 1,
                'ROUND_PROGRESSBAR': 2
            };

            return {
                scope: {
                    play: '=?',
                    typeGetter: '&?type',
                    configGetter: '&?config'
                },
                require: '?ngModel',
                replace: true,
                templateUrl: 'components/general/templates/timerDrv.html',
                link: function link(scope, element, attrs, ngModelCtrl) {
                    var domElement = element[0];

                    scope.ngModelCtrl = ngModelCtrl;

                    function padNum(num) {
                        if (('' + Math.abs(+num)).length < 2) {
                            return (num < 0 ? '-' : '') + '0' + Math.abs(+num);
                        } else {
                            return num;
                        }
                    }

                    function getDisplayedTime(currentTime, format) {
                        var totalSeconds = currentTime / 1000;
                        var seconds = Math.floor(totalSeconds % 60);
                        var minutes = Math.floor(Math.abs(totalSeconds) / 60) * (totalSeconds < 0 ? -1 : 1);
                        var paddedSeconds = padNum(seconds);
                        var paddedMinutes = padNum(minutes);

                        return format
                            .replace('tss', totalSeconds)
                            .replace('ss', paddedSeconds)
                            .replace('mm', paddedMinutes);

                    }

                    function updateTime(currentTime) {
                        if (scope.config.countDown && scope.config && scope.config.max) {
                            scope.timeElapsed = scope.config.max - currentTime;
                        } else {
                            scope.timeElapsed = currentTime;
                        }

                        var displayedTime = getDisplayedTime(currentTime, scope.config.format);
                        var timeDisplayDomElem;
                        switch (scope.type) {
                            case 1:
                                timeDisplayDomElem = domElement.querySelector('.timer-view');
                                break;
                            case 2:
                                timeDisplayDomElem = domElement.querySelector('.timer-display');
                                break;
                        }

                        if (timeDisplayDomElem) {
                            timeDisplayDomElem.innerText = displayedTime;
                        }
                    }

                    var intervalHandler;
                    var INTERVAL_TIME = 1000;

                    scope.type = scope.typeGetter() || 1;

                    var configDefaults = {
                        format: 'mm:ss',
                        stopOnZero: true,
                        stroke: 2
                    };
                    var config = (scope.configGetter && scope.configGetter()) || {};
                    scope.config = angular.extend(configDefaults, config);

                    switch (scope.type) {
                        case timerTypes.ROUND_PROGRESSBAR:
                        {
                            var roundProgressBarConfigDefults = {
                                stroke: 3,
                                bgcolor: '#0a9bad',
                                color: '#e1e1e1'
                            };
                            scope.config = angular.extend(roundProgressBarConfigDefults, scope.config);
                            scope.config.radius = scope.config.radius || Math.floor(element[0].offsetHeight / 2) || 45;
                            break;
                        }
                    }

                    function tick() {
                        var currentTime = ngModelCtrl.$viewValue;

                        if (angular.isUndefined(currentTime)) {
                            return;
                        }

                        currentTime += scope.config.countDown ? -INTERVAL_TIME : INTERVAL_TIME;

                        if (scope.config.stopOnZero && currentTime <= 0) {
                            scope.play = false;
                            currentTime = 0;
                        }

                        updateTime(currentTime);
                        ngModelCtrl.$setViewValue(currentTime);
                    }

                    ngModelCtrl.$render = function () {
                        var currentTime = ngModelCtrl.$viewValue;
                        if (angular.isUndefined(currentTime)) {
                            return;
                        }
                        $timeout(function(){
                            updateTime(currentTime);
                        });
                    };

                    scope.$watch('play', function (play) {
                        if (intervalHandler) {
                            $interval.cancel(intervalHandler);
                        }

                        if (play) {
                            intervalHandler = $interval(tick, INTERVAL_TIME, 0, false);
                        }
                    });

                    scope.$on('$destroy', function () {
                        $interval.cancel(intervalHandler);
                    });
                }
            };
        }]);

})(angular);

/**
 *
 *
 */
'use strict';
(function (angular) {
    angular.module('znk.infra.general').directive('videoCtrlDrv', [
        '$interpolate', '$timeout',
        function ($interpolate, $timeout) {
            var videoHeightType = {
                FIT: 'fit',
                COVER: 'cover'
            };
            return {
                transclude: 'element',
                priority: 1000,
                scope:{
                    onEnded: '&?',
                    onCanplay: '&?',
                    onPlay: '&?',
                    onVideoError: '&?',
                    videoErrorPoster: '@?',
                    actions: '=?',
                    heightToWidthRatioGetter: '&heightToWidthRatio',
                    videoHeight: '@'
                },
                link: function(scope, element, attrs, ctrl, transclude) {
                    var posterMaskElement;
                    var parentElem = element.parent();
                    var parentDomElem = parentElem[0];

                    if (attrs.customPoster) {
                        posterMaskElement = angular.element('<img src="' + attrs.customPoster + '" ' +
                            'style="position:absolute;top:0;right:0;bottom:0;left:0;">');
                        var parentStyle = window.getComputedStyle(parentDomElem);
                        if (parentStyle.position === 'static') {
                            parentDomElem.style.position = 'relative';
                        }
                        parentElem.append(posterMaskElement);
                    }

                    var posterImg;
                    if(attrs.znkPosterDrv){
                        posterImg = new Image();
                        posterImg.src = $interpolate(attrs.znkPosterDrv)(scope.$parent);
                    }

                    var elementsToRemoveErrorEventListeners = [];
                    function _addVideoSourceErrorHandler(videoDomElem){
                        var sourcesDomElement = videoDomElem.querySelectorAll('source');

                        var relevantSourceDomElement;

                        if(sourcesDomElement.length){
                            relevantSourceDomElement = sourcesDomElement[sourcesDomElement.length -1];
                        }else{
                            relevantSourceDomElement = videoDomElem;
                        }

                        function errorHandler(ev) {
                            $timeout(function(){
                                if(scope.onVideoError){
                                    scope.onVideoError(ev);
                                }

                                if(scope.videoErrorPoster){
                                    videoDomElem.removeAttribute("controls");
                                    videoDomElem.poster = scope.videoErrorPoster;
                                    videoDomElem.style.display = '';
                                }
                            });
                        }
                        relevantSourceDomElement.addEventListener('error', errorHandler);

                        elementsToRemoveErrorEventListeners.push({
                            domElement: relevantSourceDomElement,
                            handler: errorHandler
                        });
                    }

                    transclude(scope.$parent, function (clone) {

                        var videoElem = clone;
                        var videoDomElem = videoElem[0];

                        _addVideoSourceErrorHandler(videoDomElem);

                        videoDomElem.style.display = 'none';//preventing element resize flickering
                        parentElem.append(videoElem);

                        scope.actions = scope.actions || {};

                        scope.actions.replay = function () {
                            scope.actions.stop();
                            videoDomElem.play();
                        };

                        scope.actions.play = function(){
                            videoDomElem.play();
                        };

                        scope.actions.stop = function(){
                            videoDomElem.pause();
                            videoDomElem.currentTime = '0';
                        };

                        function endedHandler() {
                            scope.$apply(function () {
                                scope.onEnded();
                            });
                        }

                        function fitVideo(ratio){
                            var containerWidth, containerHeight;
                            var heightToWidthRatio = scope.heightToWidthRatioGetter() || ratio;
                            heightToWidthRatio = +heightToWidthRatio;
                            var heightSizeByWidth = parentDomElem.offsetWidth * heightToWidthRatio;
                            if (heightSizeByWidth <= parentDomElem.offsetHeight) {
                                containerWidth = parentDomElem.offsetWidth;
                                containerHeight = heightSizeByWidth;
                            } else {
                                containerHeight = parentDomElem.offsetHeight;
                                containerWidth = containerHeight / heightToWidthRatio;
                            }

                            containerWidth = Math.round(containerWidth);
                            containerHeight = Math.round(containerHeight);

                            videoDomElem.style.width = containerWidth + 'px';
                            //black line bug fix for iphone 4
                            videoDomElem.style.height = containerHeight + ((containerHeight % 2) ? 0 : 1) + 'px';
                        }

                        function coverVideo(ratio){
                            videoDomElem.style.position = 'relative';
                            var heightByWidth = parentDomElem.offsetWidth * ratio;
                            if(heightByWidth >= parentDomElem.offsetHeight){
                                videoDomElem.style.width =  parentDomElem.offsetWidth + 'px';
                                videoDomElem.style.height = heightByWidth + 'px';
                                videoDomElem.style.top = -((heightByWidth - parentDomElem.offsetHeight) / 2) + 'px';
                            }
                            else{
                                var widthByParentHeight = parentDomElem.offsetHeight * (1/ratio);
                                videoDomElem.style.width =  widthByParentHeight + 'px';
                                videoDomElem.style.height = parentDomElem.offsetHeight + 'px';
                                videoDomElem.style.left = -((widthByParentHeight - parentDomElem.offsetWidth) / 2) + 'px';
                            }
                        }

                        function canPlayHandler() {
                            if (posterMaskElement) {
                                posterMaskElement.remove();
                            }
                            scope.$apply(function () {
                                if(scope.onCanplay){
                                    scope.onCanplay();
                                }
                            });
                        }

                        function playHandler() {
                            $timeout(function() {
                                if(scope.onPlay) {
                                    scope.onPlay();
                                }
                            });
                        }

                        function setVideoDimensions(width,height){
                            if(setVideoDimensions.wasSet){
                                return;
                            }
                            setVideoDimensions.wasSet = true;

                            var videoHeight = height;
                            var videoWidth = width;
                            var ratio = videoHeight / videoWidth;

                            switch (scope.videoHeight) {
                                case videoHeightType.FIT:
                                    fitVideo(ratio);
                                    break;
                                case videoHeightType.COVER:
                                    coverVideo(ratio);
                                    break;
                            }

                            videoDomElem.style.display = '';

                        }

                        function loadedmetadata(){
                            /* jshint validthis: true */
                            setVideoDimensions(this.videoHeight,this.videoWidth);
                        }

                        videoElem.on('canplay', canPlayHandler);
                        videoElem.on('play', playHandler);
                        videoElem.on('ended', endedHandler);

                        if(posterImg){
                            posterImg.onload = function(){
                                setVideoDimensions(posterImg.width/2,posterImg.height/2);//All posters must be in twice size for retina
                            };
                        }

                        videoDomElem.addEventListener('loadedmetadata',loadedmetadata, false );

                        scope.$on('$destroy', function () {
                            videoElem.off('canplay', canPlayHandler);

                            videoElem.off('play', playHandler);

                            videoElem.off('ended', endedHandler);

                            videoDomElem.removeEventListener('loadedmetadata',loadedmetadata );

                            elementsToRemoveErrorEventListeners.forEach(function(removedElementData){
                                removedElementData.domElement.removeEventListener('error', removedElementData.handler);
                            });

                            if(posterImg){
                                posterImg.onload = null;
                            }

                            scope.loadStart = false;
                        });
                    });
                }
            };
        }
    ]);
})(angular);

angular.module('znk.infra.general').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/general/svg/clock-icon.svg",
    "<svg version=\"1.1\" class=\"clock-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     viewBox=\"0 0 183 208.5\">\n" +
    "    <style>\n" +
    "        .clock-icon-svg{\n" +
    "            width: 15px;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg g *{\n" +
    "            stroke: #757A83;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st0 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 10.5417;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st1 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 12.3467;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st2 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 11.8313;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st3 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 22.9416;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st4 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 14;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "        .clock-icon-svg .st5 {\n" +
    "            fill: none;\n" +
    "            stroke-width: 18;\n" +
    "            stroke-linejoin: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "\n" +
    "\n" +
    "    </style>\n" +
    "    <g>\n" +
    "        <circle class=\"st0\" cx=\"91.5\" cy=\"117\" r=\"86.2\"/>\n" +
    "        <line class=\"st1\" x1=\"92.1\" y1=\"121.5\" x2=\"92.1\" y2=\"61\"/>\n" +
    "        <line class=\"st2\" x1=\"92.1\" y1=\"121.5\" x2=\"131.4\" y2=\"121.5\"/>\n" +
    "        <line class=\"st3\" x1=\"78.2\" y1=\"18.2\" x2=\"104.9\" y2=\"18.2\"/>\n" +
    "        <line class=\"st4\" x1=\"61.4\" y1=\"7\" x2=\"121.7\" y2=\"7\"/>\n" +
    "        <line class=\"st5\" x1=\"156.1\" y1=\"43\" x2=\"171.3\" y2=\"61\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/general/templates/timerDrv.html",
    "<div ng-switch=\"type\" class=\"timer-drv\">\n" +
    "    <div ng-switch-when=\"1\" class=\"timer-type1\">\n" +
    "        <svg-icon class=\"icon-wrapper\" name=\"general-clock-icon\"></svg-icon>\n" +
    "        <div class=\"timer-view\"></div>\n" +
    "        <span class=\"timer-seconds-text\" translate=\"TIMER.SEC\"></span>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"2\" class=\"timer-type2\">\n" +
    "        <div class=\"timer-display-wrapper\">\n" +
    "            <div class=\"timer-display\"></div>\n" +
    "            <div class=\"seconds-text\" translate=\"TIMER.SECONDS\" ng-if=\"!config.hideSecondsText\"></div>\n" +
    "        </div>\n" +
    "        <div round-progress\n" +
    "             current=\"timeElapsed\"\n" +
    "             max=\"config.max\"\n" +
    "             color=\"{{config.color}}\"\n" +
    "             bgcolor=\"{{config.bgcolor}}\"\n" +
    "             stroke=\"{{config.stroke}}\"\n" +
    "             radius=\"{{config.radius}}\"\n" +
    "             clockwise=\"config.clockwise\">\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.hint', ['znk.infra.config']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.hint').provider('HintSrv', function () {
        var registeredHints = {};

        var _hintMap = {};

        this.registerHint = function (hintName, hintAction, determineWhetherToTriggerFnGetter) {
            if (!registeredHints[hintName]) {
                registeredHints[hintName] = {
                    name: hintName,
                    action: hintAction,
                    determineWhetherToTriggerGetter: determineWhetherToTriggerFnGetter
                };
            }
            _hintMap[hintName] = hintName;
        };

        this.$get = ["InfraConfigSrv", "$q", "$log", "$injector", "StorageSrv", function (InfraConfigSrv, $q, $log, $injector, StorageSrv) {
            'ngInject';

            var HintSrv = {};
            var hintPath = StorageSrv.variables.appUserSpacePath + '/hint';
            var defaultHints = {
                hintsStatus: {}
            };

            HintSrv.hintMap = _hintMap;

            HintSrv.triggerHint = function (hintName) {
                var hintData = registeredHints[hintName];
                if (!hintData) {
                    $log.error('HintSrv: the following hint is not registered ' + hintName);
                }
                return getHints().then(function (hints) {
                    var hintsStatus = hints.hintsStatus;
                    var hintLastVal = getHintLastValue(hintsStatus[hintName]);

                    var determineWhetherToTrigger;
                    if (hintData.determineWhetherToTriggerGetter) {
                        determineWhetherToTrigger = $injector.invoke(hintData.determineWhetherToTriggerGetter);
                    } else {
                        determineWhetherToTrigger = defaultDetermineWhetherToTriggerFn;
                    }

                    return $q.when(determineWhetherToTrigger(hintLastVal)).then(function (shouldBeTriggered) {
                        if (shouldBeTriggered) {
                            var hintAction = $injector.invoke(hintData.action);

                            return $q.when(hintAction(hintLastVal)).then(function (result) {
                                if (!hintsStatus[hintName]) {
                                    hintsStatus[hintName] = {
                                        name: hintName,
                                        history: []
                                    };
                                }

                                hintsStatus[hintName].history.push({
                                    value: angular.isUndefined(result) ? true : result,
                                    date: StorageSrv.variables.currTimeStamp
                                });

                                hints.hintsStatus = hintsStatus;
                                saveHints(hints);
                                return result;
                            });
                        }
                    });
                });
            };

                function getHints(){
                    return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                        return StudentStorageSrv.get(hintPath, defaultHints).then(function (hint) {
                            return hint;
                        });
                    });
                }

                function saveHints(newHint){
                    return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                        return StudentStorageSrv.set(hintPath, newHint);
                    });
                }

            function getHintLastValue(hintStatus) {
                return hintStatus && hintStatus.history && hintStatus.history.length && hintStatus.history[hintStatus.history.length - 1];
            }

            function defaultDetermineWhetherToTriggerFn(hintVal) {
                return angular.isUndefined(hintVal) || !hintVal.value;
            }

            return HintSrv;
        }];
    });
})(angular);

angular.module('znk.infra.hint').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';
    angular.module('znk.infra.mailSender', []);
})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.mailSender').service('MailSenderService', [
        '$log', 'ENV', '$http', 'UserProfileService', '$q',
        function ($log, ENV, $http, UserProfileService, $q) {
            var mailSenderService = {};
            var backendUrl = ENV.backendEndpoint + '/share/mail';
            var httpConfig = {
                headers: 'application/json'
            };

            mailSenderService.postMailRequest = function (mailObject) {
                return UserProfileService.getCurrUserId().then(function (userId) {
                    mailObject.uid = userId;
                    return $http.post(backendUrl, mailObject, httpConfig).then(
                        function (response) {
                            return {
                                data: response.data
                            };
                        }).catch(function (error) {
                        return $q.reject({
                            data: error.data
                        });
                    });
                });
            };

            return mailSenderService;
        }
    ]);
})(angular);


angular.module('znk.infra.mailSender').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.personalization', ['znk.infra.content']);
})(angular);

(function (angular) {
    'use strict';
    
    angular.module('znk.infra.personalization')
        .service('PersonalizationSrv',
            ["StorageRevSrv", "$log", "$q", function (StorageRevSrv, $log, $q) {
                'ngInject';

                var self = this;

                this.getPersonalizationData = function () {
                    var data = {
                        exerciseType: 'personalization'
                    };

                    return StorageRevSrv.getContent(data);
                };

                this.getExamOrder = function () {
                    return self.getPersonalizationData().then(function (personalizationData) {
                        var errorMsg = 'PersonalizationSrv getExamOrder: personalization.examOrder is not array or empty!';
                        if (!angular.isArray(personalizationData.examOrder) || personalizationData.examOrder.length === 0) {
                            $log.error(errorMsg);
                            return $q.reject(errorMsg);
                        }
                        return personalizationData.examOrder;
                    });
                };
            }]
        );
})(angular);


angular.module('znk.infra.personalization').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence', []);
})(angular);
/**
 * Created by Igor on 8/19/2015.
 */
/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence').directive('pngSequence', [
        '$timeout', 'ExpansionSrcSrv', '$window',
        function ($timeout, ExpansionSrcSrv, $window) {
            return {
                restrict: 'E',
                scope:{
                    onEnded: '&',
                    loop: '&',
                    speed:'&',
                    autoPlay: '&',
                    actions: '='
                },
                link: function (scope, element, attrs) {

                    var indexBound;

                    var requestID;

                    function buildComponent(){
                        var startIndex = +attrs.startIndex;
                        var endIndex = +attrs.endIndex;
                        var imageNum;
                        indexBound = endIndex - startIndex;
                        for(var i = startIndex; i < endIndex ; i++){
                            if(i < 100 || i < 10){
                                imageNum = i < 10 ? '00' + i :'0' + i;
                            }else{
                                imageNum = i;
                            }

                            var htmlTemplate = '<div ' +
                                    /* jshint validthis: true */
                                ' style="background-image: url(\'' + ExpansionSrcSrv.getExpansionSrc(attrs.imgData + imageNum + '.png') + '\'); background-size: cover; will-change: opacity; opacity:0; position: absolute; top:0; left:0;"></div>';

                            element.append(htmlTemplate);
                        }
                    }

                    function destroyCurrent(){
                        element.empty();
                    }

                    function PngAnimation() {
                        this.index = 0;
                        this.imagesDomElem = element[0].children;
                        this.lastTimestamp = false;
                    }


                    function animatePlay(timestamp) {
                        /* jshint validthis: true */
                        if(this.index === indexBound-1 && !scope.loop()){
                            $timeout(function(){
                                var children = element.children();
                                angular.element(children[children.length - 1]).css('display', 'none');
                                scope.onEnded();
                            });
                        }else{
                            if(this.lastTimestamp && (timestamp - this.lastTimestamp) < 40) {
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            } else {
                                this.imagesDomElem[this.index].style.opacity   =  0;
                                this.index = (this.index+1) % indexBound;
                                this.imagesDomElem[this.index].style.opacity   =  1;
                                this.lastTimestamp = timestamp;
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            }
                        }

                    }

                    function observeHandler(){
                        destroyCurrent();
                        if(attrs.imgData && angular.isDefined(attrs.startIndex)&& attrs.endIndex){
                            buildComponent();
                            if(scope.autoPlay()){
                                var animateInstance = new PngAnimation();
                                requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                            }
                        }
                    }

                    function watchFn(){
                        return attrs.imgData + '_' + attrs.startIndex + '_' + attrs.endIndex + '_' + attrs.rotate;
                    }
                    scope.$watch(watchFn,observeHandler);

                    scope.actions = scope.actions || {};
                    scope.actions.play = function(){
                        //added in order for the build function to be executed before the play
                        $timeout(function(){
                            var animateInstance = new PngAnimation();
                            requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                        },0,false);
                    };
                    scope.actions.reset = destroyCurrent;

                    scope.$on('$destroy',function(){
                        $window.cancelAnimationFrame(requestID);
                    });
                }
            };
        }
    ]);
})(angular);
angular.module('znk.infra.pngSequence').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.popUp', ['znk.infra.svgIcon', 'znk.infra.autofocus'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'popup-exclamation-mark': 'components/popUp/svg/exclamation-mark-icon.svg',
                    'popup-correct': 'components/popUp/svg/correct-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

'use strict';

(function () {
    angular.module('znk.infra.popUp').factory('PopUpSrv',[
        '$injector', '$q', '$rootScope', '$animate', '$document',
        function ($injector, $q, $rootScope, $animate, $document) {
            var PopUpSrv = {};

            var $body = angular.element($document[0].body);
            var popUpsPlaceHolderElement = angular.element('<div class="znk-popup"></div>');
            $body.append(popUpsPlaceHolderElement);

            var popupInstance,
                popupDefer;

            PopUpSrv.closePopup = function(reject,reason){
                if(!reason){
                    reason = 'closed';
                }
                popUpsPlaceHolderElement.empty();
                if (popupInstance.scope) {
                    popupInstance.scope.$destroy();
                }
                popupDefer[(reject ? 'reject' : 'resolve')](reason);
            };

            PopUpSrv.popup = function popup(wrapperCls,header,body,buttonsArr){
                //kill current popup if exists
                if(popupInstance){
                    PopUpSrv.closePopup();
                }
                var childScope = $rootScope.$new(true);
                childScope.d = {};

                popupDefer = $q.defer();
                popupInstance = {};
                popupInstance.promise = popupDefer.promise;

                var template =
                    '<div class="%wrapperCls%">' +
                        '<div class="znk-popup-wrapper">' +
                            '<div class="znk-popup-header">%header%</div>' +
                            '<div class="znk-popup-body">%body%</div>' +
                            '<div class="znk-popup-buttons">' +
                                '<div ng-repeat="button in ::d.buttons" class="button-wrapper">' +
                                    '<button class="btn" ' +
                                             'ng-click="d.btnClick(button)" ' +
                                             'ng-class="button.type" ' +
                                             'ng-autofocus="button.addAutoFocus" ' +
                                             'tabindex="0">' +
                                             '{{button.text}}' +
                                    '</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                wrapperCls = wrapperCls ? ' ' + wrapperCls : '';
                template = template.replace('%wrapperCls%',wrapperCls);

                header = header || '';
                template = template.replace('%header%',header);

                body = body || '';
                template = template.replace('%body%',body);

                if(angular.isDefined(buttonsArr) && !angular.isArray(buttonsArr)){
                    buttonsArr = [buttonsArr];
                }
                childScope.d.buttons = buttonsArr;
                childScope.d.btnClick = function(button){
                    if(button.hasOwnProperty('rejectVal')){
                        childScope.d.close(button.rejectVal,true);
                    }else{
                        childScope.d.close(button.resolveVal);
                    }
                };

                childScope.d.close = function(reason,reject){
                    var animationLeaveProm = $animate.leave($template);
                    animationLeaveProm.then(function(){
                        if(childScope){
                            childScope.$destroy();
                            childScope = null;
                        }
                        popupInstance = null;
                        if (angular.isDefined(popupDefer) && popupDefer !== null) {
                            var action = reject ? 'reject' : 'resolve';
                            reason = reason || 'close';
                            if(popupDefer[action]){
                                popupDefer[action](reason);
                            }
                            popupDefer = null;
                        }
                    });
                };

                var $template = angular.element(template);
                $animate.enter($template,popUpsPlaceHolderElement);
                //was added because injecting $compile dependency causing circular dependency
                var $compile = $injector.get('$compile');
                $compile(popUpsPlaceHolderElement.contents())(childScope);

                return popupInstance;
            };

            function basePopup(wrapperCls,headerIcon,title,content,btnArr){
                wrapperCls = wrapperCls ? wrapperCls + ' base-popup show-hide-animation' : 'base-popup show-hide-animation';

                headerIcon = headerIcon || '';
                var header = '<div class="icon-wrapper"><svg-icon name="%headerIcon%"></svg-icon></div>';
                header = header.replace('%headerIcon%',headerIcon);

                var body = '<div class="title responsive-title">%title%</div><div class="content">%content%</div>';
                title = title || '';
                body = body.replace('%title%',title);
                content = content || '';
                body = body.replace('%content%',content);

                return PopUpSrv.popup(wrapperCls,header,body,btnArr);
            }

            function BaseButton(text,type,resolveVal,rejectVal, addAutoFocus){
                var btn = {
                    text: text || '',
                    type: type || '',
                    addAutoFocus: addAutoFocus
                };

                if(rejectVal){
                    btn.rejectVal = rejectVal;
                }else{
                    btn.resolveVal = resolveVal;
                }

                return btn;
            }

            PopUpSrv.error = function error(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('error-popup','popup-exclamation-mark',title || 'OOOPS...',content,[btn]);
            };

            PopUpSrv.ErrorConfirmation = function error(title, content, acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle, true)
                ];
                return basePopup('error-popup','popup-exclamation-mark',title,content,buttons);
            };

            PopUpSrv.success = function success(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('success-popup','popup-correct',title || '',content,[btn]);
            };

            PopUpSrv.warning = function warning(title,content,acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle, true)
                ];
                return basePopup('warning-popup','popup-exclamation-mark',title,content,buttons);
            };

            PopUpSrv.isPopupOpen = function(){
                return !!popupInstance;
            };

            return PopUpSrv;
        }
    ]);
})();

angular.module('znk.infra.popUp').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/popUp/svg/correct-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"correct-icon-svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 188.5 129\">\n" +
    "<style type=\"text/css\">\n" +
    "	.correct-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"62\" x2=\"67\" y2=\"121.5\"/>\n" +
    "	<line class=\"st0\" x1=\"67\" y1=\"121.5\" x2=\"181\" y2=\"7.5\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/popUp/svg/exclamation-mark-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     id=\"Layer_1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-556.8 363.3 50.8 197.2\"\n" +
    "     style=\"enable-background:new -556.8 363.3 50.8 197.2;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.exclamation-mark-icon .st0 {\n" +
    "        fill: none;\n" +
    "        enable-background: new;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path d=\"M-505.9,401.6c-0.4,19.5-5.2,38.2-8.7,57.1c-2.8,15.5-4.7,31.2-6.7,46.8c-0.3,2.6-1.1,4-3.7,4.3c-1.5,0.2-2.9,0.6-4.4,0.7\n" +
    "		c-9.2,0.7-9.6,0.4-10.7-8.7c-3.4-29.6-8-58.9-14.6-87.9c-2.3-10.1-3.2-20.4-0.5-30.7c3.7-14.1,17.2-22.3,31.5-19.3\n" +
    "		c9.2,1.9,14.7,8.8,16.2,20.9C-506.7,390.3-506.4,396-505.9,401.6z\"/>\n" +
    "	<path d=\"M-528.9,525.7c10.9,0,16.8,5.3,16.9,15.2c0.1,11-9.3,19.7-21.4,19.6c-8.8,0-14.7-7-14.7-17.7\n" +
    "		C-548.2,530.9-542.4,525.7-528.9,525.7z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.presence', [
        'ngIdle',
        'znk.infra.auth'
    ])
        .config(["IdleProvider", "KeepaliveProvider", "ENV", function (IdleProvider, KeepaliveProvider, ENV) {
            // userIdleTime: how many sec until user is 'IDLE'
            // idleTimeout: how many sec after idle to stop track the user, 0: keep track
            // idleKeepalive: keepalive interval in sec

            IdleProvider.idle(ENV.userIdleTime || 30);
            IdleProvider.timeout(ENV.idleTimeout || 0);
            KeepaliveProvider.interval(ENV.idleKeepalive || 2);
        }])
        .run(["PresenceService", "Idle", function (PresenceService, Idle) {
                PresenceService.addCurrentUserListeners();
                Idle.watch();
            }]
        );
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.presence').provider('PresenceService', function () {

        var AuthSrvName;

        this.setAuthServiceName = function (authServiceName) {
            AuthSrvName = authServiceName;
        };

        this.$get = [
            '$log', '$injector', 'ENV', '$rootScope', 'StorageFirebaseAdapter',
            function ($log, $injector, ENV, $rootScope, StorageFirebaseAdapter) {
                var presenceService = {};
                var rootRef = new StorageFirebaseAdapter(ENV.fbDataEndPoint);
                var PRESENCE_PATH = 'presence/';

                presenceService.userStatus = {
                    'OFFLINE': 0,
                    'ONLINE': 1,
                    'IDLE': 2
                };

                presenceService.addCurrentUserListeners = function () {
                    var authData = getAuthData();
                    if (authData) {
                        var amOnline = rootRef.getRef('.info/connected');
                        var userRef = rootRef.getRef(PRESENCE_PATH + authData.uid);
                        amOnline.on('value', function (snapshot) {
                            if (snapshot.val()) {
                                userRef.onDisconnect().remove();
                                userRef.set(presenceService.userStatus.ONLINE);
                            }
                        });

                        $rootScope.$on('IdleStart', function() {
                            userRef.set(presenceService.userStatus.IDLE);
                        });

                        $rootScope.$on('IdleEnd', function() {
                            userRef.set(presenceService.userStatus.ONLINE);
                        });
                    }
                };

                presenceService.getCurrentUserStatus = function (userId) {
                    return rootRef.getRef(PRESENCE_PATH + userId).once('value').then(function(snapshot) {
                        return (snapshot.val()) || presenceService.userStatus.OFFLINE;
                    });
                };

                presenceService.startTrackUserPresence = function (userId, cb) {
                    var userRef = rootRef.getRef(PRESENCE_PATH + userId);
                    userRef.on('value', trackUserPresenceCB.bind(null, cb, userId));
                };

                presenceService.stopTrackUserPresence = function (userId) {
                    var userRef = rootRef.getRef(PRESENCE_PATH + userId);
                    userRef.off('value', trackUserPresenceCB);
                };

                function getAuthData() {
                    var authData;
                    var authService = $injector.get(AuthSrvName);
                    if (angular.isObject(authService)) {
                        authData =  authService.getAuth();
                    }
                    return authData;
                }

                function trackUserPresenceCB(cb, userId, snapshot) {
                    if (angular.isFunction(cb)) {
                        var status = presenceService.userStatus.OFFLINE;
                        if (snapshot && snapshot.val()){
                            status = snapshot.val();
                        }
                        cb(status, userId);
                    }
                }

                $rootScope.$on('auth:beforeLogout', function () {
                    var authData = getAuthData();
                    if (authData) {
                        var userRef = rootRef.getRef(PRESENCE_PATH + authData.uid);
                        userRef.remove();
                    }
                });

                return presenceService;
            }];
    });
})(angular);

angular.module('znk.infra.presence').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.scoring', ['znk.infra.storage', 'znk.infra.exerciseUtility']);
})(angular);

'use strict';
angular.module('znk.infra.scoring').provider('ScoringService', function() {
    'ngInject';

    var _scoringLimits;
    var _examScoreFnGetter;

    this.setScoringLimits = function(scoringLimits) {
        _scoringLimits = scoringLimits;
    };

    this.setExamScoreFnGetter = function(examScoreFnGetter) {
        _examScoreFnGetter = examScoreFnGetter;
    };

    this.$get = ['$q', 'ExamTypeEnum', 'StorageRevSrv', '$log', '$injector',
        function($q, ExamTypeEnum, StorageRevSrv, $log, $injector) {
        var scoringServiceObjApi = {};
        var keysMapConst = {
            crossTestScore: 'CrossTestScore',
            subScore: 'Subscore',
            miniTest: 'miniTest',
            test: 'test'
        };

        function _getScoreTableProm() {
            return StorageRevSrv.getContent({
                exerciseType: 'scoretable'
            }).then(function (scoreTable) {
                if (!scoreTable || !angular.isObject(scoreTable)) {
                    var errMsg = 'ScoringService _getScoreTableProm: no scoreTable or scoreTable is not an object! scoreTable:' + scoreTable;
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }
                return scoreTable;
            });
        }

        function _shouldAddToScore(question) {
            return (question.isAnsweredCorrectly && !question.afterAllowedTime);
        }

        function _getRawScore(questionsResults) {
            var score = 0;
            angular.forEach(questionsResults, function (question) {
                if (_shouldAddToScore(question)) {
                    score += 1;
                }
            });
            return score;
        }

        function _isTypeFull(typeId) {
            return ExamTypeEnum.FULL_TEST.enum === typeId;
        }

        function _getScoreTableKeyByTypeId(typeId) {
            return _isTypeFull(typeId) ? keysMapConst.test : keysMapConst.miniTest;
        }

        function _getDataFromTable(scoreTable, scoreTableKey, subjectId, rawScore) {
            var data = angular.copy(scoreTable);
            if (angular.isDefined(scoreTableKey)) {
                data = data[scoreTableKey];
            }
            if (angular.isDefined(subjectId)) {
                data = data[subjectId];
            }
            if (angular.isDefined(rawScore)) {
                data = data[rawScore];
            }
            return data;
        }

        function _getResultsFn(scoreTable, questionsResults, typeId, id) {
            var rawScore = _getRawScore(questionsResults);
            var scoreTableKey = _getScoreTableKeyByTypeId(typeId);
            return _getDataFromTable(scoreTable, scoreTableKey, id, rawScore);
        }

        function _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId) {
            var data = _getResultsFn(scoreTable, questionsResults, typeId, categoryId);
            return {
                testScore: data
            };
        }

        function _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId) {
            var data = _getResultsFn(scoreTable, questionsResults, typeId, subjectId);
            return {
                sectionScore: data
            };
        }

        // api

        scoringServiceObjApi.isTypeFull = function (typeId) {
            return ExamTypeEnum.FULL_TEST.enum === typeId;
        };

        scoringServiceObjApi.getTestScoreResult = function (questionsResults, typeId, categoryId) {
            return _getScoreTableProm().then(function (scoreTable) {
                return _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId);
            });
        };

        scoringServiceObjApi.getSectionScore = function (questionsResults, typeId, subjectId) {
            return _getScoreTableProm().then(function (scoreTable) {
                return _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId);
            });
        };

        scoringServiceObjApi.rawScoreToScore = function (subjectId, rawScore) {
            return _getScoreTableProm().then(function (scoreTable) {
                var roundedRawScore = Math.round(rawScore);
                return _getDataFromTable(scoreTable, keysMapConst.test, subjectId, roundedRawScore);
            });
        };

        scoringServiceObjApi.getExamScoreFn = function () {
            return $q.when($injector.invoke(_examScoreFnGetter));
        };

        scoringServiceObjApi.getScoringLimits = function() {
             return _scoringLimits;
        };

        return scoringServiceObjApi;
    }];

});


angular.module('znk.infra.scoring').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing', [
        'ngAnimate',
        'pascalprecht.translate',
        'znk.infra.user',
        'znk.infra.utility',
        'znk.infra.config',
        'znk.infra.enum',
        'znk.infra.svgIcon',
        'znk.infra.popUp',
        'znk.infra.general'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'screen-sharing-eye': 'components/screenSharing/svg/eye-icon.svg',
                'screen-sharing-close': 'components/screenSharing/svg/close-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').component('screenSharing', {
            templateUrl: 'components/screenSharing/directives/screenSharing/screenSharing.template.html',
            bindings: {
                userSharingState: '<',
                onClose: '&'
            },
            controller: ["UserScreenSharingStateEnum", "$log", "ScreenSharingUiSrv", function (UserScreenSharingStateEnum, $log, ScreenSharingUiSrv) {
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
            }]
        }
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').factory('ScreenSharingStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['PENDING_VIEWER', 1, 'pending viewer'],
                ['PENDING_SHARER', 2, 'pending sharer'],
                ['CONFIRMED', 3, 'confirmed'],
                ['ENDED', 4, 'ended']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').factory('UserScreenSharingStateEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['NONE', 1, 'none'],
                ['VIEWER', 2, 'viewer'],
                ['SHARER', 3, 'sharer']
            ]);
        }]
    );
})(angular);


(function(){
    'use strict';
    
    angular.module('znk.infra.screenSharing').run(
        ["ScreenSharingEventsSrv", function(ScreenSharingEventsSrv){
            'ngInject';

            ScreenSharingEventsSrv.activate();
        }]
    );
})();

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingDataGetterSrv',
        ["InfraConfigSrv", "$q", "ENV", "UserProfileService", function (InfraConfigSrv, $q, ENV, UserProfileService) {
            'ngInject';

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            this.getScreenSharingDataPath = function (guid) {
                var SCREEN_SHARING_ROOT_PATH = 'screenSharing';
                return SCREEN_SHARING_ROOT_PATH + '/' + guid;
            };

            this.getUserScreenSharingRequestsPath  = function (userData) {
                var appName = userData.isTeacher ? ENV.dashboardAppName : ENV.studentAppName;
                var USER_DATA_PATH = appName  + '/users/' + userData.uid;
                return USER_DATA_PATH + '/screenSharing';
            };

            this.getScreenSharingData = function (screenSharingGuid) {
                var screenSharingDataPath = this.getScreenSharingDataPath(screenSharingGuid);
                return _getStorage().then(function (storage) {
                    return storage.getAndBindToServer(screenSharingDataPath);
                });
            };

            this.getCurrUserScreenSharingRequests = function(){
                return UserProfileService.getCurrUserId().then(function(currUid){
                    return _getStorage().then(function(storage){
                        var currUserScreenSharingDataPath = ENV.firebaseAppScopeName + '/users/' + currUid + '/screenSharing';
                        return storage.getAndBindToServer(currUserScreenSharingDataPath);
                    });
                });
            };

            this.getCurrUserScreenSharingData = function () {
                var self = this;
                return this.getCurrUserScreenSharingRequests().then(function(currUserScreenSharingRequests){
                    var screenSharingDataPromMap = {};
                    angular.forEach(currUserScreenSharingRequests, function(isActive, guid){
                        if(isActive){
                            screenSharingDataPromMap[guid] = self.getScreenSharingData(guid);
                        }
                    });

                    return $q.all(screenSharingDataPromMap);
                });
            };
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').provider('ScreenSharingEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = ["UserProfileService", "InfraConfigSrv", "$q", "StorageSrv", "ENV", "ScreenSharingStatusEnum", "UserScreenSharingStateEnum", "ScreenSharingSrv", "$log", "ScreenSharingUiSrv", function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV, ScreenSharingStatusEnum, UserScreenSharingStateEnum, ScreenSharingSrv, $log, ScreenSharingUiSrv) {
            'ngInject';

            var ScreenSharingEventsSrv = {};

            function _listenToScreenSharingData(guid) {
                var screenSharingStatusPath = 'screenSharing/' + guid;

                function _cb(screenSharingData) {
                    if (!screenSharingData) {
                        return;
                    }

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        switch (screenSharingData.status) {
                            case ScreenSharingStatusEnum.PENDING_VIEWER.enum:
                                if (screenSharingData.viewerId !== currUid) {
                                    return;
                                }

                                ScreenSharingUiSrv.showScreenSharingConfirmationPopUp().then(function () {
                                    ScreenSharingSrv.confirmSharing(screenSharingData.guid);
                                }, function () {
                                    ScreenSharingSrv.endSharing(screenSharingData.guid);
                                });
                                break;
                            case ScreenSharingStatusEnum.PENDING_SHARER.enum:
                                if (screenSharingData.sharerId !== currUid) {
                                    return;
                                }

                                ScreenSharingSrv.confirmSharing(screenSharingData.guid);
                                break;
                            case ScreenSharingStatusEnum.CONFIRMED.enum:
                                var userScreenSharingState = UserScreenSharingStateEnum.NONE.enum;

                                if (screenSharingData.viewerId === currUid) {
                                    userScreenSharingState = UserScreenSharingStateEnum.VIEWER.enum;
                                }

                                if (screenSharingData.sharerId === currUid) {
                                    userScreenSharingState = UserScreenSharingStateEnum.SHARER.enum;
                                }

                                if (userScreenSharingState !== UserScreenSharingStateEnum.NONE.enum) {
                                    ScreenSharingSrv._userScreenSharingStateChanged(userScreenSharingState, screenSharingData);
                                }

                                break;
                            case ScreenSharingStatusEnum.ENDED.enum:
                                ScreenSharingSrv._userScreenSharingStateChanged(UserScreenSharingStateEnum.NONE.enum, screenSharingData);
                                break;
                            default:
                                $log.error('ScreenSharingEventsSrv: invalid status was received ' + screenSharingData.status);

                        }

                        ScreenSharingSrv._screenSharingDataChanged(screenSharingData);
                    });
                }

                InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                    globalStorage.onEvent(StorageSrv.EVENTS.VALUE, screenSharingStatusPath, _cb);
                });
            }

            function _startListening() {
                UserProfileService.getCurrUserId().then(function (currUid) {
                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                        var appName = ENV.firebaseAppScopeName;
                        var userScreenSharingPath = appName + '/users/' + currUid + '/screenSharing';
                        globalStorage.onEvent(StorageSrv.EVENTS.VALUE, userScreenSharingPath, function (userScreenSharingData) {
                            if (userScreenSharingData) {
                                angular.forEach(userScreenSharingData, function (isActive, guid) {
                                    if(isActive){
                                        _listenToScreenSharingData(guid);
                                    }
                                });
                            }
                        });
                    });
                });
            }

            ScreenSharingEventsSrv.activate = function () {
                if (isEnabled) {
                    _startListening();
                }
            };

            return ScreenSharingEventsSrv;
        }];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingSrv',
        ["UserProfileService", "InfraConfigSrv", "$q", "UtilitySrv", "ScreenSharingDataGetterSrv", "ScreenSharingStatusEnum", "ENV", "$log", "UserScreenSharingStateEnum", "ScreenSharingUiSrv", function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ScreenSharingDataGetterSrv, ScreenSharingStatusEnum, ENV, $log, UserScreenSharingStateEnum, ScreenSharingUiSrv) {
            'ngInject';

            var _this = this;

            var activeScreenSharingDataFromAdapter = null;
            var currUserScreenSharingState = UserScreenSharingStateEnum.NONE.enum;
            var registeredCbToActiveScreenSharingDataChanges = [];
            var registeredCbToCurrUserScreenSharingStateChange = [];

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            function _getScreenSharingInitStatusByInitiator(initiator) {
                var initiatorToInitStatusMap = {};
                initiatorToInitStatusMap[UserScreenSharingStateEnum.VIEWER.enum] = ScreenSharingStatusEnum.PENDING_SHARER.enum;
                initiatorToInitStatusMap[UserScreenSharingStateEnum.SHARER.enum] = ScreenSharingStatusEnum.PENDING_VIEWER.enum;

                return initiatorToInitStatusMap[initiator] || null;
            }

            function _isScreenSharingAlreadyInitiated(sharerId, viewerId) {
                return ScreenSharingDataGetterSrv.getCurrUserScreenSharingData().then(function (screenSharingDataMap) {
                    var isInitiated = false;
                    var screenSharingDataMapKeys = Object.keys(screenSharingDataMap);
                    for (var i in screenSharingDataMapKeys) {
                        var screenSharingDataKey = screenSharingDataMapKeys[i];
                        var screenSharingData = screenSharingDataMap[screenSharingDataKey];

                        var isEnded = screenSharingData.status === ScreenSharingStatusEnum.ENDED.enum;
                        if (isEnded) {
                            _this.endSharing(screenSharingData.guid);
                            continue;
                        }

                        isInitiated = screenSharingData.sharerId === sharerId && screenSharingData.viewerId === viewerId;
                        if (isInitiated) {
                            break;
                        }
                    }
                    return isInitiated;
                });
            }

            function _initiateScreenSharing(sharerData, viewerData, initiator) {
                var errMsg;

                if (angular.isUndefined(viewerData.isTeacher) || angular.isUndefined(sharerData.isTeacher)) {
                    errMsg = 'ScreenSharingSrv: isTeacher property was not provided!!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                if (currUserScreenSharingState !== UserScreenSharingStateEnum.NONE.enum) {
                    errMsg = 'ScreenSharingSrv: screen sharing is already active!!!';
                    $log.debug(errMsg);
                    return $q.reject(errMsg);
                }

                var initScreenSharingStatus = _getScreenSharingInitStatusByInitiator(initiator);
                if (!initScreenSharingStatus) {
                    errMsg = 'ScreenSharingSrv: initiator was not provided';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                return _isScreenSharingAlreadyInitiated(sharerData.uid, viewerData.uid).then(function (isInitiated) {
                    if (isInitiated) {
                        var errMsg = 'ScreenSharingSrv: screen sharing was already initiated';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }


                    var getDataPromMap = {};

                    getDataPromMap.currUserScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();

                    var newScreenSharingGuid = UtilitySrv.general.createGuid();
                    getDataPromMap.newScreenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(newScreenSharingGuid);

                    getDataPromMap.currUid = UserProfileService.getCurrUserId();

                    return $q.all(getDataPromMap).then(function (data) {
                        var dataToSave = {};

                        var viewerPath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(viewerData, newScreenSharingGuid);
                        var sharerPath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(sharerData, newScreenSharingGuid);
                        var newScreenSharingData = {
                            guid: newScreenSharingGuid,
                            sharerId: sharerData.uid,
                            viewerId: viewerData.uid,
                            status: initScreenSharingStatus,
                            viewerPath: viewerPath,
                            sharerPath: sharerPath
                        };
                        angular.extend(data.newScreenSharingData, newScreenSharingData);

                        dataToSave[data.newScreenSharingData.$$path] = data.newScreenSharingData;
                        //current user screen sharing requests object update
                        data.currUserScreenSharingRequests[newScreenSharingGuid] = true;
                        dataToSave[data.currUserScreenSharingRequests.$$path] = data.currUserScreenSharingRequests;
                        //other user screen sharing requests object update
                        var otherUserScreenSharingPath = viewerData.uid === data.currUid ? sharerPath : viewerPath;
                        var viewerScreenSharingDataGuidPath = otherUserScreenSharingPath + '/' + newScreenSharingGuid;
                        dataToSave[viewerScreenSharingDataGuidPath] = true;

                        return _getStorage().then(function (StudentStorage) {
                            return StudentStorage.update(dataToSave);
                        });
                    });

                });
            }

            function _cleanRegisteredCbToActiveScreenSharingData() {
                activeScreenSharingDataFromAdapter = null;
                registeredCbToActiveScreenSharingDataChanges = [];
            }

            function _invokeCurrUserScreenSharingStateChangedCb() {
                _invokeCbs(registeredCbToCurrUserScreenSharingStateChange, [currUserScreenSharingState]);
            }

            function _removeCbFromCbArr(cbArr, cb){
                return cbArr.filter(function (iterationCb) {
                    return iterationCb !== cb;
                });
            }

            function _invokeCbs(cbArr, args){
                cbArr.forEach(function(cb){
                    cb.apply(null, args);
                });
            }

            this.shareMyScreen = function (viewerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var sharerData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.SHARER.enum);
                });
            };

            this.viewOtherUserScreen = function (sharerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var viewerData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.VIEWER.enum);
                });
            };

            this.confirmSharing = function (screenSharingDataGuid) {
                if (currUserScreenSharingState !== UserScreenSharingStateEnum.NONE.enum) {
                    var errMsg = 'ScreenSharingSrv: screen sharing is already active!!!';
                    $log.debug(errMsg);
                    return $q.reject(errMsg);
                }

                return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function (screenSharingData) {
                    screenSharingData.status = ScreenSharingStatusEnum.CONFIRMED.enum;
                    return screenSharingData.$save();
                });
            };

            this.endSharing = function (screenSharingDataGuid) {
                var getDataPromMap = {};
                getDataPromMap.screenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();
                getDataPromMap.currUidScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();
                getDataPromMap.storage = _getStorage();
                return $q.all(getDataPromMap).then(function (data) {
                    var dataToSave = {};

                    data.screenSharingData.status = ScreenSharingStatusEnum.ENDED.enum;
                    dataToSave [data.screenSharingData.$$path] = data.screenSharingData;

                    data.currUidScreenSharingRequests[data.screenSharingData.guid] = false;
                    dataToSave[data.currUidScreenSharingRequests.$$path] = data.currUidScreenSharingRequests;

                    var otherUserScreenSharingRequestPath;
                    if (data.screenSharingData.viewerId !== data.currUid) {
                        otherUserScreenSharingRequestPath = data.screenSharingData.viewerPath;
                    } else {
                        otherUserScreenSharingRequestPath = data.screenSharingData.sharerPath;
                    }
                    otherUserScreenSharingRequestPath += '/' + data.screenSharingData.guid;
                    dataToSave[otherUserScreenSharingRequestPath] = false;

                    return data.storage.update(dataToSave);
                });
            };

            this.registerToActiveScreenSharingDataChanges = function (cb) {
                if (activeScreenSharingDataFromAdapter) {
                    registeredCbToActiveScreenSharingDataChanges.push(cb);
                    cb(activeScreenSharingDataFromAdapter);
                }
            };

            this.unregisterFromActiveScreenSharingDataChanges = function(cb){
                registeredCbToActiveScreenSharingDataChanges =_removeCbFromCbArr(registeredCbToActiveScreenSharingDataChanges, cb);
            };

            this.registerToCurrUserScreenSharingStateChanges = function (cb) {
                registeredCbToCurrUserScreenSharingStateChange.push(cb);
                cb(currUserScreenSharingState);
            };

            this.unregisterFromCurrUserScreenSharingStateChanges = function (cb) {
                registeredCbToCurrUserScreenSharingStateChange = _removeCbFromCbArr(registeredCbToCurrUserScreenSharingStateChange,cb);
            };

            this.getActiveScreenSharingData = function () {
                if (!activeScreenSharingDataFromAdapter) {
                    return $q.when(null);
                }

                var dataPromMap = {
                    screenSharingData: ScreenSharingDataGetterSrv.getScreenSharingData(activeScreenSharingDataFromAdapter.guid),
                    currUid: UserProfileService.getCurrUserId()
                };
                return $q.all(dataPromMap).then(function(dataMap){
                    var orig$saveFn = dataMap.screenSharingData.$save;
                    dataMap.screenSharingData.$save = function () {
                        dataMap.screenSharingData.updatedBy = dataMap.currUid;
                        return orig$saveFn.apply(dataMap.screenSharingData);
                    };

                    return dataMap.screenSharingData;
                });
            };

            this._userScreenSharingStateChanged = function (newUserScreenSharingState, screenSharingData) {
                if (!newUserScreenSharingState || (currUserScreenSharingState === newUserScreenSharingState)) {
                    return;
                }

                currUserScreenSharingState = newUserScreenSharingState;

                var isViewerState = newUserScreenSharingState === UserScreenSharingStateEnum.VIEWER.enum;
                var isSharerState = newUserScreenSharingState === UserScreenSharingStateEnum.SHARER.enum;
                if (isSharerState || isViewerState) {
                    activeScreenSharingDataFromAdapter = screenSharingData;
                    ScreenSharingUiSrv.activateScreenSharing(newUserScreenSharingState).then(function () {
                        _this.endSharing(screenSharingData.guid);
                    });
                } else {
                    _cleanRegisteredCbToActiveScreenSharingData();
                    ScreenSharingUiSrv.endScreenSharing();
                }

                _invokeCurrUserScreenSharingStateChangedCb(currUserScreenSharingState);
            };

            this._screenSharingDataChanged = function (newScreenSharingData) {
                if (!activeScreenSharingDataFromAdapter || activeScreenSharingDataFromAdapter.guid !== newScreenSharingData.guid) {
                    return;
                }

                activeScreenSharingDataFromAdapter = newScreenSharingData;
                _invokeCbs(registeredCbToActiveScreenSharingDataChanges, [activeScreenSharingDataFromAdapter]);
            };
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').provider('ScreenSharingUiSrv',function(){
        var screenSharingViewerTemplate;
        this.setScreenSharingViewerTemplate = function(template){
            screenSharingViewerTemplate = template;
        };

        this.$get = ["$rootScope", "$timeout", "$compile", "$animate", "PopUpSrv", "$translate", "$q", "$log", function ($rootScope, $timeout, $compile, $animate, PopUpSrv, $translate, $q, $log) {
            'ngInject';

            var childScope, screenSharingPhElement, readyProm;
            var ScreenSharingUiSrv = {};

            function _init() {
                var bodyElement = angular.element(document.body);

                screenSharingPhElement = angular.element('<div class="screen-sharing-ph"></div>');

                bodyElement.append(screenSharingPhElement);
            }

            function _endScreenSharing() {
                if(childScope){
                    childScope.$destroy();
                }


                if(screenSharingPhElement){
                    var hasContents = !!screenSharingPhElement.contents().length;
                    if(hasContents){
                        $animate.leave(screenSharingPhElement.contents());
                    }
                }
            }

            function _activateScreenSharing(userSharingState) {
                _endScreenSharing();

                var defer = $q.defer();

                readyProm.then(function(){
                    childScope = $rootScope.$new(true);
                    childScope.d = {
                        userSharingState: userSharingState,
                        onClose: function(){
                            defer.resolve('closed');
                        }
                    };

                    var screenSharingHtmlTemplate =
                        '<div class="show-hide-animation">' +
                        '<screen-sharing user-sharing-state="d.userSharingState" ' +
                        'on-close="d.onClose()">' +
                        '</screen-sharing>' +
                        '</div>';
                    var screenSharingElement = angular.element(screenSharingHtmlTemplate);
                    screenSharingPhElement.append(screenSharingElement);
                    $animate.enter(screenSharingElement[0], screenSharingPhElement[0]);
                    $compile(screenSharingElement)(childScope);
                });

                return defer.promise;
            }

            ScreenSharingUiSrv.activateScreenSharing = function (userSharingState) {
                return _activateScreenSharing(userSharingState);
            };

            ScreenSharingUiSrv.endScreenSharing = function () {
                _endScreenSharing();
            };

            ScreenSharingUiSrv.showScreenSharingConfirmationPopUp = function(){
                var translationsPromMap = {};
                translationsPromMap.title = $translate('SCREEN_SHARING.SHARE_SCREEN_REQUEST');
                translationsPromMap.content= $translate('SCREEN_SHARING.WANT_TO_SHARE',{
                    name: "Student/Teacher"
                });
                translationsPromMap.acceptBtnTitle = $translate('SCREEN_SHARING.REJECT');
                translationsPromMap.cancelBtnTitle = $translate('SCREEN_SHARING.ACCEPT');
                return $q.all(translationsPromMap).then(function(translations){
                    var popUpInstance = PopUpSrv.warning(
                        translations.title,
                        translations.content,
                        translations.acceptBtnTitle,
                        translations.cancelBtnTitle
                    );
                    return popUpInstance.promise.then(function(res){
                        return $q.reject(res);
                    },function(res){
                        return $q.resolve(res);
                    });
                },function(err){
                    $log.error('ScreenSharingUiSrv: translate failure' + err);
                    return $q.reject(err);
                });
            };

            ScreenSharingUiSrv.__getScreenSharingViewerTemplate = function(){
                if(!screenSharingViewerTemplate){
                    $log.error('ScreenSharingUiSrv: viewer template was not set');
                    return null;
                }

                return screenSharingViewerTemplate;
            };
            //was wrapped with timeout since angular will compile the dom after this service initialization
            readyProm = $timeout(function(){
                _init();
            });

            return ScreenSharingUiSrv;
        }];
    });
})(angular);

angular.module('znk.infra.screenSharing').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/screenSharing/directives/screenSharing/screenSharing.template.html",
    "<div ng-switch=\"$ctrl.userSharingState\"\n" +
    "     ng-class=\"$ctrl.sharingStateCls\">\n" +
    "    <div ng-switch-when=\"2\"\n" +
    "         class=\"viewer-state-container\">\n" +
    "        <div compile=\"$ctrl.viewerTemplate\"></div>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"3\"\n" +
    "         class=\"sharer-state-container\">\n" +
    "        <div class=\"square-side top\"></div>\n" +
    "        <div class=\"square-side right\"></div>\n" +
    "        <div class=\"square-side bottom\"></div>\n" +
    "        <div class=\"square-side left\"></div>\n" +
    "        <div class=\"eye-wrapper\">\n" +
    "            <svg-icon name=\"screen-sharing-eye\"></svg-icon>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"close-icon-wrapper\" ng-click=\"$ctrl.onClose()\">\n" +
    "        <svg-icon name=\"screen-sharing-close\"></svg-icon>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/screenSharing/svg/close-icon.svg",
    "<svg\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    class=\"screen-sharing-close\"\n" +
    "    viewBox=\"-596.6 492.3 133.2 133.5\">\n" +
    "    <style>\n" +
    "        .screen-sharing-close{\n" +
    "            width: 13px;\n" +
    "            stroke: white;\n" +
    "            stroke-width: 10px;\n" +
    "        }\n" +
    "    </style>\n" +
    "<path class=\"st0\"/>\n" +
    "<g>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/screenSharing/svg/eye-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 190.3 90.3\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     class=\"screen-sharing-eye\">\n" +
    "    <style>\n" +
    "        .screen-sharing-eye{\n" +
    "            width: 25px;\n" +
    "            fill: white;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g>\n" +
    "	<g>\n" +
    "		<path d=\"M190.3,45.3c-10.1,10.2-21.1,18.6-33.1,25.8c-21.1,12.7-43.5,20.5-68.6,19c-13.8-0.9-26.8-4.7-39.3-10.4\n" +
    "			c-17.4-8-32.9-18.8-46.8-31.9C1.7,47,1,46.1,0,45c10-10.1,21.1-18.6,33.1-25.8c21.2-12.8,43.9-20.7,69.1-19\n" +
    "			c13.8,0.9,26.8,4.8,39.2,10.6c16.8,7.7,31.7,18.1,45.3,30.7C187.8,42.6,188.9,43.8,190.3,45.3z M95.1,12.7\n" +
    "			c-18.2,0-32.4,14.4-32.4,32.7c0.1,17.9,14.4,32.1,32.5,32.1c17.9,0,32.4-14.4,32.6-32.2C128,27.4,113.2,12.7,95.1,12.7z\"/>\n" +
    "		<path d=\"M101.2,23.5c-2.2,4.7-2.4,9,1.6,12.5c4.2,3.6,8.5,2.9,12.6-0.4c5,8.6,2.7,20.1-5.5,27.1c-8.5,7.3-21,7.3-29.7,0\n" +
    "			c-8.4-7-10.4-19.4-5-29C80.2,24.9,92.5,19.7,101.2,23.5z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll', []);
})(angular);
/**
 * attrs:
 *      actions:
 *          animate: function (scrollTo,animationDuration,transition)
 *      scrollOnMouseWheel: whether to scroll on mouse wheel default false
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll').directive('znkScroll', [
        '$log', '$window', '$timeout', '$interpolate',
        function ($log, $window, $timeout, $interpolate) {
            function setElementTranslateX(element,val,isOffset,minVal,maxVal){
                var domElement = angular.isArray(element) ? element[0] : element;
                var newTranslateX = val;
                if(isOffset){
                    var currTransformVal = domElement.style.transform;
                    var currXMatchRegex = currTransformVal.match(/translateX\((.*)px\)/);
                    var currX;
                    if(!angular.isArray(currXMatchRegex ) || currXMatchRegex.length < 2){
                        //$log.debug('failed to math transform value');
                        currX = 0;
                    }else{
                        currX = +currXMatchRegex[1];
                    }
                    newTranslateX += currX;
                }
                minVal = angular.isUndefined(minVal) ? -Infinity : minVal;
                maxVal = angular.isUndefined(maxVal) ? Infinity : maxVal;

                newTranslateX = Math.max(newTranslateX,minVal);
                newTranslateX = Math.min(newTranslateX,maxVal);

                var newTransformValue = 'translateX(' + newTranslateX + 'px)';
                setCssPropery(domElement,'transform',newTransformValue);
            }

            function setCssPropery(element,prop,value){
                var domElement = angular.isArray(element) ? element[0] : element;
                if(value === null){
                    domElement.style[prop] = '';
                }else{
                    domElement.style[prop] = value;
                }
            }

            function getElementWidth(element){
                var domElement = angular.isArray(element) ? element[0] : element;

                var domElementStyle  = $window.getComputedStyle(domElement);
                var domElementMarginRight = +domElementStyle.marginRight.replace('px','');
                var domElementMarginLeft = +domElementStyle.marginLeft.replace('px','');
                return domElement .offsetWidth + domElementMarginRight + domElementMarginLeft;
            }

            return {
                restrict: 'E',
                compile: function(element){
                    var domElement = element[0];

                    var currMousePoint;
                    var containerWidth;
                    var childWidth;

                    var WHEEL_MOUSE_EVENT = 'wheel';

                    function mouseMoveEventHandler(evt){
                        //$log.debug('mouse move',evt.pageX);
                        var xOffset = evt.pageX - currMousePoint.x;

                        currMousePoint.x = evt.pageX;
                        currMousePoint.y = evt.pageY;
                        moveScroll(xOffset,containerWidth,childWidth);
                        //stop event bubbling
                        evt.preventDefault();
                        evt.stopPropagation();
                        return false;
                    }
                    function mouseUpEventHandler(){
                        //$log.debug('mouse up',evt.pageX);
                        document.removeEventListener('mousemove',mouseMoveEventHandler);
                        document.removeEventListener('mouseup',mouseUpEventHandler);
                        containerWidth = null;
                        childWidth = null;
                        currMousePoint = null;
                    }
                    function mouseDownHandler(evt){
                        //$log.debug('mouse down',evt.pageX);

                        var child = domElement.children[0];
                        if(!child){
                            return;
                        }

                        containerWidth = domElement.offsetWidth;
                        childWidth = getElementWidth(child);

                        currMousePoint = {
                            x: evt.pageX,
                            y: evt.pageY
                        };


                        document.addEventListener('mousemove',mouseMoveEventHandler);

                        document.addEventListener('mouseup',mouseUpEventHandler);
                    }
                    domElement.addEventListener('mousedown',mouseDownHandler);

                    function moveScroll(xOffset, containerWidth, childWidth/*,yOffset*/){
                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;
                        var child = domElement.children[0];

                        if(!child.style.transform){
                            setElementTranslateX(child,0,false,false,minTranslateX,maxTranslateX);
                        }

                        setElementTranslateX(child,xOffset,true,minTranslateX,maxTranslateX);
                    }

                    function setScrollPos(scrollX){
                        var containerWidth = domElement.offsetWidth;
                        var child = domElement.children[0];
                        var childWidth = getElementWidth(child);
                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;
                        setElementTranslateX(child,scrollX,false,minTranslateX,maxTranslateX);
                    }

                    return {
                        pre: function(scope,element,attrs){
                            var child = domElement.children[0];
                            if(child){
                                setElementTranslateX(child,0);
                            }

                            var scrollOnMouseWheel = $interpolate(attrs.scrollOnMouseWheel || '')(scope) !== 'false';
                            var containerWidth,childWidth;
                            function mouseWheelEventHandler(evt){
                                //$log.debug('mouse wheel event',evt);
                                var offset = -evt.deltaY * 4;// firefox is really slow....
                                moveScroll(offset, containerWidth, childWidth);
                            }
                            function mouseEnterEventHandler(){
                                //$log.debug('mouse enter');
                                containerWidth = domElement.offsetWidth;
                                childWidth = getElementWidth(domElement.children[0]);
                                domElement.addEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
                            }
                            function mouseUpEventHandler(){
                                //$log.debug('mouse leave');
                                domElement.removeEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
                            }
                            if(scrollOnMouseWheel){
                                domElement.addEventListener('mouseenter',mouseEnterEventHandler);
                                domElement.addEventListener('mouseleave',mouseUpEventHandler);
                            }

                            if(attrs.actions){
                                if(angular.isUndefined(scope.$eval(attrs.actions))){
                                    scope.$eval(attrs.actions + '={}');
                                }
                                var actions = scope.$eval(attrs.actions);

                                actions.animate = function(scrollTo,transitionDuration,transitionTimingFunction){
                                    if(transitionDuration && transitionTimingFunction){
                                        var transitionPropVal = 'transform ' + transitionDuration + 'ms ' + transitionTimingFunction;
                                        setCssPropery(child,'transition',transitionPropVal);
                                    }
                                    setScrollPos(scrollTo);
                                    //@todo(igor) may be out of sync
                                    $timeout(function(){
                                        setCssPropery(child,'transition',null);
                                    },transitionDuration,false);
                                };
                            }

                            scope.$on('$destroy',function(){
                                document.removeEventListener('mousemove',mouseMoveEventHandler);
                                document.removeEventListener('mouseup',mouseUpEventHandler);
                                domElement.removeEventListener('mousedown',mouseDownHandler);
                                domElement.removeEventListener('mouseenter',mouseEnterEventHandler);
                                domElement.removeEventListener('mouseleave',mouseUpEventHandler);
                                domElement.removeEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
                            });
                        }
                    };

                }
            };
        }
    ]);

})(angular);


angular.module('znk.infra.scroll').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.sharedScss', []);
})(angular);

angular.module('znk.infra.sharedScss').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats', [
            'znk.infra.enum',
            'znk.infra.znkExercise',
            'znk.infra.utility',
            'znk.infra.contentGetters'
        ])
        .run([
            'StatsEventsHandlerSrv',
            function (StatsEventsHandlerSrv) {
                StatsEventsHandlerSrv.init();
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').factory('StatsEventsHandlerSrv', [
        'exerciseEventsConst', 'StatsSrv', 'ExerciseTypeEnum', '$log', 'UtilitySrv',
        function (exerciseEventsConst, StatsSrv, ExerciseTypeEnum, $log, UtilitySrv) {
            var StatsEventsHandlerSrv = {};

            StatsEventsHandlerSrv.addNewExerciseResult = function(exerciseType, exercise, results){
                return StatsSrv.isExerciseStatsRecorded(exerciseType, exercise.id).then(function (isRecorded) {
                    if (isRecorded) {
                        return;
                    }

                    var newStats = {};

                    var questionsMap = UtilitySrv.array.convertToMap(exercise.questions);
                    results.questionResults.forEach(function (result) {
                        var question = questionsMap[result.questionId];
                        var categoryId = question.categoryId;

                        if (isNaN(+categoryId) || categoryId === null) {
                            $log.error('StatsEventsHandlerSrv: _eventHandler: bad category id for the following question: ', question.id, categoryId);
                            return;
                        }

                        if (!newStats[categoryId]) {
                            newStats[categoryId] = new StatsSrv.BaseStats();
                        }
                        var newStat = newStats[categoryId];

                        newStat.totalQuestions++;

                        newStat.totalTime += result.timeSpent || 0;

                        if (angular.isUndefined(result.userAnswer)) {
                            newStat.unanswered++;
                        } else if (result.isAnsweredCorrectly) {
                            newStat.correct++;
                        } else {
                            newStat.wrong++;
                        }
                    });

                    return StatsSrv.updateStats(newStats, exerciseType, exercise.id);
                });
            };

            //added in order to load the service
            StatsEventsHandlerSrv.init = angular.noop;

            return StatsEventsHandlerSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').service('StatsQuerySrv', [
        'StatsSrv', '$q',
        function (StatsSrv, $q) {
            var StatsQuerySrv = {};

            function _getCategoryWeakness(category) {
                if (!category.totalQuestions) {
                    return -Infinity;
                }
                return (category.totalQuestions - category.correct) / (category.totalQuestions);
            }

            function WeaknessAccumulator() {
                var currWeakestCategory = {};

                function _isMostWeakSoFar(categoryWeakness) {
                    return angular.isUndefined(currWeakestCategory.weakness) || currWeakestCategory.weakness < categoryWeakness;
                }

                this.proccessCategory = function (categoryStats) {
                    var categoryWeakness = _getCategoryWeakness(categoryStats);
                    if (_isMostWeakSoFar(categoryWeakness)) {
                        currWeakestCategory.weakness = categoryWeakness;
                        currWeakestCategory.category = categoryStats;
                    }
                };

                this.getWeakestCategory = function () {
                    return currWeakestCategory.category;
                };
            }

            StatsQuerySrv.getWeakestCategoryInLevel = function (level, optionalIds, parentId) {
                function _isOptional(categoryStats) {
                    if (!optionalIds.length && angular.isUndefined(parentId)) {
                        return true;
                    }

                    var id = categoryStats.id;
                    if (optionalIds.length && (optionalIds.indexOf(id) === -1)) {
                        return false;
                    }

                    var parentsIds = categoryStats.parentsIds;
                    if (angular.isDefined(parentId) && parentsIds.indexOf(parentId) === -1) {
                        return false;
                    }

                    return true;
                }

                if (!angular.isArray(optionalIds)) {
                    optionalIds = [];
                }

                return StatsSrv.getLevelStats(level).then(function (levelStats) {
                    var iteratedObjProm = $q.when();
                    var iteratedObj = {};

                    if (optionalIds.length) {
                        var allProm = [];
                        optionalIds.forEach(function (categoryId) {
                            var categoryKey = StatsSrv.getCategoryKey(categoryId);

                            if (levelStats && levelStats[categoryKey]) {
                                iteratedObj[categoryKey] = levelStats[categoryKey];
                            } else {
                                var prom = StatsSrv.getAncestorIds(categoryId).then(function (parentsIds) {
                                    iteratedObj[categoryKey] = new StatsSrv.BaseStats(categoryId, true);
                                    iteratedObj[categoryKey].parentsIds = parentsIds;
                                });
                                allProm.push(prom);
                            }
                        });
                        iteratedObjProm = $q.all(allProm);
                    } else {
                        iteratedObjProm = $q.when();
                        iteratedObj = levelStats;
                    }

                    return iteratedObjProm.then(function () {
                        var weaknessAccumulator = new WeaknessAccumulator();
                        angular.forEach(iteratedObj, function (categoryStats) {
                            if (_isOptional(categoryStats)) {
                                weaknessAccumulator.proccessCategory(categoryStats);
                            }
                        });

                        return weaknessAccumulator.getWeakestCategory();
                    });

                });
            };

            return StatsQuerySrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').service('StatsSrv',
        ["InfraConfigSrv", "$q", "SubjectEnum", "$log", "$injector", "StorageSrv", "CategoryService", function (InfraConfigSrv, $q, SubjectEnum, $log, $injector, StorageSrv, CategoryService) {
            'ngInject';

            var STATS_PATH = StorageSrv.variables.appUserSpacePath + '/stats';

            var StatsSrv = {};

            var _getCategoryLookup = function () {
                return CategoryService.getCategoryMap().then(function (categoryMap) {
                    return categoryMap;
                });
            };

            function BaseStats(id, addInitOffset) {
                if (angular.isDefined(id)) {
                    this.id = +id;
                }

                var totalQuestions;
                var correct;
                var unanswered;
                var wrong;
                var totalTime;


                if (addInitOffset) {
                    totalQuestions = 3;
                    correct = 1;
                    unanswered = 0;
                    wrong = 2;
                    totalTime = 0;
                } else {
                    totalQuestions = 0;
                    correct = 0;
                    unanswered = 0;
                    wrong = 0;
                    totalTime = 0;
                }

                this.totalQuestions = totalQuestions;
                this.correct = correct;
                this.unanswered = unanswered;
                this.wrong = wrong;
                this.totalTime = totalTime;
            }

            function getStats() {
                var defaults = {
                    processedExercises: {}
                };
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(STATS_PATH, defaults);
                });
            }

            function setStats(newStats) {
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.set(STATS_PATH, newStats);
                });
            }

            function _baseStatsUpdater(currStat, newStat) {
                currStat.totalQuestions += newStat.totalQuestions;
                currStat.correct += newStat.correct;
                currStat.unanswered += newStat.unanswered;
                currStat.wrong += newStat.wrong;
                currStat.totalTime += newStat.totalTime;
            }

            function _getParentCategoryId(lookUp, categoryId) {
                return lookUp[categoryId] ? lookUp[categoryId].parentId : lookUp[categoryId];
            }

            function _getProcessedExerciseKey(exerciseType, exerciseId) {
                return exerciseType + '_' + exerciseId;
            }

            StatsSrv.getLevelKey = function (level) {
                return 'level' + level + 'Categories';
            };

            StatsSrv.getCategoryKey = function (categoryId) {
                return 'id_' + categoryId;
            };

            StatsSrv.getAncestorIds = function (categoryId) {
                var parentIds = [];
                return _getCategoryLookup().then(function (categoryLookUp) {
                    var categoryIdToAdd = _getParentCategoryId(categoryLookUp, +categoryId);
                    while (categoryIdToAdd !== null && angular.isDefined(categoryIdToAdd)) {
                        parentIds.push(categoryIdToAdd);
                        categoryIdToAdd = _getParentCategoryId(categoryLookUp, categoryIdToAdd);
                    }
                    return parentIds;
                });
            };

            StatsSrv.getStats = getStats;

            StatsSrv.getLevelStats = function (level) {
                var levelKey = StatsSrv.getLevelKey(level);
                return getStats().then(function (statsData) {
                    return statsData[levelKey];
                });
            };

            StatsSrv.BaseStats = BaseStats;

            StatsSrv.updateStats = function (newStats, exerciseType, exerciseId) {
                var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                return getStats().then(function (stats) {
                    var isExerciseRecorded = stats.processedExercises[processedExerciseKey];
                    if (isExerciseRecorded) {
                        return;
                    }

                    var allProm = [];
                    angular.forEach(newStats, function (newStat, processedCategoryId) {
                        var prom = StatsSrv.getAncestorIds(processedCategoryId).then(function (categoriesToUpdate) {
                            categoriesToUpdate.unshift(+processedCategoryId);
                            var deepestLevel = categoriesToUpdate.length;
                            categoriesToUpdate.forEach(function (categoryId, index) {
                                var level = deepestLevel - index;
                                var levelKey = StatsSrv.getLevelKey(level);
                                var levelStats = stats[levelKey];
                                if (!levelStats) {
                                    levelStats = {};

                                    stats[levelKey] = levelStats;
                                }

                                var categoryKey = StatsSrv.getCategoryKey(categoryId);
                                var categoryStats = levelStats[categoryKey];
                                if (!categoryStats) {
                                    categoryStats = new BaseStats(categoryId);

                                    var parentsIds = categoriesToUpdate.slice(index + 1);
                                    if (parentsIds.length) {
                                        categoryStats.parentsIds = parentsIds;
                                    }

                                    levelStats[categoryKey] = categoryStats;
                                }

                                _baseStatsUpdater(categoryStats, newStat);
                            });
                        });
                        allProm.push(prom);
                    });
                    return $q.all(allProm).then(function () {
                        stats.processedExercises[processedExerciseKey] = true;
                        return setStats(stats);
                    });
                });

            };

            StatsSrv.isExerciseStatsRecorded = function (exerciseType, exerciseId) {
                return StatsSrv.getStats().then(function (stats) {
                    var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                    return !!stats.processedExercises[processedExerciseKey];
                });
            };

            return StatsSrv;
        }]);
})(angular);

angular.module('znk.infra.stats').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').service('InvitationStorageSrv',
        ["StorageFirebaseAdapter", "ENV", "StorageSrv", "AuthService", function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
        'ngInjedct';

            var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint + 'invitations');
            var config = {
                variables: {
                    uid: function () {
                        var auth = AuthService.getAuth();
                        return auth && auth.uid;
                    }
                },
                cacheRules: [/.*/]
            };

            var storage = new StorageSrv(fbAdapter, config);

            storage.getInvitationObject = function (inviteId) {
                return storage.get(inviteId);
            };

            return storage;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').service('StorageFirebaseAdapter',
        ["$log", "$q", "StorageSrv", "ENV", "$timeout", function ($log, $q, StorageSrv, ENV, $timeout) {
            'ngInject';

            function processValue(value) {
                if (value === StorageSrv.variables.currTimeStamp) {
                    return Firebase.ServerValue.TIMESTAMP;
                }
                return value;
            }

            function processValuesToSet(source) {
                if (angular.isArray(source)) {
                    source.forEach(function (item, index) {
                        if (angular.isUndefined(item)) {
                            source[index] = null;
                        }
                        processValuesToSet(item);
                    });
                }

                if (angular.isObject(source)) {
                    var keys = Object.keys(source);
                    keys.forEach(function (key) {
                        var value = source[key];

                        if (key[0] === '$' || angular.isUndefined(value) || (angular.isArray(value) && !value.length) || (value !== value)) { //value !== value return true if it equals to NaN
                            if (key !== '$save') {
                                $log.debug('storageFirebaseAdapter: illegal property was deleted before save ' + key);
                            }
                            delete source[key];
                            return;
                        }

                        if (angular.isString(value)) {
                            source[key] = processValue(value);
                        }

                        processValuesToSet(value);
                    });
                }
            }

            function StorageFirebaseAdapter(endPoint) {
                this.__refMap = {};

                this.__refMap.rootRef = new Firebase(endPoint, ENV.firebaseAppScopeName);

                this.__registeredEvents = {};
            }

            var storageFirebaseAdapterPrototype = {
                getRef: function (relativePath) {
                    if (relativePath === '' || angular.isUndefined(relativePath) || angular.isUndefined(relativePath) || relativePath === null) {
                        return this.__refMap.rootRef;
                    }

                    if (!this.__refMap[relativePath]) {
                        this.__refMap[relativePath] = this.__refMap.rootRef.child(relativePath);
                    }

                    return this.__refMap[relativePath];
                },
                get: function (relativePath) {
                    var defer = $q.defer();

                    var ref = this.getRef(relativePath);
                    ref.once('value', function (dataSnapshot) {
                        defer.resolve(dataSnapshot.val());
                    }, function (err) {
                        $log.error('storageFirebaseAdapter: failed to retrieve data for the following path ' + relativePath + ' ' + err);
                        defer.reject(err);
                    });

                    return defer.promise;
                },
                update: function (relativePathOrObject, newValue) {
                    var pathsToUpdate = {};

                    if (!angular.isObject(relativePathOrObject)) {
                        pathsToUpdate[relativePathOrObject] = newValue;
                    } else {
                        pathsToUpdate = relativePathOrObject;
                    }

                    var pathsToUpdateCopy = angular.copy(pathsToUpdate);

                    processValuesToSet(pathsToUpdateCopy);

                    var defer = $q.defer();

                    this.__refMap.rootRef.update(pathsToUpdateCopy, function (err) {
                        if (err) {
                            if (angular.isObject(pathsToUpdateCopy)) {
                                $log.error('storageFirebaseAdapter: failed to set data for the following path ' + JSON.stringify(pathsToUpdateCopy) + ' ' + err);
                            } else {
                                $log.error('storageFirebaseAdapter: failed to set data for the following path ' + pathsToUpdateCopy + ' ' + err);
                            }
                            return defer.reject(err);
                        }
                        defer.resolve(angular.isString(relativePathOrObject) ? newValue : relativePathOrObject);
                    });

                    return defer.promise;
                },
                set: function (relativePath, newValue) {
                    var newValueCopy = angular.copy(newValue);

                    processValuesToSet(newValueCopy);

                    var ref = this.getRef(relativePath);
                    return ref.set(newValueCopy);
                },
                onEvent: function (type, path, cb) {
                    var self = this;

                    if (!this.__registeredEvents[type]) {
                        this.__registeredEvents[type] = {};
                    }

                    if (!this.__registeredEvents[type][path]) {
                        this.__registeredEvents[type][path] = [];

                        var ref = this.getRef(path);
                        ref.on(type, function (snapshot) {
                            self.__registeredEvents[type][path].firstOnWasInvoked = true;
                            var newVal = snapshot.val();
                            var key = snapshot.key();
                            self.__invokeEventCb(type, path, [newVal, key]);
                        });
                    } else {
                        if (self.__registeredEvents[type][path].firstOnWasInvoked) {
                            self.get(path).then(function (newVal) {
                                cb(newVal);
                            });
                        }
                    }

                    var evtCbArr = this.__registeredEvents[type][path];
                    evtCbArr.push(cb);
                },
                __invokeEventCb: function (type, path, argArr) {
                    if (!this.__registeredEvents[type] || !this.__registeredEvents[type][path]) {
                        return;
                    }

                    var eventCbArr = this.__registeredEvents[type][path];
                    //fb event so we out of angular
                    $timeout(function () {
                        eventCbArr.forEach(function (cb) {
                            cb.apply(null, argArr);
                        });
                    });
                },
                offEvent: function (type, path, cb) {
                    if (!this.__registeredEvents[type] || !this.__registeredEvents[type][path]) {
                        return;
                    }

                    var _firstOnWasInvoked = this.__registeredEvents[type][path].firstOnWasInvoked;

                    if (angular.isUndefined(cb)) {
                        this.__registeredEvents[type][path] = [];
                        this.__registeredEvents[type][path].firstOnWasInvoked = _firstOnWasInvoked;
                        return;
                    }

                    var eventCbArr = this.__registeredEvents[type][path];
                    var newEventCbArr = [];
                    eventCbArr.forEach(function (cb) {
                        if (cb !== cb) {
                            newEventCbArr.push(cb);
                        }
                    });
                    this.__registeredEvents[type][path] = newEventCbArr;
                    this.__registeredEvents[type][path].firstOnWasInvoked = _firstOnWasInvoked;
                }
            };
            StorageFirebaseAdapter.prototype = storageFirebaseAdapterPrototype;

            return StorageFirebaseAdapter;
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageSrv', [
        '$cacheFactory', '$q', '$log',
        function ($cacheFactory, $q, $log) {
            var getEntityPromMap = {};

            var cacheId = 0;

            /**
             *  adapter - implement the following interface:
             *      - get(path): get path value
             *      - set(path, value): set the value in the path
             *      - update(path, value
             *      - onEvent: curretnly supported events:
             *          value: value was changed
             *      - offEvent
             *
             *  config -
             *      cacheRules - rules which control whether path should be cached, the possible values are:
             *          string - if the path equal to the rule string the it will not be cached.
             *          function - receive the path as argument, if the function return true then the path will not be cached.
             *          regex - if the path matches the regex then it will not be cached.
             *
             *      variables -
             *          uid - function or value which return current uid as straight value or promise
             * */
            function StorageSrv(adapter, config) {
                this.adapter = adapter;

                this.__cache = $cacheFactory('entityCache' + cacheId);

                config = config || {};
                var defaultConfig = {
                    variables: {
                        uid: null
                    },
                    cacheRules: []
                };
                this.__config = angular.extend(defaultConfig, config);

                this.__pathsBindedToServer = {};

                //progress by 1 storage cache id
                cacheId++;
            }

            function _shouldBeCached(path, config) {
                var cacheRules = config.cacheRules;

                for (var i = 0; i < cacheRules.length; i++) {
                    var rule = cacheRules[i];
                    var shouldNotBeCached = false;

                    if (angular.isString(rule)) {
                        shouldNotBeCached = rule === path;
                    }

                    if (angular.isFunction(rule)) {
                        shouldNotBeCached = rule(path);
                    }

                    if (rule instanceof RegExp) {
                        shouldNotBeCached = rule.test(path);
                    }

                    if (shouldNotBeCached) {
                        return false;
                    }
                }
                return true;
            }

            StorageSrv.EVENTS = {
                'VALUE': 'value',
                'CHILD_CHANGED': 'child_changed'
            };

            StorageSrv.prototype.__processPath = function (pathStrOrObj) {
                var config = this.__config;
                function _replaceVariables(path, uid) {
                    var regexString = StorageSrv.variables.uid.replace(/\$/g, '\\$');
                    var UID_REGEX = new RegExp(regexString, 'g');
                    return path.replace(UID_REGEX, uid);
                }

                function _getUid() {
                    var getUid = angular.isFunction(config.variables.uid) ? config.variables.uid() : config.variables.uid;
                    return $q.when(getUid);
                }

                return _getUid().then(function (uid) {
                    if (angular.isUndefined(uid) || uid === null) {
                        $log.debug('StorageSrv: empty uid was received');
                    }

                    if (angular.isString(pathStrOrObj)) {
                        var processedPath = _replaceVariables(pathStrOrObj, uid);
                        return processedPath;
                    }

                    if (angular.isObject(pathStrOrObj)) {
                        var processedPathObj = {};
                        angular.forEach(pathStrOrObj, function (value, pathName) {
                            var processedPath = _replaceVariables(pathName, uid);
                            processedPathObj[processedPath] = value;
                        });

                        return processedPathObj;
                    }
                    $log.error('StorageSrv: failed to process path');

                    return null;
                });
            };

            StorageSrv.prototype.__addDataToCache = function (pathStrOrObj, newValue) {
                var self = this;

                var dataToSaveInCache = {};

                if (angular.isString(pathStrOrObj)) {
                    dataToSaveInCache[pathStrOrObj] = newValue;
                } else {
                    dataToSaveInCache = pathStrOrObj;
                }

                var cachedDataMap = {};
                angular.forEach(dataToSaveInCache, function (value, path) {
                    var cachedValue;

                    if (angular.isObject(value) && !value.$save) {
                        cachedValue = Object.create({
                            $save: function () {
                                return self.update(path, this);
                            },
                            $$path: path
                        });
                        angular.forEach(value, function (value, key) {
                            cachedValue[key] = value;
                        });
                    } else {
                        cachedValue = value;
                    }

                    cachedDataMap[path] = cachedValue;

                    if (_shouldBeCached(path, self.__config)) {
                        self.__cache.put(path, cachedValue);
                    }
                });

                return angular.isObject(pathStrOrObj) ? cachedDataMap : cachedDataMap[pathStrOrObj];
            };

            StorageSrv.prototype.__addPathBindedToServer = function(path){
                this.__pathsBindedToServer[path] = true;
            };

            StorageSrv.prototype.removeServerPathBinding = function(path){
                this.adapter.offEvent(StorageSrv.EVENTS.VALUE, path);
            };

            StorageSrv.prototype.get = function (path, defaultValue) {
                var self = this;

                return this.__processPath(path, self.__config).then(function (processedPath) {
                    var entity = self.__cache.get(processedPath);
                    var getProm;
                    defaultValue = defaultValue || {};
                    var cacheProm = false;

                    if (entity) {
                        getProm = $q.when(entity);
                    } else {
                        if (getEntityPromMap[processedPath]) {
                            return getEntityPromMap[processedPath];
                        }
                        cacheProm = true;
                        getProm = $q.when(self.adapter.get(processedPath)).then(function (_entity) {
                            if (angular.isUndefined(_entity) || _entity === null) {
                                _entity = {};
                            }

                            if (angular.isObject(_entity)) {
                                var initObj = Object.create({
                                    $save: function () {
                                        return self.update(processedPath, this);
                                    },
                                    $$path: processedPath
                                });
                                _entity = angular.extend(initObj, _entity);
                            }

                            if (_shouldBeCached(processedPath, self.__config)) {
                                self.__cache.put(processedPath, _entity);
                            }

                            delete getEntityPromMap[processedPath];

                            return _entity;
                        });
                    }
                    getProm = getProm.then(function (_entity) {
                        var keys = Object.keys(defaultValue);
                        keys.forEach(function (key) {
                            if (angular.isUndefined(_entity[key])) {
                                _entity[key] = angular.copy(defaultValue[key]);
                            }
                        });
                        return _entity;
                    });

                    if (cacheProm) {
                        getEntityPromMap[path] = getProm;
                    }

                    return getProm;
                });
            };

            StorageSrv.prototype.getServerValue = function (path) {
                var self = this;
                return this.__processPath(path, self.__config).then(function (processedPath) {
                    return $q.when(self.adapter.get(processedPath));
                });
            };

            StorageSrv.prototype.getAndBindToServer = function (path) {
                var self = this;

                return this.get(path).then(function (pathValue) {
                    self.adapter.onEvent('value', pathValue.$$path, function (serverValue) {
                        angular.extend(pathValue, serverValue);
                    });

                    self.__addPathBindedToServer(path);
                    return pathValue;
                });
            };

            StorageSrv.prototype.set = function (path, newValue) {
                var self = this;

                if (!angular.isString(path)) {
                    var errMSg = 'StorageSrv: path should be a string';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return this.__processPath(path, self.__config).then(function (processedPath) {
                    return $q.when(self.adapter.set(processedPath, newValue)).then(function () {
                        return self.__addDataToCache(processedPath, newValue);
                    });
                });
            };

            StorageSrv.prototype.update = function (pathStrOrObj, newValue) {
                var self = this;

                return this.__processPath(pathStrOrObj, self.__config).then(function (processedPathOrObj) {
                    return $q.when(self.adapter.update(processedPathOrObj, newValue)).then(function () {
                        return self.__addDataToCache(processedPathOrObj, newValue);
                    });
                });
            };

            StorageSrv.prototype.entityCommunicator = function (path, defaultValues) {
                return new EntityCommunicator(path, defaultValues, this);
            };

            StorageSrv.prototype.cleanPathCache = function (path) {
                this.__cache.remove(path);
            };

            StorageSrv.prototype.onEvent = function(){
                return this.adapter.onEvent.apply(this.adapter, arguments);
            };

            StorageSrv.prototype.offEvent = function(){
                return this.adapter.offEvent.apply(this.adapter, arguments);
            };

            StorageSrv.variables = {
                currTimeStamp: '%currTimeStamp%',
                uid: '$$uid',
                appUserSpacePath: 'users/$$uid'
            };

            function EntityCommunicator(path, defaultValue, storage) {
                this.path = path;
                this.defaultValue = defaultValue;
                this.storage = storage;
            }

            EntityCommunicator.prototype.get = function () {
                return this.storage.get(this.path);
            };

            EntityCommunicator.prototype.set = function (newVal) {
                return this.storage.set(this.path, newVal);
            };

            return StorageSrv;
        }
    ]);
})(angular);

angular.module('znk.infra.storage').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.support', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.support').service('SupportSrv',
        ["InfraConfigSrv", "ENV", "AuthService", "UserProfileService", "$q", "$injector", "$log", "teachersSrv", "$http", function (InfraConfigSrv, ENV, AuthService, UserProfileService, $q, $injector, $log, teachersSrv, $http) {
            'ngInject';
            var SupportSrv = {};

            var authData = AuthService.getAuth();
            var APPROVED_STUDENTS_PATH = 'users/$$uid/approvedStudents/';
            var invitationEndpoint = ENV.backendEndpoint + 'invitation';
            var SUPPORT_EMAIL = ENV.supportEmail;
            var NO_EMAIL = 'noEmail@zinkerz.com'; // in case the user has no email.

            SupportSrv.connectTeacherWithSupport = function (callbackFn) {
                $injector.invoke(['GroupsService', function(GroupsService){
                    if (authData && authData.uid) {
                        return InfraConfigSrv.getTeacherStorage().then(function (teacherStorage) {
                            return teacherStorage.get(APPROVED_STUDENTS_PATH).then(function (students) {
                                var studentKeys = Object.keys(students);

                                var linkedToSupport = false;

                                var promsArray = [];
                                angular.forEach(studentKeys, function (studentId) {
                                    var prom = GroupsService.getUserData(studentId).then(function (studentData) {
                                        if (studentData.originalReceiverEmail === SUPPORT_EMAIL) {
                                            linkedToSupport = true;
                                        }
                                    });
                                    promsArray.push(prom);
                                });
                                $q.all(promsArray).then(function () {
                                    if (!linkedToSupport && authData.auth.email !== SUPPORT_EMAIL) {
                                        _buildDataToSend(callbackFn);
                                    } else {
                                        callbackFn();
                                    }
                                });
                            });
                        });
                    }
                }]);
            };

            SupportSrv.connectStudentWithSupport = function (callbackFn) {
                if (authData && authData.uid) {
                    teachersSrv.getAllTeachers().then(function (teachers) {
                        var teachersKeys = Object.keys(teachers);
                        var linkedToSupport = false;

                        angular.forEach(teachersKeys, function (key) {
                            teachers[key].isTeacher = true;
                            if (teachers[key].email === SUPPORT_EMAIL) {
                                linkedToSupport = true;
                            }
                        });

                        if (!linkedToSupport && authData.auth.email !== SUPPORT_EMAIL) {
                            _buildDataToSend(callbackFn);
                        } else {
                            callbackFn();
                        }
                    });
                }
            };

            function _buildDataToSend(callbackFn){
                UserProfileService.getProfileByUserId(authData.uid).then(function (userProfile) {
                    var receiverName = userProfile.nickname;
                    var receiverEmail = authData.auth.email || userProfile.email || NO_EMAIL;
                    if (angular.isUndefined(receiverName) || angular.equals(receiverName, '')) {
                        receiverName = receiverEmail;
                    }

                    var dataToSend = {
                        receiverAppName: ENV.firebaseAppScopeName,
                        receiverEmail: receiverEmail,
                        receiverName: receiverName,
                        receiverUid: authData.uid,
                        receiverParentEmail: '',
                        receiverParentName: ''
                    };

                    _connectSupportToUser(dataToSend).then(function (response) {
                        callbackFn(response);
                    });
                });
            }

            function _connectSupportToUser(dataToSend) {
                var config = {
                    timeout: ENV.promiseTimeOut || 15000
                };
                return $http.post(invitationEndpoint + '/support', dataToSend, config).then(
                    function (response) {
                        return {
                            data: response.data
                        };
                    },
                    function (error) {
                        $log.debug(error);
                });
            }

        return SupportSrv;
        }]
    );
})(angular);




angular.module('znk.infra.support').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon', []);
})(angular);
/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').directive('svgIcon', [
        '$log', 'SvgIconSrv',
        function ($log, SvgIconSrv) {
            return {
                scope: {
                    name: '@'
                },
                link: {
                    pre: function (scope, element) {
                        function _appendSvgIcon(name){
                            element.addClass(name);
                            SvgIconSrv.getSvgByName(name).then(function (svg) {
                                element.append(svg);
                            });
                        }

                        function _nameAttrWatchFn(){
                            return element.attr('name');
                        }

                        scope.$watch(_nameAttrWatchFn, function(newName, prevName){
                            element.empty();

                            if(prevName){
                                element.removeClass(prevName);
                            }

                            if(newName){
                                _appendSvgIcon(newName);
                            }
                        });
                    }
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').provider('SvgIconSrv', [
        function () {
            var defaultConfig = {};
            this.setConfig = function (_config) {
                angular.extend(defaultConfig, _config);
            };

            var svgMap = {};
            this.registerSvgSources = function (_svgMap) {
                var alreadyRegisteredSvgIconNames = Object.keys(svgMap);
                alreadyRegisteredSvgIconNames.forEach(function(svgIconName){
                    if(!!_svgMap[svgIconName]){
                        console.error('SvgIconSrv: svg icon was already defined before ',svgIconName);
                    }
                });
                angular.extend(svgMap,_svgMap);
                return true;
            };

            var getSvgPromMap = {};

            this.$get = [
                '$templateCache', '$q', '$http', '$log',
                function ($templateCache, $q, $http, $log) {
                    var SvgIconSrv = {};

                    SvgIconSrv.getSvgByName = function (name) {
                        var src = svgMap[name];

                        if(!src){
                            $log.error('SvgIconSrv: src is missing for the following name: ' + name);
                            return $q.reject('no source was found');
                        }

                        if(getSvgPromMap[src]){
                            return getSvgPromMap[src];
                        }

                        var fromCache = $templateCache.get(src);
                        if(fromCache){
                            return $q.when(fromCache);
                        }

                        var getSvgProm =  $http.get(src).then(function(res){
                            $templateCache.put(src,res.data);
                            delete getSvgPromMap[src];
                            return res.data;
                        });
                        getSvgPromMap[src] = getSvgProm;

                        return getSvgProm;
                    };

                    return SvgIconSrv;
                }
            ];
        }]);
})(angular);

angular.module('znk.infra.svgIcon').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.teachers', [
        
    ]);
})(angular);

(function (angular) {
    'use strict';

    /**
     api:
     getAllTeachers: returns all teachers of current user as objects
     with the properties: teachers uid, teacher name and teacher email.
     getTeacher: returns specific teacher by teacher uid.
     * */

    angular.module('znk.infra.teachers').service('teachersSrv',
        ["InfraConfigSrv", function (InfraConfigSrv) {
            'ngInject';

            var self = this;
            var INVITATION_PATH = "users/$$uid/invitations/approved";

            self.getAllTeachers = function () {
                return InfraConfigSrv.getStudentStorage().then(function (studentStorage) {
                    return studentStorage.get(INVITATION_PATH).then(function (teachers) {
                        return angular.isDefined(teachers) ? _createNewTeachersObj(teachers) : null;
                    });
                });
            };

            self.getTeacher = function (teacherUid) {
                self.getAllTeachers().then(function (allTeachers) {
                    if (angular.isDefined(allTeachers[teacherUid])) {
                        return allTeachers[teacherUid];
                    }
                });
            };

            function _createNewTeachersObj(oldTeachersObj) {
                var newTeacherObj = {};
                var teachersKeys = Object.keys(oldTeachersObj);
                angular.forEach(teachersKeys, function (value) {
                    var teacherUid = oldTeachersObj[value].senderUid;
                    newTeacherObj[teacherUid] = {};
                    newTeacherObj[teacherUid].name = oldTeachersObj[value].senderName;
                    newTeacherObj[teacherUid].uid = oldTeachersObj[value].senderUid;
                    newTeacherObj[teacherUid].email = oldTeachersObj[value].senderEmail;
                });
                return newTeacherObj;
            }

        }]
    );
})(angular);

angular.module('znk.infra.teachers').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.user', [
        'znk.infra.config',
        'znk.infra.storage'
    ]);
})(angular);

'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    ["InfraConfigSrv", "StorageSrv", function (InfraConfigSrv, StorageSrv) {
        'ngInject';
        var profilePath = StorageSrv.variables.appUserSpacePath + '/profile';

        this.getProfile = function () {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.get(profilePath).then(function (profile) {
                    if (profile && (angular.isDefined(profile.email) || angular.isDefined(profile.nickname))) {
                        return profile;
                    }
                    return InfraConfigSrv.getUserData().then(function(authData) {
                        var emailFromAuth = authData.password ? authData.password.email : '';
                        var nickNameFromAuth = authData.auth ? authData.auth.name : emailFromAuth;

                        if (!profile.email) {
                            profile.email = emailFromAuth;
                        }
                        if (!profile.nickname) {
                            profile.nickname = nickNameFromAuth;
                        }
                        if (!profile.createdTime) {
                            profile.createdTime = StorageSrv.variables.currTimeStamp;
                        }

                        return globalStorage.set(profilePath, profile);
                    });
                });
            });
        };

        this.getProfileByUserId = function (userId) {
            var userProfilePath = 'users/' + userId + '/profile';
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.get(userProfilePath);
            });
        };

        this.setProfile = function (newProfile) {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.set(profilePath, newProfile);
            });
        };

        this.getCurrUserId = function(){
            return InfraConfigSrv.getGlobalStorage().then(function(GlobalStorage){
                var ref = GlobalStorage.adapter.getRef('');
                var authData = ref.getAuth();
                return authData && authData.uid;
            });
        };

        this.updateUserTeachWorksId = function(uid, userTeachWorksId){
            return InfraConfigSrv.getGlobalStorage().then(function(GlobalStorage){
                var path = 'users/' + uid + '/teachworksId';
                return GlobalStorage.update(path, userTeachWorksId);
            });
        };

        this.getUserTeachWorksId = function(uid){
            return InfraConfigSrv.getGlobalStorage().then(function(GlobalStorage){
                var path = 'users/' + uid + '/teachworksId';
                return GlobalStorage.get(path);
            });
        };

        this.getUserName = function(uid){
            var path = 'users/' + uid + '/profile/nickname';

            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage){
                return globalStorage.get(path);
            });
        };
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.user').provider('UserSessionSrv',
        function () {
            'ngInject';

            var isLastSessionRecordDisabled = false;
            this.disableLastSessionRecord = function (isDisbaled) {
                isLastSessionRecordDisabled = !!isDisbaled;
            };

            this.$get = ["InfraConfigSrv", "ENV", function (InfraConfigSrv, ENV) {
                'ngInject';// jshint ignore:line

                var initProm,lastSessionData;

                var UserSessionSrv = {};

                UserSessionSrv.isLastSessionRecordDisabled = function () {
                    return isLastSessionRecordDisabled;
                };

                UserSessionSrv.getLastSessionData = function () {
                    return initProm.then(function(){
                        return lastSessionData;
                    });
                };

                function init() {
                    return InfraConfigSrv.getUserData().then(function (userData) {
                        var globalLastSessionRef = new Firebase(ENV.fbDataEndPoint + ENV.firebaseAppScopeName + '/lastSessions/' + userData.uid, ENV.firebaseAppScopeName);
                        return globalLastSessionRef.once('value').then(function(snapshot){
                            lastSessionData = snapshot.val();
                            if(!isLastSessionRecordDisabled){
                                globalLastSessionRef.child('began').set(Firebase.ServerValue.TIMESTAMP);
                                globalLastSessionRef.child('ended').set(null);
                                globalLastSessionRef.child('ended').onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
                            }
                        });
                    });
                }
                initProm = init();

                return UserSessionSrv;
            }];
        }
    );
})(angular);

angular.module('znk.infra.user').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext').service('StudentContextSrv', ['$window', '$log',

        function ($window, $log) {
            var StudentContextSrv = {};

            var _storageStudentUidKey = 'currentStudentUid';
            var _currentStudentUid = '';
            var registeredCbsToStudentContextChangeEvent = [];

            StudentContextSrv.getCurrUid = function () {
                if (_currentStudentUid.length === 0) {
                    if ($window.sessionStorage) {
                        var storedCurrentUid = $window.sessionStorage.getItem(_storageStudentUidKey);
                        if (storedCurrentUid) {
                            _currentStudentUid = storedCurrentUid;

                        } else {
                            $log.error('StudentContextSrv: no student uid');
                        }
                    } else {
                        $log.error('StudentContextSrv: no student uid');
                    }
                }
                return _currentStudentUid;
            };

            StudentContextSrv.setCurrentUid = function (uid) {
                var prevUid = _currentStudentUid;
                _currentStudentUid = uid;

                if ($window.sessionStorage) {
                    $window.sessionStorage.setItem(_storageStudentUidKey, uid);
                }

                _invokeCbs(registeredCbsToStudentContextChangeEvent, [prevUid, uid]);
            };

            StudentContextSrv.registerToStudentContextChange = function(cb) {
                if (!angular.isFunction(cb)) {
                    $log.error('StudentContextSrv.registerToStudentContextChange: cb is not a function', cb);
                    return;
                }
                registeredCbsToStudentContextChangeEvent.push(cb);
            };

            function _invokeCbs(cbArr, args){
                cbArr.forEach(function(cb){
                    cb.apply(null, args);
                });
            }

            return StudentContextSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.userContext').service('TeacherContextSrv', ['$window', '$log', '$q',

        function ($window, $log, $q) {
            var TeacherContextSrv = {};

            var _storageTeacherUidKey = 'currentTeacherUid';
            var _currentTeacherUid = '';
            var registeredCbsToTeacherContextChangeEvent = [];

            TeacherContextSrv.getCurrUid = function () {
                if (_currentTeacherUid.length === 0) {
                    if ($window.sessionStorage) {
                        var storedCurrentUid = $window.sessionStorage.getItem(_storageTeacherUidKey);
                        if (storedCurrentUid) {
                            _currentTeacherUid = storedCurrentUid;

                        } else {
                            $log.error('TeacherContextSrv: no teacher uid');
                        }
                    } else {
                        $log.error('TeacherContextSrv: no teacher uid');
                    }
                }
                return $q.when(_currentTeacherUid);
            };

            TeacherContextSrv.setCurrentUid = function (uid) {
                var prevUid = _currentTeacherUid;
                _currentTeacherUid = uid;

                if ($window.sessionStorage) {
                    $window.sessionStorage.setItem(_storageTeacherUidKey, uid);
                }

                _invokeCbs(registeredCbsToTeacherContextChangeEvent, [prevUid, uid]);
            };

            TeacherContextSrv.registerToTeacherContextChange = function(cb) {
                if (!angular.isFunction(cb)) {
                    $log.error('TeacherContextSrv.registerToTeacherContextChange: cb is not a function', cb);
                    return;
                }
                registeredCbsToTeacherContextChangeEvent.push(cb);
            };

            function _invokeCbs(cbArr, args){
                cbArr.forEach(function(cb){
                    cb.apply(null, args);
                });
            }

            return TeacherContextSrv;
        }
    ]);
})(angular);

angular.module('znk.infra.userContext').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.utility', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').factory('UtilitySrv', [
        '$q',
        function ($q) {
            var UtilitySrv = {};

            //general utility functions
            UtilitySrv.general = {};

            UtilitySrv.general.createGuid = function(){
                function s4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); // jshint ignore:line
                }

                return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase();
            };

            // object utility function
            UtilitySrv.object = {};

            UtilitySrv.object.extendWithoutOverride = function(dest, src){
                angular.forEach(src, function(val,key){
                    if(!dest.hasOwnProperty(key)){
                        dest[key] = val;
                    }
                });
            };

            UtilitySrv.object.convertToArray = function(obj){
                var arr = [];
                angular.forEach(obj, function(obj){
                    arr.push(obj);
                });
                return arr;
            };

            //array utility srv
            UtilitySrv.array = {};

            UtilitySrv.array.convertToMap = function(arr, keyProp){
                if(angular.isUndefined(keyProp)){
                    keyProp = 'id';
                }
                var map = {};
                arr.forEach(function(item){
                    map[item[keyProp]] = item;
                });
                return map;
            };

            UtilitySrv.fn = {};

            UtilitySrv.fn.singletonPromise = function(promGetter){
                var prom;
                return function(){
                    if(!prom){
                        prom = $q.when(angular.isFunction(promGetter) ? promGetter() : promGetter);
                    }
                    return prom;
                };
            };

            UtilitySrv.fn.isValidNumber = function(number){
                if(!angular.isNumber(number) && !angular.isString(number)){
                    return false;
                }

                return !isNaN(+number);
            };

            return UtilitySrv;
        }
    ]);
})(angular);

angular.module('znk.infra.utility').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.webcall', []);
})(angular);
'use strict';

(function (angular) {

    function WebcallSrv() {

        var _credentials;

        this.setCallCred = function (credentials) {
            _credentials = credentials;
        };

        this.$get = ['$q', '$log', 'ENV', function ($q, $log, ENV) {

            var WebcallSrv = {};

            var deferredMap = {
                call: {},
                init: {},
                hang: {}
            };

            var _notSupportedMsg = 'webcall feature is not available';

            if (angular.isUndefined(_credentials)) {
                $log.error('credentials were not supplied');
            } else {
                var _username = _credentials.username;
                var _password = _credentials.password;
            }


            function _webrtcNotSupportedAlert() {
                $log.error(_notSupportedMsg);
                deferredMap.init.reject(_notSupportedMsg);
            }

            function _onReady() {
                $log.debug('_onReady');
                _plivoLogin();
            }

            function _plivoLogin() {
                $log.debug('_plivoLogin');
                Plivo.conn.login(_username, _password);
            }

            function _onLoginFailed() {
                $log.error('_onLoginFailed');
                deferredMap.init.reject();
            }

            function _onMediaPermission(isAllowed) {
                $log.debug('_onMediaPermission, isAllowed=' + isAllowed);
                if (!isAllowed){
                    if (!angular.equals({}, deferredMap.call)) {
                        // errorCode : 1 calls module CallsErrorSrv service depends on it, if it's changed here, it should changed there also.
                        deferredMap.call.reject({ errorCode: 1, error:'No persmission'});
                    }
                }
            }

            function _onLogin() {
                $log.debug('_onLogin');
                if (!angular.equals({}, deferredMap.init)) {
                    deferredMap.init.resolve();
                }
            }

            function _onCallTerminated() {
                $log.debug('_onCallTerminated');
                if (!angular.equals({}, deferredMap.hang)) {
                    deferredMap.hang.resolve();
                }
            }

            function _onCallAnswered() {
                $log.debug('_onCallAnswered');
                if (!angular.equals({}, deferredMap.call)) {
                    deferredMap.call.resolve();
                }
            }

            function _onCallFailed() {
                $log.debug('_onCallFailed');
                if (!angular.equals({}, deferredMap.call)) {
                    deferredMap.call.reject();
                }
            }

            function _onCalling() {
                $log.debug('_onCalling');
            }

            function _initPlivo() {
                Plivo.onWebrtcNotSupported = _webrtcNotSupportedAlert;
                Plivo.onReady = _onReady;
                Plivo.onLogin = _onLogin;
                Plivo.onLoginFailed = _onLoginFailed;
                Plivo.onCallAnswered = _onCallAnswered;
                Plivo.onCallTerminated = _onCallTerminated;
                Plivo.onCallFailed = _onCallFailed;
                Plivo.onMediaPermission = _onMediaPermission;
                Plivo.onCalling = _onCalling;
                Plivo.init();
                Plivo.setDebug(ENV.debug);
            }

            function _init() {
                deferredMap.init = $q.defer();

                if (angular.isDefined(Plivo)) {
                    if (Plivo.conn) {
                        $log.debug('Plivo is already initialized');
                        deferredMap.init.resolve();
                    } else {
                        _initPlivo();
                    }
                } else {
                    deferredMap.init.reject(_notSupportedMsg);
                }
                return deferredMap.init.promise;
            }

            function _call(callId) {
                deferredMap.call = $q.defer();
                var res = Plivo.conn.call(callId);
                if (res === false) {
                    deferredMap.call.reject();
                }
                return deferredMap.call.promise;
            }

            WebcallSrv.connect = function (callId) {
                return _init().then(function () {
                    $log.debug('init done');
                    return _call(callId);
                });
            };

            WebcallSrv.hang = function () {
                deferredMap.hang = $q.defer();
                if (Plivo.conn) {
                    var res = Plivo.conn.hangup();
                    if (res === false) {
                        deferredMap.hang.reject();
                    }
                } else {
                    deferredMap.hang.reject();
                }

                return deferredMap.hang.promise;
            };

            return WebcallSrv;
        }];
    }

    angular.module('znk.infra.webcall').provider('WebcallSrv', WebcallSrv);

})(angular);

angular.module('znk.infra.webcall').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.workouts', [
        'znk.infra.exerciseUtility',
        'znk.infra.config',
        'znk.infra.exerciseResult',
        'znk.infra.contentAvail'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentGetters').service('WorkoutsSrv',
        ["ExerciseStatusEnum", "ExerciseTypeEnum", "$log", "StorageSrv", "ExerciseResultSrv", "ContentAvailSrv", "$q", "InfraConfigSrv", function (ExerciseStatusEnum, ExerciseTypeEnum, $log, StorageSrv, ExerciseResultSrv, ContentAvailSrv, $q,
                  InfraConfigSrv) {
            'ngInject';

            var workoutsDataPath = StorageSrv.variables.appUserSpacePath + '/workouts';

            function _getWorkoutsData() {
                var defaultValue = {
                    workouts: {}
                };
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(workoutsDataPath, defaultValue);
                });
            }

            function getWorkoutKey(workoutId) {
                return 'workout_' + workoutId;
            }

            function _getWorkout(workoutId) {
                var workoutKey = getWorkoutKey(workoutId);
                return _getWorkoutsData().then(function (workoutsData) {
                    return workoutsData.workouts[workoutKey];
                });
            }

            function _setIsAvailForWorkout(workout) {
                return ContentAvailSrv.isDailyAvail(workout.workoutOrder).then(function (isAvail) {
                    workout.isAvail = isAvail;
                });
            }

            this.getAllWorkouts = function (skipAddInitWorkouts) {
                return _getWorkoutsData().then(function (workoutsData) {
                    var workoutsArr = [],
                        promArr = [];
                    angular.forEach(workoutsData.workouts, function (workout) {
                        workoutsArr.push(workout);
                        promArr.push(_setIsAvailForWorkout(workout));
                    });
                    if (!skipAddInitWorkouts) {
                        for (var i = 0; i < 5; i++) {
                            var workoutToAdd = {
                                status: ExerciseStatusEnum.NEW.enum,
                                workoutOrder: workoutsArr.length + 1
                            };
                            workoutsArr.push(workoutToAdd);
                            promArr.push(_setIsAvailForWorkout(workoutToAdd));
                        }
                    }
                    return $q.all(promArr).then(function () {
                        return workoutsArr.sort(function (workout1, workout2) {
                            return workout1.workoutOrder - workout2.workoutOrder;
                        });
                    });
                });
            };

            this.getWorkoutData = function (workoutId) {
                if (angular.isUndefined(workoutId)) {
                    $log.error('workoutSrv: getWorkoutData function was invoked without workout id');
                }
                return _getWorkout(workoutId);
            };

            this.setWorkout = function (workoutId, newWorkoutValue) {
                return _getWorkoutsData().then(function (workoutsData) {
                    var workoutKey = getWorkoutKey(workoutId);
                    workoutsData.workouts[workoutKey] = newWorkoutValue;
                    InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                        StudentStorageSrv.set(workoutsDataPath, workoutsData);
                    });
                });
            };

            this.getWorkoutKey = getWorkoutKey;
        }]
    );
})(angular);

angular.module('znk.infra.workouts').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer', [
        'znk.infra.znkMedia',
        'pascalprecht.translate',
        'znk.infra.svgIcon'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znk-audio-player-play': 'components/znkAudioPlayer/svg/play-icon.svg',
                    'znk-audio-player-pause': 'components/znkAudioPlayer/svg/pause-icon.svg',
                    'znk-audio-player-close': 'components/znkAudioPlayer/svg/close-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

'use strict';

(function (angular) {

    angular.module('znk.infra.znkAudioPlayer').directive('audioManager',
        function () {
            return {
                require: 'audioManager',
                controller: [
                    '$scope', '$attrs',
                    function ($scope, $attrs) {
                        var resultData = $scope.$eval($attrs.audioManager);

                        this.saveAsPlayedThrough = function saveAsPlayedThrough(groupData) {
                            resultData.playedAudioArticles = resultData.playedAudioArticles || {};
                            if (angular.isUndefined(resultData.playedAudioArticles[groupData.id])) {
                                resultData.playedAudioArticles[groupData.id] = groupData.id;
                                resultData.playedAudioArticles = angular.copy(resultData.playedAudioArticles);
                                resultData.$save();
                            }
                        };

                        this.wasPlayedThrough = function (groupData) {
                            return !!resultData.playedAudioArticles && angular.isDefined(resultData.playedAudioArticles[groupData.id]);
                        };

                        this.canReplayAudio = function canReplayAudio() {
                            return resultData.isComplete;
                        };
                    }]
            };
        });

})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').directive('znkAudioPlayButton', [
        function znkAudioPlayerDrv() {
            return {
                templateUrl: 'components/znkAudioPlayer/templates/znkAudioPlayButton.template.html',
                scope: {
                    sourceGetter: '&source',
                    typeGetter: '&?type',
                    autoPlayGetter: '&autoPlay',
                    onStart: '&?',
                    onEnded: '&',
                    switchInitGetter: '&switchInit',
                    allowReplay: '&?',
                    showAsDone: '=?'
                },
                link:function(scope){
                    scope.d = {};

                    var STATE_ENUM = {
                        START_PLAY: 1,
                        PLAYING: 2,
                        ALREADY_PLAYED: 3
                    };

                    scope.d.statesEnum = STATE_ENUM;

                    scope.d.source = angular.isDefined(scope.sourceGetter) ? scope.sourceGetter() : undefined;
                    scope.d.type = angular.isDefined(scope.typeGetter) ? scope.typeGetter() : scope.d.statesEnum.START_PLAY;

                    var allowReplay =  angular.isDefined(scope.allowReplay) ? scope.allowReplay() : false;
                    var autoPlay = angular.isDefined(scope.autoPlayGetter) ? scope.autoPlayGetter() : false;
                    var showAsDone = !!scope.showAsDone;

                    scope.audioPlayer = {
                        STATE_ENUM: STATE_ENUM,
                        audioEnded: function (){
                            if(angular.isDefined(scope.onEnded)) {
                                scope.onEnded();
                            }
                            scope.audioPlayer.currState = allowReplay ? STATE_ENUM.START_PLAY : STATE_ENUM.ALREADY_PLAYED;
                        }
                    };

                    if(showAsDone && !allowReplay){
                        scope.audioPlayer.currState = STATE_ENUM.ALREADY_PLAYED;
                    }else{
                        scope.audioPlayer.currState = autoPlay ? STATE_ENUM.PLAYING : STATE_ENUM.START_PLAY;
                    }

                    scope.$watch('audioPlayer.currState', function (state) {
                        scope.isPlaying = state === STATE_ENUM.PLAYING;
                    });

                    scope.$watch('autoPlayGetter()', function(playStatus) {
                        scope.audioPlayer.currState = playStatus ? STATE_ENUM.PLAYING : STATE_ENUM.START_PLAY;
                    });

                    scope.$watch('showAsDone', function (showAsDone) {
                        if(showAsDone && !allowReplay){
                            scope.audioPlayer.currState = STATE_ENUM.ALREADY_PLAYED;
                        }
                    });
                }
            };
        }]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').directive('znkAudioPlayer', [
        '$timeout', '$window', '$interval', 'MediaSrv', '$filter', 'ENV',
        function znkAudioPlayerDrv($timeout, $window, $interval, MediaSrv, $filter, ENV) {
            return {
                templateUrl: 'components/znkAudioPlayer/templates/znkAudioPlayer.template.html',
                scope: {
                    sourceGetter: '&source',
                    typeGetter: '&?type',
                    autoPlayGetter: '&autoPlay',
                    onEnded: '&'
                },
                link:function(scope,element,attrs){
                    var sound;

                    var TYPES_ENUM = {
                        'NO_CONTROL': 1,
                        'HAS_CONTROL': 2
                    };

                    var domElement = element[0];

                    var STATE_ENUM = {
                        NONE: $window.Media.MEDIA_NONE,
                        PAUSE: $window.Media.MEDIA_PAUSED,
                        RUNNING: $window.Media.MEDIA_RUNNING,
                        STOPPED: $window.Media.MEDIA_STOPPED,
                        STARTING: $window.Media.MEDIA_STARTING
                    };

                    var type =  angular.isDefined(scope.typeGetter) ? scope.typeGetter() : 1;

                    scope.d = {
                        type: type,
                        STATE_ENUM: STATE_ENUM,
                        playOrPause: function(){
                            if(!sound){
                                return;
                            }
                            if(scope.d.currState === STATE_ENUM.RUNNING){
                                sound.pause();
                            }else{
                                sound.play();
                            }
                        },
                        stop: function() {
                            sound.stop();
                        }
                    };

                    switch(type){
                        case TYPES_ENUM.NO_CONTROL:
                            element.addClass('type-no-control');
                            break;
                        case TYPES_ENUM.HAS_CONTROL:
                            element.addClass('type-has-control');
                            break;
                    }

                    if(attrs.actions){
                        scope.$parent.$eval(attrs.actions + '=' + attrs.actions + '|| {}');
                        var actions = scope.$parent.$eval(attrs.actions);
                        actions.play = function(){
                            sound.play();
                        };
                    }

                    function resumePlayingAudio(){
                        switch (scope.d.type){
                            case TYPES_ENUM.NO_CONTROL:
                                var audioProgressDomElement = domElement.querySelector('.audio-progress');
                                audioProgressDomElement.style['-webkit-transition'] = audioProgressDomElement.style.transition = '';
                                break;
                            case TYPES_ENUM.HAS_CONTROL:
                                break;
                        }
                        startUpdatingTimeAndProgress();
                    }

                    function startUpdatingTimeAndProgress(){
                        if(startUpdatingTimeAndProgress.intervalProm){
                            $interval.cancel(startUpdatingTimeAndProgress.intervalProm);
                        }
                        setTimeAndProgress();
                        startUpdatingTimeAndProgress.intervalProm = $interval(function(){
                            setTimeAndProgress();
                        },1000,0,false);
                    }

                    function setTimeAndProgress() {
                        var timePassedElement = domElement.querySelector('.time-passed');
                        var timeLeftElement = domElement.querySelector('.time-left');
                        var duration = sound.getDuration();
                        if(duration <= 0){
                            return;
                        }
                        sound.getCurrentPosition(function(currPos){
                            currPos = Math.max(currPos,0);
                            switch(scope.d.type){
                                case TYPES_ENUM.NO_CONTROL:
                                    var audioProgressDomElement = domElement.querySelector('.audio-progress');
                                    if(audioProgressDomElement.style.transition === ''){
                                        var initWidthInPercent = currPos / duration * 100;
                                        audioProgressDomElement.style.width = initWidthInPercent + '%';

                                        var timeLeft = duration - currPos;
                                        audioProgressDomElement.style['-webkit-transition'] = audioProgressDomElement.style.transition = 'width ' + timeLeft +'s linear';
                                        audioProgressDomElement.style.width = '100%';
                                    }
                                    timePassedElement.innerHTML = $filter('secondsToTime')(currPos,'m:ss');
                                    break;
                                case TYPES_ENUM.HAS_CONTROL:
                                    var inputRangeDomElem = domElement.querySelector('input[type="range"]');
                                    inputRangeDomElem.value = currPos;
                                    inputRangeDomElem.max = Math.round(duration);
                                    if(inputRangeDomElem.value < inputRangeDomElem.max){
                                        inputRangeDomElem.stepUp(1);
                                    }
                                    break;
                            }

                            timeLeftElement.innerHTML = $filter('secondsToTime')(duration - currPos,'- ' + 'm:ss');
                            if(ENV.debug && duration && currPos && (duration - currPos) > 20){
                                sound.seekTo(1000 * (duration - 5));
                            }
                        },angular.noop);
                    }

                    function audioPositionChangedHandler(){
                        /* jshint validthis: true */
                        sound.seekTo(+this.value * 1000);
                    }

                    var statusChanged = function statusChanged(status, allowReplay){
                        scope.d.currState = status;
                        var playerControlElem = angular.element(domElement.querySelector('.player-control'));
                        console.log('audio status changed, status: ' + status + ' src:' + scope.sourceGetter());
                        switch(status){
                            case STATE_ENUM.STOPPED:
                                //$apply causing exceptions ...
                                $timeout(function(){
                                    scope.onEnded({allowReplay : allowReplay});
                                });
                                $interval.cancel(startUpdatingTimeAndProgress.intervalProm);
                                if(playerControlElem.length){
                                    playerControlElem.removeClass('ion-pause');
                                    playerControlElem.addClass('ion-play');
                                }
                                break;
                            case STATE_ENUM.NONE:
                            case STATE_ENUM.PAUSE:
                                $interval.cancel(startUpdatingTimeAndProgress.intervalProm);
                                if(playerControlElem.length){
                                    playerControlElem.removeClass('ion-pause');
                                    playerControlElem.addClass('ion-play');
                                }
                                break;
                            case STATE_ENUM.RUNNING:
                                resumePlayingAudio();
                                hideLoadingSpinner();
                                if(playerControlElem.length){
                                    playerControlElem.removeClass('ion-play');
                                    playerControlElem.addClass('ion-pause');
                                }
                                break;
                            case STATE_ENUM.STARTING:
                                hideLoadingSpinner();
                                if(playerControlElem.length){
                                    playerControlElem.removeClass('ion-play');
                                    playerControlElem.addClass('ion-pause');
                                }
                                break;
                        }
                    };

                    function loadSound(){
                        if(sound){
                            sound.stop();
                            sound.release();
                        }
                        showLoadingSpinner();
                        sound = MediaSrv.loadSound(scope.sourceGetter(),
                            function success(){},
                            function err(){
                            //    $timeout(function(){
                            //        var errMsg = NetworkSrv.isDeviceOffline() ? ErrorHandlerSrv.messages.noInternetConnection : ErrorHandlerSrv.messages.defaultErrorMessage;
                            //        ErrorHandlerSrv.displayErrorMsg(errMsg).then(function() {
                            //            statusChanged(STATE_ENUM.STOPPED, true);
                            //        });
                            //    });
                            },
                            statusChanged
                            //HACK currently the recorded audio is not save in dataDirectory
                        );
                    }

                    function hideShowLoadingSpinner(displayedElemSelector,hiddenElemSelector){
                        var displayedDomElement = domElement.querySelector(displayedElemSelector);
                        if(displayedDomElement){
                            displayedDomElement.style.display = 'block';
                        }

                        var hiddenDomElement = domElement.querySelector(hiddenElemSelector);
                        if(hiddenDomElement){
                            hiddenDomElement.style.display = 'none';
                        }
                    }
                    var showLoadingSpinner = hideShowLoadingSpinner.bind(this,'ion-spinner','.time-left');

                    var hideLoadingSpinner = hideShowLoadingSpinner.bind(this,'.time-left','ion-spinner');

                    $timeout(function(){
                        if(type === TYPES_ENUM.HAS_CONTROL) {
                            var inputRangeDomElem = domElement.querySelector('input[type="range"]');
                            inputRangeDomElem.addEventListener('change', audioPositionChangedHandler);
                        }
                    });

                    scope.$watch('sourceGetter()',function(newSrc){
                        if(newSrc){
                            loadSound();

                            if(scope.autoPlayGetter()){
                                sound.play();
                            }
                        }
                    });

                    scope.$on('$destroy',function(){
                        if(sound){
                            sound.release();
                        }
                        $interval.cancel(startUpdatingTimeAndProgress.intervalProm);
                        if(type === TYPES_ENUM.HAS_CONTROL){
                            var inputRangeDomElem = domElement.querySelector('input[type="range"]');
                            inputRangeDomElem.removeEventListener('change',audioPositionChangedHandler);
                        }
                    });
                }
            };
        }]);
})(angular);

'use strict';

(function (angular) {

    angular.module('znk.infra.znkAudioPlayer').directive('znkImageAudio', [
        function znkImageAudio() {

            return {
                templateUrl: 'components/znkAudioPlayer/templates/znkImageAudio.template.html',
                scope: {
                    imageGetter: '&image',
                    source: '=audio',
                    hideFooter: '=',
                    onEnded: '&',
                    isPlaying: '=?',
                    showAsDone: '=?',
                    allowReplay: '&?',
                    showSkipOption: '&?',
                    onPlayerStart: '&?',
                    autoPlayGetter: '&autoPlay',
                    blurredImageGetter: '&?blurredImage'
                },
                link: function (scope) {

                    scope.d = {
                        image: scope.imageGetter(),
                        blurredImage: angular.isDefined(scope.blurredImageGetter) ? scope.blurredImageGetter : undefined
                    };

                    function isSkipOptionExist() {
                       return angular.isDefined(scope.showSkipOption) && scope.showSkipOption();
                    }

                    scope.d.skippedHandler = function() {
                        scope.showAsDone = true;
                        scope.d.showSkipButton = false;
                        scope.onEnded();
                    };

                    scope.d.onPlayerStart = function() {
                        if (isSkipOptionExist()) {
                            scope.d.showSkipButton = true;
                        }
                        if (scope.onPlayerStart) {
                            scope.onPlayerStart();
                        }
                    };

                    if (isSkipOptionExist()) {
                        var onEnded = scope.onEnded;  // reference to onEnded function.
                        scope.onEnded = function(){ // extend the onEnded function (if passed).
                            if(onEnded){
                                onEnded();
                            }
                            scope.d.showSkipButton = false;
                        };
                    }
                }
            };
        }]);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkAudioPlayer').filter('secondsToTime', [
        function () {
            return function (totalSeconds,format) {
                var min = parseInt(totalSeconds / 60);
                var paddedMin = min >= 10 ? min : '0' + min;
                var sec = parseInt(totalSeconds % 60);
                var paddedSec = sec >= 10 ? sec: '0' + sec;
                return format.replace('mm',paddedMin)
                    .replace('m',min)
                    .replace('ss',paddedSec)
                    .replace('s',sec);
            };
        }
    ]);
})(angular);

angular.module('znk.infra.znkAudioPlayer').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkAudioPlayer/svg/close-icon.svg",
    "<svg\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    class=\"znk-audio-player-close-svg\"\n" +
    "    viewBox=\"-596.6 492.3 133.2 133.5\">\n" +
    "    <style>\n" +
    "        .znk-audio-player-close-svg {\n" +
    "        }\n" +
    "    </style>\n" +
    "<path class=\"st0\"/>\n" +
    "<g>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/svg/pause-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-359 103.4 28 36.6\" class=\"znk-audio-player-pause-svg\">\n" +
    "    <style>\n" +
    "        .znk-audio-player-pause-svg  .znk-audio-player-pause-svg-rect {\n" +
    "            width: 7px;\n" +
    "            height: 20px;\n" +
    "        }\n" +
    "    </style>\n" +
    "<rect class=\"znk-audio-player-pause-svg-rect\" x=\"-353\" y=\"110\" />\n" +
    "<rect class=\"znk-audio-player-pause-svg-rect\" x=\"-340.8\" y=\"110\" />\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/svg/play-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 55.7 55.7\" class=\"znk-audio-player-play-svg\">\n" +
    "    <style>\n" +
    "        .znk-audio-player-play-svg {\n" +
    "            enable-background:new 0 0 55.7 55.7;\n" +
    "        }\n" +
    "    </style>\n" +
    "<style type=\"text/css\">\n" +
    "	.znk-audio-player-play-svg .st0{fill:none;stroke:#231F20;stroke-width:3;stroke-miterlimit:10;}\n" +
    "	.znk-audio-player-play-svg .st1{fill:#231F20;}\n" +
    "</style>\n" +
    "<circle class=\"st0\" cx=\"27.8\" cy=\"27.8\" r=\"26.3\"/>\n" +
    "<path class=\"st1\" d=\"M22.7,16.6L39,26.1c1.4,0.8,1.4,2.8,0,3.6L22.7,39c-1.4,0.8-3.1-0.2-3.1-1.8V18.4\n" +
    "	C19.6,16.8,21.3,15.8,22.7,16.6z\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/templates/znkAudioPlayButton.template.html",
    "<ng-switch on=\"audioPlayer.currState\" translate-namespace=\"ZNK_AUDIO_PLAYER\">\n" +
    "    <div class=\"play-button-wrapper\"\n" +
    "         ng-switch-when=\"1\">\n" +
    "        <button class=\"play-button\" ng-click=\"audioPlayer.currState = audioPlayer.STATE_ENUM.PLAYING; onStart();\">\n" +
    "            <svg-icon name=\"znk-audio-player-play\"></svg-icon>\n" +
    "            <span class=\"play-audio-text\" translate=\".PLAY_AUDIO\"></span>\n" +
    "        </button>\n" +
    "    </div>\n" +
    "    <div class=\"znk-audio-player-wrapper\">\n" +
    "        <znk-audio-player ng-switch-when=\"2\"\n" +
    "                          source=\"d.source\"\n" +
    "                          type=\"d.type\"\n" +
    "                          on-ended=\"audioPlayer.audioEnded()\"\n" +
    "                          auto-play=\"true\">\n" +
    "        </znk-audio-player>\n" +
    "    </div>\n" +
    "    <div class=\"ended-msg\"\n" +
    "         ng-switch-when=\"3\">\n" +
    "        <span translate=\".THIS_VIDEO_ALREADY_PLAYED\"></span>\n" +
    "    </div>\n" +
    "</ng-switch>\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/templates/znkAudioPlayer.template.html",
    "<div class=\"time-display time-passed\" ng-if=\"::d.type === 1\"></div>\n" +
    "<div ng-if=\"::d.type === 2\"\n" +
    "     class=\"player-close-svg-wrapper\"\n" +
    "     ng-click=\"d.stop()\">\n" +
    "    <svg-icon\n" +
    "        class=\"player-close-svg\"\n" +
    "        name=\"znk-audio-player-close\">\n" +
    "    </svg-icon>\n" +
    "</div>\n" +
    "<div ng-if=\"::d.type === 2\"\n" +
    "   class=\"player-control\"\n" +
    "   ng-init=\"d.playStatus = false\"\n" +
    "   ng-switch=\"d.playStatus\"\n" +
    "   ng-click=\"d.playOrPause(); d.playStatus = !d.playStatus\">\n" +
    "  <svg-icon ng-switch-when=\"true\"\n" +
    "            class=\"player-play-svg\"\n" +
    "            name=\"znk-audio-player-play\">\n" +
    "  </svg-icon>\n" +
    "  <svg-icon ng-switch-when=\"false\"\n" +
    "              class=\"player-pause-svg\"\n" +
    "              name=\"znk-audio-player-pause\">\n" +
    "  </svg-icon>\n" +
    "</div>\n" +
    "<ng-switch on=\"d.type\" class=\"progress-container\">\n" +
    "    <div ng-switch-when=\"1\" class=\"only-progress-wrapper\">\n" +
    "        <div class=\"audio-progress\"></div>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"2\" class=\"range-progress-wrapper range\">\n" +
    "        <input type=\"range\" min=\"0\" max=\"0\" step=\"1\" value=\"0\"/>\n" +
    "    </div>\n" +
    "</ng-switch>\n" +
    "<div class=\"time-display time-left\"></div>\n" +
    "\n" +
    "");
  $templateCache.put("components/znkAudioPlayer/templates/znkImageAudio.template.html",
    "<div class=\"wrapper\" ng-class=\"{'no-footer': hideFooter}\" translate-namespace=\"ZNK_IMAGE_AUDIO\">\n" +
    "    <div class=\"inner-section\">\n" +
    "        <img class=\"inner\" ng-src=\"{{::d.image}}\">\n" +
    "    </div>\n" +
    "    <div class=\"audio-footer inverted\" ng-if=\"::!hideFooter\"  ng-class=\"{'showSkipButton': d.showSkipButton}\">\n" +
    "        <znk-audio-play-button\n" +
    "            switch-init=\"audioPlayer.currState\"\n" +
    "            source=\"source\"\n" +
    "            on-ended=\"onEnded()\"\n" +
    "            on-start=\"d.onPlayerStart()\"\n" +
    "            allow-replay=\"allowReplay()\"\n" +
    "            show-as-done=\"showAsDone\"\n" +
    "            auto-play=\"autoPlayGetter()\">\n" +
    "        </znk-audio-play-button>\n" +
    "\n" +
    "        <div class=\"skip-audio-button\" ng-if=\"d.showSkipButton\" ng-click=\"d.skippedHandler()\">\n" +
    "            <div translate=\".SKIP\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat',
        [
            'znk.infra.svgIcon',
            'znk.infra.teachers',
            'znk.infra.znkMedia'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'znk-chat-chat-icon': 'components/znkChat/svg/znk-chat-chat-icon.svg',
                    'znk-chat-close-icon': 'components/znkChat/svg/znk-chat-close-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatMessage', [
        function () {
            'ngInject';
            return {
                template: '<div class="message-wrapper">' +
                '<div class="message-date" ng-if="d.date">{{d.date}}</div>' +
                '<div class="message">' +
                '{{message.text}}' +
                ' <div class="bottom-triangle"></div>' +
                '</div>' +
                '</div>',
                scope: {
                    message: '=',
                    getLocalUserId: '&localUserId',
                    lastMessage: '&',
                    scrollToLastMessage: '&',
                    dateGetter: '&showDate'
                },
                link: function (scope, element) {
                    var classToAdd;
                    var localUserId = scope.getLocalUserId();
                    scope.d = {};
                    var dateProm = scope.dateGetter()(scope.message.time);

                    dateProm.then(function (date) {
                        scope.d.date = date;
                    });

                    if (String(localUserId) === String(scope.message.uid)) {
                        classToAdd = 'myMessage';
                    } else {
                        classToAdd = 'otherMessage';
                    }
                    element.addClass(classToAdd);
                    scope.scrollToLastMessage()();
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatBoard',
        ["znkChatSrv", "$timeout", "$filter", function (znkChatSrv, $timeout, $filter) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatBoard.template.html',
                scope: {
                    chatterObj: '=',
                    getUserId: '&userId',
                    closeChat: '&',
                    actions:'='
                },
                link: function (scope, element) {
                    var chatBoardScrollElement = element[0].querySelector('.messages-wrapper');
                    var dateMap = {};
                    var ENTER_KEY_CODE = 13;

                    scope.d = {};

                    scope.d.scrollToLastMessage = function () {
                        $timeout(function () {                // message need rendered first
                            chatBoardScrollElement.scrollTop = chatBoardScrollElement.scrollHeight;
                        });
                    };

                    if(!scope.actions){
                        scope.actions = {};
                    }

                    scope.actions.scrollToLastMessage = scope.d.scrollToLastMessage;

                    scope.userId = scope.getUserId();

                    scope.d.closeChat = scope.closeChat();

                    scope.$watch('chatterObj', function (newVal, oldVal) {
                        if (newVal !== oldVal) {
                            dateMap = {};
                            element[0].querySelector('.chat-textarea').focus();
                        }
                    });

                    scope.d.showDate = function (timeStamp) {
                        return $timeout(function () {         // wait for chatterObj watch checked first
                            var date = $filter('date')(timeStamp, 'EEE, MMM d');
                            if (angular.isUndefined(dateMap[date])) {  // show message date only once per day.
                                dateMap[date] = date;
                                return date;
                            }
                        });
                    };

                    scope.d.sendMessage = function (e) {
                        stopBubbling(e);
                        if (e.keyCode !== ENTER_KEY_CODE) {
                            return;
                        }
                        if (scope.d.newMessage.length > 0 && angular.isDefined(scope.chatterObj) && scope.chatterObj.chatGuid) {
                            var newMessageObj = {
                                time: Firebase.ServerValue.TIMESTAMP,
                                uid: scope.userId,
                                text: scope.d.newMessage
                            };
                            znkChatSrv.updateChat(scope.chatterObj.chatGuid, newMessageObj, scope.userId);
                            scope.d.newMessage = '';
                        }

                    };

                    function stopBubbling(e) {
                        if (e.stopPropagation) {
                            e.stopPropagation();
                        }
                        if (e.cancelBubble !== null) {
                            e.cancelBubble = true;
                        }
                    }
                }
            };
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatParticipants',
        ["znkChatDataSrv", "znkChatEventSrv", "ZNK_CHAT", function (znkChatDataSrv, znkChatEventSrv, ZNK_CHAT) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/chatParticipants.template.html',
                scope: {
                    selectChatter: '&',
                    chatData: '='
                },
                link: function (scope) {
                    scope.d = {};
                    scope.d.chatData = scope.chatData;
                    scope.d.selectChatter = scope.selectChatter();
                    scope.d.chatData.chatParticipantsArr = [];
                    var chatPaths = znkChatDataSrv.getChatPaths();
                    var localUserUid = scope.d.chatData.localUser.uid;
                    var chattersPath = chatPaths.newChatParticipantsListener;
                    chattersPath = chattersPath.replace('$$uid', localUserUid);

                    var newChatterHandler = function (newChatter) {
                        if (newChatter.email === ZNK_CHAT.SUPPORT_EMAIL) {
                            scope.d.chatData.support = newChatter;
                        } else {
                            scope.d.chatData.chatParticipantsArr.push(newChatter);
                        }
                    };
                    znkChatEventSrv.getChattersListener(chattersPath, newChatterHandler);

                    scope.$on('$destroy', function () {
                        znkChatEventSrv.offNewChatterEvent(chattersPath);
                    });
                }
            };
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('chatter',
        ["znkChatSrv", "$q", "znkChatEventSrv", "$timeout", "PresenceService", "ZNK_CHAT", "MediaSrv", function (znkChatSrv, $q, znkChatEventSrv, $timeout, PresenceService, ZNK_CHAT, MediaSrv) {
            'ngInject';
            var presenceActiveLiseners = {};

            return {
                templateUrl: 'components/znkChat/templates/chatter.template.html',
                scope: {
                    chatterObj: '=',
                    localUserChatsGuidsArr: '=',
                    localUser: '=',
                    setFirstChatter: '&?'
                },
                link: function (scope) {
                    var chatGuidProm;
                    var offEvent = {};
                    var soundPath = ZNK_CHAT.SOUND_PATH + 'sound.mp3';
                    var sound =  MediaSrv.loadSound(soundPath);

                    scope.d = {};
                    scope.d.userStatus = PresenceService.userStatus;
                    scope.d.maxNumUnseenMessages = ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES;

                    function trackUserPresenceCB(newStatus, userId) {
                        $timeout(function () {
                            if (scope.chatterObj.uid === userId) {
                                scope.chatterObj.presence = newStatus;
                            }
                        });
                    }

                    if (!presenceActiveLiseners[scope.chatterObj.uid]) {
                        PresenceService.startTrackUserPresence(scope.chatterObj.uid, trackUserPresenceCB);
                        presenceActiveLiseners[scope.chatterObj.uid] = true;
                    }

                    if (scope.localUserChatsGuidsArr) {  // this directive also placed in chat board - no need for this guids array
                        scope.chatterObj.chatMessages = [];
                        scope.chatterObj.messagesNotSeen = 0;

                        znkChatSrv.getChatGuidsByUid(scope.chatterObj.uid, scope.chatterObj.isTeacher).then(function (chatterChatGuidsArr) {
                            if (angular.isArray(chatterChatGuidsArr) && angular.isArray(scope.localUserChatsGuidsArr) && scope.localUserChatsGuidsArr.length > 0 && chatterChatGuidsArr.length > 0) {
                                var chatGuid = znkChatSrv.getChatGuidByTwoGuidsArray(scope.localUserChatsGuidsArr, chatterChatGuidsArr);
                                if (angular.isDefined(chatGuid)) {
                                    chatGuidProm = chatGuid;
                                } else {
                                    chatGuidProm = _listenToNewChat();
                                }
                            } else {
                                scope.setFirstChatter(scope.chatterObj); // first chatter with no existing chat
                                chatGuidProm = _listenToNewChat();
                            }

                            $q.when(chatGuidProm).then(function (chatGuid) {
                                znkChatSrv.getLastSeenMessage(chatGuid, scope.localUser.uid).then(function (lastSeenMessage) {
                                    scope.chatterObj.chatGuid = chatGuid;
                                    scope.chatterObj.lastSeenMessage = lastSeenMessage;
                                    scope.setFirstChatter(scope.chatterObj);
                                    _startListenToMessages(chatGuid);
                                });
                            });
                        });
                    }

                    function _startListenToMessages(chatGuid) {
                        var path = 'chats/' + chatGuid + '/messages';
                        var eventType = 'child_added';
                        znkChatEventSrv.registerMessagesEvent(eventType, path, newMessageHandler);
                        offEvent.messageEvent = {};
                        offEvent.messageEvent.path = path;
                        offEvent.messageEvent.eventType = eventType;
                        offEvent.messageEvent.callback = newMessageHandler;
                    }

                    function newMessageHandler(snapShot) {
                        var newData = snapShot.val();
                        var messageId = snapShot.key();
                        if (angular.isUndefined(scope.chatterObj.lastSeenMessage.messageId) || messageId > scope.chatterObj.lastSeenMessage.messageId) { // check if there is messages the local user didn't saw
                            if (scope.chatterObj.isActive) {
                                var lastSeenMessage = {};
                                lastSeenMessage.messageId = messageId;
                                lastSeenMessage.time = newData.time;
                                scope.chatterObj.lastSeenMessage = lastSeenMessage;
                                znkChatSrv.updateLasSeenMessage(scope.chatterObj.chatGuid, scope.localUser.uid, lastSeenMessage);
                            } else {
                                scope.chatterObj.messagesNotSeen++;
                                scope.chatterObj.messagesNotSeen = scope.chatterObj.messagesNotSeen < ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES ? scope.chatterObj.messagesNotSeen :  ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES;
                                sound.play();
                            }
                        }

                        $timeout(function () {
                            newData.id = messageId;
                            scope.chatterObj.chatMessages.push(newData);
                        });
                    }

                    function _listenToNewChat() {
                        var deferred = $q.defer();
                        var path = 'users/' + scope.chatterObj.uid + '/chats';
                        var evenType = 'value';

                        function _newChatHandler(snapshot) {
                            var newChatObj = snapshot.val();
                            if (newChatObj) {
                                znkChatSrv.getChatGuidsByUid(scope.localUser.uid, scope.localUser.isTeacher).then(function (localUserChatGuidsArr) {
                                    var newChatGuid = Object.keys(newChatObj)[0];
                                    var chatGuid = znkChatSrv.getChatGuidByTwoGuidsArray(localUserChatGuidsArr, [newChatGuid]);
                                    if (angular.isDefined(chatGuid) && chatGuid === newChatGuid) {
                                        znkChatEventSrv.offMsgOrNewChatEvent(offEvent.chatConnectionEvent.eventType, offEvent.chatConnectionEvent.path, offEvent.chatConnectionEvent.callback);
                                        deferred.resolve(newChatGuid);
                                    }
                                });
                            }
                        }

                        offEvent.chatConnectionEvent = {};
                        offEvent.chatConnectionEvent.path = path;
                        offEvent.chatConnectionEvent.eventType = evenType;
                        offEvent.chatConnectionEvent.callback = _newChatHandler;
                        znkChatEventSrv.registerNewChatEvent(evenType, path, _newChatHandler);
                        return deferred.promise;
                    }

                    scope.$on('$destroy', function () {
                        znkChatEventSrv.offMsgOrNewChatEvent(offEvent.messageEvent.eventType, offEvent.messageEvent.path, offEvent.messageEvent.callback);
                        znkChatEventSrv.offMsgOrNewChatEvent(offEvent.chatConnectionEvent.eventType, offEvent.chatConnectionEvent.path, offEvent.chatConnectionEvent.callback);
                        PresenceService.stopTrackUserPresence(scope.chatterObj.uid);
                    });
                }
            };
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').directive('znkChat',
        ["znkChatSrv", "$q", "UtilitySrv", "ZNK_CHAT", "$timeout", function (znkChatSrv, $q, UtilitySrv, ZNK_CHAT, $timeout) {
            'ngInject';
            return {
                templateUrl: 'components/znkChat/templates/znkChat.template.html',
                scope: {
                    localUser: '='
                },
                link: function (scope, element) {
                    $timeout(function () {
                        element.addClass('animate-chat');
                    });

                    scope.statesView = {
                        CHAT_BUTTON_VIEW: 1,
                        CHAT_VIEW: 2
                    };
                    var destroyClosedChatWatcher = angular.noop;
                    var isChatClosed = true;
                    var WATCH_ON = true, WATCH_OFF = false;

                    scope.d = {};
                    scope.d.selectedChatter = {};
                    scope.d.chatData = {};
                    scope.d.chatData.localUser = scope.localUser;
                    scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                    scope.d.maxNumUnseenMessages = ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES;

                    scope.d.actions = {};

                    znkChatSrv.getChatGuidsByUid(scope.localUser.uid, scope.localUser.isTeacher).then(function (chatGuidsObj) {
                        scope.d.chatData.localUserChatsGuidsArr = UtilitySrv.object.convertToArray(chatGuidsObj);
                    });

                    scope.d.selectChatter = function (chatter) {
                        if (angular.isUndefined(chatter.chatGuid)) {
                            znkChatSrv.createNewChat(scope.localUser, chatter).then(function (chatGuid) {
                                chatter.chatGuid = chatGuid;
                                _chatterSelected(chatter);
                            });
                        } else {
                            _chatterSelected(chatter);
                        }
                    };

                    function _chatterSelected(chatter) {
                        scope.d.selectedChatter.isActive = false;
                        scope.d.selectedChatter = chatter;
                        if (isChatClosed) {
                            return;
                        }

                        scope.d.selectedChatter.isActive = true;
                        scope.d.selectedChatter.messagesNotSeen = 0;
                        if (chatter.chatMessages.length > 0) {
                            var message = chatter.chatMessages[chatter.chatMessages.length - 1];
                            var lastSeenMessage = {};
                            lastSeenMessage.time = message.time;
                            lastSeenMessage.messageId = message.id;
                            scope.d.selectedChatter.lastSeenMessage = lastSeenMessage;
                            znkChatSrv.updateLasSeenMessage(chatter.chatGuid, scope.localUser.uid, lastSeenMessage);
                        }
                    }

                    function _closedChatHandler(watch) {
                        if (watch) {
                            destroyClosedChatWatcher.chatters = scope.$watch('d.chatData.chatParticipantsArr', function () {
                                _countUnseenMessages();
                            }, true);

                            destroyClosedChatWatcher.support = scope.$watch('d.chatData.support && d.chatData.support.messagesNotSeen', function () {
                                _countUnseenMessages();
                            });

                        } else {
                            destroyClosedChatWatcher.chatters();
                            destroyClosedChatWatcher.support();
                        }
                    }

                    function _countUnseenMessages() {
                        scope.d.numOfNotSeenMessages = 0;
                        var chatParticipantsArr = scope.d.chatData.chatParticipantsArr;
                        var supportObj = scope.d.chatData.support;

                        if (angular.isArray(chatParticipantsArr)) {
                            for (var i = 0; i < chatParticipantsArr.length; i++) {
                                if (chatParticipantsArr[i].messagesNotSeen > 0) {
                                    scope.d.numOfNotSeenMessages += chatParticipantsArr[i].messagesNotSeen;
                                }
                            }
                        }

                        if (angular.isDefined(supportObj)) {
                            if (supportObj.messagesNotSeen > 0) {
                                scope.d.numOfNotSeenMessages += supportObj.messagesNotSeen;
                            }
                        }
                        scope.d.numOfNotSeenMessages = (scope.d.numOfNotSeenMessages < ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES) ? scope.d.numOfNotSeenMessages : ZNK_CHAT.MAX_NUM_UNSEEN_MESSAGES;
                    }

                    _closedChatHandler(WATCH_ON);        // indication to new messages when the chat is closed


                    scope.d.openChat = function () {
                        if (scope.d.actions.scrollToLastMessage) {
                            scope.d.actions.scrollToLastMessage();
                        }

                        $timeout(function () {
                            element[0].querySelector('.chat-textarea').focus();
                        });
                        scope.d.chatStateView = scope.statesView.CHAT_VIEW;
                        isChatClosed = false;
                        if (angular.isDefined(scope.d.selectedChatter.uid)) {
                            scope.d.selectChatter(scope.d.selectedChatter);
                        }
                        _closedChatHandler(WATCH_OFF);
                    };

                    scope.d.closeChat = function () {
                        scope.d.chatStateView = scope.statesView.CHAT_BUTTON_VIEW;
                        isChatClosed = true;
                        scope.d.selectedChatter.isActive = false;
                        _closedChatHandler(WATCH_ON);
                    };
                }
            };
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').constant('ZNK_CHAT', {
        MAX_NUM_UNSEEN_MESSAGES: 10,
        SUPPORT_EMAIL: 'support@zinkerz.com',
        STUDENT_STORAGE: 0,
        TEACHER_STORAGE: 1,
        SOUND_PATH: '/assets/sounds/'
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').provider('znkChatDataSrv',
        function () {
            'ngInject';

            var znkChatPathsObj = {};
            var buildNewChatterFnGetter;

            this.setChatPaths = function (chatPathsObj) {
                znkChatPathsObj = chatPathsObj;
            };

            this.setBuildChatterFnGetter = function (buildChatterFn) {
                buildNewChatterFnGetter = buildChatterFn;
            };

            this.$get = ["$injector", function ($injector) {
                var znkChat = {};

                znkChat.getChatPaths = function () {
                    return znkChatPathsObj;
                };

                znkChat.buildNewChatter = function (user, userId) {
                    var buildNewChatter = $injector.invoke(buildNewChatterFnGetter);
                    return buildNewChatter(user, userId);
                };

                return znkChat;
            }];

        }
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatEventSrv',
        ["$q", "InfraConfigSrv", "ENV", "znkChatDataSrv", "ZNK_CHAT", function ($q, InfraConfigSrv, ENV, znkChatDataSrv, ZNK_CHAT) {
            'ngInject';

            var self = this;
            var appContext = ENV.appContext;
            var oppositeStorageType = appContext === 'student' ? ZNK_CHAT.TEACHER_STORAGE : ZNK_CHAT.STUDENT_STORAGE;
            var storageType = appContext === 'student' ? ZNK_CHAT.STUDENT_STORAGE : ZNK_CHAT.TEACHER_STORAGE;

            var studentStorage = InfraConfigSrv.getStudentStorage();
            var teacherStorage = InfraConfigSrv.getTeacherStorage();
            function _getUserStorage(type) {
                if (type === ZNK_CHAT.STUDENT_STORAGE) {
                    return studentStorage;
                }
                if (type === ZNK_CHAT.TEACHER_STORAGE) {
                    return teacherStorage;
                }
            }

            function _getGlobalStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.registerMessagesEvent = function (type, path, callback) {
                return _getGlobalStorage(oppositeStorageType).then(function (userStorage) {
                    var adapterRef = userStorage.adapter.getRef(path);
                    adapterRef.orderByKey().limitToLast(10).on(type, callback);
                });
            };

            self.registerNewChatEvent = function (type, path, callback) {
                return _getUserStorage(oppositeStorageType).then(function (userStorage) {
                    var adapterRef = userStorage.adapter.getRef(path);
                    adapterRef.orderByKey().limitToLast(1).on(type, callback);
                });
            };

            var getChattersCb;
            function _buildChatterObject(callback) {
                if (angular.isUndefined(getChattersCb)) {
                    getChattersCb = function (user, UserUid) {
                        znkChatDataSrv.buildNewChatter(user, UserUid).then(function (newChatter) {
                            callback(newChatter);
                        });
                    };
                }
                return getChattersCb;
            }

            self.getChattersListener = function (path, callback) {
                return _getUserStorage(storageType).then(function (userStorage) {
                    userStorage.onEvent('child_added', path, _buildChatterObject(callback));
                });
            };

            self.offMsgOrNewChatEvent = function (type, path, callback) {
                return _getUserStorage(oppositeStorageType).then(function (userStorage) {
                    var userStorageRef = userStorage.adapter.getRef();  // the event was registered outside storageSrv so it must unregistered outside also
                    var eventPath = userStorageRef.child(path);
                    eventPath.off(type, callback);
                });
            };

            self.offNewChatterEvent = function (path) {
                return _getUserStorage(storageType).then(function (userStorage) {
                    userStorage.offEvent('child_added', path, getChattersCb);
                });
            };

        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkChat').service('znkChatSrv',
        ["InfraConfigSrv", "$q", "UserProfileService", "znkChatDataSrv", "$log", "UtilitySrv", function (InfraConfigSrv, $q, UserProfileService, znkChatDataSrv, $log, UtilitySrv) {
            'ngInject';

            var self = this;
            var znkChatPaths = znkChatDataSrv.getChatPaths();

            function _getUserStorage(isTeacher) {
                if (isTeacher) {
                    return InfraConfigSrv.getTeacherStorage();
                } else {
                    return InfraConfigSrv.getStudentStorage();
                }
            }

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            self.getChatGuidsByUid = function (uid, isTeacher) {
                return _getUserStorage(isTeacher).then(function (userStorage) {
                    var chatsGuidsPath = znkChatPaths.chatsUsersGuids.replace('$$uid', uid);
                    return userStorage.get(chatsGuidsPath).then(function (chatsGuids) {
                        return UtilitySrv.object.convertToArray(chatsGuids);
                    });
                });
            };

            self.updateChat = function (chatGuid, newMessage) {
                return _getStorage().then(function (globalStorage) {
                    var messagesPath = znkChatPaths.chatPath + '/' + chatGuid + '/messages';
                    var adapterRef = globalStorage.adapter.getRef(messagesPath);
                    var messageGuid = adapterRef.push(newMessage).key();
                    return messageGuid;

                });
            };

            self.updateLasSeenMessage = function (chatGuid, userId, lastSeenMessage) {
                return _getStorage().then(function (globalStorage) {
                    var notSeenMessagesPath = znkChatPaths.chatPath + '/' + chatGuid + '/usersLastSeenMessage/' + userId;
                    globalStorage.update(notSeenMessagesPath, lastSeenMessage);
                });
            };

            self.getLastSeenMessage = function (chatGuid, userId) {
                return _getStorage().then(function (globalStorage) {
                    var notSeenMessagesPath = znkChatPaths.chatPath + '/' + chatGuid + '/usersLastSeenMessage/' + userId;
                    return globalStorage.get(notSeenMessagesPath).then(function (lastSeenMessage) {
                        return lastSeenMessage;
                    });
                });
            };

            self.getChatGuidByTwoGuidsArray = function (chatGuidArr1, chatGuidArr2) {
                if (chatGuidArr1.length === 0 || chatGuidArr2.length === 0) {
                    return;
                }
                for (var i = 0; i < chatGuidArr1.length; i++) {
                    for (var j = 0; j < chatGuidArr2.length; j++) {
                        if (chatGuidArr1[i] === chatGuidArr2[j]) {
                            return chatGuidArr2[j];
                        }
                    }
                }
                return undefined;
            };

            self.createNewChat = function (localUser, secondUser) {
                return _getStorage().then(function (globalStorage) {
                    var chatPath = znkChatPaths.chatPath;
                    var chatGuid;

                    var adapterRef = globalStorage.adapter.getRef();
                    var chatsRef = adapterRef.child(chatPath);
                    var newChatObj = _createNewChatObj(localUser, secondUser);
                    chatGuid = chatsRef.push(newChatObj).key();

                    var localUserPath = localUser.isTeacher ? znkChatPaths.dashboardAppName + '/' : znkChatPaths.studentAppName + '/';
                    var secondUserPath = secondUser.isTeacher ?znkChatPaths.dashboardAppName + '/' : znkChatPaths.studentAppName + '/';

                    localUserPath += znkChatPaths.chatsUsersGuids.replace('$$uid', localUser.uid);
                    secondUserPath += znkChatPaths.chatsUsersGuids.replace('$$uid', secondUser.uid);

                    var localUserRef = adapterRef.child(localUserPath);
                    var chatterRef = adapterRef.child(secondUserPath);

                    var userNewChatGuid = {};
                    userNewChatGuid[chatGuid] = chatGuid;

                    var localUserWriteChatGuidsProm = localUserRef.update(userNewChatGuid);
                    var secondUserWriteChatGuidsProm = chatterRef.update(userNewChatGuid);
                    return $q.all([localUserWriteChatGuidsProm, secondUserWriteChatGuidsProm]).then(function () {
                        return chatGuid;
                    },function(error){
                        $log.error('znkChat: error while creating new chat: ' + error);
                    });
                });
            };

            function _createNewChatObj(firstUser, secondCUser) {
                var newChatObj = {};
                newChatObj.uids = {};
                newChatObj.uids[firstUser.uid] = {
                    isTeacher: firstUser.isTeacher
                };
                newChatObj.uids[secondCUser.uid] = {
                    isTeacher: secondCUser.isTeacher
                };
                newChatObj.usersLastSeenMessage = {};
                newChatObj.usersLastSeenMessage[firstUser.uid] = {
                    time: 0
                };
                newChatObj.usersLastSeenMessage[secondCUser.uid] = {
                    time: 0
                };
                return newChatObj;
            }
        }]
    );
})(angular);

angular.module('znk.infra.znkChat').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkChat/svg/znk-chat-chat-icon.svg",
    "<svg\n" +
    "    id=\"Layer_1\"\n" +
    "    xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "    x=\"0px\" y=\"0px\"\n" +
    "    viewBox=\"0 0 200 178.1\"\n" +
    "    class=\"znk-chat-chat-icon\">\n" +
    "    <style>\n" +
    "        .znk-chat-chat-icon{\n" +
    "        width:25px;\n" +
    "        height:25px;\n" +
    "        enable-background:new 0 0 200 178.1;\n" +
    "        }\n" +
    "    </style>\n" +
    "\n" +
    "    <g id=\"XMLID_14_\">\n" +
    "        <path id=\"XMLID_42_\" d=\"M2.4,71.1c1.6-5.4,2.7-11,5-16.2c9.7-22.2,27.1-36.4,49.2-44.5C98.3-4.8,137.7-0.4,172.8,28.2\n" +
    "		c13.1,10.7,21.4,24.6,24.1,41.7c0.1,0.4,0.5,0.8,0.7,1.2c0,4.9,0,9.8,0,14.6c-1.5,5.1-2.6,10.4-4.6,15.3\n" +
    "		c-8.3,20.4-23.8,33.8-43.2,42.9c-21.8,10.3-44.7,13.1-68.5,9.6c-2.3-0.3-4.9,0.1-7,0.9c-17.8,7-35.6,14.2-53.4,21.2\n" +
    "		c-1.9,0.7-4.2,0.4-6.4,0.6c-0.2-2.3-0.9-4.7-0.4-6.8c3.2-12.9,6.7-25.8,9.8-38.7c0.4-1.6,0.1-4-0.9-5.1C12.6,114.8,5.4,102.2,3,87\n" +
    "		c-0.1-0.5-0.4-0.9-0.6-1.3C2.4,80.9,2.4,76,2.4,71.1z M22.3,167.2c2.4-0.9,3.9-1.3,5.3-1.9c15.5-6.2,31-12.4,46.6-18.6\n" +
    "		c1.6-0.6,3.4-1.1,5.1-1c5.8,0.5,11.6,1.7,17.4,1.8c26,0.6,50.1-5.3,70.3-22.4c19-16.1,27.7-36.3,21.2-61.2\n" +
    "		c-5-19.1-18.1-32-34.8-41.3c-20.6-11.4-42.8-14.7-66-12.5c-18.4,1.8-35.5,7.6-50.5,18.8C22.5,39.6,12.6,53.3,10.2,71.4\n" +
    "		c-2.5,19.9,4.8,36.3,19,49.9c3,2.9,3.8,5.4,2.6,9.4c-1.8,5.7-3.1,11.6-4.6,17.4C25.6,154.1,24.1,160.2,22.3,167.2z\"/>\n" +
    "        <path id=\"XMLID_36_\" d=\"M103.6,62.3c-14.1,0-28.3,0-42.4,0c-1.1,0-2.5,0.4-3.4-0.1c-1.4-0.9-3.1-2.3-3.5-3.7\n" +
    "		c-0.2-0.8,1.9-2.5,3.3-3.3c0.8-0.5,2.2-0.2,3.4-0.2c28.6,0,57.2,0,85.8,0c1,0,2.2-0.3,2.9,0.1c1.4,1,2.5,2.4,3.8,3.7\n" +
    "		c-1.3,1.2-2.6,3.2-4,3.3c-4.3,0.4-8.8,0.2-13.1,0.2C125.4,62.3,114.5,62.3,103.6,62.3z\"/>\n" +
    "        <path id=\"XMLID_35_\" d=\"M104,76c14.5,0,28.9,0,43.4,0c2.7,0,5.8-0.1,5.9,3.4c0.2,3.9-3.1,3.8-6,3.8c-29.1,0-58.2,0-87.2,0\n" +
    "		c-2.6,0-5.8,0.3-5.9-3.4c-0.1-4,3.1-3.8,5.9-3.8C74.8,76,89.4,76,104,76z\"/>\n" +
    "        <path id=\"XMLID_34_\" d=\"M86.8,104.2c-8.9,0-17.9,0-26.8,0c-2.7,0-5.7,0-5.8-3.5c-0.2-3.7,2.8-3.8,5.5-3.8c18.2,0,36.4,0,54.6,0\n" +
    "		c2.5,0,5.2,0.1,5.3,3.5c0.1,3.7-2.7,3.8-5.5,3.8C105,104.2,95.9,104.2,86.8,104.2z\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkChat/svg/znk-chat-close-icon.svg",
    "<svg\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    class=\"znk-chat-close-icon\"\n" +
    "    viewBox=\"-596.6 492.3 133.2 133.5\">\n" +
    "    <style>\n" +
    "        .znk-chat-close-icon {\n" +
    "        width:12px;\n" +
    "        height:12px;\n" +
    "        }\n" +
    "    </style>\n" +
    "    <path class=\"st0\"/>\n" +
    "    <g>\n" +
    "        <line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "        <line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkChat/templates/chatBoard.template.html",
    "<div class=\"chat-board-wrapper\">\n" +
    "    <div class=\"chat-board-header\">\n" +
    "        <chatter ng-if=\"chatterObj.uid\" chatter-obj=\"chatterObj\"></chatter>\n" +
    "        <svg-icon name=\"znk-chat-close-icon\" ng-click=\"d.closeChat()\"></svg-icon>\n" +
    "    </div>\n" +
    "    <div class=\"board-wrapper\">\n" +
    "        <div class=\"messages-container\">\n" +
    "            <div class=\"messages-wrapper znk-scrollbar\">\n" +
    "                <div class=\"message-repeater\" ng-repeat=\"message in chatterObj.chatMessages | orderBy:'time'\">\n" +
    "                    <chat-message\n" +
    "                        show-date=\"d.showDate\"\n" +
    "                        last-message=\"$index === chatterObj.chatMessages.length-1\"\n" +
    "                        scroll-to-last-message=\"d.scrollToLastMessage\"\n" +
    "                        local-user-id=\"userId\"\n" +
    "                        message=\"message\">\n" +
    "                    </chat-message>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <textarea class=\"chat-textarea\"\n" +
    "            placeholder=\"{{ 'ZNK_CHAT.PLACEHOLDER' | translate }}\"\n" +
    "            ng-keydown=\"d.sendMessage($event)\"\n" +
    "            ng-model=\"d.newMessage\">\n" +
    "            </textarea>\n" +
    "    </div>\n" +
    "\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkChat/templates/chatParticipants.template.html",
    "<div class=\"chat-participants\">\n" +
    "    <div class=\"my-chat-title\" translate=\".MY_CHAT\"></div>\n" +
    "\n" +
    "    <div class=\"chatter-drv-wrapper support-chat-wrapper\"\n" +
    "         ng-click=\"d.selectChatter(d.chatData.support)\"\n" +
    "         ng-if=\"d.chatData.support && d.chatData.support.uid\"\n" +
    "         ng-class=\"{'selected-chatter': d.chatData.support.isActive}\">\n" +
    "        <chatter\n" +
    "            set-first-chatter=\"d.selectChatter(d.chatData.support)\"\n" +
    "            chat-data=\"d.chatData\"\n" +
    "            local-user=\"d.chatData.localUser\"\n" +
    "            local-user-chats-guids-arr=\"d.chatData.localUserChatsGuidsArr\"\n" +
    "            chatter-obj=\"d.chatData.support\">\n" +
    "        </chatter>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"chatter-repeater-wrapper znk-scrollbar\">\n" +
    "        <div class=\"chatter-repeater\" ng-repeat=\"chatter in d.chatData.chatParticipantsArr | orderBy:'name' | orderBy:'-messagesNotSeen'\">\n" +
    "            <div class=\"chatter-drv-wrapper\"\n" +
    "                 ng-click=\"d.selectChatter(chatter)\"\n" +
    "                 ng-class=\"{'selected-chatter': chatter.isActive}\">\n" +
    "                <chatter\n" +
    "                    set-first-chatter=\"$index === 0 && (!d.chatData.support || !d.chatData.support.uid) ? d.selectChatter(chatter) : null\"\n" +
    "                    chat-data=\"d.chatData\"\n" +
    "                    local-user=\"d.chatData.localUser\"\n" +
    "                    local-user-chats-guids-arr=\"d.chatData.localUserChatsGuidsArr\"\n" +
    "                    chatter-obj=\"chatter\">\n" +
    "                </chatter>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkChat/templates/chatter.template.html",
    "<div class=\"chatter-wrapper\"\n" +
    "     ng-class=\"{'offline': chatterObj.presence === d.userStatus.OFFLINE,\n" +
    "     'online': chatterObj.presence === d.userStatus.ONLINE,\n" +
    "     'idle': chatterObj.presence === vm.userStatus.IDLE}\">\n" +
    "    <div class=\"online-indicator\"></div>\n" +
    "    <div class=\"chatter-name\">{{chatterObj.name}}</div>\n" +
    "    <div class=\"message-not-seen\"\n" +
    "         ng-class=\"{'ten-or-more-unseen-messages': chatterObj.messagesNotSeen >= d.maxNumUnseenMessages}\"\n" +
    "         ng-if=\"chatterObj.messagesNotSeen > 0\">\n" +
    "        {{chatterObj.messagesNotSeen}}\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkChat/templates/znkChat.template.html",
    "<div class=\"znk-chat-wrapper\" ng-switch=\"d.chatStateView\" translate-namespace=\"ZNK_CHAT\">\n" +
    "    <div class=\"button-wrapper\" ng-show=\"d.chatStateView === statesView.CHAT_BUTTON_VIEW\" ng-click=\"d.openChat()\">\n" +
    "        <div class=\"unseen-messages\"\n" +
    "             ng-class=\"{'ten-or-more-unseen-messages': d.numOfNotSeenMessages >=  d.maxNumUnseenMessages}\"\n" +
    "             ng-if=\"d.numOfNotSeenMessages > 0\">\n" +
    "            {{d.numOfNotSeenMessages}}\n" +
    "        </div>\n" +
    "        <svg-icon name=\"znk-chat-chat-icon\"></svg-icon>\n" +
    "    </div>\n" +
    "\n" +
    "    <div class=\"chat-container\" ng-show=\"d.chatStateView === statesView.CHAT_VIEW\">\n" +
    "        <chat-participants\n" +
    "            ng-if=\"::d.chatData.localUserChatsGuidsArr\"\n" +
    "            chat-data=\"d.chatData\"\n" +
    "            select-chatter=\"d.selectChatter\">\n" +
    "        </chat-participants>\n" +
    "\n" +
    "        <chat-board\n" +
    "            actions=\"d.actions\"\n" +
    "            user-id=\"localUser.uid\"\n" +
    "            close-chat=\"d.closeChat\"\n" +
    "            chatter-obj=\"d.selectedChatter\">\n" +
    "        </chat-board>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', [
        'ngAnimate',
        'pascalprecht.translate',
        'znk.infra.znkQuestionReport',
        'znk.infra.svgIcon',
        'znk.infra.scroll',
        'znk.infra.autofocus',
        'znk.infra.exerciseUtility',
        'znk.infra.analytics',
        'znk.infra.popUp',
        'znk.infra.user'
    ])
    .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'znk-exercise-chevron': 'components/znkExercise/svg/chevron-icon.svg',
                'znk-exercise-eraser': 'components/znkExercise/svg/tools-eraser.svg',
                'znk-exercise-pencil': 'components/znkExercise/svg/tools-pencil.svg',
                'znk-exercise-pointer': 'components/znkExercise/svg/tools-pointer.svg',
                'znk-exercise-remove': 'components/znkExercise/svg/tools-remove.svg',
                'znk-exercise-touche': 'components/znkExercise/svg/tools-touche.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    var typeToViewMap;
    angular.module('znk.infra.znkExercise').directive('answerBuilder', [
        '$compile', 'AnswerTypeEnum', 'ZnkExerciseUtilitySrv', 'ZnkExerciseViewModeEnum',
        function ($compile, AnswerTypeEnum, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum) {
            if(!typeToViewMap) {
                typeToViewMap = {};
                angular.forEach(AnswerTypeEnum, function (enumData, enumName) {
                    var directiveName = enumName.toLowerCase().replace(/_/g, '-');
                    typeToViewMap[enumData.enum] = '<' + directiveName + '></' + directiveName + '>';
                });
            }

            return {
                require: ['answerBuilder','^questionBuilder', '^ngModel'],
                restrict: 'E',
                controller:[
                    function(){

                    }
                ],
                link: {
                    pre:function (scope, element, attrs, ctrls) {
                        var answerBuilderCtrl = ctrls[0];
                        var questionBuilderCtrl = ctrls[1];
                        var ngModelCtrl = ctrls[2];

                        var fnToBindFromQuestionBuilder = ['getViewMode', 'getCurrentIndex'];
                        ZnkExerciseUtilitySrv.bindFunctions(answerBuilderCtrl,questionBuilderCtrl,fnToBindFromQuestionBuilder);

                        answerBuilderCtrl.canUserAnswerBeChanged = function(){
                            var viewMode = questionBuilderCtrl.getViewMode();
                            var isntReviewMode = viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                            var notAnswered = angular.isDefined(ngModelCtrl.$viewValue);
                            var isAnswerWithResultViewMode = viewMode === ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                            return isntReviewMode && isAnswerWithResultViewMode && notAnswered;
                        };

                        answerBuilderCtrl.question = questionBuilderCtrl.question;

                        var answerType = questionBuilderCtrl.question.answerTypeId;
                        var answerHtml = typeToViewMap[answerType];
                        element.html(answerHtml);
                        $compile(element.contents())(scope);
                    }
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseAnswersSrv', function () {
        this.config = {
            selectAnswer:{}
        };

        var selectAnswer = {};

        this.config.selectAnswer.setAnswerIndexFormatter = function(fn){
            selectAnswer.answerIndexFormatter = fn;
        };

        this.$get = [
            function () {
                var ZnkExerciseAnswersSrv = {
                    selectAnswer: {}
                };

                ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex = function(answerIndex){
                    var formattedAnswerIndex;

                    if(selectAnswer.answerIndexFormatter){
                        formattedAnswerIndex = selectAnswer.answerIndexFormatter.apply(this,arguments);
                    }

                    if(angular.isUndefined(formattedAnswerIndex)){
                        var UPPER_A_ASCII_CODE = 65;
                        formattedAnswerIndex  = String.fromCharCode(UPPER_A_ASCII_CODE + answerIndex);
                    }

                    return formattedAnswerIndex;
                };

                return ZnkExerciseAnswersSrv;
            }
        ];
    });
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('markup', [
        '$window',
        function ($window) {
            var _isMobile = false;//MobileSrv.isMobile();
            var MAX_IMAGE_WIDTH = 275;
            var dummyElem = angular.element('<P/>');
            return {
                replace: true,
                restrict: 'E',
                link: function (scope, element, attrs) {

                    var toDomElement = function domElement(markup) {
                        dummyElem.append(markup);
                        return dummyElem.contents();
                    };

                    var imageStyle = function imageStyle(image){
                        var _style = {
                            width: '',
                            height: ''
                        };

                        if(image.style.width){
                            var _height = image.style.height;
                            var _width = image.style.width;

                            _height = _height.replace('px','');
                            _width = _width.replace('px','');

                            if(!isNaN(_width)){
                                _width = parseInt(_width);

                                while(_width > MAX_IMAGE_WIDTH){
                                    _width = _width * 0.90;
                                    _height = _height * 0.90;
                                }
                                _style.width = _width + 'px';
                                _style.height = _height + 'px';
                            }
                        }
                        return _style;
                    };

                    var resizeImages = function resizeImages(domElement){
                        var style;

                        for(var i=0; i<domElement.length; i++ ){

                            if(domElement[i].tagName && domElement[i].tagName.toLowerCase() === 'img')
                            {
                                if(domElement[i].style.width){
                                    style = imageStyle(domElement[i]);
                                    domElement[i].style.width = style.width;
                                    domElement[i].style.height = style.height;
                                }
                            }
                            else{
                                var _images = angular.element(domElement[i]).find('img');
                                if(_images.length){
                                    for(var x=0; x<_images.length; x++){
                                        if(_images[x].style.width){
                                            style = imageStyle(_images[x]);
                                            _images[x].style.width = style.width;
                                            _images[x].style.height = style.height;
                                        }
                                    }
                                }
                            }
                        }

                        return domElement;
                    };

                    var removeLeftMargin = function removeLeftMargin(domElement){

                        for(var i=0; i<domElement.length; i++){

                            if(domElement[i].tagName && domElement[i].tagName.toLowerCase() === 'p')
                            {
                                if(!domElement[i].style) {
                                    break;
                                }

                                var marginLeft = domElement[i].style.marginLeft;
                                marginLeft = marginLeft ?  marginLeft.replace('px','') : marginLeft;

                                if(marginLeft && !isNaN(marginLeft))
                                {
                                    domElement[i].style.marginLeft = 0;
                                }
                            }
                        }

                        return domElement;
                    };

                    var watchDestroyer = scope.$watch(attrs.content,function(newVal){
                        if(!!newVal){

                            if(_isMobile){
                                MAX_IMAGE_WIDTH= ($window.innerWidth / 1.05);
                            }
                            else{
                                MAX_IMAGE_WIDTH= ($window.innerWidth / 1.25);
                            }

                            var _domElements = toDomElement(newVal);
                            if(_domElements) {
                                var _newDomElements = resizeImages(_domElements);

                                //remove left margin from <p> tag
                                _newDomElements = removeLeftMargin(_newDomElements);

                                element.append(_newDomElements);
                            }

                            watchDestroyer();
                        }
                    });
                }
            };
        }
    ]);
})(angular);


'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('arrayToStringFmtr', [
        function () {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelCtrl) {
                    function parser(val){
                        if(!val || !val.length){
                            return undefined;
                        }
                        return val.join('');
                    }
                    ngModelCtrl.$parsers.push(parser);

                    function formatter(val){
                        if (!val || !val.length) {
                            return [];
                        }
                        return val.match(/.{1}/g);
                    }
                    ngModelCtrl.$formatters.push(formatter);
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('BaseZnkExerciseController',
        ["$scope", "exerciseData", "exerciseSettings", "$state", "$q", "ExerciseTypeEnum", "$location", "ExerciseResultSrv", "ZnkExerciseSrv", "$filter", "PopUpSrv", "exerciseEventsConst", "$rootScope", "ZnkExerciseUtilitySrv", "ZnkExerciseViewModeEnum", "SubjectEnum", "znkAnalyticsSrv", "$translate", "$log", "StatsEventsHandlerSrv", function ($scope, exerciseData, exerciseSettings, $state, $q, ExerciseTypeEnum, $location, ExerciseResultSrv, ZnkExerciseSrv,
                  $filter, PopUpSrv, exerciseEventsConst, $rootScope, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum, SubjectEnum,
                  znkAnalyticsSrv, $translate, $log, StatsEventsHandlerSrv) {
            'ngInject';

            var exercise = exerciseData.exercise;
            var exerciseResult = exerciseData.exerciseResult;
            var exerciseTypeId = exerciseData.exerciseTypeId;
            var isSection = exerciseTypeId === ExerciseTypeEnum.SECTION.enum;
            var initSlideIndex;

            function getNumOfUnansweredQuestions(questionsResults) {
                var numOfUnansweredQuestions = questionsResults.length;
                var keysArr = Object.keys(questionsResults);
                angular.forEach(keysArr, function (i) {
                    var questionAnswer = questionsResults[i];
                    if (angular.isDefined(questionAnswer.userAnswer)) {
                        numOfUnansweredQuestions--;
                    }
                });
                return numOfUnansweredQuestions;
            }

            function _getAllowedTimeForExercise() {
                if (exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                    return exercise.time;
                }

                var allowedTimeForQuestion = ZnkExerciseSrv.getAllowedTimeForQuestion(exerciseTypeId);
                return allowedTimeForQuestion * exercise.questions.length;
            }

            function _finishExercise() {
                exerciseResult.isComplete = true;
                exerciseResult.endedTime = Date.now();
                exerciseResult.$save();

                //  stats exercise data
                StatsEventsHandlerSrv.addNewExerciseResult(exerciseTypeId, exercise, exerciseResult).then(function () {
                    $scope.baseZnkExerciseCtrl.settings.viewMode = ZnkExerciseViewModeEnum.REVIEW.enum;

                    var exerciseTypeValue = ExerciseTypeEnum.getValByEnum(exerciseData.exerciseTypeId).toLowerCase();
                    var broadcastEventName = exerciseEventsConst[exerciseTypeValue].FINISH;
                    $rootScope.$broadcast(broadcastEventName, exercise, exerciseResult, exerciseData.examData);

                    $state.go('^.summary');
                });
            }

            if (!$scope.baseZnkExerciseCtrl) {
                $scope.baseZnkExerciseCtrl = {};
            }

            if (angular.isUndefined(exerciseResult.startedTime)) {
                exerciseResult.startedTime = Date.now();
            }

            exerciseData.exercise.questions = exerciseData.exercise.questions.sort(function (a, b) {
                return a.order - b.order;
            });

            if (!angular.isArray(exerciseResult.questionResults) || exerciseResult.questionResults.length === 0) {
                exerciseResult.questionResults = exercise.questions.map(function (question) {
                    return {
                        questionId: question.id,
                        categoryId: question.categoryId
                    };
                });
            }

            ZnkExerciseUtilitySrv.setQuestionsGroupData(exercise.questions, exercise.questionsGroupData);

            $scope.baseZnkExerciseCtrl.exercise = exercise;
            $scope.baseZnkExerciseCtrl.resultsData = exerciseResult;
            $scope.baseZnkExerciseCtrl.numberOfQuestions = $scope.baseZnkExerciseCtrl.exercise.questions.length;

            var viewMode;
            if (exerciseResult.isComplete) {
                viewMode = ZnkExerciseViewModeEnum.REVIEW.enum;
                initSlideIndex = 0;
            } else {
                viewMode = isSection ? ZnkExerciseViewModeEnum.ONLY_ANSWER.enum : ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                initSlideIndex = exerciseResult.questionResults.findIndex(function (question) {
                    return !question.userAnswer;
                });

                if (initSlideIndex === -1) {
                    initSlideIndex = 0;
                }
            }

            var defExerciseSettings = {
                onDone: function onDone() {
                    var numOfUnansweredQuestions = getNumOfUnansweredQuestions(exerciseResult.questionResults);

                    var areAllQuestionsAnsweredProm = $q.when(true);
                    if (numOfUnansweredQuestions) {
                        var contentProm = $translate('ZNK_EXERCISE.SOME_ANSWER_LEFT_CONTENT');
                        var titleProm = $translate('ZNK_EXERCISE.FINISH_TITLE');
                        var buttonGoToProm = $translate('ZNK_EXERCISE.GO_TO_SUMMARY_BTN');
                        var buttonStayProm = $translate('ZNK_EXERCISE.STAY_BTN');

                        areAllQuestionsAnsweredProm = $q.all([contentProm, titleProm, buttonGoToProm, buttonStayProm]).then(function (results) {
                            var content = results[0];
                            var title = results[1];
                            var buttonGoTo = results[2];
                            var buttonStay = results[3];
                            return PopUpSrv.warning(title, content, buttonGoTo, buttonStay).promise;
                        }, function (err) {
                            $log.error(err);
                        });
                    }
                    areAllQuestionsAnsweredProm.then(function () {
                        _finishExercise(exerciseResult);
                    });
                },
                onQuestionAnswered: function onQuestionAnswered() {
                    exerciseResult.$save();
                },
                onSlideChange: function (currQuestion, currentIndex) {
                    var indexPlusOne = currentIndex + 1;
                    znkAnalyticsSrv.pageTrack({
                        props: {
                            url: $location.url() + '/index/' + indexPlusOne + '/questionId/' + (currQuestion.id || '')
                        }
                    });
                    $scope.baseZnkExerciseCtrl.currentIndex = indexPlusOne;
                },
                viewMode: viewMode,
                initSlideIndex: initSlideIndex || 0,
                allowedTimeForExercise: _getAllowedTimeForExercise()
            };

            $scope.baseZnkExerciseCtrl.settings = angular.extend(defExerciseSettings, exerciseSettings);
            $scope.baseZnkExerciseCtrl.settings.onExerciseReady = function () {
                if (exerciseSettings.onExerciseReady) {
                    exerciseSettings.onExerciseReady();
                }
            };

            $scope.baseZnkExerciseCtrl.startTime = exerciseResult.duration || 0;
            $scope.baseZnkExerciseCtrl.maxTime = exercise.time;

            $scope.baseZnkExerciseCtrl.timerData = {
                timeLeft: exercise.time - (exerciseResult.duration || 0),
                config: {
                    countDown: true
                }
            };

            $scope.baseZnkExerciseCtrl.onFinishTime = function () {
                var contentProm = $translate('ZNK_EXERCISE.TIME_UP_CONTENT');
                var titleProm = $translate('ZNK_EXERCISE.TIME_UP_TITLE');
                var buttonFinishProm = $translate('ZNK_EXERCISE.STOP');
                var buttonContinueProm = $translate('ZNK_EXERCISE.CONTINUE_BTN');

                $q.all([contentProm, titleProm, buttonFinishProm, buttonContinueProm]).then(function (results) {
                    var content = results[0];
                    var title = results[1];
                    var buttonFinish = results[2];
                    var buttonContinue = results[3];
                    var timeOverPopupPromise = PopUpSrv.ErrorConfirmation(title, content, buttonFinish, buttonContinue).promise;

                    timeOverPopupPromise.then(function () {
                        _finishExercise(exerciseResult);
                    });
                });
            };

            $scope.baseZnkExerciseCtrl.onChangeTime = function (passedTime) {
                exerciseResult.duration = passedTime;
            };
        }]);

})(angular);

(function (angular) {
    'use strict';

    var ZnkExerciseEvents = {
        BOOKMARK: 'znk exercise:bookmark',
        QUESTION_ANSWERED: 'znk exercise:question answered',
        READY: 'znk exercise: exercise ready',
        QUESTION_CHANGED: 'znk exercise: question changed',
        QUESTIONS_NUM_CHANGED: 'znk exercise: questions num changed',
        SLIDE_DIRECTION_CHANGED: 'znk exercise: slide direction changed'
    };
    angular.module('znk.infra.znkExercise').constant('ZnkExerciseEvents', ZnkExerciseEvents);
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionBuilder', [
        '$compile', 'QuestionTypesSrv', '$timeout', 'ZnkExerciseUtilitySrv',
        function ($compile, QuestionTypesSrv, $timeout, ZnkExerciseUtilitySrv) {
            return {
                restrict: 'E',
                require: ['questionBuilder', '^znkExercise'],
                scope: {
                    questionGetter: '&question'
                },
                controller: [
                    '$scope',
                    function ($scope) {
                        var self = this;

                        self.question = $scope.questionGetter();
                    }
                ],
                link: {
                    pre: function pre(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var functionsToBind = ['getViewMode','addQuestionChangeResolver','removeQuestionChangeResolver', 'getCurrentIndex'];
                        ZnkExerciseUtilitySrv.bindFunctions(questionBuilderCtrl, znkExerciseCtrl,functionsToBind);

                        questionBuilderCtrl.bindExerciseEventManager = znkExerciseCtrl.bindExerciseEventManager;
                    },
                    post: function post(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        QuestionTypesSrv.getQuestionHtmlTemplate(questionBuilderCtrl.question).then(function(result){
                            var questionHtmlTemplate = result;
                            element.append(questionHtmlTemplate);
                            var childScope = scope.$new(true);
                            $compile(element.contents())(childScope);
                        });

                        //after 2 digests at max the question should be rendered
                        var innerTimeout;
                        $timeout(function(){
                            innerTimeout = $timeout(function(){
                                znkExerciseCtrl.notifyQuestionBuilderReady(questionBuilderCtrl.question.__questionStatus.index);
                            });
                        },0,false);

                        questionBuilderCtrl.setViewValue = znkExerciseCtrl.setViewValue;

                        scope.$on('$destroy', function(){
                            $timeout.cancel(innerTimeout);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *      disableSwipe
 *      questions
 *      onQuestionAnswered
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionsCarousel', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseSlideDirectionEnum', '$timeout',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseSlideDirectionEnum, $timeout) {
            return {
                templateUrl: function(){
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'questionSwiperDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'questionSwiperMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                require: 'ngModel',
                scope:{
                    questionsGetter: '&questions',
                    onQuestionAnswered: '&'

                },
                link: function (scope, element, attrs, ngModelCtrl) {
                    scope.vm = {};

                    ngModelCtrl.$render = function(){
                        scope.vm.currSlideIndex = ngModelCtrl.$viewValue;
                    };

                    scope.vm.SlideChanged = function(){
                        ngModelCtrl.$setViewValue(scope.vm.currSlideIndex);
                    };


                    attrs.$observe('slideDirection',function(newSlideDirection){
                        var slideDirection = +newSlideDirection;
                        if(!scope.vm.swiperActions || isNaN(slideDirection)){
                            return;
                        }

                        switch (slideDirection){
                            case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                scope.vm.swiperActions.lockSwipes();
                                break;
                            case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                scope.vm.swiperActions.unlockSwipeToPrev();
                                scope.vm.swiperActions.lockSwipeToNext();
                                break;
                            case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                scope.vm.swiperActions.lockSwipeToPrev();
                                scope.vm.swiperActions.unlockSwipeToNext();
                                break;
                            default:
                                scope.vm.swiperActions.unlockSwipes();
                        }
                    });

                    scope.$watchGroup(['questionsGetter()', 'questionsGetter().length'],function(newValArr, oldValArr){
                        var newQuestionsArr = newValArr[0];
                        scope.vm.questions = newQuestionsArr || [];

                        var newNum = newValArr[1];
                        var oldNum = oldValArr[1];
                        if(oldNum && newNum !== oldNum){
                            $timeout(function(){
                                scope.vm.swiperActions.updateFollowingSlideAddition();
                            });
                        }
                    });
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *  prev-question
 *  next-question
 *  onDone
 *  questionsGetter
 *  actions:
 *      forceDoneBtnDisplay:
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseBtnSection', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum', '$q', 'ZnkExerciseSlideDirectionEnum',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents, ZnkExerciseViewModeEnum, $q, ZnkExerciseSlideDirectionEnum) {
            return {
                restrict: 'E',
                scope: {
                    prevQuestion: '&?',
                    nextQuestion: '&?',
                    onDone: '&',
                    questionsGetter: '&questions',
                    actions: '='
                },
                require: '^znkExercise',
                templateUrl: function () {
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'btnSectionDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'btnSectionMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                link: {
                    pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                        function _setCurrentQuestionIndex(index){
                            scope.vm.currentQuestionIndex = index || 0;
                        }

                        function _notReviewMode() {
                            return viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                        }

                        function _isLastQuestion(index, questions) {
                            return angular.isDefined(index) && index === (questions.length - 1);
                        }

                        function _determineDoneBtnDisplayStatus() {
                            var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                            var areAllQuestionsAnsweredProm = znkExerciseDrvCtrl.areAllQuestionsAnswered();
                            $q.all([getQuestionsProm, areAllQuestionsAnsweredProm]).then(function (results) {
                                if(isDoneBtnDisplayForced){
                                    return;
                                }
                                var questions = results[0];
                                var areAllQuestionsAnswered = results[1];

                                var currIndex = znkExerciseDrvCtrl.getCurrentIndex();

                                if (_notReviewMode() && (_isLastQuestion(currIndex, questions) || areAllQuestionsAnswered)) {
                                    _setDoneBtnStatus(true);
                                } else {
                                    _setDoneBtnStatus(false);
                                }
                            });
                        }

                        function _setDoneBtnStatus(showDoneBtn){
                            scope.vm.showDoneButton = !!showDoneBtn;

                            var znkExerciseElement = znkExerciseDrvCtrl.getElement();
                            if(showDoneBtn){
                                znkExerciseElement.addClass('done-btn-show');
                            }else{
                                znkExerciseElement.removeClass('done-btn-show');
                            }
                        }

                        function init(){
                            znkExerciseDrvCtrl.getQuestions().then(function (questions) {
                                scope.vm.maxQuestionIndex = questions.length - 1;
                            });
                            _setCurrentQuestionIndex(znkExerciseDrvCtrl.getCurrentIndex());
                        }

                        var viewMode = znkExerciseDrvCtrl.getViewMode();

                        scope.vm = {};

                        if(!scope.actions){
                            scope.actions = {};
                        }

                        var isDoneBtnDisplayForced;
                        scope.actions.forceDoneBtnDisplay = function(display){
                            isDoneBtnDisplayForced = display === false || display === true;

                            if(isDoneBtnDisplayForced){
                                _setDoneBtnStatus(display);
                            }else{
                                _determineDoneBtnDisplayStatus();
                            }
                        };

                        init();

                        scope.vm.prevQuestion = function () {
                            scope.prevQuestion();
                        };

                        scope.vm.nextQuestion = function () {
                            scope.nextQuestion();
                        };

                        znkExerciseDrvCtrl.notifyBtnSectionReady();

                        scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                            _setCurrentQuestionIndex(newIndex);
                            _determineDoneBtnDisplayStatus(newIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            _determineDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED, function(evt, newQuestionNum){
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            scope.vm.maxQuestionIndex = newQuestionNum - 1;
                            _determineDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.SLIDE_DIRECTION_CHANGED, function(evt, newDirection){
                            var slideDirectionEnum = ZnkExerciseSlideDirectionEnum.getNameToEnumMap();
                            switch(newDirection){
                                case slideDirectionEnum.NONE:
                                    scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = false;
                                    break;
                                case slideDirectionEnum.LEFT:
                                    scope.vm.slideLeftAllowed = true;
                                    scope.vm.slideRightAllowed = false;
                                    break;
                                case slideDirectionEnum.RIGHT:
                                    scope.vm.slideLeftAllowed = false;
                                    scope.vm.slideRightAllowed = true;
                                    break;
                                default:
                                    scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = true;
                                    break;
                            }
                        });

                        function keyboardClickCB(e){
                            var LEFT_ARROW_KEY = 37;
                            var RIGHT_ARROW_KEY = 39;

                            switch(e.keyCode){
                                case LEFT_ARROW_KEY:
                                    scope.vm.prevQuestion();
                                    break;
                                case RIGHT_ARROW_KEY:
                                    scope.vm.nextQuestion();
                                    break;
                            }
                        }
                        var body = document.body;
                        body.addEventListener('keyup',keyboardClickCB);

                        var currentQuestionAnsweredWatchFn;
                        if(_notReviewMode()){
                            currentQuestionAnsweredWatchFn = function(){
                                return znkExerciseDrvCtrl.isCurrentQuestionAnswered();
                            };
                            scope.$watch(currentQuestionAnsweredWatchFn,function(isAnswered){
                                scope.vm.isCurrentQuestionAnswered = !!isAnswered;
                            });
                        }

                        scope.$on('$destroy',function(){
                            body.removeEventListener('keyup',keyboardClickCB);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *
 *  actions:
 *      updateContainerSize
 *      lockSwipes
 *      lockSwipeToPrev
 *      lockSwipeToNext
 *      unlockSwipes
 *      unlockSwipeToPrev
 *      unlockSwipeToNext
 *      enableKeyboardControl
 *      disableKeyboardControl
 *      noSwiping
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkSwiper', [
        '$timeout', '$q',
        function ($timeout, $q) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkSwiperTemplate.html',
                replace: true,
                restrict: 'E',
                require: 'ngModel',
                scope:{},
                transclude: true,
                compile:function(){
                    var defer, swiperInstanceProm, swiperInstance;

                    function preLink(scope,element,attrs,ngModelCtrl){
                        defer = $q.defer();
                        swiperInstanceProm = defer.promise;

                        if(attrs.actions){
                            if(!scope.$parent.$eval(attrs.actions)){
                                scope.$parent.$eval(attrs.actions + '={}');
                            }
                            var actions = scope.$parent.$eval(attrs.actions);

                            var fnToBindFromSwiper = [
                                'lockSwipes', 'lockSwipeToPrev', 'lockSwipeToNext', 'unlockSwipes',
                                'unlockSwipeToPrev', 'unlockSwipeToNext', 'noSwiping'
                            ];
                            fnToBindFromSwiper.forEach(function(fnName){
                                actions[fnName] = function(){
                                    var fnArgs = arguments;
                                    swiperInstanceProm.then(function(){
                                        swiperInstance[fnName].apply(swiperInstance,fnArgs);
                                    });
                                };
                            });

                            actions.updateFollowingSlideAddition = function(){
                                return swiperInstanceProm.then(function(){
                                    swiperInstance.updateContainerSize();
                                    swiperInstance.updateSlidesSize();
                                });
                            };
                        }

                        ngModelCtrl.$render = function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            if(angular.isNumber(currSlideIndex)){
                                swiperInstanceProm.then(function(){
                                    swiperInstance.slideTo(currSlideIndex);
                                });
                            }
                        };

                        swiperInstanceProm.then(function(){
                            swiperInstance.on('onSlideChangeEnd',function(){
                                ngModelCtrl.$setViewValue(swiperInstance.activeIndex);
                            });
                        });

                        scope.$on('$destroy',function(){
                            if(swiperInstance){
                                swiperInstance.off('onSlideChangeEnd');
                                swiperInstance.destroy(true, true);
                                swiperInstance = null;
                            }
                        });
                    }

                    function postLink(scope,element,attrs,ngModelCtrl){
                        $timeout(function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;

                            currSlideIndex = Math.max(currSlideIndex, 0);

                            swiperInstance = new Swiper(element[0], {
                                initialSlide: currSlideIndex || 0,
                                onlyExternal: true
                            });
                            defer.resolve();
                        });
                    }

                    return {
                        pre: preLink,
                        post: postLink
                    };
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';
    angular.module('znk.infra.znkExercise').provider('QuestionTypesSrv', function QuestionTypesProvider() {
        var questionTypeToHtmlTemplateMap = {};
        this.setQuestionTypesHtmlTemplate = function (_questionTypeToHtmlTemplateMap) {
            questionTypeToHtmlTemplateMap = _questionTypeToHtmlTemplateMap;
        };

        var questionTypeGetterFn = angular.noop;
        this.setQuestionTypeGetter = function(typeGetterFn){
            questionTypeGetterFn = typeGetterFn;
        };

        this.$get = [
            '$log','$q',
            function ($log, $q) {
                var QuestionTypesSrv = {};

                QuestionTypesSrv.getQuestionHtmlTemplate = function getQuestionHtmlTemplate(question) {
                    return $q.when(questionTypeGetterFn(question)).then(function(questionType){
                        var questionTypeId = questionType;
                        if(!questionTypeToHtmlTemplateMap[questionTypeId]){
                            $log.error('QuestionTypesSrv: Template was not registered for the following question type:',questionTypeId);
                        }
                        return questionTypeToHtmlTemplateMap[questionTypeId];
                    });
                };

                QuestionTypesSrv.getQuestionType = function getQuestionType(question) {
                    return questionTypeGetterFn(question);
                };

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseSrv',
        function () {
            'ngInject';

            var exerciseTypeToAllowedQuestionTimeMap;
            this.setAllowedTimeForQuestionMap = function (_exerciseTypeToAllowedQuestionTimeMap) {
                exerciseTypeToAllowedQuestionTimeMap = _exerciseTypeToAllowedQuestionTimeMap;
            };

            var defaultBindExerciseKeys = [
                {
                    getterName: 'currSlideIndex',
                    setterName: 'setCurrentIndex'
                },
                {
                    getterName: 'answerExplanation'
                }
            ];

            var addBindExerciseKeys;

            var bindExerciseKeys;

            this.addBindExerciseKeys = function(_addBindExerciseKeys) {
                addBindExerciseKeys = _addBindExerciseKeys;
            };

            this.$get = ["EnumSrv", "$window", "PlatformEnum", "$log", function (EnumSrv, $window, PlatformEnum, $log) {
                'ngInject';//jshint ignore:line

                var platform = !!$window.ionic ? PlatformEnum.MOBILE.enum : PlatformEnum.DESKTOP.enum;
                var ZnkExerciseSrv = {};

                ZnkExerciseSrv.toolBoxTools = {
                    BLACKBOARD: 'blackboard',
                    MARKER: 'mar',
                    CALCULATOR: 'cal',
                    BOOKMARK: 'bookmark',
                    SHOW_PAGER: 'show pager'
                };

                function openExerciseToolBoxModal(/*toolBoxModalSettings*/) {
                    //var modalOptions = {
                    //    templateUrl: 'scripts/exercise/templates/znkExerciseToolBoxModal.html',
                    //    hideBackdrop: true,
                    //    ctrl: 'ZnkExerciseToolBoxModalCtrl',
                    //    ctrlAs: 'toolBoxCtrl',
                    //    dontCentralize: true,
                    //    wrapperClass: 'znk-exercise-toolbox ' + toolBoxModalSettings.wrapperCls,
                    //    resolve: {
                    //        Settings: toolBoxModalSettings
                    //    }
                    //};
                    //return ZnkModalSrv.modal(modalOptions);
                }

                ZnkExerciseSrv.openExerciseToolBoxModal = openExerciseToolBoxModal;

                ZnkExerciseSrv.getPlatform = function () {
                    return platform;
                };

                ZnkExerciseSrv.getAllowedTimeForQuestion = function (exerciseType) {
                    if(!exerciseTypeToAllowedQuestionTimeMap || !exerciseTypeToAllowedQuestionTimeMap[exerciseType]){
                        $log.error('ZnkExerciseSrv: the following exercise type:' + exerciseType +' has no question allowed time');
                    }
                    return exerciseTypeToAllowedQuestionTimeMap[exerciseType];
                };

                ZnkExerciseSrv.getBindExerciseKeys = function() {
                    if (!bindExerciseKeys) {
                        bindExerciseKeys = (angular.isArray(addBindExerciseKeys)) ?
                            defaultBindExerciseKeys.concat(addBindExerciseKeys) : defaultBindExerciseKeys;
                    }
                    return bindExerciseKeys;
                };

                ZnkExerciseSrv.toolBoxTools = {
                    BLACKBOARD: 'blackboard',
                    MARKER: 'mar',
                    CALCULATOR: 'cal',
                    BOOKMARK: 'bookmark',
                    SHOW_PAGER: 'show pager'
                };

                return ZnkExerciseSrv;
            }];
        }
    );
})(angular);

/**
 * attrs:
 *  questions: questions array
 *
 *  ngModel: results array
 *
 *  settings:
 *      allowedTimeForExercise: in milliseconds
 *      onDone
 *      onQuestionAnswered
 *      wrapperCls
 *      toolsToHide
 *      viewMode
 *      onExerciseReady
 *      onSlideChange
 *      initSlideIndex
 *      initSlideDirection
 *      initForceDoneBtnDisplay: null-default behaviour(default value), false-done button will be hidden, true-done button will be dispalyed
 *      initPagerDisplay: true- displayed(default value), false- hidden
 *      toolBox:{
 *          drawing:{
 *              exerciseDrawingPathPrefix: exercise drawing path prefix, question id will be concat to it for the full path.
 *              toucheColorId
 *          }
 *      }
 *
 *  actions:
 *      setSlideIndex
 *      getCurrentIndex
 *      finishExercise
 *      setSlideDirection
 *      forceDoneBtnDisplay
 *      pagerDisplay: function, if true provided than pager will be displayed other it will be hidden.
 *      getPagerDisplayState
 *      bindExerciseViewTo: receive as parameter the view state
 *          viewState properties:
 *              currSlideIndex, answerExplanation + add extra with ZnkExerciseSrvProvider.addBindExerciseKeys
 *              questionView: it implemented per question
 *      unbindExerciseView: remove exercise view binding
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercise', [
        'ZnkExerciseSrv', '$location', /*'$analytics',*/ '$window', '$q', 'ZnkExerciseEvents', 'PlatformEnum', '$log', 'ZnkExerciseViewModeEnum', 'ZnkExerciseSlideDirectionEnum', '$timeout', 'ZnkExerciseUtilitySrv',
        function (ZnkExerciseSrv, $location, /*$analytics, */$window, $q, ZnkExerciseEvents, PlatformEnum, $log, ZnkExerciseViewModeEnum, ZnkExerciseSlideDirectionEnum, $timeout, ZnkExerciseUtilitySrv) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExerciseDrv.html',
                restrict: 'E',
                transclude: true,
                controllerAs: 'vm',
                require: ['znkExercise', 'ngModel'],
                scope: {
                    questionsGetter: '&questions',
                    settings: '=?',
                    actions: '=?'
                },
                controller: 'ZnkExerciseDrvCtrl',
                compile: function (element) {
                    var platform = ZnkExerciseSrv.getPlatform();
                    if (!platform) {
                        $log.$error('znkExercise directive: undefined platform received.');
                    }
                    var PlatformEnumMap = PlatformEnum.getEnumMap();
                    element.addClass(PlatformEnumMap[platform]);

                    return {
                        pre: function (scope, element, attrs, ctrls) {
                            var defaultSettings = {
                                onDone: angular.noop,
                                onQuestionAnswered: angular.noop,
                                viewMode: ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                                onSlideChange: angular.noop,
                                initSlideDirection: ZnkExerciseSlideDirectionEnum.ALL.enum,
                                initForceDoneBtnDisplay: null,
                                initPagerDisplay: true,
                                allowedTimeForExercise: Infinity
                            };

                            scope.settings.allowedTimeForExercise = +scope.settings.allowedTimeForExercise;
                            if(isNaN(scope.settings.allowedTimeForExercise)){
                                $log.error('znkExerciseDrv: allowed time for exercise was not set!!!!');
                            }
                            scope.settings = angular.extend(defaultSettings, scope.settings);

                            var znkExerciseDrvCtrl = ctrls[0];
                            var ngModelCtrl = ctrls[1];

                            var questionAnswersToOneObjectfmtr = {},
                                allQuestionWithAnswersArr,
                                isMobile = $window.innerWidth <= 567;

                            function questionChangeResolverForSlideDirection(requiredIndex, currIndex){
                                var currSlideDirection = scope.vm.slideDirection;
                                switch (currSlideDirection){
                                    case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                        return $q.reject();
                                    case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                        return currIndex > requiredIndex ? true : $q.reject(false);
                                    case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                        return currIndex < requiredIndex ? true : $q.reject(false);
                                    default:
                                        return true;
                                }
                            }
                            znkExerciseDrvCtrl.addQuestionChangeResolver(questionChangeResolverForSlideDirection);

                            scope.vm.answeredCount = 0;

                            znkExerciseDrvCtrl.setCurrentIndex(scope.settings.initSlideIndex || 0);
                            /**
                             *  ACTIONS
                             * */

                            scope.actions = scope.actions || {};

                            scope.actions.setSlideIndex = function setSlideIndex(index) {
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    znkExerciseDrvCtrl.setCurrentIndex(index);
                                });
                            };

                            scope.actions.getCurrentIndex = function () {
                                return znkExerciseDrvCtrl.getCurrentIndex();
                            };

                            scope.actions.finishExercise = function () {
                                updateTimeSpentOnQuestion();
                            };

                            scope.actions.setSlideDirection = function(newSlideDirection){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    if(angular.isDefined(newSlideDirection)){
                                        //  do nothing incase the slide direction was not changed
                                        if(scope.vm.slideDirection === newSlideDirection){
                                            return;
                                        }

                                        var isRightDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.RIGHT.enum;
                                        var isLeftDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.LEFT.enum;
                                        var isAllDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.ALL.enum;
                                        var DIRECTION_CLASS_PREFIX = 'direction';

                                        var rightDirectionClass =DIRECTION_CLASS_PREFIX + '-' + ZnkExerciseSlideDirectionEnum.RIGHT.val;
                                        if(isRightDirection || isAllDirection){
                                            element.addClass(rightDirectionClass);
                                        }else{
                                            element.removeClass(rightDirectionClass);
                                        }

                                        var leftDirectionClass=DIRECTION_CLASS_PREFIX + '-' + ZnkExerciseSlideDirectionEnum.LEFT.val;
                                        if(isLeftDirection || isAllDirection){
                                            element.addClass(leftDirectionClass);
                                        }else{
                                            element.removeClass(leftDirectionClass);
                                        }

                                        scope.vm.slideDirection = newSlideDirection;

                                        scope.$broadcast(ZnkExerciseEvents.SLIDE_DIRECTION_CHANGED,newSlideDirection);
                                    }
                                });
                            };

                            scope.actions.forceDoneBtnDisplay = function(display){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    scope.vm.btnSectionActions.forceDoneBtnDisplay(display);
                                });
                            };

                            scope.actions.pagerDisplay = function(display){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    var showPager = !!display;
                                    if(showPager){
                                        element.addClass('pager-displayed');
                                    }else{
                                        element.removeClass('pager-displayed');
                                    }
                                    scope.vm.showPager = !!display;
                                });
                            };

                            scope.actions.getPagerDisplayState = function(){
                                return !!scope.vm.showPager;
                            };
                            /**
                             *  BIND EXERCISE
                             */
                            scope.actions.bindExerciseViewTo = znkExerciseDrvCtrl.bindExerciseViewTo;

                            scope.actions.unbindExerciseView = znkExerciseDrvCtrl.unbindExerciseView;
                            /**
                             *  END BIND EXERCISE
                             */

                            /**
                             *  ACTIONS END
                             * */

                            /**
                             *  RENDER AND SET VIEW VALUE
                             * */
                            function render(viewValue) {
                                allQuestionWithAnswersArr = viewValue;
                                scope.vm.questionsWithAnswers = allQuestionWithAnswersArr;
                            }

                            ngModelCtrl.$render = function () {
                                render(ngModelCtrl.$viewValue);
                            };

                            function setViewValue() {
                                ngModelCtrl.$setViewValue(scope.vm.questionsWithAnswers);
                            }
                            /**
                             *  RENDER AND SET VIEW VALUE END
                             * */

                            function getCurrentQuestion() {
                                return allQuestionWithAnswersArr[scope.vm.currentSlide];
                            }

                            /**
                             *  TOOL BOX MODAL
                             * */
                            var toolboxModalSettings = {
                                toolsToHide: scope.settings.toolsToHide,
                                wrapperCls: scope.settings.toolBoxWrapperClass || ''
                            };
                            toolboxModalSettings.events = {
                                onToolOpened: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BLACKBOARD, currQuestion.__questionStatus.blackboardData || {});
                                            if (isMobile) {
                                                scope.vm.hidePager = true;
                                            }
                                            break;
                                    }
                                },
                                onToolClosed: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            currQuestion.__questionStatus.blackboardData = evt.value;
                                            if (isMobile) {
                                                scope.vm.hidePager = false;
                                            }
                                            break;
                                    }
                                    setViewValue();
                                },
                                onToolValueChanged: function (evt) {
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BOOKMARK:
                                            scope.vm.bookmarkCurrentQuestion();
                                            break;
                                    }
                                    setViewValue();
                                }
                            };
                            var toolBoxModalInstance = ZnkExerciseSrv.openExerciseToolBoxModal(toolboxModalSettings);
                            /**
                             *  TOOL BOX MODAL END
                             * */

                            /**
                             *  FORMATTER & PARSER
                             * */
                            questionAnswersToOneObjectfmtr.formatter = function (answers) {
                                if (!answers) {
                                    answers = [];
                                }

                                var answersMap = {};
                                answers.forEach(function (answer) {
                                    if (answer && angular.isDefined(answer.questionId)) {
                                        answersMap[answer.questionId] = answer;
                                    }
                                });

                                var questions = scope.questionsGetter() || [];

                                var questionsWithAnswers = questions.map(function (question, index) {
                                    var questionCopy = angular.copy(question);
                                    var answer = answersMap[questionCopy.id] || {};

                                    questionCopy.__questionStatus= answer;
                                    questionCopy.__questionStatus.index = index;

                                    return questionCopy;
                                });
                                return questionsWithAnswers;
                            };
                            ngModelCtrl.$formatters.push(questionAnswersToOneObjectfmtr.formatter);

                            questionAnswersToOneObjectfmtr.parser = function (questionsWithAnswersArr) {
                                scope.vm.answeredCount  = 0;

                                var results = ngModelCtrl.$modelValue || [];

                                questionsWithAnswersArr.forEach(function (questionWithAnswer, index) {
                                    if (angular.isUndefined(questionWithAnswer.__questionStatus)) {
                                        return;
                                    }

                                    var answer = angular.copy(questionWithAnswer.__questionStatus);
                                    answer.questionId = questionWithAnswer.id;

                                    if (angular.isDefined(answer.userAnswer)) {
                                        scope.vm.answeredCount ++;
                                    }

                                    results[index] = answer;
                                });

                                return results;
                            };
                            ngModelCtrl.$parsers.push(questionAnswersToOneObjectfmtr.parser);
                            /**
                             *  FORMATTER & PARSER END
                             * */

                            scope.vm.questionAnswered = function () {
                                if (scope.settings.viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    var currQuestion = getCurrentQuestion();
                                    var userAnswer = currQuestion.__questionStatus.userAnswer;
                                    currQuestion.__questionStatus.isAnsweredCorrectly = ZnkExerciseUtilitySrv.isAnswerCorrect(currQuestion,userAnswer);

                                    updateTimeSpentOnQuestion(undefined,true);
                                    var afterAllowedTime = _isExceededAllowedTime();
                                    currQuestion.__questionStatus.afterAllowedTime = afterAllowedTime;
                                    setViewValue();
                                }
                                scope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, getCurrentQuestion());
                                //skip 1 digest cycle before triggering question answered
                                $timeout(function(){
                                    scope.settings.onQuestionAnswered(scope.vm.currentSlide);
                                });
                            };

                            scope.vm.bookmarkCurrentQuestion = function () {
                                var currQuestion = getCurrentQuestion();
                                currQuestion.__questionStatus.bookmark = !currQuestion.__questionStatus.bookmark;
                                scope.$broadcast(ZnkExerciseEvents.BOOKMARK, currQuestion);
                                setViewValue();
                            };

                            function updateTimeSpentOnQuestion(questionNum, dontSetViewValue) {
                                questionNum = angular.isDefined(questionNum) ? questionNum : scope.vm.currentSlide;
                                if (scope.settings.viewMode === ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    return;
                                }

                                if (!updateTimeSpentOnQuestion.lastTimeStamp) {
                                    updateTimeSpentOnQuestion.lastTimeStamp = Date.now();
                                    return;
                                }
                                var currTime = Date.now();
                                var timePassed = currTime - updateTimeSpentOnQuestion.lastTimeStamp;
                                updateTimeSpentOnQuestion.lastTimeStamp = currTime;
                                var question = scope.vm.questionsWithAnswers[questionNum];
                                question.__questionStatus.timeSpent = (question.__questionStatus.timeSpent || 0) + timePassed;

                                if(!dontSetViewValue){
                                    setViewValue();
                                }
                            }

                            function _isExceededAllowedTime(){
                                var totalTimeSpent = 0;
                                scope.vm.questionsWithAnswers.forEach(function(questionWithAnswer){
                                    totalTimeSpent += questionWithAnswer.__questionStatus.timeSpent || 0;
                                });
                                var allowedTime = scope.settings.allowedTimeForExercise;
                                return totalTimeSpent > allowedTime;
                            }
                            /**
                             *  INIT
                             * */

                            scope.actions.setSlideDirection(scope.settings.initSlideDirection);

                            scope.actions.forceDoneBtnDisplay(scope.settings.initForceDoneBtnDisplay);

                            scope.actions.pagerDisplay(scope.settings.initPagerDisplay);

                            /**
                             *  INIT END
                             * */

                            /**
                             * EXERCISE CTRL ADDITIONAL API
                             */

                            znkExerciseDrvCtrl.setViewValue = setViewValue;

                            /**
                             * EXERCISE CTRL ADDITIONAL END
                             */

                            scope.$watch('vm.currentSlide', function (value, prevValue) {
                                if(angular.isUndefined(value)){
                                    return;
                                }

                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    updateTimeSpentOnQuestion(prevValue);
                                    var currQuestion = getCurrentQuestion();
                                    scope.settings.onSlideChange(currQuestion, value);
                                    scope.$broadcast(ZnkExerciseEvents.QUESTION_CHANGED,value ,prevValue ,currQuestion);
                                });

                                //var url = $location.url() + '/' + scope.vm.questionsWithAnswers[value].id;
                                //$analytics.pageTrack(url);
                            });

                            scope.$watch('vm.questionsWithAnswers.length',function(newNum,oldNum){
                                scope.$broadcast(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED,newNum,oldNum);
                            });

                            scope.$on('$destroy', function () {
                                if (toolBoxModalInstance) {
                                    toolBoxModalInstance.close();
                                }
                            });
                        }
                    };
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseDrvCtrl', [
        '$scope', '$q', 'ZnkExerciseEvents', '$log', '$element', 'ZnkExerciseSrv',
        function ($scope, $q, ZnkExerciseEvents, $log, $element, ZnkExerciseSrv) {
            var self = this;

            var questionReadyDefer = $q.defer();
            var btnSectionReadyDefer = $q.defer();

            var exerciseReadyProm = $q.all([
                questionReadyDefer.promise,
                btnSectionReadyDefer.promise
            ]);

            exerciseReadyProm.then(function(){
                $scope.$broadcast(ZnkExerciseEvents.READY);
                if ($scope.settings.onExerciseReady) {
                    $scope.settings.onExerciseReady();
                }
            });

            function isQuestionAnswered(index) {
                var questionWithAnswer = $scope.vm.questionsWithAnswers ? $scope.vm.questionsWithAnswers[index] : {};
                return questionWithAnswer && questionWithAnswer.__questionStatus && angular.isDefined(questionWithAnswer.__questionStatus.userAnswer);
            }

            function canChangeQuestion(requiredIndex, currIndex){
                var promArr = [];
                changeQuestionResolvers.forEach(function(resolver){
                    var getResolverResult = $q.when(angular.isFunction(resolver ) ? resolver(requiredIndex, currIndex) : resolver);
                    promArr.push(getResolverResult);
                });
                return $q.all(promArr);
            }

            self.isExerciseReady = function(){
                return exerciseReadyProm;
            };

            self.getViewMode = function () {
                return $scope.settings.viewMode;
            };

            self.getSlideDirection = function () {
                return $scope.settings.slideDirection;
            };

            var changeQuestionResolvers = [];
            self.addQuestionChangeResolver = function(resolver){
                changeQuestionResolvers.push(resolver);
            };

            self.removeQuestionChangeResolver = function(resolver){
                var newChangeQuestionResolvers = [];
                changeQuestionResolvers.forEach(function(resolverItem){
                    if(resolverItem !== resolver){
                        newChangeQuestionResolvers.push(resolverItem);
                    }
                });
                changeQuestionResolvers = newChangeQuestionResolvers;
            };

            self.getCurrentIndex = function () {
                return $scope.vm.currentSlide;
            };

            self.setCurrentIndex = function (newQuestionIndex) {
                if (angular.isDefined(newQuestionIndex)) {
                    var currIndex = self.getCurrentIndex();
                    return canChangeQuestion(newQuestionIndex, currIndex).then(function () {
                        //max index limit
                        var questions = $scope.questionsGetter() || [];
                        newQuestionIndex = Math.min(newQuestionIndex, questions.length - 1);

                        //minimum index limit
                        newQuestionIndex = Math.max(0, newQuestionIndex);

                        $scope.vm.currentSlide = newQuestionIndex;

                        if(self.__exerciseViewBinding){
                            self.__exerciseViewBinding.currSlideIndex = newQuestionIndex;
                        }

                        return $scope.vm.currentSlide;
                    });
                }else{
                    $log.debug('ZnkExerciseDrv: setCurrentIndex was invoked with undefined newQuestionIndex parameter');
                }
                return $q.when($scope.vm.currentSlide);
            };

            self.setCurrentIndexByOffset = function (offset) {
                var currIndex = this.getCurrentIndex();
                var newCurrIndex = currIndex + offset;
                return this.setCurrentIndex(newCurrIndex);
            };

            self.notifyQuestionBuilderReady = function () {
                questionReadyDefer.resolve();
            };

            self.notifyBtnSectionReady = function(){
                btnSectionReadyDefer.resolve();
            };

            self.isCurrentQuestionAnswered = function () {
                return isQuestionAnswered($scope.vm.currentSlide);
            };

            self.isLastUnansweredQuestion = function(){
                var questionsNum = ($scope.vm.questionsWithAnswers || []).length;
                var unansweredNum = 0;
                for(var i=0; i<questionsNum; i++){
                    if(!isQuestionAnswered(i)){
                        unansweredNum++;
                        if(unansweredNum === 2){
                            return false;
                        }
                    }
                }
                return unansweredNum === 1;
            };

            self.getQuestions = function(){
                return questionReadyDefer.promise.then(function(){
                    return $scope.vm.questionsWithAnswers;
                });
            };

            self.areAllQuestionsAnswered = function() {
                var answeredCount = self.answeredCount;
                return self.getQuestions().then(function(questions) {
                    return answeredCount === questions.length;
                });
            };

            self.getElement = function(){
                return $element;
            };

            self.getCurrentQuestion = function(){
                return self.getQuestions().then(function(questions){
                    var currIndex = self.getCurrentIndex();
                    return questions[currIndex];
                });
            };
            /**
             *  bind exercise
             *  BindExerciseEventManager: use the registerCb and update in directives
             *    update: update the bind object in firebase that something change
             *    registerCb: register callback to sync data after update
             *    trigger: internally when the watch update the trigger fires
             */
            (function(self) {

                // initial an empty object in case bindExerciseViewTo was not called
                self.__exerciseViewBinding = {};

                function BindExerciseEventManager() {
                    this.cbObj = {};
                }

                BindExerciseEventManager.prototype.trigger = function(key, value) {
                    if (angular.isArray(this.cbObj[key])) {
                        this.cbObj[key].forEach(function (obj) {
                            if (obj.id && value.id && obj.updatedBy && value.updatedBy) {
                                if (obj.id === value.id && obj.updatedBy !== value.updatedBy) {
                                    obj.cb(value);
                                }
                            } else if (obj.id && value.id) {
                                if (obj.id === value.id) {
                                    obj.cb(value);
                                }
                            } else if (obj.updatedBy && value.updatedBy) {
                                if (obj.updatedBy !== value.updatedBy) {
                                    obj.cb(value);
                                }
                            } else {
                                obj.cb(value);
                            }
                        }, this);
                    }
                };

                BindExerciseEventManager.prototype.update = function(key, value, id, updatedBy) {
                    var curValue = self.__exerciseViewBinding[key] || {};

                    if (!curValue.data) {
                        curValue.data = value;
                        curValue.id = id;
                        curValue.updatedBy = updatedBy;
                    } else if (angular.isObject(value)) {
                        curValue.data = angular.extend({}, curValue, value);
                    } else {
                        curValue.data = value;
                    }

                    self.__exerciseViewBinding[key] = curValue;
                };

                BindExerciseEventManager.prototype.registerCb = function(key, cb, id, updatedBy) {
                     if (!angular.isArray(this.cbObj[key])) {
                         this.cbObj[key] = [];
                     }
                     this.cbObj[key].push({ id: id, cb: cb, updatedBy: updatedBy });
                };

                self.bindExerciseEventManager = new BindExerciseEventManager();

                var exerciseViewListenersObj =  {};

                var keys = ZnkExerciseSrv.getBindExerciseKeys();

                self.bindExerciseViewTo = function (exerciseView) {
                    if(!angular.isObject(exerciseView) || !angular.isArray(keys)) {
                        $log.error('ZnkExerciseDrvCtrl bindExerciseViewTo: exercise view should be an object or keys should be an array');
                        return;
                    }

                    self.__exerciseViewBinding = exerciseView;

                    angular.forEach(keys, function (keyObj) {
                        exerciseViewListenersObj[keyObj.getterName] = $scope.$watchCollection(function () {
                            return exerciseView[keyObj.getterName];
                        },function (newVal) {
                            if (angular.isDefined(newVal)) {
                                if (keyObj.setterName) {
                                    self[keyObj.setterName](newVal);
                                } else {
                                    self.bindExerciseEventManager.trigger(keyObj.getterName, newVal);
                                }
                            }
                        });
                    });
                };

                self.unbindExerciseView = function (keyNameObj) {
                    angular.forEach(exerciseViewListenersObj, function(fn, key) {
                        if (!keyNameObj || keyNameObj[key]) {
                            exerciseViewListenersObj[key]();
                            exerciseViewListenersObj[key] = null;
                        }
                    });

                    var cleanExerciseViewBinding = true;

                    for (var i in exerciseViewListenersObj) {
                        if (exerciseViewListenersObj.hasOwnProperty(i) && exerciseViewListenersObj[i] !== null) {
                            cleanExerciseViewBinding = false;
                            break;
                        }
                    }

                    if (self.__exerciseViewBinding && cleanExerciseViewBinding){
                        self.__exerciseViewBinding = null;
                    }
                };

            })(self);
        }]);
})(angular);

/**
 * attrs:
 *  questions
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercisePager', [
        '$timeout', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum',
        function ($timeout, ZnkExerciseEvents, ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExercisePagerDrv.html',
                restrict: 'E',
                require: ['ngModel', '^znkExercise'],
                scope: {
                    questions: '<'
                },
                link: {
                    pre: function (scope, element, attrs, ctrls) {
                        var ngModelCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var currViewMode = znkExerciseCtrl.getViewMode();

                        var domElement = element[0];

                        scope.d = {};

                        scope.d.tap = function (newIndex) {
                            znkExerciseCtrl.setCurrentIndex(newIndex);
                        };

                        function setPagerItemBookmarkStatus(index, status) {
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
                            if (status) {
                                pagerItemElement.addClass('bookmark');
                            } else {
                                pagerItemElement.removeClass('bookmark');
                            }
                        }

                        function setPagerItemAnswerClass(index, question) {
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);

                            if (angular.isUndefined(question.__questionStatus.userAnswer)) {
                                pagerItemElement.removeClass('neutral correct wrong');
                                return;
                            }

                            if (currViewMode === ZnkExerciseViewModeEnum.ONLY_ANSWER.enum || question.manualEvaluation) {
                                pagerItemElement.addClass('neutral');
                                return;
                            }

                            if (question.__questionStatus.isAnsweredCorrectly) {
                                pagerItemElement.addClass('correct');
                            } else {
                                pagerItemElement.addClass('wrong');
                            }
                        }

                        ngModelCtrl.$render = function () {
                            var currentSlide = +ngModelCtrl.$viewValue;
                            if (isNaN(currentSlide)) {
                                return;
                            }
                            //added in order to prevent the swipe lag
                            $timeout(function () {
                                var i;
                                var $pagerItemWithCurrentClass = angular.element(domElement.querySelectorAll('.pager-item.current'));
                                for (i in $pagerItemWithCurrentClass) {
                                    $pagerItemWithCurrentClass.eq(i).removeClass('current');
                                }
                                var pagerItemsDomElement = domElement.querySelectorAll('.pager-item');
                                var currentSlideDom = angular.element(pagerItemsDomElement[currentSlide]);
                                currentSlideDom.addClass('current');

                                for (i in scope.questions) {
                                    var question = scope.questions[i];
                                    setPagerItemBookmarkStatus(i, question.__questionStatus.bookmark);
                                    setPagerItemAnswerClass(i, question);
                                }
                            });
                        };

                        scope.$on(ZnkExerciseEvents.BOOKMARK, function (evt, question) {
                            setPagerItemBookmarkStatus(question.__questionStatus.index, question.__questionStatus.bookmark);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function (evt, question) {
                            setPagerItemAnswerClass(question.__questionStatus.index, question);
                        });

                        function init() {
                            //wait for the pager items to be rendered
                            $timeout(function () {
                                ngModelCtrl.$render();
                            }, false);
                        }

                        scope.$watch(function () {
                            var questions = scope.questions;

                            if (!questions) {
                                questions = [];
                            }

                            var watchExpr = '';
                            questions.forEach(function (question) {
                                watchExpr += +(!!(question.__questionStatus && question.__questionStatus.userAnswer));
                            });
                            return watchExpr;
                        }, function (newVal, oldVal) {
                            if (!angular.equals(newVal, oldVal)) {
                                init();
                            }
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseToolBox',
        function () {
            'ngInject';

            return {
                templateUrl: 'components/znkExercise/toolbox/core/znkExerciseToolBoxDirective.template.html',
                require: '^znkExercise',
                scope:{
                    settings: '<'
                },
                controllerAs: '$ctrl',
                controller: ["$element", function($element){
                    'ngInject';// jshint ignore: line

                    this.getCurrentQuestion = function(){
                        return this.znkExerciseCtrl.getCurrentQuestion();
                    };

                    this.getZnkExerciseElement = function(){
                        return $element.parent();
                    };

                    this.isExerciseReady = function(){
                        return this.znkExerciseCtrl.isExerciseReady();
                    };
                }],
                bindToController: true,
                link: {
                    pre: function(scope, element, attrs, znkExerciseCtrl){
                        scope.$ctrl.znkExerciseCtrl = znkExerciseCtrl;
                    }
                }
            };
        }
    );
})(angular);


/**
 * This service serves as a communication tool between znkExerciseDrawContainer and znkExerciseDrawTool
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').service('ZnkExerciseDrawSrv',
        function () {
            //'ngInject';
            
            var self = this;

            /** example of self.canvasContextManager
             *  {
             *      10981: {
             *                question: CanvasContextObject,
             *                answer: CanvasContextObject
             *             },
             *      10982: {
             *                question: CanvasContextObject,
             *                answer: CanvasContextObject
             *             }
             *  } 
             *
             *  the names (such as 'question' or 'answer') are set according to the attribute name 'canvas-name' of znkExerciseDrawContainer directive
             */

            self.canvasContextManager = {};

            // addCanvasToElement function is to be added into this service as well. see znkExerciseDrawContainer directive

        });

})(angular);



'use strict';

(function () {

    angular.module('znk.infra.znkExercise').directive('blackboardDrv', [
        'GoBackHardwareSrv',
        function (GoBackHardwareSrv) {

            return {
                restric: 'EA',
                scope: {
                    drawingData: '=',
                    actions: '&',
                    close: '&'
                },
                replace: true,
                templateUrl: 'scripts/exercise/templates/blackboardDrv.html',
                link: function (scope, elem) {
                    function goBackHardwareHandler(){
                        scope.close();
                    }
                    GoBackHardwareSrv.registerHandler(goBackHardwareHandler,undefined,true);

                    function activatePen() {
                        scope.d.activeDrawMode = drawModes.pen;
                    }

                    function activateEraser() {
                        scope.d.activeDrawMode = drawModes.eraser;
                    }

                    function clearCanvas() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        scope.drawingData.dataUrl = null;
                    }

                    var actions = scope.actions() || {};
                    angular.extend(actions, {
                        activatePen: activatePen,
                        activateEraser: activateEraser,
                        clear: clearCanvas
                    });

                    var drawModes = {
                        pen: 1,
                        eraser: 2
                    };

                    scope.d = {
                        drawModes: drawModes,
                        activeDrawMode: drawModes.pen
                    };

                    var _lastX,
                        _lastY;

                    var canvas = elem.find('canvas')[0];
                    canvas.width = elem[0].offsetWidth;
                    canvas.height = elem[0].offsetHeight;

                    var ctx = canvas.getContext('2d');

                    function serialize(canvas) {
                        return canvas.toDataURL();
                    }
                    function deserialize(data, canvas) {
                        var img = new Image();
                        img.onload = function() {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            canvas.getContext('2d').drawImage(img, 0, 0);
                        };

                        img.src = data;
                    }

                    if (scope.drawingData.dataUrl) {
                        deserialize(scope.drawingData.dataUrl, canvas);
                    }

                    function onTouchStart(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        _lastX = e.targetTouches[0].pageX;
                        _lastY = e.targetTouches[0].pageY;

                        draw(_lastX + 1, _lastY + 1);
                    }

                    function onTouchMove(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var curX = e.targetTouches[0].pageX;
                        var curY = e.targetTouches[0].pageY;

                        draw(curX, curY);

                        _lastX = curX;
                        _lastY = curY;
                    }

                    function onTouchEnd(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        scope.drawingData = scope.drawingData || {};
                        scope.drawingData.dataUrl = serialize(canvas);
                    }

                    function draw(x, y) {
                        ctx.beginPath();
                        if (scope.d.activeDrawMode === drawModes.pen) {
                            ctx.globalCompositeOperation = 'source-over';
                            ctx.strokeStyle = '#FFFFFF';
                            ctx.lineWidth = 4;
                            ctx.moveTo(_lastX, _lastY);
                            ctx.lineTo(x, y);
                            ctx.stroke();
                        } else if (scope.d.activeDrawMode === drawModes.eraser) {
                            ctx.globalCompositeOperation = 'destination-out';
                            ctx.arc(_lastX, _lastY, 16, 0, Math.PI * 2, false);
                            ctx.fill();
                        }
                    }

                    canvas.addEventListener('touchstart', onTouchStart);
                    canvas.addEventListener('touchmove', onTouchMove);
                    canvas.addEventListener('touchend', onTouchEnd);

                    scope.$on('$destroy', function () {
                        canvas.removeEventListener('touchstart', onTouchStart);
                        canvas.removeEventListener('touchmove', onTouchMove);
                        canvas.removeEventListener('touchend', onTouchEnd);
                    });
                }
            };
        }]);
})();

'use strict';

/*globals math */
(function(angular) {

    angular.module('znk.infra.znkExercise').directive('calculator', [
        'GoBackHardwareSrv',
        function(GoBackHardwareSrv) {
            var cos = math.cos;
            var sin = math.sin;
            var tan = math.tan;

            return {
                scope :{
                    calcTop: '=',
                    close: '&'
                },
                link: function (scope) {
                    function goBackHardwareHandler(){
                        scope.close();
                    }
                    GoBackHardwareSrv.registerHandler(goBackHardwareHandler,undefined,true);

                    math.cos = function (x) {
                        return cos(math.unit(x, scope.trigunits));
                    };

                    math.sin = function (x) {
                        return sin(math.unit(x, scope.trigunits));
                    };

                    math.tan = function (x) {
                        return tan(math.unit(x, scope.trigunits));
                    };
                    scope.onClickAns = function () {
                        if (scope.result !== 'ERR') {
                            scope.expression =  scope.result;
                        }
                    };
                    scope.onClickNum = function (n) {
                        scope.expression += String(n);
                    };

                    scope.onClickAdd = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }

                        scope.expression += ' + ';
                    };

                    scope.onClickSubtract = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' - ';
                    };

                    scope.onClickMultiply = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' * ';
                    };

                    scope.onClickDivide = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' / ';
                    };

                    scope.onClickClear = function () {
                        scope.expression = '';
                        scope.result = 0;
                    };

                    scope.onClickDot = function () {
                        scope.expression += '.';
                    };

                    scope.onClickPi = function () {
                        scope.expression += ' pi ';
                    };

                    scope.onClickE = function () {
                        scope.expression += ' e ';
                    };

                    scope.onClickRad = function () {
                        scope.trigunits = 'rad';
                    };

                    scope.onClickDeg = function () {
                        scope.trigunits = 'deg';
                    };

                    scope.onClickSin = function () {
                        scope.expression += ' sin(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickCos = function () {
                        scope.expression += ' cos(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickTan = function () {
                        scope.expression += ' tan(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickSqr = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^2 ';
                    };

                    scope.onClickPowThree = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^3 ';
                    };

                    scope.onClickPow = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^ ';
                    };

                    scope.onClickSqrt = function () {
                        scope.expression += ' sqrt(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickInv = function () {
                        scope.expression += ' inv(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickAbs = function () {
                        scope.expression += ' abs(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickFact = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += '! ';
                    };

                    scope.onClickLog = function () {
                        scope.expression += ' log(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickLn = function () {
                        scope.expression += ' ln(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickOpenParen = function () {
                        scope.expression += '(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickCloseParen = function () {
                        scope.expression += ')';
                    };

                    scope.onClickUndo = function () {
                       scope.expression = scope.expression.trimRight();
                       scope.expression = scope.expression.substring(0, scope.expression.length - 1);
                    };

                    scope.onClickEqual = function () {
                        var exp = scope.expression.
                            replace('log', 'log10').
                            replace('ln', 'log');
                        try {
                            scope.result = math.round(math.eval(exp), 5);
                        } catch (err) {
                            try {
                                // best effort in case of missing one paren
                                exp += ')';
                                scope.result = math.round ( math.eval ( exp ), 5 );
                            } catch (err) {
                                scope.result = 'ERR';
                            }
                        }
                        scope.expression = '';
                    };

                    scope.onClickMPlus = function () {
                        scope.mem += scope.result;
                    };

                    scope.onClickMc = function () {
                        scope.mem = 0;
                    };

                    scope.onClickMR = function () {
                        scope.expression += scope.mem;
                    };

                    scope.hasMemory = function () {
                        return scope.mem > 0;
                    };

                    var init = function init () {
                        scope.result = 0;
                        scope.expression = '';
                        scope.mem = 0;
                        scope.trigunits = 'rad';
                    };
                    init();
                },
                templateUrl: 'scripts/exercise/templates/calculator.html'
            };
    }]);

}(angular));


/**
 * This directive is bound to elements requesting a canvas to cover them
 * since the canvas is positioned as 'absolute', the directive also sets a 'relative' position to relate to the canvas
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawContainer',
        ["ZnkExerciseDrawSrv", function (ZnkExerciseDrawSrv) {
            //'ngInject';

            return {
                require: '^questionBuilder',
                link: function (scope,element,attrs, questionBuilderCtrl) {

                    var question = questionBuilderCtrl.question;

                    // make the canvas container relative to this element
                    if (element.css('position') !== 'relative') {
                        element.css('position', 'relative');
                        // sometimes position relative adds an unnecessary scrollbar. hide it
                        element.css('overflow-x', 'hidden');
                    }
                    ZnkExerciseDrawSrv.addCanvasToElement(element,question);
                }
            };

        }]);

})(angular);




/**
 * attrs:
 *  settings:
 *      exerciseDrawingPathPrefix
 *      toucheColorId
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseDrawTool',
        ["ZnkExerciseEvents", "ZnkExerciseDrawSrv", "InfraConfigSrv", "$log", "$q", "$compile", "$timeout", "$window", function (ZnkExerciseEvents, ZnkExerciseDrawSrv, InfraConfigSrv, $log, $q, $compile, $timeout, $window) {
            'ngInject';

            var TOUCHE_COLORS = {
                0: 0,// deleted
                1: '#0072bc',
                2: '#af667d'
            };

            return {
                templateUrl: 'components/znkExercise/toolbox/tools/draw/znkExerciseDrawToolDirective.template.html',
                require: '^znkExerciseToolBox',
                scope: {
                    settings: '<'
                },
                link: function (scope, element, attrs, toolBoxCtrl) {
                    var canvasDomElement,
                        canvasContext,
                        canvasContainerElementInitial,
                        drawer,
                        eventsManager,
                        serverDrawingUpdater,
                        currQuestion;

                    var PIXEL_SIZE = 2;
                    var SERVER_UPDATED_FLUSH_TIME = 0;

                    var DRAWING_MODES = {
                        'NONE': 1,
                        'VIEW': 2,
                        'VIEW_DRAW': 3,
                        'VIEW_ERASE': 4
                    };

                    var TOOLS = {
                        TOUCHE: 1,
                        PENCIL: 2,
                        ERASER: 3
                    };

                    scope.d = {};

                    scope.d.DRAWING_MODES = DRAWING_MODES;

                    scope.d.TOOLS = TOOLS;

                    scope.d.toolClicked = function (tool) {
                        if (!currQuestion) {
                            $log.debug('znkExerciseDrawTool: curr question was not set yet');
                            return;
                        }

                        switch (tool) {
                            case TOOLS.TOUCHE:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.NONE ? DRAWING_MODES.VIEW : DRAWING_MODES.NONE;
                                break;
                            case TOOLS.PENCIL:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.VIEW_DRAW ? DRAWING_MODES.VIEW : DRAWING_MODES.VIEW_DRAW;
                                break;
                            case TOOLS.ERASER:
                                scope.d.drawMode = scope.d.drawMode === DRAWING_MODES.VIEW_ERASE ? DRAWING_MODES.VIEW : DRAWING_MODES.VIEW_ERASE;
                                break;
                        }
                    };

                    function _getFbRef(currQuestionId, canvasContextName) {
                        var errMsg;

                        if (!scope.settings || !scope.settings.exerciseDrawingPathPrefix) {
                            errMsg = 'znkExerciseDrawTool';
                            $log.error(errMsg);
                            return $q.reject(errMsg);
                        }

                        if (!currQuestionId) {
                            errMsg = 'znkExerciseDrawTool:_getFbRef: curr question was not set yet';
                            $log.debug(errMsg);
                            return $q.reject(errMsg);
                        }

                        var pathPrefixProm;
                        if (angular.isFunction(scope.settings.exerciseDrawingPathPrefix)) {
                            pathPrefixProm = scope.settings.exerciseDrawingPathPrefix();
                        } else {
                            pathPrefixProm = scope.settings.exerciseDrawingPathPrefix;
                        }

                        var dataPromMap = {
                            globalStorage: InfraConfigSrv.getGlobalStorage(),
                            pathPrefix: $q.when(pathPrefixProm)
                        };

                        return $q.all(dataPromMap).then(function (data) {
                            var path = 'exerciseDrawings/' + data.pathPrefix + '/' + currQuestionId + '/' + canvasContextName;
                            return data.globalStorage.adapter.getRef(path);
                        });

                    }

                    function _getCanvasContextByContextName(canvasContextName) {
                        return ZnkExerciseDrawSrv.canvasContextManager[currQuestion.id][canvasContextName];
                    }

                    function _getCanvasContextNamesOfQuestion(questionId) {
                        var canvasContextObj = ZnkExerciseDrawSrv.canvasContextManager[questionId] || {};
                        return Object.keys(canvasContextObj);
                    }

                    scope.d.cleanCanvas = function () {
                        if (!currQuestion) {
                            var errMsg = 'znkExerciseDrawTool:_getFbRef: curr question was not set yet';
                            $log.error(errMsg);
                            return;
                        }

                        // for each canvas in the current page (the current question), set the global canvasContext to it and clear it using drawer.clean()
                        var canvasContextNames = _getCanvasContextNamesOfQuestion(currQuestion.id);
                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            canvasContext = _getCanvasContextByContextName(canvasContextName);
                            drawer.clean();
                            _getFbRef(currQuestion.id, canvasContextName).then(function (exerciseDrawingRef) {
                                exerciseDrawingRef.set(null);
                            });

                        });
                    };


                    function _getToucheColor(drawMode) {
                        if (drawMode === DRAWING_MODES.VIEW_ERASE) {
                            return 0;
                        }

                        if (!scope.settings || angular.isUndefined(scope.settings.toucheColorId)) {
                            $log.debug('znkExerciseDrawTool: touche color was not set');
                            return 1;
                        }

                        return scope.settings.toucheColorId;
                    }

                    function _setDrawMode(drawMode) {
                        switch (drawMode) {
                            case DRAWING_MODES.NONE:
                                eventsManager.cleanListeners();
                                drawer.clean();
                                break;
                            case DRAWING_MODES.VIEW:
                                eventsManager.killMouseEvents();
                                eventsManager.registerFbListeners(currQuestion.id);
                                break;
                            default:
                                eventsManager.registerMouseEvents();
                                eventsManager.registerFbListeners(currQuestion.id);
                                drawer.toucheColor = _getToucheColor(drawMode);
                        }
                    }

                    function ServerDrawingUpdater(questionUid, canvasContextName) {
                        if (angular.isUndefined(questionUid)) {
                            $log.error('znkExerciseDrawTool: Question id was not provided');
                            return;
                        }

                        this.pixelsMapToUpdate = {};

                        this.exerciseDrawingRefProm = _getFbRef(questionUid, canvasContextName);
                    }

                    ServerDrawingUpdater.prototype._triggerServerUpdate = function () {
                        if (this.alreadyTriggered) {
                            return;
                        }

                        this.alreadyTriggered = true;

                        var self = this;
                        $timeout(function () {
                            self.alreadyTriggered = false;
                            self.flush();
                        }, SERVER_UPDATED_FLUSH_TIME, false);
                    };

                    ServerDrawingUpdater.prototype.update = function (pixelsMapToUpdate) {
                        angular.extend(this.pixelsMapToUpdate, pixelsMapToUpdate);
                        this._triggerServerUpdate();
                    };

                    ServerDrawingUpdater.prototype.flush = function () {
                        var self = this;

                        return this.exerciseDrawingRefProm.then(function (exerciseDrawingRef) {
                            exerciseDrawingRef.update(self.pixelsMapToUpdate);
                            self.pixelsMapToUpdate = {};
                        });
                    };

                    function Drawer() {
                        this.lastPoint = null;
                    }

                    Drawer.prototype.drawPixel = function (coordStr, colorId, canvasToChange) {
                        if (!canvasContext && !canvasToChange) {
                            return;
                        }

                        // relevant canvas can be either passed to the function or be the global one
                        canvasToChange = canvasToChange || canvasContext;

                        var coords = coordStr.split(":");
                        $window.requestAnimationFrame(function () {
                            canvasToChange.fillStyle = TOUCHE_COLORS[colorId];
                            canvasToChange.fillRect(parseInt(coords[0]), parseInt(coords[1]), PIXEL_SIZE, PIXEL_SIZE);
                        });
                    };

                    Drawer.prototype.clearPixel = function (coordStr, canvasToChange) {
                        if (!canvasContext && !canvasToChange) {
                            return;
                        }

                        // relevant canvas can be either passed to the function or be the global one
                        canvasToChange = canvasToChange || canvasContext;

                        var coords = coordStr.split(":");

                        $window.requestAnimationFrame(function () {
                            var xCoord = parseInt(coords[0]);
                            var yCoord = parseInt(coords[1]);
                            var width = 10 * PIXEL_SIZE;
                            var height = 10 * PIXEL_SIZE;
                            var xOffset = width/2;
                            var yOffset = height/2;
                            canvasToChange.clearRect(xCoord - xOffset, yCoord - yOffset, width, height);
                        });
                    };

                    Drawer.prototype.draw = function (e) {
                        var self = this;

                        var currXCoor = e.offsetX;
                        var currYCoor = e.offsetY;

                        var prevXCoor = self.lastPoint ? self.lastPoint[0] : currXCoor - 1;
                        var prevYCoor = self.lastPoint ? self.lastPoint[1] : currYCoor - 1;

                        self.lastPoint = [currXCoor, currYCoor];

                        var xDiff = Math.abs(currXCoor - prevXCoor);
                        var yDiff = Math.abs(currYCoor - prevYCoor);

                        var pixelsNumToDraw = Math.max(xDiff, yDiff);
                        var xStepOffset = xDiff / pixelsNumToDraw;
                        var yStepOffset = yDiff / pixelsNumToDraw;
                        var pixelsToDrawMap = {};
                        for (var i = 1; i <= pixelsNumToDraw; i++) {
                            var pixelXOffset = (currXCoor - prevXCoor > 0) ? 1 : -1;
                            pixelXOffset *= Math.round(i * xStepOffset);

                            var pixelYOffset = (currYCoor - prevYCoor > 0) ? 1 : -1;
                            pixelYOffset *= Math.round(i * yStepOffset);

                            var pixelToDrawXCoor = Math.round(prevXCoor + pixelXOffset);
                            var pixelToDrawYCoor = Math.round(prevYCoor + pixelYOffset);

                            pixelsToDrawMap[pixelToDrawXCoor + ':' + pixelToDrawYCoor] = self.toucheColor;
                        }

                        angular.forEach(pixelsToDrawMap, function (color, coordsStr) {
                            if (color) {
                                self.drawPixel(coordsStr, color);
                            } else {
                                self.clearPixel(coordsStr);
                            }
                        });

                        serverDrawingUpdater.update(pixelsToDrawMap);
                    };

                    Drawer.prototype.stopDrawing = function () {
                        this.lastPoint = null;
                    };

                    Drawer.prototype.clean = function () {
                        if (!canvasContext) {
                            return;
                        }
                        canvasContext.clearRect(0, 0, canvasDomElement.offsetWidth, canvasDomElement.offsetHeight);
                    };

                    function _mousemoveCb(evt) {
                        drawer.draw(evt);
                        evt.stopImmediatePropagation();
                        evt.preventDefault();
                        return false;
                    }

                    function _mouseupCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            drawer.stopDrawing();
                            canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                            canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                            evt.stopImmediatePropagation();
                            evt.preventDefault();
                            return false;
                        }
                    }

                    function _mousedownCb(evt) {
                        //left mouse
                        if (evt.which === 1) {
                            canvasDomElement.addEventListener('mousemove', _mousemoveCb);
                            canvasDomElement.addEventListener('mouseup', _mouseupCb);
                            evt.stopImmediatePropagation();
                            evt.preventDefault();
                            return false;
                        }
                    }

                    function _updateQuestionDrawMode(drawMode) {
                        toolBoxCtrl.getCurrentQuestion().then(function (currQuestion) {
                            currQuestion.__questionStatus.drawingToolViewMode = drawMode;
                        });
                    }

                    scope.$watch('d.drawMode', function (newDrawMode) {
                        if (!newDrawMode) {
                            return;
                        }

                        _setDrawMode(newDrawMode);
                        _updateQuestionDrawMode(newDrawMode);
                    });

                    scope.$on('$destroy', function () {
                        eventsManager.cleanListeners();
                    });

                    function EventsManager() {
                        this._fbRegisterProm = $q.when();
                        this._hoveredElementsOfQuestions = {};
                        this._fbCallbackEnum =
                            {
                                CHILD_CHANGED: 0,
                                CHILD_REMOVED: 1
                            };
                    }

                    EventsManager.prototype.registerHoverEvent = function (elementToHoverOn, onHoverCb) {
                        var domElementToHoverOn = elementToHoverOn[0];

                        domElementToHoverOn.addEventListener("mouseenter", onHoverCb);

                        if (!this._hoveredElements) {
                            this._hoveredElements = [];
                        }

                        this._hoveredElements.push({'hoveredElement' : elementToHoverOn, 'onHoverCb' : onHoverCb});
                    };


                    EventsManager.prototype.killHoverEvents = function() {
                        angular.forEach(this._hoveredElements, function (elementAndCbPair) {
                            var domHoveredElement = elementAndCbPair.hoveredElement[0];
                            domHoveredElement.removeEventListener("mouseenter", elementAndCbPair.onHoverCb);
                        });
                    };

                    EventsManager.prototype.registerMouseEvents = function () {
                        if (this._mouseEventsRegistered || !canvasDomElement) {
                            return;
                        }
                        this._mouseEventsRegistered = true;

                        canvasDomElement.addEventListener('mousedown', _mousedownCb);
                    };

                    EventsManager.prototype.killMouseEvents = function () {
                        if (this._mouseEventsRegistered) {
                            canvasDomElement.removeEventListener('mousedown', _mousedownCb);
                            canvasDomElement.removeEventListener('mouseup', _mouseupCb);
                            canvasDomElement.removeEventListener('mousemove', _mousemoveCb);
                        }
                        this._mouseEventsRegistered = null;
                    };

                    var _fbChildCallbackWrapper = function(canvasContextName, fbCallbackNum) {

                        function _fbChildChanged(snapShot) {
                            var canvasToChange = _getCanvasContextByContextName(canvasContextName); 
                            var coordsStr = snapShot.key();
                            var color = snapShot.val();

                            if (color === 0) {
                                drawer.clearPixel(coordsStr, canvasToChange);
                            } else {
                                drawer.drawPixel(coordsStr, color, canvasToChange);
                            }
                        }

                        function _fbChildRemoved(snapShot) {
                            var canvasToChange = _getCanvasContextByContextName(canvasContextName); // "this" refers to context passed to ref.on in registerFbListeners

                            var coordsStr = snapShot.key();
                            drawer.clearPixel(coordsStr, canvasToChange);
                        }

                        switch (fbCallbackNum) {
                                case eventsManager._fbCallbackEnum.CHILD_CHANGED:
                                    return _fbChildChanged;
                                case eventsManager._fbCallbackEnum.CHILD_REMOVED:
                                    return _fbChildRemoved;
                                default:
                                    $log.error('znkExerciseDrawTool:_fbChildCallbackWrapper: wrong fbCallbackNum received!');
                                    return;
                        }
                    };

                    EventsManager.prototype.registerFbListeners = function (questionId) {
                        if (angular.isUndefined(questionId)) {
                            $log.error('znkExerciseDrawTool:registerFbListeners: questionId was not provided');
                            return;
                        }

                        var self = this;

                        if (self._fbLastRegisteredQuestionId === questionId) {
                            return;
                        }
                        else {
                            self.killFbListeners();
                        }

                        var canvasContextNames = _getCanvasContextNamesOfQuestion(questionId);

                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            _getFbRef(questionId, canvasContextName).then(function (ref) {
                                self.ref = ref;

                                self.ref.on("child_added", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.on("child_changed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.on("child_removed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_REMOVED));

                            });

                        });
                        self._fbLastRegisteredQuestionId = questionId;
                    };


                    EventsManager.prototype.killFbListeners = function () {
                        
                        var self = this;

                        var canvasContextNames = _getCanvasContextNamesOfQuestion(self._fbLastRegisteredQuestionId);
                        angular.forEach(canvasContextNames, function (canvasContextName) {
                            _getFbRef(self._fbLastRegisteredQuestionId, canvasContextName).then(function (ref) {
                                self.ref = ref;

                                self.ref.off("child_added", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.off("child_changed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_CHANGED));
                                self.ref.off("child_removed", _fbChildCallbackWrapper(canvasContextName, self._fbCallbackEnum.CHILD_REMOVED));
                            });
                        });
                        self._fbLastRegisteredQuestionId = null;
                    };

                    EventsManager.prototype.cleanListeners = function () {
                        this.killMouseEvents();
                        this.killFbListeners();
                        this.killHoverEvents(); 
                    };

                    function _reloadCanvas() {
                        if (scope.d.drawMode === DRAWING_MODES.NONE) {
                            return;
                        }
                        eventsManager.registerFbListeners(currQuestion.id);
                    }

                    function _init() {
                        canvasContainerElementInitial = angular.element(
                            '<div class="draw-tool-container" ' +
                                'ng-show="d.drawMode !== d.DRAWING_MODES.NONE" ' +
                                'ng-class="{' +
                                '\'no-pointer-events\': d.drawMode === d.DRAWING_MODES.VIEW,' +
                                '\'crosshair-cursor\': d.drawMode !== d.DRAWING_MODES.NONE && d.drawMode !== d.DRAWING_MODES.VIEW' +
                                '}">' +
                                '<canvas></canvas>' +
                                '</div>'
                        );

                        drawer = new Drawer();
                        eventsManager = new EventsManager();
                    }

                    function _setContextOnHover(elementToHoverOn, canvasOfElement, canvasContextName) {
                        
                        var onHoverCb = function () {
                            if (currQuestion) {
                                eventsManager.killMouseEvents();

                                canvasDomElement = canvasOfElement;
                                canvasContext = canvasDomElement.getContext("2d");
                                serverDrawingUpdater = new ServerDrawingUpdater(currQuestion.id, canvasContextName);

                                eventsManager.registerMouseEvents();
                            }
                        };

                        eventsManager.registerHoverEvent(elementToHoverOn, onHoverCb);

                    }

                    function _setCanvasDimensions(canvasDomContainerElement, elementToCoverDomElement) {
                        toolBoxCtrl.isExerciseReady().then(function () {
                            canvasDomContainerElement[0].setAttribute('height', elementToCoverDomElement.offsetHeight);
                            canvasDomContainerElement[0].setAttribute('width', elementToCoverDomElement.offsetWidth);
                            canvasDomContainerElement.css('position', 'absolute');
                        });

                    }

                    function addCanvasToElement(elementToCover, question) {
                        // we clone the element defined in _init to not mess with the upcoming append function (which doesn't work multiple times using the same element)
                        var canvasContainerElement = canvasContainerElementInitial.clone();
                        // cast selector element to html element
                        var elementToCoverDomElement = elementToCover[0];

                        // get the <canvas> element from the container
                        var canvasDomContainerElement = canvasContainerElement.children();
                        canvasDomElement = canvasDomContainerElement[0];

                        canvasContext = canvasDomElement.getContext("2d"); 

                        // this is the attribute name passed to znkExerciseDrawContainer directive
                        var canvasContextName = elementToCover.attr('canvas-name');

                        // when hovering over a canvas, set the global context to it
                        _setContextOnHover(elementToCover, canvasDomElement, canvasContextName);

                        _setCanvasDimensions(canvasDomContainerElement, elementToCoverDomElement);
                        

                        elementToCover.append(canvasContainerElement);
                        $compile(canvasContainerElement)(scope);

                        // save to service for further management
                        if (!ZnkExerciseDrawSrv.canvasContextManager[question.id]) {
                            ZnkExerciseDrawSrv.canvasContextManager[question.id] = {};
                        }

                        ZnkExerciseDrawSrv.canvasContextManager[question.id][canvasContextName] = canvasContext;
                    }


                    

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex, oldIndex, _currQuestion) {
                        if (angular.isUndefined(scope.d.drawMode)) {
                            scope.d.drawMode = DRAWING_MODES.VIEW;
                        }

                        currQuestion = _currQuestion;

                        if (serverDrawingUpdater) {
                            serverDrawingUpdater.flush();
                        }

                        _reloadCanvas(); // re-registers fb listeners to reflect new question
                    });

                    _init();

                    // publish addCanvasToElement function to make it callable from znkExerciseDrawContainer directive
                    ZnkExerciseDrawSrv.addCanvasToElement = addCanvasToElement;
                }
            };
        }]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseToolBoxModalCtrl', [
        '$scope', 'ZnkExerciseDrvSrv', 'Settings',
        function ($scope, ZnkExerciseDrvSrv, Settings) {
            Settings.actions = Settings.actions || {};
            Settings.events = Settings.events || {};
            Settings.events.onToolOpened = Settings.events.onToolOpened || angular.noop;
            Settings.events.onToolOpened = Settings.events.onToolOpened || angular.noop;

            $scope.d = {
                blackboardTool: {
                    actions: {},
                    value: {}
                },
                bookmarkTool: {},
                showPagerTool: {},
                tools: ZnkExerciseDrvSrv.toolBoxTools,
                toolsStatus: {},
                toolsToHide: Settings.toolsToHide
            };

            Settings.actions.setToolValue = function (tool, value) {
                switch (tool) {
                    case $scope.d.tools.BOOKMARK:
                        $scope.d.bookmarkTool.value = value;
                        break;
                    case $scope.d.tools.BLACKBOARD:
                        $scope.d.blackboardTool.value = value;
                        break;
                }
            };

            $scope.d.openTool = function (tool) {
                var eventObj = {
                    tool: tool
                };
                Settings.events.onToolOpened(eventObj);
                $scope.d.toolsStatus[tool] = true;
            };

            $scope.d.closeTool = function (tool) {
                var eventObj = {
                    tool: tool
                };
                switch (tool) {
                    case $scope.d.tools.BLACKBOARD:
                        eventObj.value = $scope.d.blackboardTool.value;
                        break;
                    case $scope.d.tools.BOOKMARK:
                        eventObj.value = $scope.d.bookmarkTool.value;
                }
                Settings.events.onToolClosed(eventObj);
                $scope.d.toolsStatus[tool] = false;
            };

            function triggerToolValueChangedEvent(tool, newStatus) {
                var eventObj = {
                    tool: tool,
                    value: newStatus
                };
                if(Settings.events.onToolValueChanged){
                    Settings.events.onToolValueChanged(eventObj);
                }
            }

            $scope.d.reverseBookmarkValue = function () {
                $scope.d.bookmarkTool.value = !$scope.d.bookmarkTool.value;
                triggerToolValueChangedEvent($scope.d.tools.BOOKMARK, $scope.d.bookmarkTool.value);
            };

            $scope.d.activateBlackboardPencil = function(){
                if(!$scope.d[$scope.d.tools.BLACKBOARD]){
                    $scope.d.openTool($scope.d.tools.BLACKBOARD);
                }

                $scope.d.blackboardTool.pencilActivated = true;
                if ($scope.d.blackboardTool.actions.activatePen) {
                    $scope.d.blackboardTool.actions.activatePen();
                }
            };

            $scope.d.activateBlackboardEraser = function(){
                $scope.d.blackboardTool.pencilActivated = false;
                if ($scope.d.blackboardTool.actions.activateEraser) {
                    $scope.d.blackboardTool.actions.activateEraser();
                }
            };

            $scope.d.reverseShowPagerValue = function(){
                $scope.d.showPagerTool.value = !$scope.d.showPagerTool.value;
                triggerToolValueChangedEvent($scope.d.tools.SHOW_PAGER, $scope.d.showPagerTool.value);
            };

            $scope.d.onCalcClick = function(){
                if($scope.d.toolsStatus.hasOwnProperty($scope.d.tools.CALCULATOR)){
                    $scope.d.closeTool($scope.d.tools.CALCULATOR);
                }else{
                    $scope.d.openTool($scope.d.tools.CALCULATOR);
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var exerciseEventsConst = {};

    exerciseEventsConst.tutorial = {
        FINISH: 'tutorial:finish'
    };

    exerciseEventsConst.drill = {
        FINISH: 'drill:finish'
    };

    exerciseEventsConst.practice = {
        FINISH: 'practice:finish'
    };

    exerciseEventsConst.game = {
        FINISH: 'game:finish'
    };

    exerciseEventsConst.section = {
        FINISH: 'section:finish'
    };

    exerciseEventsConst.daily = {
        STATUS_CHANGED: 'daily:status'
    };

    exerciseEventsConst.exam = {
        COMPLETE: 'exam:complete'
    };

    angular.module('znk.infra.znkExercise').constant('exerciseEventsConst', exerciseEventsConst);
})(angular);

/**
 * attrs:
 *  mobile-temp=
 *  desktop-temp=
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('templateByPlatform', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log',
        function (ZnkExerciseSrv, PlatformEnum, $log) {
            return {
                templateUrl: function(element, attrs){
                    var templateUrl;
                    var prefix = attrs.prefix || '';
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform){
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl = attrs.desktopTemp;
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl = attrs.mobileTemp;
                            break;
                    }
                    if(!templateUrl){
                        $log.error('templateByPlatform directive: template was not defined for platform');
                    }
                    return prefix + '/' + templateUrl;
                },
                restrict: 'E'
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    var exerciseAnswerStatusConst = {
        unanswered: 0,
        correct: 1,
        wrong: 2
    };
    angular.module('znk.infra.znkExercise').constant('exerciseAnswerStatusConst', exerciseAnswerStatusConst);

    angular.module('znk.infra.znkExercise').factory('ExerciseAnswerStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            var ExerciseAnswerStatusEnum = new EnumSrv.BaseEnum([
                ['unanswered', exerciseAnswerStatusConst.unanswered, 'unanswered'],
                ['correct', exerciseAnswerStatusConst.correct, 'correct'],
                ['wrong', exerciseAnswerStatusConst.wrong, 'wrong']
            ]);

            ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum = function(answer) {
                switch (answer) {
                    case true:
                        return ExerciseAnswerStatusEnum.correct.enum;
                    case false:
                        return ExerciseAnswerStatusEnum.wrong.enum;
                    default :
                        return ExerciseAnswerStatusEnum.unanswered.enum;
                }
            };

            return ExerciseAnswerStatusEnum;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('PlatformEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['MOBILE', 1, 'mobile'],
                ['DESKTOP', 2, 'desktop']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSlideDirectionEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NONE', 1, 'none'],
                ['ALL', 2, 'all'],
                ['RIGHT', 3, 'right'],
                ['LEFT', 4, 'left']
            ])
            ;
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseViewModeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['ANSWER_WITH_RESULT', 1, 'answer with result'],
                ['ONLY_ANSWER', 2, 'answer only'],
                ['REVIEW', 3, 'review'],
                ['MUST_ANSWER', 4, 'must answer']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseUtilitySrv', function () {

            // default true for all
            var broadCastExerciseFn = function() {
                return function() {
                    return true;
                };
            };

            this.setShouldBroadCastExerciseGetter = function(_broadCastExerciseFn) {
                broadCastExerciseFn = _broadCastExerciseFn;
            };

            this.$get = ["AnswerTypeEnum", "$log", "$q", "$injector", function(AnswerTypeEnum, $log, $q, $injector) {
                'ngInject';

                var ZnkExerciseUtilitySrv = {};
                //@todo(igor) move to utility service
                ZnkExerciseUtilitySrv.bindFunctions = function(dest,src,functionToCopy){
                    functionToCopy.forEach(function(fnName){
                        dest[fnName] = src[fnName].bind(src);
                    });
                };

                var answersIdsMap;
                ZnkExerciseUtilitySrv.isAnswerCorrect = function isAnswerCorrect(question, userAnswer) {
                    var isCorrect, answer;
                    switch (question.answerTypeId) {
                        case AnswerTypeEnum.SELECT_ANSWER.enum:
                            answer = '' + userAnswer;
                            isCorrect = ('' + question.correctAnswerId) === answer;
                            break;
                        case AnswerTypeEnum.FREE_TEXT_ANSWER.enum:
                            answer = '' + userAnswer;
                            answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                                return '' + answerMap.content;
                            });
                            isCorrect = answersIdsMap.indexOf(answer) !== -1;
                            break;
                        case AnswerTypeEnum.RATE_ANSWER.enum:
                            answer = '' + userAnswer;
                            answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                                return '' + answerMap.id;
                            });
                            isCorrect = answersIdsMap.indexOf(answer) !== -1;
                            break;
                    }

                    return !!isCorrect;
                };

                ZnkExerciseUtilitySrv.setQuestionsGroupData = function (questions, groupData) {
                    var groupDataMap = {};

                    angular.forEach(groupData, function (group) {
                        groupDataMap[group.id] = group;
                    });

                    angular.forEach(questions, function (question) {
                        if (question.groupDataId && !groupDataMap[question.groupDataId]) {
                            $log.debug('Group data is missing for the following question id ' + question.id);
                        }

                        question.groupData = groupDataMap[question.groupDataId] || {};
                    });
                };

                ZnkExerciseUtilitySrv.shouldBroadCastExercisePromFnGetter = function() {
                    try {
                        return $q.when($injector.invoke(broadCastExerciseFn));
                    } catch (e) {
                        $log.error('ZnkExerciseUtilitySrv shouldBroadCastExercise: failed in invoke broadCastExerciseFn');
                        return $q.reject(e);
                    }
                };

                return ZnkExerciseUtilitySrv;
            }];
        }
    );
})(angular);

angular.module('znk.infra.znkExercise').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkExercise/core/template/btnSectionDesktopTemplate.html",
    "<div class=\"btn-container left-container ng-hide\"\n" +
    "     ng-show=\"!!vm.currentQuestionIndex && vm.slideRightAllowed\">\n" +
    "    <button ng-click=\"vm.prevQuestion()\">\n" +
    "        <svg-icon name=\"znk-exercise-chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<div class=\"btn-container right-container ng-hide\"\n" +
    "     ng-show=\"vm.maxQuestionIndex !== vm.currentQuestionIndex && vm.slideLeftAllowed\"\n" +
    "     ng-class=\"{'question-answered': vm.isCurrentQuestionAnswered}\">\n" +
    "    <button ng-click=\"vm.nextQuestion()\">\n" +
    "        <svg-icon name=\"znk-exercise-chevron\"></svg-icon>\n" +
    "    </button>\n" +
    "</div>\n" +
    "<div class=\"done-btn-wrap show-opacity-animate\" ng-if=\"vm.showDoneButton\">\n" +
    "    <button tabindex=\"0\"\n" +
    "            class=\"done-btn\"\n" +
    "            ng-click=\"onDone()\">DONE\n" +
    "    </button>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/btnSectionMobileTemplate.html",
    "<div ng-class=\"{ 'next-disabled' : settings.slideDirection === d.slideDirections.NONE ||  settings.slideDirection === d.slideDirections.RIGHT }\">\n" +
    "    <div class=\"bookmark-icon-container only-tablet\"\n" +
    "         ng-class=\"vm.questionsWithAnswers[vm.currentSlide].__questionStatus.bookmark ? 'bookmark-active-icon' : 'bookmark-icon'\"\n" +
    "         ng-click=\"vm.bookmarkCurrentQuestion()\"\n" +
    "         ng-hide=\"settings.viewMode === d.reviewModeId\"></div>\n" +
    "    <ng-switch\n" +
    "            on=\"vm.currentSlide !== vm.questionsWithAnswers.length - 1 && vm.answeredCount !== vm.questionsWithAnswers.length\"\n" +
    "            ng-hide=\"settings.viewMode === d.reviewModeId\"\n" +
    "            class=\"ng-hide\"\n" +
    "            ng-click=\"d.next()\">\n" +
    "        <button ng-switch-when=\"true\"\n" +
    "                class=\"btn next\">\n" +
    "            <div class=\"only-tablet\">\n" +
    "                <span>NEXT</span>\n" +
    "                <i class=\"question-arrow-right-icon\"></i>\n" +
    "            </div>\n" +
    "        </button>\n" +
    "        <button ng-switch-when=\"false\"\n" +
    "                class=\"btn finish\">\n" +
    "            <div>DONE</div>\n" +
    "        </button>\n" +
    "    </ng-switch>\n" +
    "    <button class=\"btn sum ng-hide\"\n" +
    "            ng-click=\"settings.onSummary()\"\n" +
    "            ng-show=\"settings.viewMode === d.reviewModeId\">\n" +
    "        SUMMARY\n" +
    "    </button>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/questionSwiperDesktopTemplate.html",
    "<znk-swiper ng-if=\"vm.questions.length\"\n" +
    "            class=\"znk-carousel\"\n" +
    "            ng-model=\"vm.currSlideIndex\"\n" +
    "            actions=\"vm.swiperActions\"\n" +
    "            ng-change=\"vm.SlideChanged()\"\n" +
    "            disable-swipe=\"{{vm.isLocked}}\">\n" +
    "    <div class=\"swiper-slide\"\n" +
    "        ng-repeat=\"question in vm.questions\">\n" +
    "        <znk-question-report report-data=\"question\"></znk-question-report>\n" +
    "        <question-builder question=\"question\"\n" +
    "                          rate-answer-formatter-parser\n" +
    "                          ng-model=\"question.__questionStatus.userAnswer\"\n" +
    "                          ng-change=\"onQuestionAnswered(question)\">\n" +
    "        </question-builder>\n" +
    "    </div>\n" +
    "</znk-swiper>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/questionSwiperMobileTemplate.html",
    "<ion-slide-box znk-slide=\"settings.slideDirection\" class=\"znk-carousel\"\n" +
    "               show-pager=\"false\"\n" +
    "               active-slide=\"vm.currentSlide\">\n" +
    "    <question-builder slide-repeat-drv=\"question in vm.questionsWithAnswers\"\n" +
    "                      question=\"question\"\n" +
    "                      ng-model=\"question.__questionStatus.userAnswer\"\n" +
    "                      ng-change=\"vm.questionAnswered(question)\">\n" +
    "    </question-builder>\n" +
    "</ion-slide-box>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkExerciseDrv.html",
    "<div ng-transclude></div>\n" +
    "<questions-carousel class=\"znk-carousel-container\"\n" +
    "                    questions=\"vm.questionsWithAnswers\"\n" +
    "                    disable-swipe=\"{{vm.slideDirection !== 2}}\"\n" +
    "                    ng-model=\"vm.currentSlide\"\n" +
    "                    on-question-answered=\"vm.questionAnswered()\"\n" +
    "                    slide-direction=\"{{vm.slideDirection}}\">\n" +
    "</questions-carousel>\n" +
    "<div class=\"question-bottom-shadow\"></div>\n" +
    "<znk-exercise-btn-section class=\"btn-section\"\n" +
    "                          prev-question=\"vm.setCurrentIndexByOffset(-1)\"\n" +
    "                          next-question=\"vm.setCurrentIndexByOffset(1)\"\n" +
    "                          on-done=\"settings.onDone()\"\n" +
    "                          actions=\"vm.btnSectionActions\">\n" +
    "</znk-exercise-btn-section>\n" +
    "<znk-exercise-pager class=\"ng-hide show-opacity-animate\"\n" +
    "                    ng-show=\"vm.showPager\"\n" +
    "                    questions=\"vm.questionsWithAnswers\"\n" +
    "                    ng-model=\"vm.currentSlide\">\n" +
    "</znk-exercise-pager>\n" +
    "<znk-exercise-tool-box settings=\"settings.toolBox\">\n" +
    "</znk-exercise-tool-box>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkExercisePagerDrv.html",
    "<znk-scroll>\n" +
    "    <div class=\"pager-items-wrapper\">\n" +
    "        <div class=\"pager-item noselect\"\n" +
    "             ng-repeat=\"question in questions\"\n" +
    "             question-status=\"question.__questionStatus\"\n" +
    "             question=\"question\"\n" +
    "             ng-click=\"d.tap($index)\">\n" +
    "            <div class=\"question-bookmark-icon\"></div>\n" +
    "            <div class=\"question-status-indicator\">\n" +
    "                <div class=\"index\">{{::$index + 1}}</div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</znk-scroll>\n" +
    "");
  $templateCache.put("components/znkExercise/core/template/znkSwiperTemplate.html",
    "<div class=\"swiper-container\">\n" +
    "    <!-- Additional required wrapper -->\n" +
    "    <div class=\"swiper-wrapper\" ng-transclude>\n" +
    "        <!-- Slides -->\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/arrow-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\" viewBox=\"-468.2 482.4 96 89.8\" class=\"arrow-icon-wrapper\">\n" +
    "    <style type=\"text/css\">\n" +
    "        .arrow-icon-wrapper{width: 48px;  height:auto;}\n" +
    "        .arrow-icon-wrapper .st0{fill:#109BAC;}\n" +
    "        .arrow-icon-wrapper .st1{fill:none;stroke:#fff;stroke-width:5.1237;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "    </style>\n" +
    "    <path class=\"st0\" d=\"M-417.2,572.2h-6.2c-24.7,0-44.9-20.2-44.9-44.9v0c0-24.7,20.2-44.9,44.9-44.9h6.2c24.7,0,44.9,20.2,44.9,44.9\n" +
    "    v0C-372.2,552-392.5,572.2-417.2,572.2z\"/>\n" +
    "    <g>\n" +
    "        <line class=\"st1\" x1=\"-442.8\" y1=\"527.3\" x2=\"-401.4\" y2=\"527.3\"/>\n" +
    "        <line class=\"st1\" x1=\"-401.4\" y1=\"527.3\" x2=\"-414.3\" y2=\"514.4\"/>\n" +
    "        <line class=\"st1\" x1=\"-401.4\" y1=\"527.3\" x2=\"-414.3\" y2=\"540.2\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/chevron-icon.svg",
    "<svg x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     viewBox=\"0 0 143.5 65.5\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     class=\"znk-exercise-chevron-svg\">\n" +
    "    <style>\n" +
    "        .znk-exercise-chevron-svg{\n" +
    "            height: 16px;\n" +
    "        }\n" +
    "\n" +
    "        .znk-exercise-chevron-svg .st0{\n" +
    "            stroke: #0a9bad;\n" +
    "            fill: none;\n" +
    "            stroke-width: 12;\n" +
    "            stroke-linecap: round;\n" +
    "            stroke-linejoin: round;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "    </style>\n" +
    "    <polyline class=\"st0\" points=\"6,6 71.7,59.5 137.5,6 \"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/correct-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"correct-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 188.5 129\"\n" +
    "     style=\"enable-background:new 0 0 188.5 129;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.correct-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"62\" x2=\"67\" y2=\"121.5\"/>\n" +
    "	<line class=\"st0\" x1=\"67\" y1=\"121.5\" x2=\"181\" y2=\"7.5\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/report-question-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 141.3 179.7\" class=\"report-question-icon\">\n" +
    "	    <style type=\"text/css\">\n" +
    "        .report-question-icon {\n" +
    "            fill: #ffffff;\n" +
    "            width: 100%;\n" +
    "            height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g id=\"_x33_UU5wB.tif\">\n" +
    "	<g>\n" +
    "		<path d=\"M141.3,68.7c0,0.7,0,1.3,0,2c-6.7,12.2-18,17.3-31,18.9c-10.5,1.3-21.2,1.6-31.7,3.2c-9.7,1.5-18.4,5.5-24.3,14.1\n" +
    "			c-1.8,2.6-2,4.8-0.5,7.7c8,16.3,15.7,32.6,23.6,49c4.2,8.8,3.8,10.4-3.9,16.1c-2.3,0-4.7,0-7,0c-1.8-2.7-3.8-5.3-5.2-8.3\n" +
    "			c-9.8-20-19.4-40.1-29.1-60.1C21.8,90.4,11.7,69.4,1.6,48.5c-1.8-3.7-2.6-8,0.6-10.6c2.5-2.1,6.6-3,9.9-2.9\n" +
    "			c2.2,0.1,4.3,2.9,6.5,4.6c8.9-11.4,14.8-15.2,28.2-17.5c5.9-1,11.9-0.9,17.9-1.4c16.6-1.3,33.1-2.9,42.7-20.7\n" +
    "			c3.3,6.8,6.4,13,9.4,19.2C124.9,35.7,133.1,52.2,141.3,68.7z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-eraser.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 180.8 171.2\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     class=\"znk-exercise-eraser\">\n" +
    "<style type=\"text/css\">\n" +
    "    .znk-exercise-eraser {\n" +
    "        width: 26px;\n" +
    "    }\n" +
    "\n" +
    "    .znk-exercise-eraser .st0 {\n" +
    "        fill: none;\n" +
    "    }\n" +
    "\n" +
    "    .znk-exercise-eraser .st1 {\n" +
    "        fill: url(#znk-exercise-eraser-SVGID_1_);\n" +
    "    }\n" +
    "</style>\n" +
    "<pattern  x=\"-3207.2\" y=\"-3890.7\" width=\"4.5\" height=\"4.3\" patternUnits=\"userSpaceOnUse\" id=\"New_Pattern_Swatch_3\" viewBox=\"0 -4.3 4.5 4.3\" style=\"overflow:visible;\">\n" +
    "	<g>\n" +
    "		<polygon class=\"st0\" points=\"0,0 4.5,0 4.5,-4.3 0,-4.3 		\"/>\n" +
    "		<polygon points=\"0.7,-3.6 0,-3.6 0,-4.3 0.7,-4.3 		\"/>\n" +
    "		<polygon points=\"4.5,-3.6 3.8,-3.6 3.8,-4.3 4.5,-4.3 		\"/>\n" +
    "		<polygon points=\"0.7,0 0,0 0,-0.7 0.7,-0.7 		\"/>\n" +
    "		<polygon points=\"4.5,0 3.8,0 3.8,-0.7 4.5,-0.7 		\"/>\n" +
    "	</g>\n" +
    "</pattern>\n" +
    "<path d=\"M89.5,171.2H57.9c-0.5,0-1.1-0.2-1.5-0.5l-44.3-33.1c-1.1-0.8-1.3-2.4-0.5-3.5l58.6-78.5c0.8-1.1,2.4-1.3,3.5-0.5\n" +
    "	c1.1,0.8,1.3,2.4,0.5,3.5l-57.1,76.4l41.6,31.1h29.6l47.2-61.8c0.8-1.1,2.4-1.3,3.5-0.5c1.1,0.8,1.3,2.4,0.5,3.5l-47.9,62.8\n" +
    "	C91.1,170.9,90.3,171.2,89.5,171.2z\"/>\n" +
    "<g>\n" +
    "\n" +
    "		<pattern  id=\"znk-exercise-eraser-SVGID_1_\"\n" +
    "                  xlink:href=\"#New_Pattern_Swatch_3\"\n" +
    "                  patternTransform=\"matrix(1.4011 -0.2109 0.2109 1.4011 2667.2153 506.0711)\">\n" +
    "	</pattern>\n" +
    "	<polyline class=\"st1\" points=\"134.6,109.5 127.3,118.6 127.3,118.6 61.8,70.2 72.4,56.9 113,2.5 178.3,51.2 137.7,105.6 	\"/>\n" +
    "	<path d=\"M127.3,121.1c-0.5,0-1-0.2-1.5-0.5L60.3,72.2c-0.5-0.4-0.9-1-1-1.7c-0.1-0.7,0.1-1.4,0.5-1.9l10.6-13.3L111,1\n" +
    "		c0.4-0.5,1-0.9,1.6-1c0.7-0.1,1.3,0.1,1.9,0.5l65.3,48.7c1.1,0.8,1.3,2.4,0.5,3.5l-40.6,54.4c-0.8,1-2.1,1.3-3.2,0.7\n" +
    "		c0.8,0.9,0.9,2.3,0.1,3.2l-7.3,9.1C128.8,120.8,128.1,121.1,127.3,121.1z M65.4,69.7l61.5,45.4l5.8-7.2c0.8-1,2.1-1.2,3.1-0.6\n" +
    "		c-0.8-0.9-0.9-2.2-0.1-3.2l39.1-52.4L113.5,6L74.4,58.4L65.4,69.7z\"/>\n" +
    "</g>\n" +
    "<rect y=\"166.2\" width=\"89.5\" height=\"5\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-pencil.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 138.2 171.4\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     class=\"znk-exercise-pencil\">\n" +
    "<style>\n" +
    "    .znk-exercise-pencil{\n" +
    "        width: 20px;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<g>\n" +
    "		<path d=\"M0,171.4C0,171.4,0,171.4,0,171.4c3.7-19,7.5-38,11.2-57L94.6,6.6c9.3-6.9,19.5-8.3,30.7-4.6c2.4,1.9,4.7,3.7,7.1,5.6\n" +
    "			c6.3,9.9,7.6,20.1,3.2,30.8L52.3,146.2C34.9,154.6,17.4,163,0,171.4z M50.3,140c26.9-34.9,53.6-69.1,80-103.7\n" +
    "			c5.5-7.3,3.8-18.5-2.6-24.8c-9.6-9.5-23.3-8.7-31.6,1.9c-25.2,32.5-50.3,65-75.4,97.6c-1,1.2-1.7,2.6-2.6,4l7.6,5.9\n" +
    "			c1.4-1.9,2.6-3.4,3.8-5c22.8-29.5,45.6-59.1,68.5-88.6c0.8-1,1.4-2.2,2.4-2.9c1.2-0.8,2.7-1.1,4-1.6c0,1.6,0.3,3.2-0.1,4.7\n" +
    "			c-0.4,1.3-1.7,2.3-2.5,3.5C79,60.1,56.3,89.5,33.6,118.9c-1.3,1.6-2.5,3.3-3.8,4.9l9.5,7.4c1.6-2.1,2.9-3.8,4.2-5.5\n" +
    "			c23.2-30,46.3-59.9,69.5-89.8c1.1-1.4,3.3-1.8,5-2.7c-0.4,1.9-0.5,3.9-1.2,5.6c-0.5,1.3-1.7,2.3-2.6,3.5\n" +
    "			c-22.4,29-44.8,57.9-67.1,86.9c-1.3,1.7-2.6,3.3-4,5.2L50.3,140z M16.3,120.6c-0.4,0.5-3.8,19.1-5.8,30.2c-0.6,3.6,2.9,6.4,6.2,5\n" +
    "			c8.9-3.7,23.2-9.7,29-12.5L16.3,120.6z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-pointer.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     class=\"znk-exercise-pointer\"\n" +
    "	 viewBox=\"0 0 150.4 169.6\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style>\n" +
    "    .znk-exercise-pointer{\n" +
    "        width: 18px;\n" +
    "    }\n" +
    "</style>\n" +
    "<path d=\"M34.4,169.6c-1.6,0-3.2-0.5-4.6-1.6l-13-10.1c-3.2-2.5-3.9-7-1.6-10.3l33.2-48.5c0.4-0.6,0.5-1.4,0.3-2.2\n" +
    "	c-0.2-0.7-0.8-1.3-1.5-1.5L4.4,81.1C1.9,80.2,0.2,78,0,75.3c-0.2-2.6,1.2-5.1,3.6-6.3L143,0.5c1.8-0.9,3.9-0.7,5.4,0.5\n" +
    "	c1.6,1.2,2.3,3.2,1.9,5.1l-31.2,152.1c-0.5,2.6-2.6,4.6-5.2,5.1c-2.6,0.5-5.2-0.6-6.7-2.8l-24.7-37.6c-0.4-0.7-1.1-1.1-1.9-1.1\n" +
    "	c-0.8-0.1-1.5,0.3-2,0.8L40.1,167C38.6,168.7,36.5,169.6,34.4,169.6z M145.3,5C145.2,5,145.2,5,145.3,5L5.8,73.5C5,73.9,5,74.7,5,75\n" +
    "	c0,0.3,0.2,1,1,1.3l42.8,14.4c2.2,0.8,3.9,2.5,4.7,4.7c0.7,2.2,0.4,4.6-0.9,6.6l-33.2,48.5c-0.8,1.1-0.5,2.7,0.6,3.5l13,10.1\n" +
    "	c1.1,0.8,2.6,0.7,3.5-0.3l38.5-44.4c1.5-1.8,3.8-2.7,6.1-2.6c2.4,0.2,4.5,1.4,5.8,3.4l24.7,37.6c0.5,0.8,1.3,0.7,1.6,0.7\n" +
    "	c0.3-0.1,1-0.3,1.2-1.2L145.4,5.2C145.4,5.2,145.4,5.1,145.3,5C145.3,5,145.3,5,145.3,5z\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-remove.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 176.3 173.8\"\n" +
    "     xml:space=\"preserve\"\n" +
    "class=\"znk-exercise-remove\">\n" +
    "    <style>\n" +
    "       .znk-exercise-remove{\n" +
    "           width: 22px;\n" +
    "       }\n" +
    "    </style>\n" +
    "<g>\n" +
    "	<path d=\"M173.3,20.8H3c-1.7,0-3-1.3-3-3s1.3-3,3-3h170.3c1.7,0,3,1.3,3,3S174.9,20.8,173.3,20.8z\"/>\n" +
    "	<path d=\"M89.1,173.8H41.5c-10.5,0-13.7-9.8-13.9-14.9L19.6,21.4c-0.1-1.7,1.2-3.1,2.8-3.2c1.6-0.1,3.1,1.2,3.2,2.8l8.1,137.5\n" +
    "		c0.1,1,0.7,9.3,7.9,9.3h47.6c1.7,0,3,1.3,3,3S90.8,173.8,89.1,173.8z\"/>\n" +
    "	<path d=\"M136.7,173.8H89.1c-1.7,0-3-1.3-3-3s1.3-3,3-3h47.6c7.2,0,7.9-8.3,7.9-9.2l8.1-137.5c0.1-1.7,1.5-2.9,3.2-2.8\n" +
    "		c1.7,0.1,2.9,1.5,2.8,3.2l-8.1,137.5C150.4,164.1,147.2,173.8,136.7,173.8z\"/>\n" +
    "	<path d=\"M120.5,20.8c-1.7,0-3-1.3-3-3v-6.4c0-3-2.4-5.4-5.4-5.4H65.5c-3,0-5.4,2.4-5.4,5.4v6.4c0,1.7-1.3,3-3,3s-3-1.3-3-3v-6.4\n" +
    "		C54.1,5.1,59.2,0,65.5,0h46.6c6.3,0,11.4,5.1,11.4,11.4v6.4C123.5,19.5,122.2,20.8,120.5,20.8z\"/>\n" +
    "	<path d=\"M62.5,147.7c-1.7,0-3-1.3-3-3v-103c0-1.7,1.3-3,3-3s3,1.3,3,3v103C65.5,146.3,64.2,147.7,62.5,147.7z\"/>\n" +
    "	<path d=\"M89.1,147.7c-1.7,0-3-1.3-3-3v-103c0-1.7,1.3-3,3-3s3,1.3,3,3v103C92.1,146.3,90.8,147.7,89.1,147.7z\"/>\n" +
    "	<path d=\"M114.6,147.7c-1.7,0-3-1.3-3-3v-103c0-1.7,1.3-3,3-3s3,1.3,3,3v103C117.6,146.3,116.3,147.7,114.6,147.7z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/tools-touche.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 47.6 53.2\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     class=\"znk-exercise-touche-svg\">\n" +
    "<style type=\"text/css\">\n" +
    "    .znk-exercise-touche-svg {\n" +
    "        width: 23px;\n" +
    "    }\n" +
    "\n" +
    "    .znk-exercise-touche-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #000000;\n" +
    "        stroke-width: 2;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "\n" +
    "    .znk-exercise-touche-svg .st1 {\n" +
    "        fill: none;\n" +
    "        stroke: #000000;\n" +
    "        stroke-width: 2;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M39.9,22.8v25.1c0,2.4-1.9,4.3-4.3,4.3H5.3c-2.4,0-4.3-1.9-4.3-4.3V12.6c0-2.4,1.9-4.3,4.3-4.3h15.7\"/>\n" +
    "<g>\n" +
    "	<path class=\"st1\" d=\"M22.4,33.8l23.7-23.7c0.7-0.7,0.7-1.8,0-2.4l-6.2-6.2c-0.7-0.7-1.8-0.7-2.4,0L13.8,25.2L22.4,33.8z\"/>\n" +
    "	<line class=\"st1\" x1=\"34.2\" y1=\"4.8\" x2=\"42.8\" y2=\"13.4\"/>\n" +
    "	<line class=\"st0\" x1=\"32.8\" y1=\"11.4\" x2=\"19.1\" y2=\"25.2\"/>\n" +
    "	<polyline class=\"st1\" points=\"13.8,25.2 11.6,36 22.4,33.8 	\"/>\n" +
    "</g>\n" +
    "<path class=\"st0\" d=\"M11,39.2c-1.8,1-6.4,4.1-3.2,5s13-2.1,13.1,0s-1,2.9-1,2.9\"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/svg/wrong-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"wrong-icon-svg\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 126.5 126.5\"\n" +
    "     style=\"enable-background:new 0 0 126.5 126.5;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	.wrong-icon-svg .st0 {\n" +
    "        fill: none;\n" +
    "        stroke: #231F20;\n" +
    "        stroke-width: 15;\n" +
    "        stroke-linecap: round;\n" +
    "        stroke-linejoin: round;\n" +
    "        stroke-miterlimit: 10;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<line class=\"st0\" x1=\"119\" y1=\"7.5\" x2=\"7.5\" y2=\"119\"/>\n" +
    "	<line class=\"st0\" x1=\"7.5\" y1=\"7.5\" x2=\"119\" y2=\"119\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkExercise/toolbox/core/znkExerciseToolBoxDirective.template.html",
    "<znk-exercise-draw-tool settings=\"$ctrl.settings.drawing\">\n" +
    "</znk-exercise-draw-tool>\n" +
    "\n" +
    "");
  $templateCache.put("components/znkExercise/toolbox/tools/draw/znkExerciseDrawToolDirective.template.html",
    "<svg-icon name=\"znk-exercise-touche\"\n" +
    "          ng-click=\"d.toolClicked(d.TOOLS.TOUCHE)\"\n" +
    "          ng-class=\"{\n" +
    "            active:d.drawMode !== d.DRAWING_MODES.NONE\n" +
    "          }\">\n" +
    "</svg-icon>\n" +
    "<!--<svg-icon name=\"znk-exercise-pointer\">-->\n" +
    "<!--</svg-icon>-->\n" +
    "<svg-icon name=\"znk-exercise-pencil\"\n" +
    "          ng-click=\"d.toolClicked(d.TOOLS.PENCIL)\"\n" +
    "          ng-class=\"{\n" +
    "            active:d.drawMode === d.DRAWING_MODES.VIEW_DRAW\n" +
    "          }\">\n" +
    "</svg-icon>\n" +
    "<svg-icon name=\"znk-exercise-eraser\"\n" +
    "          ng-click=\"d.toolClicked(d.TOOLS.ERASER)\"\n" +
    "          ng-class=\"{\n" +
    "            active:d.drawMode === d.DRAWING_MODES.VIEW_ERASE\n" +
    "          }\">\n" +
    "</svg-icon>\n" +
    "<svg-icon name=\"znk-exercise-remove\"\n" +
    "          ng-click=\"d.cleanCanvas()\">\n" +
    "</svg-icon>\n" +
    "");
}]);

(function (angular) {
    'use strict';
    angular.module('znk.infra.znkMedia',[]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkMedia').factory('MediaSrv', [
        'ENV', '$q', '$window',
        function (ENV, $q, $window) {

            var isRunningOnDevice = !!$window.cordova;

            var sound = window.Audio && new Audio();
            function Html5Media(src, mediaSuccess, mediaError, mediaStatus) {
                if (typeof $window.Audio !== 'function' && typeof $window.Audio !== 'object') {
                    console.warn('HTML5 Audio is not supported in this browser');
                }
                sound.src = src;

                sound.addEventListener('error', mediaError, false);

                function endedHandler(){
                    if (mediaStatus) {
                        mediaStatus($window.Media.MEDIA_STOPPED);
                    }
                    if (mediaSuccess) {
                        mediaSuccess();
                    }
                }
                sound.addEventListener('ended', endedHandler, false);

                function canplayHandler(){
                    console.log('Html5 audio load end ' + src);
                    if (mediaStatus) {
                        mediaStatus($window.Media.MEDIA_STARTING);
                    }
                }
                sound.addEventListener('canplay',canplayHandler, false);

                function canplaythroughHandler(){
                    console.log('Html5 audio load fully ended ' + src);
                    if (!playingHandler.wasInvoked) {
                        mediaStatus($window.Media.MEDIA_STARTING);
                    }
                }
                sound.addEventListener('canplaythrough',canplaythroughHandler, false);

                function playingHandler(){
                    playingHandler.wasInvoked = true;
                    if (mediaStatus) {
                        mediaStatus($window.Media.MEDIA_RUNNING);
                    }
                }
                sound.addEventListener('playing',playingHandler,false);

                console.log('starting Html5 audio load ' + src);
                sound.load();

                return {
                    // Returns the current position within an audio file (in seconds).
                    getCurrentPosition: function (successFn) {
                        successFn(sound.currentTime);
                    },
                    // Returns the duration of an audio file (in seconds) or -1.
                    getDuration: function () {
                        return isNaN(sound.duration) ? -1 : sound.duration;
                    },
                    // Start or resume playing an audio file.
                    play: function () {
                        sound.play();
                    },
                    // Pause playback of an audio file.
                    pause: function () {
                        sound.pause();
                        if (mediaStatus) {
                            mediaStatus($window.Media.MEDIA_PAUSED);
                        }
                    },
                    // Releases the underlying operating system's audio resources. Should be called on a ressource when it's no longer needed !
                    release: function () {
                        sound.removeEventListener('error', mediaError);
                        sound.removeEventListener('ended', endedHandler);
                        sound.removeEventListener('canplay',canplayHandler);
                        sound.removeEventListener('playing',playingHandler);
                        sound.removeEventListener('canplaythrough',canplaythroughHandler);
                        sound.src = '';
                        console.log('Html5 Audio object was destroyed ' + src);
                    },
                    // Moves the position within the audio file.
                    seekTo: function (milliseconds) {
                        sound.currentTime = milliseconds / 1000;
                    },
                    // Set the volume for audio playback (between 0.0 and 1.0).
                    setVolume: function (volume) {
                        sound.volume = volume;
                    },
                    // Start recording an audio file.
                    startRecord: function () {
                    },
                    // Stop recording an audio file.
                    stopRecord: function () {
                    },
                    // Stop playing an audio file.
                    stop: function () {
                        sound.pause();
                        if (mediaStatus) {
                            mediaStatus($window.Media.MEDIA_STOPPED);
                        }
                        if (mediaSuccess) {
                            mediaSuccess();
                        }
                    }
                };
            }

            // media fallback: only when not running on device
            if (!isRunningOnDevice ) {
                $window.Media = Html5Media;
                $window.Media.MEDIA_NONE = 0;
                $window.Media.MEDIA_STARTING = 1;
                $window.Media.MEDIA_RUNNING = 2;
                $window.Media.MEDIA_PAUSED = 3;
                $window.Media.MEDIA_STOPPED = 4;
            }


            var mediaOptions = { playAudioWhenScreenIsLocked : false };

            var MediaSrv = {
                soundsEnabled: true//@todo(igor) should be set in config phase
            };

            MediaSrv.enableSounds = function enableSounds(shouldEnable){
                MediaSrv.soundsEnabled = shouldEnable;
            };

            MediaSrv.loadSound = function loadMedia(src,successFn,failFn,statusCheckFn,isInternalPath) {
                var MediaConstructor;

                if(!isRunningOnDevice){
                    MediaConstructor  = Html5Media;
                }

                if(!MediaConstructor){
                    var INTERNAL_PATH_PREFIX_REGEX = /^(cdvfile:\/\/|documents:\/\/)/;
                    if(isInternalPath || src.match(INTERNAL_PATH_PREFIX_REGEX)){
                        MediaConstructor = $window.Media;
                    }else{
                        MediaConstructor = Html5Media;

                        //if(ionic.Platform.isAndroid()){
                        //    var isExternalGet = !!src.match(/^http/);
                        //    if(!isExternalGet){
                        //        src = '/android_asset/www/' + src;
                        //    }
                        //}
                    }

                }

                function failFnMain(e) {
                    var errMsg = 'MediaSrv: fail to load sound, src: '+src;
                    console.error(errMsg, e);
                    if(angular.isDefined($window.atatus) && angular.isFunction($window.atatus.notify)) {
                        $window.atatus.notify(errMsg);
                    }
                    // call failFn pass to loadSound
                    if(angular.isDefined(failFn) && angular.isFunction(failFn)) {
                        failFn(e);
                    }
                }

                var sound = new MediaConstructor(src,
                    successFn || angular.noop,
                    failFnMain || failFn || angular.noop,
                    statusCheckFn || angular.noop
                );

                return sound;
            };

            MediaSrv.setVolume = function setVolume(media, volume) {
                if (!MediaSrv.soundsEnabled){
                    return;
                }

                if (media.setVolume) {
                    media.setVolume(volume);
                }
                else {
                    media.volume = volume;
                }
            };

            MediaSrv.playMedia = function playMedia(media, options) {

                if (!MediaSrv.soundsEnabled) {
                    return;
                }

                if (typeof $window.Media === 'undefined') {
                    media.load();
                    media.play();
                }
                else {
                    if (!options){
                        options = mediaOptions;
                    }

                    media.play(options);
                }
            };

            MediaSrv.playSound = function(soundSrc,elementId){
                //if(ionic.Platform.isAndroid()){
                //    soundSrc = '/android_asset/www/' + soundSrc;
                //}
                if(!MediaSrv.soundsEnabled){
                    return;
                }

                var audioSelector = 'audio#' + elementId;
                if(!document.querySelector(audioSelector)){
                    var bodyElement = angular.element(document.querySelector('body'));
                    var template = '<audio id="%elementId%" webkit-playsinline><source src="%src%" type="audio/mp3"></audio>';
                    template = template.replace('%elementId%',elementId);
                    template = template.replace('%src%',soundSrc);
                    bodyElement.append(template);
                }
                var soundAudio = MediaSrv.loadMedia(soundSrc, elementId);
                MediaSrv.setVolume(soundAudio, 0.1);
                MediaSrv.playMedia(soundAudio);

            };

            MediaSrv.getContentPath = function getContentPath() {
                //if (!ionic.Platform.device().platform) {
                //    return ENV.contentDir + '/media/';
                //}
                //
                //var path = 'offline/media/';
                //if(ionic.Platform.isAndroid()){
                //    path = '/android_asset/www/' + path;
                //}
                //return path;
            };

            MediaSrv.newMedia = function newMedia(src, successCallback, errorCallback, statusCallback) {
                return new $window.Media(src, successCallback, errorCallback, statusCallback);
            };

            return MediaSrv;
        }
    ]);
})(angular);

angular.module('znk.infra.znkMedia').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';
    angular.module('znk.infra.znkModule', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkModule').service('ZnkModuleService', [
        'StorageRevSrv',
        function (StorageRevSrv) {
            var znkModuleService = {};

            znkModuleService.getModuleHeaders = function () {
                return StorageRevSrv.getContent({
                    exerciseType: 'moduleheaders'
                });
            };

            znkModuleService.getModuleById = function (moduleId) {
                return StorageRevSrv.getContent({
                    exerciseId: moduleId,
                    exerciseType: 'module'
                });
            };

            return znkModuleService;
        }
    ]);
})(angular);


angular.module('znk.infra.znkModule').run(['$templateCache', function($templateCache) {

}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar', [
        'znk.infra.svgIcon',
        'pascalprecht.translate'
    ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {};
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkProgressBar').directive('znkProgressBar',
        function () {
        'ngInject';
            return {
                templateUrl: 'components/znkProgressBar/znkProgressBar.template.html',
                scope: {
                    progressWidth: '@',
                    progressValue: '@',
                    showProgressValue: '@',
                    showProgressBubble: '&'
                }
            };
        }
    );
})(angular);


angular.module('znk.infra.znkProgressBar').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkProgressBar/znkProgressBar.template.html",
    "<div ng-if=\"::showProgressBubble()\" class=\"progress-bubble-wrapper\" ng-style=\"{left: progressWidth + '%'}\">\n" +
    "    <div class=\"progress-percentage\">\n" +
    "        <div>{{progressWidth}}%\n" +
    "            <div translate=\"ZNK_PROGRESS_BAR.MASTERY\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"progress-bubble\">\n" +
    "        <div class=\"down-triangle gray-triangle\"></div>\n" +
    "        <div class=\"down-triangle\"></div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"progress-wrap\">\n" +
    "    <div class=\"progress\" ng-style=\"{width: progressWidth + '%'}\"></div>\n" +
    "    <div class=\"answer-count ng-hide\" ng-show=\"{{::showProgressValue}}\">\n" +
    "        {{progressValue}}\n" +
    "    </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "");
}]);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport',
        [
            'ngMaterial',
            'znk.infra.popUp',
            'pascalprecht.translate',
            'znk.infra.auth',
            'znk.infra.analytics',
            'znk.infra.general',
            'znk.infra.user',
            'znk.infra.svgIcon',
            'znk.infra.mailSender',
            'znk.infra.exerciseUtility'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'report-question-close-popup': 'components/znkQuestionReport/svg/close-popup.svg',
                    'report-question-icon': 'components/znkQuestionReport/svg/report-question-icon.svg',
                    'completed-v-report-icon': 'components/znkQuestionReport/svg/completed-v-report.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport')
        .component('znkQuestionReport', {
            bindings: {
                reportData: '='
            },
            template: '<svg-icon class="report-btn" name="report-question-icon" ' +
            'title="{{\'REPORT_POPUP.REPORT_QUESTION\' | translate}}" ng-hide="vm.isLectureType" ng-click="vm.showReportDialog()"></svg-icon>',
            controllerAs: 'vm',
            controller: ["$mdDialog", "ExerciseTypeEnum", function ($mdDialog, ExerciseTypeEnum) {
                'ngInject';
                var vm = this;

                vm.isLectureType = vm.reportData.exerciseTypeId === ExerciseTypeEnum.LECTURE.enum;
                vm.showReportDialog = function () {
                    $mdDialog.show({
                        locals:{ reportData: vm.reportData },
                        controller: 'znkReportCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'components/znkQuestionReport/templates/znkReport.template.html',
                        clickOutsideToClose: true
                    });
                };
            }]
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkQuestionReport').controller('znkReportCtrl',
        ["$log", "$mdDialog", "$timeout", "$http", "$translate", "ENV", "AuthService", "MailSenderService", "reportData", function($log, $mdDialog, $timeout, $http, $translate, ENV, AuthService, MailSenderService, reportData) {
            'ngInject';

            var self = this;
            var userAuth = AuthService.getAuth();
            var MAIL_TO_SEND = 'support@zinkerz.com';
            var TEMPLATE_KEY = 'reportQuestion';
            var EMAIL_SUBJECT = $translate('REPORT_POPUP.REPORT_QUESTION');
            var emailMessagePromise = $translate('REPORT_POPUP.MESSAGE');

            self.success = false;
            self.reportData = reportData;
            self.reportData.app = ENV.firebaseAppScopeName.split('_')[0].toUpperCase();
            self.reportData.email = userAuth.auth.email;
            emailMessagePromise.then(function (message) {
                self.reportData.message = message;
            });

            $timeout(function () {
                document.getElementById('report-textarea').focus();
            });

            this.stopBubbling = function (e) {
                if (e.stopPropagation) { e.stopPropagation(); }
                if (e.cancelBubble !== null) { e.cancelBubble = true; }
            };

            this.sendFrom = function () {
                if (self.reportForm.$valid) {
                    self.startLoader = true;
                    self.reportData.email = self.reportData.email ?
                        self.reportData.email : userAuth.auth.email ? userAuth.auth.email : 'N/A';

                    // subject format: ReportQuestion - [App Name]
                    var emailSubject = EMAIL_SUBJECT;
                    emailSubject += ' - ' + self.reportData.app;

                    var ADD_TO_MESSAGE = '<br><br>' + 'App: ' + ENV.firebaseAppScopeName + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Question ID: ' + self.reportData.id + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Question QUID: ' + self.reportData.quid + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Exercise ID: ' + self.reportData.parentId + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'Exercise Type ID: ' + self.reportData.parentTypeId + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'userEmail: ' + self.reportData.email + ' | ';
                    ADD_TO_MESSAGE += '<br>' + 'userId: ' + userAuth.auth.uid;

                    var message = self.reportData.message + ADD_TO_MESSAGE;

                    var dataToSend = {
                        emails: [MAIL_TO_SEND],
                        message: message,
                        subject: emailSubject,
                        appName: ENV.firebaseAppScopeName,
                        templateKey: TEMPLATE_KEY
                    };

                    MailSenderService.postMailRequest(dataToSend).then(function (res) {
                        self.fillLoader = true;
                        $timeout(function () {
                            self.startLoader = self.fillLoader = false;
                        }, 100);

                        if (res.data.success) {
                            self.success = true;
                        } else {
                            $log.error('Error sending mail');
                        }
                    }, function (message) {
                        $log.error(message);

                        self.fillLoader = true;
                        $timeout(function () {
                            self.startLoader = self.fillLoader = false;
                        }, 100);
                    });
                }
            };
            this.cancel = function () {
                $mdDialog.cancel();
            };
        }]);
})(angular);

angular.module('znk.infra.znkQuestionReport').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkQuestionReport/svg/close-popup.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-596.6 492.3 133.2 133.5\" xml:space=\"preserve\" class=\"close-pop-svg\">\n" +
    "<style type=\"text/css\">\n" +
    "	.close-pop-svg {width: 100%; height: auto;}\n" +
    "	.close-pop-svg .st0{fill:none;enable-background:new    ;}\n" +
    "	.close-pop-svg .st1{fill:none;stroke:#ffffff;stroke-width:8;stroke-linecap:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path class=\"st0\"/>\n" +
    "<g>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkQuestionReport/svg/completed-v-report.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-1040 834.9 220.4 220.4\" xml:space=\"preserve\" class=\"completed-v-feedback-svg\">\n" +
    "<style type=\"text/css\">\n" +
    "	.completed-v-feedback-svg {width: 100%; height: auto;}\n" +
    "	.completed-v-feedback-svg .st0{fill:none;enable-background:new    ;}\n" +
    "	.completed-v-feedback-svg .st1{fill:#CACBCC;}\n" +
    "	.completed-v-feedback-svg .st2{display:none;fill:none;}\n" +
    "	.completed-v-feedback-svg .st3{fill:#D1D2D2;}\n" +
    "	.completed-v-feedback-svg .st4{fill:none;stroke:#FFFFFF;stroke-width:11.9321;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}\n" +
    "</style>\n" +
    "<path class=\"st0\" d=\"M-401,402.7\"/>\n" +
    "<circle class=\"st1\" cx=\"-929.8\" cy=\"945.1\" r=\"110.2\"/>\n" +
    "<circle class=\"st2\" cx=\"-929.8\" cy=\"945.1\" r=\"110.2\"/>\n" +
    "<path class=\"st3\" d=\"M-860.2,895.8l40,38.1c-5.6-55.6-52.6-99-109.6-99c-60.9,0-110.2,49.3-110.2,110.2\n" +
    "	c0,60.9,49.3,110.2,110.2,110.2c11.6,0,22.8-1.8,33.3-5.1l-61.2-58.3L-860.2,895.8z\"/>\n" +
    "<polyline class=\"st4\" points=\"-996.3,944.8 -951.8,989.3 -863.3,900.8 \"/>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkQuestionReport/svg/report-flag.svg",
    "<svg x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\"\n" +
    "	 class=\"flag-svg\">\n" +
    "    <style type=\"text/css\">\n" +
    "        .flag-svg .st0 {\n" +
    "            fill: #ffffff;\n" +
    "            stroke-width: 5;\n" +
    "            stroke-miterlimit: 10;\n" +
    "        }\n" +
    "        .flag-svg {\n" +
    "            width: 100%;\n" +
    "            height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g id=\"kUxrE9.tif\">\n" +
    "	<g>\n" +
    "		<path class=\"st0\" id=\"XMLID_93_\" d=\"M-140.1,287c0.6-1.1,1.7-1.7,2.9-1.4c1.3,0.3,2,1.1,2.3,2.3c1.1,4,2.1,8,3.2,12c2.4,9.3,4.9,18.5,7.3,27.8\n" +
    "			c0.1,0.3,0.2,0.6,0.2,0.9c0.3,1.7-0.6,3-2.1,3.3c-1.4,0.3-2.8-0.5-3.3-2.1c-1-3.6-2-7.3-2.9-10.9c-2.5-9.5-5-19-7.6-28.6\n" +
    "			C-140.1,290-140.8,288.3-140.1,287M-89.6,289.1c-1,6.8-2.9,13-10,16c-3.2,1.4-6.5,1.6-9.9,0.9c-2-0.4-4-0.7-6-0.6c-4.2,0.3-7.1,2.7-9,6.4\n" +
    "			c-0.3,0.5-0.5,1.1-0.9,2c-0.3-1-0.5-1.7-0.8-2.5c-2-7-3.9-14.1-5.9-21.2c-0.3-1-0.1-1.7,0.5-2.4c4.5-6,11-7.4,17.5-3.6\n" +
    "			c3.4,2,6.7,4.2,10.2,6.1c1.9,1,3.9,1.9,5.9,2.4c3.2,0.9,5.9,0,7.9-2.6C-90,289.7-89.8,289.4-89.6,289.1z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkQuestionReport/svg/report-question-icon.svg",
    "<svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 141.3 179.7\" class=\"report-question-icon\">\n" +
    "	    <style type=\"text/css\">\n" +
    "        .report-question-icon {\n" +
    "            fill: #ffffff;\n" +
    "            width: 100%;\n" +
    "            height: auto;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g id=\"_x33_UU5wB.tif\">\n" +
    "	<g>\n" +
    "		<path d=\"M141.3,68.7c0,0.7,0,1.3,0,2c-6.7,12.2-18,17.3-31,18.9c-10.5,1.3-21.2,1.6-31.7,3.2c-9.7,1.5-18.4,5.5-24.3,14.1\n" +
    "			c-1.8,2.6-2,4.8-0.5,7.7c8,16.3,15.7,32.6,23.6,49c4.2,8.8,3.8,10.4-3.9,16.1c-2.3,0-4.7,0-7,0c-1.8-2.7-3.8-5.3-5.2-8.3\n" +
    "			c-9.8-20-19.4-40.1-29.1-60.1C21.8,90.4,11.7,69.4,1.6,48.5c-1.8-3.7-2.6-8,0.6-10.6c2.5-2.1,6.6-3,9.9-2.9\n" +
    "			c2.2,0.1,4.3,2.9,6.5,4.6c8.9-11.4,14.8-15.2,28.2-17.5c5.9-1,11.9-0.9,17.9-1.4c16.6-1.3,33.1-2.9,42.7-20.7\n" +
    "			c3.3,6.8,6.4,13,9.4,19.2C124.9,35.7,133.1,52.2,141.3,68.7z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkQuestionReport/templates/znkReport.template.html",
    "<div class=\"report-dialog\">\n" +
    "    <md-dialog class=\"base base-border-radius report-container\" translate-namespace=\"REPORT_POPUP\">\n" +
    "        <div class=\"top-icon-wrap\">\n" +
    "            <div class=\"top-icon\">\n" +
    "                <div class=\"round-icon-wrap\">\n" +
    "                    <svg-icon name=\"report-question-icon\"></svg-icon>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div class=\"popup-header\">\n" +
    "            <div class=\"close-popup-wrap\" ng-click=\"vm.cancel();\">\n" +
    "                <svg-icon name=\"report-question-close-popup\"></svg-icon>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <md-dialog-content>\n" +
    "            <div class=\"report-inner\">\n" +
    "                <div class=\"main-title\" translate=\".REPORT_QUESTION\"></div>\n" +
    "                <ng-switch on=\"vm.success\">\n" +
    "                    <section ng-switch-when=\"false\">\n" +
    "                        <div class=\"sub-title\" translate=\".SUB_TITLE\"></div>\n" +
    "                        <form novalidate name=\"vm.reportForm\" class=\"base-form\" ng-submit=\"vm.sendFrom();\">\n" +
    "\n" +
    "							<textarea\n" +
    "                                    required autofocus\n" +
    "                                    id=\"report-textarea\"\n" +
    "                                    name=\"messageFeedback\"\n" +
    "                                    ng-keydown=\"vm.stopBubbling($event)\"\n" +
    "                                    ng-model=\"vm.reportData.message\"\n" +
    "                                    placeholder=\"{{'REPORT_POPUP.PLACEHOLDER' | translate}}\">\n" +
    "                            </textarea>\n" +
    "\n" +
    "                            <label\n" +
    "                                    ng-class=\"{'hidden': !(vm.reportForm.messageFeedback.$invalid && vm.reportForm.$submitted) }\"\n" +
    "                                    translate=\".REQUIRED_FIELD\">\n" +
    "                            </label>\n" +
    "\n" +
    "                            <input\n" +
    "                                    required\n" +
    "                                    type=\"email\"\n" +
    "                                    name=\"emailFeedback\"\n" +
    "                                    placeholder=\"{{'REPORT_POPUP.EMAIL' | translate}}\"\n" +
    "                                    ng-keydown=\"vm.stopBubbling($event)\"\n" +
    "                                    ng-model=\"vm.reportData.email\"\n" +
    "                                    ng-minlength=\"5\"\n" +
    "                                    ng-maxlength=\"254\">\n" +
    "\n" +
    "                            <label\n" +
    "                                    ng-class=\"{'hidden': !(vm.reportForm.emailFeedback.$invalid && vm.reportForm.$submitted) }\"\n" +
    "                                    translate=\".CORRECT_EMAIL\">\n" +
    "                            </label>\n" +
    "\n" +
    "                            <button\n" +
    "                                    class=\"md-button success success-green drop-shadow\"\n" +
    "                                    element-loader\n" +
    "                                    fill-loader=\"vm.fillLoader\"\n" +
    "                                    show-loader=\"vm.startLoader\"\n" +
    "                                    bg-loader=\"'#72ab40'\"\n" +
    "                                    precentage=\"50\"\n" +
    "                                    font-color=\"'#FFFFFF'\"\n" +
    "                                    bg=\"'#87ca4d'\">\n" +
    "                                <span translate=\".SEND\"></span>\n" +
    "                            </button>\n" +
    "                        </form>\n" +
    "                    </section>\n" +
    "                    <section ng-switch-default class=\"success-report\">\n" +
    "                        <svg-icon name=\"completed-v-report-icon\"></svg-icon>\n" +
    "                        <div class=\"success-msg\">\n" +
    "                            <div translate=\".THANKS\"></div>\n" +
    "                            <div translate=\".OPINION\"></div>\n" +
    "                        </div>\n" +
    "                        <md-button\n" +
    "                                class=\"success success-green drop-shadow\"\n" +
    "                                ng-click=\"vm.cancel();\">\n" +
    "                            <span translate=\".DONE\"></span>\n" +
    "                        </md-button>\n" +
    "                    </section>\n" +
    "                </ng-switch>\n" +
    "            </div>\n" +
    "        </md-dialog-content>\n" +
    "    </md-dialog>\n" +
    "</div>\n" +
    "");
}]);

(function (angular) {
    'use strict';
    angular.module('znk.infra.znkTimeline', ['znk.infra.svgIcon', 'znk.infra.enum']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').directive('znkTimeline', ['$window', '$templateCache', 'TimelineSrv',
        function ($window, $templateCache, TimelineSrv) {
            var directive = {
                restrict: 'A',
                scope: {
                    timelineData: '=',
                    timelineSettings: '='
                },
                link: function (scope, element) {

                    var settings = angular.extend({
                        width: $window.innerWidth,
                        height: $window.innerHeight,
                        images: TimelineSrv.getImages(),
                        colors: TimelineSrv.getColors()
                    }, scope.timelineSettings || {});

                    var dataObj;

                    var canvasElem = element[0];

                    var ctx = canvasElem.getContext('2d');

                    var lastLine;

                    var nextFlag = false;

                    scope.$watch('timelineData', function (val, oldVal) {
                        if (angular.isDefined(val)) {
                            if (val !== oldVal) {
                                ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);
                                if (val.data.length) {
                                    start(val);
                                }
                            } else {
                                start(val);
                            }
                        }
                    });

                    function start(timelineData) {

                        var width = settings.width;

                        dataObj = {
                            lastLine: [],
                            biggestScore: {score: 0}
                        };

                        lastLine = void(0);

                        if (settings.type === 'multi') {
                            var distance = settings.distance * (timelineData.data.length + 2);
                            width = (distance < settings.width) ? settings.width : distance;
                        }

                        if (settings.isMax) {
                            settings.max = 0;
                            angular.forEach(timelineData.data, function (value) {
                                if (value.score > settings.max) {
                                    settings.max = value.score;
                                }
                            });
                        }

                        canvasElem.width = width * 2;
                        canvasElem.height = settings.height * 2;

                        canvasElem.style.width = width + 'px';
                        canvasElem.style.height = settings.height + 'px';

                        ctx.scale(2, 2);

                        if (settings.lineWidth) {
                            ctx.lineWidth = settings.lineWidth;
                        }

                        if (angular.isDefined(timelineData.id) && settings.colors &&
                            angular.isObject(settings.colors) && !angular.isArray(settings.colors)) {
                            ctx.strokeStyle = settings.colors[timelineData.id];
                            ctx.fillStyle = settings.colors[timelineData.id];
                        }

                        ctx.beginPath();

                        createPath({
                            moveTo: {
                                x: 0,
                                y: settings.height - 2
                            },
                            lineTo: {
                                x: settings.distance,
                                y: settings.height - 2
                            }
                        }, true);

                        angular.forEach(timelineData.data, function (value, index) {

                            var height = Math.abs((settings.height - settings.subPoint) - ((value.score - settings.min) / (settings.max - settings.min) * (settings.height - (settings.subPoint * 2)) ));
                            var currentDistance = (index + 2) * settings.distance;
                            var isLast = index === (timelineData.data.length - 1);
                            value.moveTo = {
                                x: lastLine.lineTo.x,
                                y: lastLine.lineTo.y
                            };

                            value.lineTo = {
                                x: currentDistance,
                                y: height
                            };

                            createPath(value, false, isLast);

                            if (value.score > dataObj.biggestScore.score) {
                                dataObj.biggestScore = {score: value.score, lastLineTo: lastLine.lineTo};
                            }

                        });

                        if (settings.numbers && angular.isObject(settings.numbers)) {

                            setTimeout(function () {

                                ctx.font = settings.numbers.font;
                                ctx.fillStyle = settings.numbers.fillStyle;

                                ctx.fillText(settings.min, 15, settings.height - 10);
                                ctx.fillText(parseInt(dataObj.biggestScore.score), 15, dataObj.biggestScore.lastLineTo.y || settings.subPoint);

                            });

                        }

                        if (settings.onFinish && angular.isFunction(settings.onFinish)) {
                            settings.onFinish({data: dataObj, ctx: ctx, canvasElem: canvasElem});
                        }

                    }

                    function createPath(data, ignoreAfterPath, isLast) {

                        var arc = 10;
                        var img = 20;

                        if (angular.isDefined(settings.isMobile) && !settings.isMobile) {
                            arc = 15;
                            img = 25;
                        }

                        var subLocation = img / 2;

                        lastLine = data;
                        dataObj.lastLine.push(lastLine);

                        /* create line */
                        ctx.moveTo(data.moveTo.x, data.moveTo.y);
                        ctx.lineTo(data.lineTo.x, data.lineTo.y);
                        ctx.stroke();

                        if (dataObj.summeryScore && !nextFlag) {
                            dataObj.summeryScore.next = data.lineTo;
                            nextFlag = true;
                        }

                        if (settings.isSummery) {
                            if (settings.isSummery === data.exerciseId) {
                                dataObj.summeryScore = {
                                    score: data.score, lineTo: data.lineTo,
                                    prev: dataObj.lastLine[dataObj.lastLine.length - 2]
                                };
                                arc = arc * 1.5;
                                img = img + 5;
                                subLocation = img / 2;
                            }
                        } else if (isLast) {
                            arc = arc * 1.5;
                            img = img + 5;
                            subLocation = img / 2;
                        }


                        if (!ignoreAfterPath) {
                            /* create circle */
                            ctx.beginPath();
                            ctx.arc(data.lineTo.x, data.lineTo.y, arc, 0, 2 * Math.PI, false);
                            ctx.fill();

                            if ((isLast && !settings.isSummery) || (settings.isSummery === data.exerciseId)) {
                                ctx.beginPath();
                                ctx.arc(data.lineTo.x, data.lineTo.y, arc + 4, 0, 2 * Math.PI, false);
                                ctx.stroke();
                            }

                            /* create svg icons */
                            var imageObj = new Image();
                            var src;
                            var locationImgY = data.lineTo.y - subLocation;
                            var locationImgX = data.lineTo.x - subLocation;

                            if (data.iconKey) {
                                src = settings.images[data.iconKey];

                                var svg = $templateCache.get(src);
                                var mySrc = (svg) ? 'data:image/svg+xml;base64,' + $window.btoa(svg) : src;

                                imageObj.onload = function () {
                                    ctx.drawImage(imageObj, locationImgX, locationImgY, img, img);
                                };

                                imageObj.src = mySrc;
                            }
                        }

                    }

                }
            };

            return directive;
        }]);

})(angular);

/**
 * TimelineSrv
 *   setImages ie:
 *                 {
 *                    tutorial: '{path to image}'
 *                 }
 *  setColors ie: {
 *                   0: '#75cbe8'
 *                }
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').provider('TimelineSrv', function () {

        var imgObj = {
            drill: 'components/znkTimeline/svg/icons/timeline-drills-icon.svg',
            practice: 'components/znkTimeline/svg/icons/timeline-practice-icon.svg',
            game: 'components/znkTimeline/svg/icons/timeline-mini-challenge-icon.svg',
            tutorial: 'components/znkTimeline/svg/icons/timeline-tips-tricks-icon.svg',
            diagnostic: 'components/znkTimeline/svg/icons/timeline-diagnostic-test-icon.svg',
            section: 'components/znkTimeline/svg/icons/timeline-test-icon.svg'
        };

        var colorsObj = { 0: '#75cbe8', 1: '#f9d41b', 2: '#ff5895', 5: '#AF89D2', 6: '#51CDBA' };

        this.setImages = function(obj) {
            imgObj = obj;
        };

        this.setColors = function(obj) {
            colorsObj = obj;
        };

        this.$get = ["$log", function($log) {
            'ngInject';

            var timelineSrvApi = {};

            function _baseFn(obj, methodName) {
                if (!angular.isObject(obj)) {
                    $log.error('TimelineSrv ' + methodName + ': obj is not an object! obj:', obj);
                }
                return obj;
            }

            timelineSrvApi.getImages =  _baseFn.bind(null, imgObj, 'getImages');

            timelineSrvApi.getColors =  _baseFn.bind(null, colorsObj, 'getColors');

            return timelineSrvApi;
        }];
    });
})(angular);


angular.module('znk.infra.znkTimeline').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/znkTimeline/svg/icons/timeline-diagnostic-test-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\" class=\"timeline-diagnostic-test-icon\" width=\"30px\" height=\"30px\">\n" +
    "	 <style type=\"text/css\">\n" +
    "     	.timeline-diagnostic-test-icon .st0{fill:#fff;}\n" +
    "     </style>\n" +
    "<g id=\"kUxrE9.tif\">\n" +
    "	<g>\n" +
    "		<path class=\"st0\" id=\"XMLID_93_\" d=\"M-140.1,287c0.6-1.1,1.7-1.7,2.9-1.4c1.3,0.3,2,1.1,2.3,2.3c1.1,4,2.1,8,3.2,12c2.4,9.3,4.9,18.5,7.3,27.8\n" +
    "			c0.1,0.3,0.2,0.6,0.2,0.9c0.3,1.7-0.6,3-2.1,3.3c-1.4,0.3-2.8-0.5-3.3-2.1c-1-3.6-2-7.3-2.9-10.9c-2.5-9.5-5-19-7.6-28.6\n" +
    "			C-140.1,290-140.8,288.3-140.1,287z\"/>\n" +
    "		<path class=\"st0\" id=\"XMLID_92_\" d=\"M-89.6,289.1c-1,6.8-2.9,13-10,16c-3.2,1.4-6.5,1.6-9.9,0.9c-2-0.4-4-0.7-6-0.6c-4.2,0.3-7.1,2.7-9,6.4\n" +
    "			c-0.3,0.5-0.5,1.1-0.9,2c-0.3-1-0.5-1.7-0.8-2.5c-2-7-3.9-14.1-5.9-21.2c-0.3-1-0.1-1.7,0.5-2.4c4.5-6,11-7.4,17.5-3.6\n" +
    "			c3.4,2,6.7,4.2,10.2,6.1c1.9,1,3.9,1.9,5.9,2.4c3.2,0.9,5.9,0,7.9-2.6C-90,289.7-89.8,289.4-89.6,289.1z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-drills-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\" class=\"timeline-drills-icon\" width=\"30px\" height=\"30px\">\n" +
    "<style type=\"text/css\">\n" +
    "    .timeline-drills-icon .all > * { fill: #fff; }\n" +
    "	.timeline-drills-icon .st0{clip-path:url(#SVGID_2_);}\n" +
    "	.timeline-drills-icon .st1{clip-path:url(#SVGID_4_);}\n" +
    "</style>\n" +
    "<g id=\"XMLID_93_\" class=\"all\">\n" +
    "	<path id=\"XMLID_105_\" d=\"M-105.3,308.4h-18.6c-0.6,0-1-0.4-1-1c0-0.6,0.4-1,1-1h18.6c0.6,0,1,0.4,1,1S-104.8,308.4-105.3,308.4z\"/>\n" +
    "	<g id=\"XMLID_100_\">\n" +
    "		<path id=\"XMLID_104_\" d=\"M-128.2,317.9c-1.1,0-2-0.9-2-2v-17.8c0-1.1,0.9-2,2-2c1.1,0,2,0.9,2,2v17.8\n" +
    "			C-126.2,317-127.1,317.9-128.2,317.9z\"/>\n" +
    "		<path id=\"XMLID_103_\" d=\"M-132.7,313.7c-0.7,0-1.2-0.6-1.2-1.2v-10.8c0-0.7,0.6-1.2,1.2-1.2c0.7,0,1.2,0.6,1.2,1.2v10.8\n" +
    "			C-131.5,313.1-132,313.7-132.7,313.7z\"/>\n" +
    "		<g id=\"XMLID_101_\">\n" +
    "			<g>\n" +
    "				<g>\n" +
    "					<g>\n" +
    "						<defs>\n" +
    "							<rect id=\"SVGID_1_\" x=\"-140\" y=\"305.6\" width=\"4.3\" height=\"4.3\"/>\n" +
    "						</defs>\n" +
    "						<clipPath id=\"SVGID_2_\">\n" +
    "							<use xlink:href=\"#SVGID_1_\"  style=\"overflow:visible;\"/>\n" +
    "						</clipPath>\n" +
    "						<path id=\"XMLID_99_\" class=\"st0\" d=\"M-134,308.9h-1.5c-0.8,0-1.4-0.6-1.4-1.4c0-0.8,0.6-1.4,1.4-1.4h1.5\n" +
    "							c0.8,0,1.4,0.6,1.4,1.4C-132.6,308.3-133.2,308.9-134,308.9z\"/>\n" +
    "					</g>\n" +
    "				</g>\n" +
    "			</g>\n" +
    "		</g>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_94_\">\n" +
    "		<path id=\"XMLID_98_\" d=\"M-101.3,317.9c-1.1,0-2-0.9-2-2v-17.8c0-1.1,0.9-2,2-2s2,0.9,2,2v17.8C-99.3,317-100.2,317.9-101.3,317.9z\n" +
    "			\"/>\n" +
    "		<path id=\"XMLID_97_\" d=\"M-96.8,313.7c-0.7,0-1.2-0.6-1.2-1.2v-10.8c0-0.7,0.6-1.2,1.2-1.2c0.7,0,1.2,0.6,1.2,1.2v10.8\n" +
    "			C-95.5,313.1-96.1,313.7-96.8,313.7z\"/>\n" +
    "		<g id=\"XMLID_95_\">\n" +
    "			<g>\n" +
    "				<g>\n" +
    "					<g>\n" +
    "						<defs>\n" +
    "							<rect id=\"SVGID_3_\" x=\"-94.3\" y=\"305.6\" width=\"4.3\" height=\"4.3\"/>\n" +
    "						</defs>\n" +
    "						<clipPath id=\"SVGID_4_\">\n" +
    "							<use xlink:href=\"#SVGID_3_\"  style=\"overflow:visible;\"/>\n" +
    "						</clipPath>\n" +
    "						<path id=\"XMLID_107_\" class=\"st1\" d=\"M-94,308.9h-1.5c-0.8,0-1.4-0.6-1.4-1.4c0-0.8,0.6-1.4,1.4-1.4h1.5\n" +
    "							c0.8,0,1.4,0.6,1.4,1.4C-92.7,308.3-93.3,308.9-94,308.9z\"/>\n" +
    "					</g>\n" +
    "				</g>\n" +
    "			</g>\n" +
    "		</g>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-mini-challenge-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-105 277 60 60\" style=\"enable-background:new -105 277 60 60;\" xml:space=\"preserve\" class=\"timeline-mini-challenge-icon\" width=\"30px\" height=\"30px\">\n" +
    "	 	 <style type=\"text/css\">\n" +
    "          	.timeline-mini-challenge-icon .st0{fill:#fff;}\n" +
    "          </style>\n" +
    "<g>\n" +
    "	<path class=\"st0\" d=\"M-75,332c-11.5,0-21-9.4-21-21c0-11.5,9.4-21,21-21s21,9.4,21,21S-63.5,332-75,332z M-75,292.7c-10.1,0-18.4,8.2-18.4,18.4\n" +
    "		s8.2,18.4,18.4,18.4s18.4-8.2,18.4-18.4S-64.9,292.7-75,292.7z\"/>\n" +
    "	<circle class=\"st0\" cx=\"-74.8\" cy=\"312\" r=\"2.3\"/>\n" +
    "	<path class=\"st0\" d=\"M-74.1,308.1h-1c-0.2,0-0.4-0.1-0.4-0.2v-10.6c0-0.1,0.2-0.2,0.4-0.2h1c0.2,0,0.4,0.1,0.4,0.2v10.6\n" +
    "		C-73.7,307.9-73.9,308.1-74.1,308.1z\"/>\n" +
    "	<path class=\"st0\" d=\"M-71,310.8l-0.6-1c-0.1-0.2-0.1-0.4,0-0.5l4.4-2.6c0.1-0.1,0.4,0,0.5,0.2l0.6,1c0.1,0.2,0.1,0.4,0,0.5l-4.4,2.6\n" +
    "		C-70.6,311.1-70.8,311-71,310.8z\"/>\n" +
    "	<path class=\"st0\" d=\"M-76.9,285.8v1.8c0,1.2,0.9,2.1,2.1,2.1c1.2,0,2.1-0.9,2.1-2.1v-1.8H-76.9z\"/>\n" +
    "	<path class=\"st0\" d=\"M-68.5,283.2c0,0.7-0.5,1.2-1.2,1.2h-9.7c-0.7,0-1.2-0.5-1.2-1.2l0,0c0-0.7,0.5-1.2,1.2-1.2h9.7\n" +
    "		C-69,282-68.5,282.5-68.5,283.2L-68.5,283.2z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-practice-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 255.2 169\" style=\"enable-background:new 0 0 255.2 169;\" xml:space=\"preserve\" class=\"practice-icon-svg\" width=\"15px\" height=\"15px\">\n" +
    "<style type=\"text/css\">\n" +
    "	.practice-icon-svg .st0{fill:none;stroke:#fff;stroke-width:12;stroke-linecap:round;stroke-linejoin:round;}\n" +
    "	.practice-icon-svg .st1{fill:none;stroke:#fff;stroke-width:12;stroke-linecap:round;}\n" +
    "	.practice-icon-svg .st2{fill:none;stroke:#fff;stroke-width:12;stroke-linecap:round;stroke-linejoin:round;}\n" +
    "</style>\n" +
    "<g>\n" +
    "	<polyline class=\"st0\" points=\"142,41 3,41 3,166 59,166 	\"/>\n" +
    "	<line class=\"st1\" x1=\"35\" y1=\"75\" x2=\"93\" y2=\"75\"/>\n" +
    "	<line class=\"st1\" x1=\"35\" y1=\"102\" x2=\"77\" y2=\"102\"/>\n" +
    "	<line class=\"st1\" x1=\"35\" y1=\"129\" x2=\"79\" y2=\"129\"/>\n" +
    "	<polygon class=\"st0\" points=\"216.8,3 111.2,106.8 93,161.8 146.8,146 252.2,41 	\"/>\n" +
    "	<line class=\"st2\" x1=\"193.2\" y1=\"31.7\" x2=\"224\" y2=\"64.8\"/>\n" +
    "	<polygon points=\"102.5,139.7 114.5,153.8 97.2,157.3 	\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-test-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-111 277 60 60\" style=\"enable-background:new -111 277 60 60;\" xml:space=\"preserve\" class=\"timeline-test-icon\" width=\"30px\" height=\"30px\">\n" +
    "<style type=\"text/css\">\n" +
    "	.timeline-test-icon .st0{fill:#fff;}\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path class=\"st0\" d=\"M-62.9,332h-36.2c-1.5,0-2.8-1.2-2.8-2.8v-44.5c0-1.5,1.2-2.8,2.8-2.8h36.2c1.5,0,2.8,1.2,2.8,2.8v44.5\n" +
    "		C-60.1,330.8-61.4,332-62.9,332z M-99.1,283.6c-0.6,0-1.2,0.5-1.2,1.2v44.5c0,0.6,0.5,1.2,1.2,1.2h36.2c0.6,0,1.2-0.5,1.2-1.2\n" +
    "		v-44.5c0-0.6-0.5-1.2-1.2-1.2H-99.1L-99.1,283.6z\"/>\n" +
    "	<g id=\"XMLID_312_\">\n" +
    "		<circle id=\"XMLID_199_\" class=\"st0\" cx=\"-95\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_198_\" class=\"st0\" cx=\"-92.5\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_197_\" class=\"st0\" cx=\"-89.9\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_196_\" class=\"st0\" cx=\"-95\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_195_\" class=\"st0\" cx=\"-92.5\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_194_\" class=\"st0\" cx=\"-90\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_193_\" class=\"st0\" cx=\"-95\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_192_\" class=\"st0\" cx=\"-92.5\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_191_\" class=\"st0\" cx=\"-89.9\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_302_\">\n" +
    "		<circle id=\"XMLID_190_\" class=\"st0\" cx=\"-83.6\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_189_\" class=\"st0\" cx=\"-81.1\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_188_\" class=\"st0\" cx=\"-78.6\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_187_\" class=\"st0\" cx=\"-83.7\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_186_\" class=\"st0\" cx=\"-81.1\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_185_\" class=\"st0\" cx=\"-78.6\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_184_\" class=\"st0\" cx=\"-83.6\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_183_\" class=\"st0\" cx=\"-81.1\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_182_\" class=\"st0\" cx=\"-78.6\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_292_\">\n" +
    "		<circle id=\"XMLID_181_\" class=\"st0\" cx=\"-72.3\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_180_\" class=\"st0\" cx=\"-69.8\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_179_\" class=\"st0\" cx=\"-67.2\" cy=\"287.6\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_178_\" class=\"st0\" cx=\"-72.3\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_177_\" class=\"st0\" cx=\"-69.8\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_176_\" class=\"st0\" cx=\"-67.2\" cy=\"290.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_175_\" class=\"st0\" cx=\"-72.3\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_174_\" class=\"st0\" cx=\"-69.8\" cy=\"292.9\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_173_\" class=\"st0\" cx=\"-67.2\" cy=\"292.9\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_282_\">\n" +
    "		<circle id=\"XMLID_172_\" class=\"st0\" cx=\"-94.9\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_171_\" class=\"st0\" cx=\"-92.3\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_170_\" class=\"st0\" cx=\"-89.8\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_169_\" class=\"st0\" cx=\"-94.9\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_168_\" class=\"st0\" cx=\"-92.4\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_167_\" class=\"st0\" cx=\"-89.8\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_166_\" class=\"st0\" cx=\"-94.9\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_165_\" class=\"st0\" cx=\"-92.3\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_164_\" class=\"st0\" cx=\"-89.8\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_272_\">\n" +
    "		<circle id=\"XMLID_163_\" class=\"st0\" cx=\"-83.5\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_162_\" class=\"st0\" cx=\"-81\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_161_\" class=\"st0\" cx=\"-78.4\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_160_\" class=\"st0\" cx=\"-83.5\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_159_\" class=\"st0\" cx=\"-81\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_158_\" class=\"st0\" cx=\"-78.5\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_157_\" class=\"st0\" cx=\"-83.5\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_156_\" class=\"st0\" cx=\"-81\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_155_\" class=\"st0\" cx=\"-78.4\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_262_\">\n" +
    "		<circle id=\"XMLID_154_\" class=\"st0\" cx=\"-72.1\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_153_\" class=\"st0\" cx=\"-69.6\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_152_\" class=\"st0\" cx=\"-67.1\" cy=\"298.5\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_151_\" class=\"st0\" cx=\"-72.2\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_150_\" class=\"st0\" cx=\"-69.6\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_149_\" class=\"st0\" cx=\"-67.1\" cy=\"301\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_148_\" class=\"st0\" cx=\"-72.1\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_147_\" class=\"st0\" cx=\"-69.6\" cy=\"303.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_146_\" class=\"st0\" cx=\"-67.1\" cy=\"303.8\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_252_\">\n" +
    "		<circle id=\"XMLID_145_\" class=\"st0\" cx=\"-94.7\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_144_\" class=\"st0\" cx=\"-92.2\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_143_\" class=\"st0\" cx=\"-89.7\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_142_\" class=\"st0\" cx=\"-94.8\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_141_\" class=\"st0\" cx=\"-92.3\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_140_\" class=\"st0\" cx=\"-89.8\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_139_\" class=\"st0\" cx=\"-94.7\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_138_\" class=\"st0\" cx=\"-92.2\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_137_\" class=\"st0\" cx=\"-89.7\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_242_\">\n" +
    "		<circle id=\"XMLID_136_\" class=\"st0\" cx=\"-83.4\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_135_\" class=\"st0\" cx=\"-80.9\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_134_\" class=\"st0\" cx=\"-78.3\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_133_\" class=\"st0\" cx=\"-83.4\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_132_\" class=\"st0\" cx=\"-80.9\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_131_\" class=\"st0\" cx=\"-78.4\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_130_\" class=\"st0\" cx=\"-83.4\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_129_\" class=\"st0\" cx=\"-80.9\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_128_\" class=\"st0\" cx=\"-78.3\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_232_\">\n" +
    "		<circle id=\"XMLID_127_\" class=\"st0\" cx=\"-72\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_126_\" class=\"st0\" cx=\"-69.5\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_125_\" class=\"st0\" cx=\"-67\" cy=\"309.2\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_124_\" class=\"st0\" cx=\"-72\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_123_\" class=\"st0\" cx=\"-69.6\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_122_\" class=\"st0\" cx=\"-67\" cy=\"311.7\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_121_\" class=\"st0\" cx=\"-72\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_120_\" class=\"st0\" cx=\"-69.5\" cy=\"314.4\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_119_\" class=\"st0\" cx=\"-67\" cy=\"314.4\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_222_\">\n" +
    "		<circle id=\"XMLID_118_\" class=\"st0\" cx=\"-94.5\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_117_\" class=\"st0\" cx=\"-91.9\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_116_\" class=\"st0\" cx=\"-89.4\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_115_\" class=\"st0\" cx=\"-94.5\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_114_\" class=\"st0\" cx=\"-92\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_113_\" class=\"st0\" cx=\"-89.5\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_112_\" class=\"st0\" cx=\"-94.5\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_111_\" class=\"st0\" cx=\"-91.9\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_110_\" class=\"st0\" cx=\"-89.4\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_212_\">\n" +
    "		<circle id=\"XMLID_109_\" class=\"st0\" cx=\"-83.1\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_108_\" class=\"st0\" cx=\"-80.6\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_107_\" class=\"st0\" cx=\"-78.1\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_106_\" class=\"st0\" cx=\"-83.1\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_105_\" class=\"st0\" cx=\"-80.6\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_104_\" class=\"st0\" cx=\"-78.1\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_103_\" class=\"st0\" cx=\"-83.1\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_102_\" class=\"st0\" cx=\"-80.6\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_101_\" class=\"st0\" cx=\"-78.1\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "	<g id=\"XMLID_202_\">\n" +
    "		<circle id=\"XMLID_100_\" class=\"st0\" cx=\"-71.7\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_99_\" class=\"st0\" cx=\"-69.2\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_98_\" class=\"st0\" cx=\"-66.7\" cy=\"319.8\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_97_\" class=\"st0\" cx=\"-71.8\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_96_\" class=\"st0\" cx=\"-69.3\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_95_\" class=\"st0\" cx=\"-66.8\" cy=\"322.3\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_94_\" class=\"st0\" cx=\"-71.7\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_93_\" class=\"st0\" cx=\"-69.2\" cy=\"325.1\" r=\"1\"/>\n" +
    "		<circle id=\"XMLID_92_\" class=\"st0\" cx=\"-66.7\" cy=\"325.1\" r=\"1\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/znkTimeline/svg/icons/timeline-tips-tricks-icon.svg",
    "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"-145 277 60 60\" style=\"enable-background:new -145 277 60 60;\" xml:space=\"preserve\" class=\"timeline-tips-tricks-icon\" width=\"30px\" height=\"30px\">\n" +
    "<style type=\"text/css\">\n" +
    "	.timeline-tips-tricks-icon .st0{fill:#fff;}\n" +
    "</style>\n" +
    "<g id=\"XMLID_203_\">\n" +
    "	<path id=\"XMLID_209_\" class=\"st0\" d=\"M-115.2,285.5\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_207_\" d=\"M-123.6,319c-0.1,0-0.2,0-0.4,0c-0.8-0.2-1.3-1-1.1-1.8c0,0,0.9-4.1-1.7-7.4c-2.2-2.8-4.7-6.6-4.7-11.4\n" +
    "		c0-9,7.3-16.4,16.4-16.4s16.4,7.3,16.4,16.4c0,4.8-2.5,8.6-4.7,11.4c-2.6,3.3-1.7,7.4-1.7,7.4c0.2,0.8-0.3,1.6-1.1,1.8\n" +
    "		c-0.8,0.2-1.6-0.3-1.8-1.1c0-0.2-1.2-5.5,2.2-9.9c2-2.6,4-5.7,4-9.6c0-7.4-6-13.4-13.4-13.4c-7.4,0-13.4,6-13.4,13.4\n" +
    "		c0,3.9,2,7,4,9.6c3.5,4.5,2.3,9.7,2.2,9.9C-122.3,318.6-122.9,319-123.6,319z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_206_\" d=\"M-107.5,322.4h-15.1c-0.5,0-1-0.5-1-1c0-0.5,0.5-1,1-1h15.1c0.5,0,1,0.5,1,1\n" +
    "		C-106.5,322-106.9,322.4-107.5,322.4z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_205_\" d=\"M-107,325.4H-123c-0.5,0-1-0.5-1-1s0.5-1,1-1h16.1c0.5,0,1,0.5,1,1C-106,325-106.4,325.4-107,325.4z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_210_\" d=\"M-109,328.5h-12.5c-0.5,0-1-0.5-1-1c0-0.5,0.5-1,1-1h12.5c0.5,0,1,0.5,1,1C-108,328-108.4,328.5-109,328.5z\"/>\n" +
    "	<path class=\"st0\" id=\"XMLID_204_\" d=\"M-111.1,329.7c-0.3,1.6-1.8,2.3-4.1,2.3s-3.6-0.8-4.1-2.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);
