(function (angular) {
    'use strict';

    angular.module('znk.infra.calls').service('CallsDataGetterSrv',
        function (InfraConfigSrv, $q, ENV, UserProfileService) {
            'ngInject';

            //function _getStorage() {
            //    return InfraConfigSrv.getGlobalStorage();
            //}
            //
            //this.getScreenSharingDataPath = function (guid) {
            //    var SCREEN_SHARING_ROOT_PATH = 'calls';
            //    return SCREEN_SHARING_ROOT_PATH + '/' + guid;
            //};
            //
            //this.getUserScreenSharingRequestsPath  = function (userData) {
            //    var appName = userData.isTeacher ? ENV.dashboardAppName : ENV.studentAppName;
            //    var USER_DATA_PATH = appName  + '/users/' + userData.uid;
            //    return USER_DATA_PATH + '/calls';
            //};
            //
            //this.getScreenSharingData = function (screenSharingGuid) {
            //    var screenSharingDataPath = this.getScreenSharingDataPath(screenSharingGuid);
            //    return _getStorage().then(function (storage) {
            //        return storage.get(screenSharingDataPath);
            //    });
            //};
            //
            //this.getCurrUserScreenSharingRequests = function(){
            //    return UserProfileService.getCurrUserId().then(function(currUid){
            //        return _getStorage().then(function(storage){
            //            var currUserScreenSharingDataPath = ENV.firebaseAppScopeName + '/users/' + currUid + '/calls';
            //            return storage.get(currUserScreenSharingDataPath);
            //        });
            //    });
            //};
            //
            //this.getCurrUserScreenSharingData = function () {
            //    var self = this;
            //    return this.getCurrUserScreenSharingRequests().then(function(currUserScreenSharingRequests){
            //        var screenSharingDataPromMap = {};
            //        angular.forEach(currUserScreenSharingRequests, function(isActive, guid){
            //            if(isActive){
            //                screenSharingDataPromMap[guid] = self.getScreenSharingData(guid);
            //            }
            //        });
            //
            //        return $q.all(screenSharingDataPromMap);
            //    });
            //};
        }
    );
})(angular);
