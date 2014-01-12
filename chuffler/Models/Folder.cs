using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace chuffler.Models
{
    public class Folder
    {
        public string Name { get; set; }
        public string FullPath { get; set; }
        public int ChildCount { get; set; }
    }
}
