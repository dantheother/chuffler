using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace chuffler.Code
{
    class CopyQueue
    {
        private static BlockingCollection<string> queue;
        private static XCopy copier;
        private static Lazy<Microsoft.AspNet.SignalR.Hubs.IHubConnectionContext> clients;
        

        static CopyQueue()
        {
            clients = new Lazy<Microsoft.AspNet.SignalR.Hubs.IHubConnectionContext>(
                () => 
                    Microsoft.AspNet.SignalR.GlobalHost.ConnectionManager.GetHubContext<Hubs.MoveFileNotify>().Clients
            );

            queue = new BlockingCollection<string>();
            
            copier = new XCopy();
            copier.Completed += copier_Completed;
            copier.ProgressChanged += copier_ProgressChanged;

            //Not sure if this is the correct spot to start a task, or if I should have a StartUp method that does it?
            Task.Factory.StartNew(() =>
            {
                foreach (var item in queue.GetConsumingEnumerable())
                {
                    clients.Value.All.jobStarting();
                    //do the boogaloo with it, probably passing the guid so it can come out from the progress and completed
                    try
                    {

                    }
                    catch (System.ComponentModel.Win32Exception ex)
                    {
                        clients.Value.All.error(new
                        {
                            Message = ex.Message,
                            Number = ex.ErrorCode,
                            NativeErrorCode = ex.NativeErrorCode,
                            Type = ex.GetType().FullName,
                            StackTrace = ex.StackTrace
                        }
                        );
                    }
                    catch (Exception ex)
                    {
                        clients.Value.All.error(new
                        {
                            Message = ex.Message,
                            Type = ex.GetType().FullName,
                            StackTrace = ex.StackTrace
                        }
                        );
                    }
                }
                //this will only get to here once we've said to cancel, that the queue will have no more items on it

            });
        }

        public static void Copy(string from, string to)
        {
            //push to queue, probably return a GUID for the queue key
        }

        public static void Move(string from, string to)
        {
            //push to queue, probably return a GUID for the queue key
        }

        public static void Stop()
        {
            copier.Cancel();
            queue.CompleteAdding();
        }


        static void copier_ProgressChanged(object sender, CopyProgressEventArgs e)
        {
            clients.Value.All.jobProgress();
        }

        static void copier_Completed(object sender, EventArgs e)
        {
            clients.Value.All.jobComplete();
        }
    }
}
