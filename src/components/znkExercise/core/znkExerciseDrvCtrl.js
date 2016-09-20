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
                        //max index limit
                        var questions = $scope.questionsGetter() || [];
                        newQuestionIndex = Math.min(newQuestionIndex, questions.length - 1);

                        //minimum index limit
                        newQuestionIndex = Math.max(0, newQuestionIndex);

                        $scope.vm.currentSlide = newQuestionIndex;

                        if(self.__exerciseViewBinding){
                            self.__exerciseViewBinding.currSlideIndex = newQuestionIndex;
                        }

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

            self.getCurrentQuestion = function(){
                return self.getQuestions().then(function(questions){
                    var currIndex = self.getCurrentIndex();
                    return questions[currIndex];
                });
            };
            /**
             *  bind exercise
             */
            (function(self) {

                function BindExerciseEventManager() {
                    this.cbObj = {};
                }

                BindExerciseEventManager.prototype.trigger = function(key, value) {
                    this.cbObj[key].forEach(function (cb) {
                        cb(value);
                    }, this);
                };

                BindExerciseEventManager.prototype.update = function(key, value) {
                    self.__exerciseViewBinding[key] = value;
                };

                BindExerciseEventManager.prototype.registerCb = function(key, cb) {
                     if (!angular.isArray(this.cbObj[key])) {
                         this.cbObj[key] = [];
                     }
                     this.cbObj[key].push(cb);
                };

                self.bindExerciseEventManager = new BindExerciseEventManager();

                var keys = [
                    {
                        getterName: 'currSlideIndex',
                        setterName: 'setCurrentIndex'
                    },
                    {
                        getterName: 'answerExplanation'
                    }
                ];

                var exerciseViewListenersObj =  {};

                self.bindExerciseViewTo = function (exerciseView) {
                    if(!angular.isObject(exerciseView)) {
                        $log.error('ZnkExerciseDrvCtrl bindExerciseViewTo: exercise view should be an object');
                        return;
                    }

                    self.__exerciseViewBinding = exerciseView;

                    angular.forEach(keys, function (keyObj) {
                        exerciseViewListenersObj[keyObj.getterName] = $scope.$watchCollection(function () {
                            return exerciseView[keyObj.getterName];
                        },function (newVal) {
                            if(angular.isDefined(newVal)) {
                                if (keyObj.setterName) {
                                    self[keyObj.setterName](newVal);
                                } else {
                                    self.bindExerciseEventManager.trigger(keyObj.getterName, newVal);
                                }
                            }
                        });
                    });
                };

                self.unbindExerciseView = function (keyNameObj) {
                    angular.forEach(exerciseViewListenersObj, function(fn, key) {
                        if (!keyNameObj || keyNameObj[key]) {
                            exerciseViewListenersObj[key]();
                            exerciseViewListenersObj[key] = null;
                        }
                    });

                    var cleanExerciseViewBinding = true;

                    for (var i in exerciseViewListenersObj) {
                        if (exerciseViewListenersObj.hasOwnProperty(i) && exerciseViewListenersObj[i] !== null) {
                            cleanExerciseViewBinding = false;
                            break;
                        }
                    }

                    if (self.__exerciseViewBinding && cleanExerciseViewBinding){
                        self.__exerciseViewBinding = null;
                    }
                };

            })(self);
        }]);
})(angular);
