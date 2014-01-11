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

var Root = React.createClass({
	getInitialState: function() {
		return {
			tree:faketree
		};
	},
  render: function() {
    return (
      <TreeNode node={this.state.tree} />
    );
  }
});

var TreeNode = React.createClass({
  getInitialState: function() {
    return {
      visible: true
    };
  },
  render: function() {
    var childNodes;
    if (this.props.node.childNodes != null) {
      childNodes = this.props.node.childNodes.map(function(node) {
        return <li><TreeNode node={node} /></li>
      },this);
    }

    var style = {};
    if (!this.state.visible) {
      style.display = "none";
    }

    return (
      <div>
        <h5 onClick={this.toggle}>
          {this.props.node.title}
        </h5>
        <ul style={style}>
          {childNodes}
        </ul>
      </div>
    );
  },
  toggle: function() {
    this.setState({visible: !this.state.visible});
  }
});

React.renderComponent(
  <Root />,
  document.getElementById('main')
);