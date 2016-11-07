(function (angular) {
    'use strict';
    angular.module('znk.infra.znkSession').provider('SessionSrv',
        function() {
            var subjects;

            this.setSessionSubjects = function(_subjects) {
                subjects = _subjects;
            };

            this.$get = function($log, ENV, AuthService, InfraConfigSrv,  StudentContextSrv, UtilitySrv,
                                 SessionSubjectEnumConst, $mdDialog, ActivePanelSrv, SessionsStatusEnum) {
                'ngInject';

                function sessionDataInit(sessionSubject) {
                    return {
                        appName: ENV.studentAppName.split('_')[0].toUpperCase(),
                        sessionGUID: UtilitySrv.general.createGuid(),
                        educatorUID: userAuth.uid || 'N/A',
                        studentUID: StudentContextSrv.getCurrUid() || 'c47f4f57-521c-4832-b505-c0093737ceff',
                        extendTime: 0,
                        startTime: Date.now(),
                        duration: null,
                        sessionSubject: sessionSubject.id,
                        status: 1  //(values: 1 = Active, 0 = Ended)
                    };
                }
                function getKeyByValue(obj, value) {
                    for( var prop in obj ) {
                        if( obj.hasOwnProperty( prop ) ) {
                            if( obj[ prop ] === value ) {
                                return prop;
                            }
                        }
                    }
                }
                function minToUnixTimestamp(min) {
                    return min * 60 * 1000;
                }
                function getPath(param) {
                    if (!userAuth) {
                        $log.error('Invalid user');
                        return;
                    }
                    var path;
                    switch (param) {
                        case 'sessions':
                            path = ENV.studentAppName + '/liveSession/' + sessionData.sessionGUID;
                            return path;
                        case 'student':
                            path = ENV.studentAppName + '/users/$$uid/liveSession';
                            return path.replace('$$uid', '' + sessionData.studentUID);
                        case 'educator':
                            path = ENV.dashboardAppName + '/users/' +
                                sessionData.educatorUID + '/liveSession';
                            return path.replace('$$uid', '' + sessionData.educatorUID);
                        default:
                            return;
                    }
                }
                function updateSession() {
                    $log.debug('updateSession, sessionData: ', sessionData);
                    globalStorageProm.then(function (globalStorage) {
                        globalStorage.update(getPath('sessions'), sessionData);
                    });
                }


                var sessionSrvApi = {};
                var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';
                var userAuth = AuthService.getAuth();
                var globalStorageProm = InfraConfigSrv.getGlobalStorage();
                var sessionsStatus = SessionsStatusEnum.INACTIVE.enum;
                var sessionData = {};

                sessionSrvApi.startSession = function (sessionSubject) {
                    sessionData = sessionDataInit(sessionSubject);

                    $log.debug('startSession, subject name: ', sessionSubject.name);
                    sessionSrvApi.saveSession();
                    ActivePanelSrv.loadActivePanel();
                };

                sessionSrvApi.registerToCallAndScreenSharing = function (cbs) {
                    console.log('cbs: ', cbs);
                    // cbs.screenSharing(3);
                    // cbs.call(3);
                };

                sessionSrvApi.saveSession = function () {
                    $log.debug('saveSession, sessionData: ', sessionData);
                    var dataToSave = {};
                    globalStorageProm.then(function (globalStorage) {
                        var studentPath = getPath('student') + '/active';
                        var educatorPath = getPath('educator') + '/active';
                        globalStorage.update(getPath('sessions'), sessionData);
                        dataToSave[studentPath] = sessionData.sessionGUID;
                        dataToSave[educatorPath] = sessionData.sessionGUID;
                        globalStorage.update(dataToSave);
                    });
                };

                sessionSrvApi.getSessionSubjects = function() {
                    if (!subjects) {
                        subjects = [SessionSubjectEnumConst.MATH, SessionSubjectEnumConst.ENGLISH];
                    }
                    return subjects.map(function (subjectId) {
                        var name = getKeyByValue(SessionSubjectEnumConst, subjectId).toLowerCase();
                        return {
                            id: subjectId,
                            name: name,
                            iconName: 'znkSession-' + name + '-icon'
                        };
                    });
                };

                sessionSrvApi.getActiveSessionGUID = function () {
                    var activeSessionPath  = isTeacherApp ? getPath('educator') : getPath('student');
                    activeSessionPath += '/active';
                    return globalStorageProm.then(function (globalStorage) {
                        return globalStorage.getAndBindToServer(activeSessionPath);
                    });
                };

                // sessionSrvApi.getActiveSessionData = function () {
                //     sessionSrvApi.getActiveSessionGUID().then(function (sessionGUID) {
                //         sessionData.sessionGUID = sessionGUID;
                //         globalStorage.get(getPath('sessions'));
                //         return !angular.equals(sessionGUID, {});
                //     });
                //
                // };

                sessionSrvApi.haveActiveSession = function () {
                    sessionSrvApi.getActiveSessionGUID().then(function (sessionGUID) {
                        sessionData.sessionGUID = sessionGUID;
                        sessionsStatus = (!(angular.equals(sessionGUID, {}))) ?
                            SessionsStatusEnum.ACTIVE.enum: SessionsStatusEnum.INACTIVE.enum;

                        return sessionsStatus;
                    });
                };

                sessionSrvApi.showActiveSessionModal = function () {
                    return $mdDialog.show({
                        controller: 'activeSessionCtrl',
                        templateUrl: 'components/znkSession/modals/templates/activeSession.template.html',
                        disableParentScroll: false,
                        clickOutsideToClose: true,
                        fullscreen: false,
                        controllerAs: 'vm'
                    });
                };

                sessionSrvApi.endSession = function () {
                    // var endTime = Date.now();
                    sessionSrvApi.getActiveSessionGUID().then(function (sessionGUID) {
                        sessionData.sessionGUID = sessionGUID;

                    });
                };

                sessionSrvApi.addExtendTime = function () {
                    sessionData.extendTime += minToUnixTimestamp(ENV.liveSession.sessionExtendTime);
                    updateSession();
                };


                return sessionSrvApi;
            };
        }
    );
})(angular);

