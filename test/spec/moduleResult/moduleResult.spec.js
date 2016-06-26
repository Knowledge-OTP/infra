describe('testing service "ModuleResults":', function () {
    'use strict';

    //beforeEach(module('znk.infra.moduleResults', 'znk.infra.storage', 'znk.infra.enum', 'htmlTemplates', 'testUtility', 'storage.mock', 'user.mock'));
    beforeEach(module('znk.infra.moduleResults', 'znk.infra.utility', 'znk.infra.config', 'znk.infra.storage', 'testUtility', 'storage.mock'));


    var ModuleResultsService, UtilitySrv, actions, testStorage, InfraConfigSrv, $q, TEST_UID;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            TEST_UID = '68639c20-f951-47a4-b4e7-de0c9142e39f';
            var UtilitySrv = $injector.get('UtilitySrv');
            ModuleResultsService = $injector.get('ModuleResultsService');

            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            actions = TestUtilitySrv.general.convertAllAsyncToSync(ModuleResultsService);

            testStorage = $injector.get('testStorage');
            $q = $injector.get('$q');

            InfraConfigSrv = $injector.get('InfraConfigSrv');
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

    it('when requesting for a not exiting result then a new initialized result should be returned', function () {
        var moduleId = 1;
        var exerciseResult = actions.getModuleResult(moduleId);
        var expectedModuleResult = {
            moduleId: moduleId,
            assign: false,
            contentAssign: false,
            tutorId: null,
            uid: TEST_UID
        };
        expect(exerciseResult).toEqual(jasmine.objectContaining(expectedModuleResult));
    });

    it('when requesting for a not exiting result with dont initialize parameter then a new result should not be created and null should be returned', function () {
        var moduleId = 1;
        var dontInitIfNotExists = true;
        var exerciseResult = actions.getModuleResult(moduleId, dontInitIfNotExists);
        expect(exerciseResult).toBeNull();
        expect(testStorage.db.moduleResults[moduleId]).toBeUndefined();
    });
});
