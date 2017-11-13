'use strict';

angular.module('znk.infra.user').service('UserStorageService',
function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
    'ngInject';
    // authFirebaseRequired - Indicates we want to instantiate an instance of the AuthFirebaseDB.
    var authFirebaseRequired = true;
    var fbAdapter = new StorageFirebaseAdapter(ENV.fbGlobalEndPoint, authFirebaseRequired);
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
