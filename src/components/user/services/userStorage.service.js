'use strict';

angular.module('znk.infra.user').service('UserStorageService',
function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
    'ngInject';

    var fbAdapter = new StorageFirebaseAdapter(ENV.fbGlobalEndPoint);
    var config = {
        variables: {
            uid: function () {
                return AuthService.getAuth().then(user => {
                    return user.uid;
                });
            }
        }
    };

    return new StorageSrv(fbAdapter, config);
});
