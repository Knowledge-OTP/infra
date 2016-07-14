(function (angular) {
    'use strict';

    /**
     *  StorageRevSrv:
     *      wrapper for ContentSrv, use for error handling and parsing data.
     *      getContent(data={ exerciseType: 'type', exerciseId: '20' });
     *      getAllContentByKey('type');
     */
    angular.module('znk.infra.content').service('StorageRevSrv', [
        'ContentSrv', '$log', '$q',
        function (ContentSrv, $log, $q) {
            'ngInject';

            var self = this;

            this.getContent = function (data) {
                return ContentSrv.getContent(data).then(function (result) {
                    return angular.fromJson(result);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            this.getAllContentByKey = function (key) {
                var resultsProm = [];
                return ContentSrv.getAllContentIdsByKey(key).then(function (results) {
                    angular.forEach(results, function (keyValue) {
                        resultsProm.push(self.getContent({ exerciseType: keyValue }));
                    });
                    return $q.all(resultsProm);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };
        }
    ]);
})(angular);
