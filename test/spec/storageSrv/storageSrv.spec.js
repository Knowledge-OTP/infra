describe('testing service "StorageSrv":', function () {
    'use strict';

    beforeEach(module('znk.infra.storage', 'htmlTemplates'));

    var $rootScope, StorageSrv, testStorage, $q;
    var entityMap = {};

    function entityGetter(path) {
        return $q.when(entityMap[path]);
    }

    function entitySetter(pathOrObject, newVal) {
        if (angular.isObject(pathOrObject)) {
            angular.forEach(pathOrObject, function (value, key) {
                entityMap[key] = angular.copy(value);
            });
            return pathOrObject;
        }
        entityMap[pathOrObject] = angular.copy(newVal);
        return $q.when(entityMap[pathOrObject]);
    }

    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StorageSrv = $injector.get('StorageSrv');
            $q = $injector.get('$q');

            testStorage = new StorageSrv(entityGetter, angular.noop);
        }
    ]));

    var actions = {};

    actions.syncEntityCommunicator = function () {
        var entityCommunicator = testStorage.entityCommunicator('test');
        var syncCommunicator = {};
        syncCommunicator.get = function () {
            var res;
            entityCommunicator.get().then(function (_res) {
                res = _res;
            });
            $rootScope.$digest();
            return res;
        };

        syncCommunicator.set = function (newEntity) {
            var res;
            entityCommunicator.set(newEntity).then(function (_res) {
                res = _res;
            });
            $rootScope.$digest();
            return res;
        };

        return syncCommunicator;
    };

    it('when requesting for entity with uid variable in the path the path should be built correctly',
        function () {
            var db = {};
            var entityGetterPathArgument;
            var getterSetter = {
                entityGetter: function(path){
                    entityGetterPathArgument = path;
                },
                entitySetter: function(path, val){
                    db[path] = val;
                }
            };

            var config = {
                variables:{
                    uid:  123456
                }
            };
            testStorage = new StorageSrv(getterSetter.entityGetter, getterSetter.entitySetter, config);

            var path = 'path/to/' + StorageSrv.variables.uid;
            testStorage.get(path);
            testStorage.set(path, true);
            $rootScope.$digest();
            var expectedPath = 'path/to/123456';
            expect(entityGetterPathArgument).toBe(expectedPath);
            expect(db[expectedPath]).toBeTruthy();
        }
    );

    it('when requesting for entity with appUserSpacePath variable in the path the path should be built correctly',
        function () {
            var db = {};
            var entityGetterPathArgument;
            var getterSetter = {
                entityGetter: function(path){
                    entityGetterPathArgument = path;
                },
                entitySetter: function(path, val){
                    db[path] = val;
                }
            };

            var config = {
                variables:{
                    uid:  123456
                }
            };
            testStorage = new StorageSrv(getterSetter.entityGetter, getterSetter.entitySetter, config);

            var path = 'path/to/' + StorageSrv.variables.appUserSpacePath;
            testStorage.get(path);
            testStorage.set(path, true);
            $rootScope.$digest();
            var expectedPath = 'path/to/users/123456';
            expect(entityGetterPathArgument).toBe(expectedPath);
            expect(db[expectedPath]).toBeTruthy();
        }
    );

    it('when getting not exiting data via entity communicator then empty object should be returned', function () {
        var entityCommunicator = actions.syncEntityCommunicator();
        var val = entityCommunicator.get();
        delete val.$save;
        expect(val).toEqual({});
    });

    it('when requesting twice for the same object via entity communicator then same instance should be returned', function () {
        var entityCommunicator = actions.syncEntityCommunicator();
        var expectedValue = entityCommunicator.get();
        var value = entityCommunicator.get();
        expect(value).toBe(expectedValue);
    });

    it('when saving entity via entity communicator then save entity function should be invoked', function () {
        var savedEntity;

        function saveEntity(path, _entity) {
            savedEntity = _entity;
        }

        testStorage = new StorageSrv(entityGetter, saveEntity);

        var entityCommunicator = actions.syncEntityCommunicator();
        var entity = entityCommunicator.get();
        entity.newProp = 'new prop';
        var returnedEntity = entityCommunicator.set(entity);

        expect(savedEntity).toEqual(entity);
        expect(returnedEntity).toEqual(entity);
    });

    it('when invoking $save of received entity then save entity function should be invoked', function () {
        var savedEntity;

        function saveEntity(path, _entity) {
            savedEntity = _entity;
        }

        testStorage = new StorageSrv(entityGetter, saveEntity);

        var entityCommunicator = actions.syncEntityCommunicator();
        var entity = entityCommunicator.get();
        entity.newProp = 'new prop';
        entity.$save();
        $rootScope.$digest();

        expect(savedEntity).toEqual(entity);
    });

    it('when set multiple locations are save simultaneously then cache should be updated accordingly', function () {
        testStorage = new StorageSrv(entityGetter, entitySetter);

        var expectedObj1;
        var expectedObj2;
        testStorage.set({
            path1: {
                a: 1
            },
            path2: {
                a: 2
            }
        }).then(function (savedData) {
            expectedObj1 = savedData.path1;
            expectedObj2 = savedData.path2;
        });
        $rootScope.$digest();

        var obj1;
        testStorage.get('path1').then(function (res) {
            obj1 = res;
        });
        $rootScope.$digest();
        expect(obj1).toEqual(jasmine.objectContaining(expectedObj1));
        expect(obj1.$save).toBeDefined();

        var obj2;
        testStorage.get('path2').then(function (res) {
            obj2 = res;
        });
        $rootScope.$digest();
        expect(obj2).toEqual(jasmine.objectContaining(expectedObj2));
        expect(obj2.$save).toBeDefined();
    });

    it('when calling cleanPathCache function then next time requesting for the value of this path it should be retrieved ' +
        'from the db', function () {
        testStorage = new StorageSrv(entityGetter, entitySetter);
        var path = 'path';

        entityMap[path] = 'cachedValue';
        testStorage.get(path);
        $rootScope.$digest();

        var expectedValue = 'freshValue';
        entityMap[path] = expectedValue;

        testStorage.cleanPathCache(path);
        expect(testStorage.entityCache.get(path)).toBe(undefined);

        var currVal;
        testStorage.get(path).then(function (val) {
            currVal = val;
        });
        $rootScope.$digest();

        expect(currVal).toBe(expectedValue);
        expect(testStorage.entityCache.get(path)).toBe(expectedValue);
    });

    it('when cache rules are defined for storage then paths which were set not be cached should not be cached', function () {
        var timeCalled = 0;
        var getterSetter = {
            entityGetter: function () {
                timeCalled++;
            },
            entitySetter: angular.noop
        };

        var cacheRules = [
            'path1',
            /path2(\/|).*/,
            function (path) {
                return path === 'path3';
            }
        ];
        var config = {
            cacheRules: cacheRules
        };
        testStorage = new StorageSrv(getterSetter.entityGetter, getterSetter.entitySetter, config);

        var PATH1 = 'path1';
        var PATH2 = 'path2';
        var PATH2_WITH_PREFIX = PATH2 + '/property';
        var PATH3 = 'path3';
        var PATH4 = 'path4';

        var expectedCallTimes = 0;

        function _doubleGetData(path) {
            expectedCallTimes += 2;
            testStorage.get(path);
            $rootScope.$digest();
            testStorage.get(path);
            $rootScope.$digest();
        }

        _doubleGetData(PATH1);
        _doubleGetData(PATH2);
        _doubleGetData(PATH2_WITH_PREFIX);
        _doubleGetData(PATH3);
        expectedCallTimes++;
        testStorage.get(PATH4);
        $rootScope.$digest();
        testStorage.get(PATH4);
        $rootScope.$digest();

        expect(timeCalled).toBe(expectedCallTimes);
    });
});
