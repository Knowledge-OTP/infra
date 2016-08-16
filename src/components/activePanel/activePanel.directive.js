'use strict';

(function (angular) {

    angular.module('znk.infra.activePanel')
        .directive('activePanel', function ($interval,
                                            $filter,
                                            $log,
                                            CallsUiSrv,
                                            CallsEventsSrv,
                                            CallsStatusEnum,
                                            ScreenSharingSrv,
                                            UserScreenSharingStateEnum,
                                            UserProfileService,
                                            StudentContextSrv,
                                            TeacherContextSrv,
                                            PresenceService,
                                            ENV) {
            return {
                templateUrl: 'components/activePanel/activePanel.template.html',
                scope: {
                    // callBtnModel: '='
                },
                link: function(scope, element) {
                    var receiverId;
                    var callDuration = 0,
                        durationToDisplay,
                        timerInterval,
                        screenShareStatus = '0',
                        callStatus = '0';

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        // var currentUserUID = currUid;
                        console.log(currUid);
                        if (ENV.appContext === 'dashboard') {
                            receiverId = StudentContextSrv.getCurrUid();
                        } else if (ENV.appContext === 'student') {
                            receiverId = TeacherContextSrv.getCurrUid();
                        }

                        PresenceService.getCurrentUserStatus(receiverId).then(function (res) {
                            console.log('PresenceService.getCurrentUserStatus', res);
                        });
                    });

                    scope.d = {
                        states: {
                            NONE: '00',
                            CALL_ACTIVE: '01',
                            SCREEN_SHARE_ACTIVE: '10',
                            BOTH_ACTIVE: '11'
                        },
                        callBtnModel: {
                            // presence: newValue.presence,
                            // isOffline: newValue.presence !== PresenceService.userStatus.ONLINE,
                            receiverId: receiverId
                        },
                        showShareScreenBtns: true,
                        calleeName: ''
                    };

                    CallsUiSrv.getCalleeName().then(function(calleeName){
                        scope.d.calleeName = calleeName;
                    });

                    var actions = {
                        hideUI: function () {
                            $log.debug('hideUI');
                            element.removeClass('visible');
                        },
                        showUI: function () {
                            $log.debug('showUI');
                            element.addClass('visible');
                        },
                        startTimer: function () {
                            $log.debug('call timer started');
                            timerInterval = $interval(function () {
                                callDuration += 1000;
                                durationToDisplay = $filter('formatDuration')(callDuration / 1000, 'hh:MM:SS', true);
                                angular.element(element[0].querySelector('.call-duration')).text(durationToDisplay);
                            }, 1000, 0, false);
                        },
                        stopTimer: function () {
                            $interval.cancel(timerInterval);
                        },
                        screenShareMode: function (isScreenShareMode) {
                            $log.debug('screenShareMode');
                            if (isScreenShareMode) {
                                element.addClass('screen-share-mode');
                            } else {
                                element.removeClass('screen-share-mode');
                            }
                        },
                        callBtnMode: function () {
                            $log.debug('callBtnMode');
                        },
                        screenShareBtnsMode: function () {
                            $log.debug('screenShareBtnsMode');
                        }
                    };

                    /**
                     * From CallEventsSRV
                     * @param component
                     * @param status
                     */
                    // this.nonono_updateStatus = function (component, status) {
                    //     if (!component || !status) {
                    //         $log.error('must pass the component & status args to function');
                    //         return;
                    //     }
                    //
                    //     function isScreenSharingActive() {
                    //         return (currentStatus.screenSharing === ActivePanelStatusEnum.ACTIVE.enum);
                    //     }
                    //
                    //     function isCallActive() {
                    //         return (currentStatus.calls === ActivePanelStatusEnum.ACTIVE.enum);
                    //     }
                    //
                    //     switch (true) {
                    //         case component === ActivePanelComponentEnum.CALLS.enum && status === ActivePanelStatusEnum.ACTIVE.enum :
                    //             // component = call, status = active
                    //             // show true
                    //             // start timer
                    //             // call btn in hangup mode
                    //             currentStatus.calls = ActivePanelStatusEnum.ACTIVE.enum;
                    //             actions.showUI();
                    //             actions.startTimer();
                    //             //callBtnMode('hangup');
                    //             break;
                    //
                    //         case component === ActivePanelComponentEnum.CALLS.enum && status === ActivePanelStatusEnum.INACTIVE.enum :
                    //             // component = call, status = inactive (hangup, disc')
                    //             // actions.stopTimer
                    //             // call btn is in call mode
                    //             // if screenShare is inactive, hide drv
                    //             currentStatus.calls = ActivePanelStatusEnum.INACTIVE.enum;
                    //             actions.stopTimer();
                    //             //callBtnMode('call');
                    //             if (!isScreenSharingActive()) {
                    //                 actions.hideUI();
                    //             }
                    //             break;
                    //
                    //         case component === ActivePanelComponentEnum.SCREEN_SHARE.enum && status === ActivePanelStatusEnum.ACTIVE.enum :
                    //             // component = screenShare, status = active
                    //             // show drv
                    //             // screenShare buttons are disabled
                    //             currentStatus.screenSharing = ActivePanelStatusEnum.ACTIVE.enum;
                    //             actions.showUI();
                    //             actions.screenShareMode(true);
                    //             //screenShareBtnsMode('disabled');
                    //             break;
                    //
                    //         case component === ActivePanelComponentEnum.SCREEN_SHARE.enum && status === ActivePanelStatusEnum.INACTIVE.enum :
                    //             // component = screenShare, status = inactive
                    //             // check if call is active, if not hide drv
                    //             // return shareScreen btns to enabled state
                    //             currentStatus.screenSharing = ActivePanelStatusEnum.INACTIVE.enum;
                    //             if (!isCallActive()) {
                    //                 //actions.hideUI(); // TODO: is this needed?
                    //             }
                    //             actions.screenShareMode(false);
                    //             //screenShareBtnsMode('enabled');
                    //             break;
                    //
                    //         default:
                    //             actions.hideUI();
                    //             break;
                    //     }
                    // };

                    function updateStatus() {
                        //scope.d.currStatus = screenShareStatus + callStatus;
                        // test:
                        // scope.d.currStatus = scope.d.states.NONE;
                        scope.d.currStatus = scope.d.states.CALL_ACTIVE;
                        // scope.d.currStatus = scope.d.states.SCREEN_SHARE_ACTIVE;
                        // scope.d.currStatus = scope.d.states.BOTH_ACTIVE;

                        switch (scope.d.currStatus) {
                            case scope.d.states.NONE :
                                // actions.hideUI();
                                break;
                            case scope.d.states.CALL_ACTIVE :
                                actions.startTimer();
                                // call btn in hangup mode
                                // callBtnMode('hangup');
                                break;
                            case scope.d.states.SCREEN_SHARE_ACTIVE :
                                // show drv
                                //             // screenShare buttons are disabled
                                //             currentStatus.screenSharing = ActivePanelStatusEnum.ACTIVE.enum;
                                //             actions.showUI();
                                //             actions.screenShareMode(true);
                                //             //screenShareBtnsMode('disabled');
                                break;
                            case scope.d.states.BOTH_ACTIVE :
                                //
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

                    // scope.iama = 'student';
                    scope.iama = 'teacher';


                    // Listen to status changes in Calls
                    var listenToCallsStatus = function (callsData) {
                        if (callsData) {
                            if (callsData === CallsStatusEnum.ACTIVE_CALL.enum) {
                                callStatus = scope.d.states.CALL_ACTIVE;
                            }
                            updateStatus();
                        }
                    };

                    // Listen to status changes in ScreenSharing
                    var listenToScreenShareStatus = function (screenSharingStatus) {
                        if (screenSharingStatus) {
                            if (screenSharingStatus !== UserScreenSharingStateEnum.NONE.enum) {
                                screenShareStatus = scope.d.states.SCREEN_SHARE_ACTIVE;
                            }
                            updateStatus();
                        }
                    };

                    ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(listenToScreenShareStatus);

                    CallsEventsSrv.registerToCurrUserCallStateChanges(listenToCallsStatus);

                }
            };
        });
})(angular);
