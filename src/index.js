'use strict';

var aws = require('aws-sdk');
var apiGateway = new aws.APIGateway({ apiVersion: '2015-07-09' });

var pub = {};

pub.validate = function (event) {
    if (!event.ResourceProperties.domainName) {
        throw new Error('Missing required property domainName');
    }
    if (!event.ResourceProperties.certificateChain) {
        throw new Error('Missing required property certificateChain');
    }
    if (!event.ResourceProperties.certificateBody) {
        throw new Error('Missing required property certificateBody');
    }
    if (!event.ResourceProperties.certificatePrivateKey) {
        throw new Error('Missing required property certificatePrivateKey');
    }
    if (!event.ResourceProperties.certificateName) {
        throw new Error('Missing required property certificateName');
    }
    fixCertificates(event);
};

pub.create = function (event, _context, callback) {
    var params = event.ResourceProperties;
    delete params.ServiceToken;
    console.log('createParams', params);
    apiGateway.createDomainName(params, function (error, apiDomainName) {
        if (error) {
            return callback(error);
        }
        var response = {
            distributionDomainName: apiDomainName.distributionDomainName
        };
        callback(null, response);
    });
};

pub.update = function (event, _context, callback) {
    var patchOperations = getPatchOperations(event);
    if (patchOperations.length === 0) {
        return getDomainName(event, callback);
    }

    var params = {
        domainName: event.ResourceProperties.domainName,
        patchOperations: patchOperations
    };
    apiGateway.updateDomainName(params, function (error, apiDomainName) {
        if (error) {
            return callback(error);
        }
        var response = {
            distributionDomainName: apiDomainName.distributionDomainName
        };
        callback(null, response);
    });
};

pub.delete = function (event, _context, callback) {
    var params = {
        domainName: event.ResourceProperties.domainName
    };
    apiGateway.deleteDomainName(params, function (error) {
        if (error && error.code !== 'NotFoundException') {
            return callback(error);
        }
        callback();
    });
};

function getDomainName(event, callback) {
    var params = {
        domainName: event.ResourceProperties.domainName
    };
    apiGateway.getDomainName(params, function (error, apiDomainName) {
        if (error) {
            return callback(error);
        }
        var response = {
            distributionDomainName: apiDomainName.distributionDomainName
        };
        callback(null, response);
    });
}

/**
 * Certificates are scrambled when they come in and need to be restructured.
 * It's mainly newlines that have been replaced by space.
 */
function fixCertificates(event) {
    event.ResourceProperties.certificateChain = fixCertPart(event.ResourceProperties.certificateChain,
        '-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----');
    event.ResourceProperties.certificateBody = fixCertPart(event.ResourceProperties.certificateBody,
        '-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----');
    event.ResourceProperties.certificatePrivateKey = fixCertPart(event.ResourceProperties.certificatePrivateKey,
        '-----BEGIN RSA PRIVATE KEY-----', '-----END RSA PRIVATE KEY-----');
    /* istanbul ignore else */
    if (event.OldResourceProperties) {
        event.OldResourceProperties.certificateChain = fixCertPart(event.OldResourceProperties.certificateChain,
            '-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----');
        event.OldResourceProperties.certificateBody = fixCertPart(event.OldResourceProperties.certificateBody,
            '-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----');
        event.OldResourceProperties.certificatePrivateKey = fixCertPart(event.OldResourceProperties.certificatePrivateKey,
            '-----BEGIN RSA PRIVATE KEY-----', '-----END RSA PRIVATE KEY-----');
    }
}
function fixCertPart(certPart, header, footer) {
    return certPart
        // Remove headers and footers, we'll re-add them later
        .replace(new RegExp(header, 'g'), 'CERT_HEADER_PLACEHOLDER')
        .replace(new RegExp(footer, 'g'), 'CERT_FOOTER_PLACEHOLDER')

        .replace(/\\n/g, '\n') // Replace escaped new line with proper new line
        .replace(/ /g, '\n') // Replace space with new line

        // Remove any extra newlines that have snuck in
        .replace(/CERT_HEADER_PLACEHOLDER\n/g, 'CERT_HEADER_PLACEHOLDER')
        .replace(/\nCERT_FOOTER_PLACEHOLDER/g, 'CERT_FOOTER_PLACEHOLDER')

        .replace(/CERT_HEADER_PLACEHOLDER/g, header + '\n') // Replace headers and footers
        .replace(/CERT_FOOTER_PLACEHOLDER/g, '\n' + footer);
}

function getPatchOperations(event) {
    var patchOperations = [];
    buildPatchOperation(event, 'certificateName', patchOperations);
    return patchOperations;
}

function buildPatchOperation(event, key, patchOperations) {
    if (event.ResourceProperties[key] !== event.OldResourceProperties[key]) {
        patchOperations.push({
            op: 'replace',
            path: '/' + key,
            value: event.ResourceProperties[key]
        });
    }
}

module.exports = pub;
