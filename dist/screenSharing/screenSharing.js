(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing', [
        'ngAnimate',
        'pascalprecht.translate',
        'znk.infra.user',
        'znk.infra.utility',
        'znk.infra.config',
        'znk.infra.enum',
        'znk.infra.svgIcon',
        'znk.infra.popUp',
        'znk.infra.general'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing')
        .config(["SvgIconSrvProvider", function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'screen-sharing-eye': 'components/screenSharing/svg/eye-icon.svg',
                'screen-sharing-close': 'components/screenSharing/svg/close-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').component('screenSharing', {
            templateUrl: 'components/screenSharing/directives/screenSharing/screenSharing.template.html',
            bindings: {
                userSharingState: '<',
                onClose: '&'
            },
            controller: ["UserScreenSharingStateEnum", "$log", "ScreenSharingUiSrv", function (UserScreenSharingStateEnum, $log, ScreenSharingUiSrv) {
                'ngInject';

                var ctrl = this;

                function _addViewerExternalTemplate(){
                    ctrl.viewerTemplate = ScreenSharingUiSrv.__getScreenSharingViewerTemplate();

                }

                this.$onInit = function () {
                    switch(this.userSharingState){
                        case UserScreenSharingStateEnum.VIEWER.enum:
                            this.sharingStateCls = 'viewer-state';
                            _addViewerExternalTemplate();
                            break;
                        case UserScreenSharingStateEnum.SHARER.enum:
                            this.sharingStateCls = 'sharer-state';
                            break;
                        default:
                            $log.error('screenSharingComponent: invalid state was provided');
                    }
                };
            }]
        }
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').factory('ScreenSharingStatusEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['PENDING_VIEWER', 1, 'pending viewer'],
                ['PENDING_SHARER', 2, 'pending sharer'],
                ['CONFIRMED', 3, 'confirmed'],
                ['ENDED', 4, 'ended']
            ]);
        }]
    );
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').factory('UserScreenSharingStateEnum',
        ["EnumSrv", function (EnumSrv) {
            'ngInject';

            return new EnumSrv.BaseEnum([
                ['NONE', 1, 'none'],
                ['VIEWER', 2, 'viewer'],
                ['SHARER', 3, 'sharer']
            ]);
        }]
    );
})(angular);


(function(){
    'use strict';
    
    angular.module('znk.infra.screenSharing').run(
        ["ScreenSharingEventsSrv", function(ScreenSharingEventsSrv){
            'ngInject';

            ScreenSharingEventsSrv.activate();
        }]
    );
})();

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing')
        .run(["$timeout", "$translatePartialLoader", function($timeout, $translatePartialLoader){
            'ngInject';
            //must be wrapped in timeout because the parting adding cannot be made directly in a run block
            $timeout(function(){
                $translatePartialLoader.addPart('screenSharing');
            });
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingDataGetterSrv',
        ["InfraConfigSrv", "$q", "ENV", "UserProfileService", function (InfraConfigSrv, $q, ENV, UserProfileService) {
            'ngInject';

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            this.getScreenSharingDataPath = function (guid) {
                var SCREEN_SHARING_ROOT_PATH = 'screenSharing';
                return SCREEN_SHARING_ROOT_PATH + '/' + guid;
            };

            this.getUserScreenSharingRequestsPath  = function (userData) {
                var appName = userData.isTeacher ? ENV.dashboardAppName : ENV.studentAppName;
                var USER_DATA_PATH = appName  + '/users/' + userData.uid;
                return USER_DATA_PATH + '/screenSharing';
            };

            this.getScreenSharingData = function (screenSharingGuid) {
                var screenSharingDataPath = this.getScreenSharingDataPath(screenSharingGuid);
                return _getStorage().then(function (storage) {
                    return storage.getAndBindToServer(screenSharingDataPath);
                });
            };

            this.getCurrUserScreenSharingRequests = function(){
                return UserProfileService.getCurrUserId().then(function(currUid){
                    return _getStorage().then(function(storage){
                        var currUserScreenSharingDataPath = ENV.firebaseAppScopeName + '/users/' + currUid + '/screenSharing';
                        return storage.get(currUserScreenSharingDataPath);
                    });
                });
            };

            this.getCurrUserScreenSharingData = function () {
                var self = this;
                return this.getCurrUserScreenSharingRequests().then(function(currUserScreenSharingRequests){
                    var screenSharingDataPromMap = {};
                    angular.forEach(currUserScreenSharingRequests, function(isActive, guid){
                        if(isActive){
                            screenSharingDataPromMap[guid] = self.getScreenSharingData(guid);
                        }
                    });

                    return $q.all(screenSharingDataPromMap);
                });
            };
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').provider('ScreenSharingEventsSrv', function () {
        var isEnabled = true;

        this.enabled = function (_isEnabled) {
            isEnabled = _isEnabled;
        };

        this.$get = ["UserProfileService", "InfraConfigSrv", "$q", "StorageSrv", "ENV", "ScreenSharingStatusEnum", "UserScreenSharingStateEnum", "ScreenSharingSrv", "$log", "ScreenSharingUiSrv", function (UserProfileService, InfraConfigSrv, $q, StorageSrv, ENV, ScreenSharingStatusEnum, UserScreenSharingStateEnum, ScreenSharingSrv, $log, ScreenSharingUiSrv) {
            'ngInject';

            var ScreenSharingEventsSrv = {};

            function _listenToScreenSharingData(guid) {
                var screenSharingStatusPath = 'screenSharing/' + guid;

                function _cb(screenSharingData) {
                    if (!screenSharingData) {
                        return;
                    }

                    UserProfileService.getCurrUserId().then(function (currUid) {
                        switch (screenSharingData.status) {
                            case ScreenSharingStatusEnum.PENDING_VIEWER.enum:
                                if (screenSharingData.viewerId !== currUid) {
                                    return;
                                }

                                ScreenSharingUiSrv.showScreenSharingConfirmationPopUp().then(function () {
                                    ScreenSharingSrv.confirmSharing(screenSharingData.guid);
                                }, function () {
                                    ScreenSharingSrv.endSharing(screenSharingData.guid);
                                });
                                break;
                            case ScreenSharingStatusEnum.PENDING_SHARER.enum:
                                if (screenSharingData.sharerId !== currUid) {
                                    return;
                                }

                                ScreenSharingSrv.confirmSharing(screenSharingData.guid);
                                break;
                            case ScreenSharingStatusEnum.CONFIRMED.enum:
                                var userScreenSharingState = UserScreenSharingStateEnum.NONE.enum;

                                if (screenSharingData.viewerId === currUid) {
                                    userScreenSharingState = UserScreenSharingStateEnum.VIEWER.enum;
                                }

                                if (screenSharingData.sharerId === currUid) {
                                    userScreenSharingState = UserScreenSharingStateEnum.SHARER.enum;
                                }

                                if (userScreenSharingState !== UserScreenSharingStateEnum.NONE.enum) {
                                    ScreenSharingSrv._userScreenSharingStateChanged(userScreenSharingState, screenSharingData);
                                }

                                break;
                            case ScreenSharingStatusEnum.ENDED.enum:
                                ScreenSharingSrv._userScreenSharingStateChanged(UserScreenSharingStateEnum.NONE.enum, screenSharingData);
                                break;
                            default:
                                $log.error('ScreenSharingEventsSrv: invalid status was received ' + screenSharingData.status);

                        }

                        ScreenSharingSrv._screenSharingDataChanged(screenSharingData);
                    });
                }

                InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                    globalStorage.onEvent(StorageSrv.EVENTS.VALUE, screenSharingStatusPath, _cb);
                });
            }

            function _startListening() {
                UserProfileService.getCurrUserId().then(function (currUid) {
                    InfraConfigSrv.getGlobalStorage().then(function (globalStorage) {
                        var appName = ENV.firebaseAppScopeName;
                        var userScreenSharingPath = appName + '/users/' + currUid + '/screenSharing';
                        globalStorage.onEvent(StorageSrv.EVENTS.VALUE, userScreenSharingPath, function (userScreenSharingData) {
                            if (userScreenSharingData) {
                                angular.forEach(userScreenSharingData, function (isActive, guid) {
                                    if(isActive){
                                        _listenToScreenSharingData(guid);
                                    }
                                });
                            }
                        });
                    });
                });
            }

            ScreenSharingEventsSrv.activate = function () {
                if (isEnabled) {
                    _startListening();
                }
            };

            return ScreenSharingEventsSrv;
        }];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').service('ScreenSharingSrv',
        ["UserProfileService", "InfraConfigSrv", "$q", "UtilitySrv", "ScreenSharingDataGetterSrv", "ScreenSharingStatusEnum", "ENV", "$log", "UserScreenSharingStateEnum", "ScreenSharingUiSrv", function (UserProfileService, InfraConfigSrv, $q, UtilitySrv, ScreenSharingDataGetterSrv, ScreenSharingStatusEnum, ENV, $log, UserScreenSharingStateEnum, ScreenSharingUiSrv) {
            'ngInject';

            var _this = this;
            var currActiveScreenSharingData = null;
            var currUserScreenSharingState = UserScreenSharingStateEnum.NONE.enum;
            var registeredCbToActiveScreenSharingDataChanges = [];

            var isTeacherApp = (ENV.appContext.toLowerCase()) === 'dashboard';//  to lower case was added in order to

            function _getStorage() {
                return InfraConfigSrv.getGlobalStorage();
            }

            function _getScreenSharingInitStatusByInitiator(initiator) {
                var initiatorToInitStatusMap = {};
                initiatorToInitStatusMap[UserScreenSharingStateEnum.VIEWER.enum] = ScreenSharingStatusEnum.PENDING_SHARER.enum;
                initiatorToInitStatusMap[UserScreenSharingStateEnum.SHARER.enum] = ScreenSharingStatusEnum.PENDING_VIEWER.enum;

                return initiatorToInitStatusMap[initiator] || null;
            }

            function _isScreenSharingAlreadyInitiated(sharerId, viewerId) {
                return ScreenSharingDataGetterSrv.getCurrUserScreenSharingData().then(function (screenSharingDataMap) {
                    var isInitiated = false;
                    var screenSharingDataMapKeys = Object.keys(screenSharingDataMap);
                    for (var i in screenSharingDataMapKeys) {
                        var screenSharingDataKey = screenSharingDataMapKeys[i];
                        var screenSharingData = screenSharingDataMap[screenSharingDataKey];

                        var isEnded = screenSharingData.status === ScreenSharingStatusEnum.ENDED.enum;
                        if(isEnded){
                            _this.endSharing(screenSharingData.guid);
                            continue;
                        }

                        isInitiated = screenSharingData.sharerId === sharerId && screenSharingData.viewerId === viewerId;
                        if (isInitiated) {
                            break;
                        }
                    }
                    return isInitiated;
                });
            }

            function _initiateScreenSharing(sharerData, viewerData, initiator) {
                var errMsg;

                if (angular.isUndefined(viewerData.isTeacher) || angular.isUndefined(sharerData.isTeacher)) {
                    errMsg = 'ScreenSharingSrv: isTeacher property was not provided!!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                if(currUserScreenSharingState !== UserScreenSharingStateEnum.NONE.enum){
                    errMsg = 'ScreenSharingSrv: screen sharing is already active!!!';
                    $log.debug(errMsg);
                    return $q.reject(errMsg);
                }

                var initScreenSharingStatus = _getScreenSharingInitStatusByInitiator(initiator);
                if (!initScreenSharingStatus) {
                    errMsg = 'ScreenSharingSrv: initiator was not provided';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }

                return _isScreenSharingAlreadyInitiated(sharerData.uid, viewerData.uid).then(function (isInitiated) {
                    if (isInitiated) {
                        var errMsg = 'ScreenSharingSrv: screen sharing was already initiated';
                        $log.error(errMsg);
                        return $q.reject(errMsg);
                    }


                    var getDataPromMap = {};

                    getDataPromMap.currUserScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();

                    var newScreenSharingGuid = UtilitySrv.general.createGuid();
                    getDataPromMap.newScreenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(newScreenSharingGuid);

                    getDataPromMap.currUid = UserProfileService.getCurrUserId();

                    return $q.all(getDataPromMap).then(function (data) {
                        var dataToSave = {};

                        var viewerPath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(viewerData, newScreenSharingGuid);
                        var sharerPath = ScreenSharingDataGetterSrv.getUserScreenSharingRequestsPath(sharerData, newScreenSharingGuid);
                        var newScreenSharingData = {
                            guid: newScreenSharingGuid,
                            sharerId: sharerData.uid,
                            viewerId: viewerData.uid,
                            status: initScreenSharingStatus,
                            viewerPath: viewerPath,
                            sharerPath: sharerPath
                        };
                        angular.extend(data.newScreenSharingData, newScreenSharingData);

                        dataToSave[data.newScreenSharingData.$$path] = data.newScreenSharingData;
                        //current user screen sharing requests object update
                        data.currUserScreenSharingRequests[newScreenSharingGuid] = true;
                        dataToSave[data.currUserScreenSharingRequests.$$path] = data.currUserScreenSharingRequests;
                        //other user screen sharing requests object update
                        var otherUserScreenSharingPath = viewerData.uid === data.currUid ? sharerPath: viewerPath;
                        var viewerScreenSharingDataGuidPath = otherUserScreenSharingPath + '/' + newScreenSharingGuid;
                        dataToSave[viewerScreenSharingDataGuidPath] = true;

                        return _getStorage().then(function (StudentStorage) {
                            return StudentStorage.update(dataToSave);
                        });
                    });

                });
            }

            function _cleanRegisteredCbToActiveScreenSharingData(){
                currActiveScreenSharingData = null;
                registeredCbToActiveScreenSharingDataChanges = [];
            }

            this.shareMyScreen = function (viewerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var sharerData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.SHARER.enum);
                });
            };

            this.viewOtherUserScreen = function (sharerData) {
                return UserProfileService.getCurrUserId().then(function (currUserId) {
                    var viewerData = {
                        uid: currUserId,
                        isTeacher: isTeacherApp
                    };
                    return _initiateScreenSharing(sharerData, viewerData, UserScreenSharingStateEnum.VIEWER.enum);
                });
            };

            this.confirmSharing = function (screenSharingDataGuid) {
                if(currUserScreenSharingState !== UserScreenSharingStateEnum.NONE.enum){
                    var errMsg = 'ScreenSharingSrv: screen sharing is already active!!!';
                    $log.debug(errMsg);
                    return $q.reject(errMsg);
                }

                return ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid).then(function (screenSharingData) {
                    screenSharingData.status = ScreenSharingStatusEnum.CONFIRMED.enum;
                    return screenSharingData.$save();
                });
            };

            this.endSharing = function (screenSharingDataGuid) {
                var getDataPromMap = {};
                getDataPromMap.screenSharingData = ScreenSharingDataGetterSrv.getScreenSharingData(screenSharingDataGuid);
                getDataPromMap.currUid = UserProfileService.getCurrUserId();
                getDataPromMap.currUidScreenSharingRequests = ScreenSharingDataGetterSrv.getCurrUserScreenSharingRequests();
                getDataPromMap.storage = _getStorage();
                return $q.all(getDataPromMap).then(function (data) {
                    var dataToSave = {};

                    data.screenSharingData.status = ScreenSharingStatusEnum.ENDED.enum;
                    dataToSave [data.screenSharingData.$$path] = data.screenSharingData;

                    data.currUidScreenSharingRequests[data.screenSharingData.guid] = false;
                    dataToSave[data.currUidScreenSharingRequests.$$path] = data.currUidScreenSharingRequests;

                    var otherUserScreenSharingRequestPath;
                    if(data.screenSharingData.viewerId !== data.currUid){
                        otherUserScreenSharingRequestPath = data.screenSharingData.viewerPath;
                    }else{
                        otherUserScreenSharingRequestPath = data.screenSharingData.sharerPath;
                    }
                    otherUserScreenSharingRequestPath += '/' + data.screenSharingData.guid;
                    dataToSave[otherUserScreenSharingRequestPath] = false;

                    return data.storage.update(dataToSave);
                });
            };

            this.registerToActiveScreenSharingDataChanges = function(cb){
                if(currActiveScreenSharingData){
                    registeredCbToActiveScreenSharingDataChanges.push(cb);
                    cb(currActiveScreenSharingData);
                }
            };

            this._userScreenSharingStateChanged = function (newUserScreenSharingState, screenSharingData) {
                if(!newUserScreenSharingState || (currUserScreenSharingState === newUserScreenSharingState)){
                    return;
                }

                currUserScreenSharingState = newUserScreenSharingState;

                var isViewerState = newUserScreenSharingState === UserScreenSharingStateEnum.VIEWER.enum;
                var isSharerState = newUserScreenSharingState === UserScreenSharingStateEnum.SHARER.enum;
                if(isSharerState || isViewerState){
                    currActiveScreenSharingData = screenSharingData;
                    ScreenSharingUiSrv.activateScreenSharing(newUserScreenSharingState).then(function(){
                        _this.endSharing(screenSharingData.guid);
                    });
                }else{
                    _cleanRegisteredCbToActiveScreenSharingData();
                    ScreenSharingUiSrv.endScreenSharing();
                }
            };

            this._screenSharingDataChanged = function(newScreenSharingData){
                if(!currActiveScreenSharingData || currActiveScreenSharingData.guid !== newScreenSharingData.guid){
                    return;
                }

                currActiveScreenSharingData = newScreenSharingData;
                registeredCbToActiveScreenSharingDataChanges.forEach(function(cb){
                    cb(currActiveScreenSharingData);
                });
            };
        }]
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.screenSharing').provider('ScreenSharingUiSrv',function(){
        var screenSharingViewerTemplate;
        this.setScreenSharingViewerTemplate = function(template){
            screenSharingViewerTemplate = template;
        };

        this.$get = ["$rootScope", "$timeout", "$compile", "$animate", "PopUpSrv", "$translate", "$q", "$log", function ($rootScope, $timeout, $compile, $animate, PopUpSrv, $translate, $q, $log) {
            'ngInject';

            var childScope, screenSharingPhElement, readyProm;
            var ScreenSharingUiSrv = {};

            function _init() {
                var bodyElement = angular.element(document.body);

                screenSharingPhElement = angular.element('<div class="screen-sharing-ph"></div>');

                bodyElement.append(screenSharingPhElement);
            }

            function _endScreenSharing() {
                if(childScope){
                    childScope.$destroy();
                }


                if(screenSharingPhElement){
                    var hasContents = !!screenSharingPhElement.contents().length;
                    if(hasContents){
                        $animate.leave(screenSharingPhElement.contents());
                    }
                }
            }

            function _activateScreenSharing(userSharingState) {
                _endScreenSharing();

                var defer = $q.defer();

                readyProm.then(function(){
                    childScope = $rootScope.$new(true);
                    childScope.d = {
                        userSharingState: userSharingState,
                        onClose: function(){
                            defer.resolve('closed');
                        }
                    };

                    var screenSharingHtmlTemplate =
                        '<div class="show-hide-animation">' +
                        '<screen-sharing user-sharing-state="d.userSharingState" ' +
                        'on-close="d.onClose()">' +
                        '</screen-sharing>' +
                        '</div>';
                    var screenSharingElement = angular.element(screenSharingHtmlTemplate);
                    screenSharingPhElement.append(screenSharingElement);
                    $animate.enter(screenSharingElement[0], screenSharingPhElement[0]);
                    $compile(screenSharingElement)(childScope);
                });

                return defer.promise;
            }

            ScreenSharingUiSrv.activateScreenSharing = function (userSharingState) {
                return _activateScreenSharing(userSharingState);
            };

            ScreenSharingUiSrv.endScreenSharing = function () {
                _endScreenSharing();
            };

            ScreenSharingUiSrv.showScreenSharingConfirmationPopUp = function(){
                var translationsPromMap = {};
                translationsPromMap.title = $translate('SCREEN_SHARING.SHARE_SCREEN_REQUEST');
                translationsPromMap.content= $translate('SCREEN_SHARING.WANT_TO_SHARE',{
                    name: "Student/Teacher"
                });
                translationsPromMap.acceptBtnTitle = $translate('SCREEN_SHARING.REJECT');
                translationsPromMap.cancelBtnTitle = $translate('SCREEN_SHARING.ACCEPT');
                return $q.all(translationsPromMap).then(function(translations){
                    var popUpInstance = PopUpSrv.warning(
                        translations.title,
                        translations.content,
                        translations.acceptBtnTitle,
                        translations.cancelBtnTitle
                    );
                    return popUpInstance.promise.then(function(res){
                        return $q.reject(res);
                    },function(res){
                        return $q.resolve(res);
                    });
                },function(err){
                    $log.error('ScreenSharingUiSrv: translate failure' + err);
                    return $q.reject(err);
                });
            };

            ScreenSharingUiSrv.__getScreenSharingViewerTemplate = function(){
                if(!screenSharingViewerTemplate){
                    $log.error('ScreenSharingUiSrv: viewer template was not set');
                    return null;
                }

                return screenSharingViewerTemplate;
            };
            //was wrapped with timeout since angular will compile the dom after this service initialization
            readyProm = $timeout(function(){
                _init();
            });

            return ScreenSharingUiSrv;
        }];
    });
})(angular);

angular.module('znk.infra.screenSharing').run(['$templateCache', function($templateCache) {
  $templateCache.put("components/screenSharing/directives/screenSharing/screenSharing.template.html",
    "<div ng-switch=\"$ctrl.userSharingState\"\n" +
    "     ng-class=\"$ctrl.sharingStateCls\">\n" +
    "    <div ng-switch-when=\"2\"\n" +
    "         class=\"viewer-state-container\">\n" +
    "        <div compile=\"$ctrl.viewerTemplate\"></div>\n" +
    "    </div>\n" +
    "    <div ng-switch-when=\"3\"\n" +
    "         class=\"sharer-state-container\">\n" +
    "        <div class=\"square-side top\"></div>\n" +
    "        <div class=\"square-side right\"></div>\n" +
    "        <div class=\"square-side bottom\"></div>\n" +
    "        <div class=\"square-side left\"></div>\n" +
    "        <div class=\"eye-wrapper\">\n" +
    "            <svg-icon name=\"screen-sharing-eye\"></svg-icon>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"close-icon-wrapper\" ng-click=\"$ctrl.onClose()\">\n" +
    "        <svg-icon name=\"screen-sharing-close\"></svg-icon>\n" +
    "    </div>\n" +
    "</div>\n" +
    "");
  $templateCache.put("components/screenSharing/svg/close-icon.svg",
    "<svg\n" +
    "    x=\"0px\"\n" +
    "    y=\"0px\"\n" +
    "    class=\"screen-sharing-close\"\n" +
    "    viewBox=\"-596.6 492.3 133.2 133.5\">\n" +
    "    <style>\n" +
    "        .screen-sharing-close{\n" +
    "            width: 13px;\n" +
    "            stroke: white;\n" +
    "            stroke-width: 10px;\n" +
    "        }\n" +
    "    </style>\n" +
    "<path class=\"st0\"/>\n" +
    "<g>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"496.5\" x2=\"-467.4\" y2=\"621.8\"/>\n" +
    "	<line class=\"st1\" x1=\"-592.6\" y1=\"621.5\" x2=\"-467.4\" y2=\"496.3\"/>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
  $templateCache.put("components/screenSharing/svg/eye-icon.svg",
    "<svg version=\"1.1\"\n" +
    "     xmlns=\"http://www.w3.org/2000/svg\"\n" +
    "     xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n" +
    "     x=\"0px\"\n" +
    "     y=\"0px\"\n" +
    "	 viewBox=\"0 0 190.3 90.3\"\n" +
    "     xml:space=\"preserve\"\n" +
    "     class=\"screen-sharing-eye\">\n" +
    "    <style>\n" +
    "        .screen-sharing-eye{\n" +
    "            width: 25px;\n" +
    "            fill: white;\n" +
    "        }\n" +
    "    </style>\n" +
    "<g>\n" +
    "	<g>\n" +
    "		<path d=\"M190.3,45.3c-10.1,10.2-21.1,18.6-33.1,25.8c-21.1,12.7-43.5,20.5-68.6,19c-13.8-0.9-26.8-4.7-39.3-10.4\n" +
    "			c-17.4-8-32.9-18.8-46.8-31.9C1.7,47,1,46.1,0,45c10-10.1,21.1-18.6,33.1-25.8c21.2-12.8,43.9-20.7,69.1-19\n" +
    "			c13.8,0.9,26.8,4.8,39.2,10.6c16.8,7.7,31.7,18.1,45.3,30.7C187.8,42.6,188.9,43.8,190.3,45.3z M95.1,12.7\n" +
    "			c-18.2,0-32.4,14.4-32.4,32.7c0.1,17.9,14.4,32.1,32.5,32.1c17.9,0,32.4-14.4,32.6-32.2C128,27.4,113.2,12.7,95.1,12.7z\"/>\n" +
    "		<path d=\"M101.2,23.5c-2.2,4.7-2.4,9,1.6,12.5c4.2,3.6,8.5,2.9,12.6-0.4c5,8.6,2.7,20.1-5.5,27.1c-8.5,7.3-21,7.3-29.7,0\n" +
    "			c-8.4-7-10.4-19.4-5-29C80.2,24.9,92.5,19.7,101.2,23.5z\"/>\n" +
    "	</g>\n" +
    "</g>\n" +
    "</svg>\n" +
    "");
}]);
