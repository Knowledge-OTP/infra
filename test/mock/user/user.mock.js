(function (angular) {
    'use strict';

    var mockUserFn = ['testUser', function(testUser) {
        return testUser.getAuth();
    }];

    angular.module('user.mock', ['znk.infra.config', 'znk.infra.user'])
        .config(function(InfraConfigSrvProvider){
            InfraConfigSrvProvider.setUserDataFn(mockUserFn);
        })
        .service('testUser', function(){
             this.getAuth = function() {
                 return {
                     uid: 'fakeUid'
                 };
             };
        })
        .decorator('UserProfileService',function($delegate, $q){
            $delegate.__currUserId = '123456789-curr-uid';

            $delegate.getCurrUserId = function(){
                return $q.when($delegate.__currUserId);
            };

            return $delegate;
        });
})(angular);
