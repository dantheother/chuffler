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

var Root = React.createClass({displayName: 'Root',
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
  	console.log('in expand folder for ', folder);
  	folder.expanded = !folder.exapnded;
  	if (folder.childNodes) {
  		//allready loaded it. Set state and get out of dodge
		var newState = self.state;
		newState.cachebuster = new Date();
		self.setState(newState);

  	} else {
  		//ask the server for the kiddies
  		DataApi.getFolders(folder.FullPath).then(function(data) {
  			var newState = self.state;
  			for (var i = 0, len = data.length; i<len; i++ ){
  				var thisFolder = data[i];
  				newState.directories[thisFolder.FullPath] = thisFolder;
  			}
			folder.childNodes = data;
			self.setState(newState);
  		});
  	}
  },
  render: function() {
  	var drives = this.state.drives.map(function(drive){
  		return Drive( {node:drive, expandDirectory:this.expandDirectory} )
  	},this);

    return (
    	React.DOM.div(null, 
    		drives
    	)
    );
  }
});

var Drive = React.createClass({displayName: 'Drive',
	handleExpand: function() {
		if (!this.props.node.RootFolder.ChildCount) return;

		this.props.expandDirectory(this.props.node.RootFolder);
	},
	render: function() {
		var nodes;
		if (this.props.node.RootFolder && this.props.node.RootFolder.childNodes) {
			nodes = this.props.node.RootFolder.childNodes.map(function(node) {
				return React.DOM.li(null, TreeNode( {node:node, expandDirectory:this.props.expandDirectory} ))
			},this);
		}	
		return (
      		React.DOM.div( {className:this.props.node.RootFolder.expanded ? 'node expanded' : 'node collapsed'}, 
        		React.DOM.h5( {onClick:this.handleExpand}, this.props.node.VolumeLabel, " (",this.props.node.Name,")"),
        		React.DOM.ul(null, 
          			nodes
       			)
      		)
    	);
	}
})

var TreeNode = React.createClass({displayName: 'TreeNode',
	handleExpand: function() {
		if (!this.props.node.ChildCount) return;

		this.props.expandDirectory(this.props.node);
	},
	render: function() {
		var nodes;
		if (this.props.node.childNodes) {
			nodes = this.props.node.childNodes.map(function(node) {
				return React.DOM.li(null, TreeNode( {node:node, expandDirectory:this.props.expandDirectory} ))
			},this);
		}		
		return (
      		React.DOM.div( {className:this.props.node.expanded ? 'node expanded' : 'node collapsed'}, 
        		React.DOM.h5( {onClick:this.handleExpand, title:this.props.node.FullPath}, this.props.node.Name),
        		React.DOM.ul(null, 
          			nodes
       			)
      		)
    	);
	}	
});

React.renderComponent(
  Root(null ),
  document.getElementById('main')
);