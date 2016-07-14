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
            'UtilitySrv',
            'ENV'
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.ScreenSharingSrv = _deps.TestUtilitySrv.general.convertAllAsyncToSync(_deps.ScreenSharingSrv);
    }));

    it('given i\'m a student when requesting to share my screen with a teacher then root shareScreen object and sharer and viewer shareScreen objects should' +
        ' be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var viewerId = '11223344';
        var sharerId = _deps.UserProfileService.__currUserId;

        var viewerData = {
            uid: viewerId,
            isTeacher: true
        };
        _deps.ScreenSharingSrv.shareMyScreen(viewerData);

        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
                guid: screenSharingDataGuid
            }
        };
        expect(_deps.testStorage.db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedStudentAppUsersObject = {};
        expectedStudentAppUsersObject[sharerId] = {
            screenSharing: {
                guid: true
            }
        };
        var currStudentAppUsersObject = _deps.testStorage.db[_deps.ENV.studentAppName].users;
        expect(currStudentAppUsersObject).toEqual(jasmine.objectContaining(expectedStudentAppUsersObject));

        var expectedTeacherAppUsersObject = {};
        expectedTeacherAppUsersObject[viewerId] = {
            screenSharing: {
                guid: true
            }
        };
        var currTeacherAppUsersObject = _deps.testStorage.db[_deps.ENV.dashboardAppName].users;
        expect(currTeacherAppUsersObject).toEqual(jasmine.objectContaining(expectedTeacherAppUsersObject));
    });

    it('given i\'m a student when requesting to share my screen with a student then root shareScreen object and sharer and viewer shareScreen objects should' +
        ' be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var viewerId = '11223344';
        var sharerId = _deps.UserProfileService.__currUserId;

        var viewerData = {
            uid: viewerId,
            isTeacher: false
        };
        _deps.ScreenSharingSrv.shareMyScreen(viewerData);

        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
                guid: screenSharingDataGuid
            }
        };
        expect(_deps.testStorage.db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedStudentAppUsersObject = {};
        expectedStudentAppUsersObject[sharerId] = {
            screenSharing: {
                guid: true
            }
        };
        expectedStudentAppUsersObject[viewerId] = {
            screenSharing: {
                guid: true
            }
        };
        var currStudentAppUsersObject = _deps.testStorage.db[_deps.ENV.studentAppName].users;
        expect(currStudentAppUsersObject).toEqual(jasmine.objectContaining(expectedStudentAppUsersObject));
    });

    it('given i\'m a student when requesting to view other teacher screen then root shareScreen object and sharer and viewer shareScreen objects should' +
        ' be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var sharerId = '11223344';
        var viewerId = _deps.UserProfileService.__currUserId;

        var sharerData = {
            uid: sharerId,
            isTeacher: true
        };
        _deps.ScreenSharingSrv.viewOtherUserScreen(sharerData);

        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_SHARER.enum,
                guid: screenSharingDataGuid
            }
        };
        expect(_deps.testStorage.db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedStudentAppUsersObject = {};
        expectedStudentAppUsersObject[viewerId] = {
            screenSharing: {
                guid: true
            }
        };
        var currStudentAppUsersObject = _deps.testStorage.db[_deps.ENV.studentAppName].users;
        expect(currStudentAppUsersObject).toEqual(jasmine.objectContaining(expectedStudentAppUsersObject ));

        var expectedTeacherAppUsersObject = {};
        expectedTeacherAppUsersObject[sharerId] = {
            screenSharing: {
                guid: true
            }
        };
        var currTeacherAppUsersObject = _deps.testStorage.db[_deps.ENV.dashboardAppName].users;
        expect(currTeacherAppUsersObject ).toEqual(jasmine.objectContaining(expectedTeacherAppUsersObject));
    });

    it('given i\'m a student when requesting to view other student screen then root shareScreen object and sharer and viewer shareScreen objects should' +
        ' be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var sharerId = '11223344';
        var viewerId = _deps.UserProfileService.__currUserId;

        var sharerData = {
            uid: sharerId,
            isTeacher: false
        };
        _deps.ScreenSharingSrv.viewOtherUserScreen(sharerData);

        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_SHARER.enum,
                guid: screenSharingDataGuid
            }
        };
        expect(_deps.testStorage.db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedStudentAppUsersObject = {};
        expectedStudentAppUsersObject[viewerId] = {
            screenSharing: {
                guid: true
            }
        };
        expectedStudentAppUsersObject[sharerId] = {
            screenSharing: {
                guid: true
            }
        };

        var currStudentAppUsersObject = _deps.testStorage.db[_deps.ENV.studentAppName].users;
        expect(currStudentAppUsersObject).toEqual(jasmine.objectContaining(expectedStudentAppUsersObject));
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
