﻿/** @jsx React.DOM */

function xhr(options) {
  var deferred = Q.defer(),
      req = new XMLHttpRequest();
 
  req.open(options.method || 'GET', options.url, true);
 
  // Set request headers if provided.
  Object.keys(options.headers || {}).forEach(function (key) {
    req.setRequestHeader(key, options.headers[key]);
  });
 
  req.onreadystatechange = function(e) {
    if(req.readyState !== 4) {
      return;
    }
 
    if([200,304].indexOf(req.status) === -1) {
      deferred.reject(new Error('Server responded with a status of ' + req.status));
    } else {
    	var rawText = req.responseText;
    	console.log(rawText);
    	if (rawText) {
			deferred.resolve(JSON.parse(rawText));
    	} else {
    		deferred.resolve();
    	}
    }
  };
 
  req.send(options.data || void 0);
 
  return deferred.promise;
}

var DataApi = {
	getDrives: function() {
		return new xhr({
			url:'api/drive'
		})
	},
	getFolders: function(path) {
		return new xhr({
			url:'api/folder?path='+path
		})
	}
};

var Root = React.createClass({
	getInitialState: function() {
		var self = this;
		DataApi.getDrives().then( function(data) {
			var newState = self.state;
			for (var i = 0, len = data.length; i<len; i++) {
				var drive = data[i];
				newState.drives.push(drive);
				newState.directories[drive.RootFolder.FullPath] = drive.RootFolder;
				self.setState(this);
			}
		});

		return {
			drives: [],
			directories: {}
		};
	},
  expandDirectory: function(folder) {
  	var self = this;
  	folder.expanded = !folder.exapnded;
  	if (folder.childNodes) {
  		//allready loaded it. Set state and get out of dodge
  		this.setState(this.state);
  	} else {
  		//ask the server for the kiddies
  		DataApi.getFolders(folder.FullPath).then(function(data) {
  			var newState = self.state;
  			for (var i = 0, len = data.length; i<len; i++ ){
  				var thisFolder = data[i];
  				newState[thisFolder.FullPath] = thisFolder;
  			}
			folder.childNodes = data;
			folder.expanded = true;
			self.setState(newState);
  		});
  	}
  },
  render: function() {
  	var drives = this.state.drives.map(function(drive){
  		return <Drive node={drive} expandDirectory={this.expandDirectory} />
  	},this);

    return (
    	<div>
    		{drives}
    	</div>
    );
  }
});

var Drive = React.createClass({
	handleExpand: function() {
		if (!this.props.node.RootFolder.ChildCount) return;

		this.props.expandDirectory(this.props.node.RootFolder);
	},
	render: function() {
		var nodes;
		if (this.props.node.RootFolder && this.props.node.RootFolder.childNodes) {
			nodes = this.props.node.RootFolder.childNodes.map(function(node) {
				return <li><TreeNode node={node} expandDirectory={this.props.expandDirectory} /></li>
			},this);
		}
    	var style = {};
    	if (!this.props.node.RootFolder.exapnded) {
      		style.display = "none";
    	}		
		return (
      		<div>
        		<h5 onClick={this.handleExpand}>{this.props.node.VolumeLabel} ({this.props.node.Name})</h5>
        		<ul style={style}>
          			{nodes}
       			</ul>
      		</div>
    	);
	}
})

var TreeNode = React.createClass({
	handleExpand: function() {
		if (!this.props.node.ChildCount) return;

		this.props.expandDirectory(this.props.node);
	},
	render: function() {
		var nodes;
		if (this.props.node.childNodes) {
			nodes = this.props.childNodes.map(function(node) {
				return <li><TreeNode node={node} expandDirectory={this.props.expandDirectory} /></li>
			},this);
		}
    	var style = {};
    	if (!this.props.node.exapnded) {
      		style.display = "none";
    	}		
		return (
      		<div>
        		<h5 onClick={this.handleExpand} title={this.props.node.FullPath}>{this.props.node.Name}</h5>
        		<ul style={style}>
          			{nodes}
       			</ul>
      		</div>
    	);
	}	
});

React.renderComponent(
  <Root />,
  document.getElementById('main')
);