var restify = require('restify');
var builder = require('botbuilder');
var prompts = require('./prompts');
var locationDialog = require('botbuilder-location');


var Client = require('node-rest-client').Client;
//=========================================================
// Bot Setup
//=========================================================

// jsonObject = {
//     "AccessRequest": {
//                         "AccessLicenseNumber": "AD245999B2916A98", "UserId": "shaikathaque4",
//                         "Password": "UPSbot123!"
//                     },
//         "LocatorRequest": {
//                         "Request": {
//                         "RequestAction": "Locator", "RequestOption": "1", "TransactionReference": {
//                         "CustomerContext": "Find nearest UPS location" }
//                     }, 
//                     "OriginAddress": {
//                         "PhoneNumber": "1234567891", "AddressKeyFormat": {
//                         "AddressLine": "11 Times Square", "PoliticalDivision2": "New York City", "PoliticalDivision1": "NY", "PostcodePrimaryLow": "10036", "PostcodeExtendedLow": "", "CountryCode": "US"
//                         } },
// 	                "Translate": { "Locale": "en_US"},
//                     "UnitOfMeasurement": {
//                         "Code": "MI" },
//                         "LocationSearchCriteria": { 
//                             "SearchOption": {
//                                 "OptionType": { "Code": "01"},
//                                 "OptionCode": {
//                                 "Code": "002" }
//                             },
//                             "MaximumListSize": "5", "SearchRadius": "5"}
//         }
// };


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    // appId: null,
    // appPassword: null
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector, function (session) {
    // session.send("%s, I heard: %s", session.userData.name, session.message.text);
    // session.send("Say 'help' or something else...");
        session.beginDialog('rootMenu');
});
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var model = process.env.model;
var LocationKey = "DefaultLocation";
var ShippingStyleKey = "Shipping Style";
var async = require("async");
// var recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/fd9a76fa-9d70-47e3-828c-33ef63fa039f?subscription-key=9aefdc1486b744049db504427816d708');

var entityID = 0;

// bot.recognizer(recognizer);
// bot.library(locationDialog.createLibrary("Ak2VZoOri8R263-z_IAqqGRcG55S3S5q71H9lSkCsU-1gjnHD1KRUkbeI-zLPp5O"));


// Add first run dialog
bot.dialog('firstRun', [
    function (session) {
        // Update versio number and start Prompts
        // - The version number needs to be updated first to prevent re-triggering 
        //   the dialog. 
        session.userData.version = 1.0; 
        // builder.Prompts.text(session, "Hey! How may I help you today?");
        session.beginDialog('rootMenu');
    },
    function (session, results) {
        // We'll save the users name and send them an initial greeting. All 
        // future messages from the user will be routed to the root dialog.
        session.userData.name = results.response;
        session.endDialog("Hi %s, say something to me and I'll echo it back.", session.userData.name); 
    }
]).triggerAction({
    onFindAction: function (context, callback) {
        // Trigger dialog if the users version field is less than 1.0
        // - When triggered we return a score of 1.1 to ensure the dialog is always triggered.
        var ver = context.userData.version || 0;
        var score = ver < 1.0 ? 1.1: 0.0;
        callback(null, score);
    },
    onInterrupted: function (session, dialogId, dialogArgs, next) {
        // Prevent dialog from being interrupted.
        session.send("Sorry... We need some information from you first.");
    }
});

// Add root menu dialog
bot.dialog('rootMenu', [
    function (session) {
        builder.Prompts.choice(session, "Hey! How may I help you today?", 'Breakfast|Lunch|Dinner|Cafes|Quit',{listStyle:3});
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('breakfast');
                break;
            case 1:
                session.beginDialog('lunch');
                break;
            case 2:
                session.beginDialog('dinner');
                break;
            case 3:
                session.beginDialog('dafes');
                break;
            case 4:
                session.beginDialog('quit');
                break;
            default:
                session.endDialog();
                break;
        }
    },
    function (session) {
        // Reload menu
        session.replaceDialog('rootMenu');
    }
]).reloadAction('showMenu', null, { matches: /^(menu|back)/i });


// Add help dialog
bot.dialog('help', function (session) {
    session.send("I'm a simple echo bot.");
}).triggerAction({ matches: /^help/i });

var returnVals = [];
var returnCityId = [];
//Breakfast
bot.dialog('breakfast', [
    // Step 1
    function (session) {
        builder.Prompts.text(session, 'Tell us your city?');
    },
    // Step 2
    function (session, results) {
        if (results.response) {
            var city = results.response;
            async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["AddressLine"] = place.streetAddress;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PoliticalDivision1"] = place.region;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PostcodePrimaryLow"] = place.postalCode;
                            // q="new york";
                            // console.log(jsonObject);
                            var args = {
                                // data : JSON.stringify(jsonObject),
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/cities?q="+city+"&apikey=14fa78b892c33a15a26b6ca9ec09239e", args, function (data, response) {
                                                // parsed response body as js object 
                                                
                                                responseData = data;
                            console.log(responseData);
                                                
                                                locations = responseData.location_suggestions;
                                                for(var i = 0; i < 10; i++){
                                                    returnVals[i] = locations[i].name;
                                                    returnCityId[i] = locations[i].id;
                                                };
                                                callback(null, returnVals, returnCityId);
                                            });
                        }, 
                        function(arg1, callback){
                                builder.Prompts.choice(session,"Great, choose a city", returnVals, {listStyle:3});
                                // session.dialogData.returnCityIds = returnVals;
                                // console.log("IMP dataaaaaaaA: "+session.returnCityId[0]);
                        }]);
        }
    },
    // Step 3
    function (session, results) {
        if (results.response) {
        switch (results.response.index) {
                                case 0:
                                    // var id = JSON.parse(locations[0].id);
                                    // session.send(id);
                                    entityId = locations[0].id;
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 1:
                                    session.send(locations[1].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 2:
                                    session.send(locations[2].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 3:
                                    session.send(locations[3].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    session.beginDialog("shipment");
                                    break;
                                case 4:
                                    session.send(locations[4].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 5:
                                    session.send(locations[5].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 6:
                                    session.send(locations[6].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 7:
                                    session.send(locations[7].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 8:
                                    session.send(locations[8].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 9:
                                    session.send(locations[9].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                default:
                                    session.send("Great!");
                                    // session.beginDialog("shipment");
                                    break;
                                }
        }
        session.endDialog('Hello %s!', results.response.index);
    }
]).triggerAction({ matches: /^breakfast/i });

//Get Cities

bot.dialog('get_cities', [
    function (session) {
                    async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["AddressLine"] = place.streetAddress;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PoliticalDivision1"] = place.region;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PostcodePrimaryLow"] = place.postalCode;
                            q="new york";
                            // console.log("ID:"+ session.dialogData.entityId);
                            var args = {
                                // data : JSON.stringify(jsonObject),
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/cities?q="+q+"newyork&apikey=14fa78b892c33a15a26b6ca9ec09239e", args, function (data, response) {
                                                // parsed response body as js object 
                                                
                                                responseData = data;
                            console.log(responseData);
                                                
                                                dropLocations = responseData.location_suggestions;
                                                for(var i = 0; i < 5; i++){
                                                    returnVals[i] = dropLocations[i].name;
                                                };
                                                callback(null, returnVals);
                                            });
                        }, 
                        function(arg1, callback){
                                builder.Prompts.choice(session,"Which address do you want to select", returnVals, {listStyle:3});
                        }]);
    },
    function (session, results) {
        session.endDialog('Hello %s!', results.response);
    }
]).triggerAction({ matches: /^greetings/i });


// Get Restaurants
bot.dialog('get_restaurants', [
    // Step 1
    function (session) {
            // var restaurants = results.response;
            async.waterfall([
                        function(callback){
                            var client = new Client();
                            var responseData = [];
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["AddressLine"] = place.streetAddress;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PoliticalDivision1"] = place.region;
                            // jsonObject["LocatorRequest"]["OriginAddress"]["AddressKeyFormat"]["PostcodePrimaryLow"] = place.postalCode;
                            // q="new york";
                            console.log("ID::::::::::::::"+ entityId);
                            var args = {
                                // data : JSON.stringify(jsonObject),
                                headers: {"Content-Type": "application/json"}
                            };
                            client.get("https://developers.zomato.com/api/v2.1/search?entity_id=280&entity_type=city&collection_id=1&apikey=14fa78b892c33a15a26b6ca9ec09239e", args, function (data, response) {
                            responseData = data;
                            console.log(responseData);
                                                
                                                restaurants = responseData.restaurants;
                                                for(var i = 0; i < 10; i++){
                                                    returnVals[i] = restaurants[i].name;
                                                    returnCityId[i] = restaurants[i].id;
                                                };
                                                callback(null, returnVals, returnCityId);
                                            });
                        }, 
                        function(arg1, callback){
                                builder.Prompts.choice(session,"Great, choose a city", returnVals, {listStyle:3});
                                // session.dialogData.returnCityIds = returnVals;
                                // console.log("IMP dataaaaaaaA: "+session.returnCityId[0]);
                        }]);
    },
    // Step 3
    function (session, results) {
        if (results.response) {
        switch (results.response.index) {
                                case 0:
                                    // var id = JSON.parse(locations[0].id);
                                    // session.send(id);
                                    session.dialogData.entityId = locations[0].id;
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                     session.beginDialog("get_restaurants");
                                    break;
                                case 1:
                                    session.send(locations[1].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 2:
                                    session.send(locations[2].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 3:
                                    session.send(locations[3].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    session.beginDialog("shipment");
                                    break;
                                case 4:
                                    session.send(locations[4].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 5:
                                    session.send(locations[5].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 6:
                                    session.send(locations[6].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 7:
                                    session.send(locations[7].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 8:
                                    session.send(locations[8].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                case 9:
                                    session.send(locations[9].id);
                                    console.log("IMP dataaaaaaaA: "+locations[0].id);
                                    // session.beginDialog("shipment");
                                    break;
                                default:
                                    session.send("Great!");
                                    // session.beginDialog("shipment");
                                    break;
                                }
        }
        session.endDialog('Hello %s!', results.response.index);
    }
]).triggerAction({ matches: /^get_restaurants/i });




//Lunch
bot.dialog('Lunch', function (session) {
    session.send("Lunch");
    session.send("ending %s",session.userData.type)
}).triggerAction({ matches: /^Lunch/i });

//Dinner
bot.dialog('Dinner', function (session) {
    session.send("Dinner");
    session.send("ending %s",session.userData.type)
}).triggerAction({ matches: /^Dinner/i });


//cafes
bot.dialog('Cafes', function (session) {
    session.send("Cafes");
}).triggerAction({ matches: /^Cafes/i });

//Search
bot.dialog('search', [
    function (session) {
        builder.Prompts.choice(session, "What are you looking for?", 'Search by zone|Search by Image|Quit',{listStyle:3});
    },
    function (session, results) {
        switch (results.response.index) {
            case 0:
                session.beginDialog('breakfast');
                break;
            case 1:
                session.beginDialog('Lunch');
                break;
            case 2:
                session.beginDialog('Dinner');
                break;
            case 2:
                session.beginDialog('Cafes');
                break;
            default:
                session.endDialog();
                break;
        }
    },
    function (session) {
        // Reload menu
        session.replaceDialog('rootMenu');
    }
]).reloadAction('showMenu', null, { matches: /^(search)/i });

//Quit
bot.dialog('Quit', function (session) {
    session.send("Good bye !");
}).triggerAction({ matches: /^Quit/i });