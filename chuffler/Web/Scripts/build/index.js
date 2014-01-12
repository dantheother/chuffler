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
	}
};

var Root = React.createClass({displayName: 'Root',
	getInitialState: function() {
		var self = this;
		DataApi.getDrives().then( function(data) {
			var newState = self.state;
			newState.computer.childNodes = data.map(function(drive) {
				return {title: drive.VolumeLabel + ' (' + drive.Name + ')'}
			});
			self.setState(newState);
		});

		return {
			computer: { 
				title:'computer',
				childNodes:[]
			}
		};
	},
  render: function() {
    return (
      TreeNode( {node:this.state.computer} )
    );
  }
});

var TreeNode = React.createClass({displayName: 'TreeNode',
  getInitialState: function() {
    return {
      visible: true
    };
  },
  render: function() {
    var childNodes;
    if (this.props.node.childNodes != null) {
      childNodes = this.props.node.childNodes.map(function(node) {
        return React.DOM.li(null, TreeNode( {node:node} ))
      },this);
    }

    var style = {};
    if (!this.state.visible) {
      style.display = "none";
    }

    return (
      React.DOM.div(null, 
        React.DOM.h5( {onClick:this.toggle}, 
          this.props.node.title
        ),
        React.DOM.ul( {style:style}, 
          childNodes
        )
      )
    );
  },
  toggle: function() {
    this.setState({visible: !this.state.visible});
  }
});

React.renderComponent(
  Root(null ),
  document.getElementById('main')
);