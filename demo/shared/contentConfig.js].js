(function (angular) {
    'use strict';

    angular.module('demo').config((ContentSrvProvider)=> {
        ContentSrvProvider.setContent(['$window', 'ENV', '$q', 'infraConfigSrv',
            function ($window, ENV, $q, infraConfigSrv) {
                var publicationsPath = 'publications';
                var promises = {};

                promises.publications = getPublicationProm();
                promises.revisionManifest = getUserRevProm();

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
                    return infraConfigSrv.getStudentStorage().then(function(){
                        return ActStorageSrv.get(publicationsPath).then(function (resp) {
                            return getLatestPublication(resp);
                        });
                    });
                }

                function updatePublicationCb(cb) {
                    var publicationRef = new $window.Firebase(ENV.fbDataEndPoint + publicationsPath);
                    publicationRef.orderByChild('isPublic').equalTo(true).limitToLast(1).on('child_changed', function (snapshot) {
                        cb(snapshot);
                    });
                }

                function getUserRevProm() {
                    return ActStorageSrv.get(ActStorageSrv.variables.appUserSpacePath + '/contentSync').then(function (resp) {
                        if (!resp.revisionManifest) { resp.revisionManifest = {}; }
                        return resp.revisionManifest;
                    });
                }

                return $q.all(promises).then(function (results) {
                    return {
                        latestRevisions: results.publications.latestRevisions,
                        key: results.publications.key,
                        revisionManifest: results.revisionManifest,
                        create: function create(path) {
                            return ActStorageSrv.entityCommunicator(path);
                        },
                        updatePublication: updatePublicationCb,
                        contentRoot: 'content/',
                        userRoot: ActStorageSrv.variables.appUserSpacePath + '/contentSync'

                    };
                });
            }
        ]);
    });
})(angular);
