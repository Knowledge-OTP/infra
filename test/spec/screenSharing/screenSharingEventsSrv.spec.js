describe('testing service "ScreenSharingSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.screenSharing', 'htmlTemplates', 'storage.mock', 'testUtility', 'user.mock', 'env.mock'));

    var _deps = {};
    beforeEach(inject(function ($injector) {
        var depsToInject = [
            'TestUtilitySrv',
            'InfraConfigSrv',
            'UserProfileService',
            'ENV',
            '$rootScope',
            'ScreenSharingStatusEnum',
            'ScreenSharingSrv',
            'UserScreenSharingStateEnum',
            'ScreenSharingUiSrv',
            '$q'
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.GlobalStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getGlobalStorage, _deps.InfraConfigSrv)();
    }));

    xit('when user want to share his screen with me then screen sharing status should be changed to confirmed once i accept', function(){
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        var dataToUpdate = {};

        var myUSerScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + myUid + '/screenSharing/active';
        dataToUpdate[myUSerScreenSharingRequestsPath] = {};
        dataToUpdate[myUSerScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var otherUserScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + otherUid + '/screenSharing/active';
        dataToUpdate[otherUserScreenSharingRequestsPath] = {};
        dataToUpdate[otherUserScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var screenSharingDataPath = 'screenSharing/' + screenSharingDataGuid;
        var viewerId = myUid;
        var sharerId = otherUid;
        dataToUpdate[screenSharingDataPath] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
            viewerPath: myUSerScreenSharingRequestsPath,
            sharerPath: otherUserScreenSharingRequestsPath
        };

        spyOn(_deps.ScreenSharingUiSrv, 'showScreenSharingConfirmationPopUp').and.returnValue(_deps.$q.resolve());

        _deps.GlobalStorage.adapter.update(dataToUpdate);
        _deps.$rootScope.$digest();

        expect(_deps.GlobalStorage.adapter.__db.screenSharing[screenSharingDataGuid].status).toBe(_deps.ScreenSharingStatusEnum.CONFIRMED.enum);
    });

    xit('when user want to share his screen with me then screen sharing status should be changed to ended once i reject', function(){
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        var dataToUpdate = {};

        var myUSerScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + myUid + '/screenSharing/active';
        dataToUpdate[myUSerScreenSharingRequestsPath] = {};
        dataToUpdate[myUSerScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var otherUserScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + otherUid + '/screenSharing/active';
        dataToUpdate[otherUserScreenSharingRequestsPath] = {};
        dataToUpdate[otherUserScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var screenSharingDataPath = 'screenSharing/' + screenSharingDataGuid;
        var viewerId = myUid;
        var sharerId = otherUid;
        dataToUpdate[screenSharingDataPath] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
            viewerPath: myUSerScreenSharingRequestsPath,
            sharerPath: otherUserScreenSharingRequestsPath
        };

        spyOn(_deps.ScreenSharingUiSrv, 'showScreenSharingConfirmationPopUp').and.returnValue(_deps.$q.reject());

        _deps.GlobalStorage.adapter.update(dataToUpdate);
        _deps.$rootScope.$digest();

        expect(_deps.GlobalStorage.adapter.__db.screenSharing[screenSharingDataGuid].status).toBe(_deps.ScreenSharingStatusEnum.ENDED.enum);
    });

    it('when i want to share my screen then listener should ignore the change event', function(){
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        var dataToUpdate = {};

        var myUSerScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + myUid + '/screenSharing/active';
        dataToUpdate[myUSerScreenSharingRequestsPath] = {};
        dataToUpdate[myUSerScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var otherUserScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + otherUid + '/screenSharing/active';
        dataToUpdate[otherUserScreenSharingRequestsPath] = {};
        dataToUpdate[otherUserScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var screenSharingDataPath = 'screenSharing/' + screenSharingDataGuid;
        var viewerId = otherUid;
        var sharerId = myUid;
        dataToUpdate[screenSharingDataPath] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
            viewerPath: myUSerScreenSharingRequestsPath,
            sharerPath: otherUserScreenSharingRequestsPath
        };

        //the pop up service works opposite, resolved when rejected
        spyOn(_deps.ScreenSharingUiSrv, 'showScreenSharingConfirmationPopUp').and.callThrough();
        spyOn(_deps.ScreenSharingSrv, 'confirmSharing');
        spyOn(_deps.ScreenSharingSrv, 'endSharing');

        _deps.GlobalStorage.adapter.update(dataToUpdate);
        _deps.$rootScope.$digest();

        expect(_deps.ScreenSharingUiSrv.showScreenSharingConfirmationPopUp).not.toHaveBeenCalled();
        expect(_deps.ScreenSharingSrv.confirmSharing).not.toHaveBeenCalled();
        expect(_deps.ScreenSharingSrv.endSharing).not.toHaveBeenCalled();
    });

    it('when i want to view other user screen then listener should ignore the change event', function(){
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        var dataToUpdate = {};

        var myUSerScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + myUid + '/screenSharing/active';
        dataToUpdate[myUSerScreenSharingRequestsPath] = {};
        dataToUpdate[myUSerScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var otherUserScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + otherUid + '/screenSharing/active';
        dataToUpdate[otherUserScreenSharingRequestsPath] = {};
        dataToUpdate[otherUserScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var screenSharingDataPath = 'screenSharing/' + screenSharingDataGuid;
        var viewerId = myUid;
        var sharerId = otherUid;
        dataToUpdate[screenSharingDataPath] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_SHARER.enum,
            viewerPath: myUSerScreenSharingRequestsPath,
            sharerPath: otherUserScreenSharingRequestsPath
        };

        //the pop up service works opposite, resolved when rejected
        spyOn(_deps.ScreenSharingUiSrv, 'showScreenSharingConfirmationPopUp').and.callThrough();
        spyOn(_deps.ScreenSharingSrv, 'confirmSharing');
        spyOn(_deps.ScreenSharingSrv, 'endSharing');

        _deps.GlobalStorage.adapter.update(dataToUpdate);
        _deps.$rootScope.$digest();

        expect(_deps.ScreenSharingUiSrv.showScreenSharingConfirmationPopUp).not.toHaveBeenCalled();
        expect(_deps.ScreenSharingSrv.confirmSharing).not.toHaveBeenCalled();
        expect(_deps.ScreenSharingSrv.endSharing).not.toHaveBeenCalled();
    });

    it('when user want to view other user screen then screen sharing status should be changed to confirmed by the other user', function(){
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        var dataToUpdate = {};

        var myUSerScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + myUid + '/screenSharing/active';
        dataToUpdate[myUSerScreenSharingRequestsPath] = {};
        dataToUpdate[myUSerScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var otherUserScreenSharingRequestsPath = _deps.ENV.studentAppName + '/users/' + otherUid + '/screenSharing/active';
        dataToUpdate[otherUserScreenSharingRequestsPath] = {};
        dataToUpdate[otherUserScreenSharingRequestsPath][screenSharingDataGuid] = true;

        var screenSharingDataPath = 'screenSharing/' + screenSharingDataGuid;
        var viewerId = otherUid;
        var sharerId = myUid;
        dataToUpdate[screenSharingDataPath] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_SHARER.enum,
            viewerPath: myUSerScreenSharingRequestsPath,
            sharerPath: otherUserScreenSharingRequestsPath
        };

        _deps.GlobalStorage.adapter.update(dataToUpdate);
        _deps.$rootScope.$digest();

        expect(_deps.GlobalStorage.adapter.__db.screenSharing[screenSharingDataGuid].status).toBe(_deps.ScreenSharingStatusEnum.CONFIRMED.enum);
    });

    it('when user start sharing his screen then activate ScreenSharingUiSrv.activateSharing should be called with sharing status', function(){
        var currUid = _deps.UserProfileService.__currUserId;
        var screenSharingDataGuid = '123456789-data-guid';
        var sharerId = currUid;
        var viewerId = '123456789-viewer-id';
        var screenSharingPath = 'screenSharing/' + screenSharingDataGuid;
        var userScreenSharingDataPath = _deps.ENV.firebaseAppScopeName + '/users/' + currUid  + '/screenSharing/active';

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

        spyOn(_deps.ScreenSharingSrv, '_userScreenSharingStateChanged');

        screenSharingData.status = _deps.ScreenSharingStatusEnum.CONFIRMED.enum;
        _deps.GlobalStorage.adapter.update(screenSharingPath, screenSharingData);
        _deps.$rootScope.$digest();

        expect(_deps.ScreenSharingSrv._userScreenSharingStateChanged).toHaveBeenCalledWith(_deps.UserScreenSharingStateEnum.SHARER.enum, screenSharingData);
    });
});
