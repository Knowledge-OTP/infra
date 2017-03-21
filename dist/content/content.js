(function (angular) {
    'use strict';

    angular.module('znk.infra.content', []);
})(angular);
'use strict';

(function (angular) {

    function ContentSrv() {

        var setContentFuncRef;

        this.setContent = function(func) {
            setContentFuncRef = func;
        };

        this.$get = ['$q', '$log', '$injector', function($q, $log, $injector) {

            function _getContentData() {
                var contentData;
                return function() {
                    return {
                        get: function() {
                            if(!contentData) {
                                return _getContentFunc().then(function(dataObj) {
                                    contentData = dataObj;
                                    if (angular.isFunction(contentData.updatePublication)) {
                                        contentData.updatePublication(function(updatePublication) {
                                            if(updatePublication.key() !== contentData.key) {
                                                contentData.latestRevisions = updatePublication.val();
                                                contentData.key = updatePublication.key();
                                            }
                                        });
                                    }
                                    return dataObj;
                                });
                            }
                            return $q.when(contentData);
                        },
                        set: function(practiceName, newData) {
                            contentData.revisionManifest[practiceName] = newData;
                            return $q.when({ rev: newData.rev, status: 'update'});
                        }
                    };
                };
            }

            var contentFunc;

            var contentDataFunc = _getContentData();

            var ContentSrv = {};

            var REV_STATUES = {
                NEW: 'new',
                OLD: 'old',
                SAME: 'same'
            };

            function _getContentFunc(){
                if (!contentFunc){
                    contentFunc = $injector.invoke(setContentFuncRef);
                }
                return contentFunc;
            }

            ContentSrv.getRev = function(practiceName, dataObj) {
                var getRevisionProm = $q.when(false);

                if (angular.isFunction(dataObj.revisionManifestGetter)) {
                    getRevisionProm = dataObj.revisionManifestGetter().then(function (result) {
                        dataObj.revisionManifest = result;
                        return result;
                    });
                }

                return getRevisionProm.then(function () {
                    if (!dataObj || !dataObj.revisionManifest || !dataObj.latestRevisions) {
                        return $q.when({error: 'No Data Found! ', data: dataObj});
                    }

                    var userManifest = dataObj.revisionManifest[practiceName];
                    var publicationManifest = dataObj.latestRevisions[practiceName];
                    var newRev;

                    if (angular.isUndefined(publicationManifest)) {
                        return $q.when({error: 'Not Found', data: dataObj});
                    }

                    function _getRevStatusObj(rev, status) {
                        return { rev: rev, status: status };
                    }

                    function _isUserHasOldRev() {
                       return userManifest.rev < publicationManifest.rev;
                    }

                    function _isUserHasSameRev() {
                        return userManifest.rev === publicationManifest.rev;
                    }

                    if (!userManifest) { // if user has no rev yet, set the latest

                        newRev = _getRevStatusObj(publicationManifest.rev, REV_STATUES.NEW);

                    } else if(publicationManifest.takeLatest) { // if on manifest has takeLatest, then take latest and set if it's not the same on user

                        newRev = _getRevStatusObj(publicationManifest.rev, _isUserHasSameRev() ? REV_STATUES.SAME : REV_STATUES.NEW );

                    } else if (_isUserHasOldRev()) {

                        newRev = _getRevStatusObj(userManifest.rev, REV_STATUES.OLD);

                    } else if (_isUserHasSameRev()) {

                        newRev = _getRevStatusObj(publicationManifest.rev, REV_STATUES.SAME);

                    } else {

                        $log.error('ContentSrv: getContent: user revision is weird! for practice: '+ practiceName +' rev: ' + userManifest.rev);
                        newRev = _getRevStatusObj(publicationManifest.rev, REV_STATUES.NEW);

                    }

                    return newRev;
                });
            };

            ContentSrv.setRev = function(practiceName, newRev) {
                return contentDataFunc().set(practiceName, { rev: newRev });
            };

            // { exerciseId: 10, exerciseType: 'drill' }
            ContentSrv.getContent = function(pathObj) {

                if(!pathObj || !pathObj.exerciseType) {
                    return $q.reject({ error: 'Error: getContent require exerciseType!' });
                }

                var path = (pathObj.exerciseId) ? pathObj.exerciseType+pathObj.exerciseId : pathObj.exerciseType;

                return contentDataFunc().get().then(function(dataObj) {

                    return ContentSrv.getRev(path, dataObj).then(function(result) {

                        if(result.error) {
                            return $q.when(result);
                        }

                        if(!dataObj.contentRoot) {
                            return $q.when({ error: 'Error: getContent require contentRoot to be defined in config phase!' });
                        }

                        if(!dataObj.userRoot) {
                            return $q.when({ error: 'Error: getContent require userRoot to be defined in config phase!' });
                        }

                        if(result.status === 'new') {
                            ContentSrv.setRev(path, result.rev).then(function() {
                                var userPath = dataObj.userRoot+'/revisionManifest/'+path;
                                var setUserRevision = dataObj.create(userPath);
                                setUserRevision.set({ rev : result.rev });
                            });
                        }

                        var contentPath = dataObj.contentRoot+path+'-rev-'+result.rev;

                        var content =  dataObj.create(contentPath);

                        return content.get();
                    });
                });
            };

            ContentSrv.getAllContentIdsByKey = function(key) {
                var arrayOfKeys = [];
                return contentDataFunc().get().then(function(dataObj) {
                    for(var objKey in dataObj.latestRevisions) {
                        if(dataObj.latestRevisions.hasOwnProperty(objKey) && objKey.indexOf(key) !== -1) {
                            arrayOfKeys.push(objKey);
                        }
                    }
                    return arrayOfKeys;
                });
            };

            return ContentSrv;
        }];
    }

    angular.module('znk.infra.content').provider('ContentSrv', ContentSrv);

})(angular);

(function (angular) {
    'use strict';

    /**
     *  StorageRevSrv:
     *      wrapper for ContentSrv, use for error handling and parsing data.
     *      getContent(data={ exerciseType: 'type', exerciseId: '20' });
     *      getAllContentByKey('type');
     */
    angular.module('znk.infra.content').service('StorageRevSrv', [
        'ContentSrv', '$log', '$q',
        function (ContentSrv, $log, $q) {
            'ngInject';

            var self = this;

            this.getContent = function (data) {
                return ContentSrv.getContent(data).then(function (result) {
                    return angular.fromJson(result);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            this.getAllContentByKey = function (key) {
                var resultsProm = [];
                return ContentSrv.getAllContentIdsByKey(key).then(function (results) {
                    angular.forEach(results, function (keyValue) {
                        resultsProm.push(self.getContent({ exerciseType: keyValue }));
                    });
                    return $q.all(resultsProm);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };
        }
    ]);
})(angular);

angular.module('znk.infra.content').run(['$templateCache', function ($templateCache) {

}]);
