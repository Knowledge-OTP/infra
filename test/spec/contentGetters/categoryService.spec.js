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
        'content.mock',
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

    it('when calling getCategoryData with an existing categoryId data is returned', function () {
        var categoryId = 133;

        var categoryData = actions.getCategoryData(categoryId);
        expect(categoryData.id > 0).toBeTruthy();
        expect(categoryData.parentId).toBeDefined();
    });

    it('when calling getAllLevelCategories with level 1 all subjects returned', function () {
        
        var categories = actions.getAllLevelCategories(1);
        expect(categories[0] && categories[0].name === 'Mathematics').toBeTruthy();
        expect(categories[1] && categories[1].name === 'Reading').toBeTruthy();
        expect(categories[2] && categories[2].name === 'Writing').toBeTruthy();
        expect(categories[5] && categories[5].name === 'English').toBeTruthy();
        expect(categories[6] && categories[6].name === 'Science').toBeTruthy();
       
    });

    it('when calling getAllLevelCategories with level 2 all subscores returned', function () {
        
        var categories = actions.getAllLevelCategories(2);

        var isSubscoreCategories = true;
        for (var i = 261; i < 272; i++) { 
            if (isSubscoreCategories && categories[i]){
                isSubscoreCategories = true;
            }
            else{
                isSubscoreCategories = false;
            }
        }
        expect(isSubscoreCategories).toBeTruthy();
    
    });

    it('when calling getAllLevelCategories with level 3 all general returned', function () {
        
        var categories = actions.getAllLevelCategories(3);

        var isSubscoreCategories = true;
        for (var i = 133; i < 139; i++) { 
            if (isSubscoreCategories && categories[i]){
                isSubscoreCategories = true;
            }
            else{
                isSubscoreCategories = false;
            }
        }
        expect(isSubscoreCategories).toBeTruthy();
    
    });


    it('when calling getAllLevelCategories with level 4 spesific returned', function () {
        
        var categories = actions.getAllLevelCategories(4);

        var isSubscoreCategories = true;
        for (var i = 155; i < 181; i++) { 
            if (isSubscoreCategories && categories[i]){
                isSubscoreCategories = true;
            }
            else{
                isSubscoreCategories = false;
            }
        }
        expect(isSubscoreCategories).toBeTruthy();
    
    });



});
