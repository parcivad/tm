# tm Token Manager
Using OAuth in your project, presents token and other OAuth stuff. [local]

[![Discord](https://img.shields.io/discord/690934524955197471?label=Discord&logo=discord)](https://discord.gg/MFhh5XEM2b)

## Import
Import the api connection with the dependencies in the package.json file
```json
"dependencies": {
    "tm.js": "^1.1.8"
  }
```
The next step is to download/install it with the npm command
```shell
npm install
```
after that you can start coding with
```js
const tm = require("tm.js");
```
in you're js file.

## How to run
Now you can use tm.authorize to start a local authorization:
```javascript
tm.authorize("api url with endpoint", "your client_id", "your scopes")
  .then((message) => {
    //message is the code, but you can access the code also with:
    var auth_code = tm.getAuthorizeCode();
  })
  .catch((err) => {
    // in case of error
    console.log( err );
  });
```
after the authorization you can access the token with:
```javascript
tm.token("api url with endpoint", "your client_id", "your client_secret")
        .then((message) => {
            //message is the code, but you can access the token also with:
            var access_token = tm.getAccessToken();
        }).catch((err) => {
            // in case of error
            console.debug(err);
    });
```
after these steps your done!
## Await / .then
You can choice between ```await``` or ```.then```.
Here are both ways to look at:
```AWAIT```
```javascript
async function f() {
    await tm.authorize("api url with endpoint", "your client_id", "scopes")

    console.debug(tm.getAuthorizeCode());

    await tm.token("api url with endpoint", "your client_id", "your client_secret");
    
    console.debug(tm.getAccessToken());
}
```
or with ```.THEN```
```javascript
tm.authorize("api url with endpoint", "your client_id", "scopes")
    .then((message) => {
        tm.token("api url with endpoint", "your client_id", "your client_secret")
            .then((message) => {
                console.debug(message)
            });
    })
    .catch((err) => {
        console.debug(err)
    })
```
### All api functions
```javascript
tm.getAccessToken()
tm.getAuthorizeCode()
tm.getExpiresIn()
tm.getRefreshToken()
tm.getScope()
tm.getTokenType()

tm.authorize()
tm.token()
tm.token_refresh()
```
