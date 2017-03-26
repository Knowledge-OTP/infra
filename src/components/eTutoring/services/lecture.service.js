
(function (angular) {
    'use strict';

    angular.module('znk.infra.eTutoring')
        .service('LectureSrv', function (StorageRevSrv) {
            'ngInject';

            function _getContentFromStorage(data) {
                return StorageRevSrv.getContent(data);
            }

            this.getLecture = function getLecture(_exerciseId) {
                return _getContentFromStorage({
                    exerciseId: _exerciseId, exerciseType: 'lecture'
                });
            };
        });
})(angular);
