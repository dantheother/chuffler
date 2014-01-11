/** @jsx React.DOM */

var faketree = {
  title: "howdy",
  childNodes: [
    {title: "bobby"},
    {title: "suzie", childNodes: [
      {title: "puppy", childNodes: [
        {title: "dog house"}
      ]},
      {title: "cherry tree"}
    ]}
  ]
};

var Root = React.createClass({displayName: 'Root',
	getInitialState: function() {
		return {
			tree:faketree
		};
	},
  render: function() {
    return (
      TreeNode( {node:this.state.tree} )
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