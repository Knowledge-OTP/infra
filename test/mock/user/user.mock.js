(function (angular) {
    'use strict';

    var mockUserFn = ['testUser', function(testUser) {
        return testUser.getAuth();
    }];

    angular.module('user.mock', ['znk.infra.config'])
        .config(function(InfraConfigSrvProvider){
            InfraConfigSrvProvider.setUserDataFn(mockUserFn);
        })
        .service('testUser', function(){
             this.getAuth = function() {
                 return {
                     uid: 'fakeUid'
                 }
             }
        });
})(angular);
