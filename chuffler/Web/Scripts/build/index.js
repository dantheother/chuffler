/** @jsx React.DOM */

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
	},
	getSingleFolder: function(path) {
		return new xhr({
			url:'api/folder/single?path='+path
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
			}
			self.setState(newState);
		});

		var savedState = localStorage.getItem('savedState') || JSON.stringify( {favourites : ['E:\\', 'C:\\Users']} );

		var favourites = [];

		if (savedState) {
			savedState = JSON.parse(savedState);
			if (savedState && savedState.favourites) {
				favourites = savedState.favourites.map(function(fave) {
					return {
						FullPath:fave,
						Name: fave,
						loading: true
					};
				});

				//have to have this out in a funny function instead of in line in a loop
				//so that we get proper closure action happening
				var loadOneFave = function(fave) {
					DataApi.getSingleFolder(fave.FullPath).then( function(data) {
						var newState = self.state
						fave.Name = data.Name;
						fave.ChildCount = data.ChildCount;
						fave.loading = false;
						self.setState(newState);
					})					
				}

				favourites.forEach(loadOneFave);

			}
		}

		return {
			drives: [],
			directories: {},
			favourites: favourites
		};
	},
  expandDirectory: function(folder) {
  	var self = this;
  	folder.expanded = !folder.expanded;

  	if (folder.childNodes && folder.childNodes.length) {
  		//allready loaded it. Set state and get out of dodge   
		self.setState(self.state);

  	} else {
  		folder.loading = true;

  		self.setState(self.state, function() {

	  		//ask the server for the kiddies
	  		DataApi.getFolders(folder.FullPath).then(function(data) {
	  			var newState = self.state;
	  			for (var i = 0, len = data.length; i<len; i++ ){
	  				var thisFolder = data[i];
	  				newState.directories[thisFolder.FullPath] = thisFolder;
	  			}
				folder.childNodes = data;
				folder.loading=false;
				self.setState(newState);
	  		});
  		});
  	}
  },
  toggleFavourite: function(folder) {
  	var self = this;
  },
  render: function() {
  	var drives = this.state.drives.map(function(drive){
  		return Drive( {node:drive, expandDirectory:this.expandDirectory} );
  	},this);

  	var faves = this.state.favourites.map(function(fave) {
  		return React.DOM.div( {className:"folder-group"}, 
  		 			TreeNode( {node:fave, expandDirectory:this.expandDirectory} )
	    		);
  	},this)

    return (
    	React.DOM.div(null, 
    		React.DOM.div( {className:"toolbar"}),
	    	React.DOM.div( {className:"container-folders"}, 
	    		React.DOM.div( {className:"folder-group"}, 
	    			drives
	    		),
	    		faves    		
			)
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
		var iconClass = "fa fa-fw ";	
		if (this.props.node.RootFolder.loading) {
			iconClass += "fa-spinner fa-spin";
		} else if (this.props.node.RootFolder.expanded) {
			iconClass += "fa-chevron-down";
		} else if (this.props.node.RootFolder.ChildCount) {
			iconClass += "fa-chevron-right"
		}

		return (
      		React.DOM.div( {className:this.props.node.RootFolder.expanded ? 'node expanded' : 'node collapsed'}, 
        		React.DOM.h5( {onClick:this.handleExpand}, 
        			React.DOM.i( {className:iconClass} ), this.props.node.VolumeLabel, " (",this.props.node.Name,") "
    			),
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

		var iconClass = "fa fa-fw ";	
		if (this.props.node.loading) {
			iconClass += "fa-spinner fa-spin";
		} else if (this.props.node.expanded) {
			iconClass += "fa-chevron-down";
		} else if (this.props.node.ChildCount) {
			iconClass += "fa-chevron-right"
		}

		return (
      		React.DOM.div( {className:this.props.node.expanded ? 'node expanded' : 'node collapsed'}, 
        		React.DOM.h5( {onClick:this.handleExpand, title:this.props.node.FullPath}, 
        			React.DOM.i( {className:iconClass} ), this.props.node.Name
        		),
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