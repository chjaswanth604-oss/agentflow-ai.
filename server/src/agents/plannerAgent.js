/**
 * Planner Agent: Analyzes workflow nodes and edges to determine execution order
 * and emits an execution plan with confidence score.
 */
class PlannerAgent {
  async plan(workflow) {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];

    if (nodes.length === 0) {
      return {
        executionOrder: [],
        confidenceScore: 0.0,
        reasoning: 'Empty workflow, no nodes to execute.'
      };
    }

    // Build topological sort graph
    const inDegree = {};
    const adjList = {};

    nodes.forEach(n => {
      inDegree[n.id] = 0;
      adjList[n.id] = [];
    });

    edges.forEach(e => {
      if (adjList[e.source] && inDegree[e.target] !== undefined) {
        adjList[e.source].push(e.target);
        inDegree[e.target]++;
      }
    });

    const queue = [];
    Object.keys(inDegree).forEach(id => {
      if (inDegree[id] === 0) queue.push(id);
    });

    const executionOrder = [];
    while (queue.length > 0) {
      const curr = queue.shift();
      executionOrder.push(curr);
      (adjList[curr] || []).forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Handle cycles or disconnected nodes gracefully
    if (executionOrder.length < nodes.length) {
      nodes.forEach(n => {
        if (!executionOrder.includes(n.id)) {
          executionOrder.push(n.id);
        }
      });
    }

    const confidenceScore = executionOrder.length === nodes.length ? 0.98 : 0.75;

    return {
      executionOrder,
      confidenceScore,
      totalSteps: executionOrder.length,
      reasoning: `Planned sequential execution across ${executionOrder.length} node(s).`
    };
  }
}

module.exports = new PlannerAgent();
