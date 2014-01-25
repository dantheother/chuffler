using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;

namespace chuffler.Controllers
{
    [RoutePrefix("api/folder")]
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
                    , ChildCount = TryGetChildCount(di.FullName)
                }
            );

        }

        [Route("single")]
        [HttpGet()]
        public Models.Folder Single(string path)
        {
            var di = new System.IO.DirectoryInfo(path);
            return new Models.Folder
                {
                    FullPath = di.FullName
                    ,
                    Name = di.Name
                    ,
                    ChildCount = TryGetChildCount(di.FullName)
                };
        }


        private int TryGetChildCount(string path)
        {
            try
            {
                return System.IO.Directory.GetDirectories(path).Length;
            }
            catch (Exception ex)
            {
                Console.WriteLine(string.Format("Error Getting child count for '{0}': {1} - {2}", path, ex.GetType().FullName, ex.Message));   
            }

            return 0;

        }

    }
}
