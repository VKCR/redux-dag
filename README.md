# Redux DAG

![Directed Acyclic Graph][dag]

## Description

Redux DAG allows you to model and enforce dependencies between different values of your Redux state, such that updating one of those values automatically updates all other values which depend on it.

Each value is stored in a node. Nodes can depend on other nodes' values, thus forming a dependency graph, which by construction is a DAG. Each node must specify an update function which takes as input the values of the nodes it depends upon, and returns a value, which becomes that node's value. The use of an arbitrary update function allows for modelling complex relationships.

Then, when a value's node is updated, it triggers a cascade of updates, first in the nodes which immediately depend on it, then on the nodes which depend on those previous nodes, so on and so forth, until the update is fully propagated and all values are in a consistent state.

<!-- ## Installation -->

<!-- Install it from npm -->

<!-- Alternatively, clone this repository. -->

## Usage

The basic data type of Redux DAG is the node, which is an object with four properties:
* **id**: a unique ID identifying the node
* **deps**: the list of the node's dependencies
* **updateFunction**: the node's update function. Takes as argument the values of all the node's dependencies, and returns the node's value.
* **desc**: the list of the node's descendants

The first three properties are to be provided when creating the node. The last property - the node's list of descendants, is automatically calculated, and is used when propagating value updates in the graph.

In order to use Redux DAG, simply add **dagReducer** to your Redux store's reducers.

The DAG state consists of three properties:
* **nodeIds** : list of all node IDs
* **nodeByIds** : map of node IDs to node objects
* **valueByIds** : map of node IDs to node values

Typically, one would, in a React componente, use a selector to query **valueByIds** for the value of a specific node.

In order to interact with the Redux DAG store, there are three actions:
* **DagAddNodeAction**: adds a node to the dependency graph
* **DagDeleteNodeAction**: deletes a node from the dependency graph. The node must not have any descendants.
* **DagUpdateNodeAction**: updates a node's update function (not its dependencies, which are immutable)

Thus, in a typical use case, one would create the required dependency graph by repeatedly dispatching **DagAddNodeAction**, and would then dispatch **DagUpdateNodeAction** as required by the application.

A simple demo can be run when cloning this repository: a UI allows you to add, delete, and update nodes, specifying their dependencies, with the "sum" update function (a node's value is the sum of its value and of the values of all its dependencies).

## TODO:

* Right now, the node update functions are stored in the Redux state, which breaks the rule of not putting non-serializable objects into the Redux store. Find a workaround.

## Contribute

Feel free to report bugs using the GitHub issue tracker and make other contributions.

## License

This project is licensed under GPL-3.0

[dag]: dag.png "Directed Acyclic Graph"
