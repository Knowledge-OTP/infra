(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .directive('etutoringActionBar',
            function (InvitationService, PresenceService, $timeout, ScreenSharingSrv, TeacherContextSrv, $log,
                      $q, CallsEventsSrv, CallsStatusEnum, UserScreenSharingStateEnum, UserProfileService, ENV) {
                'ngInject';
                return {
                    templateUrl: 'components/eTutoring/components/etutoringActionBar/etutoringActionBar.template.html',
                    restrict: 'E',
                    scope: {},
                    link: function (scope) {
                        scope.expandIcon = 'expand_more';
                        scope.userStatus = PresenceService.userStatus;
                        scope.callBtnModel = {};
                        scope.callStatus = 0;
                        scope.screenShareStatus = 0;
                        scope.lockTeacherSelection = false;

                        scope.changeSelectIcon = function () {
                            scope.expandIcon = 'expand_less';
                        };

                        scope.selectTeacher = function (teacher) {
                            if (teacher) {
                                TeacherContextSrv.setCurrentUid(teacher.senderUid);
                                scope.currentTeacher = teacher;
                                setBtnModelForCurrentTeacher(teacher);
                                $log.debug('teacher uid: ', teacher.senderUid);
                            } else {
                                TeacherContextSrv.setCurrentUid('');
                                $log.debug('teacher uid is not defined: ', teacher);
                            }
                        };

                        scope.$watchCollection('myTeachers', function (newVal) {
                            if (angular.isUndefined(newVal)) {
                                return;
                            }
                            if (!angular.equals(scope.myTeachers, {})) {
                                var teachersKeys = Object.keys(scope.myTeachers);
                                var currentTeacherId = TeacherContextSrv.getCurrUid();
                                var foundTeacher = false;

                                if (angular.isDefined(currentTeacherId) && currentTeacherId !== null) {
                                    angular.forEach(teachersKeys, function (key) {
                                        if (scope.myTeachers[key].senderUid === currentTeacherId) {
                                            foundTeacher = true;
                                            scope.selectTeacher(scope.myTeachers[key]);
                                        }
                                    });
                                }
                                if (!foundTeacher) {
                                    angular.forEach(teachersKeys, function (key) {
                                        if (scope.myTeachers[key].senderEmail !== ENV.supportEmail) {
                                            scope.selectTeacher(scope.myTeachers[key]);
                                        }
                                    });
                                }
                                startTrackTeachersPresence();
                            }
                        });

                        scope.$on('$destroy', function () {
                            stopTrackTeachersPresence();
                        });

                        scope.$on('$mdMenuClose', function () {
                            scope.expandIcon = 'expand_more';
                        });

                        function startTrackTeachersPresence() {
                            angular.forEach(scope.myTeachers, function (teacher) {
                                PresenceService.startTrackUserPresence(teacher.senderUid, trackUserPresenceCB.bind(null, teacher.senderUid));
                            });
                        }

                        function stopTrackTeachersPresence() {
                            angular.forEach(scope.myTeachers, function (teacher) {
                                PresenceService.stopTrackUserPresence(teacher.senderUid);
                            });
                        }

                        function trackUserPresenceCB(userId, newStatus) {
                            $timeout(function () {
                                angular.forEach(scope.myTeachers, function (teacher) {
                                    if (teacher.senderUid === userId) {
                                        teacher.presence = newStatus;
                                    }
                                    setBtnModelForCurrentTeacher(teacher);
                                });
                            });
                        }

                        function setBtnModelForCurrentTeacher(teacher) {
                            if (scope.currentTeacher.senderUid === teacher.senderUid) {
                                scope.callBtnModel = {
                                    isOffline: teacher.presence === PresenceService.userStatus.OFFLINE,
                                    receiverId: teacher.senderUid
                                };
                            }
                        }

                        function actionBarMyTeachersCB(teachers) {
                            scope.myTeachers = teachers;
                        }

                        scope.showTeacherScreen = function () {
                            if (scope.currentTeacher) {
                                var teacherData = {
                                    isTeacher: true,
                                    uid: scope.currentTeacher.senderUid
                                };
                                ScreenSharingSrv.viewOtherUserScreen(teacherData);
                            }
                        };

                        scope.shareMyScreen = function () {
                            if (scope.currentTeacher) {
                                var teacherData = {
                                    isTeacher: true,
                                    uid: scope.currentTeacher.senderUid
                                };
                                ScreenSharingSrv.shareMyScreen(teacherData);
                            }
                        };

                        function switchTeacherWhenInActiveCallOrScreenShare(evtName, callsData) {
                            var getIncomingDataProm;
                            var incomingTeacherUid;
                            if (scope.callStatus + scope.screenShareStatus === 0) {
                                return;
                            }
                            UserProfileService.getCurrUserId().then(function (userId) {
                                if (evtName === 'calls') {
                                    if (callsData.callerId === userId) {
                                        incomingTeacherUid = callsData.receiverId;
                                    } else if (callsData.receiverId === userId) {
                                        incomingTeacherUid = callsData.callerId;
                                    }
                                    getIncomingDataProm = $q.when(incomingTeacherUid);
                                } else if (evtName === 'screen') {
                                    getIncomingDataProm = ScreenSharingSrv.getActiveScreenSharingData()
                                        .then(function (activeScreenSharingData) {
                                            if (angular.isObject(activeScreenSharingData) && activeScreenSharingData !== null) {
                                                if (activeScreenSharingData.viewerId === userId) {
                                                    incomingTeacherUid = activeScreenSharingData.sharerId;
                                                } else if (activeScreenSharingData.sharerId === userId) {
                                                    incomingTeacherUid = activeScreenSharingData.viewerId;
                                                }
                                            }
                                        });
                                }
                                getIncomingDataProm.then(function () {
                                    var teacherObj = false;
                                    for (var prop in scope.myTeachers) {
                                        if (scope.myTeachers.hasOwnProperty(prop)) {
                                            var curTeacher = scope.myTeachers[prop];
                                            if (curTeacher.senderUid === incomingTeacherUid) {
                                                teacherObj = curTeacher;
                                                break;
                                            }
                                        }
                                    }
                                    if (teacherObj) {
                                        scope.selectTeacher(teacherObj);
                                    }
                                });
                            });
                        }

                        function updateLockTeacher() {
                            scope.lockTeacherSelection = (scope.callStatus + scope.screenShareStatus);
                        }

                        function listenToCallsStatus(callsData) {
                            scope.callStatus = 0;
                            if (callsData) {
                                if (callsData.status === CallsStatusEnum.ACTIVE_CALL.enum) {
                                    scope.callStatus = 1;
                                }
                                switchTeacherWhenInActiveCallOrScreenShare('calls', callsData);
                                updateLockTeacher();
                            }
                        }

                        function listenToScreenShareStatus(screenSharingData) {
                            scope.screenShareStatus = 0;
                            if (screenSharingData) {
                                if (screenSharingData !== UserScreenSharingStateEnum.NONE.enum) {
                                    scope.screenShareStatus = 1;
                                }
                                switchTeacherWhenInActiveCallOrScreenShare('screen');
                                updateLockTeacher();
                            }
                        }

                        ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(listenToScreenShareStatus);

                        CallsEventsSrv.registerToCurrUserCallStateChanges(listenToCallsStatus);

                        InvitationService.registerListenerCB(InvitationService.listeners.USER_TEACHERS, actionBarMyTeachersCB);
                    }
                };
            });
})(angular);


