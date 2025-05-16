import React, { useState } from 'react';
import Papa from 'papaparse';

export default function PertApp() {
  const [tasks, setTasks] = useState([{ id: 1, name: '', optimistic: '', mostLikely: '', pessimistic: '' }]);
  const [importedTasks, setImportedTasks] = useState([]);
  const [showImported, setShowImported] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);

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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Process the parsed data
          const parsedTasks = results.data
            .filter(item => item.ID && item.Title) // Filter out rows without ID or Title
            .map(item => ({
              id: item.ID,
              workItemType: item["Work Item Type"],
              title: item.Title,
              assignedTo: item["Assigned To"]?.split('<')[0]?.trim() || 'Unassigned',
              state: item.State || 'Unknown',
              tags: item.Tags || ''
            }));
          setImportedTasks(parsedTasks);
          setShowImported(true);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          alert('Error parsing CSV file. Please check the format and try again.');
        }
      });
    }
  };

  const toggleTaskSelection = (taskId) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const addSelectedTasksToPert = () => {
    const tasksToAdd = importedTasks
      .filter(task => selectedTasks.includes(task.id))
      .map(task => ({
        id: Date.now() + parseInt(task.id),
        name: task.title,
        optimistic: '',
        mostLikely: '',
        pessimistic: '',
        originalId: task.id
      }));
    
    setTasks([...tasks, ...tasksToAdd]);
    setSelectedTasks([]);
    setShowImported(false);
  };

  const filteredTasks = importedTasks.filter(task => 
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.workItemType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.tags.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // New export function
  const exportTasks = () => {
    // Prepare data for export
    const exportData = tasks.map(task => {
      const { expected, stdDev } = calculateEstimates(task);
      return {
        'Task ID': task.originalId || task.id,
        'Task Name': task.name,
        'Optimistic (Hours)': task.optimistic,
        'Most Likely (Hours)': task.mostLikely,
        'Pessimistic (Hours)': task.pessimistic,
        'Expected Duration (Hours)': expected,
        'Standard Deviation': stdDev
      };
    });

    // Generate CSV content
    const csv = Papa.unparse(exportData);
    
    // Create a Blob and download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Set link properties
    link.setAttribute('href', url);
    link.setAttribute('download', `pert_estimation_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    // Add to document, click and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-700">PERT Estimator</h1>
      
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={addTask}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Task Manually
        </button>
        
        <div className="relative">
          <input
            type="file"
            id="csvFileInput"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Import from CSV
          </button>
        </div>

        <button
          onClick={exportTasks}
          disabled={tasks.length === 0 || !tasks.some(t => t.name)}
          className={`px-4 py-2 rounded ${
            tasks.length > 0 && tasks.some(t => t.name)
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Export to CSV
        </button>
      </div>
      
      {showImported && (
        <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Imported Tasks ({importedTasks.length})</h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="p-2 border rounded"
              />
              <button
                onClick={() => setShowImported(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left"></th>
                  <th className="px-4 py-2 text-left">ID</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Assigned To</th>
                  <th className="px-4 py-2 text-left">State</th>
                  <th className="px-4 py-2 text-left">Tags</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-4 py-2">{task.id}</td>
                    <td className="px-4 py-2">{task.workItemType}</td>
                    <td className="px-4 py-2">{task.title}</td>
                    <td className="px-4 py-2">{task.assignedTo}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        task.state === 'New' ? 'bg-blue-100 text-blue-800' : 
                        task.state === 'Active' ? 'bg-green-100 text-green-800' :
                        task.state === 'Closed' ? 'bg-gray-100 text-gray-800' : 
                        task.state === 'En Desarrollo' ? 'bg-yellow-100 text-yellow-800' :
                        task.state === 'En Testing' ? 'bg-purple-100 text-purple-800' :
                        task.state === 'En Certficacion' ? 'bg-indigo-100 text-indigo-800' :
                        task.state === 'Certificado' ? 'bg-teal-100 text-teal-800' :
                        task.state === 'Backlog' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {task.state}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {task.tags && task.tags.split(';').map((tag, index) => (
                        <span key={index} className="mr-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {tag.trim()}
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={addSelectedTasksToPert}
              disabled={selectedTasks.length === 0}
              className={`px-4 py-2 rounded ${
                selectedTasks.length > 0 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add Selected Tasks ({selectedTasks.length})
            </button>
          </div>
        </div>
      )}
      
      <h2 className="text-xl font-semibold mb-4">PERT Estimation</h2>
      {tasks.length > 0 ? (
        <div>
          {tasks.map((task) => {
            const { expected, stdDev } = calculateEstimates(task);
            return (
              <div key={task.id} className="mb-6 border p-4 rounded shadow hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  {task.originalId && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      ID: {task.originalId}
                    </span>
                  )}
                  <input
                    type="text"
                    placeholder="Task Name"
                    value={task.name}
                    onChange={(e) => handleChange(task.id, 'name', e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Optimistic (O)</label>
                    <input
                      type="number"
                      placeholder="Hours"
                      value={task.optimistic}
                      onChange={(e) => handleChange(task.id, 'optimistic', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Most Likely (M)</label>
                    <input
                      type="number"
                      placeholder="Hours"
                      value={task.mostLikely}
                      onChange={(e) => handleChange(task.id, 'mostLikely', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pessimistic (P)</label>
                    <input
                      type="number"
                      placeholder="Hours"
                      value={task.pessimistic}
                      onChange={(e) => handleChange(task.id, 'pessimistic', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-sm font-medium text-gray-700">Results:</p>
                    <div className="mt-1">
                      <p><strong>Expected (E):</strong> {expected} hours</p>
                      <p><strong>Std Dev (σ):</strong> {stdDev}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Project Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Total Tasks:</strong> {tasks.length}</p>
                <p>
                  <strong>Total Expected Time:</strong>{' '}
                  {tasks.reduce((sum, task) => {
                    const { expected } = calculateEstimates(task);
                    return sum + (expected !== '-' ? parseFloat(expected) : 0);
                  }, 0).toFixed(2)} hours
                </p>
              </div>
              <div>
                <p>
                  <strong>Project Variance:</strong>{' '}
                  {tasks.reduce((sum, task) => {
                    const { stdDev } = calculateEstimates(task);
                    return sum + (stdDev !== '-' ? Math.pow(parseFloat(stdDev), 2) : 0);
                  }, 0).toFixed(2)}
                </p>
                <p>
                  <strong>Project Std Deviation:</strong>{' '}
                  {Math.sqrt(tasks.reduce((sum, task) => {
                    const { stdDev } = calculateEstimates(task);
                    return sum + (stdDev !== '-' ? Math.pow(parseFloat(stdDev), 2) : 0);
                  }, 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 italic">No tasks added yet. Add a task manually or import from CSV.</p>
      )}
    </div>
  );
}
