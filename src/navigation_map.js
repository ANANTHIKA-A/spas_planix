import { initApp, getTasks, getCurrentUser, API_BASE_URL } from './shared.js';

initApp();

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('network-container');
    if (!container) return;

    try {
        const user = getCurrentUser();
        
        // 1. Fetch pending tasks from our local module logic
        const tasks = await getTasks();
        const pendingTasks = tasks.filter(t => t.status === 'pending');

        if (pendingTasks.length === 0) {
            container.innerHTML = `<div style="display:flex; height:100%; align-items:center; justify-content:center; color:var(--text-secondary);">No pending tasks to map.</div>`;
            return;
        }

        // 2. Fetch similarity clusters from our intelligence backend
        const res = await fetch(`${API_BASE_URL}/api/intelligence/similarity?userId=${user}`);
        let similarityData = null;
        if (res.ok) {
            similarityData = await res.json();
        }

        // Build nodes
        const nodes = new vis.DataSet(
            pendingTasks.map(t => {
                let color = '#8b5cf6'; // default medium/low
                if (t.priority === 'high') color = '#ef4444';
                if (t.difficulty === 'hard') color = '#f59e0b';
                
                return {
                    id: t.id,
                    label: t.title,
                    title: `Priority: ${t.priority} | Difficulty: ${t.difficulty}`,
                    color: {
                        background: color,
                        border: '#ffffff'
                    },
                    font: { color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#fff' : '#000' }
                };
            })
        );

        // Build edges based on similarity clustering
        const edgesArray = [];
        
        if (similarityData && similarityData.clusters) {
            similarityData.clusters.forEach(cluster => {
                for (let i = 0; i < cluster.length - 1; i++) {
                    for (let j = i + 1; j < cluster.length; j++) {
                        edgesArray.push({
                            from: cluster[i].id,
                            to: cluster[j].id,
                            color: { color: 'rgba(139, 92, 246, 0.5)' },
                            width: 2,
                            dashes: true,
                            label: 'similar'
                        });
                    }
                }
            });
        }

        // Also add timeline dependency edges (heuristic: older deadlines link to newer ones)
        pendingTasks.sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
        for(let i=0; i<pendingTasks.length - 1; i++) {
             edgesArray.push({
                 from: pendingTasks[i].id,
                 to: pendingTasks[i+1].id,
                 arrows: 'to',
                 color: { color: 'rgba(59, 130, 246, 0.3)' },
                 width: 1
             });
        }

        const edges = new vis.DataSet(edgesArray);

        const data = { nodes, edges };
        const options = {
            nodes: {
                shape: 'dot',
                size: 16,
                font: {
                    size: 14,
                    face: 'Inter'
                },
                borderWidth: 2
            },
            layout: {
                hierarchical: {
                    direction: 'UD', // Up-Down layout
                    sortMethod: 'directed', // Chronological sorting
                    levelSeparation: 120,
                    nodeSpacing: 250
                }
            },
            physics: {
                enabled: false // Disable the chaotic bouncing
            }
        };

        new vis.Network(container, data, options);

    } catch (err) {
        console.error(err);
        container.innerHTML = `<div style="display:flex; height:100%; align-items:center; justify-content:center; color:var(--danger-color);">Failed to load network graph.</div>`;
    }
});
