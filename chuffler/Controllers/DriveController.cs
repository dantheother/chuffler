using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;

namespace chuffler.Controllers
{
    public class DriveController : ApiController
    {
        public IEnumerable<Models.Drive> Get()
        {
            var allDrives = System.IO.DriveInfo.GetDrives();
            return allDrives.Select(
                di => new Models.Drive
                {
                    VolumeLabel = di.VolumeLabel
                    ,
                    Name = di.Name
                    ,
                    RootFolder = new Models.Folder
                    {
                        Name=di.Name
                        ,FullPath=di.Name
                    }
                }
            );
        }
    }
}
