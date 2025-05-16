import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * PERT Estimator – lightweight web app for Agile user‑story sizing
 * ---------------------------------------------------------------
 * ►   Enter optimistic (O), most‑likely (M) & pessimistic (P) hours for each story.
 * ►   The app calculates expected duration E = (O + 4M + P) / 6 and σ = (P – O) / 6.
 * ►   A running total, project‑level σ, and 68 %/95 % confidence bands are displayed.
 *
 *   Tailwind & shadcn/ui provide the look‑and‑feel; Framer Motion animates adds.
 */
export default function PertApp() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    name: "",
    optimistic: "",
    likely: "",
    pessimistic: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const addTask = () => {
    const o = parseFloat(form.optimistic);
    const m = parseFloat(form.likely);
    const p = parseFloat(form.pessimistic);
    if (!form.name || [o, m, p].some((v) => isNaN(v) || v < 0)) return;

    const expected = (o + 4 * m + p) / 6;
    const sd = (p - o) / 6;

    setTasks((prev) => [
      ...prev,
      { ...form, optimistic: o, likely: m, pessimistic: p, expected, sd },
    ]);

    setForm({ name: "", optimistic: "", likely: "", pessimistic: "" });
  };

  const deleteTask = (index) =>
    setTasks((prev) => prev.filter((_, i) => i !== index));

  const totalExpected = tasks.reduce((sum, t) => sum + t.expected, 0);
  const totalVariance = tasks.reduce((sum, t) => sum + t.sd ** 2, 0);
  const totalSd = Math.sqrt(totalVariance);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex flex-col items-center p-6">
      <h1 className="text-4xl font-extrabold tracking-tight mb-6 text-indigo-700">
        PERT Estimator
      </h1>

      {/* Form */}
      <Card className="w-full max-w-xl mb-8 shadow-xl">
        <CardContent className="p-6">
          <div className="grid gap-4">
            <Input
              placeholder="User‑story title"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Optimistic (O)"
                name="optimistic"
                value={form.optimistic}
                onChange={handleChange}
                type="number"
                min={0}
                step="0.25"
              />
              <Input
                placeholder="Most Likely (M)"
                name="likely"
                value={form.likely}
                onChange={handleChange}
                type="number"
                min={0}
                step="0.25"
              />
              <Input
                placeholder="Pessimistic (P)"
                name="pessimistic"
                value={form.pessimistic}
                onChange={handleChange}
                type="number"
                min={0}
                step="0.25"
              />
            </div>
            <Button onClick={addTask} className="w-full text-lg py-6">
              ➕ Add story
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task list */}
      {tasks.length > 0 && (
        <Card className="w-full max-w-3xl shadow-lg">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-indigo-100 text-indigo-600">
                <tr>
                  <th className="py-3 px-4">Story</th>
                  <th className="py-3 px-4 text-center">O</th>
                  <th className="py-3 px-4 text-center">M</th>
                  <th className="py-3 px-4 text-center">P</th>
                  <th className="py-3 px-4 text-center">E[hrs]</th>
                  <th className="py-3 px-4 text-center">σ</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="odd:bg-white even:bg-gray-50 border-b"
                  >
                    <td className="py-2 px-4 whitespace-nowrap">{t.name}</td>
                    <td className="py-2 px-4 text-center">{t.optimistic}</td>
                    <td className="py-2 px-4 text-center">{t.likely}</td>
                    <td className="py-2 px-4 text-center">{t.pessimistic}</td>
                    <td className="py-2 px-4 text-center font-medium">
                      {t.expected.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 text-center">{t.sd.toFixed(2)}</td>
                    <td className="py-2 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(i)}
                        aria-label="Delete task"
                      >
                        🗑️
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="p-6 grid gap-1 text-right bg-indigo-50">
              <div className="text-lg font-semibold">
                Total Expected: {totalExpected.toFixed(2)} hrs
              </div>
              <div className="text-sm text-gray-700">
                σ(project): {totalSd.toFixed(2)} hrs
              </div>
              <div className="text-sm text-gray-700">
                68% CI: { (totalExpected - totalSd).toFixed(2) } – { (totalExpected + totalSd).toFixed(2) } hrs
              </div>
              <div className="text-sm text-gray-700">
                95% CI: { (totalExpected - 2 * totalSd).toFixed(2) } – { (totalExpected + 2 * totalSd).toFixed(2) } hrs
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
