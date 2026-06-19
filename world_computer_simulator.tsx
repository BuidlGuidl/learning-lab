import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, Cpu, Database, Activity, RefreshCw } from 'lucide-react';

export default function App() {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [particles, setParticles] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [globalBalance, setGlobalBalance] = useState(100);
  const [pendingTx, setPendingTx] = useState(false);
  const [consensusStatus, setConsensusStatus] = useState('Synchronized');
  const [stats, setStats] = useState({
    activeCount: 24,
    totalCount: 24,
    consensusPercentage: 100
  });

  // Track state in refs for the animation loop to avoid stale React closures
  const stateRef = useRef({
    nodes: [],
    particles: [],
    connections: []
  });

  // Initialize network nodes and connections
  useEffect(() => {
    const totalNodes = 24;
    const initialNodes = [];
    const width = 600;
    const height = 400;

    // Place nodes in a structured web layout
    for (let i = 0; i < totalNodes; i++) {
      // Golden spiral distribution for clean, organic node spacing
      const theta = i * 2.39996; 
      const r = Math.min(width, height) * 0.4 * Math.sqrt(i / totalNodes);
      initialNodes.push({
        id: i,
        x: width / 2 + r * Math.cos(theta),
        y: height / 2 + r * Math.sin(theta),
        status: 'active', // active, offline, corrupted
        balance: 100,
        localTxCount: 5,
        lastUpdated: Date.now()
      });
    }

    // Build connections: connect each node to its 3 nearest neighbors
    const initialConnections = [];
    for (let i = 0; i < initialNodes.length; i++) {
      const distances = initialNodes
        .map((target, idx) => ({
          idx,
          dist: Math.hypot(initialNodes[i].x - target.x, initialNodes[i].y - target.y)
        }))
        .filter(d => d.idx !== i)
        .sort((a, b) => a.dist - b.dist);

      // Connect to top 3 nearest
      for (let j = 0; j < 3; j++) {
        const targetId = distances[j].idx;
        // Avoid duplicate links
        if (!initialConnections.some(c => (c.from === i && c.to === targetId) || (c.from === targetId && c.to === i))) {
          initialConnections.push({ from: i, to: targetId });
        }
      }
    }

    setNodes(initialNodes);
    setSelectedNodeId(0);

    stateRef.current = {
      nodes: initialNodes,
      particles: [],
      connections: initialConnections
    };
  }, []);

  // Update statistics whenever node state changes
  useEffect(() => {
    if (nodes.length === 0) return;
    const active = nodes.filter(n => n.status === 'active').length;
    
    // Count the most common balance value among active nodes to find consensus
    const activeNodes = nodes.filter(n => n.status === 'active');
    if (activeNodes.length === 0) {
      setStats({ activeCount: 0, totalCount: nodes.length, consensusPercentage: 0 });
      setConsensusStatus('Offline');
      return;
    }

    const balances = activeNodes.map(n => n.balance);
    const balanceCounts = {};
    let maxCount = 0;
    let majorityBalance = 100;

    balances.forEach(b => {
      balanceCounts[b] = (balanceCounts[b] || 0) + 1;
      if (balanceCounts[b] > maxCount) {
        maxCount = balanceCounts[b];
        majorityBalance = b;
      }
    });

    const percentage = Math.round((maxCount / activeNodes.length) * 100);
    const hasCorrupted = nodes.some(n => n.status === 'corrupted');

    setStats({
      activeCount: active,
      totalCount: nodes.length,
      consensusPercentage: percentage
    });

    if (percentage === 100 && !hasCorrupted) {
      setConsensusStatus('Synchronized');
    } else if (hasCorrupted) {
      setConsensusStatus('State Mismatch Detected');
    } else {
      setConsensusStatus('Synchronizing');
    }
  }, [nodes]);

  // Main animation loop
  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const render = () => {
      // Clear canvas with a dark grid pattern
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const { nodes: currentNodes, connections, particles: currentParticles } = stateRef.current;

      // Draw connection lines
      ctx.lineWidth = 1.5;
      connections.forEach(conn => {
        const nodeA = currentNodes[conn.from];
        const nodeB = currentNodes[conn.to];
        if (!nodeA || !nodeB) return;

        // Dim connection if either node is offline
        if (nodeA.status === 'offline' || nodeB.status === 'offline') {
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)';
        } else {
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        }
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.stroke();
      });

      // Update and draw active transaction particles (Gossip protocol simulation)
      const nextParticles = [];
      currentParticles.forEach(p => {
        // Move particle towards target node
        const targetNode = currentNodes[p.targetId];
        if (!targetNode) return;

        const dx = targetNode.x - p.x;
        const dy = targetNode.y - p.y;
        const distance = Math.hypot(dx, dy);

        if (distance < 5) {
          // Particle arrived at target node
          if (targetNode.status === 'active') {
            // Apply updates locally on target node if it hasn't processed this transaction yet
            if (targetNode.balance !== p.newValue) {
              targetNode.balance = p.newValue;
              targetNode.localTxCount += 1;
              targetNode.lastUpdated = Date.now();

              // Gossip: Forward transaction to its own neighbors
              connections.forEach(conn => {
                let neighborId = null;
                if (conn.from === p.targetId) neighborId = conn.to;
                if (conn.to === p.targetId) neighborId = conn.from;

                if (neighborId !== null && neighborId !== p.sourceId) {
                  const neighborNode = currentNodes[neighborId];
                  if (neighborNode && neighborNode.status === 'active' && neighborNode.balance !== p.newValue) {
                    nextParticles.push({
                      x: targetNode.x,
                      y: targetNode.y,
                      sourceId: p.targetId,
                      targetId: neighborId,
                      newValue: p.newValue,
                      speed: 4
                    });
                  }
                }
              });
            }
          }
        } else {
          // Continue moving along path
          const vx = (dx / distance) * p.speed;
          const vy = (dy / distance) * p.speed;
          p.x += vx;
          p.y += vy;

          // Draw neon glowing particle
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#10b981';
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow

          nextParticles.push(p);
        }
      });
      stateRef.current.particles = nextParticles;

      // Draw nodes
      currentNodes.forEach(node => {
        // Node selection ring
        if (node.id === selectedNodeId) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Color coding depending on status
        let nodeColor = '#38bdf8'; // Active cyan
        let glowColor = 'rgba(56, 189, 248, 0.4)';

        if (node.status === 'offline') {
          nodeColor = '#475569'; // Offline gray
          glowColor = 'rgba(71, 85, 105, 0)';
        } else if (node.status === 'corrupted') {
          nodeColor = '#f43f5e'; // Corrupted red
          glowColor = 'rgba(244, 63, 94, 0.6)';
        }

        // Active node glow
        if (node.status !== 'offline') {
          ctx.shadowBlur = 12;
          ctx.shadowColor = nodeColor;
        }

        // Outer node circle
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Inner node core
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update state triggers React re-render of panel data periodically
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedNodeId]);

  // Handle canvas clicks to select or interact with individual nodes
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const { nodes: currentNodes } = stateRef.current;
    
    // Find closest node within radius limit
    let closestNode = null;
    let minDistance = 20; // Tap target boundary radius

    currentNodes.forEach(node => {
      const dist = Math.hypot(node.x - clickX, node.y - clickY);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    });

    if (closestNode !== null) {
      setSelectedNodeId(closestNode.id);
    }
  };

  // Broadcasts state changes through gossip network
  const broadcastTransaction = () => {
    if (pendingTx) return;
    setPendingTx(true);

    const nextBalance = globalBalance + 10;
    setGlobalBalance(nextBalance);

    // Pick an active initiator node
    const activeNodes = nodes.filter(n => n.status === 'active');
    if (activeNodes.length === 0) {
      setPendingTx(false);
      return;
    }
    const initiator = activeNodes[Math.floor(Math.random() * activeNodes.length)];

    // Seed state change locally on initiator node
    const { nodes: currentNodes, connections } = stateRef.current;
    currentNodes[initiator.id].balance = nextBalance;
    currentNodes[initiator.id].localTxCount += 1;
    currentNodes[initiator.id].lastUpdated = Date.now();

    // Spawn outbound transaction particles to its neighbors
    const initialParticles = [];
    connections.forEach(conn => {
      let targetId = null;
      if (conn.from === initiator.id) targetId = conn.to;
      if (conn.to === initiator.id) targetId = conn.from;

      if (targetId !== null) {
        const targetNode = currentNodes[targetId];
        if (targetNode && targetNode.status === 'active') {
          initialParticles.push({
            x: initiator.x,
            y: initiator.y,
            sourceId: initiator.id,
            targetId: targetId,
            newValue: nextBalance,
            speed: 4
          });
        }
      }
    });

    stateRef.current.particles = initialParticles;
    setNodes([...currentNodes]);

    // Transaction propagation cooldown
    setTimeout(() => {
      setPendingTx(false);
    }, 1500);
  };

  // Toggles physical offline state of target node
  const toggleNodeStatus = (nodeId) => {
    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        const nextStatus = n.status === 'active' ? 'offline' : 'active';
        return { ...n, status: nextStatus };
      }
      return n;
    });

    stateRef.current.nodes = updatedNodes;
    setNodes(updatedNodes);
  };

  // Simulates unauthorized override of a node's balance (attack vector)
  const corruptNode = (nodeId) => {
    const updatedNodes = nodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, status: 'corrupted', balance: 999 }; // State split
      }
      return n;
    });

    stateRef.current.nodes = updatedNodes;
    setNodes(updatedNodes);
  };

  // Network Consensus mechanism overwrites mismatched state
  const repairNetwork = () => {
    // Gather majority consensus balance from active nodes
    const activeNodes = nodes.filter(n => n.status === 'active');
    if (activeNodes.length === 0) return;

    const balances = activeNodes.map(n => n.balance);
    const balanceCounts = {};
    let majorityBalance = 100;
    let maxCount = 0;

    balances.forEach(b => {
      balanceCounts[b] = (balanceCounts[b] || 0) + 1;
      if (balanceCounts[b] > maxCount) {
        maxCount = balanceCounts[b];
        majorityBalance = b;
      }
    });

    // Repair all corrupted or out of sync nodes back to active majority state
    const repairedNodes = nodes.map(n => {
      if (n.status === 'corrupted' || n.balance !== majorityBalance) {
        return {
          ...n,
          status: 'active',
          balance: majorityBalance,
          lastUpdated: Date.now()
        };
      }
      return n;
    });

    stateRef.current.nodes = repairedNodes;
    setNodes(repairedNodes);
  };

  // Bring all offline nodes back online
  const resetAllNodes = () => {
    const defaultBalance = 100;
    setGlobalBalance(defaultBalance);
    
    const resetNodes = nodes.map(n => ({
      ...n,
      status: 'active',
      balance: defaultBalance,
      lastUpdated: Date.now()
    }));

    stateRef.current.nodes = resetNodes;
    stateRef.current.particles = [];
    setNodes(resetNodes);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl font-sans text-slate-200 my-8">
      
      {/* Simulation Workspace Canvas */}
      <div className="relative flex-1 p-6 flex flex-col justify-between border-r border-slate-800">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/40 border border-cyan-800 px-2.5 py-1 rounded-md">
                Interactive Concept Asset
              </span>
              <h2 className="text-2xl font-bold mt-2">The World Computer</h2>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={resetAllNodes}
                className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-lg transition"
                title="Reset Network"
              >
                <RotateCcw size={16} className="text-slate-400" />
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            Every node in this peer-to-peer network runs the exact same execution model. 
            Click on any node in the grid to inspect it, take it offline, or modify its balance history to see how decentralized consensus handles state errors.
          </p>
        </div>

        {/* Dynamic Interactive Node Mesh */}
        <div className="relative border border-slate-900 rounded-xl overflow-hidden bg-[#0a0f1d] flex justify-center items-center">
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            onClick={handleCanvasClick}
            className="cursor-crosshair w-full max-w-[600px] h-auto aspect-[3/2]"
          />
          
          {/* Overlay Status Bar */}
          <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-lg flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="font-semibold text-slate-300">Consensus Rate: {stats.consensusPercentage}%</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="text-slate-400">
              Active: {stats.activeCount}/{stats.totalCount} Nodes
            </div>
          </div>
        </div>

        {/* Live Controller Commands */}
        <div className="flex flex-wrap gap-3 mt-4">
          <button
            onClick={broadcastTransaction}
            disabled={pendingTx || stats.activeCount === 0}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition ${
              pendingTx || stats.activeCount === 0
                ? 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 border border-emerald-500 hover:border-emerald-400'
            }`}
          >
            <Play size={16} className={pendingTx ? 'animate-spin' : ''} />
            Broadcast Transaction (+10 ETH)
          </button>

          <button
            onClick={repairNetwork}
            disabled={stats.consensusPercentage === 100 && !nodes.some(n => n.status === 'corrupted')}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold transition ${
              stats.consensusPercentage === 100 && !nodes.some(n => n.status === 'corrupted')
                ? 'bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed'
                : 'bg-cyan-600 text-white hover:bg-cyan-500 border border-cyan-500 hover:border-cyan-400'
            }`}
          >
            <ShieldCheck size={16} />
            Run Consensus Repair
          </button>
        </div>
      </div>

      {/* Network Ledger Inspector Sidebar */}
      <div className="w-full lg:w-80 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-2">
            <Activity size={14} className="text-cyan-400" /> Network Inspector
          </h3>

          {/* Network Health Indicators */}
          <div className="space-y-3 mb-6">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Network State Status</span>
              <span className={`text-sm font-semibold block mt-1 ${
                consensusStatus === 'Synchronized' ? 'text-emerald-400' : 
                consensusStatus === 'State Mismatch Detected' ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {consensusStatus}
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Global State Balance</span>
              <span className="text-lg font-mono font-bold text-slate-200 mt-1 block">
                {globalBalance} ETH
              </span>
            </div>
          </div>

          {/* Individual Inspected Node panel */}
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu size={14} className="text-cyan-400" /> Node {selectedNode.id} Configuration
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  selectedNode.status === 'active' ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-400' :
                  selectedNode.status === 'offline' ? 'bg-slate-950 border border-slate-800 text-slate-400' :
                  'bg-rose-950/60 border border-rose-800 text-rose-400 animate-pulse'
                }`}>
                  {selectedNode.status}
                </span>
              </div>

              {/* Inspected Node Stats */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Local Ledger:</span>
                  <span className={`font-semibold ${selectedNode.status === 'corrupted' ? 'text-rose-400' : 'text-slate-300'}`}>
                    {selectedNode.balance} ETH
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-2">
                  <span className="text-slate-500">Block Height:</span>
                  <span className="text-slate-300">{selectedNode.localTxCount} Blocks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Node Latency:</span>
                  <span className="text-emerald-400">~12ms</span>
                </div>
              </div>

              {/* Individual Node Attack Vectors */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => toggleNodeStatus(selectedNode.id)}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold border transition ${
                    selectedNode.status === 'offline'
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900 hover:bg-emerald-950/70'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  {selectedNode.status === 'offline' ? 'Re-connect Node to Network' : 'Disconnect / Drop Node'}
                </button>

                <button
                  onClick={() => corruptNode(selectedNode.id)}
                  disabled={selectedNode.status === 'offline' || selectedNode.status === 'corrupted'}
                  className={`w-full py-2.5 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                    selectedNode.status === 'offline' || selectedNode.status === 'corrupted'
                      ? 'bg-slate-950 text-slate-600 border-slate-950 cursor-not-allowed'
                      : 'bg-rose-950/20 text-rose-400 border-rose-900/50 hover:bg-rose-950/40'
                  }`}
                >
                  <AlertTriangle size={12} />
                  Inject Mismatched State
                </button>
              </div>
            </div>
          ) : (
            <div className="h-48 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-center p-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                No active node selected. Tap a node coordinate on the left workspace to inspect local ledger values and isolate variables.
              </p>
            </div>
          )}
        </div>

        {/* Live Terminal Ledger Stream */}
        <div className="mt-6 pt-4 border-t border-slate-850">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Live Consensus Logs</span>
            <RefreshCw size={10} className="text-slate-500 animate-spin" />
          </div>
          <div className="bg-slate-950 rounded-lg p-3 font-mono text-[10px] text-slate-400 h-24 overflow-y-auto space-y-1.5 border border-slate-900">
            <div>&gt; EVM Booted successfully.</div>
            <div>&gt; Mesh topology established with 24 peer-to-peer pathways.</div>
            {nodes.some(n => n.status === 'corrupted') && (
              <div className="text-rose-400 font-semibold">&gt; State deviation detected on node {nodes.find(n => n.status === 'corrupted')?.id}!</div>
            )}
            {stats.consensusPercentage < 100 && stats.consensusPercentage > 0 && (
              <div className="text-amber-400 font-semibold">&gt; Re-aligning consensus matrix: {stats.consensusPercentage}% node agreement.</div>
            )}
            {stats.consensusPercentage === 100 && (
              <div className="text-emerald-500">&gt; Consensus stabilized. All nodes run identical bytecode.</div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}