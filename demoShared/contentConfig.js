(function (angular) {
    'use strict';

    angular.module('demo').config((ContentSrvProvider)=> {
        ContentSrvProvider.setContent(['$window', '$q', 'InfraConfigSrv',
            function ($window, $q, InfraConfigSrv) {
                var publicationsPath = 'publications';
                var promises = {};

                promises.publications = getPublicationProm();
                promises.revisionManifest = getUserRevProm();
                promises.studentStorageSrv = InfraConfigSrv.getStudentStorage();
                function getLatestPublication(publications) {
                    var lastPublication = {
                        publicDate: 0
                    };
                    angular.forEach(publications, function (publication, key) {
                        if (publication.isPublic && publication.publicDate > lastPublication.publicDate) {
                            publication.key = key;
                            lastPublication = publication;
                        }
                    });
                    return lastPublication;
                }

                function getPublicationProm() {
                    return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                        return StudentStorageSrv.get(publicationsPath).then(function (resp) {
                            return getLatestPublication(resp);
                        });
                    });
                }

                function updatePublicationCb(cb) {
                    var publicationRef = new $window.Firebase('https://sat-dev.firebaseio.com/' + publicationsPath);
                    publicationRef.orderByChild('isPublic').equalTo(true).limitToLast(1).on('child_changed', function (snapshot) {
                        cb(snapshot);
                    });
                }

                function getUserRevProm() {
                    return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                        return StudentStorageSrv.get(StudentStorageSrv.variables.appUserSpacePath + '/contentSync').then(function (resp) {
                            if (!resp.revisionManifest) {
                                resp.revisionManifest = {};
                            }
                            return resp.revisionManifest;
                        });
                    });
                }

                return $q.all(promises).then(function (results) {
                    return {
                        latestRevisions: results.publications.latestRevisions,
                        key: results.publications.key,
                        revisionManifest: results.revisionManifest,
                        create: function create(path) {
                            return results.studentStorageSrv.entityCommunicator(path);
                        },
                        updatePublication: updatePublicationCb,
                        contentRoot: 'content/',
                        userRoot: results.studentStorageSrv.variables.appUserSpacePath + '/contentSync'

                    };
                });
            }
        ]);
    });
})(angular);
