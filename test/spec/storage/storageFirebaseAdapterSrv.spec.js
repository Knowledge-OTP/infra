xdescribe('testing service "storageFirebaseAdapter":', function () {
    'use strict';

    beforeEach(function () {
        MockFirebase.override();
    });

    beforeEach(module('env.mock', 'znk.infra.storage', 'htmlTemplates'));

    var $rootScope, StorageFirebaseAdapter, StorageSrv, $timeout;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            $rootScope = $injector.get('$rootScope');
            StorageFirebaseAdapter = $injector.get('StorageFirebaseAdapter');
            StorageSrv = $injector.get('StorageSrv');
            $timeout = $injector.get('$timeout');
        }
    ]));

    var adapter, syncedAdapter;
    beforeEach(function () {
        adapter = new StorageFirebaseAdapter(endpoint);
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

        syncedAdapter = Object.create(adapter);

        syncedAdapter.get = function (path) {
            var val;
            adapter.get(path).then(function (_val) {
                val = _val;
            });
            var pathRef = adapter.__refMap[path];
            if (pathRef) {
                pathRef.flush();
            }
            $rootScope.$digest();
            return val;
        };
        syncedAdapter.set = function (path, newEntity) {
            var setProm = adapter.set(path, newEntity);
            $rootScope.$digest();
            var pathRef = adapter.__refMap[path];
            if (pathRef) {
                pathRef.flush();
            }
            return setProm;
        };

        syncedAdapter.update = function (path, newEntity) {
            var setProm = adapter.update(path, newEntity);
            $rootScope.$digest();
            var pathRef = adapter.__refMap[path];
            if (pathRef) {
                pathRef.flush();
            }
            return setProm;
        };
    });

    var actions = {};

    actions.syncAdapter = function (adapter) {
        adapter.__refMap.rootRef.changeAuthState({
            uid: 1
        });
        adapter.__refMap.rootRef.flush();

        return {
            get: function (path) {
                var val;
                adapter.get(path).then(function (_val) {
                    val = _val;
                });
                var pathRef = adapter.__refMap[path];
                if (pathRef) {
                    pathRef.flush();
                }
                $rootScope.$digest();
                return val;
            },
            set: function (path, newEntity) {
                var setProm = adapter.set(path, newEntity);
                $rootScope.$digest();
                var pathRef = adapter.__refMap[path];
                if (pathRef) {
                    pathRef.flush();
                }
                return setProm;
            },
            update: function (path, newEntity) {
                var setProm = adapter.update(path, newEntity);
                $rootScope.$digest();
                var pathRef = adapter.__refMap[path];
                if (pathRef) {
                    pathRef.flush();
                }
                return setProm;
            },
            __refMap: adapter.__refMap
        };
    };

    var endpoint = 'https://znk-test.firebaseio.com';

    it('when calling update then it should update firebase db', function () {
        var path = 'testPath';

        var newEntityVal = {
            test: 'test'
        };
        syncedAdapter.set(path, newEntityVal);
        var currEntityVal = syncedAdapter.get(path);
        expect(currEntityVal).toEqual(newEntityVal);
    });

    it('when setting simultaneously 2 objects then firebase db should be updated accordingly', function () {
        var savedDataMap = {
            a: {
                a: 1
            },
            b: {
                b: 2
            }
        };

        syncedAdapter.update(angular.copy(savedDataMap));
        syncedAdapter.__refMap.rootRef.flush();
        var aVal = syncedAdapter.get('a');
        var bVal = syncedAdapter.get('b');
        expect(aVal).toEqual(savedDataMap.a);
        expect(bVal).toEqual(savedDataMap.b);
    });

    it('when calling set then it should update firebase db', function () {
        var path = 'testPath';

        var newEntityVal = {
            test: 'test'
        };
        syncedAdapter.set(path, newEntityVal);
        var currEntityVal = syncedAdapter.get(path);
        expect(currEntityVal).toEqual(newEntityVal);
    });

    it('when saving entity then all undefined and start with $ properties should be deleted and not stored in firebase', function () {
        var path = 'testPath';

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

        syncedAdapter.set(path, value);
        var currValue = syncedAdapter.get(path);
        expect(currValue).toEqual(expectedResult);
    });

    it('when value has a storageSrv time stamp variable then it should be changed to firebase time stamp', function () {
        var path = 'pathTo';

        var savedDataMap = {
            a: StorageSrv.variables.currTimeStamp
        };

        syncedAdapter.set(path, angular.copy(savedDataMap));

        var aVal = syncedAdapter.get(path).a;

        expect(aVal).toEqual(jasmine.any(Number));
    });

    it('when registering to "value" event then once value is updated "value" event callback should be invoked', function () {
        var path = 'pathTo';

        var receivedEventValue;
        syncedAdapter.onEvent(StorageSrv.EVENTS.VALUE, path, function (val) {
            receivedEventValue = val;
        });

        var expectedResult = {
            a: 1,
            b: 2
        };
        syncedAdapter.set(path, expectedResult);
        $timeout.flush();

        expect(receivedEventValue).toEqual(expectedResult);
    });

    it('given registered to "value" event when unregistering then when value is updated the event callback should not be ' +
        'invoked', function () {
        var path = 'pathTo';

        var receivedEventValue;

        function cb(val) {
            receivedEventValue = val;
        }

        syncedAdapter.onEvent(StorageSrv.EVENTS.VALUE, path, cb);
        syncedAdapter.offEvent(StorageSrv.EVENTS.VALUE, path, cb);
        var newPathVal = {
            a: 1,
            b: 2
        };
        syncedAdapter.set(path, newPathVal);
        $timeout.flush();

        expect(receivedEventValue).toBeUndefined();
    });

    it('when registered 2 callbacks to "value" event, 2 callbacks should be triggered ', function () {
        var path = 'pathTo';
        var receivedEventValue = 0;
        var expectedResult = 2;

        function cb() {
            receivedEventValue++;
        }

        adapter.onEvent(StorageSrv.EVENTS.VALUE, path, cb);
        adapter.onEvent(StorageSrv.EVENTS.VALUE, path, cb);
        var pathRef = adapter.__refMap[path];
        pathRef.flush();
        $timeout.flush();

        expect(receivedEventValue).toBe(expectedResult);
    });
});
