(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.popUp'])
        .config(function () {
        })
        .controller('Main', function ($scope, PopUpSrv) {
            $scope.showPopup = function(type){
                switch (type){
                    case 'info':
                        PopUpSrv.info('Information', 'Bla Bla Bla');
                        break;
                    case 'warning':
                        PopUpSrv.warning('Conformation', 'Bla Bla Bla', 'Accept', 'Cancel');
                        break;
                    case 'error':
                        PopUpSrv.error('Error', 'Bla Bla Bla', 'Accept', 'Cancel');
                        break;
                    case 'error conformation':
                        PopUpSrv.ErrorConfirmation('Error Conformation', 'Bla Bla Bla', 'Accept', 'Cancel');
                        break;
                    case 'success':
                        PopUpSrv.success('Success', 'Bla Bla Bla');
                        break;
                }
            };
        });
})(angular);
