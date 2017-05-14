(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.webcall'])
        .config(function (WebcallSrvProvider) {
        	WebcallSrvProvider.setCallCred({
        		username:'ZinkerzDev160731091034',
        		password:'zinkerz$9999'
        	});
        })
        .service('ENV', function () {
            this.debug = true;
        })
        .controller('Main', function ($scope, WebcallSrv) {
            $scope.init = function () {
                console.log('initiailizing...');
                return WebcallSrv.connect('1234').then(function () {
                    console.log('connected');
                }).catch(function (err) {
                    console.log('connect error');
                });
            }

            $scope.connect = function(){
                console.log('connecting');
                return WebcallSrv.connect('1234').then(function () {
                    console.log('connected');
                }).catch(function (err) {
                    console.log('connect error');
                });

            }

            $scope.login = function(){
                console.log('login');
                WebcallSrv.login();
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
