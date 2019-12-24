using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace Network.Vmobi.RNNetworkVmobi
{
    /// <summary>
    /// A module that allows JS to share data.
    /// </summary>
    class RNNetworkVmobiModule : NativeModuleBase
    {
        /// <summary>
        /// Instantiates the <see cref="RNNetworkVmobiModule"/>.
        /// </summary>
        internal RNNetworkVmobiModule()
        {

        }

        /// <summary>
        /// The name of the native module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RNNetworkVmobi";
            }
        }
    }
}
