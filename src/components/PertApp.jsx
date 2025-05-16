import React, { useState } from 'react';

export default function PertApp() {
  const [tasks, setTasks] = useState([{ id: 1, name: '', optimistic: '', mostLikely: '', pessimistic: '' }]);

  const handleChange = (id, field, value) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), name: '', optimistic: '', mostLikely: '', pessimistic: '' }]);
  };

  const calculateEstimates = (task) => {
    const o = parseFloat(task.optimistic);
    const m = parseFloat(task.mostLikely);
    const p = parseFloat(task.pessimistic);
    if (isNaN(o) || isNaN(m) || isNaN(p)) return { expected: '-', stdDev: '-' };
    const expected = ((o + 4 * m + p) / 6).toFixed(2);
    const stdDev = ((p - o) / 6).toFixed(2);
    return { expected, stdDev };
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PERT Estimator</h1>
      <button
        onClick={addTask}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Add Task
      </button>
      {tasks.map((task) => {
        const { expected, stdDev } = calculateEstimates(task);
        return (
          <div key={task.id} className="mb-6 border p-4 rounded shadow">
            <input
              type="text"
              placeholder="Task Name"
              value={task.name}
              onChange={(e) => handleChange(task.id, 'name', e.target.value)}
              className="w-full mb-2 p-2 border rounded"
            />
            <div className="grid grid-cols-4 gap-2">
              <input
                type="number"
                placeholder="Optimistic"
                value={task.optimistic}
                onChange={(e) => handleChange(task.id, 'optimistic', e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Most Likely"
                value={task.mostLikely}
                onChange={(e) => handleChange(task.id, 'mostLikely', e.target.value)}
                className="p-2 border rounded"
              />
              <input
                type="number"
                placeholder="Pessimistic"
                value={task.pessimistic}
                onChange={(e) => handleChange(task.id, 'pessimistic', e.target.value)}
                className="p-2 border rounded"
              />
              <div className="flex flex-col justify-center">
                <p><strong>Expected:</strong> {expected}</p>
                <p><strong>Std Dev:</strong> {stdDev}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
