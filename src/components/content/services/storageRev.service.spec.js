/* eslint angular/no-private-call: 0 */
/* eslint object-shorthand: 0 */
describe('testing service "StorageRevSrv":', function () {
    beforeEach(angular.mock.module('actWebLogin', 'pascalprecht.translate', 'actShared'));

    beforeEach(angular.mock.module('pascalprecht.translate', function ($translateProvider) {
        $translateProvider.translations('en', {});
    }));

    var defer, withResolve = false;

    beforeEach(angular.mock.module(function ($provide) {
        $provide.service('ContentSrv', function ($q) {
            return {
                getContent: function () {
                    defer = $q.defer();
                    if (withResolve) {
                        defer.resolve(angular.toJson({ id: 32 }));
                    }
                    return defer.promise;
                },
                getAllContentIdsByKey: function () {
                    return $q.when(['tutorial10', 'tutorial11', 'tutorial12']);
                }
            };
        });

        $provide.service('EstimatedScoreHelperSrv', function () {
            this.init = function () {

            };
        });

        $provide.service('EstimatedScoreSrv', function () {
            return {};
        });
    }));

    var StorageRevSrv, $rootScope, $log, ContentSrv;
    beforeEach(inject([
        '$injector',
        function ($injector) {
            StorageRevSrv = $injector.get('StorageRevSrv');
            $rootScope = $injector.get('$rootScope');
            $log = $injector.get('$log');
            ContentSrv = $injector.get('ContentSrv');
        }]));

    var data = {
        exerciseId: 1280,
        exerciseType: 'section'
    };

    it('when promise resolve with object then it will return only the value as an object and not as a json', function () {
        var result = StorageRevSrv.getContent(data);
        var promiseResult = function (resp) {
            expect(resp).toEqual(jasmine.any(Object));
            expect(resp.id).toEqual(jasmine.any(Number));
            expect(resp.id).toEqual(32);
        };
        result.then(promiseResult);
        defer.resolve(angular.toJson({ id: 32 }));
        $rootScope.$digest();
        expect(result).toEqual(jasmine.any(Object));
    });

    it('when promise reject with object then it will log error via $log', function () {
        spyOn($log, 'error').and.callThrough();
        var errorObj = {
            error: 'error: can\'t get content'
        };
        var result = StorageRevSrv.getContent(errorObj);
        var promiseResult = function (resp) {
            expect(resp).toEqual(jasmine.any(Object));
        };
        result.catch(promiseResult);
        defer.reject(errorObj);
        $rootScope.$digest();
        expect(result).toEqual(jasmine.any(Object));
        expect($log.error).toHaveBeenCalledWith(errorObj);
    });

    it('when getAllContentByKey get key it should call getAllContentIdsByKey and getContent on ContentSrv and returns 3 resolve content item', function () {
        spyOn(ContentSrv, 'getAllContentIdsByKey').and.callThrough();
        spyOn(ContentSrv, 'getContent').and.callThrough();
        withResolve = true;
        var result = StorageRevSrv.getAllContentByKey('tutorial');
        var promiseResult = function (resp) {
            expect(resp).toEqual(jasmine.any(Array));
            expect(resp.length).toEqual(3);
        };
        result.then(promiseResult);
        $rootScope.$digest();
        expect(ContentSrv.getAllContentIdsByKey).toHaveBeenCalledWith('tutorial');
        expect(ContentSrv.getContent).toHaveBeenCalled();
    });
});
