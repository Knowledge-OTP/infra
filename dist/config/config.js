(function (angular) {
    'use strict';

    angular.module('znk.infra.config', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.config').provider('InfraConfigSrv', [
        function () {
            var storageServiceName,
                userDataFn,
                globalStorageGetter,
                studentStorageGetter,
                dashboardStorageGetter;

            this.setStorages = function(_globalStorageGetter, _studentStorageGetter, _dashboardStorageGetter){
                globalStorageGetter = _globalStorageGetter;
                studentStorageGetter = _studentStorageGetter;
                dashboardStorageGetter = _dashboardStorageGetter;
            };

            this.setUserDataFn = function(_userDataFn) {
                userDataFn = _userDataFn;
            };

            this.$get = [
                '$injector', '$log', '$q',
                function ($injector, $log, $q) {
                    var InfraConfigSrv = {};

                    InfraConfigSrv.getGlobalStorage = function(){
                        if(!globalStorageGetter){
                            $log.error('InfraConfigSrv: global Storage name was not defined');
                            return;
                        }
                        return $injector.invoke(storageServiceName);
                    };

                    InfraConfigSrv.getStudentStorage = function(){
                        if(!studentStorageGetter){
                            $log.error('InfraConfigSrv: student storage service was not defined');
                            return;
                        }
                        return $injector.invoke(studentStorageGetter);
                    };

                    InfraConfigSrv.getDashboardStorage = function(){
                        if(!dashboardStorageGetter ){
                            $log.error('InfraConfigSrv: dashboard storage service name was not defined');
                            return;
                        }
                        return $injector.invoke(dashboardStorageGetter );
                    };

                    InfraConfigSrv.getUserData = function(){
                        var userDataInjected;
                        if(!userDataFn){
                            $log.debug('InfraConfigSrv: auth fn name was not defined');
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
