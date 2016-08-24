(function (angular) {
    'use strict';

    angular.module('demo',[
        'znk.infra.config',
        'znk.infra.storage'
    ])
        .controller('ctrl',function($scope,InfraConfigSrv){
                 InfraConfigSrv.getGlobalStorage().then(function( x){
                     debugger;
                 })

        })

})(angular);
