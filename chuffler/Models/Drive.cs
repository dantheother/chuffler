using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace chuffler.Models
{
    public class Drive
    {
        public string VolumeLabel { get; set; }
        public string Name { get; set; }
        public Folder RootFolder { get; set; }
    }
}
