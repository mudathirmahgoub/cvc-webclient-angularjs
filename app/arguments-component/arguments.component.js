'use strict';

angular.module('cvc').component('editor', {
    templateUrl: 'editor-component/editor.template.html',
    controller: ['$scope', '$http', 'cvcService', 'sharedService',
        '$interval', '$routeParams', '$location', '$uibModal', '$rootScope', 'cvcEnvironment',
        function ($scope, $http, cvcService, sharedService,
                  $interval, $routeParams, $location, $uibModal, $rootScope, cvcEnvironment) {

            // initializations
            $scope.cvcEnvironment = cvcEnvironment;
            // for examples links
            $scope.path = $location.absUrl();
            if ($scope.path.indexOf("/#") != -1) {
                $scope.path = $scope.path.substring(0, $scope.path.indexOf("/#"));
            }

            // for downloading
            $scope.savedFile = null;

            // waiting for check results
            $scope.waitingCheck = false;

            // waiting for simulate results
            $scope.waitingSimulate = false;

            // waiting for save
            $scope.waitingSave = false;

            // waiting for run
            $scope.waitingRun = false;

            // interpreter columns count
            $scope.columnsCount = cvcEnvironment.interpreterNumberOfColumns;

            // ace editor initialization
            var editor = ace.edit('editor');
            $scope.isDarkTheme = true;
            editor.setTheme("ace/theme/idle_fingers");
            editor.getSession().setMode("ace/mode/smt_lib");
            $scope.code = editor.getValue();

            // tabs
            $scope.activeTab = 0; // Logs tab

            // register an event for opening counter examples when the gutter is clicked
            editor.on('gutterclick', function (e) {

                var target = e.domEvent.target;

                if (target.className.includes('ace_error')) {

                    // get the selected property
                    var row = e.getDocumentPosition().row;
                    var selectedProperty;
                    
                    angular.forEach($scope.results.NodeAnalysis, function (nodeAnalysis) {
                    angular.forEach(nodeAnalysis.Analysis[nodeAnalysis.selectedAnalysis].Property, function (property) {
                        if (property.line == (row + 1)) {
                            if (sharedService.checkNested(property, 'Answer', 'value')
                                && property.Answer.value == 'falsifiable'
                            ) {
                                selectedProperty = property;
                            }
                        }
                    });
                    });

                    // open the modal interpreter
                    $uibModal.open({
                        component: 'modalInterpreter',
                        resolve: {
                            property: function () {

                                var property = angular.copy(selectedProperty);
                                return property;
                            }
                        }
                    });
                }
                // stop the event
                e.stop();
            });

            // get the list of examples
            cvcService.getExamples().then(function (response) {
                $scope.examples = response.names;
            });

            $scope.getExample = function (example) {

                // clear the view
                //ToDo: refactor clearing the view
                $scope.interpreterVisible = false;
                $scope.waitingCheck = false;
                $scope.waitingSave = false;
                $scope.waitingSimulate = false;
                $scope.waitingRun = false;
                $interval.cancel($scope.getResultInterval);
                updateView(null, true);

                // load the example code
                cvcService.getExample(example).then(function (response) {
                    $scope.code = response.code;
                    editor.setValue(response.code);
                    editor.selection.clearSelection();
                });
            }

            // /#
            if ($location.hash()) {
                var hash = $location.hash();

                // /#examples/:example
                if (hash.includes('examples/')) {
                    var example = hash.replace('examples/', '');
                    $scope.getExample(example);
                }
                // /#temp_id
                else {
                    $scope.jobId = hash;
                    cvcService.getJob($scope.jobId).then(function (response) {
                        editor.setValue(response.code);
                        editor.selection.clearSelection();
                    });
                }
            }

            $scope.download = function () {

                //ToDo: remove this line
                $scope.code = editor.getValue();
                var data = new Blob([$scope.code], {type: 'text/plain'});

                // to save memory
                if ($scope.savedFile !== null) {
                    window.URL.revokeObjectURL($scope.savedFile);
                }

                $scope.savedFile = window.URL.createObjectURL(data);
            };

            function updateView(response, reset) {

                $scope.results = response;
                $scope.activeTab = 0;

                // set annotations
                setAnnotations(reset);
            }

            $rootScope.codeEmpty = function () {
                $scope.code = editor.getValue();
                if (!$scope.code || !$scope.code.trim()) {

                    $scope.results = {};
                    $scope.results.Log = [
                        {
                            class: 'fatal',
                            line: 1,
                            column: 0,
                            value: 'Empty code!'
                        }
                    ];

                    $scope.activeTab = 0; // logs tab
                    return true;
                }
                return false;
            }

            $scope.run = function () {

                if (!$scope.waitingCheck) {
                    // initialize the results
                    $scope.results = {};
                    // initialize annotations
                    setAnnotations(true);

                    if ($rootScope.codeEmpty()) {
                        return;
                    }

                    // post the code
                    cvcService.verify($scope.jobId, $scope.code, $scope.parameters)
                        .then(function (jobInformation) {
                            $scope.jobId = jobInformation.jobId;
                            $location.hash(jobInformation.jobId);
                            var reset = true;
                            $scope.waitingCheck = true;
                            // send a request after each delay
                            $scope.getResultInterval = $interval(function () {
                                    cvcService.getResults($scope.jobId)
                                        .then(function (response) {
                                            updateView(response, reset);
                                            if (reset) {
                                                reset = false;
                                            }
                                            if (response.jobFinished) {
                                                $interval.cancel($scope.getResultInterval);
                                                $scope.waitingCheck = false;
                                            }
                                        });
                                },
                                1000, // one second delay
                                $scope.parameters['timeout'] + 1, // number of attempts
                                true); // model dirty checking

                            $scope.getResultInterval.then(function () {
                                $scope.waitingCheck = false;
                            });

                        }, function onError(response) {
                            throw response;
                        });
                }
                else {
                    $scope.waitingCheck = false;
                    $interval.cancel($scope.getResultInterval);
                    cvcService.cancelJob($scope.jobId);
                }
            }

            $scope.saveJob = function (jobId) {


                if(!jobId && $scope.getResultInterval) {
                    // cancel getResults related to old jobId
                    $interval.cancel($scope.getResultInterval);
                    $scope.waitingCheck = false;
                }

                if ($rootScope.codeEmpty()) {
                    return;
                }

                $scope.waitingSave = true;
                // save the code
                cvcService.saveJob(jobId, $scope.code)
                    .then(function (jobInformation) {
                        $scope.waitingSave = false;
                        $scope.jobId = jobInformation.jobId;
                        $location.hash(jobInformation.jobId);
                    }, function onError(response) {
                        throw response;
                    });
            }

            $scope.selectProperty = function (property) {
                $scope.property = property;
                var lineNumber = parseInt(property.line);
                editor.gotoLine(lineNumber);

                if (property.counterExampleVisible != undefined) {
                    property.counterExampleVisible = !property.counterExampleVisible;
                }
            }

            $scope.selectLog = function (log) {
                $scope.log = log;
                editor.gotoLine(log.line);
            }

            function setAnnotations(reset) {
                var annotations;
                if (reset) {
                    annotations = [];
                }
                else {
                    annotations = editor.getSession().getAnnotations();
                }

                setLogAnnotations();

                // sort annotations so that error annotations get displayed after other annotations
                // i.e. the order would be: warning, info, error

                annotations.sort(function (a, b) {

                    var typeA = a.type.toUpperCase();
                    var typeB = b.type.toUpperCase();
                    if (typeA > typeB) {
                        return -1;
                    }
                    if (typeA < typeB) {
                        return 1;
                    }
                    return 0;
                });

                editor.getSession().setAnnotations(annotations);


                function setLogAnnotations() {
                    if (sharedService.checkNested($scope, 'results', 'Log')) {
                        angular.forEach($scope.results.Log, function (log) {

                            var lineNumber = log.line;

                            var annotationType = 'warning';
                            if (log.class === 'info') {
                                annotationType = 'info';
                            }
                            if (log.class === 'fatal') {
                                annotationType = 'error';
                            }

                            annotations.push({
                                row: lineNumber - 1,
                                column: 0,
                                html: log.value.trim(),
                                type: annotationType
                            });
                        });
                    }
                }
            }

            $scope.upload = function (code) {
                editor.setValue(code);
                editor.selection.clearSelection();
            }


            $rootScope.getCode = function () {
                $scope.code = editor.getValue();
                return $scope.code;
            }

            $scope.closeAlert = function (index) {
                $scope.alerts.splice(index, 1);
            };

            $rootScope.getAlerts = function () {
                return $scope.alerts;
            }

            $scope.toggleTheme = function () {
                $scope.isDarkTheme = !$scope.isDarkTheme;
                if ($scope.isDarkTheme) {
                    editor.setTheme("ace/theme/idle_fingers");
                }
                else {
                    editor.setTheme("ace/theme/xcode");
                }
            }

            $rootScope.setWaitingRun = function (value) {
                $scope.waitingRun = value;
            }

            $rootScope.setErrorLog = function (log) {
                $scope.results = {};
                $scope.results.Log = [
                    log
                ];
                $scope.activeTab = 0; // logs tab
            }

            $rootScope.updateView = updateView;

            $scope.updateSelectedAnalysis = function (nodeAnalysisIndex, analysisIndex){
                if (sharedService.checkNested($scope.results, 'NodeAnalysis', 'length')){
                    $scope.results.NodeAnalysis[nodeAnalysisIndex].selectedAnalysis = analysisIndex;
                    //ToDo: refine this call to a more granular level
                    updateView($scope.results, true);
                }
            }
        }
    ]
});