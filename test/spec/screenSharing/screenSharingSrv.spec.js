describe('testing service "ScreenSharingSrv":', function () {
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
            '$q',
            '$rootScope',
            'UserScreenSharingStateEnum'
        ];

        depsToInject.forEach(function (depName) {
            _deps[depName] = $injector.get(depName);
        });

        _deps.ScreenSharingSrvSync = _deps.TestUtilitySrv.general.convertAllAsyncToSync(_deps.ScreenSharingSrv);

        _deps.GlobalStorage = _deps.TestUtilitySrv.general.asyncToSync(_deps.InfraConfigSrv.getGlobalStorage, _deps.InfraConfigSrv)();
    }));

    function _addScreenSharingRequestToUser(uid, isTeacher, guid) {
        var appName = isTeacher ? _deps.ENV.dashboardAppName : _deps.ENV.studentAppName;

        var path = appName + '/users/' + uid + '/screenSharing/active';
        var value = {};
        value[guid] = true;
        _deps.GlobalStorage.adapter.update(path, value);

    }

    function _updateScreenSharingData(screenSharingData) {
        var path = 'screenSharing/' + screenSharingData.guid;

        _deps.GlobalStorage.adapter.update(path, screenSharingData);
        _deps.$rootScope.$digest();
    }

    xit('given i\'m a student when requesting to share my screen with a teacher then root shareScreen object and ' +
        'sharer and viewer shareScreen objects should be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var viewerId = '11223344';
        var sharerId = _deps.UserProfileService.__currUserId;

        var viewerData = {
            uid: viewerId,
            isTeacher: true
        };
        _deps.ScreenSharingSrvSync.shareMyScreen(viewerData);

        var expectedActiveViewerPath = _deps.ENV.dashboardAppName + '/users/' + viewerId + '/screenSharing/active';
        var expectedActiveSharerPath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var expectedArchiveViewerPath = _deps.ENV.dashboardAppName + '/users/' + viewerId + '/screenSharing/archive';
        var expectedArchiveSharerPath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                viewerActivePath: expectedActiveViewerPath,
                sharerActivePath: expectedActiveSharerPath,
                viewerArchivePath: expectedArchiveViewerPath,
                sharerArchivePath: expectedArchiveSharerPath,
                status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
                guid: screenSharingDataGuid
            }
        };
        expect(_deps.GlobalStorage.adapter.__db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedStudentAppUsersObject = {};
        expectedStudentAppUsersObject[sharerId] = {
            screenSharing: {
                active: {
                    guid: true
                }
            }
        };
        var currStudentAppUsersObject = _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users;
        expect(currStudentAppUsersObject).toEqual(jasmine.objectContaining(expectedStudentAppUsersObject));

        var expectedTeacherAppUsersObject = {};
        expectedTeacherAppUsersObject[viewerId] = {
            screenSharing: {
                active: {
                    guid: true
                }
            }
        };
        var currTeacherAppUsersObject = _deps.GlobalStorage.adapter.__db[_deps.ENV.dashboardAppName].users;
        expect(currTeacherAppUsersObject).toEqual(jasmine.objectContaining(expectedTeacherAppUsersObject));
    });

    xit('given i\'m a student when requesting to share my screen with a student then root shareScreen object and sharer ' +
        'and viewer shareScreen objects should be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var viewerId = '11223344';
        var sharerId = _deps.UserProfileService.__currUserId;

        var viewerData = {
            uid: viewerId,
            isTeacher: false
        };
        _deps.ScreenSharingSrvSync.shareMyScreen(viewerData);

        var expectedViewerPath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var expectedSharerPath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var expectedArchiveViewerPath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var expectedArchiveSharerPath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var expectedRootScreenSharing = {
            guid: {
                guid: screenSharingDataGuid,
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
                viewerActivePath: expectedViewerPath,
                sharerActivePath: expectedSharerPath,
                viewerArchivePath: expectedArchiveViewerPath,
                sharerArchivePath: expectedArchiveSharerPath
            }
        };
        expect(_deps.GlobalStorage.adapter.__db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedStudentAppUsersObject = {};
        expectedStudentAppUsersObject[sharerId] = {
            screenSharing: {
                active: {
                    guid: true
                }
            }
        };
        expectedStudentAppUsersObject[viewerId] = {
            screenSharing: {
                active: {
                    guid: true
                }
            }
        };
        var currStudentAppUsersObject = _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users;
        expect(currStudentAppUsersObject).toEqual(jasmine.objectContaining(expectedStudentAppUsersObject));
    });

    xit('given i\'m a student which already requested to share my screen with a student when requesting to share ' +
        'my screen with the same student then new screen sharing request should not be initialized' +
        ' be update accordingly', function () {
        var viewerId = '11223344';

        var viewerData = {
            uid: viewerId,
            isTeacher: false
        };
        _deps.ScreenSharingSrvSync.shareMyScreen(viewerData);
        _deps.ScreenSharingSrvSync.shareMyScreen(viewerData);

        var screenSharingRequestNum = Object.keys(_deps.GlobalStorage.adapter.__db.screenSharing).length;
        var expectedScreenSharingRequestNum = 1;
        expect(screenSharingRequestNum).toEqual(expectedScreenSharingRequestNum);
    });

    xit('given screen sharing request with status ended exists when trying to share my screen with the same user then new screen sharing' +
        'data should be create', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName] = {
            users: {}
        };

        _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[myUid] = {
            screenSharing: {}
        };
        var myScreenSharingRequestsData = _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[myUid].screenSharing;

        _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[otherUid] = {
            screenSharing: {}
        };
        var otherUserScreenSharingRequestsData = _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[otherUid].screenSharing;

        _deps.GlobalStorage.adapter.__db.screenSharing = {};
        var screenSharingData = _deps.GlobalStorage.adapter.__db.screenSharing;

        myScreenSharingRequestsData[screenSharingDataGuid] = true;
        otherUserScreenSharingRequestsData [screenSharingDataGuid] = true;

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        screenSharingData[screenSharingDataGuid] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.ENDED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };

        var viewerData = {
            uid: otherUid,
            isTeacher: false
        };
        _deps.ScreenSharingSrvSync.shareMyScreen(viewerData);

        var screenSharingReqNum = Object.keys(_deps.GlobalStorage.adapter.__db.screenSharing).length;
        var expectedScreenSharingReqNum = 2;
        expect(screenSharingReqNum).toBe(expectedScreenSharingReqNum);
    });

    xit('given i\'m a student when requesting to view other teacher screen then root shareScreen object and ' +
        'sharer and viewer shareScreen objects should be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var sharerId = '11223344';
        var viewerId = _deps.UserProfileService.__currUserId;

        var sharerData = {
            uid: sharerId,
            isTeacher: true
        };
        _deps.ScreenSharingSrvSync.viewOtherUserScreen(sharerData);

        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.dashboardAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.dashboardAppName + '/users/' + sharerId + '/screenSharing/archive';
        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_SHARER.enum,
                guid: screenSharingDataGuid,
                viewerActivePath: viewerActivePath,
                sharerActivePath: sharerActivePath,
                viewerArchivePath: viewerArchivePath,
                sharerArchivePath: sharerArchivePath
            }
        };
        expect(_deps.GlobalStorage.adapter.__db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedStudentAppUsersObject = {};
        expectedStudentAppUsersObject[viewerId] = {
            screenSharing: {
                active: {
                    guid: true
                }
            }
        };
        var currStudentAppUsersObject = _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users;
        expect(currStudentAppUsersObject).toEqual(jasmine.objectContaining(expectedStudentAppUsersObject));

        var expectedTeacherAppUsersObject = {};
        expectedTeacherAppUsersObject[sharerId] = {
            screenSharing: {
                active: {
                    guid: true
                }
            }
        };
        var currTeacherAppUsersObject = _deps.GlobalStorage.adapter.__db[_deps.ENV.dashboardAppName].users;
        expect(currTeacherAppUsersObject).toEqual(jasmine.objectContaining(expectedTeacherAppUsersObject));
    });

    xit('given i\'m a student when requesting to view other student screen then root shareScreen object and sharer and ' +
        'viewer shareScreen objects should be update accordingly', function () {
        var screenSharingDataGuid = 'guid';
        spyOn(_deps.UtilitySrv.general, 'createGuid').and.returnValue(screenSharingDataGuid);

        var sharerId = '11223344';
        var viewerId = _deps.UserProfileService.__currUserId;

        var sharerData = {
            uid: sharerId,
            isTeacher: false
        };
        _deps.ScreenSharingSrvSync.viewOtherUserScreen(sharerData);

        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var expectedRootScreenSharing = {
            guid: {
                sharerId: sharerId,
                viewerId: viewerId,
                status: _deps.ScreenSharingStatusEnum.PENDING_SHARER.enum,
                guid: screenSharingDataGuid,
                viewerActivePath: viewerActivePath,
                sharerActivePath: sharerActivePath,
                viewerArchivePath: viewerArchivePath,
                sharerArchivePath: sharerArchivePath
            }
        };
        expect(_deps.GlobalStorage.adapter.__db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        var expectedStudentAppUsersObject = {};
        expectedStudentAppUsersObject[viewerId] = {
            screenSharing: {
                active: {
                    guid: true
                }
            }
        };
        expectedStudentAppUsersObject[sharerId] = {
            screenSharing: {
                active: {
                    guid: true
                }
            }
        };

        var currStudentAppUsersObject = _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users;
        expect(currStudentAppUsersObject).toEqual(jasmine.objectContaining(expectedStudentAppUsersObject));
    });

    xit('given user sharing his screen with me when i confirm sharing then sharing status should ' +
        'be changed to confirmed', function () {
        var screenSharingDataGuid = '123456789-data-guid';
        var sharerId = '123456789-sharer-id';
        var viewerId = _deps.UserProfileService.__currUserId;

        _deps.GlobalStorage.adapter.__db.screenSharing = {};
        _deps.GlobalStorage.adapter.__db.screenSharing[screenSharingDataGuid] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum
        };

        _deps.ScreenSharingSrvSync.confirmSharing(screenSharingDataGuid);

        var expectedRootScreenSharing = {};
        expectedRootScreenSharing[screenSharingDataGuid] = angular.copy(_deps.GlobalStorage.adapter.__db.screenSharing[screenSharingDataGuid]);
        expectedRootScreenSharing[screenSharingDataGuid].status = _deps.ScreenSharingStatusEnum.CONFIRMED.enum;

        expect(_deps.GlobalStorage.adapter.__db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));
    });

    xit('given user sharing his screen with me when i end screen sharing then sharing status should ' +
        'be changed to ended', function () {
        var screenSharingDataGuid = '123456789-data-guid';
        var sharerId = '123456789-sharer-id';
        var viewerId = _deps.UserProfileService.__currUserId;

        _deps.GlobalStorage.adapter.__db.screenSharing = {};
        _deps.GlobalStorage.adapter.__db.screenSharing[screenSharingDataGuid] = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
            viewerActivePath: _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active',
            sharerActivePath: _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active',
            viewerArchivePath: _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive',
            sharerArchivePath: _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive'
        };

        _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName] = {users: {}};

        //set viewer screen sharing requests data
        _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[viewerId] = { screenSharing: { active: {} } };
        _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[viewerId].screenSharing.active[screenSharingDataGuid] = true;

        //set sharer screen sharing requests data
        _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[sharerId] = { screenSharing: { active: {} } };
        _deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[sharerId].screenSharing.active[screenSharingDataGuid] = true;

        _deps.ScreenSharingSrvSync.endSharing(screenSharingDataGuid);

        var expectedRootScreenSharing = {};
        expectedRootScreenSharing[screenSharingDataGuid] = angular.copy(_deps.GlobalStorage.adapter.__db.screenSharing[screenSharingDataGuid]);
        expectedRootScreenSharing[screenSharingDataGuid].status = _deps.ScreenSharingStatusEnum.ENDED.enum;
        expect(_deps.GlobalStorage.adapter.__db.screenSharing).toEqual(jasmine.objectContaining(expectedRootScreenSharing));

        expect(_deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[sharerId].screenSharing[screenSharingDataGuid]).toBeFalsy();

        expect(_deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[viewerId].screenSharing[screenSharingDataGuid]).toBeFalsy();
    });

    xit('when user close the view other user screen modal then screen sharing data status should change to ended', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.PENDING_VIEWER.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _updateScreenSharingData(screenSharingData);

        spyOn(_deps.ScreenSharingUiSrv, 'endScreenSharing');
        spyOn(_deps.ScreenSharingUiSrv, 'activateScreenSharing').and.returnValue(_deps.$q.when());
        screenSharingData.status = _deps.ScreenSharingStatusEnum.CONFIRMED.enum;
        _updateScreenSharingData(screenSharingData);

        expect(_deps.GlobalStorage.adapter.__db.screenSharing[screenSharingDataGuid].status).toBe(_deps.ScreenSharingStatusEnum.ENDED.enum);
        expect(_deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[viewerId].screenSharing[screenSharingDataGuid]).toBeFalsy();
        expect(_deps.GlobalStorage.adapter.__db[_deps.ENV.studentAppName].users[sharerId].screenSharing[screenSharingDataGuid]).toBeFalsy();
        expect(_deps.ScreenSharingUiSrv.endScreenSharing).toHaveBeenCalled();
    });

    xit('when screen sharing is active then new screen sharing requests should be ignored', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.CONFIRMED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _updateScreenSharingData(screenSharingData);

        var shareMyScreenResult;
        var viewerData = {
            uid: otherUid,
            isTeacher: false
        };
        var shareMyScreenProm = _deps.ScreenSharingSrv.shareMyScreen(viewerData);
        shareMyScreenProm.then(function () {
            shareMyScreenResult = 'resolved';
        }, function () {
            shareMyScreenResult = 'rejected';
        });
        _deps.$rootScope.$digest();

        var expectedResult = 'rejected';
        expect(shareMyScreenResult).toBe(expectedResult);
    });

    xit('given screen sharing is confirmed when screen sharing data is changed then all registered cb should ' +
        'be invoked', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.CONFIRMED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _updateScreenSharingData(screenSharingData);

        var valueReceivedInCb;

        function cb(_newScreenSharingData) {
            valueReceivedInCb = _newScreenSharingData;
        }

        _deps.ScreenSharingSrv.registerToActiveScreenSharingDataChanges(cb);

        var screenSharingPath = 'screenSharing/' + screenSharingDataGuid;
        var newScreenSharingData = angular.copy(screenSharingData);
        newScreenSharingData.activeExercise = {
            exerciseId: 1
        };
        _deps.GlobalStorage.adapter.update(screenSharingPath, newScreenSharingData);
        _deps.$rootScope.$digest();

        expect(valueReceivedInCb).toEqual(newScreenSharingData);
    });

    xit('given screen sharing is confirmed when unregistering from active screen sharing changes then callback should ' +
        'not be invoked once the active screen sharing data has changed', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.CONFIRMED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _updateScreenSharingData(screenSharingData);

        var valueReceivedInCb;

        function cb(_newScreenSharingData) {
            valueReceivedInCb = _newScreenSharingData;
        }

        _deps.ScreenSharingSrv.registerToActiveScreenSharingDataChanges(cb);
        _deps.ScreenSharingSrv.unregisterFromActiveScreenSharingDataChanges(cb);

        var screenSharingPath = 'screenSharing/' + screenSharingDataGuid;
        var newScreenSharingData = angular.copy(screenSharingData);
        newScreenSharingData.activeExercise = {
            exerciseId: 1
        };
        _deps.GlobalStorage.adapter.update(screenSharingPath, newScreenSharingData);
        _deps.$rootScope.$digest();

        expect(valueReceivedInCb).toEqual(screenSharingData);
    });

    xit('given screen sharing is confirmed when screen sharing status change to ENDED then once screen sharing data is changed' +
        ' then no registered cn should be invoked', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.CONFIRMED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _updateScreenSharingData(screenSharingData);

        var valueReceivedInCb;

        function cb(_newScreenSharingData) {
            valueReceivedInCb = _newScreenSharingData;
        }

        _deps.ScreenSharingSrv.registerToActiveScreenSharingDataChanges(cb);

        var screenSharingPath = 'screenSharing/' + screenSharingDataGuid;
        var newScreenSharingData = angular.copy(screenSharingData);
        newScreenSharingData.activeExercise = {
            exerciseId: 1
        };
        newScreenSharingData.status = _deps.ScreenSharingStatusEnum.ENDED.enum;
        _deps.GlobalStorage.adapter.update(screenSharingPath, newScreenSharingData);
        _deps.$rootScope.$digest();

        expect(valueReceivedInCb).toEqual(screenSharingData);
    });

    xit('given screen sharing is confirmed when screen sharing data update then registered cb should be invoked only in case' +
        ' the active screen sharing data was updated', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.CONFIRMED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _updateScreenSharingData(screenSharingData);

        var valueReceivedInCb;

        function cb(_newScreenSharingData) {
            valueReceivedInCb = _newScreenSharingData;
        }

        _deps.ScreenSharingSrv.registerToActiveScreenSharingDataChanges(cb);

        var screenSharingPath = 'screenSharing/' + screenSharingDataGuid;
        var newScreenSharingData = angular.copy(screenSharingData);
        newScreenSharingData.guid = 'other-screen-sharing-data-guid';
        newScreenSharingData.activeExercise = {
            exerciseId: 1
        };
        _deps.GlobalStorage.adapter.update(screenSharingPath, newScreenSharingData);
        _deps.$rootScope.$digest();

        expect(valueReceivedInCb).toEqual(screenSharingData);
    });

    xit('when registering to current user screen sharing state changes then the callback should be invoked once the ' +
        'current user state change', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        var valueFromCb;

        function cb(newUserScreenSharingState) {
            valueFromCb = newUserScreenSharingState;
        }

        _deps.ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(cb);
        var expectedValue = _deps.UserScreenSharingStateEnum.NONE.enum;
        expect(valueFromCb).toBe(expectedValue);

        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.CONFIRMED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _updateScreenSharingData(screenSharingData);
        expectedValue = _deps.UserScreenSharingStateEnum.VIEWER.enum;
        expect(valueFromCb).toBe(expectedValue);
    });

    xit('when unregistering from user screen sharing state changes then the callback should not be invoke once the ' +
        'user screen sharing state has changed', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        var valueFromCb;

        function cb(newUserScreenSharingState) {
            valueFromCb = newUserScreenSharingState;
        }

        _deps.ScreenSharingSrv.registerToCurrUserScreenSharingStateChanges(cb);


        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.CONFIRMED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _deps.ScreenSharingSrv.unregisterFromCurrUserScreenSharingStateChanges(cb);
        _updateScreenSharingData(screenSharingData);
        var expectedValue = _deps.UserScreenSharingStateEnum.NONE.enum;
        expect(valueFromCb).toBe(expectedValue);
    });

    xit('given user sharing his screen when saving screen sharing data then updated by field ' +
        'should be updated correctly', function () {
        var myUid = _deps.UserProfileService.__currUserId;
        var otherUid = '123456789-other-uid';
        var screenSharingDataGuid = '123456789-data-guid';

        _addScreenSharingRequestToUser(myUid, false, screenSharingDataGuid);
        _addScreenSharingRequestToUser(otherUid, false, screenSharingDataGuid);

        var viewerId = myUid;
        var sharerId = otherUid;
        var viewerActivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/active';
        var sharerActivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/active';
        var viewerArchivePath = _deps.ENV.studentAppName + '/users/' + viewerId + '/screenSharing/archive';
        var sharerArchivePath = _deps.ENV.studentAppName + '/users/' + sharerId + '/screenSharing/archive';
        var screenSharingData = {
            guid: screenSharingDataGuid,
            sharerId: sharerId,
            viewerId: viewerId,
            status: _deps.ScreenSharingStatusEnum.CONFIRMED.enum,
            viewerActivePath: viewerActivePath,
            sharerActivePath: sharerActivePath,
            viewerArchivePath: viewerArchivePath,
            sharerArchivePath: sharerArchivePath
        };
        _updateScreenSharingData(screenSharingData);

        var activeScreenSharingData = _deps.ScreenSharingSrvSync.getActiveScreenSharingData();
        activeScreenSharingData.$save();

        expect(activeScreenSharingData.updatedBy).toEqual(myUid);
    });
});
