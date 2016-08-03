'use strict';

(function (angular) {

    function WebcallSrv() {

        var _credentials;

        this.setCallCred = function (credentials) {
            _credentials = credentials;
        };

        this.$get = ['$q', '$log', 'ENV', function ($q, $log, ENV) {

            var WebcallSrv = {};

            var deferredMap = {
                call: {},
                init: {},
                hang: {}
            };

            var _notSupportedMsg = 'webcall feature is not available';

            if (angular.isUndefined(_credentials)) {
                $log.error('credentials were not supplied');
            } else {
                var _username = _credentials.username;
                var _password = _credentials.password;
            }


            function _webrtcNotSupportedAlert() {
                $log.error(_notSupportedMsg);
                deferredMap.init.reject(_notSupportedMsg);
            }

            function _onReady() {
                $log.debug('_onReady');
                _plivoLogin();
            }

            function _plivoLogin() {
                $log.debug('_plivoLogin');
                Plivo.conn.login(_username, _password);
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
                Plivo.onWebrtcNotSupported = _webrtcNotSupportedAlert;
                Plivo.onReady = _onReady;
                Plivo.onLogin = _onLogin;
                Plivo.onLoginFailed = _onLoginFailed;
                Plivo.onCallAnswered = _onCallAnswered;
                Plivo.onCallTerminated = _onCallTerminated;
                Plivo.onCallFailed = _onCallFailed;
                Plivo.onMediaPermission = _onMediaPermission;
                Plivo.onCalling = _onCalling;
                Plivo.init();
                Plivo.setDebug(ENV.debug);
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
                var res = Plivo.conn.call(callId);
                if (res === false) {
                    deferredMap.call.reject();
                }
                return deferredMap.call.promise;
            }

            WebcallSrv.connect = function (callId) {
                return _init().then(function () {
                    $log.debug('init done');
                    return _call(callId);
                });
            };

            WebcallSrv.hang = function () {
                deferredMap.hang = $q.defer();
                if (Plivo.conn) {
                    var res = Plivo.conn.hangup();
                    if (res === false) {
                        deferredMap.hang.reject();
                    }
                } else {
                    deferredMap.hang.reject();
                }

                return deferredMap.hang.promise;
            };

            return WebcallSrv;
        }];
    }

    angular.module('znk.infra.webcall').provider('WebcallSrv', WebcallSrv);

})(angular);
