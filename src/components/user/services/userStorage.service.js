'use strict';

angular.module('znk.infra.user').service('UserStorageService',
    function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
        'ngInject';

        var fbAdapter = new StorageFirebaseAdapter(ENV.fbGlobalEndPoint);
        var config = {
            variables: {
                uid: function uid() {
                    return AuthService.getAuth() && AuthService.getAuth().currentUser.uid;
                }
            }
        };

        return new StorageSrv(fbAdapter, config);
    });
