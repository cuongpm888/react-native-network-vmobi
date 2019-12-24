
import { NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import XPAHttpRequest from './util/XPAHttpRequest'

var user_agent = DeviceInfo.getUserAgent();
var dev_ver = DeviceInfo.getSystemVersion();
var is_tablet = DeviceInfo.isTablet();
var carrier = DeviceInfo.getCarrier();
var app = "xap";
var appver = DeviceInfo.getVersion();
var secret = "6bd94b38900f91cc8a946fe3aee58766";
var sigkey = "Az].E#Y<3;Vf)t+@";
var pk = DeviceInfo.getBundleId();
var platform = Platform.OS == 'ios' ? 'ios' : 'android'
var did = DeviceInfo.getUniqueID();
var encryptParams = true; //co encrypt params ko 
var defaultParams = {};
var debug = true;
var ___tmp = new XPAHttpRequest(user_agent, dev_ver, is_tablet, carrier, app, appver, secret, sigkey, pk, platform, did, encryptParams, defaultParams, debug);
var RNNetworkVmobi = ___tmp;

export default RNNetworkVmobi;
// export default RNNetworkVmobi;
