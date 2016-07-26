(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.webcall'])
        .config(function (WebcallSrvProvider) {
        	WebcallSrvProvider.setCallCred({
        		username:'assafshp160721153735',
        		password:'khjihghs'
        	});
        })
        .service('ENV', function () {
            this.debug = true;
        })
        .controller('Main', function ($scope, WebcallSrv) {
            $scope.connect = function () {
                console.log('connecting');
                return WebcallSrv.connect('1234').then(function () {
                    console.log('connected');
                }).catch(function (err) {
                    console.log('connect error');
                });
            }

            $scope.hang = function () {
                console.log('hanging');
                WebcallSrv.hang().then(function () {
                    console.log('hang');
                }).catch(function () {
                    console.log('hang error');
                });
            }
        });
})(angular);
