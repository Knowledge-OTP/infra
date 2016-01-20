describe('testing service "storageFirebaseAdapter":', function () {
    'use strict';

    beforeEach(function(){
        MockFirebase.override();
    });

    beforeEach(module('znk.infra.storage', 'htmlTemplates'));

    var $rootScope, storageFirebaseAdapter, StorageSrv;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            storageFirebaseAdapter = $injector.get('storageFirebaseAdapter');
            StorageSrv = $injector.get('StorageSrv');
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
                var pathRef = adapter.__refMap[path];
                if(pathRef){
                    pathRef.flush();
                }
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
        var entity = adapter.get(StorageSrv.variables.appUserSpacePath);
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

    it('when setting simultaneously 2 objects then firebase db should be updated accordingly', function () {
        var syncedAdapter = actions.syncAdapter(storageFirebaseAdapter(endpoint));
        var savedDataMap = {
            a: {
                a: 1
            },
            b: {
                b: 2
            }
        };
        savedDataMap[StorageSrv.variables.uid] = 5;

        syncedAdapter.set(angular.copy(savedDataMap));
        syncedAdapter.__refMap.rootRef.flush();
        var aVal = syncedAdapter.get('a');
        var bVal = syncedAdapter.get('b');
        var uidVal = syncedAdapter.get('1');
        expect(aVal).toEqual(savedDataMap.a);
        expect(bVal).toEqual(savedDataMap.b);
        expect(uidVal).toEqual(5);
    });
});
