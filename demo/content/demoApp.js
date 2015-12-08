(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.content'])
        .config(function(revSrvProvider){
            revSrvProvider.setContent(['$q',
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
                    return $q.when(mockData);
                }
            ]);
        }).controller('demoCtrl', ['revSrv', '$timeout', function(revSrv, $timeout) {
               revSrv.getRev('drill10').then(function(result) {
                    console.log('drill10',result); // {rev: 1, status: "same"}
               });

               revSrv.getRev('drill11').then(function(result) {
                    console.log('drill11',result); // {rev: 1, status: "old"}
               });

               revSrv.getRev('drill12').then(function(result) {
                    console.log('drill12',result); // {rev: 2, status: "new"}
                    if(result.status === 'new') {
                        revSrv.setRev('drill12', result.rev).then(function(revResult) {
                            console.log('drill12:revResult',revResult);
                        });
                    }
               });

                revSrv.getRev('drill150').then(function(result) {
                    console.log('drill150',result); //  {error: "Not Found", data: Object}
                });

                $timeout(function() {
                    revSrv.getRev('drill12').then(function(result) {
                        console.log('drill12:timeout',result); // {rev: 2, status: "same"}
                    });
                }, 5000);
        }]);
})(angular);