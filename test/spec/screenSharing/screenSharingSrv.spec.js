describe('testing service "ScreenSharingSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.screenSharing', 'htmlTemplates', 'storage.mock', 'testUtility', 'user.mock', 'env.mock'));

    var _deps = {};
    beforeEach(inject(function ($injector) {
        var depsToInject = [
            'ScreenSharingSrv',
            'UserProfileService',
            'testStorage',
            'ScreenSharingStatusEnum',
            'TestUtilitySrv',
            'UtilitySrv'
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.ScreenSharingSrv = _deps.TestUtilitySrv.general.convertAllAsyncToSync(_deps.ScreenSharingSrv);
    }));

    it('when requesting to share my screen then root shareScreen object and sharer and viewer shareScreen objects should' +
        ' be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var viewerId = '11223344';
        var sharerId = _deps.UserProfileService.__currUserId;

        _deps.ScreenSharingSrv.shareMyScreen(viewerId);

        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
                guid: screenSharingDataGuid
            }
        };
        expect(_deps.testStorage.db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedUsersObject = {};
        expectedUsersObject[_deps.UserProfileService.__currUserId] = {
            screenSharing: {
                guid: true
            }
        };
        expectedUsersObject[viewerId] = {
            screenSharing: {
                guid: true
            }
        };
        expect(_deps.testStorage.db.users).toEqual(jasmine.objectContaining(expectedUsersObject));
    });

    it('when requesting to view other user screen then root shareScreen object and sharer and viewer shareScreen objects should' +
        ' be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var sharerId = '11223344';
        var viewerId = _deps.UserProfileService.__currUserId;

        _deps.ScreenSharingSrv.viewOtherUserScreen(sharerId);

        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_SHARER.enum,
                guid: screenSharingDataGuid
            }
        };
        expect(_deps.testStorage.db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedUsersObject = {};
        expectedUsersObject[viewerId] = {
            screenSharing: {
                guid: true
            }
        };
        expectedUsersObject[sharerId] = {
            screenSharing: {
                guid: true
            }
        };
        expect(_deps.testStorage.db.users).toEqual(jasmine.objectContaining(expectedUsersObject));
    });

    it('given user sharing his screen with me when i confirm sharing then sharing status should ' +
        'be changed to confirmed', function () {
        var screenSharingDataGuid = '123456789-data-guid';
        var sharerId = '123456789-sharer-id';
        var viewerId = _deps.UserProfileService.__currUserId;

        _deps.testStorage.db.screenSharing = {};
        _deps.testStorage.db.screenSharing[screenSharingDataGuid] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum
        };

        _deps.ScreenSharingSrv.confirmSharing(screenSharingDataGuid);

        var expectedRootScreenSharing = {};
        expectedRootScreenSharing[screenSharingDataGuid] = angular.copy(_deps.testStorage.db.screenSharing[screenSharingDataGuid]);
        expectedRootScreenSharing[screenSharingDataGuid].status = _deps.ScreenSharingStatusEnum.CONFIRMED.enum;

        expect(_deps.testStorage.db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));
    });

    it('given user sharing his screen with me when i end screen sharing then sharing status should ' +
        'be changed to ended', function () {
        var screenSharingDataGuid = '123456789-data-guid';
        var sharerId = '123456789-sharer-id';
        var viewerId = _deps.UserProfileService.__currUserId;

        _deps.testStorage.db.screenSharing = {};
        _deps.testStorage.db.screenSharing[screenSharingDataGuid] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum
        };

        _deps.ScreenSharingSrv.endSharing(screenSharingDataGuid);

        var expectedRootScreenSharing = {};
        expectedRootScreenSharing[screenSharingDataGuid] = angular.copy(_deps.testStorage.db.screenSharing[screenSharingDataGuid]);
        expectedRootScreenSharing[screenSharingDataGuid].status = _deps.ScreenSharingStatusEnum.ENDED.enum;

        expect(_deps.testStorage.db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));
    });
});
