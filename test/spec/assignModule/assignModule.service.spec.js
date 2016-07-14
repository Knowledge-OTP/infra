describe('testing service "AssignModule":', function () {
    'use strict';

    beforeEach(module('znk.infra.assignModule',
        'htmlTemplates', 
        'testUtility',
        'znk.infra.znkModule', 
        'znk.infra.content',
        'znk.infra.storage', 
        'storage.mock', 
        'user.mock',
        'znk.infra.utility'));

    var UserAssignModuleService,ZnkModuleService, ModuleResultsService, SubjectEnum, $q, actions;
    beforeEach(inject([
        '$injector',
        function ($injector) {
        	UserAssignModuleService = $injector.get('UserAssignModuleService');
            ZnkModuleService = $injector.get('ZnkModuleService');
            ModuleResultsService = $injector.get('ModuleResultsService');
            SubjectEnum = $injector.get('SubjectEnum');
            $q = $injector.get('$q');
            
            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            actions = TestUtilitySrv.general.convertAllAsyncToSync(UserAssignModuleService);
        }]));
	
	it('test uid that does not exists return an empty obj', function () {
		var uid=100;

        spyOn(ModuleResultsService, "getUserModuleResultsGuids").and.returnValue($q.when({}));
        spyOn(ModuleResultsService, "getModuleResultByGuid").and.returnValue($q.when({}));
        
        var assignModules = actions.getUserAssignModules(uid);
        expect(assignModules).toEqual({});
    });

});