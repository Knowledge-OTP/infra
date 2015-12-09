(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.content'])
        .config(function(ContentSrvProvider){
            ContentSrvProvider.setContent(['$q',
                function ($q) {
                    var mockData = {
                            revisionManifest: {
                                drill10: {
                                    rev:1
                                },
                                drill11: {
                                    rev: 1
                                }
                            },
                            latestRevisions: {
                                drill10: {
                                    rev:1
                                },
                                drill11: {
                                    rev: 2
                                },
                                drill12: {
                                    rev: 2
                                }
                            }
                    };

                    function updatePublicationCb(cb) {
                        cb({ key: angular.noop, vak: angular.noop });
                    }

                        return $q.when({
                            latestRevisions: mockData.latestRevisions,
                            revisionManifest: mockData.revisionManifest,
                            create: function(path) {
                                return { set: angular.noop, get: angular.noop };
                            },
                            updatePublication: updatePublicationCb,
                            contentRoot: 'mockData/content/',
                            userRoot: 'mockData/users/0ef5a913-4a69-4c75/contentSync'

                        });

                }
            ]);
        }).controller('demoCtrl', ['ContentSrv', function(ContentSrv) {
            ContentSrv.getContent({exerciseId: 10, exerciseType: 'drill'}).then(function(result){
                console.log('result', result);
            });
        }]);
})(angular);