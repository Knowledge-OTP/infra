'use strict';

(function (angular) {

    angular.module('znk.infra.activePanel')
        .directive('activePanel', function ($q, $interval, $filter, $log, CallsUiSrv, CallsEventsSrv, CallsStatusEnum, ScreenSharingSrv, UserScreenSharingStateEnum, UserProfileService, PresenceService, StudentContextSrv, TeacherContextSrv, ENV, $document, $translate) {
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
                            CallsUiSrv.getCalleeName(receiverId, uid)
                        ];
                        $q.all(promsArr).then(function (res) {
                            scope.d.currentUserPresenceStatus = res[0];
                            isOffline = scope.d.currentUserPresenceStatus === scope.d.presenceStatusMap.OFFLINE;
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
        });
})(angular);
