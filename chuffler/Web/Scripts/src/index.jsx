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

var Root = React.createClass({
	getInitialState: function() {
		var self = this;

		var newState = {
			drives: [],
			directories: {},
			favourites: []
		};

		var savedState = localStorage.getItem('savedState') ;
		console.log('savedState is a thing',savedState);
		if (savedState) {
			console.log('savedState',savedState);
			if (typeof savedState === 'string') {
				console.log('unparsing savedState');
				savedState = JSON.parse(savedState);
			}
			console.log('done with savedState, should be an object now', savedState);
			if (savedState && savedState.favourites) {
				newState.favourites = savedState.favourites;
				console.log('have set new state favourites', newState);

			}
		}

		//first up, load the drives
		DataApi.getDrives()
		.then( function(data) {
			for (var i = 0, len = data.length; i<len; i++) {
				var drive = data[i];
				newState.drives.push(drive);
				newState.directories[drive.RootFolder.FullPath] = drive.RootFolder;
			}
			var deferred = Q.defer();
			self.setState(newState, function() {
				deferred.resolve();
			})
			return deferred.promise;
		})
		//once the drives are loaded and tucked away in state, get the faves
		.then(function() {
			//have to have this out in a funny function instead of in line in a loop
			//so that we get proper closure action happening
			var loadOneFave = function(fave) {
				DataApi.getSingleFolder(fave.FullPath).then( function(data) {
					fave.Name = data.Name;
					fave.ChildCount = data.ChildCount;
					fave.loading = false;
					self.setState(newState);
					//TODO load the kiddies first as well? Or should the server return the kiddies?
					//I'm thinking no, add it, then load the kiddies, makes for a better UI
					//I'm also thinking this is a crapton of async work, look at how we can use q to queue up operations to do one by one
					//load drives, then load each single fave folder, then load kiddies for each single fave folder
					//one smooth run through
				});
			};

			console.log('about to foreach through this bitch', newState);

			newState.favourites.forEach(loadOneFave); //f

		});

		return newState;
	},
	toggleFavourite: function(folder) {
  		var self = this;
  		console.log('should be toggling fave for ', folder);

  		var newState = self.state;
  		var theState = localStorage.getItem('savedState');
  		if (theState) {
  			theState = JSON.parse(theState);

	  		if (theState.favourites) {
	  			var foundIt = -1;
  				for(var i = 0, len = theState.favourites.length; i<len; i++) {
  					var thisFav = theState.favourites[i];
  					if (thisFav.FullPath ==  folder.FullPath) {
  						foundIt = i;
  						break;
  					}
  				}	
  				if (foundIt == -1) {
  					//didn't found it. Add a copy of it
  					//TODO use some extend library for this
  					theState.favourites.push({FullPath: folder.FullPath, Name:folder.Name, ChildCount: folder.ChildCount, loading:false, expanded:false});
  				} else {
  					//found it. Remove it
  					theState.favourites.splice(i,1);
  				}
	  		}
	  	}
  		if (!theState || !theState.favourites){
  			theState = {favourites: [folder]};
  		}

		localStorage.setItem("savedState", JSON.stringify(theState));
		newState.favourites = theState.favourites;
		self.setState(newState);

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
  render: function() {

  	var faves = this.state.favourites.map(function(fave) {
  		return <div className="folder-group">
  		 			<TreeNode node={fave} expandDirectory={this.expandDirectory} onToggleFavourite={this.toggleFavourite} />
	    		</div>;
  	},this)

    return (
    	<div>
    		<div className="toolbar"></div>
	    	<div className="container-folders">
	    		<Drives drives={this.state.drives} expandDirectory={this.expandDirectory} onToggleFavourite={this.toggleFavourite} />
	    		{faves}    		
			</div>
		</div>
    );
  }
});

var Drives = React.createClass({
	render: function() {
	  	var drives = this.props.drives.map(function(drive){
	  		return <Drive node={drive} expandDirectory={this.props.expandDirectory} onToggleFavourite={this.props.onToggleFavourite} />;
	  	},this);

		return (
    		<div className="folder-group">
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
				return <li><TreeNode node={node} expandDirectory={this.props.expandDirectory} onToggleFavourite={this.props.onToggleFavourite} /></li>
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
      		<div className={this.props.node.RootFolder.expanded ? 'node expanded' : 'node collapsed'}>
        		<h5 onClick={this.handleExpand}>
        			<i className={iconClass} /> {this.props.node.VolumeLabel} ({this.props.node.Name})
    			</h5>
        		<ul>
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
	handleFaveClick: function(e) {
		e.preventDefault();
		e.stopPropagation();
		this.props.onToggleFavourite(this.props.node);
	},
	render: function() {
		var nodes;
		if (this.props.node.childNodes) {
			nodes = this.props.node.childNodes.map(function(node) {
				return <li><TreeNode node={node} expandDirectory={this.props.expandDirectory} onToggleFavourite={this.props.onToggleFavourite} /></li>
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
      		<div className={this.props.node.expanded ? 'node expanded' : 'node collapsed'}>
        		<h5 onClick={this.handleExpand} title={this.props.node.FullPath}>
        			<i className={iconClass} /> {this.props.node.Name} <i className="fa fa-heart toggle-fave" onClick={this.handleFaveClick} />
        		</h5>
        		<ul>
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