const node_cryptojs = require('node-cryptojs-aes');
const CryptoJS = node_cryptojs.CryptoJS;
const JsonFormatter = node_cryptojs.JsonFormatter;
const config = require('../config')
const r_pass_base64 = config.passkey

exports.r_pass_base64 = r_pass_base64
exports.decrypt = (encrypted_json_str) => {
  var decrypted = CryptoJS.AES.decrypt(encrypted_json_str, r_pass_base64, { format: JsonFormatter });
  return CryptoJS.enc.Utf8.stringify(decrypted);
}
exports.encrypt = message => CryptoJS.AES.encrypt(message, r_pass_base64, { format: JsonFormatter });