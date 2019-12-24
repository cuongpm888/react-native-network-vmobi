import XPAHttpRequest from './XPAHttpRequest'

var app = "xap";
var appver = "1.0";
var secret = "6bd94b38900f91cc8a946fe3aee58766";
var sigkey = "Az].E#Y<3;Vf)t+@";
var pk = "pkgname";
var platform = "ios";
var did = "device id";
var encryptParams = true; //co encrypt params ko 
var defaultParams = {};
var debug = true;
var ___tmp = new XPAHttpRequest(app, appver, secret, sigkey, pk, platform, did, encryptParams, defaultParams, debug);
var myClient = ___tmp;

export default myClient;