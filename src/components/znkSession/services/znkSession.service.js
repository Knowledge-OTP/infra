(function (angular) {
    'use strict';
    angular.module('znk.infra.znkSession').provider('SessionSrv',
        function() {
            var subjects;

            this.setSessionSubjects = function(_subjects) {
                subjects = _subjects;
            };

            this.$get = function($rootScope, $log, ENV, AuthService, InfraConfigSrv,  StudentContextSrv, TeacherContextSrv,
                                 UtilitySrv, SessionSubjectEnumConst, $mdDialog, ActivePanelSrv, SessionsStatusEnum,
                                 $window, $timeout, PopUpSrv) {
                'ngInject';

                function sessionInit(sessionSubject) {
                    return {
                        appName: ENV.studentAppName.split('_')[0],
                        sessionGUID: UtilitySrv.general.createGuid(),
                        educatorUID: userAuth.uid,
                        studentUID: StudentContextSrv.getCurrUid(),
                        extendTime: 0,
                        startTime: Date.now(),
                        duration: null,
                        sessionSubject: sessionSubject.id,
                        status: SessionsStatusEnum.ACTIVE.enum  //(values: 1 = Active, 0 = Ended)
                    };
                }

                function minToUnixTimestamp(min) {
                    min = min || 0;
                    return min * 60 * 1000;
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
                    globalStorageProm.then(function (globalStorage) {
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
                        globalStorage.update(dataToSave);
                    });
                }
                function handleCall() {
                    var activePanelElm = $window.document.querySelector('.active-panel');
                    activePanelElm.classList.remove('ng-hide');
                    var callBtnElm = activePanelElm.querySelector('call-btn');
                    $timeout(function () {
                        callBtnElm.click();
                    });
                }

                function showActivePanel() {
                    var activePanelElm = $window.document.querySelector('.active-panel');
                    activePanelElm.classList.remove('ng-hide');
                }
                function hideActivePanel() {
                    var activePanelElm = $window.document.querySelector('.active-panel');
                    activePanelElm.classList.add('ng-hide');
                }

                var liveSessionsStatus;
                var currLiveSessionsGUID;
                var sessionSrvApi = {};
                var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';
                var userAuth = AuthService.getAuth();
                var globalStorageProm = InfraConfigSrv.getGlobalStorage();
                var sessionData = {};

                sessionSrvApi.startSession = function (sessionSubject) {
                    sessionData = sessionInit(sessionSubject);
                    currLiveSessionsGUID = { guid: sessionData.sessionGUID};
                    liveSessionsStatus = SessionsStatusEnum.ACTIVE.enum;
                    var saveSessionProm = saveSession();
                    saveSessionProm.then(function (res) {
                        $log.debug('Session Saved: ', res);
                        showActivePanel();
                        handleCall();
                    }).catch(function (err) {
                        $log.error('Error saving session to firebase: ', err);
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
                            showActivePanel();
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
                    var endTime = Date.now();
                    liveSessionsStatus = SessionsStatusEnum.ENDED.enum;
                    sessionData.status = SessionsStatusEnum.ENDED.enum;
                    sessionData.duration = endTime - sessionData.startTime;
                    handleCall();
                    hideActivePanel();
                    var updateSessionProm = updateSession();
                    updateSessionProm.then(function (res) {
                        $log.debug('Session Updated: ', res);
                        PopUpSrv.info('Live session has ended');
                    }).catch(function (err) {
                        $log.error('Error updating session to firebase: ', err);
                    });
                };

                sessionSrvApi.addExtendTime = function () {
                    sessionData.extendTime += minToUnixTimestamp(ENV.liveSession.sessionExtendTime);
                };


                return sessionSrvApi;
            };
        }
    );
})(angular);

