const node_cryptojs = require('node-cryptojs-aes');
const CryptoJS = node_cryptojs.CryptoJS;
const JsonFormatter = node_cryptojs.JsonFormatter;

const r_pass_base64 = "lKUuv4KJzhjuy12R1upaNVoi9QbRIUQ7pL8QhEIiwIfPI9U+l/N+qkt8eJr1KUk6ai0awWqUCJMMealbdwlMfH2+MBCmWVbnTmPZ/mCkJvK6gtZSzM4ZBKvJ5hVS1LCJ0MfQ7f/3Y24+BrFfLnjfh9LdWKUvoZC8mpl7XXFAVTo=";
exports.r_pass_base64 = r_pass_base64
exports.decrypt = (encrypted_json_str) => {
  var decrypted = CryptoJS.AES.decrypt(encrypted_json_str, r_pass_base64, { format: JsonFormatter });
  return CryptoJS.enc.Utf8.stringify(decrypted);
}
exports.encrypt = message => CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });