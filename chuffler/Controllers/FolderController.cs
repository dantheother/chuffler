using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;

namespace chuffler.Controllers
{
    public class FolderController : ApiController
    {
        public IEnumerable< Models.Folder > Get(string path)
        {
            var folders = System.IO.Directory.GetDirectories(path);
            return folders.Select(
                f => new System.IO.DirectoryInfo(f)
                ).Select(
                di => new Models.Folder
                {
                    FullPath=di.FullName
                    , Name=di.Name
                }
            );

        }
    }
}
