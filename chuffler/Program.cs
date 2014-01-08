using Microsoft.Owin.Hosting;
using Owin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Timers;
using System.Web.Http;
using Topshelf;

namespace chuffler
{
    class Program
    {
        static void Main(string[] args)
        {
            HostFactory.Run(x =>                                 //1
            {
                x.Service<ChufflerStarter>(s =>                        //2
                {
                    s.ConstructUsing(name => new ChufflerStarter());     //3
                    s.WhenStarted(tc => tc.Start());              //4
                    s.WhenStopped(tc => tc.Stop());               //5
                });
                x.RunAsLocalSystem();                            //6

                x.SetDescription("Sample Topshelf Host");        //7
                x.SetDisplayName("Stuff");                       //8
                x.SetServiceName("stuff");                       //9
            });                                                  //10
        }
    }

    public class TownCrier
    {
        readonly System.Timers.Timer _timer;
        public TownCrier()
        {
            _timer = new System.Timers.Timer(1000) { AutoReset = true };
            _timer.Elapsed += (sender, eventArgs) => Console.WriteLine("It is {0} an all is well", DateTime.Now);
        }
        public void Start() { _timer.Start(); }
        public void Stop() { _timer.Stop(); }
    }

    public class ChufflerStarter
    {

        private object monitor = new object();

        public ChufflerStarter()
        {
            
        }



        public void Start() {
            const string serverUrl = "http://localhost:8080";
            using (WebApp.Start<Startup>(serverUrl))
            {
                lock (monitor)
                {
                    Monitor.Wait(monitor);
                }
            }
        }
        public void Stop() {
            lock (monitor)
            {
                Monitor.Pulse(monitor);
            }
        }
    }

    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            // Configure WebApi
            var config = new HttpConfiguration();
            config.Routes.MapHttpRoute(
             "API Default", "api/{controller}/{id}", new { id = RouteParameter.Optional });
            app.UseWebApi(config);

            // Configure SignalR
            app.MapSignalR();
        }
    }
}
