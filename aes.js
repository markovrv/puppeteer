// //import crypto module to generate random binary data
// var crypto = require('crypto');
 
// // generate random passphrase binary data
// var r_pass = crypto.randomBytes(128);
 
// // convert passphrase to base64 format
// var r_pass_base64 = r_pass.toString("base64");
 
// console.log("passphrase base64 format: ");
// console.log(r_pass_base64);


//create custom json serialization format
// var JsonFormatter = {
//     stringify: function (cipherParams) {
//         // create json object with ciphertext
//         var jsonObj = {
//             ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
//         };
        
//         // optionally add iv and salt
//         if (cipherParams.iv) {
//             jsonObj.iv = cipherParams.iv.toString();
//         }
        
//         if (cipherParams.salt) {
//             jsonObj.s = cipherParams.salt.toString();
//         }
 
//         // stringify json object
//         return JSON.stringify(jsonObj)
//     },
 
//     parse: function (jsonStr) {
//         // parse json string
//         var jsonObj = JSON.parse(jsonStr);
        
//         // extract ciphertext from json object, and create cipher params object
//         var cipherParams = CryptoJS.lib.CipherParams.create({
//             ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
//         });
        
//         // optionally extract iv and salt
//         if (jsonObj.iv) {
//             cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
//         }
            
//         if (jsonObj.s) {
//             cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
//         }
        
//         return cipherParams;
//     }
// };


// import node-cryptojs-aes modules to encrypt or decrypt data
var node_cryptojs = require('node-cryptojs-aes');
 
// node-cryptojs-aes main object;
var CryptoJS = node_cryptojs.CryptoJS;
 
// custom json serialization format
var JsonFormatter = node_cryptojs.JsonFormatter;
 
// message to cipher
var message = "I love maccas!";
var r_pass_base64 = "lKUuv4KJzhjuy12R1upaNVoi9QbRIUQ7pL8QhEIiwIfPI9U+l/N+qkt8eJr1KUk6ai0awWqUCJMMealbdwlMfH2+MBCmWVbnTmPZ/mCkJvK6gtZSzM4ZBKvJ5hVS1LCJ0MfQ7f/3Y24+BrFfLnjfh9LdWKUvoZC8mpl7XXFAVTo=";
 
// encrypt plain text with passphrase and custom json serialization format, return CipherParams object
// r_pass_base64 is the passphrase generated from first stage
// message is the original plain text  
 
var encrypted = CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });
 
// convert CipherParams object to json string for transmission
var encrypted_json_str = encrypted.toString();
 
console.log("serialized CipherParams object: ");
console.log(encrypted_json_str);

// decrypt data with encrypted json string, passphrase string and custom JsonFormatter
var decrypted = CryptoJS.AES.decrypt(encrypted_json_str, r_pass_base64, { format: JsonFormatter });
 
// convert to Utf8 format unmasked data
var decrypted_str = CryptoJS.enc.Utf8.stringify(decrypted);
 
console.log("decrypted string: " + decrypted_str);