(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').service('InvitationStorageSrv',
        function (StorageFirebaseAdapter, ENV, StorageSrv, AuthService) {
        'ngInjedct';

            var fbAdapter = new StorageFirebaseAdapter(ENV.fbDataEndPoint + 'invitations');
            var config = {
                variables: {
                    uid: function () {
                        var auth = AuthService.getAuth();
                        return auth && auth.uid;
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
