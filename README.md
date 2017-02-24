# lulo Amazon API Gateway Domain Name

lulo Amazon API Gateway Domain Name creates a new Domain Name that can be used for API Gateway.

lulo Amazon API Gateway Domain Name is a [lulo](https://github.com/carlnordenfelt/lulo) plugin

# Installation
```
npm install lulo-plugin-api-gateway-domain-name --save
```

## Usage
### Properties
* domainName: The domain name. Required
* certificateChain: The certificate chain. Required
* certificateBody: The certificate body. Required
* certificatePrivateKey: The certificate private key. Required
* certificateName: The name of the certificate. Required

**Note:** API Gateway does not allow modifications to the certificate except for `certificateName`. 
If you need to renew the certificate, please use the API Gateway Console.
Changes to the other properties will have no effect on the resource.

### Return Values
#### Fn::GetAtt
**distributionDomainName** The product `Fn::GetAtt["DomainName", "distributionDomainName"]`. Note: You must create a DNS record matching `domainName` pointing to this distribution.

### Required IAM Permissions
The Custom Resource Lambda requires the following permissions for this plugin to work:
```
{
   "Effect": "Allow",
   "Action": [
        "apigateway:*"
   ],
   "Resource": "*"
}
```

## License
[The MIT License (MIT)](/LICENSE)

## Change Log
[Change Log](/CHANGELOG.md)
