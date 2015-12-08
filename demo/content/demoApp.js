(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.content'])
        .config(function(revSrvProvider){
            revSrvProvider.setContent(['$q',
                function ($q) {
                    var mockData = {
                        contentSync: {
                            revisionManifest: {
                                drill10: {
                                    rev:1
                                },
                                drill11: {
                                    rev: 1
                                }
                            }
                        },
                        publication: {
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
                        }
                    };
                    return $q.when(mockData);
                }
            ]);
        }).controller('demoCtrl', ['revSrv', function(revSrv) {
               revSrv.getRev('drill10').then(function(result) {
                    console.log('drill10',result);
               });

               revSrv.getRev('drill11').then(function(result) {
                    console.log('drill11',result);
               });

               revSrv.getRev('drill12').then(function(result) {
                    console.log('drill12',result);
               });

                revSrv.getRev('drill150').then(function(result) {
                    console.log('drill150',result);
                });
        }]);
})(angular);