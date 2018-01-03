(function (angular) {
    'use strict';

    angular.module('demoApp', ['znk.infra.webcall', 'znk.infra.popUp'])
        .config(function (WebcallSrvProvider) {
        	WebcallSrvProvider.setCallCred({
        		username:'zinkerzend1180102142935',
        		password:'zink9z2014'
        	});
        })
        .service('ENV', function () {
            this.debug = true;
            this.znkBackendBaseUrl = 'https://dev-api.zinkerz.com';
        })
        .controller('Main', function ($scope, WebcallSrv, PopUpSrv) {
            $scope.init = function () {
                console.log('initiailizing...');
                var callId = $scope.callId || '1234';
                console.log(callId);
                return WebcallSrv.connect(callId).then(function () {
                    console.log('connected');
                }).catch(function (err) {
                    console.log('connect error, err=' + err);
                });
            }

            $scope.call = function(){
                console.log('connecting');
                var callId = $scope.callId || '1234';
                return WebcallSrv.call(callId).then(function () {
                    console.log('called');
                }).catch(function (err) {
                    console.log('called error, err=' + err);
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
                }).catch(function (err) {
                    console.log('hang error', err);
                });
            }
        });
})(angular);
