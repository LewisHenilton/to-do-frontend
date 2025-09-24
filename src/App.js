import React, { useEffect, useState } from "react";

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; 
const API = (process.env.REACT_APP_API_URL || "http://localhost:5000").replace(/\/$/, "");


import axios from "axios";
import './App.css';


function App() {
  
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isRegistering, setIsRegistering] = useState(false);

  const [date, setDate] = useState(new Date());

  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(()=>{
    setSelectedTask(null);
  }, [date, token]);

  const getApi = () => {
  return axios.create({
    baseURL: API,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};


  const openNotes =(task) =>{
    setSelectedTask(task);
  };

  const saveNotes = (task) =>{
    getApi()
    .put(`/tasks/${task._id}`, { notes: task.notes})
    .then(res => {
      setTasks(tasks.map(t => (t._id === task._id ? res.data : t)));
      setSelectedTask(res.data);
    })
    .catch(err=> console.error("Erro ao salvar notas:", err));
  };
  
  const handleRegister = () => {
  if (!username || !password) return;

  axios
    .post(`${API}/register`, { username, password })
    .then(res => {
      // login automático após registro
      axios
        .post(`${API}/login`, { username, password })
        .then(loginRes => {
          const token = loginRes.data.token;
          setToken(token);
          localStorage.setItem("token", token);
          setUsername("");
          setPassword("");
          setIsRegistering(false);
        })
        .catch(err => console.error("Erro no login automático:", err));
    })
    .catch(err => console.error("Erro ao registrar usuário:", err));
};

  const handleLogin = () => {
  if (!username || !password) return;

  axios
    .post("http://localhost:5000/login", { username, password })
    .then(res => {
      const token = res.data.token;
      setToken(token);
      localStorage.setItem("token", token);
      setUsername("");
      setPassword("");
    })
    .catch(err => console.error("Erro ao fazer login:", err));
};

const handleLogout = () => {
  setToken("");
  localStorage.removeItem("token");
  setTasks([]);
};

  
  useEffect(() => {
    if (!token) return;

    const formattedDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

    getApi()
      .get(`/tasks?date=${formattedDate}`)
      .then(res => setTasks(res.data))
      .catch(err => console.error("Erro ao buscar tarefas:", err));
}, [token, date]);

  
const addTask = () => {
  if (!newTask) return;

  const formattedDate = date.toISOString().split("T")[0]; // "YYYY-MM-DD"

  getApi()
    .post("/tasks", { title: newTask, date: formattedDate })
    .then(res => {
      setTasks([...tasks, res.data]);
      setNewTask("");
    })
    .catch(err => console.error("Erro ao adicionar tarefa:", err));
};

  
  const toggleDone = (taskId, done) => {
  getApi()
    .put(`/tasks/${taskId}`, { done: !done })
    .then(res => setTasks(tasks.map(task => task._id === taskId ? res.data : task)))
    .catch(err => console.error("Erro ao atualizar tarefa:", err));
};

  
  const deleteTask = (taskId) => {
  getApi()
    .delete(`/tasks/${taskId}`)
    .then(() => setTasks(tasks.filter(task => task._id !== taskId)))
    .catch(err => console.error("Erro ao deletar tarefa:", err));
};

  
  const startEdit = (task) => {
  setEditingTaskId(task._id);
  setEditingText(task.title);
};

const saveEdit = (taskId) => {
  const formattedDate = date.toISOString().split("T")[0]; // manter no mesmo dia

  getApi()
    .put(`/tasks/${taskId}`, { title: editingText, date: formattedDate })
    .then(res => {
      setTasks(tasks.map(task => task._id === taskId ? res.data : task));
      setEditingTaskId(null);
      setEditingText("");
    })
    .catch(err => console.error("Erro ao editar tarefa:", err));
};

  
  return (
  <div className="app-container">
    {/* Sidebar com o calendário */}
    <div className="sidebar">
      <Calendar onChange={setDate} value={date} />
    </div>

    {/* Conteúdo principal */}
    <div className="main-content">
      <h1>What comes next?</h1>

      {!token ? (
        <div>
          {isRegistering ? (
            <>
              <input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} />
              <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <button onClick={handleRegister}>Registrar</button>
              <button onClick={() => setIsRegistering(false)}>Já tenho conta</button>
            </>
          ) : (
            <>
              <input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} />
              <input placeholder="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <button onClick={handleLogin}>Login</button>
              <button onClick={() => setIsRegistering(true)}>Registrar</button>
            </>
          )}
        </div>
      ) : (
        <div>
          <button onClick={handleLogout}>Logout</button>

          <input
            type="text"
            placeholder="Type a task baby..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
          />
          <button onClick={addTask}>Adicionar</button>

          <ul>
            {tasks.map(task => (
              <li key={task._id} style={{ textDecoration: task.done ? "line-through" : "none", cursor: "pointer" }}>
                {editingTaskId === task._id ? (
                  <>
                    <input value={editingText} onChange={e => setEditingText(e.target.value)} />
                    <button onClick={() => saveEdit(task._id)}>Salvar</button>
                    <button onClick={() => setEditingTaskId(null)}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <span onClick={() => toggleDone(task._id, task.done)}>
                      {task.title} - {task.done ? "✅" : "❌"}
                    </span>
                    <button onClick={() => startEdit(task)} style={{ marginLeft: "10px" }}>Editar</button>
                    <button onClick={() => openNotes(task)} style={{ marginLeft: "10px" }}>📝 Notas</button>
                  </>
                )}
                <button onClick={() => deleteTask(task._id)} style={{ marginLeft: "10px" }}>Deletar</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* Notepad fora da main-content */}
    {selectedTask && (
      <div className="notepad">
        <h2>Notas — {selectedTask.title}</h2>
        <textarea
          value={selectedTask.notes || ""}
          onChange={(e) => setSelectedTask({ ...selectedTask, notes: e.target.value })}
        />
        <div className="notepad-actions">
          <button onClick={() => saveNotes(selectedTask)}>Salvar</button>
          <button onClick={() => setSelectedTask(null)}>Fechar</button>
        </div>
      </div>
    )}
  </div>
);

}

export default App;
