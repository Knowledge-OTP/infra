xdescribe('testing service "ScreenSharingSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.screenSharing', 'htmlTemplates', 'storage.mock', 'testUtility', 'user.mock', 'env.mock'));

    var _deps = {};
    beforeEach(inject(function ($injector) {
        var depsToInject = [
            'ScreenSharingSrv',
            'UserProfileService',
            'InfraConfigSrv',
            'ScreenSharingStatusEnum',
            'TestUtilitySrv',
            'UtilitySrv',
            'ENV',
            'ScreenSharingUiSrv',
            'UserScreenSharingStateEnum',
            '$rootScope'
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.GlobalStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getGlobalStorage, _deps.InfraConfigSrv)();
    }));

    it('when user start sharing his screen then activate ScreenSharingUiSrv.activateSharing should be called with sharing status', function(){
        var currUid = _deps.UserProfileService.__currUserId;
        var screenSharingDataGuid = '123456789-data-guid';
        var sharerId = currUid;
        var viewerId = '123456789-viewer-id';
        var screenSharingPath = 'screenSharing/' + screenSharingDataGuid;
        var userScreenSharingDataPath = _deps.ENV.firebaseAppScopeName + '/users/' + currUid  + '/screenSharing';

        var userScreenSharingData = {};
        userScreenSharingData[screenSharingDataGuid] = true;
        _deps.GlobalStorage.adapter.update(userScreenSharingDataPath, userScreenSharingData);
        _deps.$rootScope.$digest();

        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum
        };
        _deps.GlobalStorage.adapter.update(screenSharingPath, screenSharingData);

        spyOn(_deps.ScreenSharingSrv, '_setUserScreenSharingState');

        screenSharingData.status = _deps.ScreenSharingStatusEnum.CONFIRMED.enum;
        _deps.GlobalStorage.adapter.update(screenSharingPath, screenSharingData);
        _deps.$rootScope.$digest();

        expect(_deps.ScreenSharingSrv._setUserScreenSharingState).toHaveBeenCalledWith(_deps.UserScreenSharingStateEnum.SHARER.enum);
    });
});
