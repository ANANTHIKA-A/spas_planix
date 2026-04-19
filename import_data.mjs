

async function seed() {
    const userId = 'admin'; // We will seed the admin profile
    try {
        console.log('Seeding data for user:', userId);
        
        // Setup Account Structure
        await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: userId, password: 'password123' })
        });
        
        // Level up the user artificially to test badges
        await fetch(`http://localhost:5000/api/auth/${userId}/xp`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xpToAdd: 650, dateStr: new Date().toISOString() })
        });

        const now = new Date();
        const tomorrow = new Date(now.getTime() + 10*60*60*1000); // 10 hours from now
        const nextWeek = new Date(now.getTime() + 7*24*60*60*1000);
        
        const tasks = [
            // Q1: Urgent + Important
            { id: 'import1', title: 'Critical Server Patch', description: 'Urgent zero-day exploit fix', priority: 'high', difficulty: 'hard', deadline: tomorrow.toISOString(), createdAt: now.toISOString(), status: 'pending', impactScore: 90 },
            { id: 'import2', title: 'Q3 Board Deck', description: 'Due tmrw morning!', priority: 'high', difficulty: 'hard', deadline: tomorrow.toISOString(), createdAt: now.toISOString(), status: 'pending', impactScore: 85 },
            // Q2: Not Urgent + Important
            { id: 'import3', title: 'Architecture Refactor', description: 'Long-term plan', priority: 'high', difficulty: 'hard', deadline: nextWeek.toISOString(), createdAt: now.toISOString(), status: 'pending', impactScore: 70 },
            { id: 'import4', title: 'Hire Senior Engineer', description: 'Review resumes', priority: 'medium', difficulty: 'easy', deadline: nextWeek.toISOString(), createdAt: now.toISOString(), status: 'pending', impactScore: 75 },
            // Q3: Urgent + Not Important
            { id: 'import5', title: 'Approve Timesheets', description: 'Needs doing today', priority: 'low', difficulty: 'easy', deadline: tomorrow.toISOString(), createdAt: now.toISOString(), status: 'pending', impactScore: 20 },
            // Q4: Not Urgent + Not Important
            { id: 'import6', title: 'Review Old Tickets', description: 'Spring cleaning backlog', priority: 'low', difficulty: 'easy', deadline: nextWeek.toISOString(), createdAt: now.toISOString(), status: 'pending', impactScore: 10 },
            // Completed Tasks (For Efficiency Score & Predictors)
            { id: 'import7', title: 'Morning Standup', description: '', priority: 'medium', difficulty: 'easy', deadline: now.toISOString(), createdAt: now.toISOString(), completedAt: now.toISOString(), status: 'completed', impactScore: 30 },
            { id: 'import8', title: 'Deploy Hotfix v1.4', description: '', priority: 'high', difficulty: 'hard', deadline: now.toISOString(), createdAt: now.toISOString(), completedAt: now.toISOString(), status: 'completed', impactScore: 80 }
        ];

        let bulkRes = await fetch('http://localhost:5000/api/tasks/bulk?userId=' + userId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tasks)
        });
        
        console.log('Seed Complete. Status:', bulkRes.status);
    } catch(err) {
        console.error(err);
    }
}
seed();
