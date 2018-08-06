//jshint strict: false
module.exports = function(config) {
    config.set({

        basePath: './app',

        files: [
            'lib/angular/angular.js',
            'lib/angular/angular-route.js',
            'lib/angular/angular-mocks.js',
            'configurations.js',
            'lib/ui-bootstrap/ui-bootstrap-tpls-2.5.0.min.js',
            'lib/angular/angular-spinner/angular-spinner.min.js',
            '**/*.module.js',
            '*!(.module|.spec).js',
            '!(lib)/**/*!(.module|.spec|.service).js',
            '**/*.spec.js'
        ],

        autoWatch: false,

        frameworks: ['jasmine'],

        browsers: ['Chrome'],

        plugins: [
            'karma-chrome-launcher',
            'karma-jasmine'
        ]
    });
};
