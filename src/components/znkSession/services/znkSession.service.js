(function (angular) {
    'use strict';
    angular.module('znk.infra.znkSession').provider('SessionSrv',
        function() {
            var subjects;

            this.setSessionSubjects = function(_subjects) {
                subjects = _subjects;
            };

            this.$get = function($rootScope, $log, ENV, AuthService, InfraConfigSrv,  StudentContextSrv, TeacherContextSrv,
                                 UtilitySrv, SessionSubjectEnumConst, $mdDialog, SessionsStatusEnum,
                                 $window, $timeout, PopUpSrv, $interval) {
                'ngInject';

                function getRoundTime() {
                    return Math.floor(Date.now() / 1000) * 1000;
                }
                function sessionInit(sessionSubject) {
                    return {
                        appName: ENV.studentAppName.split('_')[0],
                        sessionGUID: UtilitySrv.general.createGuid(),
                        educatorUID: userAuth.uid,
                        studentUID: StudentContextSrv.getCurrUid(),
                        extendTime: 0,
                        startTime: getRoundTime(),
                        duration: null,
                        sessionSubject: sessionSubject.id,
                        status: SessionsStatusEnum.ACTIVE.enum  //(values: 1 = Active, 0 = Ended)
                    };
                }
                function getLiveSessionPath(param) {
                    if (!userAuth) {
                        $log.error('Invalid user');
                        return;
                    }
                    var path;
                    var educatorUID = isTeacherApp ? userAuth.uid : TeacherContextSrv.getCurrUid();
                    var studentUID = isTeacherApp ? StudentContextSrv.getCurrUid() : userAuth.uid;
                    switch (param) {
                        case 'sessions':
                            path = ENV.studentAppName + '/liveSession/' + currLiveSessionsGUID.guid;
                            return path;
                        case 'student':
                            path = ENV.studentAppName + '/users/$$uid/liveSession';
                            return path.replace('$$uid', '' + studentUID);
                        case 'educator':
                            path = ENV.dashboardAppName + '/users/$$uid/liveSession';
                            return path.replace('$$uid', '' + educatorUID);
                        default:
                            return;
                    }
                }
                function saveSession() {
                    $log.debug('saveSession, sessionData: ', sessionData);
                    var dataToSave = {};
                    return globalStorageProm.then(function (globalStorage) {
                        var studentPath = getLiveSessionPath('student') + '/active';
                        var educatorPath = getLiveSessionPath('educator') + '/active';
                        var sessionPath = getLiveSessionPath('sessions');
                        dataToSave[sessionPath] = sessionData;
                        dataToSave[studentPath] = dataToSave[educatorPath] ={ guid: sessionData.sessionGUID };
                        return globalStorage.update(dataToSave);
                    });
                }
                function updateSession() {
                    $log.debug('updateSession, sessionData: ', sessionData);
                    var dataToSave = {};
                    return globalStorageProm.then(function (globalStorage) {
                        var studentPath = getLiveSessionPath('student');
                        var studentPathActive = studentPath + '/active';
                        var studentPathArchive = studentPath + '/archive/' + sessionData.sessionGUID;
                        var educatorPath = getLiveSessionPath('educator');
                        var educatorPathActive = educatorPath + '/active';
                        var educatorPathArchive = educatorPath + '/archive/' + sessionData.sessionGUID;
                        var sessionPath = getLiveSessionPath('sessions');
                        dataToSave[sessionPath] = sessionData;
                        dataToSave[studentPathArchive] = dataToSave[educatorPathArchive] = false;
                        dataToSave[studentPathActive] = dataToSave[educatorPathActive] = { guid: false };
                        return globalStorage.update(dataToSave);
                    });
                }
                function checkSessionDuration() {
                    checkDurationInterval = $interval(function () {
                        liveSessionDuration = (getRoundTime() - sessionData.startTime)  / 60000; // convert to minutes
                        var sessionTimeWithExtension = ENV.liveSession.sessionLength + sessionData.extendTime;
                        var EndAlertTimeWithExtension = ENV.liveSession.sessionEndAlertTime + sessionData.extendTime;

                        if (liveSessionDuration >= sessionTimeWithExtension) {
                            sessionSrvApi.endSession();
                        } else if (liveSessionDuration >= EndAlertTimeWithExtension && !isSessionAlertShown) {
                            sessionEndAlert();
                        }

                    }, 60000);
                }
                function sessionEndAlert() {
                    var alertPopupTitle = 'Live session will end in ' + ENV.liveSession.sessionEndAlertTime + ' minutes.';
                    var popUpInstance = PopUpSrv.warning(alertPopupTitle, null,'Extend Session Time', 'OK');
                    return popUpInstance.promise.then(function(){
                        sessionData.extendTime += ENV.liveSession.sessionExtendTime;
                        $log.debug('Live session is extend by ' + ENV.liveSession.sessionExtendTime + ' minutes.');
                    },function(){
                        isSessionAlertShown = true;
                        $log.debug('Live session is continued.');
                    });
                }
                function destroyCheckDurationInterval() {
                    $interval.cancel(checkDurationInterval);
                }

                var activePanelCb;
                var checkDurationInterval;
                var liveSessionDuration;
                var liveSessionsStatus;
                var currLiveSessionsGUID;
                var isSessionAlertShown = false;
                var sessionSrvApi = {};
                var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';
                var userAuth = AuthService.getAuth();
                var globalStorageProm = InfraConfigSrv.getGlobalStorage();
                var sessionData = {};

                sessionSrvApi.startSession = function (sessionSubject) {
                    sessionData = sessionInit(sessionSubject);
                    currLiveSessionsGUID = { guid: sessionData.sessionGUID };
                    liveSessionsStatus = SessionsStatusEnum.ACTIVE.enum;
                    checkSessionDuration();
                    saveSession().then(function (res) {
                        activePanelCb(sessionData);
                        $log.debug('Live Session Saved: ', res);
                    }).catch(function (err) {
                        $log.error('Error saving live session to firebase: ', err);
                    });
                };

                sessionSrvApi.getSessionSubjects = function() {
                    if (!subjects) {
                        subjects = [SessionSubjectEnumConst.MATH, SessionSubjectEnumConst.ENGLISH];
                    }
                    return subjects.map(function (subjectId) {
                        var name = UtilitySrv.object.getKeyByValue(SessionSubjectEnumConst, subjectId).toLowerCase();
                        return {
                            id: subjectId,
                            name: name,
                            iconName: 'znkSession-' + name + '-icon'
                        };
                    });
                };

                sessionSrvApi.getLiveSessionGUID = function () {
                    var activeSessionPath  = isTeacherApp ? getLiveSessionPath('educator') : getLiveSessionPath('student');
                    activeSessionPath += '/active';
                    return globalStorageProm.then(function (globalStorage) {
                        return globalStorage.getAndBindToServer(activeSessionPath);
                    });
                };

                sessionSrvApi.loadLiveSessionData = function () {
                    $log.debug('Load Live Session Data, session GUID: ', currLiveSessionsGUID);
                    globalStorageProm.then(function (globalStorage) {
                        var sessionsPath = getLiveSessionPath('sessions');
                        globalStorage.get(sessionsPath).then(function (currSessionData) {
                            sessionData = currSessionData;
                            $log.debug('loadLiveSessionData, sessionData: ', sessionData);
                             activePanelCb(sessionData);
                        });
                    });
                };

                sessionSrvApi.listenToLiveSessionsStatus = function () {
                    return sessionSrvApi.getLiveSessionGUID().then(function (sessionGUID) {
                        currLiveSessionsGUID = sessionGUID;
                        $rootScope.$watch(function () { return currLiveSessionsGUID; },
                            function (newLiveSessionGUID) {
                                liveSessionsStatus = newLiveSessionGUID.guid ?
                                    SessionsStatusEnum.ACTIVE.enum : SessionsStatusEnum.ENDED.enum;
                                var isSessionData = !(angular.equals(sessionData, {}));
                                if (liveSessionsStatus === SessionsStatusEnum.ACTIVE.enum && !isSessionData) {
                                    sessionSrvApi.loadLiveSessionData();
                                }
                                if (newLiveSessionGUID.guid && !isTeacherApp) {
                                    $log.debug('There is an active live session');
                                    PopUpSrv.info('You joined a live Session');
                                }
                            }, true);
                    });
                };

                sessionSrvApi.endSession = function () {
                    $log.debug('Live session has ended.');
                    var endTime = getRoundTime();
                    sessionData.status = liveSessionsStatus = SessionsStatusEnum.ENDED.enum;
                    sessionData.duration = endTime - sessionData.startTime;
                    destroyCheckDurationInterval();
                    activePanelCb(sessionData);
                    updateSession().then(function (res) {
                        $log.debug('Live Session Updated in firebase: ', res);
                        PopUpSrv.info('Live session has ended');
                    }).catch(function (err) {
                        $log.error('Error updating live session to firebase: ', err);
                    });
                };

                sessionSrvApi.registerToCurrUserLiveSessionStateChanges = function (cb) {
                    if (angular.isFunction(cb)) {
                        activePanelCb = cb;
                    }
                };

                return sessionSrvApi;
            };
        }
    );
})(angular);

