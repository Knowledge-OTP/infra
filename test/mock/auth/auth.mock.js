(function (angular) {
    'use strict';

    var mockAuthServiceName = 'testAuth';

    angular.module('auth.mock', ['znk.infra.config'])
        .config(function(InfraConfigSrvProvider){
            InfraConfigSrvProvider.setAuthServiceName(mockAuthServiceName );
        })
        .service(mockAuthServiceName, function(){
             this.getAuth = function() {
                 return {
                     uid: 'fakeUid'
                 }
             }
        });
})(angular);
