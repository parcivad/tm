// require objects
const fs = require("fs");
const http = require("http");
const open = require("open");
const fetch = require("node-fetch");
// path
const data_path = __dirname + "/lib/data.json";
// vars
let currentTime = '[' +  new Date().getHours() + ':' +  new Date().getMinutes() + '] ';
const redirect_uri = "http://localhost:8080";
const data_json = JSON.parse( fs.readFileSync(data_path).toString() )

function getAccessToken() {
    return JSON.parse(fs.readFileSync(data_path).toString()).token.access_token;
};
function getRefreshToken() {
    return JSON.parse(fs.readFileSync(data_path).toString()).token.refresh_token;
};

function getExpiresIn() {
    return JSON.parse(fs.readFileSync(data_path).toString()).token.expires_in;
};

function getTokenType() {
    return JSON.parse(fs.readFileSync(data_path).toString()).token.token_type;
};

function getScope() {
    return JSON.parse(fs.readFileSync(data_path).toString()).token.scope;
};

function getAuthorizeCode() {
    return JSON.parse(fs.readFileSync(data_path).toString()).authorize.code;
};

/***
 * Function to authorize the client with a http server
 * @param url Url of the Api
 * @param client_id ID of your client (api oauth)
 * @param scope Scopes for the authorization
 * @returns {Promise<resolve, reject>} Returns code or error
 */
async function authorize( url , client_id, scope ) {
    // Promise return code or error
    return new Promise((resolve, reject) => {

        //================= Url build ===================
        const convertparams = function (obj) {
            const str = [];
            for (const p in obj)
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
            return str.join("&");
        }

        const params_array = {
            "client_id": client_id,
            "response_type": "code",
            "redirect_uri": redirect_uri,
            "scope": scope
        };

        const fullUrl = url + "?" + convertparams(params_array);
        //=============================================

        console.debug(currentTime + "Authorization > started Authorization");
        // open a browser tab for the user with the url
        open(fullUrl);

        // start http Server and wait for call with ?code in params
        const authorize_server = http.createServer(function (request, response) {

            checkcode( request.url, authorize_server );

            switch (request.url) {
                case "/styles.css":
                    response.writeHead(200, {"Content-Type": "text/css"});
                    response.write(fs.readFileSync(__dirname + "/lib/styles.css"));
                    break;
                case "/lib/arrow_up.png":
                    response.writeHead(200, {"Content-Type": "image/png"});
                    response.write(fs.readFileSync(__dirname + "/lib/arrow_up.png"));
                    break;
                default :
                    response.writeHead(200, {"Content-Type": "text/html"});
                    response.write(fs.readFileSync(__dirname + "/lib/index.html"));

            };
            response.end();

        }).listen(8080, function () {
            // log
            console.debug(currentTime + "Authorization > Server started! [authorization running!]")
        });

        async function checkcode( url, server ) {

            // filter code out of token
            const params = url.split("?")[1];

            // Are there params
            if ( params !== undefined ) {
                // check if the code is present
                if ( params.includes("code") ) {

                    const code = params.split("&")[0].split("=")[1].replace("%3D", "");

                    server.close( function () {
                        console.debug(currentTime + "Authorization > Server quit! [code saved!]")
                    });

                    console.debug( currentTime + "Authorization > token: " + code );

                    // Save token and return success
                    data_json
                        .authorize.code = code;
                    await fs.writeFileSync( data_path, JSON.stringify(data_json))

                    resolve(code);
                } else {

                    reject({
                        name: "No code after Authorization",
                        message: params
                    });

                }
            }
        }
    });
};

/**
 *
 * @param url
 * @param client_id
 * @param client_secret
 */
function token( url, client_id, client_secret ) {
    return new Promise((resolve, reject) => {

        // Error catch
        if ( data_json.authorize.code === null ) {
            //TODO: The Script should throw a error or re-ask the authorization
            console.debug(currentTime + "There is no code at the time!")
            return;
        }

        console.debug(currentTime + "Token > trying to access token");

        //=================== Form Body ==============================
        const details = {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'authorization_code',
            'redirect_uri': 'http://localhost:8080',
            'code': data_json.authorize.code
        };

        let formBody = [];
        for (const property in details) {
            const encodedKey = encodeURIComponent(property);
            const encodedValue = encodeURIComponent(details[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");
        //==========================================================

        // sending post request to the url
        fetch(url, { method:'post', headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: formBody })
            .then(response => response.json())
            .then(data => {

                // No error/status
                if ( data.status === undefined && data.error === undefined ) {
                    // save
                    data_json.token.access_token = data.access_token;
                    data_json.token.refresh_token = data.refresh_token;
                    data_json.token.expires_in = data.expires_in;
                    data_json.token.token_type = data.token_type;
                    data_json.token.scope = data.scope;
                    // save to file
                    fs.writeFileSync( data_path, JSON.stringify(data_json));
                    console.log(currentTime + "Token > json received and saved");
                    resolve(data.access_token);

                } else if (data.status !== undefined ) {

                    reject({
                        name: "Error from api",
                        message: data.message,
                        statusCode: data.status
                    });

                } else if (data.error !== undefined ) {

                    reject({
                        name: data.error,
                        message: data.error_description,
                    });

                }

            });
    });
};

/**
 *
 * @param url
 * @param client_id
 * @param client_secret
 */
function token_refresh( url, client_id, client_secret ) {
    return new Promise((resolve, reject) => {

        // Error catch
        if ( data_json.authorize.code === null ) {
            //TODO: The Script should throw a error or re-ask the authorization
            console.debug(currentTime + "There is no code at the time!")
            return;
        }

        console.debug(currentTime + "Token > trying to access token");

        //=================== Form Body ==============================
        const details = {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'refresh_token',
            'redirect_uri': 'http://localhost:8080',
            'refresh_token': data_json.token.refresh_token
        };

        let formBody = [];
        for (const property in details) {
            const encodedKey = encodeURIComponent(property);
            const encodedValue = encodeURIComponent(details[property]);
            formBody.push(encodedKey + "=" + encodedValue);
        }
        formBody = formBody.join("&");
        //==========================================================

        // sending post request to the url
        fetch(url, { method:'post', headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: formBody })
            .then(response => response.json())
            .then(data => {

                // No error/status
                if ( data.status === undefined && data.error === undefined ) {
                    // save
                    data_json.token.access_token = data.access_token;
                    data_json.token.refresh_token = data.refresh_token;
                    data_json.token.expires_in = data.expires_in;
                    data_json.token.token_type = data.token_type;
                    data_json.token.scope = data.scope;
                    // save to file
                    fs.writeFileSync( data_path, JSON.stringify(data_json));
                    console.log(currentTime + "Token > json received and saved");
                    resolve(data.access_token);

                } else if (data.status !== undefined ) {

                    reject({
                        name: "Error from api",
                        message: data.message,
                        statusCode: data.status
                    });

                } else if (data.error !== undefined ) {

                    reject({
                        name: data.error,
                        message: data.error_description,
                    });

                }

            });
    });
};


module.exports = {
    getAccessToken,
    getRefreshToken,
    getExpiresIn,
    getTokenType,
    getScope,
    getAuthorizeCode,

    authorize,
    token,
    token_refresh,
}
