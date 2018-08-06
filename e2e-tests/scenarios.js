'use strict';

// Angular E2E Testing Guide:
// https://docs.angularjs.org/guide/e2e-testing

describe('Kind Application', function () {

    it('should redirect "" to #/editor', function () {
        browser.get("");
        expect(browser.getCurrentUrl()).toBe('http://localhost:8000/#!/editor');
    });

    describe('View: editor', function () {

        var editor = element(by.id('editor'));
        var code = 'node True (i: bool) returns (T: bool); let T = true; --%PROPERTY T; tel';

        beforeEach(function () {
            browser.get("");
            browser.actions().doubleClick(editor).perform();
            browser.actions().keyDown(protractor.Key.CONTROL).sendKeys('a').perform();
            browser.actions().keyUp(protractor.Key.CONTROL).perform();
            browser.actions().sendKeys(protractor.Key.DELETE).perform();
            browser.actions().sendKeys(code).perform();
        });


        it('should load a Lustre file when load button is clicked', function() {
            var file = 'C:/Users/mudat/Downloads/load.lus';
            var inputElement = element(by.css('input[type="file"]'));

            inputElement.sendKeys(file);
            var editorElement = element(by.id('editor'));

            //ToDo: complete the scenario
            editorElement.getText().then(function (text){
                console.log(text);
            });
        });

        it('should download the file when download is clicked', function () {

            var downloadButton = element(by.css('[ng-click="save()"]'));
            downloadButton.click();

            var filename = 'C:/Users/mudat/Downloads/file.lus';
            var fs = require('fs');

            if (fs.existsSync(filename)) {
                // Make sure the browser doesn't have to rename the download.
                fs.unlinkSync(filename);
            }

            browser.driver.wait(function() {
                return fs.existsSync(filename);

            }, 1000).then(function() {
                expect(fs.readFileSync(filename, { encoding: 'utf8' })).toEqual(
                    code);
                // remove the file
                fs.unlinkSync(filename);
            });
        });

        it('should check the code with the kind server and return the result', function () {

            var checkButton = element(by.css('[ng-click="check()"]'));
            checkButton.click();

            var properties = element(by.css('[ng-show="root.Results.Property"]'));


            var EC = protractor.ExpectedConditions;
            browser.wait(EC.presenceOf(properties), 2000).then(function(){
                var answer = $('.answer');
                browser.sleep(1000);
                expect(answer.getText()).toEqual('valid');
            });
        });

    });


});
