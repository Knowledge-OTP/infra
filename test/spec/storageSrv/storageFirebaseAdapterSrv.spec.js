describe('testing service "storageFirebaseAdapter":', function () {
    'use strict';

    beforeEach(function(){
        MockFirebase.override();
    });

    beforeEach(module('znk.infra.storage', 'htmlTemplates'));

    var $rootScope, storageFirebaseAdapter;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            storageFirebaseAdapter = $injector.get('storageFirebaseAdapter');
        }])
    );


    var actions = {};

    actions.syncAdapter = function(adapter){
        adapter.__refMap.rootRef.changeAuthState({
            uid: 1
            //provider: 'custom',
            //token: 'authToken',
            //expires: Math.floor(new Date() / 1000) + 24 * 60 * 60,
            //auth: {
            //    isAdmin: true
            //}
        });
        adapter.__refMap.rootRef.flush();

        return {
            get: function(path){
                var val;
                adapter.get(path).then(function(_val){
                    val = _val;
                });
                var pathRef = adapter.__refMap[path];
                if(pathRef){
                    pathRef.flush();
                }
                $rootScope.$digest();
                return val;
            },
            set: function(path,newEntity){
                var setProm = adapter.set(path, newEntity);
                $rootScope.$digest();
                adapter.__refMap[path].flush();
                return setProm;
            },
            __refMap: adapter.__refMap
        };
    };

    var endpoint = 'https://znk-test.firebaseio.com';

    it('when requesting for entity then the firebase path should be built correctly', function () {
        var expectedPath = 'users/1';
        var adapter = actions.syncAdapter(storageFirebaseAdapter(endpoint));
        var expectedVal = {key: 'val'};
        adapter.set(expectedPath,expectedVal);
        adapter.__refMap[expectedPath].autoFlush();
        var entity = adapter.get(storageFirebaseAdapter.variables.appUserSpacePath);
        expect(entity).toEqual(expectedVal);
    });

    it('when calling set then it should update firebase db', function () {
        var path = 'testPath';
        var syncedAdapter = actions.syncAdapter(storageFirebaseAdapter(endpoint));
        var newEntityVal = {
            test: 'test'
        };
        syncedAdapter.set(path,newEntityVal);
        var currEntityVal = syncedAdapter.get(path);
        expect(currEntityVal).toEqual(newEntityVal);
    });

    it('when saving entity then all undefined and start with $ properties should be deleted and not stored in firebase', function () {
        var path = 'testPath';
        var syncedAdapter = actions.syncAdapter(storageFirebaseAdapter(endpoint));
        var expectedResult = {
            key1: 'val',
            key2: {
                a: 1
            }
        };
        var value = angular.copy(expectedResult);
        value.prop1 = undefined;
        value.$prop = 'illegal key name';
        value.arr = [];
        value.key2.prop1 = undefined;
        value.key2.$prop = 'illegal key name';
        value.key2.arr = [];

        syncedAdapter.set(path,value);
        var currValue = syncedAdapter.get(path);
        expect(currValue).toEqual(expectedResult);
    });
});
