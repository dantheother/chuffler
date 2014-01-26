using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;

namespace chuffler.Hubs
{
    public class MoveFileNotify : Microsoft.AspNet.SignalR.Hub
    {
        public void Say(string message)
        {
            Clients.All.say(message);
        }
    }
}
