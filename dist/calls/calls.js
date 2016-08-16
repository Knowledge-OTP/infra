(function (angular) {
    'use strict';

    angular.module('znk.infra.calls', [
        'znk.infra.user',
        'znk.infra.utility',
        'znk.infra.config',
        'znk.infra.enum',
        'znk.infra.svgIcon',
        'pascalprecht.translate',
        'znk.infra.webcall',
        'znk.infra.callsModals',
        'znk.infra.general',
        'znk.infra.activePanel'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'incoming-call-icon': 'components/calls/svg/incoming-call-icon.svg',
                'outgoing-call-icon': 'components/calls/svg/outgoing-call-icon.svg',
                'call-error-exclamation-mark-icon': 'components/calls/svg/call-error-exclamation-mark-icon.svg',
                'calls-etutoring-phone-icon': 'components/calls/svg/etutoring-phone-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .config(["WebcallSrvProvider", "ENV", function (WebcallSrvProvider, ENV) {
            'ngInject';
            WebcallSrvProvider.setCallCred({
                username: ENV.plivoUsername,
                password: ENV.plivoPassword
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').component('callBtn', {
            templateUrl: 'components/calls/directives/callBtn/callBtn.template.html',
            require: {
                parent: '?^ngModel'
            },
            controllerAs: 'vm',
            controller: ["CallsSrv", "CallsBtnSrv", "CallsErrorSrv", "CallsBtnStatusEnum", "$log", "$scope", "CALL_UPDATE", function (CallsSrv, CallsBtnSrv, CallsErrorSrv, CallsBtnStatusEnum, $log, $scope, CALL_UPDATE) {
                var vm = this;
                var receiverId;

                var isPendingClick = false;

                vm.callBtnEnum = CallsBtnStatusEnum;

                function _changeBtnState(state) {
                    vm.callBtnState = state;
                }

                function _isStateNotOffline() {
                    return vm.callBtnState !== CallsBtnStatusEnum.OFFLINE_BTN.enum;
                }

                function _isNoPendingClick() {
                    return !isPendingClick;
                }

                function _clickStatusSetter(clickStatus) {
                    isPendingClick = clickStatus;
                }

                function _initializeBtnStatus(receiverId) {
                    CallsBtnSrv.initializeBtnStatus(receiverId).then(function (status) {
                        if (status) {
                            _changeBtnState(status);
                        }
                    });
                }

                $scope.$on(CALL_UPDATE, function (e, callsData) {
                    if (callsData.status) {
                        CallsBtnSrv.updateBtnStatus(receiverId, callsData).then(function (status) {
                            if (status) {
                                _changeBtnState(status);
                            }
                        });
                    }
                });

                // default btn state offline
                _changeBtnState(CallsBtnStatusEnum.OFFLINE_BTN.enum);

                vm.$onInit = function() {
                    var ngModelCtrl = vm.parent;
                    if (ngModelCtrl) {
                        ngModelCtrl.$render = function() {
                            var modelValue = ngModelCtrl.$modelValue;
                            if (angular.isDefined(modelValue.isOffline) && modelValue.receiverId) {
                                var curBtnStatus = modelValue.isOffline ? CallsBtnStatusEnum.OFFLINE_BTN.enum : CallsBtnStatusEnum.CALL_BTN.enum;
                                receiverId = modelValue.receiverId;
                                _changeBtnState(curBtnStatus);
                                _initializeBtnStatus(receiverId);
                            }
                        };
                    }
                };

                vm.clickBtn = function() {
                    if (_isStateNotOffline() && _isNoPendingClick()) {
                        _clickStatusSetter(true);

                        CallsSrv.callsStateChanged(receiverId).then(function (data) {
                            _clickStatusSetter(false);
                            $log.debug('callBtn: success in callsStateChanged, data: ', data);
                        }).catch(function (err) {
                            _clickStatusSetter(false);
                            $log.error('callBtn: error in callsStateChanged, err: ' + err);
                            CallsErrorSrv.showErrorModal(err);
                        });
                    }
                };
            }]
        }
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallsActionStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['DISCONNECT_ACTION', 1, 'disconnect'],
                ['CONNECT_ACTION', 2, 'connect'],
                ['DISCONNECT_AND_CONNECT_ACTION', 3, 'disconnect and connect']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallsBtnStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['OFFLINE_BTN', 1, 'offline btn'],
                ['CALL_BTN', 2, 'call btn'],
                ['CALLED_BTN', 3, 'called btn']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').factory('CallsStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['PENDING_CALL', 1, 'pending call'],
                ['DECLINE_CALL', 2, 'decline call'],
                ['ACTIVE_CALL', 3, 'active call'],
                ['ENDED_CALL', 4, 'ended call']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('ErrorModalCtrl',
        ["$scope", "CallsUiSrv", function ($scope, CallsUiSrv) {
            'ngInject';
            $scope.errorMessage = this.modalData.errorMessage;
            $scope.errorValues = this.modalData.errorValues;
            $scope.closeModal = CallsUiSrv.closeModal;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('IncomingCallModalCtrl',
        ["$scope", "CallsSrv", "CallsUiSrv", "CallsStatusEnum", "$log", "CallsErrorSrv", "$timeout", function ($scope, CallsSrv, CallsUiSrv, CallsStatusEnum, $log, CallsErrorSrv, $timeout) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            CallsUiSrv.getCalleeName(callsData.receiverId, callsData.callerId).then(function(res){
                $scope.callerName = res;
            });

            var isPendingClick = false;

            $scope.declineByOther = true;

            function _isNoPendingClick() {
                return !isPendingClick;
            }

            function _clickStatusSetter(clickStatus) {
                isPendingClick = clickStatus;
            }

            function _fillLoader(bool, methodName) {
                if (methodName === 'acceptCall') {
                    if (bool === true) {
                        $timeout(function() {
                            self.fillLoader = bool;
                        }, 2500);
                    } else {
                        self.fillLoader = bool;
                    }
                }
            }

            function _startLoader(bool, methodName) {
                if (methodName === 'acceptCall') {
                    self.startLoader = bool;
                }
            }

            function _updateBtnStatus(bool, methodName) {
                _clickStatusSetter(bool);
                _startLoader(bool, methodName);
                _fillLoader(bool, methodName);
            }

            function _baseCall(callFn, methodName) {
                 callsData = self.scope.callsData;
                if (_isNoPendingClick()) {
                    if (methodName === 'declineCall') {
                        $scope.declineByOther = false;
                    }
                    _updateBtnStatus(true, methodName);
                    callFn(callsData).then(function () {
                        _updateBtnStatus(false, methodName);
                        CallsUiSrv.closeModal();
                    }).catch(function (err) {
                        _updateBtnStatus(false, methodName);
                        $log.error('IncomingCallModalCtrl '+ methodName +': err: ' + err);
                        CallsErrorSrv.showErrorModal(err);
                        CallsSrv.declineCall(callsData);
                    });
                }
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall');

            this.acceptCall = _baseCall.bind(null, CallsSrv.acceptCall, 'acceptCall');

            this.closeModal = CallsUiSrv.closeModal;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').controller('OutgoingCallModalCtrl',
        ["CallsSrv", "CallsUiSrv", "$log", "CallsStatusEnum", "$scope", "$timeout", "CallsErrorSrv", function (CallsSrv, CallsUiSrv, $log, CallsStatusEnum, $scope, $timeout, CallsErrorSrv) {
            'ngInject';

            var self = this;
            var callsData = self.scope.callsData;

            var isPendingClick = false;

            function _isNoPendingClick() {
                return !isPendingClick;
            }

            function _clickStatusSetter(clickStatus) {
                isPendingClick = clickStatus;
            }

            CallsUiSrv.getCalleeName(callsData.receiverId, callsData.callerId).then(function(res){
                $scope.calleeName = res;
            });

            $scope.declineByOther = true;

            $scope.$watch('callsData', function(newVal) {
                if (angular.isDefined(newVal) && newVal.status) {
                     switch(newVal.status) {
                         case CallsStatusEnum.ACTIVE_CALL.enum:
                             $timeout(function() {
                                 CallsUiSrv.closeModal();
                             }, 2000);
                             break;
                     }
                    callsData = newVal;
                }
            });

            function _baseCall(callFn, methodName) {
                callsData = self.scope.callsData;
                if (_isNoPendingClick()) {
                    if (methodName === 'declineCall') {
                        $scope.declineByOther = false;
                    }
                    _clickStatusSetter(true);
                    callFn(callsData).then(function () {
                        _clickStatusSetter(false);
                        CallsUiSrv.closeModal();
                    }).catch(function (err) {
                        _clickStatusSetter(false);
                        $log.error('OutgoingCallModalCtrl '+ methodName +': err: ' + err);
                        CallsErrorSrv.showErrorModal(err);
                    });
                }
            }

            this.declineCall = _baseCall.bind(null, CallsSrv.declineCall, 'declineCall');

            this.closeModalAndDisconnect = _baseCall.bind(null, CallsSrv.disconnectCall, 'disconnectCall');
        }]
    );
})(angular);

(function(){
    'use strict';

    angular.module('znk.infra.calls').run(
        ["CallsEventsSrv", function(CallsEventsSrv){
            'ngInject';

            CallsEventsSrv.activate();
        }]
    );
})();

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .run(["$timeout", "$translatePartialLoader", function($timeout, $translatePartialLoader){
            'ngInject';
            //must be wrapped in timeout because the parting adding cannot be made directly in a run block
            $timeout(function(){
                $translatePartialLoader.addPart('calls');
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsBtnSrv',
        ["CallsStatusEnum", "CallsBtnStatusEnum", "UserProfileService", "$log", "CallsDataGetterSrv", function (CallsStatusEnum, CallsBtnStatusEnum, UserProfileService, $log, CallsDataGetterSrv) {
            'ngInject';

            var self = this;

             this.getBtnStatus = function _getBtnStatus(callStatus) {
                var status;
                switch(callStatus) {
                    case CallsStatusEnum.PENDING_CALL.enum:
                        status = CallsBtnStatusEnum.CALLED_BTN.enum;
                        break;
                    case CallsStatusEnum.DECLINE_CALL.enum:
                        status = CallsBtnStatusEnum.CALL_BTN.enum;
                        break;
                    case CallsStatusEnum.ACTIVE_CALL.enum:
                        status = CallsBtnStatusEnum.CALLED_BTN.enum;
                        break;
                    case CallsStatusEnum.ENDED_CALL.enum:
                        status = CallsBtnStatusEnum.CALL_BTN.enum;
                }
                return status;
            };

            this.initializeBtnStatus = function(receiverId) {
                return CallsDataGetterSrv.getCallStatus(receiverId).then(function(status) {
                    return self.getBtnStatus(status);
                });
            };

            this.updateBtnStatus = function(receiverId, callsData) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    var status = false;
                    if (CallsDataGetterSrv.isCallDataHasReceiverIdOrCallerId(callsData, receiverId, callerId)) {
                         status = self.getBtnStatus(callsData.status);
                    }
                    return status;
                }).catch(function(err){
                    $log.error('Error in CallsBtnSrv updateBtnStatus in UserProfileService.getCurrUserId(): err: ' + err);
                });
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsDataGetterSrv',
        ["InfraConfigSrv", "$q", "ENV", "UserProfileService", "$log", "CallsActionStatusEnum", function (InfraConfigSrv, $q, ENV, UserProfileService, $log, CallsActionStatusEnum) {
            'ngInject';

            var self = this;

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            function _isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId) {
                return callsData.callerId === callerId && callsData.receiverId === receiverId;
            }

            function _isNewReceiverIdMatchActiveCallerId(callsData, callerId, receiverId) {
                return callsData.receiverId === callerId && callsData.callerId === receiverId;
            }

            function _isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId) {
                return callsData.callerId === callerId && callsData.receiverId !== receiverId;
            }

            function _isNewReceiverIdNotMatchActiveCallerId(callsData, callerId, receiverId) {
                return callsData.receiverId === callerId && callsData.callerId !== receiverId;
            }

            function _isCallDataHasReceiverIdOrCallerId(callsData, receiverId, callerId) {
                return (callsData.receiverId === receiverId &&
                    callsData.callerId === callerId) ||
                    (callsData.receiverId === callerId &&
                    callsData.callerId === receiverId);
            }

            function _getCallsRequests(uid, path) {
                return _getStorage().then(function(storage){
                    var currUserCallsDataPath = path ? path : ENV.firebaseAppScopeName + '/users/' + uid + '/calls';
                    return storage.get(currUserCallsDataPath);
                }).catch(function(err){
                    $log.error('Error in _getStorage', err);
                    return $q.reject(err);
                });
            }

            function _getCallsDataMap(callsRequests) {
                var callsDataPromMap = {};
                angular.forEach(callsRequests, function(isActive, guid){
                    if(isActive) {
                        callsDataPromMap[guid] = self.getCallsData(guid);
                    }
                });
                return $q.all(callsDataPromMap);
            }

            this.getCallsDataPath = function (guid) {
                var SCREEN_SHARING_ROOT_PATH = 'calls';
                return SCREEN_SHARING_ROOT_PATH + '/' + guid;
            };

            this.getCallsRequestsPath  = function (uid, isTeacher) {
                var appName = isTeacher ? ENV.dashboardAppName : ENV.studentAppName;
                var USER_DATA_PATH = appName  + '/users/' + uid;
                return USER_DATA_PATH + '/calls';
            };

            this.getCallsData = function (callsGuid) {
                var callsDataPath = self.getCallsDataPath(callsGuid);
                return _getStorage().then(function (storage) {
                    return storage.get(callsDataPath);
                }).catch(function(err){
                    $log.error('Error in _getStorage', err);
                    return $q.reject(err);
                });
            };

            this.getCurrUserCallsRequests = function(){
                return UserProfileService.getCurrUserId().then(function(currUid){
                    return _getCallsRequests(currUid);
                }).catch(function(err){
                    $log.error('Error in UserProfileService.getCurrUserId', err);
                    return $q.reject(err);
                });
            };

            this.getCurrUserCallsData = function () {
                return self.getCurrUserCallsRequests().then(function(currUserCallsRequests){
                      return _getCallsDataMap(currUserCallsRequests);
                });
            };

            this.getReceiverCallsData = function (receiverId, isTeacherApp) {
                var receiverPath = self.getCallsRequestsPath(receiverId, !isTeacherApp);
                return _getCallsRequests(receiverId, receiverPath).then(function(receiverCallsRequests){
                    return _getCallsDataMap(receiverCallsRequests);
                });
            };

            this.getUserCallActionStatus = function(callerId, receiverId) {
                return self.getCurrUserCallsData().then(function (callsDataMap) {
                    var userCallData = false;
                    var callsDataMapKeys = Object.keys(callsDataMap);
                    for (var i in callsDataMapKeys) {
                        if (callsDataMapKeys.hasOwnProperty(i)) {
                            var callsDataKey = callsDataMapKeys[i];
                            var callsData = callsDataMap[callsDataKey];

                            switch(true) {
                                /* if user that calls active, and new call init has same receiverId then disconnect */
                                case _isNewReceiverIdMatchActiveReceiverId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_ACTION.enum,
                                        callerId: callerId,
                                        newReceiverId: receiverId,
                                        newCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that receive call active, and new call init has same callerId then disconnect */
                                case _isNewReceiverIdMatchActiveCallerId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_ACTION.enum,
                                        callerId: receiverId,
                                        newReceiverId: callerId,
                                        newCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that calls is active with receiverId and new call init with other
                                 receiverId then disconnect from current receiverId and connect with new receiverId */
                                case _isNewReceiverIdNotMatchActiveReceiverId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum,
                                        callerId: callerId,
                                        newReceiverId: receiverId,
                                        oldReceiverId: callsData.receiverId,
                                        oldCallGuid: callsData.guid
                                    };
                                    break;
                                /* if user that receive calls is active with callerIdId and new call init with other
                                 receiverId then disconnect from current callerId and connect with new receiverId */
                                case _isNewReceiverIdNotMatchActiveCallerId(callsData, callerId, receiverId):
                                    userCallData = {
                                        action: CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum,
                                        callerId: receiverId,
                                        newReceiverId: callerId,
                                        oldReceiverId: callsData.callerId,
                                        oldCallGuid: callsData.guid
                                    };
                                    break;

                            }
                            if (userCallData) {
                                break;
                            }
                        }
                    }
                    if (!userCallData) {
                        /* if user not active, and call init then active user */
                        userCallData = {
                            action: CallsActionStatusEnum.CONNECT_ACTION.enum,
                            callerId: callerId,
                            newReceiverId: receiverId
                        };
                    }
                    return userCallData;
                });
            };

            this.getCallStatus = function(receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    return self.getCurrUserCallsData().then(function (callsDataMap) {
                        var status = false;
                        for (var idKey in callsDataMap) {
                            if (callsDataMap.hasOwnProperty(idKey)) {
                                var currCallsData = callsDataMap[idKey];
                                if (_isCallDataHasReceiverIdOrCallerId(currCallsData, receiverId, callerId)) {
                                    status = currCallsData.status;
                                    break;
                                }
                            }
                        }
                        return status;
                    }).catch(function(err){
                        $log.error('Error in CallsDataGetterSrv getCallStatus, err: ' + err);
                    });
                }).catch(function(err){
                    $log.error('Error in CallsDataGetterSrv getCallStatus, err: ' + err);
                });
            };

            this.getDataPromMap = function(guid) {
                var getDataPromMap = {};
                getDataPromMap.currUserCallsRequests = self.getCurrUserCallsRequests();
                getDataPromMap.currCallData = self.getCallsData(guid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();
                return getDataPromMap;
            };

            this.isCallDataHasReceiverIdOrCallerId = _isCallDataHasReceiverIdOrCallerId;
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsDataSetterSrv',
        ["InfraConfigSrv", "$q", "ENV", "CallsStatusEnum", "CallsDataGetterSrv", function (InfraConfigSrv, $q, ENV, CallsStatusEnum, CallsDataGetterSrv) {
            'ngInject';

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            this.setNewConnect = function(data, userCallData, guid, isTeacherApp) {
                var dataToSave = {};
                var isCallerTeacher = userCallData.callerId === data.currUid && isTeacherApp;
                var receiverPath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.newReceiverId, !isCallerTeacher);
                var callerPath = CallsDataGetterSrv.getCallsRequestsPath(userCallData.callerId, isCallerTeacher);
                var newCallData = {
                    guid: guid,
                    callerId: userCallData.callerId,
                    receiverId: userCallData.newReceiverId,
                    status: CallsStatusEnum.PENDING_CALL.enum,
                    callerPath: callerPath,
                    receiverPath: receiverPath,
                    startedTime: Date.now()
                };
                // update root call
                angular.extend(data.currCallData, newCallData);
                dataToSave[data.currCallData.$$path] = data.currCallData;
                //current user call requests object update
                data.currUserCallsRequests[guid] = true;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.newReceiverId === data.currUid ? callerPath : receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = true;
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setDisconnectCall = function(data, userCallData, guid) {
                var dataToSave = {};
                // update root
                data.currCallData.status = CallsStatusEnum.ENDED_CALL.enum;
                data.currCallData.endedTime = Date.now();
                dataToSave[data.currCallData.$$path] = angular.copy(data.currCallData);
                //current user call requests object update
                data.currUserCallsRequests[guid] = null;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.receiverId === data.currUid ? data.currCallData.callerPath : data.currCallData.receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = null;
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setDeclineCall = function(data, userCallData, guid) {
                var dataToSave = {};
                // update root
                data.currCallData.status = CallsStatusEnum.DECLINE_CALL.enum;
                data.currCallData.endedTime = Date.now();
                dataToSave[data.currCallData.$$path] = angular.copy(data.currCallData);
                //current user call requests object update
                data.currUserCallsRequests[guid] = null;
                dataToSave[data.currUserCallsRequests.$$path] = data.currUserCallsRequests;
                //other user call requests object update
                var otherUserCallPath = userCallData.receiverId === data.currUid ? data.currCallData.callerPath : data.currCallData.receiverPath;
                var otherUserCallDataGuidPath = otherUserCallPath + '/' + guid;
                dataToSave[otherUserCallDataGuidPath] = null;

                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

            this.setAcceptCall = function(currCallData) {
                var dataToSave = {};
                // update root
                currCallData.status = CallsStatusEnum.ACTIVE_CALL.enum;
                dataToSave[currCallData.$$path] = angular.copy(currCallData);
                return _getStorage().then(function (StudentStorage) {
                    return StudentStorage.update(dataToSave);
                });
            };

        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsErrorSrv',
        ["CallsUiSrv", "$q", function (CallsUiSrv, $q) {
            'ngInject';

            var errorCodesList = {
                1: 'microphone', // this is define in webcall module, if it's changed here, it should changed there also.
                2: 'general',
                3: 'alreadyActive'
            };

            var CALLS_ERROR_TEXT = {
                microphone: '.CALL_FAILED_DESC_MICROPHONE',
                general: '.CALL_FAILED_DESC_GENERAL',
                alreadyActive: '.CALL_FAILED_DESC_ALREADY_ACTIVE'
            };

            function _showErrorModal(err) {
                var errorCode = err && err.errorCode ? errorCodesList[err.errorCode] : errorCodesList[2];
                var modalData = {};
                var errorProm = $q.when(false);

                switch (errorCode) {
                    case 'microphone':
                        modalData.errorMessage = CALLS_ERROR_TEXT.microphone;
                        break;
                    case 'general':
                        modalData.errorMessage = CALLS_ERROR_TEXT.general;
                        break;
                    case 'alreadyActive':
                        modalData.errorMessage = CALLS_ERROR_TEXT.alreadyActive;
                        errorProm = CallsUiSrv.getCalleeName(err.receiverId, err.callerId).then(function (name) {
                            modalData.errorValues = {
                                calleeName: name
                            };
                            return modalData;
                        });
                        break;
                    default:
                        modalData.errorMessage = CALLS_ERROR_TEXT.general;
                        break;
                }

                return errorProm.then(function () {
                    return CallsUiSrv.showErrorModal(CallsUiSrv.modals.ERROR, modalData);
                });
            }

            this.showErrorModal = function(err) {
                return _showErrorModal(err);
            };

        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls')
        .constant('CALL_UPDATE', 'CallsEventsSrv: call updated')
        .provider('CallsEventsSrv', function () {

            var isEnabled = true;

            this.enabled = function (_isEnabled) {
                isEnabled = _isEnabled;
            };

            this.$get = ["UserProfileService", "InfraConfigSrv", "StorageSrv", "ENV", "CallsStatusEnum", "CallsUiSrv", "$log", "$rootScope", "$injector", "$q", "CALL_UPDATE", function (UserProfileService, InfraConfigSrv, StorageSrv, ENV, CallsStatusEnum, CallsUiSrv, $log, $rootScope, $injector, $q, CALL_UPDATE) {
                'ngInject';
                var registeredCbToCurrUserCallStateChange = [];
                var currUserCallState;

                var CallsEventsSrv = {};

                var scopesObj = {};

                var isInitialize = false;

                var callsSrv;

                function updateScopeData(callsData) {
                    angular.forEach(scopesObj, function(scope) {
                        scope.callsData = callsData;
                    });
                }

                function openOutGoingCall(callsData) {
                    scopesObj.caller = $rootScope.$new();
                    scopesObj.caller.callsData = callsData;
                    CallsUiSrv.showModal(CallsUiSrv.modals.OUTGOING_CALL, scopesObj.caller);
                }

                function getCallsSrv() {
                    if (!callsSrv) {
                        callsSrv = $injector.get('CallsSrv');
                    }
                    return callsSrv;
                }

                function _listenToCallsData(guid) {
                    $log.debug('_listenToCallsData');
                    var callsStatusPath = 'calls/' + guid;

                    function _cb(callsData) {

                        if (!callsData) {
                            currUserCallState = callsData;
                            return;
                        }

                        updateScopeData(callsData);

                        $rootScope.$broadcast(CALL_UPDATE, callsData);

                        UserProfileService.getCurrUserId().then(function (currUid) {
                            switch(callsData.status) {
                                case CallsStatusEnum.PENDING_CALL.enum:
                                    $log.debug('call pending');
                                    if (!isCurrentUserInitiatedCall(currUid)) {
                                        // show incoming call modal with the ACCEPT & DECLINE buttons
                                        scopesObj.reciver = $rootScope.$new();
                                        scopesObj.reciver.callsData = callsData;
                                        CallsUiSrv.showModal(CallsUiSrv.modals.INCOMING_CALL, scopesObj.reciver);
                                    }
                                    break;
                                case CallsStatusEnum.DECLINE_CALL.enum:
                                    $log.debug('call declined');
                                    if (isCurrentUserInitiatedCall(currUid)) {
                                        getCallsSrv().disconnectCall();
                                    }
                                    break;
                                case CallsStatusEnum.ACTIVE_CALL.enum:
                                    $log.debug('call active');
                                    if (!isCurrentUserInitiatedCall(currUid)) {
                                        CallsUiSrv.closeModal();
                                        // show outgoing call modal WITH the ANSWERED TEXT, wait 2 seconds and close the modal, show the ActiveCallDRV
                                        // ActivePanelSrv.showActivePanelDrv('calls');
                                        // ActivePanelSrv.updateStatus('calls', ActivePanelStatusEnum.ACTIVE.enum);
                                    } else {
                                        // close the modal, show the ActiveCallDRV
                                        // CallsUiSrv.closeModal();
                                        // ActivePanelSrv.showActivePanelDrv('calls');
                                        // ActivePanelSrv.updateStatus('calls', ActivePanelStatusEnum.ACTIVE.enum);
                                    }
                                    // ActivePanelSrv.updateStatus(ActivePanelComponentEnum.CALLS.enum, ActivePanelStatusEnum.ACTIVE.enum);
                                    break;
                                case CallsStatusEnum.ENDED_CALL.enum:
                                    $log.debug('call ended');
                                    // ActivePanelSrv.updateStatus(ActivePanelComponentEnum.CALLS.enum, ActivePanelStatusEnum.INACTIVE.enum);
                                    // disconnect other user from call
                                    getCallsSrv().disconnectCall();
                                    break;
                            }
                            _invokeCbs(registeredCbToCurrUserCallStateChange, [callsData]);
                        });

                        function isCurrentUserInitiatedCall(currUid) {
                            return (currUid === callsData.callerId);
                        }
                    }

                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                        globalStorage.onEvent(StorageSrv.EVENTS.VALUE, callsStatusPath, _cb);
                    });
                }

                function _startListening() {
                    UserProfileService.getCurrUserId().then(function (currUid) {
                        InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                            var appName = ENV.firebaseAppScopeName;
                            var userCallsPath = appName + '/users/' + currUid + '/calls';
                            globalStorage.onEvent(StorageSrv.EVENTS.VALUE, userCallsPath, function (userCallsData) {
                                var prom = $q.when(false);
                                if (!isInitialize && userCallsData) {
                                    prom = getCallsSrv().disconnectAllCalls(userCallsData);
                                }
                                prom.then(function (result) {
                                    isInitialize = true;
                                    if (!result) {
                                        if (userCallsData) {
                                            angular.forEach(userCallsData, function (isActive, guid) {
                                                _listenToCallsData(guid);
                                            });
                                        }
                                    }
                                });
                            });
                        });
                    });
                }

                function _invokeCbs(cbArr, args){
                    cbArr.forEach(function(cb){
                        cb.apply(null, args);
                    });
                }

                CallsEventsSrv.activate = function () {
                    if (isEnabled) {
                        _startListening();
                    }
                };

                CallsEventsSrv.openOutGoingCall = openOutGoingCall;

                CallsEventsSrv.updateScopeData = updateScopeData;

                CallsEventsSrv.registerToCurrUserCallStateChanges = function (cb) {
                    registeredCbToCurrUserCallStateChange.push(cb);
                    cb(currUserCallState);
                };

                return CallsEventsSrv;
            }];
        });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.callsModals', []);
})(angular);

(function (angular) {
    'use strict';

    function CallsModalService() {

        var baseTemplateUrl;

        this.setBaseTemplatePath = function(templateUrl) {
            baseTemplateUrl = templateUrl;
        };

        this.$get = ["$mdDialog", "$rootScope", function($mdDialog, $rootScope) {
            'ngInject';
            var CallsModalService = {};

            CallsModalService.showBaseModal = function (popupData) {
                $mdDialog.show({
                    locals: {
                        svgIcon: popupData.svgIcon,
                        innerTemplateUrl: popupData.innerTemplateUrl,
                        overrideCssClass: popupData.overrideCssClass,
                        modalData: popupData.modalData,
                        modalName: popupData.modalName,
                        closeModal: function closeModal (){
                            $mdDialog.hide();
                        }
                    },
                    scope: popupData.scope || $rootScope.$new(),
                    bindToController: true,
                    controller: popupData.controller,
                    controllerAs: 'vm',
                    templateUrl: baseTemplateUrl || popupData.baseTemplateUrl,
                    clickOutsideToClose: angular.isDefined(popupData.clickOutsideToClose) ? popupData.clickOutsideToClose : true,
                    escapeToClose: angular.isDefined(popupData.escapeToClose) ? popupData.escapeToClose : true
                });
            };

            return CallsModalService;
        }];
    }

    angular.module('znk.infra.callsModals').provider('CallsModalService', CallsModalService);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsSrv',
        ["UserProfileService", "$q", "UtilitySrv", "ENV", "$log", "CallsDataGetterSrv", "CallsDataSetterSrv", "WebcallSrv", "CallsEventsSrv", "CallsStatusEnum", "CallsActionStatusEnum", function (UserProfileService, $q, UtilitySrv, ENV, $log, CallsDataGetterSrv, CallsDataSetterSrv, WebcallSrv, CallsEventsSrv, CallsStatusEnum, CallsActionStatusEnum) {
            'ngInject';

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _handleCallerIdOrReceiverIdUndefined(callsData, methodName) {
                if (angular.isUndefined(callsData.callerId) || angular.isUndefined(callsData.receiverId)) {
                    var errMSg = 'CallsSrv '+ methodName +': callerId or receiverId are missing!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return $q.when(true);
            }

            function _webCallConnect(callId) {
                return WebcallSrv.connect(callId).catch(function(err) {
                    $log.error('Error in _webCallConnect', err);
                    return $q.reject(err);
                });
            }

            function _webCallHang() {
                return WebcallSrv.hang().catch(function(err) {
                    $log.debug('_webCallHang catch', err);
                    return $q.reject(err);
                });
            }

            function _connectCall(userCallData) {
                var newCallGuid = UtilitySrv.general.createGuid();
                $log.debug('new call guid: ' + newCallGuid);
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(newCallGuid);
                // initial popup pending without cancel option until return from firebase
                var callsData = {
                    status: CallsStatusEnum.PENDING_CALL.enum,
                    callerId: userCallData.callerId,
                    receiverId: userCallData.newReceiverId
                };
                CallsEventsSrv.openOutGoingCall(callsData);
                return _webCallConnect(newCallGuid).then(function () {
                    return $q.all(getDataPromMap).then(function (data) {
                        return CallsDataSetterSrv.setNewConnect(data, userCallData, newCallGuid, isTeacherApp).then(function (callsMap) {
                            var callsData = angular.copy(callsMap['calls/' + newCallGuid]);
                            callsData.isInitialized = true;
                            CallsEventsSrv.updateScopeData(callsData);
                            return callsMap;
                        });
                    });
                });
            }

            function _disconnectCall(userCallData) {
                var receiverId = userCallData.oldReceiverId ? userCallData.oldReceiverId : userCallData.newReceiverId;
                var guid = userCallData.oldCallGuid ? userCallData.oldCallGuid : userCallData.newCallGuid;
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(guid);
                _webCallHang();
                return $q.all(getDataPromMap).then(function (data) {
                    return CallsDataSetterSrv.setDisconnectCall(data, {
                        receiverId: receiverId
                    }, guid);
                });
            }

            function _acceptCall(callsData) {
                return _webCallConnect(callsData.guid).then(function() {
                    return CallsDataGetterSrv.getCallsData(callsData.guid).then(function (currCallData) {
                        return CallsDataSetterSrv.setAcceptCall(currCallData);
                    });
                });
            }

            function _declineCall(callsData) {
                _webCallHang();
                var getDataPromMap = CallsDataGetterSrv.getDataPromMap(callsData.guid);
                return $q.all(getDataPromMap).then(function (data) {
                    return CallsDataSetterSrv.setDeclineCall(data, callsData, callsData.guid);
                });
            }

            function _initiateCall(callerId, receiverId) {
                if (angular.isUndefined(callerId) || angular.isUndefined(receiverId)) {
                    var errMSg = 'CallsSrv: callerId or receiverId are missing!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                return _isReceiverIsInActiveCall(receiverId, callerId).then(function () {
                    return CallsDataGetterSrv.getUserCallActionStatus(callerId, receiverId).then(function (userCallData) {
                        var callActionProm;

                        switch (userCallData.action) {
                            case CallsActionStatusEnum.DISCONNECT_ACTION.enum:
                                callActionProm = _disconnectCall(userCallData);
                                break;
                            case CallsActionStatusEnum.CONNECT_ACTION.enum:
                                callActionProm = _connectCall(userCallData);
                                break;
                            case CallsActionStatusEnum.DISCONNECT_AND_CONNECT_ACTION.enum:
                                callActionProm = _disconnectCall(userCallData).then(function () {
                                    return _connectCall(userCallData);
                                });
                                break;
                        }

                        return callActionProm;
                    });
                });
            }

            function _isReceiverIsInActiveCall(receiverId, callerId) {
                return CallsDataGetterSrv.getReceiverCallsData(receiverId, isTeacherApp).then(function(callsDataMap) {
                    var callsDataArr = [];
                    var isInActiveCall = false;
                    angular.forEach(callsDataMap, function(callData) {
                        if(callData.status && (callData.status === CallsStatusEnum.PENDING_CALL.enum ||
                            callData.status === CallsStatusEnum.ACTIVE_CALL.enum) &&
                            !CallsDataGetterSrv.isCallDataHasReceiverIdOrCallerId(callData, receiverId, callerId)) {
                            callsDataArr.push(callData);
                        }
                    });
                    if (callsDataArr.length > 0) {
                        var err = {
                            receiverId: receiverId,
                            errorCode: 3
                        };
                        $log.error('Error in _isReceiverIsInActiveCall', err);
                        isInActiveCall = $q.reject(err);
                    }
                    return isInActiveCall;
                });
            }

            // api
            this.acceptCall = function(callsData) {
                return _handleCallerIdOrReceiverIdUndefined(callsData, 'acceptCall').then(function () {
                    return _acceptCall(callsData);
                }).catch(function(err){
                    $log.error('Error in acceptCall', err);
                    return $q.reject(err);
                });
            };

            this.declineCall = function(callsData) {
                return _handleCallerIdOrReceiverIdUndefined(callsData, 'declineCall').then(function () {
                    return _declineCall(callsData);
                }).catch(function(err){
                    $log.error('Error in declineCall', err);
                    return $q.reject(err);
                });
            };

            this.disconnectCall = function(callsData, useWebCallHangProm) {
                var prom = $q.when();
                if (useWebCallHangProm) {
                    prom = _webCallHang();
                } else {
                    _webCallHang();
                }
                return prom;
            };

            this.disconnectAllCalls = function(userCallsDataMap) {
                var callsMapProm = [];
                angular.forEach(userCallsDataMap, function(isActive, guidKey) {
                    var callProm = CallsDataGetterSrv.getCallsData(guidKey).then(function (callsData) {
                        return _declineCall(callsData, false);
                    });
                    callsMapProm.push(callProm);
                });
                return $q.all(callsMapProm);
            };

            this.callsStateChanged = function (receiverId) {
                return UserProfileService.getCurrUserId().then(function(callerId) {
                    return _initiateCall(callerId, receiverId);
                }).catch(function(err){
                    $log.error('Error in callsStateChanged', err);
                    return $q.reject(err);
                });
            };
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').provider('CallsUiSrv',
        function () {
            'ngInject';

            var calleeNameFn = {};
            this.setCalleeNameFnGetter = function (func) {
                calleeNameFn = func;
            };

            this.$get = ["$mdDialog", "CallsModalService", "$injector", function ($mdDialog, CallsModalService, $injector) {

                var CallsUiSrv = {};

                CallsUiSrv.showModal = function (modal, scope) {
                    modal.scope = scope;
                    CallsModalService.showBaseModal(modal);
                };

                CallsUiSrv.showErrorModal = function (modal, modalData) {
                    modal.modalData = modalData;
                    CallsModalService.showBaseModal(modal);
                };

                CallsUiSrv.closeModal = function () {
                    $mdDialog.hide();
                };

                CallsUiSrv.modals = {
                    'INCOMING_CALL': {
                        svgIcon: 'incoming-call-icon',
                        baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                        innerTemplateUrl: 'components/calls/modals/templates/incomingCall.template.html',
                        controller: 'IncomingCallModalCtrl',
                        overrideCssClass: 'incoming-call-modal',
                        clickOutsideToClose: false,
                        escapeToClose: false
                    },
                    'OUTGOING_CALL': {
                        svgIcon: 'outgoing-call-icon',
                        baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                        innerTemplateUrl: 'components/calls/modals/templates/outgoingCall.template.html',
                        controller: 'OutgoingCallModalCtrl',
                        overrideCssClass: 'outgoing-call-modal',
                        clickOutsideToClose: false,
                        escapeToClose: false
                    },
                    'ERROR': {
                        svgIcon: 'call-error-exclamation-mark-icon',
                        baseTemplateUrl: 'components/calls/modals/templates/baseCallsModal.template.html',
                        innerTemplateUrl: 'components/calls/modals/templates/errorModal.template.html',
                        controller: 'ErrorModalCtrl',
                        overrideCssClass: 'call-error-modal',
                        clickOutsideToClose: false,
                        escapeToClose: false
                    }
                };

                CallsUiSrv.getCalleeName = function(receiverId, callerId) {
                    var namePromOrFnGetter = $injector.invoke(calleeNameFn);
                    var nameProm = namePromOrFnGetter(receiverId, callerId);
                    return nameProm.then(function(res){
                        return res;
                    });
                };

                return CallsUiSrv;
            }];
        }
    );
})(angular);

angular.module('znk.infra.calls').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/calls/directives/callBtn/callBtn.template.html",
    "<button\n" +
    "    ng-click=\"vm.clickBtn()\"\n" +
    "    class=\"call-btn\"\n" +
    "     ng-class=\"{\n" +
    "          'offline': vm.callBtnState === vm.callBtnEnum.OFFLINE_BTN.enum,\n" +
    "          'call': vm.callBtnState === vm.callBtnEnum.CALL_BTN.enum,\n" +
    "          'called': vm.callBtnState === vm.callBtnEnum.CALLED_BTN.enum\n" +
    "     }\">\n" +
    "    <svg-icon\n" +
    "        class=\"etutoring-phone-icon\"\n" +
    "        name=\"calls-etutoring-phone-icon\">\n" +
    "    </svg-icon>\n" +
    "</button>\n" +
    "");
  $templateCache.put("components/calls/modals/templates/baseCallsModal.template.html",
    "<md-dialog aria-label=\"{{'SHARED_MD_DIALOG.BASE_MODAL.MODAL_NAME' | translate: {modalName: vm.modalName} }}\"\n" +
    "           class=\"baseCallsModal\" ng-cloak ng-class=\"vm.overrideCssClass\">\n" +
    "    <md-toolbar></md-toolbar>\n" +
    "    <md-dialog-content>\n" +
    "        <ng-include src=\"vm.innerTemplateUrl\"></ng-include>\n" +
    "    </md-dialog-content>\n" +
    "    <div class=\"top-icon-wrap\">\n" +
    "        <div class=\"top-icon\">\n" +
    "            <div class=\"round-icon-wrap\">\n" +
    "                <svg-icon class=\"icon\" name=\"{{vm.svgIcon}}\"></svg-icon>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</md-dialog>\n" +
    "");
  $templateCache.put("components/calls/modals/templates/errorModal.template.html",
    "<div translate-namespace=\"AUDIO_CALLS\">\n" +
    "    <div class=\"modal-main-title\"\n" +
    "         translate=\".CALL_FAILED_HEADER\">\n" +
    "    </div>\n" +
    "    <div class=\"modal-sub-title\"\n" +
    "         translate=\"{{errorMessage}}\"\n" +
    "         translate-values=\"{{errorValues}}\">\n" +
    "    </div>\n" +
    "    <div class=\"btn-container\">\n" +
    "        <div class=\"btn-ok\">\n" +
    "            <button\n" +
    "                ng-click=\"vm.closeModal()\"\n" +
    "                translate=\".OK\">\n" +
    "            </button>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/calls/modals/templates/incomingCall.template.html",
    "<div translate-namespace=\"AUDIO_CALLS\">\n" +
    "    <div class=\"modal-main-title\" translate=\".INCOMING_CALL\"></div>\n" +
    "\n" +
    "    <ng-switch on=\"callsData.status\">\n" +
    "        <!-- Call Pending -->\n" +
    "        <div ng-switch-when=\"1\" class=\"flex-column\">\n" +
    "            <span\n" +
    "                class=\"modal-sub-title call-status\"\n" +
    "                translate=\".NAME_IS_CALLING\"\n" +
    "                translate-values=\"{callerName: callerName}\"></span>\n" +
    "            <div class=\"btn-container\">\n" +
    "                <div class=\"btn-decline\">\n" +
    "                    <button\n" +
    "                        ng-click=\"vm.declineCall()\"\n" +
    "                        translate=\".DECLINE\">\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "                <div class=\"btn-accept\">\n" +
    "                    <button\n" +
    "                        ng-click=\"vm.acceptCall()\"\n" +
    "                        class=\"primary\"\n" +
    "                        element-loader\n" +
    "                        fill-loader=\"vm.fillLoader\"\n" +
    "                        show-loader=\"vm.startLoader\"\n" +
    "                        bg-loader=\"'#07434A'\"\n" +
    "                        precentage=\"50\"\n" +
    "                        font-color=\"'#FFFFFF'\"\n" +
    "                        bg=\"'#0a9bad'\">\n" +
    "                        <span translate=\".ACCEPT\"></span>\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "\n" +
    "        <!-- Call Declined -->\n" +
    "        <div ng-switch-when=\"2\" class=\"flex-column\" ng-if=\"declineByOther\">\n" +
    "            <span\n" +
    "                translate=\".CALLING_CANCELED\"\n" +
    "                class=\"modal-sub-title call-status\">\n" +
    "            </span>\n" +
    "            <div class=\"btn-container\">\n" +
    "                <div class=\"btn-ok\">\n" +
    "                    <button\n" +
    "                        ng-click=\"vm.closeModal()\"\n" +
    "                        translate=\".OK\">\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </ng-switch>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/calls/modals/templates/outgoingCall.template.html",
    "<div translate-namespace=\"AUDIO_CALLS\">\n" +
    "    <div class=\"modal-main-title\"\n" +
    "         translate=\".OUTGOING_CALL\">\n" +
    "    </div>\n" +
    "    <div class=\"switch-container\"\n" +
    "         ng-switch=\"callsData.status\">\n" +
    "        <div ng-switch-when=\"1\">\n" +
    "            <div class=\"modal-sub-title\"\n" +
    "                 translate=\".CALLING_NAME\"\n" +
    "                 translate-values=\"{calleeName: calleeName}\">\n" +
    "            </div>\n" +
    "            <div class=\"btn-container\">\n" +
    "                <div class=\"btn-accept\">\n" +
    "                    <button\n" +
    "                        class=\"animate-if\"\n" +
    "                        ng-if=\"callsData.isInitialized\"\n" +
    "                        ng-click=\"vm.declineCall()\"\n" +
    "                        translate=\".CANCEL\">\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-switch-when=\"2\" ng-if=\"declineByOther\">\n" +
    "            <div class=\"modal-sub-title\"\n" +
    "                 translate=\".CALLING_DECLINE\">\n" +
    "            </div>\n" +
    "            <div class=\"btn-container\">\n" +
    "                <div class=\"btn-accept\">\n" +
    "                    <button\n" +
    "                        ng-click=\"vm.closeModalAndDisconnect()\"\n" +
    "                        translate=\".OK\">\n" +
    "                    </button>\n" +
    "                </div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "        <div ng-switch-when=\"3\">\n" +
    "            <div class=\"modal-sub-title\"\n" +
    "                 translate=\".CALLING_ANSWERED\">\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/calls/svg/call-error-exclamation-mark-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     class=\"call-error-exclamation-mark-icon\"\n" +
    "     id=\"Layer_1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"-556.8 363.3 50.8 197.2\"\n" +
    "     style=\"enable-background:new -556.8 363.3 50.8 197.2;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<style type=\"text/css\">\n" +
    "	svg.call-error-exclamation-mark-icon .st0 {\n" +
    "        fill: none;\n" +
    "        enable-background: new;\n" +
    "    }\n" +
    "    svg.call-error-exclamation-mark-icon {\n" +
    "       width: 100%;\n" +
    "        height: auto;\n" +
    "    }\n" +
    "</style>\n" +
    "<g>\n" +
    "	<path d=\"M-505.9,401.6c-0.4,19.5-5.2,38.2-8.7,57.1c-2.8,15.5-4.7,31.2-6.7,46.8c-0.3,2.6-1.1,4-3.7,4.3c-1.5,0.2-2.9,0.6-4.4,0.7\n" +
    "		c-9.2,0.7-9.6,0.4-10.7-8.7c-3.4-29.6-8-58.9-14.6-87.9c-2.3-10.1-3.2-20.4-0.5-30.7c3.7-14.1,17.2-22.3,31.5-19.3\n" +
    "		c9.2,1.9,14.7,8.8,16.2,20.9C-506.7,390.3-506.4,396-505.9,401.6z\"/>\n" +
    "	<path d=\"M-528.9,525.7c10.9,0,16.8,5.3,16.9,15.2c0.1,11-9.3,19.7-21.4,19.6c-8.8,0-14.7-7-14.7-17.7\n" +
    "		C-548.2,530.9-542.4,525.7-528.9,525.7z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/calls/svg/call-mute-icon.svg",
    "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
    "<svg version=\"1.1\"\n" +
    "     id=\"Layer_9\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\" y=\"0px\"\n" +
    "	 viewBox=\"0 0 109.3 175.4\"\n" +
    "     style=\"enable-background:new 0 0 109.3 175.4;\"\n" +
    "     xml:space=\"preserve\">\n" +
    "<g>\n" +
    "	<path d=\"M79.4,104c-1.6-2.4-2.5-3.6-3.3-4.9C60,71.6,44,44.1,27.7,16.6c-2-3.3-1.5-5.2,1.1-7.6C38,0.4,48.7-2.4,60.5,2.2\n" +
    "		c12.7,4.9,19.8,15,20.2,28.3c0.7,21.6,0.2,43.3,0.1,64.9C80.8,97.8,80.1,100.2,79.4,104z\"/>\n" +
    "	<path d=\"M46.7,168.1c0-8.6,0-16.2,0-24.2c-12.1-1.6-22.9-5.8-31.6-14.5C5.2,119.6,0,107.8,0,93.8c0-10.1,0-20.3,0-30.7\n" +
    "		c2.6,0,4.8,0,7.6,0c0,10.2,0.1,20.3,0,30.4C7.5,106,12,116.6,21.3,125c12.7,11.4,27.4,14.3,43.6,8.9c1.2-0.4,2.5-0.9,4.3-1.5\n" +
    "		c1.1,2,2.3,3.9,3.9,6.7c-6.3,1.8-12.1,3.5-18.4,5.3c0,7.3,0,15,0,23.4c8.7,0,17.2,0,26.2,0c0,2.7,0,4.7,0,7.2\n" +
    "		c-20.7,0-41.4,0-62.4,0c0-2.2,0-4.2,0-6.9C27.8,168.1,37.1,168.1,46.7,168.1z\"/>\n" +
    "	<path d=\"M63.4,122.3c-17.2,9.1-38.3-1.1-43.2-20.3c-0.5-2.1-0.8-4.2-1.1-6.4c-0.2-1.5-0.1-3-0.1-4.5c0-14,0-28,1-42.4\n" +
    "		C34.4,73.1,48.8,97.6,63.4,122.3z\"/>\n" +
    "	<path d=\"M3.2,3.4c2-1.2,3.5-2.1,5.5-3.3c33.6,57.4,67,114.4,100.6,171.8c-1.7,1.1-3.2,2.1-5.4,3.5C70.3,118,36.9,60.9,3.2,3.4z\"/>\n" +
    "	<path d=\"M90.7,122.9c-3.3-3.3-3.9-6.1-2-10.7c2.5-5.8,3.8-12.4,4.2-18.7c0.7-10.1,0.2-20.2,0.2-30.5c2.5,0,4.4,0,7,0\n" +
    "		C98.5,83.3,104.6,104.5,90.7,122.9z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/calls/svg/etutoring-phone-icon.svg",
    "<svg x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     class=\"calls-phone-icon\"\n" +
    "     viewBox=\"0 0 124.5 124.8\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\">\n" +
    "    <g>\n" +
    "        <path d=\"M0.1,28.1c-0.6-6.5,1.8-11.6,6.6-16c3.1-2.8,5.8-5.9,8.9-8.8c4.7-4.4,9.5-4.6,14.2-0.3\n" +
    "		c6,5.6,11.7,11.4,17.3,17.3c4.1,4.4,4,8.9,0,13.4c-2.7,3.1-5.7,6.1-8.9,8.8c-2.5,2.2-3.1,4.2-1.4,7.2c9.4,16.2,22.2,29,38.7,37.8\n" +
    "		c1.2,0.7,3.9,0.2,5-0.8c3.2-2.6,5.9-5.8,8.9-8.7c5.3-5,10.1-5.1,15.3-0.1c5.5,5.3,10.9,10.7,16.2,16.3c4.6,4.8,4.6,9.7,0.1,14.6\n" +
    "		c-3.5,3.8-7.2,7.4-10.9,11c-6.4,6-14.1,5.5-21.6,3.6c-22.5-5.6-40.8-18.3-56.7-34.7C17.3,73.6,5.8,56.4,0.9,35.6\n" +
    "		c-0.2-0.8-0.5-1.6-0.5-2.4C0.2,31.5,0.2,29.8,0.1,28.1z\"/>\n" +
    "    </g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/calls/svg/incoming-call-icon.svg",
    "<svg x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "     class=\"calls-incomming-call\"\n" +
    "	 viewBox=\"0 0 80 80\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\">\n" +
    "<g>\n" +
    "	<path d=\"M28.8,80c-3.6-1.9-7.3-3.8-10.9-5.7c-0.6-0.3-1.1-0.9-1.8-1.6C21.9,68,27.5,63.5,33,58.9\n" +
    "		c0.2,0.1,0.4,0.1,0.5,0.1c3.7,2.5,4.1,2.5,7.7-0.3c6.5-5.1,12.4-10.9,17.5-17.5c2.9-3.7,3-4,0.2-8.2c4.5-5.6,9.1-11.2,13.8-17\n" +
    "		c3.6,3.6,5.6,8.1,7.4,12.6c0,0.7,0,1.3,0,2c-0.2,0.3-0.5,0.6-0.6,0.9c-9.7,22-25.6,37.9-47.6,47.6c-0.3,0.1-0.6,0.4-0.9,0.6\n" +
    "		C30.1,80,29.5,80,28.8,80z\"/>\n" +
    "	<path d=\"M10.8,0C15.4,4.3,20,8.7,25,13.5c0.7-0.8,1.8-2.3,3-3.5c0.5-0.5,1.4-0.8,2.1-0.6c0.4,0.1,0.7,1.2,0.7,1.8\n" +
    "		c-0.1,5.7-0.3,11.5-0.4,17.2c0,1.4-0.6,2-2,2c-5.7,0.1-11.5,0.3-17.2,0.4c-0.6,0-1.8-0.3-1.8-0.7c-0.1-0.6,0.2-1.6,0.6-2.1\n" +
    "		c1.1-1.3,2.5-2.4,3.3-3.3C8.8,20,4.4,15.4,0,10.8c0-0.5,0-1.1,0-1.6C3.1,6.1,6.1,3.1,9.2,0C9.7,0,10.3,0,10.8,0z\"/>\n" +
    "	<path d=\"M56.7,30.7c-0.2-0.1-0.3-0.1-0.3-0.1c-4-3.4-4-3.5-0.7-7.5c2.6-3.2,5.2-6.4,7.8-9.6c2.2-2.7,3.1-2.8,5.8-0.5\n" +
    "		c0.3,0.3,0.6,0.5,1,0.9C65.8,19.6,61.3,25.2,56.7,30.7z\"/>\n" +
    "	<path d=\"M13.9,70.4c-0.7-0.9-1.3-1.5-1.8-2.2c-1.1-1.4-1-2.8,0.4-3.9c4.2-3.5,8.4-6.9,12.7-10.3c1.2-1,2.4-1,3.5,0.3\n" +
    "		c0.7,0.7,1.5,1.3,2.4,2.2C25.2,61.2,19.7,65.8,13.9,70.4z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/calls/svg/outgoing-call-icon.svg",
    "<svg  x=\"0px\"\n" +
    "      y=\"0px\"\n" +
    "      class=\"calls-outcomming-call\"\n" +
    "	  viewBox=\"0 0 80 80\"\n" +
    "      xmlns=\"http://www.w3.org/2000/svg\">\n" +
    "<g>\n" +
    "	<path d=\"M28.8,80c-3.6-1.9-7.3-3.8-10.9-5.7c-0.6-0.3-1.1-0.9-1.8-1.6C21.9,68,27.5,63.5,33,58.9\n" +
    "		c0.2,0.1,0.4,0.1,0.5,0.1c3.7,2.5,4.1,2.5,7.7-0.3c6.5-5.1,12.4-10.9,17.5-17.5c2.9-3.7,3-4,0.2-8.2c4.5-5.6,9.1-11.2,13.8-17\n" +
    "		c3.6,3.6,5.6,8.1,7.4,12.6c0,0.7,0,1.3,0,2c-0.2,0.3-0.5,0.6-0.6,0.9c-9.7,22-25.6,37.9-47.6,47.6c-0.3,0.1-0.6,0.4-0.9,0.6\n" +
    "		C30.1,80,29.5,80,28.8,80z\"/>\n" +
    "	<path d=\"M21,31.8c-4.6-4.3-9.2-8.7-14.2-13.5c-0.7,0.8-1.8,2.3-3,3.5c-0.5,0.5-1.4,0.8-2.1,0.6\n" +
    "		C1.3,22.4,1,21.3,1,20.6C1.1,14.9,1.3,9.2,1.4,3.4c0-1.4,0.6-2,2-2C9.2,1.3,14.9,1.1,20.6,1c0.6,0,1.8,0.3,1.8,0.7\n" +
    "		c0.1,0.6-0.2,1.6-0.6,2.1C20.7,5,19.4,6.2,18.5,7c4.5,4.8,8.9,9.4,13.3,14c0,0.5,0,1.1,0,1.6c-3.1,3.1-6.1,6.1-9.2,9.2\n" +
    "		C22.1,31.8,21.6,31.8,21,31.8z\"/>\n" +
    "	<path d=\"M56.7,30.7c-0.2-0.1-0.3-0.1-0.3-0.1c-4-3.4-4-3.5-0.7-7.5c2.6-3.2,5.2-6.4,7.8-9.6\n" +
    "		c2.2-2.7,3.1-2.8,5.8-0.5c0.3,0.3,0.6,0.5,1,0.9C65.8,19.6,61.3,25.2,56.7,30.7z\"/>\n" +
    "	<path d=\"M13.9,70.4c-0.7-0.9-1.3-1.5-1.8-2.2c-1.1-1.4-1-2.8,0.4-3.9c4.2-3.5,8.4-6.9,12.7-10.3\n" +
    "		c1.2-1,2.4-1,3.5,0.3c0.7,0.7,1.5,1.3,2.4,2.2C25.2,61.2,19.7,65.8,13.9,70.4z\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);
