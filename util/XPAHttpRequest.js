import * as axios from 'axios';
import { NetInfo, ToastAndroid, AlertIOS, Platform, AsyncStorage } from 'react-native';

var CryptoJS = require("crypto-js");
var qs = require('qs');

class MyEncodeLib {
	static byteArrayToWordArray(ba) {
		var wa = [],
			i;
		for (i = 0; i < ba.length; i++) {
			wa[(i / 4) | 0] |= ba[i] << (24 - 8 * i);
		}
		return CryptoJS.lib.WordArray.create(wa, ba.length);
	}

	static wordToByteArray(word, length) {
		var ba = [],
			i,
			xFF = 0xFF;
		if (length > 0)
			ba.push(word >>> 24);
		if (length > 1)
			ba.push((word >>> 16) & xFF);
		if (length > 2)
			ba.push((word >>> 8) & xFF);
		if (length > 3)
			ba.push(word & xFF);

		return ba;
	}

	static wordArrayToByteArray(wordArray, length) {
		if (wordArray.hasOwnProperty("sigBytes") && wordArray.hasOwnProperty("words")) {
			length = wordArray.sigBytes;
			wordArray = wordArray.words;
		}
		var result = [],
			bytes
		i = 0;
		while (length > 0) {
			bytes = MyEncodeLib.wordToByteArray(wordArray[i], Math.min(4, length));
			length -= bytes.length;
			result.push(bytes);
			i++;
		}
		return [].concat.apply([], result);
	}

	static toWordArray(str) {
		return CryptoJS.enc.Utf8.parse(str);
	}

	static toBase64String(words) {
		return CryptoJS.enc.Base64.stringify(words);
	}

	static fromBase64String(str) {
		return CryptoJS.enc.Base64.parse(str);
	}

	static wordArrayToHex(wordArray) {
		return wordArray.toString(CryptoJS.enc.Hex);
	}

	static md5(str) {
		return CryptoJS.MD5(str).toString();
	}
}

class XPAHttpRequest {
	constructor(user_agent, dev_ver, is_tablet, carrier, app, appver, secret, sigkey, pk, platform, did, encryptParams, default_params = {}, debug) {
		this._getNetworkStatus();
		this.user_agent = user_agent;
		this.dev_ver = dev_ver;
		this.is_tablet = is_tablet;
		this.carrier = carrier;
		this.network = "";
		this.secver = "4";
		this.app = app;
		this.appver = appver;
		this.secret = secret;
		this.sigkey = sigkey;
		this.pk = pk;
		this.platform = platform;
		this.did = did;
		this.encryptParams = encryptParams;
		this.debug = debug;
		default_params._app = app;
		default_params._appver = appver;
		default_params._pk = pk;
		default_params._platform = platform;
		default_params._did = did;
		default_params._user_agent = user_agent;
		default_params._dev_ver = dev_ver;
		default_params._is_tablet = is_tablet;
		default_params._carrier = carrier;
		default_params._network = this.network;
		this.default_params = default_params;
		this.client = axios.create({
			headers: { 'Accept-Encoding': 'gzip, deflate', 'app': this.app },
		});;
	}

	_getNetworkStatus() {
		netStatus = NetInfo.getConnectionInfo().then((connectionInfo) => {
			this.network = connectionInfo.type;
		});
	}

	_getTimeMsec() {
		return new Date().getTime();
	}

	_encyptParams(params) {
		if (this.encryptParams == false) return params;
		if (this.default_params._network == "")
			this.default_params._network = this.network;
		let merged = { ...this.default_params, ...params };
		merged.ts = this._getTimeMsec();
		let json = JSON.stringify(merged);
		var data = this._encode(json);
		data = this._escapse(data);
		return { data: data };
	}

	_escapse(val) {
		var ret = val;
		if (val) {
			ret = ret.replace(/\//g, '_');
			ret = ret.replace(/\+/g, '-');
		}
		return ret;
	}

	_disescapse(val) {
		var ret = val;
		if (val) {
			ret = ret.replace(/_/g, '/');
			ret = ret.replace(/-/g, '+');
		}
		return ret;
	}

	_encode(val) {
		return this.secver + "|" + this._escapse(this._encodeV4(val));
	}

	_encodeV4(val) {
		var iv = CryptoJS.lib.WordArray.random(16);
		var encrypted = CryptoJS.AES.encrypt(val, CryptoJS.enc.Hex.parse(this.secret), {
			iv: iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7
		});
		var iv_ba = MyEncodeLib.wordArrayToByteArray(iv);
		var cipher_ba = MyEncodeLib.wordArrayToByteArray(encrypted.ciphertext);

		var ba = [].concat.apply([], iv_ba);
		ba = ba.concat(cipher_ba);
		var ret = MyEncodeLib.byteArrayToWordArray(ba);
		return MyEncodeLib.toBase64String(ret);
	}

	_decode(input) {
		var ver = this.secvers;
		var arr = input.split('|');
		if (arr && arr.length == 2) {
			ver = arr[0];
			input = arr[1];
		}
		input = this._disescapse(input);
		if (ver === "4") {
			return this._decodeV4(input);
		}
		else if (ver === "5") {
			return this._decodeV5(input);
		}
		else {
			return this._decodeV5(input);
		}
	}

	_decodeV5(input) {
		var decrypted = CryptoJS.AES.decrypt(input, this.secret, {
		});
		var ret = decrypted.toString(CryptoJS.enc.Utf8);
		return ret;
	}

	_decodeV4(input) {
		var input_wa = MyEncodeLib.fromBase64String(input);
		var bytes = MyEncodeLib.wordArrayToByteArray(input_wa);
		var iv_ba = bytes.slice(0, 16);
		var cipher_ba = bytes.slice(16, bytes.length);
		var iv = MyEncodeLib.byteArrayToWordArray(iv_ba);
		var cipher = MyEncodeLib.byteArrayToWordArray(cipher_ba);
		var decrypted = CryptoJS.AES.decrypt({ ciphertext: cipher }, CryptoJS.enc.Hex.parse(this.secret), {
			iv: iv,
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7
		});
		var hex = MyEncodeLib.wordArrayToHex(decrypted);
		var b = CryptoJS.enc.Hex.parse(hex);
		var ret = decrypted.toString(CryptoJS.enc.Utf8);
		return ret;
	}

	_processResult(response, execTime = 0) {
		var res = {};
		res.execTime = execTime;
		if (response && response.headers && response.headers.__asm__ && response.headers.__asm__ == "1") {
			var result = this._decode(response.data);
			if (result !== null && result !== '') {
				var obj = JSON.parse(result);
				res.data = obj;
			}
		}
		else {
			res.data = response.data;
		}
		return res;
	}

	_buildSig(params) {
		const ordered = {};
		Object.keys(params).sort().forEach(function (key) {
			ordered[key] = params[key];
		});

		var s = "";
		Object.keys(ordered).forEach(function (key, index) {
			var val = ordered[key];
			s += key + "|" + val;
		});
		s += this.sigkey;
		// console.log("==>'" + s + "'");
		var sig = MyEncodeLib.md5(s);
		return sig;
	}

	_request(path, params, method = 'POST', debug = false) {
		console.log("Log request: --- platform: " + this.platform + " --- verion: " + this.appver + " --- did: " + this.did + " --- bundleID: " + this.pk + " --- User agent: " + this.user_agent + " --- device ver: " + this.dev_ver + " --- isTablet: " + this.is_tablet + " --- carrier: " + this.carrier + " --- network: " + this.network);
		params = this._encyptParams(params);
		var sig = this._buildSig(params);
		params.sig = sig;
		if (this.app) params.app = this.app;
		_client = this.client;
		_this = this;
		var promise = new Promise(function (resolve, reject) {
			var _req = '';
			if (debug || _this.debug) {
				var s = "";
				Object.keys(params).forEach(function (key, index) {
					var val = params[key];
					s += key + "=" + encodeURIComponent(val) + "&";
				});
				if (path.indexOf("?") !== -1) {
					_req = path + "&" + s;
				}
				else {
					_req = path + "?" + s;
				}
				console.log("req=" + _req);
			}
			var _start = _this._getTimeMsec();

			if (method === 'GET') {
				_client.get(path, { params: params })
					.then(function (response) {
						// console.log(response);
						var _end_req = _this._getTimeMsec();
						var resp = _this._processResult(response);
						var _end_result = _this._getTimeMsec();
						let exec_req = _end_req - _start;
						let exec_decode = _end_result - _end_req;
						let exec_whole = exec_req + exec_decode;
						if (debug || _this.debug) console.log("exec_req=" + exec_req + "-exec_decode=" + exec_decode + "-whole=" + exec_whole);
						resp.profiler = {
							exec_req: exec_req,
							exec_decode: exec_decode,
							exec_whole: exec_whole,
						}

						var profilerText = "GET: exec_req: " + exec_req + "\nexec_decode: " + exec_decode + "\nexec_whole: " + exec_whole;
						if (Platform.OS === 'android') {
							ToastAndroid.showWithGravity(
								profilerText,
								ToastAndroid.SHORT,
								ToastAndroid.CENTER,
							);
						} else {
							AlertIOS.alert("Profiler", profilerText);
						}


						resolve(resp);
					}).catch(function (error) {
						reject(error);
					});
			}
			else {
				console.log('==>POST');
				_client.post(path, qs.stringify(params))
					.then(function (response) {
						var _end_req = _this._getTimeMsec();
						var resp = _this._processResult(response);
						var _end_result = _this._getTimeMsec();
						let exec_req = _end_req - _start;
						let exec_decode = _end_result - _end_req;
						let exec_whole = exec_req + exec_decode;
						if (debug || _this.debug) console.log("exec_req=" + exec_req + "-exec_decode=" + exec_decode + "-whole=" + exec_whole);
						resp.profiler = {
							exec_req: exec_req,
							exec_decode: exec_decode,
							exec_whole: exec_whole,
						}

						if (resp.data.isdebug) {
							var profilerText = response.config.url + "\nexec_req: " + exec_req + "\nexec_decode: " + exec_decode + "\nexec_whole: " + exec_whole;
							if (Platform.OS === 'android') {
								ToastAndroid.showWithGravity(
									profilerText,
									ToastAndroid.SHORT,
									ToastAndroid.CENTER,
						 		);
							} else {
								AlertIOS.alert(response.config.url, profilerText);
							}
						}



						resolve(resp);
					}).catch(function (error) {
						reject(error);
					});
			}


		});
		return promise;
	}

	_endecode() { //test only
		// var msg = "{\"error_code\":0,\"error_message\":\"Successful.\",\"data\":{\"num\":1530239856856}}";	

		// cipher = "5|U2FsdGVkX1-XMajIqdpoHo3hPvTuHu62YIMknmQFB47s_mUVSwooEfvpRRehxKRYy76ixHqcdY2SUtWUSH_MhOxYhy4RbI19cmuHvhvyNoLDkmJYuQXNT_Lw3fzra3Er";
		// var out = this._decode(cipher);
		// console.log("-->" + out);
	}

	request(path, params, method = 'POST', debug = false) {
		return this._request(path, params, method, debug);
	}
}

export default XPAHttpRequest;
