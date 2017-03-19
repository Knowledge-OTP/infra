(function (angular) {
    'use strict';

    angular.module('znk.infra.user')
        .config(function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
            'ngInject';

            var fbAdapter = new StorageFirebaseAdapter(ENV.fbGlobalEndPoint);
            var config = {
                variables: {
                    uid: function uid() {
                        return AuthService.getAuth() && AuthService.getAuth().uid;
                    }
                }
            };

            return new StorageSrv(fbAdapter, config);
        });
})(angular);
