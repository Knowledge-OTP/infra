(function (angular) {
    'use strict';

    angular.module('znk.infra.config').provider('InfraConfigSrv', [
        function () {
            var storageServiceName;
            this.setStorageServiceName = function(_storageServiceName){
                storageServiceName = _storageServiceName;
            };

            this.$get = [
                '$injector', '$log',
                function ($injector, $log) {
                    var InfraConfigSrv = {};

                    InfraConfigSrv.getStorageService = function(){
                        if(!storageServiceName){
                            $log.$debug('InfraConfigSrv: storage service name was not defined');
                            return;
                        }
                        return $injector.get(storageServiceName);
                    };

                    return InfraConfigSrv;
                }
            ];
        }
    ]);
})(angular);
