(function (angular) {
    'use strict';

    angular.module('znk.infra.znkSessionData').provider('znkSessionDataSrv',
        function () {
            var _sessionSubjectsGetter;

            this.setSessionSubjects = function (sessionSubjectsGetter) {
                _sessionSubjectsGetter = sessionSubjectsGetter;
            }

            this.$get = function ($log, $injector, $q) {
                'ngInject';
                var znkSessionDataSrv = {};
                znkSessionDataSrv.getSessionSubjects = function () {
                    if(!_sessionSubjectsGetter) {
                        var errMsg = 'znkSessionDataSrv: sessionSubjectsGetter was not set';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }
                    return $q.when($injector.invoke(_sessionSubjectsGetter));
                }
                return znkSessionDataSrv;
            }

        });
})(angular);
