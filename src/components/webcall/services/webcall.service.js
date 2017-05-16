'use strict';

(function (angular) {

    function WebcallSrv() {

        var _credentials;

        this.setCallCred = function () {
            // _credentials = credentials;
            _credentials = {
                username:'ZinkerzDev160731091034',
                password:'zinkerz$9999'
            };
        };

        this.$get = ['$q', '$log', 'ENV', function ($q, $log, ENV) {

            var WebcallSrv = {};
            var plivoWebSdk; 

            var deferredMap = {
                call: {},
                init: {},
                hang: {}
            };

            var _notSupportedMsg = 'webcall feature is not available';

            var _username,
                _password;

            _username = _credentials.username;
            _password = _credentials.password;

            // function _activate() {
            //     if (angular.isUndefined(_credentials)) {
            //         $log.error('credentials were not supplied');
            //     } else {
            //         _username = _credentials.username;
            //         _password = _credentials.password;
            //     }

            // }

            function _webrtcNotSupportedAlert() {
                $log.error(_notSupportedMsg);
                deferredMap.init.reject(_notSupportedMsg);
            }

            // function _onReady() {
            //     $log.debug('_onReady');
            //     _plivoLogin();
            // }

            function _plivoLogin() {
                $log.debug('_plivoLogin');
                // Plivo.conn.login(_username, _password);
                plivoWebSdk.client.login(_username, _password);
            }

            function _onLoginFailed() {
                $log.error('_onLoginFailed');
                deferredMap.init.reject();
            }

            function _onMediaPermission(isAllowed) {
                $log.debug('_onMediaPermission, isAllowed=' + isAllowed);
                if (!isAllowed){
                    if (!angular.equals({}, deferredMap.call)) {
                        // errorCode : 1 calls module CallsErrorSrv service depends on it, if it's changed here, it should changed there also.
                        deferredMap.call.reject({ errorCode: 1, error:'No persmission'});
                    }
                }
            }

            function _onLogin() {
                $log.debug('_onLogin');
                if (!angular.equals({}, deferredMap.init)) {
                    deferredMap.init.resolve();
                }
                // _call(1234);
            }

            function _onCallTerminated() {
                $log.debug('_onCallTerminated');
                if (!angular.equals({}, deferredMap.hang)) {
                    deferredMap.hang.resolve();
                }
            }

            function _onCallAnswered() {
                $log.debug('_onCallAnswered');
                if (!angular.equals({}, deferredMap.call)) {
                    deferredMap.call.resolve();
                }
            }

            function _onCallFailed() {
                $log.debug('_onCallFailed');
                if (!angular.equals({}, deferredMap.call)) {
                    deferredMap.call.reject();
                }
            }

            function _onCalling() {
                $log.debug('_onCalling');
            }

            function _initPlivo() {

                var options = _getSettings();
                plivoWebSdk = new window.Plivo(options);
                plivoWebSdk.client.on('onWebrtcNotSupported', _webrtcNotSupportedAlert);
                // plivoWebSdk.client.on('onReady', _onReady); - not working
                plivoWebSdk.client.on('onLogin', _onLogin);
                // plivoWebSdk.client.on('onLogout', onLogout);
                plivoWebSdk.client.on('onLoginFailed', _onLoginFailed);
                // plivoWebSdk.client.on('onCallRemoteRinging', onCallRemoteRinging);
                // plivoWebSdk.client.on('onIncomingCallCanceled', onIncomingCallCanceled);
                plivoWebSdk.client.on('onCallFailed', _onCallFailed);
                plivoWebSdk.client.on('onCallAnswered', _onCallAnswered);
                plivoWebSdk.client.on('onCallTerminated', _onCallTerminated);
                plivoWebSdk.client.on('onCalling', _onCalling);
                // plivoWebSdk.client.on('onIncomingCall', onIncomingCall);
                plivoWebSdk.client.on('onMediaPermission', _onMediaPermission);
                // plivoWebSdk.client.on('mediaMetrics',mediaMetrics);
                // plivoWebSdk.client.on('audioDeviceChange',audioDeviceChange);
                plivoWebSdk.client.setRingTone(true);
                plivoWebSdk.client.setRingToneBack(false);
                console.log('initPhone ready!');

                // Plivo.setDebug(ENV.debug);



                plivoWebSdk.client.login(_username, _password);
                // console.log('login=' + login);

            }

            function _getSettings(){

                var defaultSettings = { "permOnClick": true, "codecs": ["OPUS","PCMU"], "enableIPV6": false, "audioConstraints": { "optional": [ { "googAutoGainControl": false }, {"googEchoCancellation":false} ] }, "enableTracking": true};
                if (ENV.debug){ 
                    defaultSettings.debug="DEBUG";
                }
                return defaultSettings;
            }

            function _init() {
                deferredMap.init = $q.defer();

                if (angular.isDefined(Plivo)) {
                    if (Plivo.conn) {
                        $log.debug('Plivo is already initialized');
                        deferredMap.init.resolve();
                    } else {
                        _initPlivo();
                    }
                } else {
                    deferredMap.init.reject(_notSupportedMsg);
                }
                return deferredMap.init.promise;
            }

            function _call(callId) {
                deferredMap.call = $q.defer();
                var res = plivoWebSdk.client.call(callId);
                // var res = Plivo.conn.call(callId);
                if (res === false) {
                    deferredMap.call.reject();
                }
                return deferredMap.call.promise;
            }

            WebcallSrv.call = function (callId) {
                return _call(callId).then(function () {
                    $log.debug('call done');
                    // return _call(callId);
                });
            };

            WebcallSrv.connect = function (callId) {
                return _init().then(function () {                        
                    $log.debug('init done');                            
                    return _call(callId);                          
                 });
            };

             WebcallSrv.login = function () {
                _plivoLogin();
            };


            WebcallSrv.hang = function () {
                deferredMap.hang = $q.defer();
                if (plivoWebSdk.client.callSession) {

                    var res = plivoWebSdk.client.hangup();
                    if (res === false) {
                        deferredMap.hang.reject();
                    }
                } else {
                    deferredMap.hang.reject();
                }

                return deferredMap.hang.promise;
            };

            WebcallSrv.setCallCredRunTime = function(credentials, useForce) {
                if (angular.isDefined(_credentials) && !useForce) {
                    $log.error('WebcallSrv setCallCredRunTime: _credentials already set! ' +
                        'if you wish to force it add true as a second param! credentials: ' + credentials);
                    return;
                }

                _credentials = credentials;
            };

            // WebcallSrv.activate = function () {
            //     _activate();
            // };

            return WebcallSrv;
        }];
    }

    angular.module('znk.infra.webcall').provider('WebcallSrv', WebcallSrv);

})(angular);
