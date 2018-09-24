'use strict';

angular.module('cvc').component('modal', {
    templateUrl: 'modal-component/modal.component.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
    controller: function () {
        var $ctrl = this;

        $ctrl.$onInit = function () {
            $ctrl.examples = $ctrl.resolve.examples;
        };

        $ctrl.getExampleModal = function(example) {
            $ctrl.resolve.getExample(example);
            $ctrl.close({$value: ""});
        }

        $ctrl.ok = function () {
            $ctrl.close({$value: ""});
        };
    }
});