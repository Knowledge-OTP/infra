describe('testing service "ModuleResults":', function () {
    'use strict';

    beforeEach(module('znk.infra.moduleResults', 'znk.infra.utility', 'znk.infra.config', 'znk.infra.storage', 'testUtility', 'storage.mock'));

    var ModuleResultsService, UtilitySrv, actions, testStorage, InfraConfigSrv, $q, TEST_UID, MODULE_RESULT_GUID;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            MODULE_RESULT_GUID = 'f63f4964-b111-4c46-aef5-320d58aeabf1';
            TEST_UID = '68639c20-f951-47a4-b4e7-de0c9142e39f';
            UtilitySrv = $injector.get('UtilitySrv');
            ModuleResultsService = $injector.get('ModuleResultsService');

            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            actions = TestUtilitySrv.general.convertAllAsyncToSync(ModuleResultsService);

            $q = $injector.get('$q');

            InfraConfigSrv = $injector.get('InfraConfigSrv');
            testStorage = TestUtilitySrv.general.asyncToSync(InfraConfigSrv.getStudentStorage,InfraConfigSrv)();
            InfraConfigSrv.getUserData = function () {
                return $q.when({
                    uid: TEST_UID
                });
            };
        }]));

    beforeEach(function () {
        testStorage.db.moduleResults = {};
        testStorage.db.users = {
            '$$uid': {
                moduleResults: {}
            }
        };
    });

    it('when requesting for a not existing result then a new initialized result should be returned', function () {
        var moduleId = 1;
        var exerciseResult = actions.getModuleResultByModuleId(moduleId, TEST_UID, true);
        var expectedModuleResult = {
            moduleId: moduleId,
            tutorId: null,
            assign: false,
            contentAssign: false,
            uid: TEST_UID
        };
        expect(exerciseResult).toEqual(jasmine.objectContaining(expectedModuleResult));
    });

    it('when requesting for a not exiting result with dont initialize parameter then a new result should not be created and null should be returned', function () {
        var moduleId = 1;
        var moduleResults = actions.getModuleResultByModuleId(moduleId, TEST_UID, false);
        expect(moduleResults).toBeNull();
        expect(testStorage.db.moduleResults[moduleId]).toBeUndefined();
    });

    it('when requesting for a not exiting result By Guid with no default, null should return', function () {
        var moduleId = 1;
        var moduleResults = actions.getModuleResultByGuid(MODULE_RESULT_GUID);
        var expectedModuleResult = {};
        expect(moduleResults).toEqual(expectedModuleResult);
        expect(testStorage.db.moduleResults[moduleId]).toBeUndefined();
    });

    it('when requesting for a not existing result By Guid with default value, default should return', function () {
        var moduleId = 1;
        var expectedModuleResult = {
            moduleId: moduleId,
            guid: MODULE_RESULT_GUID,
            tutorId: null,
            assign: false,
            contentAssign: false,
            uid: TEST_UID
        };
        var moduleResults = actions.getModuleResultByGuid(MODULE_RESULT_GUID, expectedModuleResult);
        expect(moduleResults).toEqual(expectedModuleResult);
    });


});
