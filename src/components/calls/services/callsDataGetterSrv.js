(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsDataGetterSrv',
        function (InfraConfigSrv, $q, ENV, UserProfileService, $log) {
            'ngInject';

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
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
                var callsDataPath = this.getCallsDataPath(callsGuid);
                return _getStorage().then(function (storage) {
                    return storage.getAndBindToServer(callsDataPath);
                }).catch(function(err){
                    $log.error('Error in _getStorage', err);
                });
            };

            this.getCurrUserCallsRequests = function(){
                return UserProfileService.getCurrUserId().then(function(currUid){
                    return _getStorage().then(function(storage){
                        var currUserCallsDataPath = ENV.firebaseAppScopeName + '/users/' + currUid + '/calls';
                        return storage.get(currUserCallsDataPath);
                    }).catch(function(err){
                        $log.error('Error in _getStorage', err);
                    });
                }).catch(function(err){
                    $log.error('Error in UserProfileService.getCurrUserId', err);
                });
            };

            this.getCurrUserCallsData = function () {
                var self = this;
                return this.getCurrUserCallsRequests().then(function(currUserCallsRequests){
                    var callsDataPromMap = {};
                    angular.forEach(currUserCallsRequests, function(isActive, guid){
                        if(isActive) {
                            callsDataPromMap[guid] = self.getCallsData(guid);
                        }
                    });

                    return $q.all(callsDataPromMap);
                });
            };
        }
    );
})(angular);
