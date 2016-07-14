describe('testing service "CategoryService":', function () {
    'use strict';

    //TODO: Add category.mock
    beforeEach(module('znk.infra.contentGetters',
        'htmlTemplates',
        'znk.infra.storage',
        'znk.infra.znkModule',
        'znk.infra.content',
        'znk.infra.storage',
        'storage.mock',
        'user.mock',
        'znk.infra.utility',
        'testUtility'));

    var CategoryService, StorageRevSrv, $q, $log, actions, SubjectEnum;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            CategoryService = $injector.get('CategoryService');
            StorageRevSrv = $injector.get('StorageRevSrv');
            $q = $injector.get('$q');
            $log = $injector.get('$log');
            SubjectEnum = $injector.get('SubjectEnum');

            var TestUtilitySrv = $injector.get('TestUtilitySrv');
            actions = TestUtilitySrv.general.convertAllAsyncToSync(CategoryService);
        }
    ]));

    it('when calling categoryName the categoryName is returned', function () {
        var categoryId = 100;
        var categoryObjMap = {};
        categoryObjMap[categoryId] = 'some category';
        spyOn(CategoryService, "getCategoryMap").and.returnValue($q.when(categoryObjMap));

        var category = actions.categoryName(categoryId);
        expect(category).toEqual('some category');

    });

});
