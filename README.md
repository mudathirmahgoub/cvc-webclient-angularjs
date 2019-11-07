# CVC-webclient

Source code for the CVC web client

## Deployment

Deployment of CVC-webclient is easy since it is a static web app. 
You only need to do the following:

1. Copy the files under the **app** directory to the web server. 
The directory path in milner is ```/var/lib/tomcat7/webapps/app```
2. Update the configurations.js file to specify the api URL for the kind server:

```javascript
// production api Url
// kindEnvironment.apiUrl = "https://kind.cs.uiowa.edu/cvcservices/";

// development api Url
kindEnvironment.apiUrl = "http://localhost:8080/";
```

3. Change the base tag in index.html to reflect the deployment path. 
 For milner the deployment path is ```http://kind.cs.uiowa.edu/cvc-app/``` 
 therefore, the base would be ```/cvc-app/```
```html
<head>
    <base href='/cvc-app/'/>
    ...
</head>
```

## Development


The web client is using AngularJS framework which needs an http web server 
for loading the app files. Any http web server can work. Alternatively 
the kind2-webclient is configured to use a simple static web server
[http-server](https://github.com/indexzero/http-server). The following steps 
are only needed in the development environment with
 [http-server](https://github.com/indexzero/http-server) :

1. Install [Node.js](https://nodejs.org)
2. Run ```npm install``` to install the required packages
3. Run ```npm start``` to start the 
   [http-server](https://github.com/indexzero/http-server). Since port 8080 may be
   allocated to the kind server, the [http-server](https://github.com/indexzero/http-server)
   is configured to use port 8000. To access the kind2-webclient use the url
   ```http://localhost:8000```
4. Update the app/configurations.js file to specify the api URL for the kind server
5. If the kind server is in a different server or has a different origin, browsers will 
complain about [same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy) 
and block AngularJS Ajax requests. Any extension that enables cross-origin resource sharing 
[CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) can be used for development.
For chrome you can use this [plugin](https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc?hl=en)

