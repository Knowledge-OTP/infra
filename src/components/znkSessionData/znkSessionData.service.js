(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSessionData').provider('znkSessionDataSrv',
        function () {
            var _sessionSubjectsGetter;

            this.setSessionSubjects = function (sessionSubjectsGetter) {
                _sessionSubjectsGetter = sessionSubjectsGetter;
            };

            this.$get = function ($log, $injector, $q, InfraConfigSrv, ENV, StudentContextSrv, TeacherContextSrv, AuthService, $rootScope, UserProfileService) {
                'ngInject';
                var znkSessionDataSrv = {};
                var globalStorageProm = InfraConfigSrv.getGlobalStorage();
                var isTeacher = (ENV.appContext.toLowerCase()) === 'dashboard';
                var userAuth = AuthService.getAuth();
                var currSessionGUID;

                znkSessionDataSrv.getSessionSubjects = function () {
                    if (!_sessionSubjectsGetter) {
                        var errMsg = 'znkSessionDataSrv: sessionSubjectsGetter was not set';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }
                    return $q.when($injector.invoke(_sessionSubjectsGetter));
                };

                $rootScope.$watch(function () {
                    return currSessionGUID;
                });

                function getLiveSessionPath(param) {
                    if (!userAuth) {
                        $log.error('Invalid user');
                        return;
                    }
                    var path;
                    var educatorUID = isTeacher ? userAuth.uid : TeacherContextSrv.getCurrUid();
                    var studentUID = isTeacher ? StudentContextSrv.getCurrUid() : userAuth.uid;
                    switch (param) {
                        case 'sessions':
                            path = ENV.studentAppName + '/liveSession/' + currSessionGUID.guid;
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

                znkSessionDataSrv.isActiveLiveSession = function () {
                    return UserProfileService.getCurrUserId().then(function (currUid) {
                        return InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                            var appName = ENV.firebaseAppScopeName;
                            var userLiveSessionPath = appName + '/users/' + currUid + '/liveSession/active';
                            return globalStorage.get(userLiveSessionPath);
                        });
                    });
                };

                znkSessionDataSrv.isActiveLiveSession().then(function (liveSessionGuid) {
                    return !angular.equals(liveSessionGuid, {});
                });

                znkSessionDataSrv.getLiveSessionGuid = function () {
                    var activeSessionPath = isTeacher ? getLiveSessionPath('educator') : getLiveSessionPath('student');
                    activeSessionPath += '/active';
                    return globalStorageProm.then(function (globalStorage) {
                        return globalStorage.getAndBindToServer(activeSessionPath);
                    });
                };

                znkSessionDataSrv.isInLiveSession = function () {
                    return znkSessionDataSrv.getLiveSessionGuid().then(function (res) {
                        return !!(res.guid);
                    });
                };

                return znkSessionDataSrv;
            };

        });
})(angular);
