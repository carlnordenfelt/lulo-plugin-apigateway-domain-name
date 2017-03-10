'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('Index unit tests', function () {
    var subject;
    var createDomainNameStub = sinon.stub();
    var updateDomainNameStub = sinon.stub();
    var deleteDomainNameStub = sinon.stub();
    var getDomainNameStub = sinon.stub();
    var event;

    before(function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        var awsSdkStub = {
            APIGateway: function () {
                this.createDomainName = createDomainNameStub;
                this.updateDomainName = updateDomainNameStub;
                this.deleteDomainName = deleteDomainNameStub;
                this.getDomainName = getDomainNameStub;
            }
        };

        mockery.registerMock('aws-sdk', awsSdkStub);
        subject = require('../../src/index');
    });
    beforeEach(function () {
        createDomainNameStub.reset().resetBehavior();
        createDomainNameStub.yields(undefined, { distributionDomainName: 'distributionDomainName' });
        updateDomainNameStub.reset().resetBehavior();
        updateDomainNameStub.yields(undefined, { distributionDomainName: 'distributionDomainName' });
        getDomainNameStub.reset().resetBehavior();
        getDomainNameStub.yields(undefined, { distributionDomainName: 'distributionDomainName' });
        deleteDomainNameStub.reset().resetBehavior();
        deleteDomainNameStub.yields();
        event = {
            ResourceProperties: {
                domainName: 'domainName',
                certificateArn: 'certificateArn',
                certificateChain: 'certificateChain',
                certificateBody: 'certificateBody',
                certificatePrivateKey: 'certificatePrivateKey',
                certificateName: 'certificateName'
            },
            OldResourceProperties: {
                domainName: 'domainName',
                certificateArn: 'certificateArn',
                certificateChain: 'certificateChain',
                certificateBody: 'certificateBody',
                certificatePrivateKey: 'certificatePrivateKey',
                certificateName: 'certificateName'
            }
        };
    });
    after(function () {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('validate', function () {
        it('should succeed', function (done) {
            subject.validate(event);
            expect(event.ResourceProperties.certificateBody).to.equal(undefined);
            expect(event.ResourceProperties.certificateChain).to.equal(undefined);
            expect(event.ResourceProperties.certificatePrivateKey).to.equal(undefined);
            done();
        });
        it('should use legacy parameters if certificateArn is not set', function (done) {
            delete event.ResourceProperties.certificateArn;
            subject.validate(event);
            expect(event.ResourceProperties.certificateBody).to.be.a('string');
            expect(event.ResourceProperties.certificateChain).to.be.a('string');
            expect(event.ResourceProperties.certificatePrivateKey).to.be.a('string');
            done();
        });
        it('should fail if certificateName is not set', function (done) {
            delete event.ResourceProperties.certificateName;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property certificateName/);
            done();
        });
        it('should fail if domainName is not set', function (done) {
            delete event.ResourceProperties.domainName;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property domainName/);
            done();
        });
        it('should fail if certificateChain is not set', function (done) {
            delete event.ResourceProperties.certificateChain;
            delete event.ResourceProperties.certificateArn;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property certificateChain/);
            done();
        });
        it('should fail if certificateBody is not set', function (done) {
            delete event.ResourceProperties.certificateBody;
            delete event.ResourceProperties.certificateArn;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property certificateBody/);
            done();
        });
        it('should fail if certificatePrivateKey is not set', function (done) {
            delete event.ResourceProperties.certificatePrivateKey;
            delete event.ResourceProperties.certificateArn;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property certificatePrivateKey/);
            done();
        });
    });

    describe('create', function () {
        it('should succeed', function (done) {
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal(null);
                expect(response.distributionDomainName).to.equal('distributionDomainName');
                expect(createDomainNameStub.calledOnce).to.equal(true);
                expect(updateDomainNameStub.called).to.equal(false);
                expect(deleteDomainNameStub.called).to.equal(false);
                done();
            });
        });
        it('should fail due to createDomainName error', function (done) {
            createDomainNameStub.yields('createDomainName');
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal('createDomainName');
                expect(response).to.equal(undefined);
                expect(createDomainNameStub.calledOnce).to.equal(true);
                expect(updateDomainNameStub.called).to.equal(false);
                expect(deleteDomainNameStub.called).to.equal(false);
                expect(response).to.equal(undefined);
                done();
            });
        });
    });

    describe('update', function () {
        it('should do nothing if nothing has changed', function (done) {
            subject.update(event, {}, function (error, response) {
                expect(error).to.equal(null);
                expect(response.distributionDomainName).to.equal('distributionDomainName');
                expect(updateDomainNameStub.called).to.equal(false);
                expect(createDomainNameStub.called).to.equal(false);
                expect(deleteDomainNameStub.called).to.equal(false);
                expect(getDomainNameStub.calledOnce).to.equal(true);
                done();
            });
        });
        it('should fail if getDomainNameFails', function (done) {
            getDomainNameStub.yields('GetDomainNameError');
            subject.update(event, {}, function (error, response) {
                expect(error).to.equal('GetDomainNameError');
                expect(response).to.equal(undefined);
                expect(updateDomainNameStub.called).to.equal(false);
                expect(createDomainNameStub.called).to.equal(false);
                expect(deleteDomainNameStub.called).to.equal(false);
                expect(getDomainNameStub.calledOnce).to.equal(true);
                done();
            });
        });
        it('should update changed values', function (done) {
            event.OldResourceProperties = {
                domainName: 'domainNameOld',
                certificateChain: 'certificateChainOld',
                certificateBody: 'certificateBodyOld',
                certificatePrivateKey: 'certificatePrivateKeyOld',
                certificateName: 'certificateNameOld'
            };
            subject.update(event, {}, function (error, response) {
                expect(error).to.equal(null);
                expect(response.distributionDomainName).to.equal('distributionDomainName');
                expect(updateDomainNameStub.calledOnce).to.equal(true);
                expect(updateDomainNameStub.firstCall.calledWith({
                    domainName: 'domainName',
                    patchOperations: [
                        { op: 'replace', value: 'certificateName', path: '/certificateName' }
                    ]
                })).to.equal(true);
                expect(createDomainNameStub.called).to.equal(false);
                expect(deleteDomainNameStub.called).to.equal(false);
                expect(getDomainNameStub.called).to.equal(false);
                done();
            });
        });
        it('should fail due to updateDomainName error', function (done) {
            event.OldResourceProperties = {
                domainName: 'domainNameOld'
            };
            updateDomainNameStub.yields('updateDomainName');
            subject.update(event, {}, function (error, response) {
                expect(error).to.equal('updateDomainName');
                expect(response).to.equal(undefined);
                expect(updateDomainNameStub.calledOnce).to.equal(true);
                expect(createDomainNameStub.called).to.equal(false);
                expect(deleteDomainNameStub.called).to.equal(false);
                expect(getDomainNameStub.called).to.equal(false);
                done();
            });
        });
    });

    describe('delete', function () {
        it('should succeed', function (done) {
            subject.delete(event, {}, function (error, response) {
                expect(error).to.equal(undefined);
                expect(response).to.equal(undefined);
                expect(deleteDomainNameStub.calledOnce).to.equal(true);
                expect(createDomainNameStub.called).to.equal(false);
                expect(updateDomainNameStub.called).to.equal(false);
                done();
            });
        });
        it('should fail due to deleteDomainName error', function (done) {
            deleteDomainNameStub.yields('deleteDomainName');
            subject.delete(event, {}, function (error, response) {
                expect(error).to.equal('deleteDomainName');
                expect(response).to.equal(undefined);
                expect(deleteDomainNameStub.calledOnce).to.equal(true);
                expect(createDomainNameStub.called).to.equal(false);
                expect(updateDomainNameStub.called).to.equal(false);
                done();
            });
        });
        it('should fail gracefully due to NotFoundException error', function (done) {
            deleteDomainNameStub.yields({ code: 'NotFoundException' });
            subject.delete(event, {}, function (error, response) {
                expect(error).to.equal(undefined);
                expect(response).to.equal(undefined);
                expect(deleteDomainNameStub.calledOnce).to.equal(true);
                expect(createDomainNameStub.called).to.equal(false);
                expect(updateDomainNameStub.called).to.equal(false);
                done();
            });
        });
    });
});
