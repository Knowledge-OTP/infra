(function (angular) {
    'use strict';

    angular.module('znk.infra', [
        'znk.infra.config',
        'znk.infra.pngSequence',
        'znk.infra.enum',
        'znk.infra.svgIcon',
        'znk.infra.general',
        'znk.infra.scroll',
        'znk.infra.content',
        'znk.infra.znkExercise',
        'znk.infra.storage',
        'znk.infra.utility',
        'znk.infra.exerciseResult',
        'znk.infra.contentAvail',
        'znk.infra.popUp',
        'znk.infra.estimatedScore',
        'znk.infra.stats',
        'znk.infra.hint',
        'znk.infra.znkTimeline',
        'znk.infra.analytics',
        'znk.infra.deviceNotSupported',
        'znk.infra.user',
        'znk.infra.exams',
        'znk.infra.scoring',
        'znk.infra.category'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.analytics', []);
})(angular);

/**
 * znkAnalyticsSrv
 *
 *   api:
 *      getEventsConst
 *      getDebugMode
 *      { handlers you register in config phase }
 */
(function (angular) {
    'use strict';

    var _eventsConst = {
        appOpen: 'App Open',
        appClose: 'App Close',
        signUp: 'Sign Up',
        login: 'Login',
        getStartedClicked: 'Get Started Clicked',
        diagnosticStart: 'Diagnostic Start',
        diagnosticEnd: 'Diagnostic End',
        diagnosticSectionStarted: 'Diagnostic Section Started',
        diagnosticSectionCompleted: 'Diagnostic Section Completed',
        diagnosticsSkipAudioClicked: 'Diagnostics Skip Audio Clicked',
        workoutStarted: 'Workout Started',
        workoutCompleted: 'Workout Completed',
        tutorialViewed: 'Tutorial Viewed',
        tutorialClosed: 'Tutorial Closed',
        flashcardStackViewed: 'Flashcard Stack Viewed',
        flashcardStackCompleted: 'Flashcard stack Completed',
        performanceBannerClicked: 'Performance Banner Clicked',
        performanceClosed: 'Performance Closed',
        tipsAndTricksBannerClicked: 'Tips & Tricks Banner Clicked',
        flashcardsBannerClicked: 'Flashcards Banner Clicked',
        fullTestsBannerClicked: 'Full tests Banner Clicked',
        miniTestsBannerClicked: 'Mini Tests Banner Clicked',
        writtenSolutionClicked: 'Written Solution Clicked',
        writtenSolutionClosed: 'Written Solution Closed',
        sectionStarted: 'Section Started',
        sectionCompleted: 'Section Completed',
        testCompleted: 'Test Completed',
        exception: 'Exception',
        upgradeAppVersion: 'Upgrade App Version',
        firstTimeAppOpen: 'First Time App Open',
        appRatePopupOpened: 'App Rate Popup Opened',
        rateButtonClicked: 'Rate Button Clicked',
        cancelRateButtonClicked: 'Cancel Rate Button Clicked',
        laterRateButtonClicked: 'Later Rate Button Clicked',
        purchaseModalOpened: 'Purchase Modal opened',
        purchaseOrderStarted: 'Order Started',
        purchaseOrderPending: 'Order Pending',
        purchaseOrderCompleted: 'Order Completed',
        purchaseOrderCancelled: 'Order Cancelled'
    };

    angular.module('znk.infra.analytics').provider('znkAnalyticsSrv', function () {

        var debug = false;
        var eventsHandler;

        this.setDebugMode = function(mode) {
            debug = mode;
        };

        this.extendEventsConst = function(moreEvents) {
            angular.extend(_eventsConst, moreEvents);
        };

        this.setEventsHandler = function(_eventsHandler) {
            eventsHandler = _eventsHandler;
        };

        this.$get = ['$log', '$injector', 'znkAnalyticsUtilSrv', function($log, $injector, znkAnalyticsUtilSrv) {

            var api = {
                getEventsConst: function() {
                    if(!_eventsConst) {
                        $log.error('znkAnalyticsSrv getEventsConst:  _eventsConst is missing!');
                    }
                    return _eventsConst;
                },
                getDebugMode: function() {
                    return debug;
                }
            };

            if(!eventsHandler) {
                $log.error('znkAnalyticsSrv eventsHandler is missing!');
            }

            var eventsFn = $injector.invoke(eventsHandler);
            znkAnalyticsUtilSrv.events.const = _eventsConst;

            angular.forEach(eventsFn, function(value, key) {
                var fn = znkAnalyticsUtilSrv.events.list[key];
                if(fn) {
                    api[key] = fn.bind(null, eventsFn[key]);
                } else {
                    $log.error('znkAnalyticsSrv key is missing in infra or incorrect! key:', key);
                }
            });

            return api;
        }];

    }).run(['znkAnalyticsSrv', '$window', function(znkAnalyticsSrv, $window) {
        var isDebugMode = znkAnalyticsSrv.getDebugMode();
        if(isDebugMode) {
            $window.znkAnalyticsEvents = znkAnalyticsSrv.getEventsConst();
        }
    }]);
})(angular);

(function (angular) {
    'use strict';

    function _getTimeInDay() {
        var date = new Date();
        var hours = date.getHours();
        var timeStr;

        if(hours >= 6 && hours < 12) {
            timeStr = 'Morning';
        } else if(hours >= 12 && hours < 18) {
            timeStr = 'Afternoon';
        } else if(hours >= 18 && hours < 24) {
            timeStr = 'Evening';
        } else if(hours >= 24 && hours < 6) {
            timeStr = 'Night';
        } else {
            timeStr = date.toString();
        }

        return timeStr;
    }

    function _getQuestionsStats(arr) {
        return arr.reduce(function(previousValue, currentValue) {
            if(currentValue.userAnswer) {
                if(currentValue.isAnsweredCorrectly) {
                    previousValue.correct++;
                } else {
                    previousValue.wrong++;
                }
            } else {
                previousValue.skip++;
            }
            return previousValue;
        },{ correct: 0, wrong: 0, skip: 0 });
    }

    angular.module('znk.infra.analytics').service('znkAnalyticsUtilSrv', ['$log', function ($log) {

        var self = this;

        function _extendProps(eventObj) {
            eventObj.props = eventObj.props || {};
            if(eventObj.dayTime) {
                eventObj.props.dayTime = _getTimeInDay();
            }
            if(eventObj.questionsArr) {
                eventObj.props = angular.extend({}, eventObj.props, _getQuestionsStats(eventObj.questionsArr));
            }
            return eventObj.props;
        }

        function _getNewEvent(eventObj) {
            var events = self.events.const;
            if(!events) {
                $log.error('znkAnalyticsUtilSrv events const not defined!', self.events);
                return;
            }
            var newEventObj = {};
            if(eventObj.eventName) {
                if(events[eventObj.eventName]) {
                    newEventObj.eventName = events[eventObj.eventName];
                } else if(eventObj.nameOnTheFly) {
                    newEventObj.eventName = eventObj.eventName;
                } else {
                    $log.error('znkAnalyticsUtilSrv eventName not matching any eky in events const key:', eventObj.eventName);
                }
            }
            newEventObj.props = _extendProps(eventObj);
            return newEventObj;
        }

        function _eventFn(fn, eventObj) {
            var newEventObj = _getNewEvent(eventObj);
            return fn(newEventObj);
        }

        this.events = {};

        this.events.list = {
            eventTrack: _eventFn,
            timeTrack: _eventFn,
            pageTrack: _eventFn,
            setUsername: _eventFn,
            setUserProperties: _eventFn
        };
    }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.auth').factory('AuthService',
        function () {
            'ngInject';

            var auth = {};

            return auth;
        });
})(angular);


/**
 * the HTML5 autofocus property can be finicky when it comes to dynamically loaded
 * templates and such with AngularJS. Use this simple directive to
 * tame this beast once and for all.
 *
 * Usage:
 * <input type="text" autofocus>
 *
 * License: MIT
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.autofocus')
        .directive('ngAutofocus', ['$timeout', function($timeout) {
            return {
                restrict: 'A',
                link : function(scope, element, attrs) {
                    if(scope.$eval(attrs.ngAutofocus)){
                        $timeout(function() {
                            element[0].focus();
                        }, 0, false);
                    }
                }
            };
        }]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.autofocus', ['znk.infra.enum', 'znk.infra.svgIcon']);
})(angular);

'use strict';

angular.module('znk.infra.category').service('CategoryService', function (StorageRevSrv, $q, EnumSrv)  {
        'ngInject';

    var categoryEnum = {};

    categoryEnum.categoryTypeEnum = new EnumSrv.BaseEnum([
        ['TUTORIAL', 1, 'tutorial'],
        ['EXERCISE', 2, 'exercise'],
        ['MINI_CHALLENGE', 3, 'miniChallenge'],
        ['SECTION', 4, 'section'],
        ['DRILL', 5, 'drill'],
        ['GENERAL', 6, 'general'],
        ['SPECIFIC', 7, 'specific'],
        ['STRATEGY', 8, 'strategy'],
        ['SUBJECT', 9, 'subject'],
        ['SUB_SCORE', 10, 'subScore'],
        ['TEST_SCORE', 11, 'testScore']
    ]);

        var self = this;
        this.get = function () {
            return StorageRevSrv.getContent({ exerciseType: 'category' });
        };

        var categoryMapObj;
        this.getCategoryMap = function () {
            if (categoryMapObj) {
                return $q.when(categoryMapObj);
            }
            return self.get().then(categories => {
                var categoryMap = {};
                angular.forEach(categories, item => {
                    categoryMap[item.id] = item;
                });
                categoryMapObj = categoryMap;
                return categoryMapObj;
            });
        };

        self.getCategoryData = function (categoryId) {
            return self.getCategoryMap().then(categoryMap => {
                return categoryMap[categoryId];
            });
        };

        self.getParentCategory = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var parentId = categories[categoryId].parentId;
                return categories[parentId];
            });
        };

        self.getSubjectIdByCategory = function (category) {
            if (category.typeId === categoryEnum.categoryTypeEnum.SUBJECT.enum) {
                return $q.when(category.id);
            }
            return self.getParentCategory(category.id).then(function (parentCategory) {
                return self.getSubjectIdByCategory(parentCategory);
            });
        };


        self.getTestScore = function (categoryId) {
            return self.getCategoryMap().then(function (categories) {
                var category = categories[categoryId];
                if (categoryEnum.categoryTypeEnum.TEST_SCORE.enum === category.typeId) {
                    return category;
                }
                return self.getTestScore(category.parentId);
            });
        };

        self.getAllGeneralCategories = (function () {
            var getAllGeneralCategoriesProm;
            return function () {
                if (!getAllGeneralCategoriesProm) {
                    getAllGeneralCategoriesProm = self.getCategoryMap().then(function (categories) {
                        var generalCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.categoryTypeEnum.GENERAL.enum) {
                                generalCategories[category.id] = category;
                            }
                        });
                        return generalCategories;
                    });
                }
                return getAllGeneralCategoriesProm;
            };
        })();

        self.getAllGeneralCategoriesBySubjectId = (function () {
            var getAllGeneralCategoriesBySubjectIdProm;
            return function (subjectId) {
                if (!getAllGeneralCategoriesBySubjectIdProm) {
                    getAllGeneralCategoriesBySubjectIdProm = self.getAllGeneralCategories().then(function (categories) {
                        var generalCategories = {};
                        var promArray = [];
                        angular.forEach(categories, function (generalCategory) {
                            var prom = self.getSubjectIdByCategory(generalCategory).then(function (currentCategorySubjectId) {
                                if (currentCategorySubjectId === subjectId) {
                                    generalCategories[generalCategory.id] = generalCategory;
                                }
                            });
                            promArray.push(prom);
                        });
                        return $q.all(promArray).then(function () {
                            return generalCategories;
                        });
                    });
                }
                return getAllGeneralCategoriesBySubjectIdProm;
            };
        })();

        self.getAllSpecificCategories = (function () {
            var getAllSpecificCategoriesProm;
            return function () {
                if (!getAllSpecificCategoriesProm) {
                    getAllSpecificCategoriesProm = self.getCategoryMap().then(function (categories) {
                        var specificCategories = {};
                        angular.forEach(categories, function (category) {
                            if (category.typeId === categoryEnum.categoryTypeEnum.SPECIFIC.enum) {
                                specificCategories[category.id] = category;
                            }
                        });
                        return specificCategories;
                    });
                }
                return getAllSpecificCategoriesProm;
            };
        })();
});

(function (angular) {
    'use strict';

    angular.module('znk.infra.category', ['znk.infra.storage', 'znk.infra.enum']);
})(angular);

'use strict';

angular.module('znk.infra.category').service('SubScoreSrv', function(CategoryService, $q, StorageRevSrv, SubjectEnum) {
    'ngInject';

    function _getSubScoreCategoryData() {
        return StorageRevSrv.getContent({
            exerciseId: null,
            exerciseType: 'subscoreCategory'
        });
    }

    function _getSubScoreData(subScoreId) {
        return _getSubScoreCategoryData().then(function (subScoresCategoryData) {
            return subScoresCategoryData[subScoreId];
        });
    }

    this.getSpecificCategorySubScores = function (specificCategoryId) {
        return CategoryService.getCategoryData(specificCategoryId).then(function (specificCategoryData) {
            var allProm = [];
            var subScoreKeys = ['subScore1Id', 'subScore2Id'];
            angular.forEach(subScoreKeys, function (subScoreKey) {
                var subScoreId = specificCategoryData[subScoreKey];
                if (subScoreId || subScoreId === 0) {
                    allProm.push(_getSubScoreData(subScoreId));
                }
            });
            return $q.all(allProm);
        });
    };

    this.getAllSubScoresBySubject = (function () {
        var getAllSubjectScoresBySubjectProm;
        return function () {
            function _getMathOrVerbalSubjectIdIfCategoryNotEssay(category) {
                return CategoryService.getSubjectIdByCategory(category).then(function (subjectId) {
                    if (subjectId === SubjectEnum.MATH.enum || subjectId === SubjectEnum.VERBAL.enum) {
                        return subjectId;
                    }
                });
            }

            if (!getAllSubjectScoresBySubjectProm) {
                var allSubScoresProm = _getSubScoreCategoryData();
                var allSpecificCategoriesProm = CategoryService.getAllSpecificCategories();

                getAllSubjectScoresBySubjectProm = $q.all([allSubScoresProm, allSpecificCategoriesProm]).then(function (res) {
                    var allSubScores = res[0];
                    var allSpecificCategories = res[1];
                    var subScorePerSubject = {};
                    subScorePerSubject[SubjectEnum.MATH.enum] = {};
                    subScorePerSubject[SubjectEnum.VERBAL.enum] = {};
                    var specificCategoryKeys = Object.keys(allSpecificCategories);
                    var promArray = [];
                    var subScoreKeys = ['subScore1Id', 'subScore2Id'];

                    angular.forEach(specificCategoryKeys, function (specificCategoryId) {
                        var specificCategory = allSpecificCategories[specificCategoryId];
                        var prom = _getMathOrVerbalSubjectIdIfCategoryNotEssay(specificCategory).then(function (subjectId) {
                            if (angular.isDefined(subjectId)) {
                                angular.forEach(subScoreKeys, function (subScoreKey) {
                                    var subScoreId = specificCategory[subScoreKey];
                                    if (subScoreId !== null && angular.isUndefined(subScorePerSubject[subjectId][subScoreKey])) {
                                        subScorePerSubject[subjectId][subScoreId] = allSubScores[subScoreId];
                                    }
                                });
                            }
                        });
                        promArray.push(prom);
                    });

                    return $q.all(promArray).then(function () {
                        return subScorePerSubject;
                    });
                });
            }

            return getAllSubjectScoresBySubjectProm;
        };
    })();

    this.getSubScoreData = _getSubScoreData;
});

(function (angular) {
    'use strict';

    angular.module('znk.infra.config').provider('InfraConfigSrv', [
        function () {
            var userDataFn,
                storages = {};

            this.setStorages = function(_globalStorageGetter, _studentStorageGetter, _teacherStorageGetter){
                storages.globalGetter = _globalStorageGetter;
                storages.studentGetter = _studentStorageGetter;
                storages.teacherGetter = _teacherStorageGetter;
            };

            this.setUserDataFn = function(_userDataFn) {
                userDataFn = _userDataFn;
            };

            this.$get = [
                '$injector', '$log', '$q',
                function ($injector, $log, $q) {
                    var InfraConfigSrv = {};

                    function _baseStorageGetter(name){
                        var storageGetterKey = name + 'Getter';
                        var storageGetter = storages[storageGetterKey];
                        if(!storageGetter ){
                            var errMsg = 'InfraConfigSrv: ' + name + ' Storage name was not defined';
                            $log.error(errMsg);
                            return $q.reject(errMsg);
                        }
                        return $q.when($injector.invoke(storageGetter));
                    }

                    InfraConfigSrv.getGlobalStorage = _baseStorageGetter.bind(InfraConfigSrv, 'global');

                    InfraConfigSrv.getStudentStorage = _baseStorageGetter.bind(InfraConfigSrv, 'student');

                    InfraConfigSrv.getTeacherStorage = _baseStorageGetter.bind(InfraConfigSrv, 'teacher');

                    InfraConfigSrv.getUserData = function(){
                        var userDataInjected;
                        if(!userDataFn){
                            $log.debug('InfraConfigSrv: auth fn name was not defined');
                            return;
                        }
                        userDataInjected = $injector.invoke(userDataFn);
                        return $q.when(userDataInjected);
                    };

                    return InfraConfigSrv;
                }
            ];
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.config', []);
})(angular);

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

        this.$get = ['$q', '$injector', function($q, $injector) {

            function _getContentData() {
                var contentData;
                return function() {
                    return {
                        get: function() {
                            if(!contentData) {
                                return _getContentFunc().then(function(dataObj) {

                                    contentData = dataObj;
                                    contentData.updatePublication(function(updatePublication) {
                                        if(updatePublication.key() !== contentData.key) {
                                            contentData.latestRevisions = updatePublication.val();
                                            contentData.key = updatePublication.key();
                                        }
                                    });
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

                    if (!userManifest) {
                        newRev = {rev: publicationManifest.rev, status: 'new'};
                    } else if (userManifest.rev < publicationManifest.rev) {
                        newRev = {rev: userManifest.rev, status: 'old'};
                    } else if (userManifest.rev === publicationManifest.rev) {
                        newRev = {rev: publicationManifest.rev, status: 'same'};
                    } else {
                        newRev = {error: 'failed to get revision!', data: dataObj};
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

                        var contentPath = dataObj.contentRoot+path+'-rev-'+result.rev;

                        var content =  dataObj.create(contentPath);

                        if(result.status === 'new') {
                            ContentSrv.setRev(path, result.rev).then(function() {
                                var userPath = dataObj.userRoot+'/revisionManifest/'+path;
                                var setUserRevision = dataObj.create(userPath);
                                setUserRevision.set({ rev : result.rev });
                            });
                        }

                        return content.get();

                    });
                });
            };

            ContentSrv.getAllContentIdsByKey = function(key) {
                var arrayOfKeys = [];
                return contentDataFunc().get().then(function(dataObj) {
                    for(var objKey in dataObj.latestRevisions) {
                       if(objKey.indexOf(key) !== -1) {
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

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail', ['znk.infra.config']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail').provider('ContentAvailSrv', [
        function () {

            var _specials;

            this.setSpecials = function(specialsObj) {
                _specials = specialsObj;
            };

            this.$get = ['$q', '$parse', '$injector', 'InfraConfigSrv', function($q, $parse, $injector, InfraConfigSrv) {

                var PURCHASED_ALL = 'all';

                var ContentAvailSrvObj = {};

                function getUserPurchaseData(){
                    return InfraConfigSrv.getStudentStorage().then(function(studentStorageSrv){
                        var purchaseDataPath = studentStorageSrv.variables.appUserSpacePath + '/purchase';
                        var defValues = {
                            daily: 0,
                            exam: {},
                            tutorial: {},
                            section: {},
                            subscription: {}
                        };
                        return studentStorageSrv.get(purchaseDataPath,defValues);
                    });
                }

                function getFreeContentData(){
                    return InfraConfigSrv.getStudentStorage().then(function(studentStorageSrv){
                        var freeContentPath = 'freeContent';
                        var defValues = {
                            daily: 0,
                            exam: {},
                            tutorial: {},
                            section: {},
                            specials: {}
                        };
                        return studentStorageSrv.get(freeContentPath,defValues);
                    });
                }

                function getUserSpecialsData(){
                    var specialsProm = false;
                    if(_specials) {
                        specialsProm = $injector.invoke(_specials);
                    }
                    return $q.when(specialsProm);
                }

                function idToKeyInStorage(id){
                    return 'id_' + id;
                }

                function _hasSubscription(subscriptionObj){
                    return subscriptionObj && subscriptionObj.expiryDate && subscriptionObj.expiryDate > Date.now();
                }

                function _baseIsEntityAvail(){
                    return $q.all([getUserPurchaseData(),getFreeContentData(), getUserSpecialsData()]).then(function(res){
                        var purchaseData = res[0];
                        var hasSubscription = _hasSubscription(purchaseData.subscription);
                        var earnedSpecialsObj = {
                            daily: 0,
                            exam: {},
                            section: {},
                            tutorial: {}
                        };
                        if(hasSubscription){
                            return true;
                        } else {
                            var specials = res[1].specials;
                            var specialsRes = res[2];
                            if(specialsRes) {
                                angular.forEach(specialsRes, function(specialVal, specialKey) {
                                    if(specials[specialKey] && specialVal === true) {
                                        angular.forEach(specials[specialKey], function(val, key) {
                                            if(val === PURCHASED_ALL) {
                                                earnedSpecialsObj[key] = val;
                                            } else {
                                                switch(key) {
                                                    case 'daily':
                                                        if(angular.isNumber(val)) {
                                                            earnedSpecialsObj.daily += val;
                                                        }
                                                        break;
                                                    case 'exam':
                                                        if(angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.exam = angular.extend(earnedSpecialsObj.exam, val);
                                                        }
                                                        break;
                                                    case 'section':
                                                        if(angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.section = angular.extend(earnedSpecialsObj.section, val);
                                                        }
                                                        break;
                                                    case 'tutorial':
                                                        if(angular.isObject(val) && !angular.isArray(val)) {
                                                            earnedSpecialsObj.tutorial = angular.extend(earnedSpecialsObj.tutorial, val);
                                                        }
                                                        break;
                                                }
                                            }
                                        });
                                    }
                                });
                            }
                            res.push(earnedSpecialsObj);
                            return res;
                        }
                    });
                }

                function _isContentOwned(contentData,pathArr){
                    var prefixPathArr = pathArr.slice(0, pathArr.length - 1);
                    var prefixPath = prefixPathArr.join('.');
                    var isAllOwned = $parse(prefixPath)(contentData) === PURCHASED_ALL;
                    if(isAllOwned){
                        return true;
                    }

                    var fullPath = pathArr.join('.');
                    return $parse(fullPath)(contentData);
                }

                ContentAvailSrvObj.hasSubscription = function hasSubscription() {
                    return getUserPurchaseData().then(function(purchaseData){
                        return _hasSubscription(purchaseData.subscription);
                    });
                };

                ContentAvailSrvObj.isDailyAvail = function isDailyAvail(dailyOrder){
                    if(!angular.isNumber(dailyOrder) || isNaN(dailyOrder)){
                        return $q.reject('daily order should be a number');
                    }
                    return _baseIsEntityAvail().then(function(res){
                        if(res === true){
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var isAllOwned = purchaseData.daily === PURCHASED_ALL || freeContent.daily === PURCHASED_ALL || earnedSpecials.daily === PURCHASED_ALL;
                        if(isAllOwned){
                            return true;
                        }

                        var maxAvailDailyOrder = (purchaseData.daily || 0) + (freeContent.daily || 0) + (earnedSpecials.daily || 0);
                        return dailyOrder <= maxAvailDailyOrder;
                    });
                };

                ContentAvailSrvObj.isExamAvail = function isExamAvail(examId){
                    return _baseIsEntityAvail().then(function(res){
                        if(res === true){
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var examPathArr = ['exam',idToKeyInStorage(examId)];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent,examPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials,examPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData,examPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;
                    });
                };

                ContentAvailSrvObj.isSectionAvail = function isSectionAvail(examId,sectionId){
                    return _baseIsEntityAvail().then(function(res){
                        if(res === true){
                            return true;
                        }

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];

                        var examKeyProp = idToKeyInStorage(examId);
                        var examPathArr = ['exam',examKeyProp];
                        var isExamPurchased = _isContentOwned(purchaseData,examPathArr);
                        if(isExamPurchased ){
                            return true;
                        }

                        var sectionKeyProp = idToKeyInStorage(sectionId);

                        var sectionPathArr = ['section',sectionKeyProp];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent,sectionPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials,sectionPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData,sectionPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;
                    });
                };

                ContentAvailSrvObj.isTutorialAvail = function isTutorialAvail(tutorialId){
                    return _baseIsEntityAvail().then(function(res) {
                        if (res === true) {
                            return true;
                        }

                        var tutorialKeyInStorage = idToKeyInStorage(tutorialId);

                        var purchaseData = res[0];
                        var freeContent = res[1];
                        var earnedSpecials = res[3];
                        var tutorialPathArr = ['tutorial',tutorialKeyInStorage];
                        var isOwnedViaFreeContent = _isContentOwned(freeContent,tutorialPathArr);
                        var isOwnedViaSpecials = _isContentOwned(earnedSpecials,tutorialPathArr);
                        var isOwnedViaPurchase = _isContentOwned(purchaseData,tutorialPathArr);

                        return isOwnedViaFreeContent || isOwnedViaSpecials || isOwnedViaPurchase;

                    });
                };

                ContentAvailSrvObj.getFreeContentDailyNum = function getFreeContentDailyNum() {
                    return getFreeContentData().then(function(freeContentData) {
                        return freeContentData.daily;
                    });
                };
                // api
                return ContentAvailSrvObj;
            }];
        }
    ]);
})(angular);  

(function (angular) {
    'use strict';

    angular.module('znk.infra.contentAvail', ['znk.infra.config']);
})(angular);

/**
 * Device Not Supported
 * This directive hides all content on the page and shows a message and an image
 * Parameters:
 * title
 * subtitle
 * image src to display
 * by default the message will show when the screen width is 1024px or below, this can be overridden by css at the application level
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.deviceNotSupported').directive('deviceNotSupported', ['ENV',
        function (ENV) {
            return {
                templateUrl: 'components/deviceNotSupported/deviceNotSupported.template.html',
                restrict: 'E',
                scope: {
                    title: '@',
                    subTitle: '@',
                    imageSrc: '@'
                },
                link: function (scope, element, attrs) {
                    if (ENV.debug) {
                        angular.element(element[0]).addClass('disabled');
                    } else {
                        scope.title = attrs.title;
                        scope.subTitle = attrs.subTitle;
                        scope.imageSrc = attrs.imageSrc;

                        scope.styleObj = {
                            'background-image' : 'url(' + scope.imageSrc + ')'
                        };
                    }
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.deviceNotSupported', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.enum', []);
})(angular);
'use strict';
(function (angular) {
    angular.module('znk.infra.enum').factory('EnumSrv', [
        function () {
            var EnumSrv = {};

            function BaseEnum(enumsArr) {
                var NAME_INDEX = 0;
                var ENUM_INDEX = 1;
                var VALUE_INDEX = 2;
                var self = this;
                enumsArr.forEach(function (item) {
                    self[item[NAME_INDEX]] = {
                        enum: item[ENUM_INDEX],
                        val: item[VALUE_INDEX]
                    };
                });
            }

            EnumSrv.BaseEnum = BaseEnum;

            BaseEnum.prototype.getEnumMap = function getEnumMap() {
                var enumsObj = this;
                var enumMap = {};
                var enumsPropKeys = Object.keys(enumsObj);
                for (var i in enumsPropKeys) {
                    var prop = enumsPropKeys[i];
                    var enumObj = enumsObj[prop];
                    enumMap[enumObj.enum] = enumObj.val;
                }
                return enumMap;
            };

            BaseEnum.prototype.getEnumArr = function getEnumArr() {
                var enumsObj = this;
                var enumArr = [];
                for (var prop in enumsObj) {
                    var enumObj = enumsObj[prop];
                    if (angular.isObject(enumObj)) {
                        enumArr.push(enumObj);
                    }
                }
                return enumArr;
            };

            BaseEnum.prototype.getValByEnum = function getValByEnum(id) {
                var enumsObj = this;
                var val;
                for (var prop in enumsObj) {
                  if (enumsObj.hasOwnProperty(prop)) {
                      var enumObj = enumsObj[prop];
                      if (enumObj.enum === id) {
                          val = enumObj.val;
                          break;
                      }
                  }
                }
                return val;
            };

            BaseEnum.prototype.getNameToEnumMap = function getValByEnum() {
                var enumsObj = this;
                var nameToEnumMap = {};

                var keys = Object.keys(enumsObj);
                keys.forEach(function(enumName){
                    var enumObj = enumsObj[enumName];
                    nameToEnumMap[enumName] = enumObj.enum;
                });

                return nameToEnumMap ;
            };

            EnumSrv.flashcardStatus = new BaseEnum([
                ['keep', 0, 'Keep'],
                ['remove', 1, 'Remove']
            ]);

            return EnumSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore', [
            'znk.infra.config',
            'znk.infra.znkExercise',
            'znk.infra.utility'
        ])
        .run([
            'EstimatedScoreEventsHandlerSrv',
            function (EstimatedScoreEventsHandlerSrv) {
                EstimatedScoreEventsHandlerSrv.init();
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreEventsHandlerSrv', function EstimatedScoreEventsHandler() {
        function pointsMap(correctWithinAllowedTimeFrame, correctAfterAllowedTimeFrame, wrongWithinAllowedTimeFrame, wrongAfterAllowedTimeFrame) {
            var ret = {};

            if (angular.isDefined(correctWithinAllowedTimeFrame)) {
                ret.correctWithin = correctWithinAllowedTimeFrame;
            }

            if (angular.isDefined(correctAfterAllowedTimeFrame)) {
                ret.correctAfter = correctAfterAllowedTimeFrame;
            }

            if (angular.isDefined(wrongWithinAllowedTimeFrame)) {
                ret.wrongWithin = wrongWithinAllowedTimeFrame;
            }

            if (angular.isDefined(wrongAfterAllowedTimeFrame)) {
                ret.wrongAfter = wrongAfterAllowedTimeFrame;
            }

            ret.unanswered = 0;

            return ret;
        }

        var diagnosticScoring = {};
        this.setDiagnosticScoring = function (diagnosticScoringData) {
            var keys = Object.keys(diagnosticScoringData);
            keys.forEach(function (questionDifficulty) {
                var scoringDataArr = diagnosticScoringData[questionDifficulty];
                diagnosticScoring[questionDifficulty] = pointsMap.apply(this, scoringDataArr);
            });
        };

        var exercisesRawScoring = {};
        this.setExerciseRawPoints = function (exerciseType, scoringData) {
            exercisesRawScoring[exerciseType] = pointsMap.apply(this, scoringData);
        };

        var eventProcessControl;
        this.setEventProcessControl = function(_eventProcessControl){
            eventProcessControl = _eventProcessControl;
        };

        this.$get = [
            '$rootScope', 'ExamTypeEnum', 'EstimatedScoreSrv', 'SubjectEnum', 'ExerciseTypeEnum', 'ExerciseAnswerStatusEnum', 'exerciseEventsConst', '$log', 'UtilitySrv', '$injector', '$q',
            function ($rootScope, ExamTypeEnum, EstimatedScoreSrv, SubjectEnum, ExerciseTypeEnum, ExerciseAnswerStatusEnum, exerciseEventsConst, $log, UtilitySrv, $injector, $q) {
                if (angular.equals({}, diagnosticScoring)) {
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                if (angular.equals({}, exercisesRawScoring)) {
                    $log.error('EstimatedScoreEventsHandlerSrv: diagnosticScoring was not set !!!');
                }

                var EstimatedScoreEventsHandlerSrv = {};

                var childScope = $rootScope.$new(true);

                function _basePointsGetter(pointsMap, answerStatus, withinAllowTime) {
                    var key;
                    if (answerStatus === ExerciseAnswerStatusEnum.unanswered.enum) {
                        key = 'unanswered';
                    } else {
                        key = answerStatus === ExerciseAnswerStatusEnum.correct.enum ? 'correct' : 'wrong';
                        key += withinAllowTime ? 'Within' : 'After';
                    }
                    return pointsMap[key];
                }

                function _getDiagnosticQuestionPoints(question, result) {
                    var pointsMap = diagnosticScoring[question.difficulty];
                    var answerStatus = result.isAnsweredCorrectly ? ExerciseAnswerStatusEnum.correct.enum : ExerciseAnswerStatusEnum.wrong.enum;
                    return _basePointsGetter(pointsMap, answerStatus, true);
                }

                function _diagnosticSectionCompleteHandler(section, sectionResult) {
                    var score = 0;

                    var questions = section.questions;
                    var questionsMap = UtilitySrv.array.convertToMap(questions);

                    sectionResult.questionResults.forEach(function (result, i) {
                        var question = questionsMap[result.questionId];
                        if (angular.isUndefined(question)) {
                            $log.error('EstimatedScoreEventsHandler: question for result is missing',
                                'section id: ', section.id,
                                'result index: ', i
                            );
                        } else {
                            score += _getDiagnosticQuestionPoints(question, result);
                        }
                    });
                    EstimatedScoreSrv.setDiagnosticSectionScore(score, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id);
                }

                function _getQuestionRawPoints(exerciseType, result) {
                    var isAnsweredWithinAllowedTime = !result.afterAllowedTime;

                    var answerStatus = ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum(result.isAnsweredCorrectly);

                    var rawPointsMap = exercisesRawScoring[exerciseType];
                    return _basePointsGetter(rawPointsMap, answerStatus, isAnsweredWithinAllowedTime);
                }

                function _calculateRawScore(exerciseType, exerciseResult) {
                    if (!exercisesRawScoring[exerciseType]) {
                        $log.error('EstimatedScoreEventsHandlerSrv: raw scoring not exits for the following exercise type: ' + exerciseType);
                    }

                    var questionResults = exerciseResult.questionResults;

                    var rawPoints = {
                        total: questionResults.length * exercisesRawScoring[exerciseType].correctWithin,
                        earned: 0
                    };

                    questionResults.forEach(function (result) {
                        rawPoints.earned += _getQuestionRawPoints(exerciseType, result);
                    });
                    return rawPoints;
                }

                function _shouldEventBeProcessed(exerciseType, exercise, exerciseResult){
                    if(!eventProcessControl){
                        return $q.when(true);
                    }

                    var shouldEventBeProcessed =$injector.invoke(eventProcessControl);
                    if(angular.isFunction(shouldEventBeProcessed )){
                        shouldEventBeProcessed = shouldEventBeProcessed(exerciseType, exercise, exerciseResult);
                    }
                    return $q.when(shouldEventBeProcessed);
                }

                childScope.$on(exerciseEventsConst.section.FINISH, function (evt, section, sectionResult, exam) {
                    _shouldEventBeProcessed(exerciseEventsConst.section.FINISH, section, sectionResult)
                        .then(function(shouldBeProcessed){
                            if(shouldBeProcessed){
                                var isDiagnostic = exam.typeId === ExamTypeEnum.DIAGNOSTIC.enum;
                                if (isDiagnostic) {
                                    _diagnosticSectionCompleteHandler(section, sectionResult);
                                }
                                var rawScore = _calculateRawScore(ExerciseTypeEnum.SECTION.enum, sectionResult);
                                EstimatedScoreSrv.addRawScore(rawScore, ExerciseTypeEnum.SECTION.enum, section.subjectId, section.id, isDiagnostic);
                            }
                        });
                });

                function _baseExerciseFinishHandler(exerciseType, evt, exercise, exerciseResult) {
                    _shouldEventBeProcessed(exerciseType, exercise, exerciseResult).then(function(shouldBeProcessed){
                        if(shouldBeProcessed){
                            var rawScore = _calculateRawScore(exerciseType, exerciseResult);
                            EstimatedScoreSrv.addRawScore(rawScore, exerciseType, exercise.subjectId, exercise.id);
                        }
                    });
                }

                angular.forEach(ExerciseTypeEnum, function(enumObj, enumName){
                    if(enumName !== 'SECTION'){
                        var enumLowercaseName = enumName.toLowerCase();
                        var evtName = exerciseEventsConst[enumLowercaseName].FINISH;
                        childScope.$on(evtName, _baseExerciseFinishHandler.bind(EstimatedScoreEventsHandlerSrv, enumObj.enum));
                    }
                });

                EstimatedScoreEventsHandlerSrv.init = angular.noop;

                return EstimatedScoreEventsHandlerSrv;
            }
        ];

    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.estimatedScore').service('EstimatedScoreHelperSrv', [
        'SubjectEnum', 'InfraConfigSrv', 'StorageSrv',
        function (SubjectEnum, InfraConfigSrv, StorageSrv) {
            var EstimatedScoreHelperSrv = this;

            // var StorageSrv = InfraConfigSrv.getStorageService();

            var ESTIMATE_SCORE_PATH = StorageSrv.variables.appUserSpacePath + '/estimatedScore';

            function _SetSubjectInitialVal(obj,initValue){
                var subjectKeys = Object.keys(SubjectEnum);
                for(var i in subjectKeys){
                    var subjectEnum = SubjectEnum[subjectKeys[i]];
                    obj[subjectEnum.enum] = angular.copy(initValue);
                }
            }

            EstimatedScoreHelperSrv.getEstimatedScoreData = function(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(ESTIMATE_SCORE_PATH).then(function(estimatedScore){
                        var defaultValues = {
                            estimatedScores: {},
                            sectionsRawScores:{},
                            exercisesRawScores: {},
                            processedExercises: []
                        };

                        _SetSubjectInitialVal(defaultValues.estimatedScores,[]);
                        _SetSubjectInitialVal(defaultValues.sectionsRawScores,[]);
                        var rawScoreInitialObject = {
                            total: 0,
                            earned: 0
                        };
                        _SetSubjectInitialVal(defaultValues.exercisesRawScores,rawScoreInitialObject);

                        angular.forEach(defaultValues, function(defaultVal, defaultValKey){
                            if(angular.isUndefined(estimatedScore[defaultValKey])){
                                estimatedScore[defaultValKey] = defaultVal ;
                            }

                            if(estimatedScore[defaultValKey] !== defaultVal && angular.isObject(defaultVal)){
                                var currVal = estimatedScore[defaultValKey];
                                angular.forEach(defaultVal, function(innerDefaultVal, innerDefaultValueKey){
                                    if(angular.isUndefined(currVal[innerDefaultValueKey])){
                                        currVal[innerDefaultValueKey] = innerDefaultVal;
                                    }
                                });
                            }
                        });

                        return estimatedScore;
                    });
                });
            };

            EstimatedScoreHelperSrv.setEstimateScoreData = function (newEstimateScoreData){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.set(ESTIMATE_SCORE_PATH,newEstimateScoreData);
                });
            };
        }
    ]);
})(angular);

'use strict';

(function (angular) {
    angular.module('znk.infra.estimatedScore').provider('EstimatedScoreSrv',function(){

        var subjectsRawScoreEdges;
        this.setSubjectsRawScoreEdges = function(_subjectsRawScoreEdges){
            subjectsRawScoreEdges = _subjectsRawScoreEdges;
        };

        var rawScoreToScoreFnGetter;
        this.setRawScoreToRealScoreFn = function(_rawScoreToScoreFnGetter){
            rawScoreToScoreFnGetter = _rawScoreToScoreFnGetter;
        };

        var minDiagnosticScore;
        var maxDiagnosticScore;
        this.setMinMaxDiagnosticScore = function(minScore, maxScore){
            minDiagnosticScore = minScore;
            maxDiagnosticScore = maxScore;
        };

        this.$get = [
            'EstimatedScoreHelperSrv', 'ExerciseTypeEnum', '$injector', '$q', 'SubjectEnum', '$log',
            function (EstimatedScoreHelperSrv, ExerciseTypeEnum, $injector, $q, SubjectEnum, $log) {
                if(!subjectsRawScoreEdges){
                    $log.error('EstimatedScoreSrv: subjectsRawScoreEdges was not set');
                }

                if(!rawScoreToScoreFnGetter){
                    $log.error('EstimatedScoreSrv: rawScoreToScoreFnGetter was not set !!!');
                }

                var processingData = $q.when();

                var EstimatedScoreSrv = {};

                function _baseGetter(key, subjectId) {
                    return processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScore) {
                            if (angular.isUndefined(subjectId)) {
                                return estimatedScore[key];
                            }
                            return estimatedScore[key][subjectId];
                        });
                    });
                }

                function _calculateNormalizedRawScore(sectionSubjectRawScores, exerciseSubjectRawScore, subjectId) {
                    var sectionsWithWeightTotalPoints = 0;
                    var sectionsWithWeightEarnedPoints = 0;
                    var sectionsTotalPoints = 0;
                    sectionSubjectRawScores.forEach(function (sectionRawScore, index) {
                        sectionsTotalPoints += sectionRawScore.total;
                        var multiBy = +index + 1;
                        sectionsWithWeightTotalPoints += sectionRawScore.total * multiBy;
                        sectionsWithWeightEarnedPoints += sectionRawScore.earned * multiBy;
                    });
                    var combinedSectionRawScore = {
                        total: sectionsTotalPoints,
                        earned: sectionsTotalPoints * sectionsWithWeightEarnedPoints / sectionsWithWeightTotalPoints
                    };
                    if(isNaN(combinedSectionRawScore.earned)){
                        combinedSectionRawScore.earned = 0;
                    }

                    var rawScore = (2 / 3) * combinedSectionRawScore.earned + (1 / 3) * exerciseSubjectRawScore.earned;
                    var maxRawScore = (2 / 3) * combinedSectionRawScore.total + (1 / 3) * exerciseSubjectRawScore.total;
                    var subjectRawScoreEdges = subjectsRawScoreEdges[subjectId];
                    if(angular.isUndefined(subjectRawScoreEdges)){
                        $log.error('EstimatedScoreSrv: subjectRawScoreEdges was not defined for the following subject: ' + subjectId);
                    }
                    var normalizedScore = subjectRawScoreEdges.max * rawScore / maxRawScore;
                    return Math.max(normalizedScore, subjectRawScoreEdges.min);//verify result is higher than min
                }

                function _calculateNewEstimatedScore(subjectId, normalizedRawScore, currEstimatedScore, addLimitToNewEstimatedScore) {
                    return _getScoreByRawScore(subjectId, normalizedRawScore).then(function (newEstimatedScore) {
                        if (!currEstimatedScore) {
                            return newEstimatedScore;
                        }

                        if (addLimitToNewEstimatedScore && Math.abs(newEstimatedScore - currEstimatedScore) > (newEstimatedScore * 0.05)) {
                            return currEstimatedScore + (newEstimatedScore - currEstimatedScore > 0 ? 1 : -1) * newEstimatedScore * 0.05;
                        }
                        return +newEstimatedScore.toFixed(2);
                    });
                }

                function _isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId) {
                    var exerciseKey = exerciseType + '_' + exerciseId;
                    if (estimatedScoreData.processedExercises.indexOf(exerciseKey) !== -1) {
                        return true;
                    }
                    estimatedScoreData.processedExercises.push(exerciseKey);
                }

                var _getScoreByRawScore = (function (){
                    var rawScoreToScoreFn = $injector.invoke(rawScoreToScoreFnGetter);
                    return function(subjectId, normalizedRawScore){
                        return $q.when(rawScoreToScoreFn(subjectId,normalizedRawScore));
                    };
                })();

                EstimatedScoreSrv.getEstimatedScores = _baseGetter.bind(this, 'estimatedScores');

                EstimatedScoreSrv.getSectionsRawScores = _baseGetter.bind(this, 'sectionsRawScores');

                EstimatedScoreSrv.getExercisesRawScore = _baseGetter.bind(this, 'exercisesRawScores');

                EstimatedScoreSrv.getLatestEstimatedScore = function(subjectId){
                    return _baseGetter('estimatedScores',subjectId).then(function(allScoresOrScoreForSubject){
                        if(angular.isDefined(subjectId)){
                            if(!allScoresOrScoreForSubject.length){
                                return {};
                            }
                            return allScoresOrScoreForSubject[allScoresOrScoreForSubject.length - 1];
                        }
                        var latestScoresPerSubject = {};
                        angular.forEach(allScoresOrScoreForSubject,function(scoresForSubject,subjectId){
                            latestScoresPerSubject[subjectId] = scoresForSubject.length ? scoresForSubject[scoresForSubject.length -1] : {};
                        });
                        return latestScoresPerSubject;
                    });
                };

                EstimatedScoreSrv.setDiagnosticSectionScore = function (score, exerciseType, subjectId, exerciseId) {
                    processingData = processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                            //score was already set
                            if (estimatedScoreData.estimatedScores[subjectId].length) {
                                var errMsg = 'Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId;
                                $log.info(errMsg);
                                return $q.reject(errMsg);
                            }

                            score = Math.max(minDiagnosticScore, Math.min(maxDiagnosticScore, score));
                            estimatedScoreData.estimatedScores[subjectId].push({
                                exerciseType: exerciseType,
                                exerciseId: exerciseId,
                                score: score,
                                time: Date.now()
                            });
                            return EstimatedScoreHelperSrv.setEstimateScoreData(estimatedScoreData).then(function () {
                                return estimatedScoreData.estimatedScores[subjectId][estimatedScoreData.estimatedScores[subjectId].length - 1];
                            });
                        }).catch(function(errMsg){
                            $log.info(errMsg);
                        });
                    });
                    return processingData;
                };

                EstimatedScoreSrv.addRawScore = function (rawScore, exerciseType, subjectId, exerciseId, isDiagnostic) {
                    processingData = processingData.then(function(){
                        return EstimatedScoreHelperSrv.getEstimatedScoreData().then(function (estimatedScoreData) {
                            if (_isExerciseAlreadyProcessed(estimatedScoreData, exerciseType, exerciseId)) {
                                var errMsg = 'Exercise already processed ' + 'type ' + exerciseType + ' id ' + exerciseId;
                                return $q.reject(errMsg);
                            }
                            if (exerciseType === ExerciseTypeEnum.SECTION.enum) {
                                var sectionSubjectRowScores = estimatedScoreData.sectionsRawScores[subjectId];
                                var newSectionSubjectRawScore = {
                                    exerciseType: exerciseType,
                                    exerciseId: exerciseId,
                                    time: Date.now()
                                };
                                angular.extend(newSectionSubjectRawScore, rawScore);
                                sectionSubjectRowScores.push(newSectionSubjectRawScore);
                            } else {
                                var exerciseSubjectRawScore = estimatedScoreData.exercisesRawScores[subjectId];
                                exerciseSubjectRawScore.exerciseType = exerciseType;
                                exerciseSubjectRawScore.exerciseId = exerciseId;
                                exerciseSubjectRawScore.time = Date.now();
                                exerciseSubjectRawScore.total += rawScore.total;
                                exerciseSubjectRawScore.earned += rawScore.earned;
                            }

                            if (!isDiagnostic) {
                                var normalizedRawScore = _calculateNormalizedRawScore(estimatedScoreData.sectionsRawScores[subjectId], estimatedScoreData.exercisesRawScores[subjectId], subjectId);
                                var estimatedScoresForSpecificSubject = estimatedScoreData.estimatedScores[subjectId];
                                var currEstimatedScore = estimatedScoresForSpecificSubject[estimatedScoresForSpecificSubject.length - 1] || {};
                                return _calculateNewEstimatedScore(subjectId, normalizedRawScore, currEstimatedScore.score, exerciseType !== ExerciseTypeEnum.SECTION.enum).then(function (newEstimatedScore) {
                                    estimatedScoreData.estimatedScores[subjectId].push({
                                        exerciseType: exerciseType,
                                        exerciseId: exerciseId,
                                        score: newEstimatedScore,
                                        time: Date.now()
                                    });
                                    return estimatedScoreData;
                                });
                            }
                            return estimatedScoreData;
                        }).then(function (estimatedScoreData) {
                            return EstimatedScoreHelperSrv.setEstimateScoreData(estimatedScoreData);
                        }).catch(function(errMsg){
                            $log.info(errMsg);
                        });
                    });
                    return processingData;
                };

                return EstimatedScoreSrv;
            }];
    });
})(angular);

"use strict";
angular.module('znk.infra.exams').service('ExamSrv', function(StorageRevSrv, $q, ContentAvailSrv, $log) {
        'ngInject';

        var self = this;

        function _getExamOrder() {
            return StorageRevSrv.getContent({
                exerciseType: 'personalization'
            }).then(function (personalizationData) {
                var errorMsg = 'ExamSrv getExamOrder: personalization.examOrder is not array or empty!';
                if (!angular.isArray(personalizationData.examOrder) || personalizationData.examOrder.length === 0) {
                    $log.error(errorMsg);
                    return $q.reject(errorMsg);
                }
                return personalizationData.examOrder;
            });
        }

        function _getContentFromStorage(data) {
            return StorageRevSrv.getContent(data);
        }

        this.getExam = function (examId, setIsAvail) {
            return _getContentFromStorage({
                exerciseId: examId, exerciseType: 'exam'
            }).then(function (exam) {
                if (!setIsAvail) {
                    return exam;
                }

                var getIsAvailPromArr = [];
                var sections = exam.sections;
                angular.forEach(sections, function (section) {
                    var isSectionAvailProm = ContentAvailSrv.isSectionAvail(examId, section.id).then(function (isAvail) {
                        section.isAvail = !!isAvail;
                    });
                    getIsAvailPromArr.push(isSectionAvailProm);
                });

                return $q.all(getIsAvailPromArr).then(function () {
                    return exam;
                });
            });
        };

        this.getExamSection = function (sectionId) {
            return _getContentFromStorage({
                exerciseId: sectionId, exerciseType: 'section'
            });
        };

        this.getAllExams = function (setIsAvail) {
            return _getExamOrder().then(function (examOrder) {
                var examsProms = [];
                var examsByOrder = examOrder.sort((a, b) => {
                    return a.order > b.order;
                });
                angular.forEach(examsByOrder, function (exam) {
                    examsProms.push(self.getExam(exam.examId, setIsAvail));
                });
                return $q.all(examsProms);
            });
        };
});

(function (angular) {
    'use strict';

    angular.module('znk.infra.exams', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult').service('ExerciseResultSrv', [
        'InfraConfigSrv', '$log', '$q', 'UtilitySrv', 'ExerciseTypeEnum', 'StorageSrv', 'ExerciseStatusEnum',
        function (InfraConfigSrv, $log, $q, UtilitySrv, ExerciseTypeEnum, StorageSrv, ExerciseStatusEnum) {
            var ExerciseResultSrv = this;

            var EXERCISE_RESULTS_PATH = 'exerciseResults';
            var EXERCISE_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/exerciseResults';


            var EXAM_RESULTS_PATH = 'examResults';
            var EXAM_RESULTS_GUIDS_PATH = StorageSrv.variables.appUserSpacePath + '/examResults';

            var EXERCISES_STATUS_PATH = StorageSrv.variables.appUserSpacePath + '/exercisesStatus';

            function _isValidNumber(number){
                if(!angular.isNumber(number) && !angular.isString(number)){
                    return false;
                }

                return !isNaN(+number);
            }

            function _getExerciseResultPath(guid) {
                return EXERCISE_RESULTS_PATH + '/' + guid;
            }

            function _getInitExerciseResult(exerciseTypeId,exerciseId,guid){
                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function(user) {
                    return {
                        exerciseId: exerciseId,
                        exerciseTypeId: exerciseTypeId,
                        startedTime: Date.now(),
                        uid: user.uid,
                        questionResults: [],
                        guid: guid
                    };
                });
            }

            function _getExerciseResultByGuid(guid) {
                var exerciseResultPath = _getExerciseResultPath(guid);
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(exerciseResultPath);
                });
            }

            function _getExerciseResultsGuids(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(EXERCISE_RESULTS_GUIDS_PATH);
                });
            }

            function _getExamResultPath(guid) {
                return EXAM_RESULTS_PATH + '/' + guid;
            }

            function _getExamResultByGuid(guid,examId) {
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    var path = _getExamResultPath(guid);
                    return StudentStorageSrv.get(path).then(function(examResult){
                        var initResultProm = _getInitExamResult(examId, guid);
                        return initResultProm.then(function(initResult) {
                            if(examResult.guid !== guid){
                                angular.extend(examResult,initResult);
                            }else{
                                UtilitySrv.object.extendWithoutOverride(examResult,initResult);
                            }
                            return examResult;
                        });
                    });
                });
            }

            function _getInitExamResult(examId, guid){
                var userProm = InfraConfigSrv.getUserData();
                return userProm.then(function(user) {
                    return {
                        isComplete: false,
                        startedTime: Date.now(),
                        examId: examId,
                        guid: guid,
                        uid: user.uid,
                        sectionResults:{}
                    };
                });
            }

            function _getExamResultsGuids(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(EXAM_RESULTS_GUIDS_PATH);
                });
            }

            function exerciseSaveFn(){
                /* jshint validthis: true */
                var exerciseResult = this;
                var getExercisesStatusDataProm = _getExercisesStatusData();
                var dataToSave = {};

                var countCorrect = 0,
                    countWrong = 0,
                    countSkipped = 0,
                    correctTotalTime = 0,
                    wrongTotalTime = 0,
                    skippedTotalTime = 0;

                var totalTimeSpentOnQuestions = exerciseResult.questionResults.reduce(function(previousValue, currResult) {
                    var timeSpentOnQuestion =  angular.isDefined(currResult.timeSpent) && !isNaN(currResult.timeSpent) ? currResult.timeSpent : 0;
                    if (currResult.isAnsweredCorrectly) {
                        countCorrect++;
                        correctTotalTime += timeSpentOnQuestion;
                    }else if (angular.isDefined(currResult.userAnswer)) {
                        countWrong++;
                        wrongTotalTime += timeSpentOnQuestion;
                    } else {
                        countSkipped++;
                        skippedTotalTime += timeSpentOnQuestion;
                    }

                    return previousValue + (currResult.timeSpent || 0);
                },0);

                function _getAvgTime(totalNum, totalTime){
                    var avgTime = Math.round(totalNum ? totalTime/totalNum : 0);
                    return avgTime;
                }

                exerciseResult.duration = totalTimeSpentOnQuestions;
                exerciseResult.correctAvgTime = _getAvgTime(countCorrect,correctTotalTime);
                exerciseResult.wrongAvgTime = _getAvgTime(countWrong, wrongTotalTime);
                exerciseResult.skippedAvgTime = _getAvgTime(countSkipped, skippedTotalTime);
                exerciseResult.correctAnswersNum = countCorrect;
                exerciseResult.wrongAnswersNum = countWrong;
                exerciseResult.skippedAnswersNum = countSkipped;

                if(exerciseResult.isComplete && angular.isUndefined(exerciseResult.endedTime)){
                    exerciseResult.endedTime = Date.now();
                }

                var numOfAnsweredQuestions = exerciseResult.questionResults.length;
                exerciseResult.avgTimePerQuestion = numOfAnsweredQuestions ? Math.round(totalTimeSpentOnQuestions / numOfAnsweredQuestions) : 0;
                var exerciseResultPath = _getExerciseResultPath(exerciseResult.guid);

                dataToSave[exerciseResultPath] = exerciseResult;

                return getExercisesStatusDataProm.then(function(exercisesStatusData){
                    if(!exercisesStatusData[exerciseResult.exerciseTypeId]){
                        exercisesStatusData[exerciseResult.exerciseTypeId] = {};
                    }

                    var exerciseNewStatus = exerciseResult.isComplete ?
                        ExerciseStatusEnum.COMPLETED.enum : ExerciseStatusEnum.ACTIVE.enum;
                    exercisesStatusData[exerciseResult.exerciseTypeId][exerciseResult.exerciseId] = new ExerciseStatus(exerciseNewStatus, totalTimeSpentOnQuestions);
                    dataToSave[EXERCISES_STATUS_PATH] = exercisesStatusData;

                    var getSectionAggregatedDataProm = $q.when();
                    if(exerciseResult.exerciseTypeId === ExerciseTypeEnum.SECTION.enum) {
                        getSectionAggregatedDataProm = ExerciseResultSrv.getExamResult(exerciseResult.examId).then(function(examResult) {
                            var sectionsAggregatedData = _getExamAggregatedSectionsData(examResult, exercisesStatusData);

                            examResult.duration = sectionsAggregatedData.sectionsDuration;

                            if(sectionsAggregatedData.allSectionsCompleted){
                                examResult.isComplete = true;
                                examResult.endedTime = Date.now();
                                var examResultPath = _getExamResultPath(examResult.guid);
                                dataToSave[examResultPath] = examResult;
                            }
                        });
                    }

                    return getSectionAggregatedDataProm.then(function() {
                        return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                            StudentStorageSrv.set(dataToSave);
                            return exerciseResult;
                        });
                    });

                });
            }

            function _getExamAggregatedSectionsData(examResult, exercisesStatusData) {
                var aggregatedData = {
                    sectionsDuration: 0
                };

                var sectionExercisesStatus = exercisesStatusData[ExerciseTypeEnum.SECTION.enum];
                var sectionResultsToArr = Object.keys(examResult.sectionResults);

                var areAllExamSectionsHasResults = sectionResultsToArr.length === +examResult.examSectionsNum;
                aggregatedData.allSectionsCompleted = areAllExamSectionsHasResults;

                for(var i = 0, ii = sectionResultsToArr.length; i < ii; i++) {
                    var sectionId = sectionResultsToArr[i];
                    var sectionStatus =  sectionExercisesStatus[sectionId] || {};

                    var isSectionComplete = sectionStatus.status === ExerciseStatusEnum.COMPLETED.enum;
                    if(!isSectionComplete){
                        aggregatedData.allSectionsCompleted = false;
                    }

                    aggregatedData.sectionsDuration += sectionStatus.duration || 0;
                }

                return aggregatedData;
            }

            function _getExercisesStatusData(){
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return StudentStorageSrv.get(EXERCISES_STATUS_PATH);
                });
            }

            function ExerciseStatus(status, duration){
                this.status = status;
                this.duration = duration;
            }

            this.getExerciseResult = function (exerciseTypeId, exerciseId, examId, examSectionsNum, dontInitialize) {
                if(!_isValidNumber(exerciseTypeId) || !_isValidNumber(exerciseId)){
                    var errMSg = 'ExerciseResultSrv: exercise type id, exercise id should be number !!!';
                    $log.error(errMSg);
                    return $q.reject(errMSg);
                }
                exerciseTypeId = +exerciseTypeId;
                exerciseId = +exerciseId;

                if(exerciseTypeId === ExerciseTypeEnum.SECTION.enum && !_isValidNumber(examId)){
                    var examErrMSg = 'ExerciseResultSrv: exam id should be provided when asking for section result and should' +
                        ' be a number!!!';
                    $log.error(examErrMSg);
                    return $q.reject(examErrMSg);
                }
                examId = +examId;

                var getExamResultProm;
                if(exerciseTypeId === ExerciseTypeEnum.SECTION.enum){
                    getExamResultProm = ExerciseResultSrv.getExamResult(examId, dontInitialize);
                }
                return _getExerciseResultsGuids().then(function (exerciseResultsGuids) {
                    var resultGuid = exerciseResultsGuids[exerciseTypeId] && exerciseResultsGuids[exerciseTypeId][exerciseId];
                    if (!resultGuid) {
                        if(dontInitialize){
                            return null;
                        }

                        if(!exerciseResultsGuids[exerciseTypeId]){
                            exerciseResultsGuids[exerciseTypeId] = {};
                        }

                        return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                            var newGuid = UtilitySrv.general.createGuid();

                            var dataToSave = {};

                            exerciseResultsGuids[exerciseTypeId][exerciseId] = newGuid;
                            dataToSave[EXERCISE_RESULTS_GUIDS_PATH] = exerciseResultsGuids;

                            var exerciseResultPath = _getExerciseResultPath(newGuid);
                            var initResultProm = _getInitExerciseResult(exerciseTypeId,exerciseId,newGuid);
                            return initResultProm.then(function(initResult) {
                                dataToSave[exerciseResultPath] = initResult;

                                var setProm;
                                if(getExamResultProm){
                                    initResult.examId = examId;
                                    setProm = getExamResultProm.then(function(examResult){
                                        if(examSectionsNum && !examResult.examSectionsNum) {
                                            examResult.examSectionsNum = examSectionsNum;
                                        }

                                        if(!examResult.sectionResults){
                                            examResult.sectionResults = {};
                                        }
                                        examResult.sectionResults[exerciseId] = newGuid;

                                        var examResultPath = _getExamResultPath(examResult.guid);
                                        dataToSave[examResultPath] = examResult;
                                    });
                                }

                                return $q.when(setProm).then(function(){
                                    return StudentStorageSrv.set(dataToSave);
                                }).then(function(res){
                                    return res[exerciseResultPath];
                                });
                            });
                        });
                    }

                    return _getExerciseResultByGuid(resultGuid).then(function(result){
                        var initResultProm = _getInitExerciseResult(exerciseTypeId,exerciseId,resultGuid);
                        return initResultProm.then(function(initResult) {
                            if(result.guid !== resultGuid){
                                angular.extend(result,initResult);
                            }else{
                                UtilitySrv.object.extendWithoutOverride(result, initResult);
                            }
                            return result;
                        });
                    });
                }).then(function(exerciseResult){
                    if(angular.isObject(exerciseResult)){
                        exerciseResult.$save = exerciseSaveFn;
                    }
                    return exerciseResult;
                });
            };

            this.getExamResult = function (examId, dontInitialize) {
                if(!_isValidNumber(examId)){
                    var errMsg = 'Exam id is not a number !!!';
                    $log.error(errMsg);
                    return $q.reject(errMsg);
                }
                examId = +examId;
                
                return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                    return _getExamResultsGuids().then(function (examResultsGuids) {
                        var examResultGuid = examResultsGuids[examId];
                        if (!examResultGuid) {
                            if(dontInitialize){
                                return null;
                            }

                            var dataToSave = {};
                            var newExamResultGuid = UtilitySrv.general.createGuid();
                            examResultsGuids[examId] = newExamResultGuid;
                            dataToSave[EXAM_RESULTS_GUIDS_PATH] = examResultsGuids;

                            var examResultPath = _getExamResultPath(newExamResultGuid);
                            var initExamResultProm = _getInitExamResult(examId, newExamResultGuid);
                            return initExamResultProm.then(function(initExamResult) {
                                dataToSave[examResultPath] = initExamResult;

                                return StudentStorageSrv.set(dataToSave).then(function (res) {
                                    return res[examResultPath];
                                });
                            });
                        }

                        return _getExamResultByGuid(examResultGuid, examId);
                    });
                });
            };

            this.getExerciseStatus = function(exerciseType, exerciseId){
                return _getExercisesStatusData().then(function(exercisesStatusData){
                    if(!exercisesStatusData[exerciseType] || !exercisesStatusData[exerciseType][exerciseId]){
                        return new ExerciseStatus(ExerciseStatusEnum.NEW.enum);
                    }
                    return exercisesStatusData[exerciseType][exerciseId];
                });
            };

            this.getExercisesStatusMap = function(){
                return _getExercisesStatusData();
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseResult', [
        'znk.infra.config',
        'znk.infra.utility',
        'znk.infra.exerciseUtility'
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('AnswerTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['SELECT_ANSWER',0 ,'select answer'],
                ['FREE_TEXT_ANSWER',1 ,'free text answer'],
                ['RATE_ANSWER',3 ,'rate answer']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('ExamTypeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['FULL TEST', 0, 'test'],
                ['MINI TEST', 1, 'miniTest'],
                ['DIAGNOSTIC', 2, 'diagnostic']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    var exerciseStatusEnum = {
        NEW: 0,
        ACTIVE: 1,
        COMPLETED: 2,
        COMING_SOON: 3
    };

    angular.module('znk.infra.exerciseUtility').constant('exerciseStatusConst', exerciseStatusEnum);

    angular.module('znk.infra.exerciseUtility').factory('ExerciseStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NEW', exerciseStatusEnum.NEW, 'new'],
                ['ACTIVE', exerciseStatusEnum.ACTIVE, 'active'],
                ['COMPLETED', exerciseStatusEnum.COMPLETED, 'completed'],
                ['COMING_SOON', exerciseStatusEnum.COMING_SOON, 'coming soon']
            ]);
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var exerciseTypeConst = {
        TUTORIAL: 1,
        PRACTICE: 2,
        GAME: 3,
        SECTION: 4,
        DRILL: 5
    };

    angular.module('znk.infra.enum')
        .constant('exerciseTypeConst', exerciseTypeConst)
        .factory('ExerciseTypeEnum', [
            'EnumSrv',
            function (EnumSrv) {
                return new EnumSrv.BaseEnum([
                    ['TUTORIAL', 1, 'Tutorial'],
                    ['PRACTICE', 2, 'Practice'],
                    ['GAME', 3, 'Game'],
                    ['SECTION', 4, 'Section'],
                    ['DRILL', 5, 'Drill']
                ]);
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.enum').factory('QuestionFormatEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var QuestionFormatEnum = new EnumSrv.BaseEnum([
                ['TEXT',1,'text'],
                ['AUDIO',2, 'audio'],
                ['TEXT_AUDIO', 3, 'text audio'],
                ['PROSE_SUMMARY', 4, 'prose Summary'],
                ['FILL_IN_TABLE', 5, 'fill in a table'],
                ['CONNECTING_CONTENT', 6, 'connecting content'],
                ['INDEPENDENT', 7, 'independent'],
                ['STANDARD', 8, 'standard']
            ]);

            return QuestionFormatEnum;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var subjectEnum = {
        MATH: 0,
        READING: 1,
        WRITING: 2,
        LISTENING: 3,
        SPEAKING: 4,
        ENGLISH: 5,
        SCIENCE: 6,
        VERBAL: 7,
        ESSAY: 8
    };

    angular.module('znk.infra.enum').constant('SubjectEnumConst', subjectEnum);

    angular.module('znk.infra.enum').factory('SubjectEnum', [
        'EnumSrv',
        function (EnumSrv) {

            var SubjectEnum = new EnumSrv.BaseEnum([
                ['MATH', subjectEnum.MATH, 'math'],
                ['READING', subjectEnum.READING, 'reading'],
                ['WRITING', subjectEnum.WRITING, 'writing'],
                ['LISTENING', subjectEnum.LISTENING, 'listening'],
                ['SPEAKING', subjectEnum.SPEAKING, 'speaking'],
                ['ENGLISH', subjectEnum.ENGLISH, 'english'],
                ['SCIENCE', subjectEnum.SCIENCE, 'science'],
                ['VERBAL', subjectEnum.VERBAL, 'verbal'],
                ['ESSAY', subjectEnum.ESSAY, 'essay']
            ]);

            return SubjectEnum;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility', [
        'znk.infra.config',
        'znk.infra.enum',
        'znk.infra.storage',
        'znk.infra.exerciseResult',
        'znk.infra.contentAvail',
        'znk.infra.content',
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('BaseExerciseGetterSrv',
        function (ContentSrv, $log, $q) {
            'ngInject';
            
            var BaseExerciseGetterSrvPrototype = {};

            BaseExerciseGetterSrvPrototype.get = function (exerciseId) {
                var contentData = {
                    exerciseId: exerciseId,
                    exerciseType: this.typeName
                };

                return ContentSrv.getContent(contentData).then(function (result) {
                    return angular.fromJson(result);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            BaseExerciseGetterSrvPrototype.getAll = function(){
                var self = this;
                var resultsProm = [];
                return ContentSrv.getAllContentIdsByKey(self.typeName).then(function (results) {
                    angular.forEach(results, function (keyValue) {
                        resultsProm.push(self.getContent({
                            exerciseType: keyValue
                        }));
                    });
                    return $q.all(resultsProm);
                }, function (err) {
                    if (err) {
                        $log.error(err);
                        return $q.reject(err);
                    }
                });
            };

            function BaseExerciseGetterSrv(exerciseTypeName) {
                this.typeName = exerciseTypeName;
            }

            BaseExerciseGetterSrv.getExerciseByNameAndId = function(exerciseId, exerciseTypeName){
                var context = {
                    typeName: exerciseTypeName
                };
                return BaseExerciseGetterSrvPrototype.get.call(context,exerciseId);
            };

            BaseExerciseGetterSrv.prototype = BaseExerciseGetterSrvPrototype;

            return BaseExerciseGetterSrv;
        }
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').factory('ExerciseUtilitySrv',
        function () {
            'ngInject';
            
            var ExerciseUtilitySrv = {};

            return ExerciseUtilitySrv;
        }
    );
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.exerciseUtility').service('WorkoutsSrv',
        function (ExerciseStatusEnum, ExerciseTypeEnum, $log, StorageSrv, ExerciseResultSrv, ContentAvailSrv, $q,
                  InfraConfigSrv, BaseExerciseGetterSrv) {
            'ngInject';

            var workoutsDataPath = StorageSrv.variables.appUserSpacePath + '/workouts';

            function _getWorkoutsData() {
                var defaultValue = {
                    workouts: {}
                };
                return InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                    return StudentStorageSrv.get(workoutsDataPath, defaultValue);
                });
            }

            function getWorkoutKey(workoutId) {
                return 'workout_' + workoutId;
            }

            function _getWorkout(workoutId) {
                var workoutKey = getWorkoutKey(workoutId);
                return _getWorkoutsData().then(function (workoutsData) {
                    return workoutsData.workouts[workoutKey];
                });
            }

            function _setIsAvailForWorkout(workout) {
                return ContentAvailSrv.isDailyAvail(workout.workoutOrder).then(function (isAvail) {
                    workout.isAvail = isAvail;
                });
            }

            this.getAllWorkouts = function () {
                return _getWorkoutsData().then(function (workoutsData) {
                    var workoutsArr = [],
                        promArr = [];
                    angular.forEach(workoutsData.workouts, function (workout) {
                        workoutsArr.push(workout);
                        promArr.push(_setIsAvailForWorkout(workout));
                    });

                    for (var i = 0; i < 5; i++) {
                        var workoutToAdd = {
                            status: ExerciseStatusEnum.NEW.enum,
                            workoutOrder: workoutsArr.length + 1
                        };
                        workoutsArr.push(workoutToAdd);
                        promArr.push(_setIsAvailForWorkout(workoutToAdd));
                    }
                    return $q.all(promArr).then(function () {
                        return workoutsArr.sort(function (workout1, workout2) {
                            return workout1.workoutOrder - workout2.workoutOrder;
                        });
                    });
                });
            };

            this.getWorkoutData = function (workoutId) {
                if (angular.isUndefined(workoutId)) {
                    $log.error('workoutSrv: getWorkoutData function was invoked without workout id');
                }
                return _getWorkout(workoutId).then(function (workout) {
                    if (workout) {
                        var getExerciseProm;
                        var exerciseTypeName = ExerciseTypeEnum.getValByEnum(workout.exerciseTypeId).toLowerCase();
                        getExerciseProm = BaseExerciseGetterSrv.getExerciseByNameAndId(workout.exerciseId, exerciseTypeName);

                        return {
                            workoutId: workoutId,
                            exerciseTypeId: workout.exerciseTypeId,
                            exerciseProm: getExerciseProm,
                            exerciseResultProm: ExerciseResultSrv.getExerciseResult(workout.exerciseTypeId, workout.exerciseId)
                        };
                    }
                    return null;
                });
            };

            this.setWorkout = function (workoutId, newWorkoutValue) {
                return _getWorkoutsData().then(function (workoutsData) {
                    var workoutKey = getWorkoutKey(workoutId);
                    workoutsData.workouts[workoutKey] = newWorkoutValue;
                    InfraConfigSrv.getStudentStorage().then(function (StudentStorageSrv) {
                        StudentStorageSrv.set(workoutsDataPath, workoutsData);
                    });
                });
            };

            this.getWorkoutKey = getWorkoutKey;
        }
    );
})(angular);

/**
 * evaluates content , then it appended it to the DOM , and finally it compiles it with scope which was created out of the directive scope.
 * attrs-
 *  compile-drv: expression which be evaluated and then appended to the dom.
 *  bind-once: angular expression which evaluated by the scope , if it true then the watcher will be killed after the first time content was added to the dom
 */

'use strict';

(function (angular) {
    angular.module('znk.infra.general').directive('compile', [
        '$compile','$animate',
        function($compile,$animate) {
            return {
            link: function(scope,element,attrs){
                var _childScope;

                var watchDestroyer = scope.$watch(attrs.compile,function(newVal){
                    if(_childScope){
                        _childScope.$destroy();
                        _childScope = null;
                    }

                    $animate.leave(element.children());
                    element.empty();

                    if(typeof newVal === 'undefined'){
                        return;
                    }

                    if(scope.$eval(attrs.bindOnce)){
                        watchDestroyer();
                    }

                    if(typeof newVal !== 'string'){
                        if(newVal === null){
                            newVal = '';
                        }
                        newVal = '' + newVal;
                    }

                    var _htmlStrRegex = /^<(\w+)( .*|)>(.|\n)*(<\/\1>|)$/;
                    /**
                     * check if html string , if true create jq lite element of it and append with animation otherwise just append to the dom
                     */
                    if(_htmlStrRegex.test(newVal)){
                        _childScope = scope.$new();
                        var $content = angular.element(newVal);
                        $animate.enter($content,element);
                        $compile(element.children())(_childScope);
                    }else{
                        element.append(newVal);
                    }
                });
            }
        };
    }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.general', ['znk.infra.enum', 'znk.infra.svgIcon'])
        .config([
        'SvgIconSrvProvider',
        function (SvgIconSrvProvider) {
            var svgMap = {
                'clock-icon': 'components/general/svg/clock-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        }]);

})(angular);

/**
 *  @directive subjectIdToAttrDrv
 *  This directive is an evolution of 'subjectIdToClassDrv'
 *  @context-attr a comma separated string of attribute names
 *  @prefix a comma separated string of prefixes to the attribute values
 *  @suffix a comma separated string of suffixes to the attribute values
 *
 *  In case only one prefix/suffix is provided, it will be used in all attributes
 *  In case no @context-attr is provided, it will set the class attribute by default
 *  No need to pass dashes ('-') to prefix or suffix, they are already appended
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToAttrDrv', [
        'SubjectEnum', '$interpolate',
        function (SubjectEnum, $interpolate) {
            return {
                link: {
                    pre: function (scope, element, attrs) {
                        var addedClassesArr = [];

                        scope.$watch(attrs.subjectIdToAttrDrv, function (subjectId) {
                            var contextAttr = attrs.contextAttr ? $interpolate(attrs.contextAttr)(scope) : undefined;
                            var prefix = attrs.prefix ? $interpolate(attrs.prefix)(scope) : undefined;
                            var suffix = attrs.suffix ? $interpolate(attrs.suffix)(scope) : undefined;

                            if (angular.isUndefined(subjectId)) {
                                return;
                            }

                            var attrsArray;
                            if (contextAttr) {
                                attrsArray = contextAttr.split(',');
                            } else {
                                attrsArray = [];
                                attrsArray.push('class');
                            }

                            var attrPrefixes = (prefix) ? prefix.split(',') : [];
                            var attrSuffixes = (suffix) ? suffix.split(',') : [];

                            var subjectEnumMap = SubjectEnum.getEnumMap();
                            var subjectNameToAdd = subjectEnumMap[subjectId];

                            angular.forEach(attrsArray, function (value, key) {
                                var attrVal = subjectNameToAdd;

                                if (attrPrefixes.length) {
                                    var prefix = attrPrefixes[key] || attrPrefixes[0];
                                    if(prefix !== ''){
                                        attrVal = prefix + '-' + attrVal;
                                    }
                                }

                                if (attrSuffixes.length) {
                                    var suffix = attrSuffixes[key] || attrSuffixes[0];
                                    if(suffix !== ''){
                                        attrVal += '-' + suffix;
                                    }
                                }

                                attrVal = attrVal.replace(/\s+/g, '');   // regex to clear spaces
                                value = value.replace(/\s+/g, '');   // regex to clear spaces

                                if (value === 'class') {
                                    if (!element.hasClass(attrVal)) {
                                        addedClassesArr.forEach(function (clsToRemove) {
                                            if(clsToRemove.indexOf(subjectNameToAdd) === -1){
                                                element.removeClass(clsToRemove);
                                            }
                                        });
                                        addedClassesArr.push(attrVal);
                                        element.addClass(attrVal);
                                    }
                                    } else {
                                        element.attr(value, attrVal);
                                    }
                                }
                                );

                        });
                    }
                }
            };
        }
    ]);
})(angular);

/**
 * attrs:
 *  subject-id-to-class-drv: expression from which subject id will be taken from.
 *  class-suffix: suffix of the added class
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.general').directive('subjectIdToClassDrv', [
        'SubjectEnum',
        function (SubjectEnum) {
            return {
                priority: 1000,
                link: {
                    pre: function (scope, element, attrs) {
                        var watchDestroyer = scope.$watch(attrs.subjectIdToClassDrv,function(subjectId){
                            if(angular.isUndefined(subjectId)){
                                return;
                            }

                            watchDestroyer();
                            var classToAdd;

                            for(var prop in SubjectEnum){
                                if(SubjectEnum[prop].enum === subjectId){
                                    classToAdd = SubjectEnum[prop].val;
                                    if(attrs.classSuffix){
                                        classToAdd += attrs.classSuffix;
                                    }
                                    break;
                                }
                            }

                            element.addClass(classToAdd);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs -
 *      ng-model
 *      play
 *      type:
 *          1: timer with displayed time.
 *          2: timer with round progress bar
 *      config:
 *          stopOnZero
 *          countDown
 *          format: defaulted to mm:ss
 *          only for type 2:
 *              stroke
 *              bgcolor
 *              color
 *              radius
 *              max
 *              clockwise
 */
'use strict';

(function (angular) {

    angular.module('znk.infra.general').directive('timer', [
        '$interval',
        function ($interval) {
            var timerTypes = {
                'REGULAR': 1,
                'ROUND_PROGRESSBAR': 2
            };

            return {
                scope: {
                    play: '=?',
                    typeGetter: '&?type',
                    configGetter: '&?config'
                },
                require: '?ngModel',
                replace: true,
                templateUrl: 'components/general/templates/timerDrv.html',
                link: function link(scope, element, attrs, ngModelCtrl) {
                    var domElement = element[0];

                    scope.ngModelCtrl = ngModelCtrl;

                    function padNum(num){
                        if(('' + Math.abs(+num)).length < 2){
                            return (num < 0 ? '-' : '') + '0' + Math.abs(+num);
                        }else{
                            return num;
                        }
                    }

                    function getDisplayedTime(currentTime,format){
                        var totalSeconds = currentTime / 1000;
                        var seconds = Math.floor(totalSeconds % 60);
                        var minutes = Math.floor(Math.abs(totalSeconds) / 60) * (totalSeconds < 0 ? -1 : 1);
                        var paddedSeconds = padNum(seconds);
                        var paddedMinutes = padNum(minutes);

                        return format
                            .replace('tss',totalSeconds)
                            .replace('ss',paddedSeconds)
                            .replace('mm',paddedMinutes);

                    }

                    function updateTime(currentTime) {
                        var displayedTime = getDisplayedTime(currentTime,scope.config.format);
                        var timeDisplayDomElem;
                        switch(scope.type){
                            case 1:
                                timeDisplayDomElem = domElement.querySelector('.timer-view');
                                break;
                            case 2:
                                timeDisplayDomElem = domElement.querySelector('.timer-display');
                                break;
                        }
                        if(timeDisplayDomElem){
                            timeDisplayDomElem.innerText = displayedTime;
                        }
                    }

                    var intervalHandler;
                    var INTERVAL_TIME = 1000;

                    scope.type = scope.typeGetter() || 1;
                    scope.config = scope.configGetter() || {};
                    var configDefaults = {
                        format: 'mm:ss',
                        stopOnZero: true
                    };
                    scope.config = angular.extend(configDefaults, scope.config);

                    switch (scope.type) {
                        case timerTypes.ROUND_PROGRESSBAR:
                        {
                            var roundProgressBarConfigDefults = {
                                stroke: 3,
                                bgcolor: '#0a9bad',
                                color: '#e1e1e1'
                            };
                            scope.config = angular.extend(roundProgressBarConfigDefults, scope.config);
                            scope.config.radius = scope.config.radius || Math.floor(element[0].offsetHeight / 2) || 45;
                            break;
                        }
                    }

                    function tick() {
                        var currentTime = ngModelCtrl.$viewValue;

                        if (angular.isUndefined(currentTime)) {
                            return;
                        }

                        currentTime += scope.config.countDown ? -INTERVAL_TIME : INTERVAL_TIME;

                        if(scope.config.stopOnZero && currentTime <= 0){
                            scope.play = false;
                            currentTime = 0;
                        }

                        updateTime(currentTime);
                        ngModelCtrl.$setViewValue(currentTime);
                    }

                    ngModelCtrl.$render = function () {
                        var currentTime = ngModelCtrl.$viewValue;
                        if (angular.isUndefined(currentTime)) {
                            return;
                        }
                        updateTime(currentTime);
                    };

                    scope.$watch('play', function (play) {
                        if (intervalHandler) {
                            $interval.cancel(intervalHandler);
                        }

                        if (play) {
                            intervalHandler = $interval(tick, INTERVAL_TIME, 0, false);
                        }
                    });

                    scope.$on('$destroy', function () {
                        $interval.cancel(intervalHandler);
                    });
                }
            };
        }]);

})(angular);

/**
 *
 *
 */
'use strict';
(function (angular) {
    angular.module('znk.infra.general').directive('videoCtrlDrv', [
        '$interpolate', '$timeout',
        function ($interpolate, $timeout) {
            var videoHeightType = {
                FIT: 'fit',
                COVER: 'cover'
            };
            return {
                transclude: 'element',
                priority: 1000,
                scope:{
                    onEnded: '&?',
                    onCanplay: '&?',
                    onPlay: '&?',
                    onVideoError: '&?',
                    videoErrorPoster: '@?',
                    actions: '=?',
                    heightToWidthRatioGetter: '&heightToWidthRatio',
                    videoHeight: '@'
                },
                link: function(scope, element, attrs, ctrl, transclude) {
                    var posterMaskElement;
                    var parentElem = element.parent();
                    var parentDomElem = parentElem[0];

                    if (attrs.customPoster) {
                        posterMaskElement = angular.element('<img src="' + attrs.customPoster + '" ' +
                            'style="position:absolute;top:0;right:0;bottom:0;left:0;">');
                        var parentStyle = window.getComputedStyle(parentDomElem);
                        if (parentStyle.position === 'static') {
                            parentDomElem.style.position = 'relative';
                        }
                        parentElem.append(posterMaskElement);
                    }

                    var posterImg;
                    if(attrs.znkPosterDrv){
                        posterImg = new Image();
                        posterImg.src = $interpolate(attrs.znkPosterDrv)(scope.$parent);
                    }

                    var elementsToRemoveErrorEventListeners = [];
                    function _addVideoSourceErrorHandler(videoDomElem){
                        var sourcesDomElement = videoDomElem.querySelectorAll('source');

                        var relevantSourceDomElement;

                        if(sourcesDomElement.length){
                            relevantSourceDomElement = sourcesDomElement[sourcesDomElement.length -1];
                        }else{
                            relevantSourceDomElement = videoDomElem;
                        }

                        function errorHandler(ev) {
                            $timeout(function(){
                                if(scope.onVideoError){
                                    scope.onVideoError(ev);
                                }

                                if(scope.videoErrorPoster){
                                    videoDomElem.removeAttribute("controls");
                                    videoDomElem.poster = scope.videoErrorPoster;
                                    videoDomElem.style.display = '';
                                }
                            });
                        }
                        relevantSourceDomElement.addEventListener('error', errorHandler);

                        elementsToRemoveErrorEventListeners.push({
                            domElement: relevantSourceDomElement,
                            handler: errorHandler
                        });
                    }

                    transclude(scope.$parent, function (clone) {

                        var videoElem = clone;
                        var videoDomElem = videoElem[0];

                        _addVideoSourceErrorHandler(videoDomElem);

                        videoDomElem.style.display = 'none';//preventing element resize flickering
                        parentElem.append(videoElem);

                        scope.actions = scope.actions || {};

                        scope.actions.replay = function () {
                            scope.actions.stop();
                            videoDomElem.play();
                        };

                        scope.actions.play = function(){
                            videoDomElem.play();
                        };

                        scope.actions.stop = function(){
                            videoDomElem.pause();
                            videoDomElem.currentTime = '0';
                        };

                        function endedHandler() {
                            scope.$apply(function () {
                                scope.onEnded();
                            });
                        }

                        function fitVideo(ratio){
                            var containerWidth, containerHeight;
                            var heightToWidthRatio = scope.heightToWidthRatioGetter() || ratio;
                            heightToWidthRatio = +heightToWidthRatio;
                            var heightSizeByWidth = parentDomElem.offsetWidth * heightToWidthRatio;
                            if (heightSizeByWidth <= parentDomElem.offsetHeight) {
                                containerWidth = parentDomElem.offsetWidth;
                                containerHeight = heightSizeByWidth;
                            } else {
                                containerHeight = parentDomElem.offsetHeight;
                                containerWidth = containerHeight / heightToWidthRatio;
                            }

                            containerWidth = Math.round(containerWidth);
                            containerHeight = Math.round(containerHeight);

                            videoDomElem.style.width = containerWidth + 'px';
                            //black line bug fix for iphone 4
                            videoDomElem.style.height = containerHeight + ((containerHeight % 2) ? 0 : 1) + 'px';
                        }

                        function coverVideo(ratio){
                            videoDomElem.style.position = 'relative';
                            var heightByWidth = parentDomElem.offsetWidth * ratio;
                            if(heightByWidth >= parentDomElem.offsetHeight){
                                videoDomElem.style.width =  parentDomElem.offsetWidth + 'px';
                                videoDomElem.style.height = heightByWidth + 'px';
                                videoDomElem.style.top = -((heightByWidth - parentDomElem.offsetHeight) / 2) + 'px';
                            }
                            else{
                                var widthByParentHeight = parentDomElem.offsetHeight * (1/ratio);
                                videoDomElem.style.width =  widthByParentHeight + 'px';
                                videoDomElem.style.height = parentDomElem.offsetHeight + 'px';
                                videoDomElem.style.left = -((widthByParentHeight - parentDomElem.offsetWidth) / 2) + 'px';
                            }
                        }

                        function canPlayHandler() {
                            if (posterMaskElement) {
                                posterMaskElement.remove();
                            }
                            scope.$apply(function () {
                                if(scope.onCanplay){
                                    scope.onCanplay();
                                }
                            });
                        }

                        function playHandler() {
                            $timeout(function() {
                                if(scope.onPlay) {
                                    scope.onPlay();
                                }
                            });
                        }

                        function setVideoDimensions(width,height){
                            if(setVideoDimensions.wasSet){
                                return;
                            }
                            setVideoDimensions.wasSet = true;

                            var videoHeight = height;
                            var videoWidth = width;
                            var ratio = videoHeight / videoWidth;

                            switch (scope.videoHeight) {
                                case videoHeightType.FIT:
                                    fitVideo(ratio);
                                    break;
                                case videoHeightType.COVER:
                                    coverVideo(ratio);
                                    break;
                            }

                            videoDomElem.style.display = '';

                        }

                        function loadedmetadata(){
                            /* jshint validthis: true */
                            setVideoDimensions(this.videoHeight,this.videoWidth);
                        }

                        videoElem.on('canplay', canPlayHandler);
                        videoElem.on('play', playHandler);
                        videoElem.on('ended', endedHandler);

                        if(posterImg){
                            posterImg.onload = function(){
                                setVideoDimensions(posterImg.width/2,posterImg.height/2);//All posters must be in twice size for retina
                            };
                        }

                        videoDomElem.addEventListener('loadedmetadata',loadedmetadata, false );

                        scope.$on('$destroy', function () {
                            videoElem.off('canplay', canPlayHandler);

                            videoElem.off('play', playHandler);

                            videoElem.off('ended', endedHandler);

                            videoDomElem.removeEventListener('loadedmetadata',loadedmetadata );

                            elementsToRemoveErrorEventListeners.forEach(function(removedElementData){
                                removedElementData.domElement.removeEventListener('error', removedElementData.handler);
                            });

                            if(posterImg){
                                posterImg.onload = null;
                            }

                            scope.loadStart = false;
                        });
                    });
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.hint').provider('HintSrv',function(){
        var registeredHints = {};

        var _hintMap = {};

        this.registerHint = function (hintName, hintAction, determineWhetherToTriggerFnGetter) {
            if(!registeredHints[hintName]){
                registeredHints[hintName] = {
                    name: hintName,
                    action: hintAction,
                    determineWhetherToTriggerGetter: determineWhetherToTriggerFnGetter
                };
            }
            _hintMap[hintName] = hintName;
        };

        this.$get = [
            'InfraConfigSrv', '$q', '$log', '$injector', 'StorageSrv',
            function (InfraConfigSrv, $q, $log, $injector, StorageSrv) {
                var HintSrv = {};
                var hintPath = StorageSrv.variables.appUserSpacePath + '/hint';
                var defaultHints = {
                    hintsStatus:{}
                };

                HintSrv.hintMap = _hintMap;

                HintSrv.triggerHint = function (hintName) {
                    var hintData = registeredHints[hintName];
                        if(!hintData){
                        $log.error('HintSrv: the following hint is not registered ' + hintName);
                    }
                    return getHints().then(function(hints){
                        var hintsStatus = hints.hintsStatus;
                        var hintLastVal = getHintLastValue(hintsStatus[hintName]);

                        var determineWhetherToTrigger;
                        if(hintData.determineWhetherToTriggerGetter){
                            determineWhetherToTrigger = $injector.invoke(hintData.determineWhetherToTriggerGetter);
                        } else {
                            determineWhetherToTrigger = defaultDetermineWhetherToTriggerFn;
                        }

                        return $q.when(determineWhetherToTrigger(hintLastVal)).then(function(shouldBeTriggered){
                            if(shouldBeTriggered){
                                var hintAction = $injector.invoke(hintData.action);

                                return $q.when(hintAction(hintLastVal)).then(function(result){
                                    if(!hintsStatus[hintName]){
                                        hintsStatus[hintName] = {
                                            name: hintName,
                                            history: []
                                        };
                                    }

                                    hintsStatus[hintName].history.push({
                                        value: angular.isUndefined(result) ? true : result,
                                        date: StorageSrv.variables.currTimeStamp
                                    });

                                    hints.hintsStatus = hintsStatus;
                                    saveHints(hints);
                                    return result;
                                });
                            }
                        });
                    });
                };

                function getHints(){
                    return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                        return StudentStorageSrv.get(hintPath, defaultHints).then(function (hint) {
                            return hint;
                        });
                    });
                }

                function saveHints(newHint){
                    return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                        return StudentStorageSrv.set(hintPath, newHint);
                    });
                }

                function getHintLastValue(hintStatus){
                    return hintStatus && hintStatus.history && hintStatus.history.length && hintStatus.history[hintStatus.history.length - 1];
                }

                function defaultDetermineWhetherToTriggerFn(hintVal){
                    return angular.isUndefined(hintVal) || !hintVal.value;
                }

                return HintSrv;
            }];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.hint', ['znk.infra.config']);
})(angular);

/**
 * Created by Igor on 8/19/2015.
 */
/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence').directive('pngSequence', [
        '$timeout', 'ExpansionSrcSrv', '$window',
        function ($timeout, ExpansionSrcSrv, $window) {
            return {
                restrict: 'E',
                scope:{
                    onEnded: '&',
                    loop: '&',
                    speed:'&',
                    autoPlay: '&',
                    actions: '='
                },
                link: function (scope, element, attrs) {

                    var indexBound;

                    var requestID;

                    function buildComponent(){
                        var startIndex = +attrs.startIndex;
                        var endIndex = +attrs.endIndex;
                        var imageNum;
                        indexBound = endIndex - startIndex;
                        for(var i = startIndex; i < endIndex ; i++){
                            if(i < 100 || i < 10){
                                imageNum = i < 10 ? '00' + i :'0' + i;
                            }else{
                                imageNum = i;
                            }

                            var htmlTemplate = '<div ' +
                                    /* jshint validthis: true */
                                ' style="background-image: url(\'' + ExpansionSrcSrv.getExpansionSrc(attrs.imgData + imageNum + '.png') + '\'); background-size: cover; will-change: opacity; opacity:0; position: absolute; top:0; left:0;"></div>';

                            element.append(htmlTemplate);
                        }
                    }

                    function destroyCurrent(){
                        element.empty();
                    }

                    function PngAnimation() {
                        this.index = 0;
                        this.imagesDomElem = element[0].children;
                        this.lastTimestamp = false;
                    }


                    function animatePlay(timestamp) {
                        /* jshint validthis: true */
                        if(this.index === indexBound-1 && !scope.loop()){
                            $timeout(function(){
                                var children = element.children();
                                angular.element(children[children.length - 1]).css('display', 'none');
                                scope.onEnded();
                            });
                        }else{
                            if(this.lastTimestamp && (timestamp - this.lastTimestamp) < 40) {
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            } else {
                                this.imagesDomElem[this.index].style.opacity   =  0;
                                this.index = (this.index+1) % indexBound;
                                this.imagesDomElem[this.index].style.opacity   =  1;
                                this.lastTimestamp = timestamp;
                                requestID = $window.requestAnimationFrame(animatePlay.bind(this));
                            }
                        }

                    }

                    function observeHandler(){
                        destroyCurrent();
                        if(attrs.imgData && angular.isDefined(attrs.startIndex)&& attrs.endIndex){
                            buildComponent();
                            if(scope.autoPlay()){
                                var animateInstance = new PngAnimation();
                                requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                            }
                        }
                    }

                    function watchFn(){
                        return attrs.imgData + '_' + attrs.startIndex + '_' + attrs.endIndex + '_' + attrs.rotate;
                    }
                    scope.$watch(watchFn,observeHandler);

                    scope.actions = scope.actions || {};
                    scope.actions.play = function(){
                        //added in order for the build function to be executed before the play
                        $timeout(function(){
                            var animateInstance = new PngAnimation();
                            requestID = $window.requestAnimationFrame(animatePlay.bind(animateInstance));
                        },0,false);
                    };
                    scope.actions.reset = destroyCurrent;

                    scope.$on('$destroy',function(){
                        $window.cancelAnimationFrame(requestID);
                    });
                }
            };
        }
    ]);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.pngSequence', []);
})(angular);
(function (angular) {
    'use strict';

    angular.module('znk.infra.popUp', ['znk.infra.svgIcon', 'znk.infra.autofocus'])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    'exclamation-mark': 'components/popUp/svg/exclamation-mark-icon.svg',
                    'correct': 'components/popUp/svg/correct-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

'use strict';

(function () {
    angular.module('znk.infra.popUp').factory('PopUpSrv',[
        '$injector', '$q', '$rootScope', '$animate', '$document',
        function ($injector, $q, $rootScope, $animate, $document) {
            var PopUpSrv = {};

            var $body = angular.element($document[0].body);
            var popUpsPlaceHolderElement = angular.element('<div class="znk-popup"></div>');
            $body.append(popUpsPlaceHolderElement);

            var popupInstance,
                popupDefer;

            PopUpSrv.closePopup = function(reject,reason){
                if(!reason){
                    reason = 'closed';
                }
                popUpsPlaceHolderElement.empty();
                if (popupInstance.scope) {
                    popupInstance.scope.$destroy();
                }
                popupDefer[(reject ? 'reject' : 'resolve')](reason);
            };

            PopUpSrv.popup = function popup(wrapperCls,header,body,buttonsArr){
                //kill current popup if exists
                if(popupInstance){
                    PopUpSrv.closePopup();
                }
                var childScope = $rootScope.$new(true);
                childScope.d = {};

                popupDefer = $q.defer();
                popupInstance = {};
                popupInstance.promise = popupDefer.promise;

                var template =
                    '<div class="%wrapperCls%">' +
                        '<div class="znk-popup-wrapper">' +
                            '<div class="znk-popup-header">%header%</div>' +
                            '<div class="znk-popup-body">%body%</div>' +
                            '<div class="znk-popup-buttons">' +
                                '<div ng-repeat="button in ::d.buttons" class="button-wrapper">' +
                                    '<button class="btn" ' +
                                             'ng-click="d.btnClick(button)" ' +
                                             'ng-class="button.type" ' +
                                             'ng-autofocus="button.addAutoFocus" ' +
                                             'tabindex="0">' +
                                             '{{button.text}}' +
                                    '</button>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                wrapperCls = wrapperCls ? ' ' + wrapperCls : '';
                template = template.replace('%wrapperCls%',wrapperCls);

                header = header || '';
                template = template.replace('%header%',header);

                body = body || '';
                template = template.replace('%body%',body);

                if(angular.isDefined(buttonsArr) && !angular.isArray(buttonsArr)){
                    buttonsArr = [buttonsArr];
                }
                childScope.d.buttons = buttonsArr;
                childScope.d.btnClick = function(button){
                    if(button.hasOwnProperty('rejectVal')){
                        childScope.d.close(button.rejectVal,true);
                    }else{
                        childScope.d.close(button.resolveVal);
                    }
                };

                childScope.d.close = function(reason,reject){
                    var animationLeaveProm = $animate.leave($template);
                    animationLeaveProm.then(function(){
                        if(childScope){
                            childScope.$destroy();
                            childScope = null;
                        }
                        popupInstance = null;
                        if (angular.isDefined(popupDefer) && popupDefer !== null) {
                            var action = reject ? 'reject' : 'resolve';
                            reason = reason || 'close';
                            if(popupDefer[action]){
                                popupDefer[action](reason);
                            }
                            popupDefer = null;
                        }
                    });
                };

                var $template = angular.element(template);
                $animate.enter($template,popUpsPlaceHolderElement);
                //was added because injecting $compile dependency causing circular dependency
                var $compile = $injector.get('$compile');
                $compile(popUpsPlaceHolderElement.contents())(childScope);

                return popupInstance;
            };

            function basePopup(wrapperCls,headerIcon,title,content,btnArr){
                wrapperCls = wrapperCls ? wrapperCls + ' base-popup show-hide-animation' : 'base-popup show-hide-animation';

                headerIcon = headerIcon || '';
                var header = '<div class="icon-wrapper"><svg-icon name="%headerIcon%"></svg-icon></div>';
                header = header.replace('%headerIcon%',headerIcon);

                var body = '<div class="title responsive-title">%title%</div><div class="content">%content%</div>';
                title = title || '';
                body = body.replace('%title%',title);
                content = content || '';
                body = body.replace('%content%',content);

                return PopUpSrv.popup(wrapperCls,header,body,btnArr);
            }

            function BaseButton(text,type,resolveVal,rejectVal, addAutoFocus){
                var btn = {
                    text: text || '',
                    type: type || '',
                    addAutoFocus: addAutoFocus
                };

                if(rejectVal){
                    btn.rejectVal = rejectVal;
                }else{
                    btn.resolveVal = resolveVal;
                }

                return btn;
            }

            PopUpSrv.error = function error(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('error-popup','exclamation-mark',title || 'OOOPS...',content,[btn]);
            };

            PopUpSrv.ErrorConfirmation = function error(title, content, acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle, true)
                ];
                return basePopup('error-popup','exclamation-mark',title,content,buttons);
            };

            PopUpSrv.success = function success(title,content){
                var btn = new BaseButton('OK',null,'ok', undefined, true);
                return basePopup('success-popup','correct',title || '',content,[btn]);
            };

            PopUpSrv.warning = function warning(title,content,acceptBtnTitle,cancelBtnTitle){
                var buttons = [
                    new BaseButton(acceptBtnTitle,null,acceptBtnTitle),
                    new BaseButton(cancelBtnTitle,'btn-outline',undefined,cancelBtnTitle, true)
                ];
                return basePopup('warning-popup','exclamation-mark',title,content,buttons);
            };

            PopUpSrv.isPopupOpen = function(){
                return !!popupInstance;
            };

            return PopUpSrv;
        }
    ]);
})();

(function (angular) {
    'use strict';

    angular.module('znk.infra.scoring', ['znk.infra.storage', 'znk.infra.exerciseUtility']);
})(angular);

'use strict';
var CROSS_TEST_SCORE_ENUM = {
    0: { name: 'History / Social Studies' },
    1: { name: 'Science' }
};
angular.module('znk.infra.scoring').service('ScoringService', function($q, ExamTypeEnum, StorageRevSrv, $log, SubScoreSrv) {
    'ngInject';

    var keysMapConst = {
        crossTestScore: 'CrossTestScore',
        subScore: 'Subscore',
        miniTest: 'miniTest',
        test: 'test'
    };

    function _getScoreTableProm() {
        return StorageRevSrv.getContent({
            exerciseType: 'scoretable'
        }).then(function (scoreTable) {
            if (!scoreTable || !angular.isObject(scoreTable)) {
                var errMsg = 'ScoringService _getScoreTableProm: no scoreTable or scoreTable is not an object! scoreTable:' + scoreTable;
                $log.error(errMsg);
                return $q.reject(errMsg);
            }
            return scoreTable;
        });
    }

    function _getRawScore(questionsResults) {
        var score = 0;
        angular.forEach(questionsResults, function (question) {
            if (question.isAnsweredCorrectly) {
                score += 1;
            }
        });
        return score;
    }

    function _isTypeFull(typeId) {
        return ExamTypeEnum['FULL TEST'].enum === typeId;
    }

    function _getScoreTableKeyByTypeId(typeId) {
        return _isTypeFull(typeId) ? keysMapConst.test : keysMapConst.miniTest;
    }

    function _getDataFromTable(scoreTable, key, id, rawScore) {
        var data = angular.copy(scoreTable);
        if (angular.isDefined(key)) {
            data = data[key];
        }
        if (angular.isDefined(id)) {
            data = data[id];
        }
        if (angular.isDefined(rawScore)) {
            data = data[rawScore];
        }
        return data;
    }

    function _mergeSectionsWithResults(sections, sectionsResults) {
        return sections.reduce(function (previousValue, currentValue) {
            var currentSectionResult = sectionsResults.find(function (sectionResult) { return +sectionResult.exerciseId === currentValue.id; });
            previousValue.push(angular.extend({}, currentSectionResult, currentValue));
            return previousValue;
        }, []);
    }

    function _getResultsFn(scoreTable, questionsResults, typeId, id) {
        var rawScore = _getRawScore(questionsResults);
        var key = _getScoreTableKeyByTypeId(typeId);
        return _getDataFromTable(scoreTable, key, id, rawScore);
    }

    function _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId) {
        var data = _getResultsFn(scoreTable, questionsResults, typeId, categoryId);
        return {
            testScore: data
        };
    }

    function _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId) {
        var data = _getResultsFn(scoreTable, questionsResults, typeId, subjectId);
        return {
            sectionScore: data
        };
    }

    function _getFullExamSubAndCrossScoresFn(scoreTable, sections, sectionsResults) {
        var mergeSections = _mergeSectionsWithResults(sections, sectionsResults);
        var subScoresMap = {};
        var crossTestScoresMap = {};
        var subScoresArrProms = [];
        angular.forEach(mergeSections, function (section) {
            angular.forEach(section.questionResults, function (questionResult) {
                var subScoresArrProm = SubScoreSrv.getSpecificCategorySubScores(questionResult.categoryId);
                subScoresArrProm.then(function (subScoresArr) {
                    if (subScoresArr.length > 0) {
                        angular.forEach(subScoresArr, function (subScore) {
                            if (!subScoresMap[subScore.id]) {
                                subScoresMap[subScore.id] = { raw: 0, name: subScore.name, subjectId: section.subjectId };
                            }
                            if (questionResult.isAnsweredCorrectly) {
                                subScoresMap[subScore.id].raw += 1;
                            }
                        });
                    }
                    return subScoresArr;
                });
                subScoresArrProms.push(subScoresArrProm);
                var crossTestScoreId = questionResult.crossTestScoreId;
                if (angular.isDefined(crossTestScoreId) && crossTestScoreId !== null) {
                    if (!crossTestScoresMap[crossTestScoreId]) {
                        crossTestScoresMap[crossTestScoreId] = { raw: 0, name: CROSS_TEST_SCORE_ENUM[crossTestScoreId].name };
                    }
                    if (questionResult.isAnsweredCorrectly) {
                        crossTestScoresMap[crossTestScoreId].raw += 1;
                    }
                }
            });
        });

        return $q.all(subScoresArrProms).then(function () {
            angular.forEach(subScoresMap, function (subScore, key) {
                subScoresMap[key].sum = _getDataFromTable(scoreTable, keysMapConst.subScore, key, subScore.raw);
            });
            angular.forEach(crossTestScoresMap, function (crossTestScores, key) {
                crossTestScoresMap[key].sum = _getDataFromTable(scoreTable, keysMapConst.crossTestScore, key, crossTestScores.raw);
            });
            return {
                subScores: subScoresMap,
                crossTestScores: crossTestScoresMap
            };
        });
    }

    // api

    this.isTypeFull = function (typeId) {
        return ExamTypeEnum['FULL TEST'].enum === typeId;
    };

    this.getTestScoreResult = function (questionsResults, typeId, categoryId) {
        return _getScoreTableProm().then(function (scoreTable) {
            return _getTestScoreResultFn(scoreTable, questionsResults, typeId, categoryId);
        });
    };

    this.getSectionScoreResult = function (questionsResults, typeId, subjectId) {
        return _getScoreTableProm().then(function (scoreTable) {
            return _getSectionScoreResultFn(scoreTable, questionsResults, typeId, subjectId);
        });
    };

    this.getFullExamSubAndCrossScores = function (sections, sectionsResults) {
        return _getScoreTableProm().then(function (scoreTable) {
            return _getFullExamSubAndCrossScoresFn(scoreTable, sections, sectionsResults);
        });
    };

    this.rawScoreToScore = function (subjectId, rawScore) {
        return _getScoreTableProm().then(function (scoreTable) {
            var roundedRawScore = Math.round(rawScore);
            return _getDataFromTable(scoreTable, keysMapConst.test, subjectId, roundedRawScore);
        });
    };

    this.getTotalScoreResult = function (scoresArr) {
        var totalScores = 0;
        angular.forEach(scoresArr, function (score) {
            totalScores += score;
        });
        return $q.when(totalScores);
    };
});


(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll', []);
})(angular);
/**
 * attrs:
 *      actions:
 *          animate: function (scrollTo,animationDuration,transition)
 *      scrollOnMouseWheel: whether to scroll on mouse wheel default false
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.scroll').directive('znkScroll', [
        '$log', '$window', '$timeout', '$interpolate',
        function ($log, $window, $timeout, $interpolate) {
            function setElementTranslateX(element,val,isOffset,minVal,maxVal){
                var domElement = angular.isArray(element) ? element[0] : element;
                var newTranslateX = val;
                if(isOffset){
                    var currTransformVal = domElement.style.transform;
                    var currXMatchRegex = currTransformVal.match(/translateX\((.*)px\)/);
                    var currX;
                    if(!angular.isArray(currXMatchRegex ) || currXMatchRegex.length < 2){
                        //$log.debug('failed to math transform value');
                        currX = 0;
                    }else{
                        currX = +currXMatchRegex[1];
                    }
                    newTranslateX += currX;
                }
                minVal = angular.isUndefined(minVal) ? -Infinity : minVal;
                maxVal = angular.isUndefined(maxVal) ? Infinity : maxVal;

                newTranslateX = Math.max(newTranslateX,minVal);
                newTranslateX = Math.min(newTranslateX,maxVal);

                var newTransformValue = 'translateX(' + newTranslateX + 'px)';
                setCssPropery(domElement,'transform',newTransformValue);
            }

            function setCssPropery(element,prop,value){
                var domElement = angular.isArray(element) ? element[0] : element;
                if(value === null){
                    domElement.style[prop] = '';
                }else{
                    domElement.style[prop] = value;
                }
            }

            function getElementWidth(element){
                var domElement = angular.isArray(element) ? element[0] : element;

                var domElementStyle  = $window.getComputedStyle(domElement);
                var domElementMarginRight = +domElementStyle.marginRight.replace('px','');
                var domElementMarginLeft = +domElementStyle.marginLeft.replace('px','');
                return domElement .offsetWidth + domElementMarginRight + domElementMarginLeft;
            }

            return {
                restrict: 'E',
                compile: function(element){
                    var domElement = element[0];

                    var currMousePoint;
                    var containerWidth;
                    var childWidth;

                    var WHEEL_MOUSE_EVENT = 'wheel';

                    function mouseMoveEventHandler(evt){
                        //$log.debug('mouse move',evt.pageX);
                        var xOffset = evt.pageX - currMousePoint.x;

                        currMousePoint.x = evt.pageX;
                        currMousePoint.y = evt.pageY;
                        moveScroll(xOffset,containerWidth,childWidth);
                        //stop event bubbling
                        evt.preventDefault();
                        evt.stopPropagation();
                        return false;
                    }
                    function mouseUpEventHandler(){
                        //$log.debug('mouse up',evt.pageX);
                        document.removeEventListener('mousemove',mouseMoveEventHandler);
                        document.removeEventListener('mouseup',mouseUpEventHandler);
                        containerWidth = null;
                        childWidth = null;
                        currMousePoint = null;
                    }
                    function mouseDownHandler(evt){
                        //$log.debug('mouse down',evt.pageX);

                        var child = domElement.children[0];
                        if(!child){
                            return;
                        }

                        containerWidth = domElement.offsetWidth;
                        childWidth = getElementWidth(child);

                        currMousePoint = {
                            x: evt.pageX,
                            y: evt.pageY
                        };


                        document.addEventListener('mousemove',mouseMoveEventHandler);

                        document.addEventListener('mouseup',mouseUpEventHandler);
                    }
                    domElement.addEventListener('mousedown',mouseDownHandler);

                    function moveScroll(xOffset, containerWidth, childWidth/*,yOffset*/){
                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;
                        var child = domElement.children[0];

                        if(!child.style.transform){
                            setElementTranslateX(child,0,false,false,minTranslateX,maxTranslateX);
                        }

                        setElementTranslateX(child,xOffset,true,minTranslateX,maxTranslateX);
                    }

                    function setScrollPos(scrollX){
                        var containerWidth = domElement.offsetWidth;
                        var child = domElement.children[0];
                        var childWidth = getElementWidth(child);
                        var minTranslateX = Math.min(containerWidth - childWidth,0);
                        var maxTranslateX = 0;
                        setElementTranslateX(child,scrollX,false,minTranslateX,maxTranslateX);
                    }

                    return {
                        pre: function(scope,element,attrs){
                            var child = domElement.children[0];
                            if(child){
                                setElementTranslateX(child,0);
                            }

                            var scrollOnMouseWheel = $interpolate(attrs.scrollOnMouseWheel || '')(scope) !== 'false';
                            var containerWidth,childWidth;
                            function mouseWheelEventHandler(evt){
                                //$log.debug('mouse wheel event',evt);
                                var offset = -evt.deltaY * 4;// firefox is really slow....
                                moveScroll(offset, containerWidth, childWidth);
                            }
                            function mouseEnterEventHandler(){
                                //$log.debug('mouse enter');
                                containerWidth = domElement.offsetWidth;
                                childWidth = getElementWidth(domElement.children[0]);
                                domElement.addEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
                            }
                            function mouseUpEventHandler(){
                                //$log.debug('mouse leave');
                                domElement.removeEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
                            }
                            if(scrollOnMouseWheel){
                                domElement.addEventListener('mouseenter',mouseEnterEventHandler);
                                domElement.addEventListener('mouseleave',mouseUpEventHandler);
                            }

                            if(attrs.actions){
                                if(angular.isUndefined(scope.$eval(attrs.actions))){
                                    scope.$eval(attrs.actions + '={}');
                                }
                                var actions = scope.$eval(attrs.actions);

                                actions.animate = function(scrollTo,transitionDuration,transitionTimingFunction){
                                    if(transitionDuration && transitionTimingFunction){
                                        var transitionPropVal = 'transform ' + transitionDuration + 'ms ' + transitionTimingFunction;
                                        setCssPropery(child,'transition',transitionPropVal);
                                    }
                                    setScrollPos(scrollTo);
                                    //@todo(igor) may be out of sync
                                    $timeout(function(){
                                        setCssPropery(child,'transition',null);
                                    },transitionDuration,false);
                                };
                            }

                            scope.$on('$destroy',function(){
                                document.removeEventListener('mousemove',mouseMoveEventHandler);
                                document.removeEventListener('mouseup',mouseUpEventHandler);
                                domElement.removeEventListener('mousedown',mouseDownHandler);
                                domElement.removeEventListener('mouseenter',mouseEnterEventHandler);
                                domElement.removeEventListener('mouseleave',mouseUpEventHandler);
                                domElement.removeEventListener(WHEEL_MOUSE_EVENT,mouseWheelEventHandler);
                            });
                        }
                    };

                }
            };
        }
    ]);

})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.stats', [
            'znk.infra.enum',
            'znk.infra.znkExercise',
            'znk.infra.utility'
        ])
        .run([
            'StatsEventsHandlerSrv',
            function (StatsEventsHandlerSrv) {
                StatsEventsHandlerSrv.init();
            }
        ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').factory('StatsEventsHandlerSrv', [
        'exerciseEventsConst', 'StatsSrv', 'ExerciseTypeEnum', '$log', 'UtilitySrv',
        function (exerciseEventsConst, StatsSrv, ExerciseTypeEnum, $log, UtilitySrv) {
            var StatsEventsHandlerSrv = {};

            StatsEventsHandlerSrv.addNewExerciseResult = function(exerciseType, exercise, results){
                return StatsSrv.isExerciseStatsRecorded(exerciseType, exercise.id).then(function (isRecorded) {
                    if (isRecorded) {
                        return;
                    }

                    var newStats = {};

                    var questionsMap = UtilitySrv.array.convertToMap(exercise.questions);
                    results.questionResults.forEach(function (result) {
                        var question = questionsMap[result.questionId];
                        var categoryId = question.categoryId;

                        if (isNaN(+categoryId) || categoryId === null) {
                            $log.error('StatsEventsHandlerSrv: _eventHandler: bad category id for the following question: ', question.id, categoryId);
                            return;
                        }

                        if (!newStats[categoryId]) {
                            newStats[categoryId] = new StatsSrv.BaseStats();
                        }
                        var newStat = newStats[categoryId];

                        newStat.totalQuestions++;

                        newStat.totalTime += result.timeSpent || 0;

                        if (angular.isUndefined(result.userAnswer)) {
                            newStat.unanswered++;
                        } else if (result.isAnsweredCorrectly) {
                            newStat.correct++;
                        } else {
                            newStat.wrong++;
                        }
                    });

                    return StatsSrv.updateStats(newStats, exerciseType, exercise.id);
                });
            };

            //added in order to load the service
            StatsEventsHandlerSrv.init = angular.noop;

            return StatsEventsHandlerSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').service('StatsQuerySrv', [
        'StatsSrv', '$q',
        function (StatsSrv, $q) {
            var StatsQuerySrv = {};

            function _getCategoryWeakness(category) {
                if (!category.totalQuestions) {
                    return -Infinity;
                }
                return (category.totalQuestions - category.correct) / (category.totalQuestions);
            }

            function WeaknessAccumulator() {
                var currWeakestCategory = {};

                function _isMostWeakSoFar(categoryWeakness) {
                    return angular.isUndefined(currWeakestCategory.weakness) || currWeakestCategory.weakness < categoryWeakness;
                }

                this.proccessCategory = function (categoryStats) {
                    var categoryWeakness = _getCategoryWeakness(categoryStats);
                    if (_isMostWeakSoFar(categoryWeakness)) {
                        currWeakestCategory.weakness = categoryWeakness;
                        currWeakestCategory.category = categoryStats;
                    }
                };

                this.getWeakestCategory = function () {
                    return currWeakestCategory.category;
                };
            }

            StatsQuerySrv.getWeakestCategoryInLevel = function (level, optionalIds, parentId) {
                function _isOptional(categoryStats) {
                    if (!optionalIds.length && angular.isUndefined(parentId)) {
                        return true;
                    }

                    var id = categoryStats.id;
                    if (optionalIds.length && (optionalIds.indexOf(id) === -1)) {
                        return false;
                    }

                    var parentsIds = categoryStats.parentsIds;
                    if (angular.isDefined(parentId) && parentsIds.indexOf(parentId) === -1) {
                        return false;
                    }

                    return true;
                }

                if (!angular.isArray(optionalIds)) {
                    optionalIds = [];
                }

                return StatsSrv.getLevelStats(level).then(function (levelStats) {
                    var iteratedObjProm = $q.when();
                    var iteratedObj = {};

                    if (optionalIds.length) {
                        var allProm = [];
                        optionalIds.forEach(function (categoryId) {
                            var categoryKey = StatsSrv.getCategoryKey(categoryId);

                            if (levelStats && levelStats[categoryKey]) {
                                iteratedObj[categoryKey] = levelStats[categoryKey];
                            } else {
                                var prom = StatsSrv.getAncestorIds(categoryId).then(function (parentsIds) {
                                    iteratedObj[categoryKey] = new StatsSrv.BaseStats(categoryId, true);
                                    iteratedObj[categoryKey].parentsIds = parentsIds;
                                });
                                allProm.push(prom);
                            }
                        });
                        iteratedObjProm = $q.all(allProm);
                    } else {
                        iteratedObjProm = $q.when();
                        iteratedObj = levelStats;
                    }

                    return iteratedObjProm.then(function () {
                        var weaknessAccumulator = new WeaknessAccumulator();
                        angular.forEach(iteratedObj, function (categoryStats) {
                            if (_isOptional(categoryStats)) {
                                weaknessAccumulator.proccessCategory(categoryStats);
                            }
                        });

                        return weaknessAccumulator.getWeakestCategory();
                    });

                });
            };

            return StatsQuerySrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.stats').provider('StatsSrv', function () {
        var getCategoryLookup;
        this.setCategoryLookup = function (_getCategoryLookup) {
            getCategoryLookup = _getCategoryLookup;
        };

        this.$get = [
            'InfraConfigSrv', '$q', 'SubjectEnum', '$log', '$injector', 'StorageSrv',
            function (InfraConfigSrv, $q, SubjectEnum, $log, $injector, StorageSrv) {
                if (!getCategoryLookup) {
                    $log.error('StatsSrv: getCategoryLookup was not set !!!!');
                }

                var STATS_PATH = StorageSrv.variables.appUserSpacePath + '/stats';

                var StatsSrv = {};

                var _getCategoryLookup = function() {
                    return $injector.invoke(getCategoryLookup).then(function(categoryMap){
                        return categoryMap;
                    });
                };

                function BaseStats(id, addInitOffset) {
                    if (angular.isDefined(id)) {
                        this.id = +id;
                    }

                    var totalQuestions;
                    var correct;
                    var unanswered;
                    var wrong;
                    var totalTime;


                    if (addInitOffset) {
                        totalQuestions = 5;
                        correct = 1;
                        unanswered = 0;
                        wrong = 4;
                        totalTime = 0;
                    } else {
                        totalQuestions = 0;
                        correct = 0;
                        unanswered = 0;
                        wrong = 0;
                        totalTime = 0;
                    }

                    this.totalQuestions = totalQuestions;
                    this.correct = correct;
                    this.unanswered = unanswered;
                    this.wrong = wrong;
                    this.totalTime = totalTime;
                }

                function getStats() {
                    var defaults = {
                        processedExercises:{}
                    };
                    return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                        return StudentStorageSrv.get(STATS_PATH, defaults);
                    });
                }

                function setStats(newStats) {
                    return InfraConfigSrv.getStudentStorage().then(function(StudentStorageSrv){
                        return StudentStorageSrv.set(STATS_PATH, newStats);
                    });
                }

                function _baseStatsUpdater(currStat, newStat) {
                    currStat.totalQuestions += newStat.totalQuestions;
                    currStat.correct += newStat.correct;
                    currStat.unanswered += newStat.unanswered;
                    currStat.wrong += newStat.wrong;
                    currStat.totalTime += newStat.totalTime;
                }

                function _getParentCategoryId(lookUp, categoryId) {
                    return lookUp[categoryId] ? lookUp[categoryId].parentId : lookUp[categoryId];
                }

                function _getProcessedExerciseKey(exerciseType, exerciseId){
                    return exerciseType + '_' + exerciseId;
                }

                StatsSrv.getLevelKey = function(level) {
                    return 'level' + level + 'Categories';
                };

                StatsSrv.getCategoryKey = function (categoryId){
                    return 'id_' + categoryId;
                };

                StatsSrv.getAncestorIds = function(categoryId){
                    var parentIds = [];
                    return _getCategoryLookup().then(function(categoryLookUp){
                        var categoryIdToAdd = _getParentCategoryId(categoryLookUp, +categoryId);
                        while (categoryIdToAdd !== null && angular.isDefined(categoryIdToAdd)) {
                            parentIds.push(categoryIdToAdd);
                            categoryIdToAdd = _getParentCategoryId(categoryLookUp, categoryIdToAdd);
                        }
                        return parentIds;
                    });
                };

                StatsSrv.getStats = getStats;

                StatsSrv.getLevelStats = function(level){
                    var levelKey = StatsSrv.getLevelKey(level);
                    return getStats().then(function(statsData){
                        return statsData[levelKey];
                    });
                };

                StatsSrv.BaseStats = BaseStats;

                StatsSrv.updateStats = function (newStats, exerciseType, exerciseId) {
                    var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                    return getStats().then(function (stats) {
                        var isExerciseRecorded = stats.processedExercises[processedExerciseKey];
                        if(isExerciseRecorded){
                            return;
                        }

                        var allProm = [];
                        angular.forEach(newStats, function (newStat, processedCategoryId) {
                            var prom = StatsSrv.getAncestorIds(processedCategoryId).then(function(categoriesToUpdate){
                                categoriesToUpdate.unshift(+processedCategoryId);
                                var deepestLevel = categoriesToUpdate.length;
                                categoriesToUpdate.forEach(function (categoryId, index) {
                                    var level = deepestLevel - index;
                                    var levelKey = StatsSrv.getLevelKey(level);
                                    var levelStats = stats[levelKey];
                                    if (!levelStats) {
                                        levelStats = {};

                                        stats[levelKey] = levelStats;
                                    }

                                    var categoryKey = StatsSrv.getCategoryKey(categoryId);
                                    var categoryStats = levelStats[categoryKey];
                                    if(!categoryStats){
                                        categoryStats = new BaseStats(categoryId,true);

                                        var parentsIds = categoriesToUpdate.slice(index + 1);
                                        if(parentsIds.length){
                                            categoryStats.parentsIds = parentsIds;
                                        }

                                        levelStats[categoryKey] = categoryStats;
                                    }

                                    _baseStatsUpdater(categoryStats,newStat);
                                });
                            });
                            allProm.push(prom);
                        });
                        return $q.all(allProm).then(function(){
                            stats.processedExercises[processedExerciseKey] = true;
                            return setStats(stats);
                        });
                    });

                };

                StatsSrv.isExerciseStatsRecorded = function(exerciseType, exerciseId){
                    return StatsSrv.getStats().then(function(stats){
                        var processedExerciseKey = _getProcessedExerciseKey(exerciseType, exerciseId);
                        return !!stats.processedExercises[processedExerciseKey];
                    });
                };

                return StatsSrv;
            }
        ];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage', []);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('storageFirebaseAdapter', [
        '$log', '$q', 'StorageSrv',
        function ($log, $q, StorageSrv) {
            function processValuesToSet(source){
                if(angular.isArray(source)){
                    source.forEach(function(item, index){
                        if(angular.isUndefined(item)){
                            source[index] = null;
                        }
                        processValuesToSet(item);
                    });
                    return;
                }

                if(angular.isObject(source)){
                    var keys = Object.keys(source);
                    keys.forEach(function(key){
                        var value = source[key];

                        if(key[0] === '$' || angular.isUndefined(value) || (angular.isArray(value) && !value.length) || (value !== value)){//value !== value return true if it equals to NaN
                            if(key !== '$save'){
                                $log.debug('storageFirebaseAdapter: illegal property was deleted before save ' + key);
                            }
                            delete source[key];
                            return;
                        }

                        if(angular.isString(value)){
                            source[key] = processValue(value);
                        }

                        processValuesToSet(value);
                    });
                    return;
                }
            }

            function storageFirebaseAdapter (endPoint){
                var refMap = {};
                var authObj;
                var rootRef = new Firebase(endPoint);
                refMap.rootRef = rootRef;
                rootRef.onAuth(function(newAuthObj){
                    authObj = newAuthObj;
                });

                function getRef(relativePath){
                    if(!refMap[relativePath]){
                        refMap[relativePath] = refMap.rootRef.child(relativePath);
                    }
                    return refMap[relativePath];
                }

                function get(relativePath){
                    var defer = $q.defer();

                    var ref = getRef(relativePath);
                    ref.once('value',function(dataSnapshot){
                        defer.resolve(dataSnapshot.val());
                    },function(err){
                        $log.error('storageFirebaseAdapter: failed to retrieve data for the following path ' + relativePath + ' ' + err);
                        defer.reject(err);
                    });
                    return defer.promise;
                }

                function set(relativePathOrObject, newValue){
                    var defer = $q.defer();

                    if(angular.isObject(relativePathOrObject)){
                        var valuesToSet ={};
                        angular.forEach(relativePathOrObject,function(value,path){
                            valuesToSet[path] = angular.copy(value);
                        });
                        processValuesToSet(valuesToSet);
                        refMap.rootRef.update(valuesToSet, function(err){
                            if(err){
                                defer.reject(err);
                            }
                            defer.resolve();
                        });
                    }else{
                        var newValueCopy = angular.copy(newValue);
                        processValuesToSet(newValueCopy);
                        var ref = getRef(relativePathOrObject);
                        ref.set(newValueCopy,function(err){
                            if(err){
                                $log.error('storageFirebaseAdapter: failed to set data for the following path ' + relativePathOrObject + ' ' + err);
                                defer.reject(err);
                            }else{
                                defer.resolve(newValueCopy);
                            }
                        });
                    }

                    return defer.promise;
                }

                return {
                    get: get,
                    set: set,
                    __refMap: refMap//for testing
                };
            }

            function processValue(value){
                if(value === StorageSrv.variables.currTimeStamp){
                    return Firebase.ServerValue.TIMESTAMP;
                }
                return value;
            }

            return storageFirebaseAdapter;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.storage').factory('StorageSrv', [
        '$cacheFactory', '$q', '$log',
        function ($cacheFactory, $q, $log) {
            var getEntityPromMap = {};

            var cacheId = 0;

            /**
             *  entityGetter -
             *  entitySetter -
             *  config-
             *      cacheRules - rules which control whether path should be cached, the possible values are:
             *          string - if the path equal to the rule string the it will not be cached.
             *          function - receive the path as argument, if the function return true then the path will not be cached.
             *          regex - if the path matches the regex then it will not be cached.
             *      variables -
             *          uid - function or value which return current uid as straight value or promise
             * */
            function StorageSrv(entityGetter, entitySetter, config) {
                this.getter = function (path) {
                    return $q.when(entityGetter(path));
                };

                this.setter = function (path, newVal) {
                    return $q.when(entitySetter(path, newVal));
                };

                this.entityCache = $cacheFactory('entityCache' + cacheId);

                config = config || {};
                var defaultConfig = {
                    variables: {
                        uid: null
                    },
                    cacheRules: []
                };
                this.config = angular.extend(defaultConfig, config);

                cacheId++;
            }

            function _shouldBeCached(path, config) {
                var cacheRules = config.cacheRules;

                for (var i = 0; i < cacheRules.length; i++) {
                    var rule = cacheRules[i];
                    var shouldNotBeCached = false;

                    if (angular.isString(rule)) {
                        shouldNotBeCached = rule === path;
                    }

                    if (angular.isFunction(rule)) {
                        shouldNotBeCached = rule(path);
                    }

                    if (rule instanceof RegExp) {
                        shouldNotBeCached = rule.test(path);
                    }

                    if (shouldNotBeCached) {
                        return false;
                    }
                }
                return true;
            }

            function _getUid(config) {
                var getUid = angular.isFunction(config.variables.uid) ? config.variables.uid() : config.variables.uid;
                return $q.when(getUid);
            }

            function _processPath(pathStrOrObj, config) {
                return _getUid(config).then(function (uid) {
                    function _replaceVariables(path){
                        var regexString = StorageSrv.variables.uid.replace(/\$/g, '\\$');
                        var UID_REGEX = new RegExp(regexString, 'g');
                        return path.replace(UID_REGEX, uid);
                    }

                    if (angular.isUndefined(uid) || uid === null) {
                        $log.debug('StorageSrv: empty uid was received');
                    }

                    if(angular.isString(pathStrOrObj)){
                        var processedPath = _replaceVariables(pathStrOrObj);
                        return processedPath;
                    }

                    if(angular.isObject(pathStrOrObj)){
                        var processedPathObj = {};
                        angular.forEach(pathStrOrObj, function(value, pathName){
                            var processedPath = _replaceVariables(pathName);
                            processedPathObj[processedPath] = value;
                        });

                        return processedPathObj;
                    }
                    $log.error('StorageSrv: failed to process path');
                });
            }

            StorageSrv.prototype.get = function (path, defaultValue) {
                var self = this;

                return _processPath(path, self.config).then(function (processedPath) {
                    var entity = self.entityCache.get(processedPath);
                    var getProm;
                    defaultValue = defaultValue || {};
                    var cacheProm = false;

                    if (entity) {
                        getProm = $q.when(entity);
                    } else {
                        if (getEntityPromMap[processedPath]) {
                            return getEntityPromMap[processedPath];
                        }
                        cacheProm = true;
                        getProm = self.getter(processedPath).then(function (_entity) {
                            if (angular.isUndefined(_entity) || _entity === null) {
                                _entity = {};
                            }

                            if (angular.isObject(_entity)) {
                                var initObj = Object.create({
                                    $save: function () {
                                        return self.set(processedPath, this);
                                    }
                                });
                                _entity = angular.extend(initObj, _entity);
                            }

                            if (_shouldBeCached(processedPath, self.config)) {
                                self.entityCache.put(processedPath, _entity);
                            }

                            delete getEntityPromMap[processedPath];

                            return _entity;
                        });
                    }
                    getProm = getProm.then(function (_entity) {
                        var keys = Object.keys(defaultValue);
                        keys.forEach(function (key) {
                            if (angular.isUndefined(_entity[key])) {
                                _entity[key] = angular.copy(defaultValue[key]);
                            }
                        });
                        return _entity;
                    });

                    if (cacheProm) {
                        getEntityPromMap[path] = getProm;
                    }

                    return getProm;
                });
            };

            StorageSrv.prototype.getServerValue = function(path){
                var self = this;
                return _processPath(path, self.config).then(function (processedPath) {
                    return self.getter(processedPath);
                });
            };

            StorageSrv.prototype.set = function (pathStrOrObj, newValue) {
                var self = this;

                return _processPath(pathStrOrObj, self.config).then(function (processedPathOrObj) {
                    return self.setter(processedPathOrObj, newValue).then(function () {
                        var dataToSaveInCache = {};

                        if (!angular.isObject(processedPathOrObj)) {
                            dataToSaveInCache[processedPathOrObj] = newValue;
                        } else {
                            dataToSaveInCache = processedPathOrObj;
                        }

                        var cachedDataMap = {};
                        angular.forEach(dataToSaveInCache, function (value, path) {
                            var cachedValue;

                            if (angular.isObject(value) && !value.$save) {
                                cachedValue = Object.create({
                                    $save: function () {
                                        return self.set(path, this);
                                    }
                                });
                                angular.forEach(value, function (value, key) {
                                    cachedValue[key] = value;
                                });
                            } else {
                                cachedValue = value;
                            }

                            cachedDataMap[path] = cachedValue;

                            if (_shouldBeCached(path, self.config)) {
                                self.entityCache.put(path, cachedValue);
                            }
                        });

                        return angular.isObject(processedPathOrObj) ? cachedDataMap : cachedDataMap[processedPathOrObj];
                    });
                });
            };

            StorageSrv.prototype.entityCommunicator = function (path, defaultValues) {
                return new EntityCommunicator(path, defaultValues, this);
            };

            StorageSrv.prototype.cleanPathCache = function (path) {
                this.entityCache.remove(path);
            };

            StorageSrv.variables = StorageSrv.prototype.variables = {
                currTimeStamp: '%currTimeStamp%',
                uid: '$$uid',
                appUserSpacePath: 'users/$$uid'
            };

            function EntityCommunicator(path, defaultValue, storage) {
                this.path = path;
                this.defaultValue = defaultValue;
                this.storage = storage;
            }

            EntityCommunicator.prototype.get = function () {
                return this.storage.get(this.path);
            };

            EntityCommunicator.prototype.set = function (newVal) {
                return this.storage.set(this.path, newVal);
            };

            return StorageSrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon', []);
})(angular);
/**
 * attrs:
 *  name: svg icon name
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').directive('svgIcon', [
        '$log', 'SvgIconSrv',
        function ($log, SvgIconSrv) {
            return {
                scope: {
                    name: '@'
                },
                link: {
                    pre: function (scope, element) {
                        function _appendSvgIcon(name){
                            element.addClass(name);
                            SvgIconSrv.getSvgByName(name).then(function (svg) {
                                element.append(svg);
                            });
                        }

                        function _nameAttrWatchFn(){
                            return element.attr('name');
                        }

                        scope.$watch(_nameAttrWatchFn, function(newName, prevName){
                            element.empty();

                            if(prevName){
                                element.removeClass(prevName);
                            }

                            if(newName){
                                _appendSvgIcon(newName);
                            }
                        });
                    }
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.svgIcon').provider('SvgIconSrv', [
        function () {
            var defaultConfig = {};
            this.setConfig = function (_config) {
                angular.extend(defaultConfig, _config);
            };

            var svgMap = {};
            this.registerSvgSources = function (_svgMap) {
                var alreadyRegisteredSvgIconNames = Object.keys(svgMap);
                alreadyRegisteredSvgIconNames.forEach(function(svgIconName){
                    if(!!_svgMap[svgIconName]){
                        console.error('SvgIconSrv: svg icon was already defined before ',svgIconName);
                    }
                });
                angular.extend(svgMap,_svgMap);
                return true;
            };

            var getSvgPromMap = {};

            this.$get = [
                '$templateCache', '$q', '$http', '$log',
                function ($templateCache, $q, $http, $log) {
                    var SvgIconSrv = {};

                    SvgIconSrv.getSvgByName = function (name) {
                        var src = svgMap[name];

                        if(!src){
                            $log.error('SvgIconSrv: src is missing for the following name', name);
                            return $q.reject('no source was found');
                        }

                        if(getSvgPromMap[src]){
                            return getSvgPromMap[src];
                        }

                        var fromCache = $templateCache.get(src);
                        if(fromCache){
                            return $q.when(fromCache);
                        }

                        var getSvgProm =  $http.get(src).then(function(res){
                            $templateCache.put(src,res.data);
                            delete getSvgPromMap[src];
                            return res.data;
                        });
                        getSvgPromMap[src] = getSvgProm;

                        return getSvgProm;
                    };

                    return SvgIconSrv;
                }
            ];
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.user', []);
})(angular);

'use strict';

angular.module('znk.infra.user').service('UserProfileService',
    function (InfraConfigSrv, StorageSrv) {

        var profilePath = StorageSrv.variables.appUserSpacePath + '/profile';

        this.getProfile = function () {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.get(profilePath).then(function (profile) {
                    if (profile && (angular.isDefined(profile.email) || angular.isDefined(profile.nickname))) {
                        return profile;
                    }
                    return InfraConfigSrv.getUserData().then(function(authData) {
                        var emailFromAuth = authData.password ? authData.password.email : '';
                        var nickNameFromAuth = authData.auth ? authData.auth.name : emailFromAuth;

                        if (!profile.email) {
                            profile.email = emailFromAuth;
                        }
                        if (!profile.nickname) {
                            profile.nickname = nickNameFromAuth;
                        }
                        if (!profile.createdTime) {
                            profile.createdTime = StorageSrv.variables.currTimeStamp;
                        }

                        return globalStorage.set(profilePath, profile);
                    });
                });
            });
        };

        this.setProfile = function (newProfile) {
            return InfraConfigSrv.getGlobalStorage().then(function(globalStorage) {
                return globalStorage.set(profilePath, newProfile);
            });
        };
});

(function (angular) {
    'use strict';

    angular.module('znk.infra.utility').factory('UtilitySrv', [
        '$q',
        function ($q) {
            var UtilitySrv = {};

            //general utility functions
            UtilitySrv.general = {};

            UtilitySrv.general.createGuid = function(){
                function s4() {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); // jshint ignore:line
                }

                return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase();
            };

            // object utility function
            UtilitySrv.object = {};

            UtilitySrv.object.extendWithoutOverride = function(dest, src){
                angular.forEach(src, function(val,key){
                    if(!dest.hasOwnProperty(key)){
                        dest[key] = val;
                    }
                });
            };

            UtilitySrv.object.convertToArray = function(obj){
                var arr = [];
                angular.forEach(obj, function(obj){
                    arr.push(obj);
                });
                return arr;
            };

            //array utility srv
            UtilitySrv.array = {};

            UtilitySrv.array.convertToMap = function(arr, keyProp){
                if(angular.isUndefined(keyProp)){
                    keyProp = 'id';
                }
                var map = {};
                arr.forEach(function(item){
                    map[item[keyProp]] = item;
                });
                return map;
            };

            UtilitySrv.fn = {};

            UtilitySrv.fn.singletonPromise = function(promGetter){
                var prom;
                return function(){
                    if(!prom){
                        prom = $q.when(angular.isFunction(promGetter) ? promGetter() : promGetter);
                    }
                    return prom;
                };
            };
            
            return UtilitySrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.utility', []);
})(angular);

/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('answerBuilder', [
        '$compile', 'AnswerTypeEnum', 'ZnkExerciseUtilitySrv', 'ZnkExerciseViewModeEnum',
        function ($compile, AnswerTypeEnum, ZnkExerciseUtilitySrv, ZnkExerciseViewModeEnum) {
            var typeToViewMap = {};

            typeToViewMap[AnswerTypeEnum.SELECT_ANSWER.enum] = '<select-answer></select-answer>';
            typeToViewMap[AnswerTypeEnum.FREE_TEXT_ANSWER.enum] = '<free-text-answer></free-text-answer>';
            typeToViewMap[AnswerTypeEnum.RATE_ANSWER.enum] = '<rate-answer></rate-answer>';

            return {
                require: ['answerBuilder','^questionBuilder', '^ngModel'],
                restrict: 'E',
                controller:[
                    function(){

                    }
                ],
                link: {
                    pre:function (scope, element, attrs, ctrls) {
                        var answerBuilderCtrl = ctrls[0];
                        var questionBuilderCtrl = ctrls[1];
                        var ngModelCtrl = ctrls[2];

                        var fnToBindFromQuestionBuilder = ['getViewMode', 'getCurrentIndex'];
                        ZnkExerciseUtilitySrv.bindFunctions(answerBuilderCtrl,questionBuilderCtrl,fnToBindFromQuestionBuilder);

                        answerBuilderCtrl.canUserAnswerBeChanged = function(){
                            var viewMode = questionBuilderCtrl.getViewMode();
                            var isntReviewMode = viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                            var notAnswered = angular.isDefined(ngModelCtrl.$viewValue);
                            var isAnswerWithResultViewMode = viewMode === ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum;
                            return isntReviewMode && isAnswerWithResultViewMode && notAnswered;
                        };

                        answerBuilderCtrl.question = questionBuilderCtrl.question;

                        var answerType = questionBuilderCtrl.question.answerTypeId;
                        var answerHtml = typeToViewMap[answerType];
                        element.html(answerHtml);
                        $compile(element.contents())(scope);
                    }
                }
            };
        }
    ]);
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswer', ['ZnkExerciseViewModeEnum', '$timeout',

        function (ZnkExerciseViewModeEnum, $timeout) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/freeTextAnswerDrv.html',
                require: ['^ngModel', '^answerBuilder'],
                scope:{},
                link: function (scope, element, attrs, ctrls) {
                    var ngModelCtrl = ctrls[0];
                    var answerBuilderCtrl = ctrls[1];
                    var userAnswerValidation = /^[0-9\/\.]{0,4}$/;

                    scope.d = {};

                    scope.d.userAnswer = '';  // stores the current userAnswer
                    scope.d.userAnswerGetterSetter = function(newUserAnswer){
                        if(arguments.length && _isAnswerValid(newUserAnswer)){
                            scope.d.userAnswer = newUserAnswer;
                            return scope.d.userAnswer;
                        }
                        return scope.d.userAnswer;
                    };

                    function _isAnswerValid(answerToCheck){
                        return userAnswerValidation.test(answerToCheck);
                    }

                    var MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;

                    scope.clickHandler = function(){
                        ngModelCtrl.$setViewValue(scope.d.userAnswer);
                        updateViewByCorrectAnswers(scope.d.userAnswer);
                    };

                    function updateViewByCorrectAnswers(userAnswer) {
                        var correctAnswers = answerBuilderCtrl.question.correctAnswerText;
                        var viewMode = answerBuilderCtrl.getViewMode();
                        scope.correctAnswer = correctAnswers[0].content;

                        if (viewMode === MODE_ANSWER_ONLY || viewMode === MODE_MUST_ANSWER) {
                            scope.d.userAnswer = angular.isDefined(userAnswer) ? userAnswer : '';
                            scope.showCorrectAnswer = false;
                        } else {

                            if (angular.isUndefined(userAnswer)) {
                                // unanswered question
                                    scope.userAnswerStatus = 'neutral';
                                    scope.showCorrectAnswer = viewMode === MODE_REVIEW;
                            } else {
                                if (_isAnsweredCorrectly(userAnswer, correctAnswers)) {
                                    scope.userAnswerStatus = 'correct';
                                } else {
                                    scope.userAnswerStatus = 'wrong';
                                }
                                scope.showCorrectAnswer = true;
                                scope.d.userAnswer = userAnswer;
                            }
                        }
                    }

                    function _isAnsweredCorrectly(userAnswer,correctAnswers) {
                        for (var i = 0; i < correctAnswers.length; i++) {
                            if (userAnswer === correctAnswers[i].content) {
                                return true;
                            }
                        }
                        return false;
                    }

                    ngModelCtrl.$render = function () {
                        //skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function(){
                            updateViewByCorrectAnswers(ngModelCtrl.$viewValue);
                        });
                    };

                    ngModelCtrl.$render();
                }
            };
        }
    ]);
})(angular);



/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('rateAnswer', ['ZnkExerciseViewModeEnum',
        function (ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/rateAnswerDrv.html',
                require: ['^answerBuilder', '^ngModel'],
                scope: {},
                link: function link(scope, element, attrs, ctrls) {
                    var domElement = element[0];

                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];

                    var viewMode = answerBuilder.getViewMode();
                    var ANSWER_WITH_RESULT_MODE = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        REVIEW_MODE = ZnkExerciseViewModeEnum.REVIEW.enum;
                    var INDEX_OFFSET = 2;

                    scope.d = {};
                    scope.d.itemsArray = new Array(11);
                    var answers = answerBuilder.question.correctAnswerText;

                    var domItemsArray;

                    var destroyWatcher = scope.$watch(
                        function () {
                            return element[0].querySelectorAll('.item-repeater');
                        },
                        function (val) {
                            if (val) {
                                destroyWatcher();
                                domItemsArray = val;

                                if (viewMode === REVIEW_MODE) {
                                    scope.clickHandler = angular.noop;
                                    updateItemsByCorrectAnswers(scope.d.answers);
                                } else {
                                    scope.clickHandler = clickHandler;
                                }

                                ngModelCtrl.$render = function(){
                                    updateItemsByCorrectAnswers();
                                };
                                ngModelCtrl.$render();
                            }
                        }
                    );

                    function clickHandler(index) {
                        if (answerBuilder.canUserAnswerBeChanged()) {
                            return;
                        }

                        ngModelCtrl.$setViewValue(index);
                        updateItemsByCorrectAnswers();
                    }

                    function updateItemsByCorrectAnswers() {
                        var oldSelectedElement = angular.element(domElement.querySelector('.selected'));
                        oldSelectedElement.removeClass('selected');

                        var selectedAnswerId = ngModelCtrl.$viewValue;

                        var newSelectedElement = angular.element(domItemsArray[selectedAnswerId]);
                        newSelectedElement.addClass('selected');

                        var lastElemIndex = answers.length - 1;

                        if((viewMode === ANSWER_WITH_RESULT_MODE && angular.isNumber(selectedAnswerId))|| viewMode === REVIEW_MODE){
                            for (var i = 0; i < lastElemIndex; i++) {
                                angular.element(domItemsArray[answers[i].id - INDEX_OFFSET]).addClass('correct');
                            }
                            angular.element(domItemsArray[answers[lastElemIndex].id - INDEX_OFFSET]).addClass('correct-edge');
                        }

                        if (angular.isNumber(selectedAnswerId) && (viewMode === REVIEW_MODE || viewMode === ANSWER_WITH_RESULT_MODE)) {
                            if (selectedAnswerId >= answers[0].id - INDEX_OFFSET && selectedAnswerId <= answers[lastElemIndex].id - INDEX_OFFSET) {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-correct');
                            } else {
                                angular.element(domItemsArray[selectedAnswerId]).addClass('selected-wrong');
                            }
                        }
                    }
                }
            };
        }
    ]);
})(angular);



/**
 * attrs:
 *
 */
(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('selectAnswer', [
        '$timeout', 'ZnkExerciseViewModeEnum', 'ZnkExerciseAnswersSrv', 'ZnkExerciseEvents',
        function ($timeout, ZnkExerciseViewModeEnum, ZnkExerciseAnswersSrv, ZnkExerciseEvents) {
            return {
                templateUrl: 'components/znkExercise/answerTypes/templates/selectAnswerDrv.html',
                require: ['^answerBuilder', '^ngModel'],
                restrict:'E',
                scope: {},
                link: function (scope, element, attrs, ctrls) {
                    var answerBuilder = ctrls[0];
                    var ngModelCtrl = ctrls[1];
                    var questionIndex = answerBuilder.question.__questionStatus.index;
                    var currentSlide = answerBuilder.getCurrentIndex();    // current question/slide in the viewport
                    var body = document.body;


                    var MODE_ANSWER_WITH_QUESTION = ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                        MODE_ANSWER_ONLY = ZnkExerciseViewModeEnum.ONLY_ANSWER.enum,
                        MODE_REVIEW = ZnkExerciseViewModeEnum.REVIEW.enum,
                        MODE_MUST_ANSWER = ZnkExerciseViewModeEnum.MUST_ANSWER.enum;
                    var keyMap = {};

                    scope.d = {};

                    scope.d.answers = answerBuilder.question.answers;

                    scope.d.click = function (answer) {
                        var viewMode = answerBuilder.getViewMode();

                        if ((!isNaN(parseInt(ngModelCtrl.$viewValue)) && viewMode === MODE_ANSWER_WITH_QUESTION) || viewMode === MODE_REVIEW) {
                            return;
                        }
                        ngModelCtrl.$setViewValue(answer.id);
                        updateAnswersFollowingSelection(viewMode);
                    };

                    function keyboardHandler(key){
                        key = String.fromCharCode(key.keyCode).toUpperCase();
                        if(angular.isDefined(keyMap[key])){
                            scope.d.click(scope.d.answers[keyMap[key]]);
                        }
                    }

                    if(questionIndex === currentSlide){
                        body.addEventListener('keydown',keyboardHandler);
                    }

                    scope.$on(ZnkExerciseEvents.QUESTION_CHANGED,function(event,value ,prevValue ,currQuestion){
                        var currentSlide = currQuestion.__questionStatus.index;
                        if(questionIndex !== currentSlide){
                            body.removeEventListener('keydown',keyboardHandler);
                        }else{
                            body.addEventListener('keydown',keyboardHandler);
                        }
                    });



                    scope.d.getIndexChar = function(answerIndex){
                        var key = ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex(answerIndex,answerBuilder.question);
                        keyMap[key] = answerIndex;
                        return key;
                    };

                    function updateAnswersFollowingSelection(viewMode) {
                        var selectedAnswerId = ngModelCtrl.$viewValue;
                        var correctAnswerId = answerBuilder.question.correctAnswerId;
                        var $answers = angular.element(element[0].querySelectorAll('.answer'));
                        for (var i = 0; i < $answers.length; i++) {

                            var $answerElem = angular.element($answers[i]);
                            if(!$answerElem || !$answerElem.scope || !$answerElem.scope()){
                                continue;
                            }

                            var answer = $answerElem.scope().answer;
                            var classToAdd,
                                classToRemove;

                            if (answerBuilder.getViewMode() === MODE_ANSWER_ONLY || answerBuilder.getViewMode() === MODE_MUST_ANSWER) {
                                // dont show correct / wrong indication
                                classToRemove = 'answered';
                                classToAdd = selectedAnswerId === answer.id ? 'answered' : 'neutral';
                            } else {
                                // the rest of the optional states involve correct / wrong indications
                                if (angular.isUndefined(selectedAnswerId)) {
                                    // unanswered question
                                    if (answerBuilder.getViewMode() === MODE_REVIEW) {
                                        classToAdd = correctAnswerId === answer.id ? 'answered-incorrect' : 'neutral';
                                    }
                                } else if (selectedAnswerId === answer.id) {
                                    // this is the selected answer
                                    classToAdd = correctAnswerId === answer.id ? 'correct' : 'wrong';
                                } else {
                                    // this is the correct answer but the user didn't select it
                                    classToAdd = answer.id === correctAnswerId ? 'answered-incorrect' : 'neutral';
                                }
                            }
                            $answerElem.removeClass(classToRemove);
                            $answerElem.addClass(classToAdd);
                            if (viewMode === MODE_ANSWER_WITH_QUESTION){
                                if (classToAdd === 'correct'){

                                }
                                if (classToAdd === 'wrong'){

                                }
                            }
                        }
                    }

                    ngModelCtrl.$render = function () {
                        //skip one digest cycle in order to let the answers time to be compiled
                        $timeout(function(){
                            updateAnswersFollowingSelection();
                        });
                    };
                    //ng model controller render function not triggered in case render function was set
                    // after the model value was changed
                    ngModelCtrl.$render();

                    scope.$on('exercise:viewModeChanged', function () {
                        ngModelCtrl.$render();
                    });

                    scope.$on('$destroy',function(){
                        body.removeEventListener('keydown',keyboardHandler);
                    });
                }
            };
        }
    ]);
})(angular);



(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').provider('ZnkExerciseAnswersSrv', function () {
        this.config = {
            selectAnswer:{}
        };

        var selectAnswer = {};

        this.config.selectAnswer.setAnswerIndexFormatter = function(fn){
            selectAnswer.answerIndexFormatter = fn;
        };

        this.$get = [
            function () {
                var ZnkExerciseAnswersSrv = {
                    selectAnswer: {}
                };

                ZnkExerciseAnswersSrv.selectAnswer.getAnswerIndex = function(answerIndex){
                    var formattedAnswerIndex;

                    if(selectAnswer.answerIndexFormatter){
                        formattedAnswerIndex = selectAnswer.answerIndexFormatter.apply(this,arguments);
                    }

                    if(angular.isUndefined(formattedAnswerIndex)){
                        var UPPER_A_ASCII_CODE = 65;
                        formattedAnswerIndex  = String.fromCharCode(UPPER_A_ASCII_CODE + answerIndex);
                    }

                    return formattedAnswerIndex;
                };

                return ZnkExerciseAnswersSrv;
            }
        ];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('freeTextAnswerGrid', [
        function () {
            return {
                templateUrl: 'scripts/exercise/templates/freeTextAnswerGridDrv.html',
                restrict: 'E',
                require: 'ngModel',
                scope: {
                    cellsNumGetter: '&cellsNum'
                },
                link: function (scope, element, attrs, ngModelCtrl) {

                    scope.buttonArray = [1, 2, 3, 4, 5, 6, 7, 8, 9];

                    var numberOfCells = scope.cellsNumGetter() || 3;

                    scope.d = {
                        viewCells: new Array(numberOfCells)
                    };

                    function updateNgModelViewValue() {
                        ngModelCtrl.$setViewValue(angular.copy(scope.d.cells));
                    }

                    scope.onClickNum = function (num) {
                        if (attrs.disabled || scope.d.cells.length >= numberOfCells) {
                            return;
                        }

                        scope.d.cells.push(num);
                        updateNgModelViewValue();
                    };

                    scope.onClickErase = function () {
                        if (attrs.disabled || !scope.d.cells.length) {
                            return;
                        }

                        scope.d.cells.pop();
                        updateNgModelViewValue();
                    };

                    ngModelCtrl.$render = function () {
                        scope.d.cells = angular.isDefined(ngModelCtrl.$viewValue) ? ngModelCtrl.$viewValue : [];
                    };
                }
            };
        }]);
}(angular));

'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('markup', [
        '$window',
        function ($window) {
            var _isMobile = false;//MobileSrv.isMobile();
            var MAX_IMAGE_WIDTH = 275;
            var dummyElem = angular.element('<P/>');
            return {
                replace: true,
                restrict: 'E',
                link: function (scope, element, attrs) {

                    var toDomElement = function domElement(markup) {
                        dummyElem.append(markup);
                        return dummyElem.contents();
                    };

                    var imageStyle = function imageStyle(image){
                        var _style = {
                            width: '',
                            height: ''
                        };

                        if(image.style.width){
                            var _height = image.style.height;
                            var _width = image.style.width;

                            _height = _height.replace('px','');
                            _width = _width.replace('px','');

                            if(!isNaN(_width)){
                                _width = parseInt(_width);

                                while(_width > MAX_IMAGE_WIDTH){
                                    _width = _width * 0.90;
                                    _height = _height * 0.90;
                                }
                                _style.width = _width + 'px';
                                _style.height = _height + 'px';
                            }
                        }
                        return _style;
                    };

                    var resizeImages = function resizeImages(domElement){
                        var style;

                        for(var i=0; i<domElement.length; i++ ){

                            if(domElement[i].tagName && domElement[i].tagName.toLowerCase() === 'img')
                            {
                                if(domElement[i].style.width){
                                    style = imageStyle(domElement[i]);
                                    domElement[i].style.width = style.width;
                                    domElement[i].style.height = style.height;
                                }
                            }
                            else{
                                var _images = angular.element(domElement[i]).find('img');
                                if(_images.length){
                                    for(var x=0; x<_images.length; x++){
                                        if(_images[x].style.width){
                                            style = imageStyle(_images[x]);
                                            _images[x].style.width = style.width;
                                            _images[x].style.height = style.height;
                                        }
                                    }
                                }
                            }
                        }

                        return domElement;
                    };

                    var removeLeftMargin = function removeLeftMargin(domElement){

                        for(var i=0; i<domElement.length; i++){

                            if(domElement[i].tagName && domElement[i].tagName.toLowerCase() === 'p')
                            {
                                if(!domElement[i].style) {
                                    break;
                                }

                                var marginLeft = domElement[i].style.marginLeft;
                                marginLeft = marginLeft ?  marginLeft.replace('px','') : marginLeft;

                                if(marginLeft && !isNaN(marginLeft))
                                {
                                    domElement[i].style.marginLeft = 0;
                                }
                            }
                        }

                        return domElement;
                    };

                    var watchDestroyer = scope.$watch(attrs.content,function(newVal){
                        if(!!newVal){

                            if(_isMobile){
                                MAX_IMAGE_WIDTH= ($window.innerWidth / 1.05);
                            }
                            else{
                                MAX_IMAGE_WIDTH= ($window.innerWidth / 1.25);
                            }

                            var _domElements = toDomElement(newVal);
                            if(_domElements) {
                                var _newDomElements = resizeImages(_domElements);

                                //remove left margin from <p> tag
                                _newDomElements = removeLeftMargin(_newDomElements);

                                element.append(_newDomElements);
                            }

                            watchDestroyer();
                        }
                    });
                }
            };
        }
    ]);
})(angular);


'use strict';

(function (angular) {
    angular.module('znk.infra.znkExercise').directive('arrayToStringFmtr', [
        function () {
            return {
                require: 'ngModel',
                link: function (scope, element, attrs, ngModelCtrl) {
                    function parser(val){
                        if(!val || !val.length){
                            return undefined;
                        }
                        return val.join('');
                    }
                    ngModelCtrl.$parsers.push(parser);

                    function formatter(val){
                        if (!val || !val.length) {
                            return [];
                        }
                        return val.match(/.{1}/g);
                    }
                    ngModelCtrl.$formatters.push(formatter);
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var ZnkExerciseEvents = {
        BOOKMARK: 'znk exercise:bookmark',
        QUESTION_ANSWERED: 'znk exercise:question answered',
        READY: 'znk exercise: exercise ready',
        QUESTION_CHANGED: 'znk exercise: question changed',
        QUESTIONS_NUM_CHANGED: 'znk exercise: questions num changed',
        SLIDE_DIRECTION_CHANGED: 'znk exercise: slide direction changed'
    };
    angular.module('znk.infra.znkExercise').constant('ZnkExerciseEvents', ZnkExerciseEvents);
})(angular);

/**
 * attrs:
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionBuilder', [
        '$compile', 'QuestionTypesSrv', '$timeout', 'ZnkExerciseUtilitySrv',
        function ($compile, QuestionTypesSrv, $timeout, ZnkExerciseUtilitySrv) {
            return {
                restrict: 'E',
                require: ['questionBuilder', '^znkExercise'],
                scope: {
                    questionGetter: '&question'
                },
                controller: [
                    '$scope',
                    function ($scope) {
                        var self = this;

                        self.question = $scope.questionGetter();
                    }
                ],
                link: {
                    pre: function pre(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var functionsToBind = ['getViewMode','addQuestionChangeResolver','removeQuestionChangeResolver', 'getCurrentIndex'];
                        ZnkExerciseUtilitySrv.bindFunctions(questionBuilderCtrl, znkExerciseCtrl,functionsToBind);
                    },
                    post: function post(scope, element, attrs, ctrls) {
                        var questionBuilderCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        QuestionTypesSrv.getQuestionHtmlTemplate(questionBuilderCtrl.question).then(function(result){
                            var questionHtmlTemplate = result;
                            element.append(questionHtmlTemplate);
                            var childScope = scope.$new(true);
                            $compile(element.contents())(childScope);
                        });

                        //after 2 digests at max the question should be rendered
                        var innerTimeout;
                        $timeout(function(){
                            innerTimeout = $timeout(function(){
                                znkExerciseCtrl.notifyQuestionBuilderReady(questionBuilderCtrl.question.__questionStatus.index);
                            });
                        },0,false);

                        scope.$on('$destroy', function(){
                            $timeout.cancel(innerTimeout);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *      disableSwipe
 *      questions
 *      onQuestionAnswered
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('questionsCarousel', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseSlideDirectionEnum',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseSlideDirectionEnum) {
            return {
                templateUrl: function(){
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'questionSwiperDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'questionSwiperMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                require: 'ngModel',
                scope:{
                    questionsGetter: '&questions',
                    onQuestionAnswered: '&'

                },
                link: function (scope, element, attrs, ngModelCtrl) {
                    scope.vm = {};

                    ngModelCtrl.$render = function(){
                        scope.vm.currSlideIndex = ngModelCtrl.$viewValue;
                    };

                    scope.vm.SlideChanged = function(){
                        ngModelCtrl.$setViewValue(scope.vm.currSlideIndex);
                    };


                    attrs.$observe('slideDirection',function(newSlideDirection){
                        var slideDirection = +newSlideDirection;
                        if(!scope.vm.swiperActions || isNaN(slideDirection)){
                            return;
                        }

                        switch (slideDirection){
                            case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                scope.vm.swiperActions.lockSwipes();
                                break;
                            case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                scope.vm.swiperActions.unlockSwipeToPrev();
                                scope.vm.swiperActions.lockSwipeToNext();
                                break;
                            case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                scope.vm.swiperActions.lockSwipeToPrev();
                                scope.vm.swiperActions.unlockSwipeToNext();
                                break;
                            default:
                                scope.vm.swiperActions.unlockSwipes();
                        }
                    });

                    scope.$watch('questionsGetter().length',function(newNum){
                        var notBindedQuestions = scope.questionsGetter();
                        if(newNum && !scope.vm.questions){
                            scope.vm.questions = notBindedQuestions;
                            return;
                        }
                        scope.vm.questions = notBindedQuestions;
                        scope.vm.swiperActions.updateFollowingSlideAddition();
                    });
                }
            };
        }
    ]);
})(angular);



(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('rateAnswerFormatterParser', ['AnswerTypeEnum',
        function (AnswerTypeEnum) {
            return {
                require: ['ngModel','questionBuilder'],
                link: function(scope, elem, attrs, ctrls){
                    var ngModelCtrl = ctrls[0];
                    var questionBuilderCtrl = ctrls[1];
                    var answerTypeId = questionBuilderCtrl.question.answerTypeId;

                    if(answerTypeId === AnswerTypeEnum.RATE_ANSWER.enum){
                        var INDEX_OFFSET = 2;
                        ngModelCtrl.$formatters.push(function(answer){
                            return angular.isDefined(answer) ? answer - INDEX_OFFSET : undefined;
                        });
                        ngModelCtrl.$parsers.push(function(index){
                            return angular.isDefined(index) ? index + INDEX_OFFSET : undefined;
                        });

                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *  prev-question
 *  next-question
 *  onDone
 *  questionsGetter
 *  actions:
 *      forceDoneBtnDisplay:
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExerciseBtnSection', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum', '$q', 'ZnkExerciseSlideDirectionEnum',
        function (ZnkExerciseSrv, PlatformEnum, $log, ZnkExerciseEvents, ZnkExerciseViewModeEnum, $q, ZnkExerciseSlideDirectionEnum) {
            return {
                restrict: 'E',
                scope: {
                    prevQuestion: '&?',
                    nextQuestion: '&?',
                    onDone: '&',
                    questionsGetter: '&questions',
                    actions: '='
                },
                require: '^znkExercise',
                templateUrl: function () {
                    var templateUrl = "components/znkExercise/core/template/";
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform) {
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl += 'btnSectionDesktopTemplate.html';
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl += 'btnSectionMobileTemplate.html';
                            break;
                    }
                    if (!templateUrl) {
                        $log.error('znkExerciseBtnSectionDrv directive: template was not defined for platform');
                    }
                    return templateUrl;
                },
                link: {
                    pre: function (scope, element, attrs, znkExerciseDrvCtrl) {
                        function _setCurrentQuestionIndex(index){
                            scope.vm.currentQuestionIndex = index || 0;
                        }

                        function _notReviewMode() {
                            return viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum;
                        }

                        function _isLastQuestion(index, questions) {
                            return index && index === (questions.length - 1);
                        }

                        function _determineDoneBtnDisplayStatus() {
                            var getQuestionsProm = znkExerciseDrvCtrl.getQuestions();
                            var areAllQuestionsAnsweredProm = znkExerciseDrvCtrl.areAllQuestionsAnswered();
                            $q.all([getQuestionsProm, areAllQuestionsAnsweredProm]).then(function (results) {
                                if(isDoneBtnDisplayForced){
                                    return;
                                }
                                var questions = results[0];
                                var areAllQuestionsAnswered = results[1];

                                var currIndex = znkExerciseDrvCtrl.getCurrentIndex();

                                if (_notReviewMode() && (_isLastQuestion(currIndex, questions) || areAllQuestionsAnswered)) {
                                    _setDoneBtnStatus(true);
                                } else {
                                    _setDoneBtnStatus(false);
                                }
                            });
                        }

                        function _setDoneBtnStatus(showDoneBtn){
                            scope.vm.showDoneButton = !!showDoneBtn;

                            var znkExerciseElement = znkExerciseDrvCtrl.getElement();
                            if(showDoneBtn){
                                znkExerciseElement.addClass('done-btn-show');
                            }else{
                                znkExerciseElement.removeClass('done-btn-show');
                            }
                        }

                        function init(){
                            znkExerciseDrvCtrl.getQuestions().then(function (questions) {
                                scope.vm.maxQuestionIndex = questions.length - 1;
                            });
                            _setCurrentQuestionIndex(znkExerciseDrvCtrl.getCurrentIndex());
                        }

                        var viewMode = znkExerciseDrvCtrl.getViewMode();

                        scope.vm = {};

                        if(!scope.actions){
                            scope.actions = {};
                        }

                        var isDoneBtnDisplayForced;
                        scope.actions.forceDoneBtnDisplay = function(display){
                            isDoneBtnDisplayForced = display === false || display === true;

                            if(isDoneBtnDisplayForced){
                                _setDoneBtnStatus(display);
                            }else{
                                _determineDoneBtnDisplayStatus();
                            }
                        };

                        init();

                        scope.vm.prevQuestion = function () {
                            scope.prevQuestion();
                        };

                        scope.vm.nextQuestion = function () {
                            scope.nextQuestion();
                        };

                        znkExerciseDrvCtrl.notifyBtnSectionReady();

                        scope.$on(ZnkExerciseEvents.QUESTION_CHANGED, function (evt, newIndex) {
                            _setCurrentQuestionIndex(newIndex);
                            _determineDoneBtnDisplayStatus(newIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED, function () {
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            _determineDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED, function(evt, newQuestionNum){
                            var currIndex = znkExerciseDrvCtrl.getCurrentIndex();
                            scope.vm.maxQuestionIndex = newQuestionNum - 1;
                            _determineDoneBtnDisplayStatus(currIndex);
                        });

                        scope.$on(ZnkExerciseEvents.SLIDE_DIRECTION_CHANGED, function(evt, newDirection){
                            var slideDirectionEnum = ZnkExerciseSlideDirectionEnum.getNameToEnumMap();
                            switch(newDirection){
                                case slideDirectionEnum.NONE:
                                    scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = false;
                                    break;
                                case slideDirectionEnum.LEFT:
                                    scope.vm.slideLeftAllowed = true;
                                    scope.vm.slideRightAllowed = false;
                                    break;
                                case slideDirectionEnum.RIGHT:
                                    scope.vm.slideLeftAllowed = false;
                                    scope.vm.slideRightAllowed = true;
                                    break;
                                default:
                                    scope.vm.slideLeftAllowed = scope.vm.slideRightAllowed = true;
                                    break;
                            }
                        });

                        function keyboardClickCB(e){
                            var LEFT_ARROW_KEY = 37;
                            var RIGHT_ARROW_KEY = 39;

                            switch(e.keyCode){
                                case LEFT_ARROW_KEY:
                                    scope.vm.prevQuestion();
                                    break;
                                case RIGHT_ARROW_KEY:
                                    scope.vm.nextQuestion();
                                    break;
                            }
                        }
                        var body = document.body;
                        body.addEventListener('keydown',keyboardClickCB);

                        var currentQuestionAnsweredWatchFn;
                        if(_notReviewMode()){
                            currentQuestionAnsweredWatchFn = function(){
                                return znkExerciseDrvCtrl.isCurrentQuestionAnswered();
                            };
                            scope.$watch(currentQuestionAnsweredWatchFn,function(isAnswered){
                                scope.vm.isCurrentQuestionAnswered = !!isAnswered;
                            });
                        }

                        scope.$on('$destroy',function(){
                            body.removeEventListener('keydown',keyboardClickCB);
                        });
                    }
                }
            };
        }
    ]);
})(angular);


/**
 * attrs:
 *
 *  actions:
 *      updateContainerSize
 *      lockSwipes
 *      lockSwipeToPrev
 *      lockSwipeToNext
 *      unlockSwipes
 *      unlockSwipeToPrev
 *      unlockSwipeToNext
 *      enableKeyboardControl
 *      disableKeyboardControl
 *      noSwiping
 *
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkSwiper', [
        '$timeout', '$q',
        function ($timeout, $q) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkSwiperTemplate.html',
                replace: true,
                restrict: 'E',
                require: 'ngModel',
                scope:{},
                transclude: true,
                compile:function(){
                    var defer = $q.defer();
                    var swiperInstanceProm = defer.promise;

                    function preLink(scope,element,attrs,ngModelCtrl){
                        if(attrs.actions){
                            if(!scope.$parent.$eval(attrs.actions)){
                                scope.$parent.$eval(attrs.actions + '={}');
                            }
                            var actions = scope.$parent.$eval(attrs.actions);

                            var fnToBindFromSwiper = [
                                'lockSwipes', 'lockSwipeToPrev', 'lockSwipeToNext', 'unlockSwipes',
                                'unlockSwipeToPrev', 'unlockSwipeToNext', 'noSwiping'
                            ];
                            fnToBindFromSwiper.forEach(function(fnName){
                                actions[fnName] = function(){
                                    var fnArgs = arguments;
                                    swiperInstanceProm.then(function(swiperInstance){
                                        swiperInstance[fnName].apply(swiperInstance,fnArgs);
                                    });
                                };
                            });

                            actions.updateFollowingSlideAddition = function(){
                                return swiperInstanceProm.then(function(swiperInstance){
                                    swiperInstance.updateContainerSize();
                                    swiperInstance.updateSlidesSize();
                                });
                            };
                        }

                        ngModelCtrl.$render = function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            if(angular.isNumber(currSlideIndex)){
                                swiperInstanceProm.then(function(swiperInstance){
                                    swiperInstance.slideTo(currSlideIndex);
                                });
                            }
                        };

                        swiperInstanceProm.then(function(swiperInstance){
                            swiperInstance.on('onSlideChangeEnd',function(_swipeInstance){
                                ngModelCtrl.$setViewValue(_swipeInstance.activeIndex);
                            });
                        });

                        scope.$on('$destroy',function(){
                            swiperInstanceProm.then(function(swiperInstance){
                                swiperInstance.destroy();
                            });
                        });
                    }

                    function postLink(scope,element,attrs,ngModelCtrl){
                        $timeout(function(){
                            var currSlideIndex = ngModelCtrl.$viewValue;
                            defer.resolve(new Swiper(element[0], {
                                initialSlide: currSlideIndex || 0,
                                onlyExternal: true
                            }));
                        },0,false);
                    }

                    return {
                        pre: preLink,
                        post: postLink
                    };
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';
    angular.module('znk.infra.znkExercise').provider('QuestionTypesSrv', function QuestionTypesProvider() {
        var questionTypeToHtmlTemplateMap = {};
        this.setQuestionTypesHtmlTemplate = function (_questionTypeToHtmlTemplateMap) {
            questionTypeToHtmlTemplateMap = _questionTypeToHtmlTemplateMap;
        };

        var questionTypeGetterFn = angular.noop;
        this.setQuestionTypeGetter = function(typeGetterFn){
            questionTypeGetterFn = typeGetterFn;
        };

        this.$get = [
            '$log','$q',
            function ($log, $q) {
                var QuestionTypesSrv = {};

                QuestionTypesSrv.getQuestionHtmlTemplate = function getQuestionHtmlTemplate(question) {
                    return $q.when(questionTypeGetterFn(question)).then(function(questionType){
                        var questionTypeId = questionType;
                        if(!questionTypeToHtmlTemplateMap[questionTypeId]){
                            $log.error('QuestionTypesSrv: Template was not registered for the following question type:',questionTypeId);
                        }
                        return questionTypeToHtmlTemplateMap[questionTypeId];
                    });
                };

                return QuestionTypesSrv;
            }
        ];
    });
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSrv', [
        /*'ZnkModalSrv',*/ 'EnumSrv', '$window', 'PlatformEnum',
        function (/*ZnkModalSrv, */EnumSrv, $window, PlatformEnum) {
            var ZnkExerciseSrv = {};

            var platform = !!$window.ionic ? PlatformEnum.MOBILE.enum : PlatformEnum.DESKTOP.enum;
            ZnkExerciseSrv.getPlatform = function(){
                return platform;
            };

            ZnkExerciseSrv.openExerciseToolBoxModal = function openExerciseToolBoxModal(/*toolBoxModalSettings*/) {
                //var modalOptions = {
                //    templateUrl: 'scripts/exercise/templates/znkExerciseToolBoxModal.html',
                //    hideBackdrop: true,
                //    ctrl: 'ZnkExerciseToolBoxModalCtrl',
                //    ctrlAs: 'toolBoxCtrl',
                //    dontCentralize: true,
                //    wrapperClass: 'znk-exercise-toolbox ' + toolBoxModalSettings.wrapperCls,
                //    resolve: {
                //        Settings: toolBoxModalSettings
                //    }
                //};
                //return ZnkModalSrv.modal(modalOptions);
            };

            ZnkExerciseSrv.toolBoxTools = {
                BLACKBOARD: 'blackboard',
                MARKER: 'mar',
                CALCULATOR: 'cal',
                BOOKMARK: 'bookmark',
                SHOW_PAGER: 'show pager'
            };

            return ZnkExerciseSrv;
        }
    ]);
})(angular);

/**
 * attrs:
 *  questions: questions array
 *
 *  ngModel: results array
 *
 *  settings:
 *      allowedTimeForExercise
 *      onDone
 *      onQuestionAnswered
 *      wrapperCls
 *      toolsToHide
 *      viewMode
 *      onExerciseReady
 *      onSlideChange
 *      initSlideIndex
 *      toolBoxWrapperClass
 *      initSlideDirection
 *      initForceDoneBtnDisplay: null-default behaviour(default value), false-done button will be hidden, true-done button will be dispalyed
 *      initPagerDisplay: true- displayed(default value), false- hidden
 *
 *  actions:
 *      setSlideIndex
 *      getCurrentIndex
 *      finishExercise
 *      setSlideDirection
 *      forceDoneBtnDisplay
 *      pagerDisplay: function, if true provided than pager will be displayed other it will be hidden.
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercise', [
        'ZnkExerciseSrv', '$location', /*'$analytics',*/ '$window', '$q', 'ZnkExerciseEvents', 'PlatformEnum', '$log', 'ZnkExerciseViewModeEnum', 'ZnkExerciseSlideDirectionEnum', '$timeout', 'ZnkExerciseUtilitySrv',
        function (ZnkExerciseSrv, $location, /*$analytics, */$window, $q, ZnkExerciseEvents, PlatformEnum, $log, ZnkExerciseViewModeEnum, ZnkExerciseSlideDirectionEnum, $timeout, ZnkExerciseUtilitySrv) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExerciseDrv.html',
                restrict: 'E',
                transclude: true,
                controllerAs: 'vm',
                require: ['znkExercise', 'ngModel'],
                scope: {
                    questionsGetter: '&questions',
                    settings: '=?',
                    actions: '=?'
                },
                controller: 'ZnkExerciseDrvCtrl',
                compile: function (element) {
                    var platform = ZnkExerciseSrv.getPlatform();
                    if (!platform) {
                        $log.$error('znkExercise directive: undefined platform received.');
                    }
                    var PlatformEnumMap = PlatformEnum.getEnumMap();
                    element.addClass(PlatformEnumMap[platform]);

                    return {
                        pre: function (scope, element, attrs, ctrls) {
                            var defaultSettings = {
                                onDone: angular.noop,
                                onQuestionAnswered: angular.noop,
                                viewMode: ZnkExerciseViewModeEnum.ANSWER_WITH_RESULT.enum,
                                onSlideChange: angular.noop,
                                initSlideDirection: ZnkExerciseSlideDirectionEnum.ALL.enum,
                                initForceDoneBtnDisplay: null,
                                initPagerDisplay: true,
                                allowedTimeForExercise: Infinity
                            };

                            scope.settings.allowedTimeForExercise = +scope.settings.allowedTimeForExercise;
                            if(isNaN(scope.settings.allowedTimeForExercise)){
                                $log.error('znkExerciseDrv: allowed time for exercise was not set!!!!');
                            }
                            scope.settings = angular.extend(defaultSettings, scope.settings);

                            var znkExerciseDrvCtrl = ctrls[0];
                            var ngModelCtrl = ctrls[1];

                            var questionAnswersToOneObjectfmtr = {},
                                allQuestionWithAnswersArr,
                                isMobile = $window.innerWidth <= 567;

                            function questionChangeResolverForSlideDirection(requiredIndex, currIndex){
                                var currSlideDirection = scope.vm.slideDirection;
                                switch (currSlideDirection){
                                    case ZnkExerciseSlideDirectionEnum.NONE.enum:
                                        return $q.reject();
                                    case ZnkExerciseSlideDirectionEnum.RIGHT.enum:
                                        return currIndex > requiredIndex ? true : $q.reject(false);
                                    case ZnkExerciseSlideDirectionEnum.LEFT.enum:
                                        return currIndex < requiredIndex ? true : $q.reject(false);
                                    default:
                                        return true;
                                }
                            }
                            znkExerciseDrvCtrl.addQuestionChangeResolver(questionChangeResolverForSlideDirection);

                            scope.vm.answeredCount = 0;

                            znkExerciseDrvCtrl.setCurrentIndex(scope.settings.initSlideIndex || 0);
                            /**
                             *  ACTIONS
                             * */
                            scope.actions = scope.actions || {};

                            scope.actions.setSlideIndex = function setSlideIndex(index) {
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    znkExerciseDrvCtrl.setCurrentIndex(index);
                                });
                            };

                            scope.actions.getCurrentIndex = function () {
                                return znkExerciseDrvCtrl.getCurrentIndex();
                            };

                            scope.actions.finishExercise = function () {
                                updateTimeSpentOnQuestion();
                            };

                            scope.actions.setSlideDirection = function(newSlideDirection){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    if(angular.isDefined(newSlideDirection)){
                                        //  do nothing incase the slide direction was not changed
                                        if(scope.vm.slideDirection === newSlideDirection){
                                            return;
                                        }

                                        var isRightDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.RIGHT.enum;
                                        var isLeftDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.LEFT.enum;
                                        var isAllDirection = newSlideDirection === ZnkExerciseSlideDirectionEnum.ALL.enum;
                                        var DIRECTION_CLASS_PREFIX = 'direction';

                                        var rightDirectionClass =DIRECTION_CLASS_PREFIX + '-' + ZnkExerciseSlideDirectionEnum.RIGHT.val;
                                        if(isRightDirection || isAllDirection){
                                            element.addClass(rightDirectionClass);
                                        }else{
                                            element.removeClass(rightDirectionClass);
                                        }

                                        var leftDirectionClass=DIRECTION_CLASS_PREFIX + '-' + ZnkExerciseSlideDirectionEnum.LEFT.val;
                                        if(isLeftDirection || isAllDirection){
                                            element.addClass(leftDirectionClass);
                                        }else{
                                            element.removeClass(leftDirectionClass);
                                        }

                                        scope.vm.slideDirection = newSlideDirection;

                                        scope.$broadcast(ZnkExerciseEvents.SLIDE_DIRECTION_CHANGED,newSlideDirection);
                                    }
                                });
                            };

                            scope.actions.forceDoneBtnDisplay = function(display){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    scope.vm.btnSectionActions.forceDoneBtnDisplay(display);
                                });
                            };

                            scope.actions.pagerDisplay = function(display){
                                znkExerciseDrvCtrl.isExerciseReady().then(function(){
                                    var showPager = !!display;
                                    if(showPager){
                                        element.addClass('pager-displayed');
                                    }else{
                                        element.removeClass('pager-displayed');
                                    }
                                    scope.vm.showPager = !!display;
                                });
                            };

                            /**
                             *  ACTIONS END
                             * */

                            /**
                             *  RENDER AND SET VIEW VALUE
                             * */
                            function render(viewValue) {
                                allQuestionWithAnswersArr = viewValue;
                                scope.vm.questionsWithAnswers = allQuestionWithAnswersArr;
                            }

                            ngModelCtrl.$render = function () {
                                render(ngModelCtrl.$viewValue);
                            };

                            function setViewValue() {
                                ngModelCtrl.$setViewValue(angular.copy(scope.vm.questionsWithAnswers));
                            }
                            /**
                             *  RENDER AND SET VIEW VALUE END
                             * */

                            function getCurrentQuestion() {
                                return allQuestionWithAnswersArr[scope.vm.currentSlide];
                            }

                            /**
                             *  TOOL BOX MODAL
                             * */
                            var toolboxModalSettings = {
                                toolsToHide: scope.settings.toolsToHide,
                                wrapperCls: scope.settings.toolBoxWrapperClass || ''
                            };
                            toolboxModalSettings.events = {
                                onToolOpened: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BLACKBOARD, currQuestion.__questionStatus.blackboardData || {});
                                            if (isMobile) {
                                                scope.vm.hidePager = true;
                                            }
                                            break;
                                    }
                                },
                                onToolClosed: function (evt) {
                                    var currQuestion = getCurrentQuestion();
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BLACKBOARD:
                                            currQuestion.__questionStatus.blackboardData = evt.value;
                                            if (isMobile) {
                                                scope.vm.hidePager = false;
                                            }
                                            break;
                                    }
                                    setViewValue();
                                },
                                onToolValueChanged: function (evt) {
                                    switch (evt.tool) {
                                        case ZnkExerciseSrv.toolBoxTools.BOOKMARK:
                                            scope.vm.bookmarkCurrentQuestion();
                                            break;
                                    }
                                    setViewValue();
                                }
                            };
                            var toolBoxModalInstance = ZnkExerciseSrv.openExerciseToolBoxModal(toolboxModalSettings);
                            /**
                             *  TOOL BOX MODAL END
                             * */

                            /**
                             *  FORMATTER & PARSER
                             * */
                            questionAnswersToOneObjectfmtr.formatter = function (answers) {
                                if (!answers) {
                                    answers = [];
                                }

                                var answersMap = {};
                                answers.forEach(function (answer) {
                                    if (answer && angular.isDefined(answer.questionId)) {
                                        answersMap[answer.questionId] = answer;
                                    }
                                });

                                var questions = scope.questionsGetter() || [];

                                var questionsWithAnswers = questions.map(function (question, index) {
                                    var questionCopy = angular.copy(question);
                                    var answer = answersMap[questionCopy.id] || {};

                                    questionCopy.__questionStatus= angular.copy(answer);
                                    questionCopy.__questionStatus.index = index;

                                    return questionCopy;
                                });
                                return questionsWithAnswers;
                            };
                            ngModelCtrl.$formatters.push(questionAnswersToOneObjectfmtr.formatter);

                            questionAnswersToOneObjectfmtr.parser = function (questionsWithAnswersArr) {
                                scope.vm.answeredCount  = 0;

                                var results = ngModelCtrl.$modelValue || [];

                                questionsWithAnswersArr.forEach(function (questionWithAnswer, index) {
                                    if (angular.isUndefined(questionWithAnswer.__questionStatus)) {
                                        return;
                                    }

                                    var answer = angular.copy(questionWithAnswer.__questionStatus);
                                    answer.questionId = questionWithAnswer.id;

                                    if (angular.isDefined(answer.userAnswer)) {
                                        scope.vm.answeredCount ++;
                                    }

                                    results[index] = answer;
                                });

                                return results;
                            };
                            ngModelCtrl.$parsers.push(questionAnswersToOneObjectfmtr.parser);
                            /**
                             *  FORMATTER & PARSER END
                             * */

                            scope.vm.questionAnswered = function () {
                                if (scope.settings.viewMode !== ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    var currQuestion = getCurrentQuestion();
                                    var userAnswer = currQuestion.__questionStatus.userAnswer;
                                    currQuestion.__questionStatus.isAnsweredCorrectly = ZnkExerciseUtilitySrv.isAnswerCorrect(currQuestion,userAnswer);

                                    updateTimeSpentOnQuestion(undefined,true);
                                    var afterAllowedTime = _isExceededAllowedTime();
                                    currQuestion.__questionStatus.afterAllowedTime = afterAllowedTime;
                                    setViewValue();
                                }
                                scope.$broadcast(ZnkExerciseEvents.QUESTION_ANSWERED, getCurrentQuestion());
                                //skip 1 digest cycle before triggering question answered
                                $timeout(function(){
                                    scope.settings.onQuestionAnswered(scope.vm.currentSlide);
                                });
                            };

                            scope.vm.bookmarkCurrentQuestion = function () {
                                var currQuestion = getCurrentQuestion();
                                currQuestion.__questionStatus.bookmark = !currQuestion.__questionStatus.bookmark;
                                scope.$broadcast(ZnkExerciseEvents.BOOKMARK, currQuestion);
                                setViewValue();
                            };

                            function updateTimeSpentOnQuestion(questionNum, dontSetViewValue) {
                                questionNum = angular.isDefined(questionNum) ? questionNum : scope.vm.currentSlide;
                                if (scope.settings.viewMode === ZnkExerciseViewModeEnum.REVIEW.enum) {
                                    return;
                                }

                                if (!updateTimeSpentOnQuestion.lastTimeStamp) {
                                    updateTimeSpentOnQuestion.lastTimeStamp = Date.now();
                                    return;
                                }
                                var currTime = Date.now();
                                var timePassed = currTime - updateTimeSpentOnQuestion.lastTimeStamp;
                                updateTimeSpentOnQuestion.lastTimeStamp = currTime;
                                var question = scope.vm.questionsWithAnswers[questionNum];
                                question.__questionStatus.timeSpent = (question.__questionStatus.timeSpent || 0) + timePassed;

                                if(!dontSetViewValue){
                                    setViewValue();
                                }
                            }

                            function _isExceededAllowedTime(){
                                var totalTimeSpent = 0;
                                scope.vm.questionsWithAnswers.forEach(function(questionWithAnswer){
                                    totalTimeSpent += questionWithAnswer.__questionStatus.timeSpent || 0;
                                });
                                var allowedTime = scope.settings.allowedTimeForExercise;
                                return totalTimeSpent > allowedTime;
                            }
                            /**
                             *  INIT
                             * */

                            scope.actions.setSlideDirection(scope.settings.initSlideDirection);

                            scope.actions.forceDoneBtnDisplay(scope.settings.initForceDoneBtnDisplay);

                            scope.actions.pagerDisplay(scope.settings.initPagerDisplay);

                            /**
                             *  INIT END
                             * */

                            scope.$watch('vm.currentSlide', function (value, prevValue) {
                                if(angular.isUndefined(value)){
                                    return;
                                }

                                var currQuestion = getCurrentQuestion();

                                updateTimeSpentOnQuestion(prevValue);
                                if (toolboxModalSettings.actions && toolboxModalSettings.actions.setToolValue) {
                                    toolboxModalSettings.actions.setToolValue(ZnkExerciseSrv.toolBoxTools.BOOKMARK, !!currQuestion.__questionStatus.bookmark);
                                }
                                //added since the sliders current was not changed yet
                                $timeout(function(){
                                    scope.settings.onSlideChange(currQuestion, value);
                                    scope.$broadcast(ZnkExerciseEvents.QUESTION_CHANGED,value ,prevValue ,currQuestion);
                                },0,false);
                                //var url = $location.url() + '/' + scope.vm.questionsWithAnswers[value].id;
                                //$analytics.pageTrack(url);
                            });

                            scope.$watch('vm.questionsWithAnswers.length',function(newNum,oldNum){
                                scope.$broadcast(ZnkExerciseEvents.QUESTIONS_NUM_CHANGED,newNum,oldNum);
                            });

                            scope.$on('$destroy', function () {
                                if (toolBoxModalInstance) {
                                    toolBoxModalInstance.close();
                                }
                            });
                        }
                    };
                }
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseDrvCtrl', [
        '$scope', '$q', 'ZnkExerciseEvents', '$log', '$element',
        function ($scope, $q, ZnkExerciseEvents, $log, $element) {
            var self = this;

            var questionReadyDefer = $q.defer();
            var btnSectionReadyDefer = $q.defer();

            var exerciseReadyProm = $q.all([
                questionReadyDefer.promise,
                btnSectionReadyDefer.promise
            ]);

            exerciseReadyProm.then(function(){
                $scope.$broadcast(ZnkExerciseEvents.READY);
                if ($scope.settings.onExerciseReady) {
                    $scope.settings.onExerciseReady();
                }
            });

            function isQuestionAnswered(index) {
                var questionWithAnswer = $scope.vm.questionsWithAnswers ? $scope.vm.questionsWithAnswers[index] : {};
                return questionWithAnswer && questionWithAnswer.__questionStatus && angular.isDefined(questionWithAnswer.__questionStatus.userAnswer);
            }

            function canChangeQuestion(requiredIndex, currIndex){
                var promArr = [];
                changeQuestionResolvers.forEach(function(resolver){
                    var getResolverResult = $q.when(angular.isFunction(resolver ) ? resolver(requiredIndex, currIndex) : resolver);
                    promArr.push(getResolverResult);
                });
                return $q.all(promArr);
            }

            self.isExerciseReady = function(){
                return exerciseReadyProm;
            };

            self.getViewMode = function () {
                return $scope.settings.viewMode;
            };

            self.getSlideDirection = function () {
                return $scope.settings.slideDirection;
            };

            var changeQuestionResolvers = [];
            self.addQuestionChangeResolver = function(resolver){
                changeQuestionResolvers.push(resolver);
            };

            self.removeQuestionChangeResolver = function(resolver){
                var newChangeQuestionResolvers = [];
                changeQuestionResolvers.forEach(function(resolverItem){
                    if(resolverItem !== resolver){
                        newChangeQuestionResolvers.push(resolverItem);
                    }
                });
                changeQuestionResolvers = newChangeQuestionResolvers;
            };

            self.getCurrentIndex = function () {
                return $scope.vm.currentSlide;
            };

            self.setCurrentIndex = function (newQuestionIndex) {
                if (angular.isDefined(newQuestionIndex)) {
                    var currIndex = self.getCurrentIndex();
                    return canChangeQuestion(newQuestionIndex, currIndex).then(function () {
                        //minimum index limit
                        newQuestionIndex = Math.max(0, newQuestionIndex);
                        //max index limit
                        var questions = $scope.questionsGetter() || [];
                        newQuestionIndex = Math.min(newQuestionIndex, questions.length - 1);

                        $scope.vm.currentSlide = newQuestionIndex;
                        return $scope.vm.currentSlide;
                    });
                }else{
                    $log.debug('ZnkExerciseDrv: setCurrentIndex was invoked with undefined newQuestionIndex parameter');
                }
                return $q.when($scope.vm.currentSlide);
            };

            self.setCurrentIndexByOffset = function (offset) {
                var currIndex = this.getCurrentIndex();
                var newCurrIndex = currIndex + offset;
                return this.setCurrentIndex(newCurrIndex);
            };

            self.notifyQuestionBuilderReady = function () {
                questionReadyDefer.resolve();
            };

            self.notifyBtnSectionReady = function(){
                btnSectionReadyDefer.resolve();
            };

            self.isCurrentQuestionAnswered = function () {
                return isQuestionAnswered($scope.vm.currentSlide);
            };

            self.isLastUnansweredQuestion = function(){
                var questionsNum = ($scope.vm.questionsWithAnswers || []).length;
                var unansweredNum = 0;
                for(var i=0; i<questionsNum; i++){
                    if(!isQuestionAnswered(i)){
                        unansweredNum++;
                        if(unansweredNum === 2){
                            return false;
                        }
                    }
                }
                return unansweredNum === 1;
            };

            self.getQuestions = function(){
                return questionReadyDefer.promise.then(function(){
                    return $scope.vm.questionsWithAnswers;
                });
            };

            self.areAllQuestionsAnswered = function() {
                var answeredCount = self.answeredCount;
                return self.getQuestions().then(function(questions) {
                    return answeredCount === questions.length;
                });
            };

            self.getElement = function(){
                return $element;
            };
        }]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise', [
            'znk.infra.enum',
            'znk.infra.svgIcon',
            'znk.infra.scroll',
            'znk.infra.autofocus',
            'ngAnimate'
        ])
        .config([
            'SvgIconSrvProvider',
            function (SvgIconSrvProvider) {
                var svgMap = {
                    chevron: 'components/znkExercise/svg/chevron-icon.svg',
                    correct: 'components/znkExercise/svg/correct-icon.svg',
                    wrong: 'components/znkExercise/svg/wrong-icon.svg',
                    info: 'components/znkExercise/svg/info-icon.svg',
                    arrow: 'components/znkExercise/svg/arrow-icon.svg'
                };
                SvgIconSrvProvider.registerSvgSources(svgMap);
            }]);
})(angular);

/**
 * attrs:
 *  questions
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('znkExercisePager', [
        '$timeout', 'ZnkExerciseEvents', 'ZnkExerciseViewModeEnum',
        function ($timeout, ZnkExerciseEvents, ZnkExerciseViewModeEnum) {
            return {
                templateUrl: 'components/znkExercise/core/template/znkExercisePagerDrv.html',
                restrict: 'E',
                require: ['ngModel', '^znkExercise'],
                scope: {},
                link: {
                    pre: function (scope, element, attrs, ctrls) {
                        var ngModelCtrl = ctrls[0];
                        var znkExerciseCtrl = ctrls[1];

                        var currViewMode = znkExerciseCtrl.getViewMode();

                        var domElement = element[0];

                        scope.d = {};

                        scope.d.tap = function (newIndex) {
                            znkExerciseCtrl.setCurrentIndex(newIndex);
                        };

                        function setPagerItemBookmarkStatus(index,status){
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);
                            if(status){
                                pagerItemElement.addClass('bookmark');
                            }else{
                                pagerItemElement.removeClass('bookmark');
                            }
                        }

                        function setPagerItemAnswerClass(index,question){
                            var pagerItemElement = angular.element(domElement.querySelectorAll('.pager-item')[index]);

                            if(angular.isUndefined(question.__questionStatus.userAnswer)){
                                pagerItemElement.removeClass('neutral correct wrong');
                                return;
                            }

                            if(currViewMode === ZnkExerciseViewModeEnum.ONLY_ANSWER.enum){
                                pagerItemElement.addClass('neutral');
                                return;
                            }

                            if(question.__questionStatus.isAnsweredCorrectly){
                                pagerItemElement.addClass('correct');
                            }else{
                                pagerItemElement.addClass('wrong');
                            }
                        }

                        scope.$on(ZnkExerciseEvents.BOOKMARK,function(evt,question){
                            setPagerItemBookmarkStatus(question.__questionStatus.index,question.__questionStatus.bookmark);
                        });

                        scope.$on(ZnkExerciseEvents.QUESTION_ANSWERED,function(evt,question){
                            setPagerItemAnswerClass(question.__questionStatus.index,question);
                        });

                        var isInitialized;
                        function init(){
                            isInitialized = true;
                            //wait for the pager items to be rendered
                            $timeout(function () {
                                ngModelCtrl.$render = function () {
                                    var currentSlide = +ngModelCtrl.$viewValue;
                                    if (isNaN(currentSlide)) {
                                        return;
                                    }
                                    //added in order to prevent the swipe lag
                                    $timeout(function () {
                                        var i;
                                        var $pagerItemWithCurrentClass = angular.element(domElement.querySelectorAll('.pager-item.current'));
                                        for (i in $pagerItemWithCurrentClass) {
                                            $pagerItemWithCurrentClass.eq(i).removeClass('current');
                                        }
                                        var pagerItemsDomElement = domElement.querySelectorAll('.pager-item');
                                        var currentSlideDom = angular.element(pagerItemsDomElement[currentSlide]);
                                        currentSlideDom.addClass('current');

                                        for(i in scope.questions){
                                            var question = scope.questions[i];
                                            setPagerItemBookmarkStatus(i,question .__questionStatus.bookmark);
                                            setPagerItemAnswerClass(i,question);
                                        }
                                    });
                                };
                                //render is not invoked for the first time
                                ngModelCtrl.$render();
                            },false);
                        }

                        scope.$parent.$watch(attrs.questions, function pagerQuestionsArrWatcher(questionsArr) {
                            if (questionsArr) {
                                scope.questions = questionsArr;

                                if(!isInitialized){
                                    init();
                                }
                            }
                        });
                    }
                }
            };
        }
    ]);
})(angular);


'use strict';

(function () {

    angular.module('znk.infra.znkExercise').directive('blackboardDrv', [
        'GoBackHardwareSrv',
        function (GoBackHardwareSrv) {

            return {
                restric: 'EA',
                scope: {
                    drawingData: '=',
                    actions: '&',
                    close: '&'
                },
                replace: true,
                templateUrl: 'scripts/exercise/templates/blackboardDrv.html',
                link: function (scope, elem) {
                    function goBackHardwareHandler(){
                        scope.close();
                    }
                    GoBackHardwareSrv.registerHandler(goBackHardwareHandler,undefined,true);

                    function activatePen() {
                        scope.d.activeDrawMode = drawModes.pen;
                    }

                    function activateEraser() {
                        scope.d.activeDrawMode = drawModes.eraser;
                    }

                    function clearCanvas() {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        scope.drawingData.dataUrl = null;
                    }

                    var actions = scope.actions() || {};
                    angular.extend(actions, {
                        activatePen: activatePen,
                        activateEraser: activateEraser,
                        clear: clearCanvas
                    });

                    var drawModes = {
                        pen: 1,
                        eraser: 2
                    };

                    scope.d = {
                        drawModes: drawModes,
                        activeDrawMode: drawModes.pen
                    };

                    var _lastX,
                        _lastY;

                    var canvas = elem.find('canvas')[0];
                    canvas.width = elem[0].offsetWidth;
                    canvas.height = elem[0].offsetHeight;

                    var ctx = canvas.getContext('2d');

                    function serialize(canvas) {
                        return canvas.toDataURL();
                    }
                    function deserialize(data, canvas) {
                        var img = new Image();
                        img.onload = function() {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            canvas.getContext('2d').drawImage(img, 0, 0);
                        };

                        img.src = data;
                    }

                    if (scope.drawingData.dataUrl) {
                        deserialize(scope.drawingData.dataUrl, canvas);
                    }

                    function onTouchStart(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        _lastX = e.targetTouches[0].pageX;
                        _lastY = e.targetTouches[0].pageY;

                        draw(_lastX + 1, _lastY + 1);
                    }

                    function onTouchMove(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        var curX = e.targetTouches[0].pageX;
                        var curY = e.targetTouches[0].pageY;

                        draw(curX, curY);

                        _lastX = curX;
                        _lastY = curY;
                    }

                    function onTouchEnd(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        scope.drawingData = scope.drawingData || {};
                        scope.drawingData.dataUrl = serialize(canvas);
                    }

                    function draw(x, y) {
                        ctx.beginPath();
                        if (scope.d.activeDrawMode === drawModes.pen) {
                            ctx.globalCompositeOperation = 'source-over';
                            ctx.strokeStyle = '#FFFFFF';
                            ctx.lineWidth = 4;
                            ctx.moveTo(_lastX, _lastY);
                            ctx.lineTo(x, y);
                            ctx.stroke();
                        } else if (scope.d.activeDrawMode === drawModes.eraser) {
                            ctx.globalCompositeOperation = 'destination-out';
                            ctx.arc(_lastX, _lastY, 16, 0, Math.PI * 2, false);
                            ctx.fill();
                        }
                    }

                    canvas.addEventListener('touchstart', onTouchStart);
                    canvas.addEventListener('touchmove', onTouchMove);
                    canvas.addEventListener('touchend', onTouchEnd);

                    scope.$on('$destroy', function () {
                        canvas.removeEventListener('touchstart', onTouchStart);
                        canvas.removeEventListener('touchmove', onTouchMove);
                        canvas.removeEventListener('touchend', onTouchEnd);
                    });
                }
            };
        }]);
})();

'use strict';

/*globals math */
(function(angular) {

    angular.module('znk.infra.znkExercise').directive('calculator', [
        'GoBackHardwareSrv',
        function(GoBackHardwareSrv) {
            var cos = math.cos;
            var sin = math.sin;
            var tan = math.tan;

            return {
                scope :{
                    calcTop: '=',
                    close: '&'
                },
                link: function (scope) {
                    function goBackHardwareHandler(){
                        scope.close();
                    }
                    GoBackHardwareSrv.registerHandler(goBackHardwareHandler,undefined,true);

                    math.cos = function (x) {
                        return cos(math.unit(x, scope.trigunits));
                    };

                    math.sin = function (x) {
                        return sin(math.unit(x, scope.trigunits));
                    };

                    math.tan = function (x) {
                        return tan(math.unit(x, scope.trigunits));
                    };
                    scope.onClickAns = function () {
                        if (scope.result !== 'ERR') {
                            scope.expression =  scope.result;
                        }
                    };
                    scope.onClickNum = function (n) {
                        scope.expression += String(n);
                    };

                    scope.onClickAdd = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }

                        scope.expression += ' + ';
                    };

                    scope.onClickSubtract = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' - ';
                    };

                    scope.onClickMultiply = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' * ';
                    };

                    scope.onClickDivide = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' / ';
                    };

                    scope.onClickClear = function () {
                        scope.expression = '';
                        scope.result = 0;
                    };

                    scope.onClickDot = function () {
                        scope.expression += '.';
                    };

                    scope.onClickPi = function () {
                        scope.expression += ' pi ';
                    };

                    scope.onClickE = function () {
                        scope.expression += ' e ';
                    };

                    scope.onClickRad = function () {
                        scope.trigunits = 'rad';
                    };

                    scope.onClickDeg = function () {
                        scope.trigunits = 'deg';
                    };

                    scope.onClickSin = function () {
                        scope.expression += ' sin(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickCos = function () {
                        scope.expression += ' cos(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickTan = function () {
                        scope.expression += ' tan(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickSqr = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^2 ';
                    };

                    scope.onClickPowThree = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^3 ';
                    };

                    scope.onClickPow = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += ' ^ ';
                    };

                    scope.onClickSqrt = function () {
                        scope.expression += ' sqrt(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickInv = function () {
                        scope.expression += ' inv(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickAbs = function () {
                        scope.expression += ' abs(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickFact = function () {
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                        scope.expression += '! ';
                    };

                    scope.onClickLog = function () {
                        scope.expression += ' log(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickLn = function () {
                        scope.expression += ' ln(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickOpenParen = function () {
                        scope.expression += '(';
                        if(scope.result && scope.result !== 'ERR'){
                            scope.expression += scope.result;
                        }
                    };

                    scope.onClickCloseParen = function () {
                        scope.expression += ')';
                    };

                    scope.onClickUndo = function () {
                       scope.expression = scope.expression.trimRight();
                       scope.expression = scope.expression.substring(0, scope.expression.length - 1);
                    };

                    scope.onClickEqual = function () {
                        var exp = scope.expression.
                            replace('log', 'log10').
                            replace('ln', 'log');
                        try {
                            scope.result = math.round(math.eval(exp), 5);
                        } catch (err) {
                            try {
                                // best effort in case of missing one paren
                                exp += ')';
                                scope.result = math.round ( math.eval ( exp ), 5 );
                            } catch (err) {
                                scope.result = 'ERR';
                            }
                        }
                        scope.expression = '';
                    };

                    scope.onClickMPlus = function () {
                        scope.mem += scope.result;
                    };

                    scope.onClickMc = function () {
                        scope.mem = 0;
                    };

                    scope.onClickMR = function () {
                        scope.expression += scope.mem;
                    };

                    scope.hasMemory = function () {
                        return scope.mem > 0;
                    };

                    var init = function init () {
                        scope.result = 0;
                        scope.expression = '';
                        scope.mem = 0;
                        scope.trigunits = 'rad';
                    };
                    init();
                },
                templateUrl: 'scripts/exercise/templates/calculator.html'
            };
    }]);

}(angular));


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').controller('ZnkExerciseToolBoxModalCtrl', [
        '$scope', 'ZnkExerciseDrvSrv', 'Settings',
        function ($scope, ZnkExerciseDrvSrv, Settings) {
            Settings.actions = Settings.actions || {};
            Settings.events = Settings.events || {};
            Settings.events.onToolOpened = Settings.events.onToolOpened || angular.noop;
            Settings.events.onToolOpened = Settings.events.onToolOpened || angular.noop;

            $scope.d = {
                blackboardTool: {
                    actions: {},
                    value: {}
                },
                bookmarkTool: {},
                showPagerTool: {},
                tools: ZnkExerciseDrvSrv.toolBoxTools,
                toolsStatus: {},
                toolsToHide: Settings.toolsToHide
            };

            Settings.actions.setToolValue = function (tool, value) {
                switch (tool) {
                    case $scope.d.tools.BOOKMARK:
                        $scope.d.bookmarkTool.value = value;
                        break;
                    case $scope.d.tools.BLACKBOARD:
                        $scope.d.blackboardTool.value = value;
                        break;
                }
            };

            $scope.d.openTool = function (tool) {
                var eventObj = {
                    tool: tool
                };
                Settings.events.onToolOpened(eventObj);
                $scope.d.toolsStatus[tool] = true;
            };

            $scope.d.closeTool = function (tool) {
                var eventObj = {
                    tool: tool
                };
                switch (tool) {
                    case $scope.d.tools.BLACKBOARD:
                        eventObj.value = $scope.d.blackboardTool.value;
                        break;
                    case $scope.d.tools.BOOKMARK:
                        eventObj.value = $scope.d.bookmarkTool.value;
                }
                Settings.events.onToolClosed(eventObj);
                $scope.d.toolsStatus[tool] = false;
            };

            function triggerToolValueChangedEvent(tool, newStatus) {
                var eventObj = {
                    tool: tool,
                    value: newStatus
                };
                if(Settings.events.onToolValueChanged){
                    Settings.events.onToolValueChanged(eventObj);
                }
            }

            $scope.d.reverseBookmarkValue = function () {
                $scope.d.bookmarkTool.value = !$scope.d.bookmarkTool.value;
                triggerToolValueChangedEvent($scope.d.tools.BOOKMARK, $scope.d.bookmarkTool.value);
            };

            $scope.d.activateBlackboardPencil = function(){
                if(!$scope.d[$scope.d.tools.BLACKBOARD]){
                    $scope.d.openTool($scope.d.tools.BLACKBOARD);
                }

                $scope.d.blackboardTool.pencilActivated = true;
                if ($scope.d.blackboardTool.actions.activatePen) {
                    $scope.d.blackboardTool.actions.activatePen();
                }
            };

            $scope.d.activateBlackboardEraser = function(){
                $scope.d.blackboardTool.pencilActivated = false;
                if ($scope.d.blackboardTool.actions.activateEraser) {
                    $scope.d.blackboardTool.actions.activateEraser();
                }
            };

            $scope.d.reverseShowPagerValue = function(){
                $scope.d.showPagerTool.value = !$scope.d.showPagerTool.value;
                triggerToolValueChangedEvent($scope.d.tools.SHOW_PAGER, $scope.d.showPagerTool.value);
            };

            $scope.d.onCalcClick = function(){
                if($scope.d.toolsStatus.hasOwnProperty($scope.d.tools.CALCULATOR)){
                    $scope.d.closeTool($scope.d.tools.CALCULATOR);
                }else{
                    $scope.d.openTool($scope.d.tools.CALCULATOR);
                }
            };
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    var exerciseEventsConst = {};

    exerciseEventsConst.tutorial = {
        FINISH: 'tutorial:finish'
    };

    exerciseEventsConst.drill = {
        FINISH: 'drill:finish'
    };

    exerciseEventsConst.practice = {
        FINISH: 'practice:finish'
    };

    exerciseEventsConst.game = {
        FINISH: 'game:finish'
    };

    exerciseEventsConst.section = {
        FINISH: 'section:finish'
    };

    exerciseEventsConst.daily = {
        STATUS_CHANGED: 'daily:status'
    };

    exerciseEventsConst.exam = {
        COMPLETE: 'exam:complete'
    };

    angular.module('znk.infra.znkExercise').constant('exerciseEventsConst', exerciseEventsConst);
})(angular);

/**
 * attrs:
 *  mobile-temp=
 *  desktop-temp=
 */

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').directive('templateByPlatform', [
        'ZnkExerciseSrv', 'PlatformEnum', '$log',
        function (ZnkExerciseSrv, PlatformEnum, $log) {
            return {
                templateUrl: function(element, attrs){
                    var templateUrl;
                    var prefix = attrs.prefix || '';
                    var platform = ZnkExerciseSrv.getPlatform();
                    switch (platform){
                        case PlatformEnum.DESKTOP.enum:
                            templateUrl = attrs.desktopTemp;
                            break;
                        case PlatformEnum.MOBILE.enum:
                            templateUrl = attrs.mobileTemp;
                            break;
                    }
                    if(!templateUrl){
                        $log.error('templateByPlatform directive: template was not defined for platform');
                    }
                    return prefix + '/' + templateUrl;
                },
                restrict: 'E'
            };
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    var exerciseAnswerStatusConst = {
        unanswered: 0,
        correct: 1,
        wrong: 2
    };
    angular.module('znk.infra.znkExercise').constant('exerciseAnswerStatusConst', exerciseAnswerStatusConst);

    angular.module('znk.infra.znkExercise').factory('ExerciseAnswerStatusEnum', [
        'EnumSrv',
        function (EnumSrv) {
            var ExerciseAnswerStatusEnum = new EnumSrv.BaseEnum([
                ['unanswered', exerciseAnswerStatusConst.unanswered, 'unanswered'],
                ['correct', exerciseAnswerStatusConst.correct, 'correct'],
                ['wrong', exerciseAnswerStatusConst.wrong, 'wrong']
            ]);

            ExerciseAnswerStatusEnum.convertSimpleAnswerToAnswerStatusEnum = function(answer) {
                switch (answer) {
                    case true:
                        return ExerciseAnswerStatusEnum.correct.enum;
                    case false:
                        return ExerciseAnswerStatusEnum.wrong.enum;
                    default :
                        return ExerciseAnswerStatusEnum.unanswered.enum;
                }
            };

            return ExerciseAnswerStatusEnum;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('PlatformEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['MOBILE', 1, 'mobile'],
                ['DESKTOP', 2, 'desktop']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseSlideDirectionEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['NONE', 1, 'none'],
                ['ALL', 2, 'all'],
                ['RIGHT', 3, 'right'],
                ['LEFT', 4, 'left']
            ])
            ;
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseViewModeEnum', [
        'EnumSrv',
        function (EnumSrv) {
            return new EnumSrv.BaseEnum([
                ['ANSWER_WITH_RESULT', 1, 'answer with result'],
                ['ONLY_ANSWER', 2, 'answer only'],
                ['REVIEW', 3, 'review'],
                ['MUST_ANSWER', 4, 'must answer']
            ]);
        }
    ]);
})(angular);


(function (angular) {
    'use strict';

    angular.module('znk.infra.znkExercise').factory('ZnkExerciseUtilitySrv', ['AnswerTypeEnum', '$log',
        function (AnswerTypeEnum, $log) {
            var ZnkExerciseUtilitySrv = {};
            //@todo(igor) move to utility service
            ZnkExerciseUtilitySrv.bindFunctions = function(dest,src,functionToCopy){
                functionToCopy.forEach(function(fnName){
                    dest[fnName] = src[fnName].bind(src);
                });
            };

            var answersIdsMap;
            ZnkExerciseUtilitySrv.isAnswerCorrect = function isAnswerCorrect(question, userAnswer) {
                var isCorrect, answer;
                switch (question.answerTypeId) {
                    case AnswerTypeEnum.SELECT_ANSWER.enum:
                        answer = '' + userAnswer;
                        isCorrect = ('' + question.correctAnswerId) === answer;
                        break;
                    case AnswerTypeEnum.FREE_TEXT_ANSWER.enum:
                         answer = '' + userAnswer;
                         answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                            return '' + answerMap.content;
                        });
                        isCorrect = answersIdsMap.indexOf(answer) !== -1;
                        break;
                    case AnswerTypeEnum.RATE_ANSWER.enum:
                        answer = '' + userAnswer;
                         answersIdsMap = question.correctAnswerText.map(function (answerMap) {
                            return '' + answerMap.id;
                        });
                        isCorrect = answersIdsMap.indexOf(answer) !== -1;
                        break;
                }

                return !!isCorrect;
            };

            ZnkExerciseUtilitySrv.setQuestionsGroupData = function (questions, groupData) {
                var groupDataMap = {};

                angular.forEach(groupData, function (group) {
                    groupDataMap[group.id] = group;
                });

                angular.forEach(questions, function (question) {
                    if (!groupDataMap[question.groupDataId]) {
                        $log.debug('Group data is missing for the following question id ' + question.id);
                    }

                    question.groupData = groupDataMap[question.groupDataId] || {};
                });
            };

            return ZnkExerciseUtilitySrv;
        }
    ]);
})(angular);

(function (angular) {
    'use strict';
    angular.module('znk.infra.znkTimeline', ['znk.infra.svgIcon', 'znk.infra.enum']);
})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').directive('znkTimeline', ['$window', '$templateCache', 'TimelineSrv',
        function ($window, $templateCache, TimelineSrv) {
            var directive = {
                restrict: 'A',
                scope: {
                    timelineData: '=',
                    timelineSettings: '='
                },
                link: function (scope, element) {

                    var settings = angular.extend({
                        width: $window.innerWidth,
                        height: $window.innerHeight,
                        images: TimelineSrv.getImages()
                    }, scope.timelineSettings || {});

                    var dataObj;

                    var canvasElem = element[0];

                    var ctx = canvasElem.getContext('2d');

                    var lastLine;

                    var nextFlag = false;

                    scope.$watch('timelineData', function (val, oldVal) {
                        if (angular.isDefined(val)) {
                            if (val !== oldVal) {
                                ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);
                                if (val.data.length) {
                                    start(val);
                                }
                            } else {
                                start(val);
                            }
                        }
                    });

                    function start(timelineData) {

                        var width = settings.width;

                        dataObj = {
                            lastLine: [],
                            biggestScore: {score: 0}
                        };

                        lastLine = void(0);

                        if (settings.type === 'multi') {
                            var distance = settings.distance * (timelineData.data.length + 2);
                            width = (distance < settings.width) ? settings.width : distance;
                        }

                        if (settings.isMax) {
                            settings.max = 0;
                            angular.forEach(timelineData.data, function (value) {
                                if (value.score > settings.max) {
                                    settings.max = value.score;
                                }
                            });
                        }

                        canvasElem.width = width * 2;
                        canvasElem.height = settings.height * 2;

                        canvasElem.style.width = width + 'px';
                        canvasElem.style.height = settings.height + 'px';

                        ctx.scale(2, 2);

                        if (settings.lineWidth) {
                            ctx.lineWidth = settings.lineWidth;
                        }

                        if (angular.isDefined(timelineData.id) && settings.colors && angular.isArray(settings.colors)) {
                            ctx.strokeStyle = settings.colors[timelineData.id];
                            ctx.fillStyle = settings.colors[timelineData.id];
                        }

                        ctx.beginPath();

                        createPath({
                            moveTo: {
                                x: 0,
                                y: settings.height - 2
                            },
                            lineTo: {
                                x: settings.distance,
                                y: settings.height - 2
                            }
                        }, true);

                        angular.forEach(timelineData.data, function (value, index) {

                            var height = Math.abs((settings.height - settings.subPoint) - ((value.score - settings.min) / (settings.max - settings.min) * (settings.height - (settings.subPoint * 2)) ));
                            var currentDistance = (index + 2) * settings.distance;
                            var isLast = index === (timelineData.data.length - 1);
                            value.moveTo = {
                                x: lastLine.lineTo.x,
                                y: lastLine.lineTo.y
                            };

                            value.lineTo = {
                                x: currentDistance,
                                y: height
                            };

                            createPath(value, false, isLast);

                            if (value.score > dataObj.biggestScore.score) {
                                dataObj.biggestScore = {score: value.score, lastLineTo: lastLine.lineTo};
                            }

                        });

                        if (settings.numbers && angular.isObject(settings.numbers)) {

                            setTimeout(function () {

                                ctx.font = settings.numbers.font;
                                ctx.fillStyle = settings.numbers.fillStyle;

                                ctx.fillText(settings.min, 15, settings.height - 10);
                                ctx.fillText(parseInt(dataObj.biggestScore.score), 15, dataObj.biggestScore.lastLineTo.y || settings.subPoint);

                            });

                        }

                        if (settings.onFinish && angular.isFunction(settings.onFinish)) {
                            settings.onFinish({data: dataObj, ctx: ctx, canvasElem: canvasElem});
                        }

                    }

                    function createPath(data, ignoreAfterPath, isLast) {

                        var arc = 10;
                        var img = 20;

                        if (angular.isDefined(settings.isMobile) && !settings.isMobile) {
                            arc = 15;
                            img = 25;
                        }

                        var subLocation = img / 2;

                        lastLine = data;
                        dataObj.lastLine.push(lastLine);

                        /* create line */
                        ctx.moveTo(data.moveTo.x, data.moveTo.y);
                        ctx.lineTo(data.lineTo.x, data.lineTo.y);
                        ctx.stroke();

                        if (dataObj.summeryScore && !nextFlag) {
                            dataObj.summeryScore.next = data.lineTo;
                            nextFlag = true;
                        }

                        if (settings.isSummery) {
                            if (settings.isSummery === data.exerciseId) {
                                dataObj.summeryScore = {
                                    score: data.score, lineTo: data.lineTo,
                                    prev: dataObj.lastLine[dataObj.lastLine.length - 2]
                                };
                                arc = arc * 1.5;
                                img = img + 5;
                                subLocation = img / 2;
                            }
                        } else if (isLast) {
                            arc = arc * 1.5;
                            img = img + 5;
                            subLocation = img / 2;
                        }


                        if (!ignoreAfterPath) {
                            /* create circle */
                            ctx.beginPath();
                            ctx.arc(data.lineTo.x, data.lineTo.y, arc, 0, 2 * Math.PI, false);
                            ctx.fill();

                            if ((isLast && !settings.isSummery) || (settings.isSummery === data.exerciseId)) {
                                ctx.beginPath();
                                ctx.arc(data.lineTo.x, data.lineTo.y, arc + 4, 0, 2 * Math.PI, false);
                                ctx.stroke();
                            }

                            /* create svg icons */
                            var imageObj = new Image();
                            var src;
                            var locationImgY = data.lineTo.y - subLocation;
                            var locationImgX = data.lineTo.x - subLocation;

                            if (data.iconKey) {
                                src = settings.images[data.iconKey];

                                var svg = $templateCache.get(src);
                                var mySrc = (svg) ? 'data:image/svg+xml;base64,' + $window.btoa(svg) : src;

                                imageObj.onload = function () {
                                    ctx.drawImage(imageObj, locationImgX, locationImgY, img, img);
                                };

                                imageObj.src = mySrc;
                            }
                        }

                    }

                }
            };

            return directive;
        }]);

})(angular);

(function (angular) {
    'use strict';

    angular.module('znk.infra.znkTimeline').provider('TimelineSrv', ['SvgIconSrvProvider', function () {

        var imgObj;

        this.setImages = function(obj) {
            imgObj = obj;
        };

        this.$get = ['$log', function($log) {
             return {
                 getImages: function() {
                     if (!angular.isObject(imgObj)) {
                         $log.error('TimelineSrv getImages: obj is not an object! imgObj:', imgObj);
                     }
                     return imgObj;
                 }
             };
        }];
    }]);
})(angular);

