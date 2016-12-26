(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSessionData').provider('znkSessionDataSrv',
        function () {
            var _sessionSubjectsGetter;

            this.setSessionSubjects = function (sessionSubjectsGetter) {
                _sessionSubjectsGetter = sessionSubjectsGetter;
            };

            this.$get = function ($log, $injector, $q, InfraConfigSrv, ENV, UserProfileService) {
                'ngInject';
                var znkSessionDataSrv = {};

                znkSessionDataSrv.getSessionSubjects = function () {
                    if (!_sessionSubjectsGetter) {
                        var errMsg = 'znkSessionDataSrv: sessionSubjectsGetter was not set';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }
                    return $q.when($injector.invoke(_sessionSubjectsGetter));
                };

                znkSessionDataSrv.isActiveLiveSession = function () {
                    return UserProfileService.getCurrUserId().then(function (currUid) {
                        return InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                            var appName = ENV.firebaseAppScopeName;
                            var userLiveSessionPath = appName + '/users/' + currUid + '/liveSession/active';
                            return !angular.equals(globalStorage.get(userLiveSessionPath), {});
                        });
                    });
                };

                return znkSessionDataSrv;
            };

        });
})(angular);
