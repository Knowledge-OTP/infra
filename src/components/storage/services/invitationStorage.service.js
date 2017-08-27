(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').service('InvitationStorageSrv',
    function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
    'ngInject';

        var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint + 'invitations');
        var config = {
            variables: {
                uid: function () {
                    return AuthService.getAuth().then(user => {
                        return user.uid;
                    });
                }
            },
            cacheRules: [/.*/]
        };

        var storage = new StorageSrv(fbAdapter, config);

        storage.getInvitationObject = function (inviteId) {
            return storage.get(inviteId);
        };

        return storage;
    }
);
})(angular);
