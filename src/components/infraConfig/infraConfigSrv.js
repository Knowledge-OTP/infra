(function (angular) {
    'use strict';

    angular.module('znk.infra.config').provider('InfraConfigSrv', [
        function () {
            var storageServiceName;
            var authServiceName;
            this.setStorageServiceName = function(_storageServiceName){
                storageServiceName = _storageServiceName;
            };

            this.setAuthServiceName = function(_authServiceName) {
                authServiceName = _authServiceName;
            };

            this.$get = [
                '$injector', '$log',
                function ($injector, $log) {
                    var InfraConfigSrv = {};

                    InfraConfigSrv.getStorageService = function(){
                        if(!storageServiceName){
                            $log.debug('InfraConfigSrv: storage service name was not defined');
                            return;
                        }
                        return $injector.get(storageServiceName);
                    };

                    InfraConfigSrv.getAuthService = function(){
                        if(!authServiceName){
                            $log.debug('InfraConfigSrv: auth service name was not defined');
                            return;
                        }
                        return $injector.get(authServiceName);
                    };

                    InfraConfigSrv.getUserAuth = function(){
                        return InfraConfigSrv.getAuthService().getAuth();
                    };

                    return InfraConfigSrv;
                }
            ];
        }
    ]);
})(angular);
